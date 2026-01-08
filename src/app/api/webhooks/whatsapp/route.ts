// app/api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { FaturaService } from "@/lib/faturaService";

interface LancamentoTemporario {
  dados: DadosLancamento;
  categoriaEscolhida: any;
  userId: string;
  userPhone: string;
  timestamp: number;
  descricaoLimpa: string;
  cartaoEncontrado?: any;
  mensagemOriginal: string;
  descricaoOriginal: string;
}

declare global {
  var messageCache: Map<string, boolean> | undefined;
  var pendingLancamentos: Map<string, LancamentoTemporario> | undefined;
}

type DadosLancamento = {
  tipo: string;
  valor: string;
  descricao: string;
  metodoPagamento: string;
  data: string;
  ehCompartilhado?: boolean;
  nomeUsuarioCompartilhado?: string;
  ehParcelado?: boolean;
  parcelas?: number;
  tipoParcelamento?: string;
  categoriaSugerida?: string;
};

type ExtracaoSucesso = {
  sucesso: true;
  dados: DadosLancamento;
};

type ExtracaoErro = {
  sucesso: false;
  erro: string;
};

type ResultadoExtracao = ExtracaoSucesso | ExtracaoErro;

// Função para buscar categorias do usuário
async function getCategoriasUsuario(userId: string) {
  try {
    const categorias = await db.categoria.findMany({
      where: { userId },
      orderBy: { nome: "asc" },
    });
    return categorias;
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return [];
  }
}

async function getUserByPhone(userPhone: string) {
  try {
    console.log(`🔍 Buscando usuário para telefone: ${userPhone}`);

    const telefoneNormalizado = userPhone.replace(/\D/g, "");
    console.log(`🔧 Telefone normalizado: ${telefoneNormalizado}`);

    let telefoneBusca = telefoneNormalizado;

    if (
      telefoneNormalizado.startsWith("55") &&
      telefoneNormalizado.length === 13
    ) {
      telefoneBusca = telefoneNormalizado.substring(2);
      console.log(
        `🇧🇷 Removido DDI 55: ${telefoneNormalizado} → ${telefoneBusca}`
      );
    } else if (
      telefoneNormalizado.startsWith("55") &&
      telefoneNormalizado.length === 12
    ) {
      const ddd = telefoneNormalizado.substring(2, 4);
      const resto = telefoneNormalizado.substring(4);
      telefoneBusca = ddd + "9" + resto;
      console.log(`🇧🇷 Adicionado 9: ${telefoneNormalizado} → ${telefoneBusca}`);
    } else if (
      telefoneNormalizado.startsWith("85") &&
      telefoneNormalizado.length === 11
    ) {
      telefoneBusca = telefoneNormalizado;
    }

    console.log(`🎯 Telefone para busca: ${telefoneBusca}`);

    const variacoesTelefone = [
      telefoneBusca,
      `+55${telefoneBusca}`,
      `55${telefoneBusca}`,
      telefoneBusca.replace(/^55/, ""),
      telefoneBusca.substring(2),
    ].filter((tel, index, self) => tel && self.indexOf(tel) === index);

    console.log(`🎯 Variações a buscar:`, variacoesTelefone);

    // 🔥 BUSCAR USUÁRIO COM SUAS CONFIGURAÇÕES
    const usuario = await db.user.findFirst({
      where: {
        OR: variacoesTelefone.map((telefone) => ({ telefone })),
      },
      include: {
        configuracoesUsuarios: true, // 🔥 AGORA INCLUI CONFIGURAÇÕES
      },
    });

    if (usuario) {
      console.log(`✅ Usuário encontrado: ${usuario.name} (${usuario.id})`);
      console.log(`📞 Telefone no banco: ${usuario.telefone}`);

      // 🔥 OBTER IDIOMA DAS CONFIGURAÇÕES
      const idiomaPreferido = usuario.configuracoesUsuarios?.[0]?.idioma;
      console.log(`🌐 Idioma preferido do usuário: ${idiomaPreferido}`);

      return {
        user: {
          id: usuario.id,
          name: usuario.name,
        },
        idiomaPreferido: idiomaPreferido, // 🔥 RETORNAR IDIOMA
      };
    }

    console.log(`❌ Nenhum usuário encontrado para: ${userPhone}`);
    return null;
  } catch (error) {
    console.error("❌ Erro ao buscar usuário:", error);
    return null;
  }
}

// 🔥 NOVA FUNÇÃO: Transcrever áudio com OpenAI
async function transcreverAudioWhatsApp(audioId: string): Promise<string> {
  console.log(`🎙️ Iniciando transcrição do áudio ID: ${audioId}`);

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY não configurada");
  }

  try {
    // 1. Baixar o áudio do WhatsApp
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      throw new Error("Credenciais do WhatsApp não configuradas");
    }

    // Buscar URL do áudio
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${audioId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!mediaResponse.ok) {
      const errorData = await mediaResponse.text();
      console.error("❌ Erro ao buscar URL do áudio:", errorData);
      throw new Error(`Erro ao buscar mídia: ${mediaResponse.status}`);
    }

    const mediaData = await mediaResponse.json();
    const audioUrl = mediaData.url;

    console.log(`🔗 URL do áudio obtida: ${audioUrl}`);

    if (!audioUrl) {
      throw new Error("URL do áudio não encontrada");
    }

    // 2. Baixar o arquivo de áudio
    const audioFileResponse = await fetch(audioUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!audioFileResponse.ok) {
      throw new Error(`Erro ao baixar áudio: ${audioFileResponse.status}`);
    }

    // 3. Converter para formato adequado para a OpenAI
    const audioBuffer = await audioFileResponse.arrayBuffer();

    // Criar blob do áudio
    const audioBlob = new Blob([audioBuffer], {
      type: mediaData.mime_type || "audio/ogg",
    });

    console.log(
      `📁 Áudio preparado: ${mediaData.mime_type}, ${audioBlob.size} bytes`
    );

    // 4. Enviar para transcrição na OpenAI
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.ogg");
    formData.append("model", "whisper-1");
    formData.append("language", "pt"); // Português
    formData.append("response_format", "json");

    const transcriptionResponse = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      }
    );

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error("❌ Erro na transcrição OpenAI:", errorText);
      throw new Error(`OpenAI API: ${transcriptionResponse.status}`);
    }

    const transcriptionData = await transcriptionResponse.json();
    const textoTranscrito = transcriptionData.text?.trim();

    console.log(`✅ Transcrição bem-sucedida: "${textoTranscrito}"`);

    if (!textoTranscrito) {
      throw new Error("Áudio não pôde ser transcrito ou está vazio");
    }

    return textoTranscrito;
  } catch (error) {
    console.error("💥 Erro completo na transcrição:", error);
    throw error;
  }
}

// 🔥 FUNÇÃO PARA PROCESSAR CONFIRMAÇÃO - MOVER PARA FORA
async function processarConfirmacao(
  resposta: string,
  pendingLancamento: LancamentoTemporario,
  userPhone: string
) {
  console.log(`🎯 PROCESSANDO CONFIRMAÇÃO: ${resposta} para ${userPhone}`);

  // 🔥 BUSCAR USUÁRIO COM CONFIGURAÇÕES
  const session = await getUserByPhone(userPhone);
  if (!session) {
    const mensagemErro =
      "❌ Your account was not found. The transaction has been canceled.";
    await sendWhatsAppMessage(userPhone, mensagemErro);
    global.pendingLancamentos?.delete(userPhone);
    return { status: "user_not_found" };
  }

  const idiomaPreferido = session.idiomaPreferido;

  // Remover do cache de pendentes
  global.pendingLancamentos?.delete(userPhone);
  console.log(`🗑️ Removido lançamento pendente para: ${userPhone}`);

  const respostaLower = resposta.toLowerCase().trim();

  if (
    respostaLower === "não" ||
    respostaLower === "nao" ||
    respostaLower === "n" ||
    respostaLower === "cancelar" ||
    respostaLower === "no" ||
    respostaLower === "❌" ||
    respostaLower === "nope" ||
    respostaLower === "cancel"
  ) {
    console.log(`❌ Usuário cancelou o lançamento`);
    const mensagemCancelamento =
      await gerarMensagemCancelamento(idiomaPreferido);
    await sendWhatsAppMessage(userPhone, mensagemCancelamento);
    return { status: "cancelled" };
  }

  if (
    respostaLower === "sim" ||
    respostaLower === "s" ||
    respostaLower === "confirmar" ||
    respostaLower === "ok" ||
    respostaLower === "yes" ||
    respostaLower === "✅" ||
    respostaLower === "y" ||
    respostaLower === "confirm" ||
    respostaLower === "yeah"
  ) {
    console.log(`✅ Usuário confirmou - criando lançamento...`);
    try {
      // Criar o lançamento no banco de dados
      const resultadoCriacao = await createLancamento(
        pendingLancamento.userId,
        pendingLancamento.dados,
        pendingLancamento.categoriaEscolhida,
        pendingLancamento.mensagemOriginal,
        pendingLancamento.descricaoLimpa,
        pendingLancamento.cartaoEncontrado
      );

      // Gerar mensagem de confirmação final com idioma preferido
      const mensagemFinal = await gerarMensagemConfirmacao(
        pendingLancamento.dados,
        pendingLancamento.descricaoLimpa,
        pendingLancamento.categoriaEscolhida,
        pendingLancamento.cartaoEncontrado,
        resultadoCriacao,
        idiomaPreferido // 🔥 USA IDIOMA PREFERIDO
      );

      await sendWhatsAppMessage(userPhone, mensagemFinal);
      console.log("✅ Lançamento confirmado e criado no banco de dados");

      return { status: "confirmed" };
    } catch (error: any) {
      console.error("❌ Erro ao criar lançamento:", error);

      let mensagemErro = "";
      if (idiomaPreferido === "en-US") {
        mensagemErro = `❌ Error creating transaction: ${error.message}\n\nTry again.`;
      } else {
        mensagemErro = `❌ Erro ao criar lançamento: ${error.message}\n\nTente novamente.`;
      }

      await sendWhatsAppMessage(userPhone, mensagemErro);
      return { status: "creation_error" };
    }
  }

  console.log(`⚠️ Resposta inválida na confirmação: ${resposta}`);

  // Resposta não reconhecida com idioma preferido
  let mensagemInvalida = "";
  if (idiomaPreferido === "en-US") {
    mensagemInvalida =
      `❌ I didn't understand your response: "${resposta}"\n\n` +
      `Reply with:\n` +
      `✅ *YES* - To confirm the transaction\n` +
      `❌ *NO* - To cancel\n\n` +
      `Or send a new message to create another transaction.`;
  } else {
    mensagemInvalida =
      `❌ Não entendi sua resposta: "${resposta}"\n\n` +
      `Responda com:\n` +
      `✅ *SIM* - Para confirmar o lançamento\n` +
      `❌ *NÃO* - Para cancelar\n\n` +
      `Ou envie uma nova mensagem para criar outro lançamento.`;
  }

  await sendWhatsAppMessage(userPhone, mensagemInvalida);
  return { status: "invalid_confirmation_response" };
}
function tentarFallbackExtracao(
  mensagem: string,
  idioma: string
): ResultadoExtracao | null {
  const texto = mensagem.toLowerCase();

  // Tentar encontrar qualquer número na mensagem
  const numeros = texto.match(/\d+[\.,]?\d*/g);
  if (!numeros || numeros.length === 0) {
    console.log(`🔍 Fallback: Nenhum número encontrado`);
    return null;
  }

  // Pegar o primeiro número (provavelmente o valor)
  const valor = numeros[0].replace(",", ".");
  console.log(`🔍 Fallback: Valor encontrado: ${valor}`);

  // Tentar extrair descrição
  let descricao = "";
  const palavras = mensagem.split(/\s+/);

  // Procurar palavras após o número
  const indexValor = palavras.findIndex((palavra) =>
    palavra.includes(valor.replace(".", ""))
  );

  if (indexValor !== -1 && indexValor < palavras.length - 1) {
    // Pegar as próximas 2-3 palavras após o número
    descricao = palavras.slice(indexValor + 1, indexValor + 4).join(" ");

    // Remover palavras comuns
    const palavrasComuns = [
      "on",
      "for",
      "at",
      "with",
      "using",
      "via",
      "my",
      "the",
      "reais",
      "real",
      "r$",
      "$",
    ];
    descricao = descricao
      .split(/\s+/)
      .filter((palavra) => !palavrasComuns.includes(palavra.toLowerCase()))
      .join(" ");
  }

  if (!descricao || descricao.trim() === "") {
    descricao = "Transação";
  }

  // Detectar tipo pelo contexto
  let tipo = "DESPESA";
  if (
    texto.includes("received") ||
    texto.includes("earned") ||
    texto.includes("recebi") ||
    texto.includes("ganhei") ||
    texto.includes("salary") ||
    texto.includes("salário")
  ) {
    tipo = "RECEITA";
  }

  // Detectar método de pagamento
  const metodoPagamento = extrairMetodoPagamentoInternacional(
    mensagem,
    false,
    idioma
  );

  console.log(`🔍 Fallback resultado:`, {
    tipo,
    valor,
    descricao,
    metodoPagamento,
  });

  return {
    sucesso: true,
    dados: {
      tipo,
      valor,
      descricao: descricao.trim(),
      metodoPagamento,
      data: "hoje",
      ehCompartilhado: false,
      nomeUsuarioCompartilhado: undefined,
      ehParcelado: false,
      parcelas: undefined,
      tipoParcelamento: undefined,
    },
  };
}
// 🔥 FUNÇÃO AUXILIAR: Processar mensagem de áudio
async function processarAudioWhatsApp(audioMessage: any, userPhone: string) {
  try {
    console.log(`🎙️ Processando mensagem de áudio de: ${userPhone}`);

    // 🔥 BUSCAR USUÁRIO COM CONFIGURAÇÕES
    const session = await getUserByPhone(userPhone);
    if (!session) {
      let mensagemErro = "";
      // Tentar detectar idioma da mensagem
      const idiomaDetectado = detectarIdioma(audioMessage.text?.body || "");
      if (idiomaDetectado === "en-US") {
        mensagemErro =
          "❌ Your number is not linked to any account.\n\n" +
          "💡 Access the BeCash app and link your WhatsApp in Settings.";
      } else {
        mensagemErro =
          "❌ Seu número não está vinculado a nenhuma conta.\n\n" +
          "💡 Acesse o app BeCash e vincule seu WhatsApp em Configurações.";
      }
      await sendWhatsAppMessage(userPhone, mensagemErro);
      return { status: "user_not_found" };
    }

    // Transcrever o áudio
    const audioId = audioMessage.audio?.id;
    if (!audioId) {
      throw new Error("ID do áudio não encontrado");
    }

    const textoTranscrito = await transcreverAudioWhatsApp(audioId);

    console.log(`📝 Áudio transcrito: "${textoTranscrito}"`);

    // Processar o texto transcrito
    return await processarMensagemTexto({
      type: "text",
      text: { body: textoTranscrito },
      from: userPhone,
      id: audioMessage.id,
    });
  } catch (error: any) {
    console.error("❌ Erro ao processar áudio:", error);

    // 🔥 USAR IDIOMA PREFERIDO PARA MENSAGEM DE ERRO
    const session = await getUserByPhone(userPhone);
    const idiomaPreferido = session?.idiomaPreferido;

    let mensagemErro = "";
    if (idiomaPreferido === "en-US") {
      mensagemErro = `❌ I couldn't understand the audio. Error: ${error.message}\n\n💡 Try sending a text message or speak more clearly.`;
    } else {
      mensagemErro = `❌ Não consegui entender o áudio. Erro: ${error.message}\n\n💡 Tente enviar em texto ou falar mais claramente.`;
    }

    await sendWhatsAppMessage(userPhone, mensagemErro);
    throw error;
  }
}

// 🆕 ADICIONAR ESTAS FUNÇÕES AUXILIARES NO INÍCIO DO ARQUIVO

async function buscarLimiteCategoria(
  categoriaId: string,
  userId: string,
  mesReferencia: string
) {
  try {
    const limite = await db.limiteCategoria.findUnique({
      where: {
        categoriaId_mesReferencia_userId: {
          categoriaId,
          mesReferencia,
          userId,
        },
      },
      include: {
        categoria: true,
      },
    });

    return limite;
  } catch (error) {
    console.error("Erro ao buscar limite da categoria:", error);
    return null;
  }
}

// Fallback manual caso a IA não funcione
function detectarComando(mensagem: string): { tipo: string | null } {
  const textoLower = mensagem.toLowerCase().trim();

  const comandosCategorias = [
    "quais categorias",
    "categorias disponíveis",
    "minhas categorias",
    "listar categorias",
    "ver categorias",
    "mostrar categorias",
    "categorias cadastradas",
  ];

  if (comandosCategorias.some((cmd) => textoLower.includes(cmd))) {
    return { tipo: "LISTAR_CATEGORIAS" };
  }

  return { tipo: null };
}

async function enviarMensagemAjuda(
  userPhone: string,
  idioma: string = "pt-BR"
) {
  // Se for inglês, mostrar ajuda em inglês
  if (idioma === "en-US") {
    const templateEN = `*🤖 HELP - BeCash WhatsApp*
━━━━━━━━━━━━━━

*📝 HOW TO CREATE TRANSACTIONS:*

*Simple examples:*
- "I spent 50 on lunch"
- "I received 1000 salary"
- "I paid 200 at the pharmacy"

*With payment method:*
- "I spent 80 on Uber with PIX"
- "I bought 150 at the supermarket on credit"
- "I paid 45 in cash"

*Installments:*
- "I bought 600 in 3 installments"
- "I spent 1200 in 6x on credit"

*Shared:*
- "I spent 100 on dinner shared with Mary"

*📋 AVAILABLE COMMANDS:*
- "Which categories do I have?"
- "Help"

━━━━━━━━━━━━━━
💡 Questions? Type "help"`;

    await sendWhatsAppMessage(userPhone, templateEN);
    return;
  }

  // Português (padrão)
  const templatePT = `*🤖 AJUDA - BeCash WhatsApp*
━━━━━━━━━━━━━━

*📝 COMO CRIAR LANÇAMENTOS:*

*Exemplos simples:*
- "Gastei 50 no almoço"
- "Recebi 1000 salário"
- "Paguei 200 na farmácia"

*Com método de pagamento:*
- "Gastei 80 no Uber com PIX"
- "Comprei 150 no mercado no crédito"
- "Paguei 45 em dinheiro"

*Parcelado:*
- "Comprei 600 parcelado em 3 vezes"
- "Gastei 1200 em 6x no crédito"

*Compartilhado:*
- "Gastei 100 no jantar compartilhada com Maria"

*📋 COMANDOS DISPONÍVEIS:*
- "Quais categorias tenho?"
- "Ajuda"

━━━━━━━━━━━━━━
💡 Dúvidas? Digite "ajuda"`;

  await sendWhatsAppMessage(userPhone, templatePT);
}

// 🔥 NOVA FUNÇÃO: Extrair dados com IA (mais preciso e flexível)
async function extrairDadosComIA(
  mensagem: string,
  idioma: string
): Promise<ResultadoExtracao> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("⚠️ Sem API key, usando fallback regex");
    return extrairDadosLancamento(mensagem);
  }

  const promptPT = `Você é um assistente financeiro. Extraia os dados desta mensagem financeira:

MENSAGEM: "${mensagem}"

REGRAS DE EXTRAÇÃO:
1. TIPO: Identifique se é DESPESA ou RECEITA
   - Despesas: gastei, paguei, comprei, conta, fatura, etc
   - Receitas: recebi, ganhei, salário, etc

2. VALOR: Extraia o valor monetário (apenas números)
   - Exemplos: "99,90" → "99.90", "104,20" → "104.20", "1 real" → "1"

3. DESCRIÇÃO: Extraia O QUE foi pago/recebido (máximo 3-4 palavras)
   - "internet" → "Internet"
   - "conta da luz" → "Conta de luz"
   - "papagaia" ou "pet" → "Pet"
   - "almoço" → "Almoço"
   - SE o usuário mencionar explicitamente uma categoria, USE como descrição
   - NUNCA use "Transação" como descrição - sempre extraia o que foi comprado

4. CATEGORIA_SUGERIDA: Se o usuário mencionar uma categoria explicitamente
   - "use a categoria pet" → "pet"
   - "categoria é casa" → "casa"
   - "categoria alimentação" → "alimentação"
   - Se não mencionar, deixe null

5. MÉTODO DE PAGAMENTO: Identifique como foi pago
   - PIX, CREDITO, DEBITO, DINHEIRO, TRANSFERENCIA
   - Default: PIX

IMPORTANTE:
- Seja inteligente: "papagaia" é um pet, "internet" é conta de casa, "luz" é conta de casa
- A descrição deve ser curta e clara
- NUNCA retorne "Transação" como descrição - isso é muito genérico
- Use o contexto para entender: "minha papagaia, que é minha pet" → descrição: "Pet"

RESPONDA APENAS JSON (sem markdown):
{
  "tipo": "DESPESA" | "RECEITA",
  "valor": "número",
  "descricao": "texto curto",
  "categoriaSugerida": "nome da categoria" | null,
  "metodoPagamento": "PIX" | "CREDITO" | "DEBITO" | "DINHEIRO" | "TRANSFERENCIA"
}`;

  const promptEN = `You are a financial assistant. Extract data from this financial message:

MESSAGE: "${mensagem}"

EXTRACTION RULES:
1. TYPE: Identify if it's EXPENSE (DESPESA) or INCOME (RECEITA)
   - Expenses: spent, paid, bought, bill, etc
   - Income: received, earned, salary, etc

2. AMOUNT: Extract monetary value (numbers only)
   - Examples: "20 reais" → "20", "50.50" → "50.50"

3. DESCRIPTION: Extract WHAT was paid/received (max 3-4 words)
   - "ice cream" → "Ice cream"
   - "lunch" → "Lunch"
   - IF user explicitly mentions a category, USE it as description

4. SUGGESTED_CATEGORY: If user explicitly mentions a category
   - "use pet category" → "pet"
   - "category is food" → "food"
   - If not mentioned, leave null

5. PAYMENT METHOD: Identify how it was paid
   - PIX, CREDITO, DEBITO, DINHEIRO, TRANSFERENCIA
   - Default: PIX

IMPORTANT:
- Be smart: understand context
- Description should be short and clear

RESPOND ONLY JSON (no markdown):
{
  "tipo": "DESPESA" | "RECEITA",
  "valor": "number",
  "descricao": "short text",
  "categoriaSugerida": "category name" | null,
  "metodoPagamento": "PIX" | "CREDITO" | "DEBITO" | "DINHEIRO" | "TRANSFERENCIA"
}`;

  const prompt = idioma === "en-US" ? promptEN : promptPT;

  try {
    console.log(`🤖 Extraindo dados com IA (${idioma})...`);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API: ${response.status}`);
    }

    const data = await response.json();
    const resultado = data.content[0].text.trim();
    const jsonLimpo = resultado.replace(/```json|```/g, "").trim();
    const dadosExtraidos = JSON.parse(jsonLimpo);

    console.log(`✅ Dados extraídos pela IA:`, dadosExtraidos);

    // Detecções adicionais
    const compartilhamento = detectarCompartilhamento(mensagem);
    const parcelamento = detectarParcelamento(mensagem);

    return {
      sucesso: true,
      dados: {
        tipo: dadosExtraidos.tipo,
        valor: dadosExtraidos.valor.toString().replace(",", "."),
        descricao: dadosExtraidos.descricao,
        metodoPagamento: dadosExtraidos.metodoPagamento,
        data: "hoje",
        ehCompartilhado: compartilhamento.ehCompartilhado,
        nomeUsuarioCompartilhado: compartilhamento.nomeUsuario,
        ehParcelado: parcelamento.ehParcelado,
        parcelas: parcelamento.parcelas,
        tipoParcelamento: parcelamento.tipoParcelamento,
        categoriaSugerida: dadosExtraidos.categoriaSugerida, // 🔥 NOVO CAMPO
      },
    };
  } catch (error) {
    console.error("❌ Erro na extração com IA:", error);
    console.log("⚠️ Fallback para extração regex");
    return extrairDadosLancamento(mensagem);
  }
}

// 🔥 FUNÇÃO PRINCIPAL MODIFICADA COM CONFIRMAÇÃO

async function processarMensagemTexto(message: any) {
  const userMessage = message.text?.body;
  const userPhone = message.from;
  const messageId = message.id;

  console.log("👤 Mensagem de:", userPhone);
  console.log("💬 Texto:", userMessage);
  console.log("🆔 Message ID:", messageId);

  // 🔥 PRIMEIRO: Buscar usuário com suas configurações
  const session = await getUserByPhone(userPhone);
  if (!session) {
    await sendWhatsAppMessage(
      userPhone,
      "❌ Seu número não está vinculado a nenhuma conta.\n\n💡 Acesse o app BeCash e vincule seu WhatsApp em Configurações."
    );
    return { status: "user_not_found" };
  }

  const userId = session.user.id;
  const idiomaPreferido = session.idiomaPreferido;
  console.log(`🌐 IDIOMA PREFERIDO DO USUÁRIO: ${idiomaPreferido}`);

  // 🔥 DETECTAR COMANDO COM IA (usando idioma preferido como fallback)
  const comandoIA = await detectarComandoComIA(userMessage);
  const idioma = idiomaPreferido;

  console.log(
    `🤖 Comando detectado pela IA: ${comandoIA.tipo} (idioma detectado: ${comandoIA.idioma}, usando: ${idioma})`
  );

  if (comandoIA.tipo && comandoIA.tipo !== "NENHUM") {
    // Processar comando detectado
    if (comandoIA.tipo === "LISTAR_CATEGORIAS") {
      await processarComandoCategorias(userPhone, userId, idioma);
      return { status: "command_processed" };
    }

    if (comandoIA.tipo === "AJUDA") {
      await enviarMensagemAjuda(userPhone, idioma);
      return { status: "command_processed" };
    }
  }

  // 🔥 INICIALIZAR CACHE
  if (!global.pendingLancamentos) {
    console.log("🔄 Criando novo cache de pendingLancamentos");
    global.pendingLancamentos = new Map();
  } else {
    console.log(
      `📊 Cache já existe com ${global.pendingLancamentos.size} itens`
    );
  }

  // 🔥 NORMALIZAR TELEFONE
  const telefoneNormalizado = userPhone.replace(/\D/g, "");
  let telefoneBusca = telefoneNormalizado;

  if (
    telefoneNormalizado.startsWith("55") &&
    telefoneNormalizado.length === 13
  ) {
    telefoneBusca = telefoneNormalizado.substring(2);
  } else if (
    telefoneNormalizado.startsWith("55") &&
    telefoneNormalizado.length === 12
  ) {
    const ddd = telefoneNormalizado.substring(2, 4);
    const resto = telefoneNormalizado.substring(4);
    telefoneBusca = ddd + "9" + resto;
  }

  console.log(`🔍 Verificando lançamentos pendentes...`);
  console.log(`📞 Telefone normalizado: ${telefoneBusca}`);

  // 🔥 BUSCAR NO CACHE
  const pendingLancamento = global.pendingLancamentos?.get(telefoneBusca);

  if (pendingLancamento) {
    console.log(`✅ LANÇAMENTO PENDENTE ENCONTRADO`);

    // Verificar expiração
    if (Date.now() - pendingLancamento.timestamp > 5 * 60 * 1000) {
      console.log(`⏰ Lançamento expirado`);
      global.pendingLancamentos.delete(telefoneBusca);

      let mensagemExpirado = "";
      if (idiomaPreferido === "en-US") {
        mensagemExpirado =
          "❌ Confirmation expired (5 minutes).\n\n💡 Send the transaction again.";
      } else {
        mensagemExpirado =
          "❌ A confirmação expirou (5 minutos).\n\n💡 Envie novamente o lançamento.";
      }

      await sendWhatsAppMessage(userPhone, mensagemExpirado);
      return { status: "expired" };
    }

    const resposta = userMessage.toLowerCase().trim();

    // Verificar confirmação com suporte a inglês
    const confirmacoesIngles = [
      "sim",
      "s",
      "confirmar",
      "ok",
      "yes",
      "✅",
      "y",
      "confirm",
      "yeah",
      "yep",
    ];
    const cancelamentosIngles = [
      "não",
      "nao",
      "n",
      "cancelar",
      "no",
      "❌",
      "nope",
      "cancel",
      "stop",
    ];

    if (confirmacoesIngles.includes(resposta)) {
      console.log(`✅ USUÁRIO CONFIRMOU`);
      return await processarConfirmacao(
        "sim",
        pendingLancamento,
        telefoneBusca
      );
    }

    if (cancelamentosIngles.includes(resposta)) {
      console.log(`❌ USUÁRIO CANCELOU`);
      return await processarConfirmacao(
        "não",
        pendingLancamento,
        telefoneBusca
      );
    }

    // Resposta não reconhecida com idioma preferido
    let mensagemInvalida = "";
    if (idiomaPreferido === "en-US") {
      mensagemInvalida =
        `❌ I didn't understand your response: "${userMessage}"\n\n` +
        `Reply with:\n` +
        `✅ *YES* - To confirm the transaction\n` +
        `❌ *NO* - To cancel\n\n` +
        `Or send a new message to create another transaction.`;
    } else {
      mensagemInvalida =
        `❌ Não entendi sua resposta: "${userMessage}"\n\n` +
        `Responda com:\n` +
        `✅ *SIM* - Para confirmar o lançamento\n` +
        `❌ *NÃO* - Para cancelar\n\n` +
        `Ou envie uma nova mensagem para criar outro lançamento.`;
    }

    await sendWhatsAppMessage(userPhone, mensagemInvalida);
    return { status: "invalid_confirmation_response" };
  }

  // 🔥 PROCESSAR NOVO LANÇAMENTO
  if (userMessage && userPhone) {
    // Extrair dados
    const dadosExtracao = await extrairDadosComIA(userMessage, idiomaPreferido);
    console.log("📊 Dados extraídos:", dadosExtracao);

    if (!dadosExtracao.sucesso) {
      // 🔥 USAR IDIOMA PREFERIDO PARA MENSAGEM DE ERRO
      let erroMsg = "";
      if (idiomaPreferido === "en-US") {
        erroMsg = `❌ ${dadosExtracao.erro}\n\n💡 Example: "I spent 50 on lunch"`;
      } else {
        erroMsg = `❌ ${dadosExtracao.erro}\n\n💡 Exemplo: "Gastei 50 no almoço"`;
      }

      await sendWhatsAppMessage(userPhone, erroMsg);
      return { status: "extraction_failed" };
    }

    // Buscar categorias
    const categoriasUsuario = await getCategoriasUsuario(userId);
    console.log("🏷️ Categorias do usuário:", categoriasUsuario);

    if (categoriasUsuario.length === 0) {
      // 🔥 USAR IDIOMA PREFERIDO
      let mensagemErro = "";
      if (idiomaPreferido === "en-US") {
        mensagemErro =
          "❌ No categories found. Create categories first in the app.";
      } else {
        mensagemErro =
          "❌ Nenhuma categoria encontrada. Crie categorias primeiro no app.";
      }
      await sendWhatsAppMessage(userPhone, mensagemErro);
      return { status: "no_categories" };
    }

    const categoriaEscolhida = await escolherMelhorCategoria(
      dadosExtracao.dados.descricao,
      categoriasUsuario,
      dadosExtracao.dados.tipo,
      dadosExtracao.dados.categoriaSugerida
    );

    if (!categoriaEscolhida) {
      // 🔥 USAR IDIOMA PREFERIDO
      let mensagemErro = "";
      if (idiomaPreferido === "en-US") {
        mensagemErro = `❌ No ${dadosExtracao.dados.tipo === "DESPESA" ? "expense" : "income"} category found.`;
      } else {
        mensagemErro = `❌ Nenhuma categoria do tipo ${dadosExtracao.dados.tipo} encontrada.`;
      }
      await sendWhatsAppMessage(userPhone, mensagemErro);
      return { status: "no_matching_category" };
    }

    // Limpar descrição com o idioma preferido
    const descricaoLimpa = await limparDescricaoComClaude(
      dadosExtracao.dados.descricao,
      idiomaPreferido
    );

    // Identificar cartão
    let cartaoEncontrado = null;
    if (dadosExtracao.dados.metodoPagamento === "CREDITO") {
      cartaoEncontrado = await identificarCartao(userMessage, userId);
    }

    // 🔥 GERAR MENSAGEM DE CONFIRMAÇÃO COM IDIOMA PREFERIDO
    const mensagemConfirmacao = await gerarMensagemConfirmacao(
      dadosExtracao.dados,
      descricaoLimpa,
      categoriaEscolhida,
      cartaoEncontrado,
      userId, // userId para confirmação
      idiomaPreferido // 🔥 AGORA USA O IDIOMA PREFERIDO
    );

    // Salvar no cache com o idioma
    const lancamentoTemporario: LancamentoTemporario = {
      dados: dadosExtracao.dados,
      categoriaEscolhida,
      userId,
      userPhone,
      timestamp: Date.now(),
      descricaoLimpa,
      cartaoEncontrado,
      mensagemOriginal: userMessage,
      descricaoOriginal: dadosExtracao.dados.descricao,
    };

    global.pendingLancamentos.set(telefoneBusca, lancamentoTemporario);

    // Limpar após 5 minutos
    setTimeout(
      () => {
        if (global.pendingLancamentos?.has(telefoneBusca)) {
          global.pendingLancamentos.delete(telefoneBusca);
        }
      },
      5 * 60 * 1000
    );

    await sendWhatsAppMessage(userPhone, mensagemConfirmacao);

    return { status: "waiting_confirmation" };
  }

  return { status: "processed" };
}

async function gerarMensagemConfirmacao(
  dados: DadosLancamento,
  descricaoLimpa: string,
  categoriaEscolhida: any,
  cartaoEncontrado: any,
  userIdOuResultado: string | any,
  idioma: string = "pt-BR"
): Promise<string> {
  // Verificar se é userId (confirmação) ou resultadoCriacao (sucesso)
  const isConfirmacao = typeof userIdOuResultado === "string";
  const userId = isConfirmacao ? userIdOuResultado : null;
  const resultadoCriacao = !isConfirmacao ? userIdOuResultado : null;

  // 🔥 CALCULAR DATA
  let dataLancamento = new Date();
  const offsetBrasilia = -3 * 60;
  dataLancamento.setMinutes(
    dataLancamento.getMinutes() +
      dataLancamento.getTimezoneOffset() +
      offsetBrasilia
  );

  if (dados.data === "ontem") {
    dataLancamento.setDate(dataLancamento.getDate() - 1);
  } else if (dados.data.includes("/")) {
    const [dia, mes, ano] = dados.data.split("/").map(Number);
    dataLancamento = new Date(
      ano || new Date().getFullYear(),
      mes - 1 || new Date().getMonth(),
      dia || new Date().getDate()
    );
  }

  // 🔥 CORRIGIR FORMATAÇÃO DO VALOR
  const valorNumero = parseFloat(dados.valor);
  const valorFormatado = formatarValorComMoeda(valorNumero, idioma);

  const dataFormatada = dataLancamento.toLocaleDateString(
    idioma === "en-US" ? "en-US" : "pt-BR"
  );

  // 🔥 SE FOR SUCESSO (após criação)
  if (resultadoCriacao) {
    if (idioma === "en-US") {
      let templateEN = `✅ *TRANSACTION REGISTERED*\n`;
      templateEN += `━━━━━━━━━━━━━━\n\n`;

      templateEN += `📝 *Description:* ${descricaoLimpa}\n`;
      templateEN += `💰 *Total amount:* ${valorFormatado}\n`;
      templateEN += `🏷️ *Category:* ${categoriaEscolhida.nome}\n`;

      // Compartilhamento em USD
      if (
        resultadoCriacao?.usuarioAlvo &&
        resultadoCriacao.valorCompartilhado > 0
      ) {
        const valorUsuario = formatarValorComMoeda(
          resultadoCriacao.valorUsuarioCriador,
          idioma
        );

        const valorCompartilhado = formatarValorComMoeda(
          resultadoCriacao.valorCompartilhado,
          idioma
        );

        templateEN += `\n👥 *SHARED EXPENSE*\n`;
        templateEN += `   • Your part: ${valorUsuario}\n`;
        templateEN += `   • ${resultadoCriacao.usuarioAlvo.name}: ${valorCompartilhado}\n`;
      }

      // Parcelamento em USD
      if (resultadoCriacao?.ehParcelado && resultadoCriacao.parcelasTotal) {
        templateEN += `\n💳 *INSTALLMENTS*\n`;
        templateEN += `   • ${resultadoCriacao.parcelasTotal}x of ${formatarValorComMoeda(
          resultadoCriacao.valorParcela,
          idioma
        )}\n`;
      }

      if (cartaoEncontrado) {
        templateEN += `\n💳 *Card:* ${cartaoEncontrado.nome}\n`;
      }

      templateEN += `\n📅 *Date:* ${dataFormatada}\n`;
      templateEN += `\n━━━━━━━━━━━━━━\n`;
      templateEN += `✨ *Thank you for using BeCash!*\n`;

      return templateEN;
    } else {
      // PORTUGUÊS (versão original)
      let templatePT = `✅ *LANÇAMENTO REGISTRADO*\n`;
      templatePT += `━━━━━━━━━━━━━━\n\n`;

      templatePT += `📝 *Descrição:* ${descricaoLimpa}\n`;
      templatePT += `💰 *Valor total:* ${valorFormatado}\n`;
      templatePT += `🏷️ *Categoria:* ${categoriaEscolhida.nome}\n`;

      // Compartilhamento em BRL
      if (
        resultadoCriacao?.usuarioAlvo &&
        resultadoCriacao.valorCompartilhado > 0
      ) {
        const valorUsuario =
          resultadoCriacao.valorUsuarioCriador.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });

        const valorCompartilhado =
          resultadoCriacao.valorCompartilhado.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });

        templatePT += `\n👥 *COMPARTILHAMENTO*\n`;
        templatePT += `   • Sua parte: ${valorUsuario}\n`;
        templatePT += `   • ${resultadoCriacao.usuarioAlvo.name}: ${valorCompartilhado}\n`;
      }

      // Parcelamento em BRL
      if (resultadoCriacao?.ehParcelado && resultadoCriacao.parcelasTotal) {
        templatePT += `\n💳 *PARCELAMENTO*\n`;
        templatePT += `   • ${resultadoCriacao.parcelasTotal}x de ${resultadoCriacao.valorParcela.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n`;
      }

      if (cartaoEncontrado) {
        templatePT += `\n💳 *Cartão:* ${cartaoEncontrado.nome}\n`;
      }

      templatePT += `\n📅 *Data:* ${dataFormatada}\n`;
      templatePT += `\n━━━━━━━━━━━━━━\n`;
      templatePT += `✨ *Obrigado por usar o BeCash!*\n`;

      return templatePT;
    }
  }

  // 🔥 SE FOR CONFIRMAÇÃO (antes de criar)
  if (idioma === "en-US") {
    let templateEN = `*📋 TRANSACTION CONFIRMATION*\n`;
    templateEN += `━━━━━━━━━━━━━━\n\n`;

    templateEN += `*📝 Description:* ${descricaoLimpa}\n`;
    templateEN += `*💰 Amount:* ${valorFormatado}\n`;
    templateEN += `*🏷️ Category:* ${categoriaEscolhida.nome}\n`;
    templateEN += `*📅 Date:* ${dataFormatada}\n`;

    // Tipo
    templateEN += `*📊 Type:* ${dados.tipo === "DESPESA" ? "Expense" : "Income"}\n`;

    // Método de pagamento em inglês
    const metodoPagamentoText = traduzirMetodoPagamento(
      dados.metodoPagamento,
      idioma
    );
    const emojiMetodo = metodoPagamentoText.split(" ")[0];

    templateEN += `*${emojiMetodo} Method:* ${metodoPagamentoText.replace(/💳|📱|💵|🔄/g, "").trim()}\n`;

    // Informações do cartão em USD
    if (cartaoEncontrado) {
      templateEN += `*🔸 Card:* ${cartaoEncontrado.nome}\n`;

      if (cartaoEncontrado.limiteDisponivel !== undefined) {
        const limiteDisponivel = formatarValorComMoeda(
          cartaoEncontrado.limiteDisponivel,
          idioma
        );
        const utilizacaoPercentual = cartaoEncontrado.utilizacaoLimite || 0;

        templateEN += `*📊 Available limit:* ${limiteDisponivel}\n`;
        templateEN += `*📈 Utilization:* ${utilizacaoPercentual.toFixed(1)}%\n`;
      } else if (
        cartaoEncontrado.limite &&
        cartaoEncontrado.totalGasto !== undefined
      ) {
        const limiteDisponivel =
          cartaoEncontrado.limite - cartaoEncontrado.totalGasto;
        const limiteDisponivelFormatado = formatarValorComMoeda(
          limiteDisponivel,
          idioma
        );
        const utilizacaoPercentual =
          cartaoEncontrado.limite > 0
            ? (cartaoEncontrado.totalGasto / cartaoEncontrado.limite) * 100
            : 0;

        templateEN += `*📊 Available limit:* ${limiteDisponivelFormatado}\n`;
        templateEN += `*📈 Utilization:* ${utilizacaoPercentual.toFixed(1)}%\n`;
      }
    }

    // Limite da categoria em USD
    if (userId) {
      const hoje = new Date();
      const mesReferencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
      const limiteCategoria = await buscarLimiteCategoria(
        categoriaEscolhida.id,
        userId,
        mesReferencia
      );

      if (limiteCategoria) {
        const gastoAtual = limiteCategoria.gastoAtual || 0;
        const novoGasto = gastoAtual + parseFloat(dados.valor);
        const limite = limiteCategoria.limiteMensal;
        const percentualAtual = (gastoAtual / limite) * 100;
        const percentualNovo = (novoGasto / limite) * 100;

        const gastoAtualFormatado = formatarValorComMoeda(gastoAtual, idioma);
        const novoGastoFormatado = formatarValorComMoeda(novoGasto, idioma);
        const limiteFormatado = formatarValorComMoeda(limite, idioma);

        templateEN += `*📊 CATEGORY LIMIT:*\n`;
        templateEN += `   • Before: ${gastoAtualFormatado} / ${limiteFormatado} (${percentualAtual.toFixed(1)}%)\n`;
        templateEN += `   • After: ${novoGastoFormatado} / ${limiteFormatado} (${percentualNovo.toFixed(1)}%)\n`;

        if (novoGasto > limite) {
          templateEN += `   ⚠️ *WARNING: Limit exceeded!*\n`;
        }
      }
    }

    // Compartilhamento em USD
    if (dados.ehCompartilhado && dados.nomeUsuarioCompartilhado) {
      const valorTotal = parseFloat(dados.valor);
      const valorCompartilhado = valorTotal / 2;
      const valorUsuario = valorTotal / 2;

      const valorUsuarioFormatado = formatarValorComMoeda(valorUsuario, idioma);
      const valorCompartilhadoFormatado = formatarValorComMoeda(
        valorCompartilhado,
        idioma
      );

      templateEN += `*👥 Shared with:* ${dados.nomeUsuarioCompartilhado}\n`;
      templateEN += `*🤝 Your part:* ${valorUsuarioFormatado}\n`;
      templateEN += `*👤 ${dados.nomeUsuarioCompartilhado}'s part:* ${valorCompartilhadoFormatado}\n`;
    }

    // Parcelamento em USD
    if (dados.ehParcelado && dados.parcelas) {
      const valorParcela = parseFloat(dados.valor) / dados.parcelas;
      const valorParcelaFormatado = formatarValorComMoeda(valorParcela, idioma);
      templateEN += `*🔢 Installments:* ${dados.parcelas}x of ${valorParcelaFormatado}\n`;
    }

    templateEN += `\n━━━━━━━━━━━━━━\n\n`;
    templateEN += `*Please confirm:*\n\n`;
    templateEN += `✅ *YES* - To confirm this transaction\n`;
    templateEN += `❌ *NO* - To cancel\n\n`;
    templateEN += `_⏰ This confirmation expires in 5 minutes_`;

    return templateEN;
  } else {
    // PORTUGUÊS (versão original)
    let templatePT = `*📋 CONFIRMAÇÃO DE LANÇAMENTO*\n`;
    templatePT += `━━━━━━━━━━━━━━\n\n`;

    templatePT += `*📝 Descrição:* ${descricaoLimpa}\n`;
    templatePT += `*💰 Valor:* ${valorFormatado}\n`;
    templatePT += `*🏷️ Categoria:* ${categoriaEscolhida.nome}\n`;
    templatePT += `*📅 Data:* ${dataFormatada}\n`;

    // Tipo
    templatePT += `*📊 Tipo:* ${dados.tipo === "DESPESA" ? "Despesa" : "Receita"}\n`;

    // Método de pagamento
    const metodoPagamentoText =
      {
        CREDITO: "💳 Cartão de Crédito",
        DEBITO: "💳 Cartão de Débito",
        PIX: "📱 PIX",
        DINHEIRO: "💵 Dinheiro",
        TRANSFERENCIA: "🔄 Transferência",
      }[dados.metodoPagamento] || "💳 " + dados.metodoPagamento;

    templatePT += `*${metodoPagamentoText.split(" ")[0]} Método:* ${metodoPagamentoText.replace(/💳|📱|💵|🔄/g, "").trim()}\n`;

    // Informações do cartão
    if (cartaoEncontrado) {
      templatePT += `*🔸 Cartão:* ${cartaoEncontrado.nome}\n`;

      if (cartaoEncontrado.limiteDisponivel !== undefined) {
        const limiteDisponivel = cartaoEncontrado.limiteDisponivel;
        const utilizacaoPercentual = cartaoEncontrado.utilizacaoLimite || 0;

        templatePT += `*📊 Limite disponível:* ${limiteDisponivel.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n`;
        templatePT += `*📈 Utilização:* ${utilizacaoPercentual.toFixed(1)}%\n`;
      } else if (
        cartaoEncontrado.limite &&
        cartaoEncontrado.totalGasto !== undefined
      ) {
        const limiteDisponivel =
          cartaoEncontrado.limite - cartaoEncontrado.totalGasto;
        const utilizacaoPercentual =
          cartaoEncontrado.limite > 0
            ? (cartaoEncontrado.totalGasto / cartaoEncontrado.limite) * 100
            : 0;

        templatePT += `*📊 Limite disponível:* ${limiteDisponivel.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n`;
        templatePT += `*📈 Utilização:* ${utilizacaoPercentual.toFixed(1)}%\n`;
      }
    }

    // Limite da categoria
    if (userId) {
      const hoje = new Date();
      const mesReferencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
      const limiteCategoria = await buscarLimiteCategoria(
        categoriaEscolhida.id,
        userId,
        mesReferencia
      );

      if (limiteCategoria) {
        const gastoAtual = limiteCategoria.gastoAtual || 0;
        const novoGasto = gastoAtual + parseFloat(dados.valor);
        const limite = limiteCategoria.limiteMensal;
        const percentualAtual = (gastoAtual / limite) * 100;
        const percentualNovo = (novoGasto / limite) * 100;

        templatePT += `*📊 LIMITE DA CATEGORIA:*\n`;
        templatePT += `   • Antes: ${gastoAtual.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} / ${limite.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} (${percentualAtual.toFixed(1)}%)\n`;
        templatePT += `   • Depois: ${novoGasto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} / ${limite.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} (${percentualNovo.toFixed(1)}%)\n`;

        if (novoGasto > limite) {
          templatePT += `   ⚠️ *ATENÇÃO: Limite ultrapassado!*\n`;
        }
      }
    }

    // Compartilhamento
    if (dados.ehCompartilhado && dados.nomeUsuarioCompartilhado) {
      const valorTotal = parseFloat(dados.valor);
      const valorCompartilhado = valorTotal / 2;
      const valorUsuario = valorTotal / 2;

      templatePT += `*👥 Compartilhado com:* ${dados.nomeUsuarioCompartilhado}\n`;
      templatePT += `*🤝 Sua parte:* ${valorUsuario.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n`;
      templatePT += `*👤 Parte ${dados.nomeUsuarioCompartilhado}:* ${valorCompartilhado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n`;
    }

    // Parcelamento
    if (dados.ehParcelado && dados.parcelas) {
      const valorParcela = parseFloat(dados.valor) / dados.parcelas;
      templatePT += `*🔢 Parcelamento:* ${dados.parcelas}x de ${valorParcela.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n`;
    }

    templatePT += `\n━━━━━━━━━━━━━━\n\n`;
    templatePT += `*Por favor, confirme:*\n\n`;
    templatePT += `✅ *SIM* - Para confirmar este lançamento\n`;
    templatePT += `❌ *NÃO* - Para cancelar\n\n`;
    templatePT += `_⏰ Esta confirmação expira em 5 minutos_`;

    return templatePT;
  }
}

// 🔥 FUNÇÃO PARA MENSAGEM DE CANCELAMENTO - VERSÃO MELHORADA
async function gerarMensagemCancelamento(
  idioma: string = "pt-BR"
): Promise<string> {
  if (idioma === "en-US") {
    return `❌ Transaction Canceled

The transaction was canceled and not registered in your statement.

💡 Send a new message to create another transaction.`;
  } else {
    return `❌ Lançamento Cancelado

A transação foi cancelada e não foi registrada em seu extrato.

💡 Envie uma nova mensagem para criar outro lançamento.`;
  }
}

function formatarValorComMoeda(
  valor: number,
  idioma: string = "pt-BR"
): string {
  if (idioma === "en-US") {
    // ✅ CORREÇÃO: Mantém o valor e só muda a formatação para USD
    return valor.toLocaleString("en-US", {
      style: "currency",
      currency: "USD", // Mostra como dólar, mas não converte o valor
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }
}

// 🔥 FUNÇÃO AUXILIAR: Traduzir método de pagamento
function traduzirMetodoPagamento(metodo: string, idioma: string): string {
  const mapaPt = {
    CREDITO: "💳 Cartão de Crédito",
    DEBITO: "💳 Cartão de Débito",
    PIX: "📱 PIX",
    DINHEIRO: "💵 Dinheiro",
    TRANSFERENCIA: "🔄 Transferência",
  };

  const mapaEn = {
    CREDITO: "💳 Credit Card",
    DEBITO: "💳 Debit Card",
    PIX: "📱 PIX",
    DINHEIRO: "💵 Cash",
    TRANSFERENCIA: "🔄 Transfer",
  };

  if (idioma === "en-US") {
    return (mapaEn as any)[metodo] || `💳 ${metodo}`;
  } else {
    return (mapaPt as any)[metodo] || `💳 ${metodo}`;
  }
}

function detectarCompartilhamento(mensagem: string): {
  ehCompartilhado: boolean;
  nomeUsuario?: string;
  tipoCompartilhamento?: string;
} {
  console.log(`🔍🔍🔍 DETECÇÃO COMPARTILHAMENTO INICIADA 🔍🔍🔍`);
  console.log(`🔍 Mensagem ORIGINAL: "${mensagem}"`);

  const msgLower = mensagem.toLowerCase();

  // 🔥 CORREÇÃO DEFINITIVA: Verificar por qualquer menção de compartilhamento
  const temCompartilhamento =
    msgLower.includes("compartilhada") ||
    msgLower.includes("compartilhado") ||
    msgLower.includes("compartilhar") ||
    msgLower.includes("dividir") ||
    msgLower.includes("meio a meio");

  console.log(`🔍 Tem compartilhamento: ${temCompartilhamento}`);

  if (!temCompartilhamento) {
    console.log(`❌ Nenhuma menção a compartilhamento encontrada`);
    return { ehCompartilhado: false };
  }

  // 🔥 EXTRAIR NOME DO USUÁRIO - Múltiplas tentativas
  let nomeUsuario = null;

  // Tentativa 1: Padrão "compartilhada com [nome]"
  let match = mensagem.match(/compartilhada com\s+([^\s,.]+)/i);
  if (match && match[1]) {
    nomeUsuario = match[1].trim();
    console.log(`✅ Nome extraído (padrão 1): "${nomeUsuario}"`);
  }

  // Tentativa 2: Padrão "compartilhado com [nome]"
  if (!nomeUsuario) {
    match = mensagem.match(/compartilhado com\s+([^\s,.]+)/i);
    if (match && match[1]) {
      nomeUsuario = match[1].trim();
      console.log(`✅ Nome extraído (padrão 2): "${nomeUsuario}"`);
    }
  }

  // Tentativa 3: Procurar por "beatriz" explicitamente
  if (!nomeUsuario && msgLower.includes("beatriz")) {
    nomeUsuario = "beatriz";
    console.log(`✅ Nome extraído (fallback beatriz): "${nomeUsuario}"`);
  }

  // Tentativa 4: Último recurso - pegar última palavra após "com"
  if (!nomeUsuario) {
    const palavras = mensagem.split(" ");
    const indexCom = palavras.findIndex((p) => p.toLowerCase() === "com");
    if (indexCom !== -1 && indexCom < palavras.length - 1) {
      nomeUsuario = palavras[indexCom + 1].replace(/[.,]/g, "").trim();
      console.log(`✅ Nome extraído (última palavra): "${nomeUsuario}"`);
    }
  }

  if (nomeUsuario) {
    const resultado = {
      ehCompartilhado: true,
      nomeUsuario: nomeUsuario,
      tipoCompartilhamento: msgLower.includes("despesa")
        ? "DESPESA"
        : msgLower.includes("receita")
          ? "RECEITA"
          : undefined,
    };
    console.log(`✅✅✅ COMPARTILHAMENTO CONFIRMADO:`, resultado);
    return resultado;
  }

  console.log(`❌ Compartilhamento detectado mas nome não extraído`);
  return {
    ehCompartilhado: true,
    nomeUsuario: "beatriz", // Fallback
    tipoCompartilhamento: "DESPESA",
  };
}

// SUBSTITUA a função detectarParcelamento por ESTA:
function detectarParcelamento(mensagem: string): {
  ehParcelado: boolean;
  parcelas?: number;
  tipoParcelamento?: string;
} {
  const texto = mensagem.toLowerCase();

  console.log(`🔍🔍🔍 DETECÇÃO PARCELAMENTO INICIADA 🔍🔍🔍`);
  console.log(`🔍 Mensagem: "${texto}"`);

  // 🔥 PADRÕES MAIS FLEXÍVEIS E ABRANGENTES
  const padroesParcelamento = [
    // Padrões específicos
    /parcelad[ao]\s+em\s+(\d+)\s+vezes/i,
    /parcelad[ao]\s+em\s+(\d+)x/i,
    /em\s+(\d+)\s+vezes/i,
    /em\s+(\d+)x/i,
    /(\d+)\s+vezes/i,
    /(\d+)x/i,
    /compra\s+parcelad[ao].*em\s+(\d+)/i,

    // Padrões genéricos - procurar qualquer número após "parcelada" ou "vezes"
    /parcelad[ao].*?(\d+)/i,
    /vezes.*?(\d+)/i,
    /parcelas.*?(\d+)/i,
  ];

  for (const padrao of padroesParcelamento) {
    const match = texto.match(padrao);
    console.log(`🔍 Padrão ${padrao}:`, match);
    if (match && match[1]) {
      const parcelas = parseInt(match[1]);
      if (parcelas > 1 && parcelas <= 24) {
        const resultado = {
          ehParcelado: true,
          parcelas: parcelas,
          tipoParcelamento: "PARCELADO",
        };
        console.log(`✅✅✅ PARCELAMENTO DETECTADO (${padrao}):`, resultado);
        return resultado;
      }
    }
  }

  // 🔥 HOTFIX ULTRA-FLEXÍVEL: Se tem "parcelada" e algum número entre 2-24
  if (
    texto.includes("parcelada") ||
    texto.includes("parcelado") ||
    texto.includes("vezes")
  ) {
    const todosNumeros = texto.match(/\d+/g);
    console.log(`🔍 Todos números encontrados:`, todosNumeros);

    if (todosNumeros) {
      for (const numStr of todosNumeros) {
        const numero = parseInt(numStr);
        if (numero > 1 && numero <= 24) {
          const resultado = {
            ehParcelado: true,
            parcelas: numero,
            tipoParcelamento: "PARCELADO",
          };
          console.log(
            `✅✅✅ PARCELAMENTO DETECTADO (HOTFIX NÚMERO ${numero}):`,
            resultado
          );
          return resultado;
        }
      }
    }
  }

  console.log(`❌ Nenhum parcelamento detectado`);
  return { ehParcelado: false };
}

// 🔥 FUNÇÃO CORRIGIDA: Encontrar usuário por nome com validação
async function encontrarUsuarioPorNome(nome: string, userIdAtual: string) {
  try {
    console.log(
      `🔍 Buscando usuário por nome: "${nome}" (usuário atual: ${userIdAtual})`
    );

    // Buscar todos os usuários (exceto o atual)
    const usuarios = await db.user.findMany({
      where: {
        NOT: { id: userIdAtual },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    console.log(
      `📋 Usuários disponíveis para compartilhamento:`,
      usuarios.map((u) => ({ id: u.id, name: u.name }))
    );

    const nomeBusca = nome.toLowerCase().trim();
    console.log(`🎯 Buscando por: "${nomeBusca}"`);

    let melhorUsuario = null;
    let melhorPontuacao = 0;

    for (const usuario of usuarios) {
      const nomeUsuario = usuario.name.toLowerCase();
      let pontuacao = 0;

      console.log(`🔍 Comparando com: "${nomeUsuario}"`);

      // 🔥 CORREÇÃO: Verificação exata primeiro
      if (nomeUsuario === nomeBusca) {
        console.log(`✅ CORRESPONDÊNCIA EXATA encontrada: ${usuario.name}`);
        return usuario;
      }

      // 🔥 CORREÇÃO: Verificação por partes do nome
      const partesBusca = nomeBusca.split(" ");
      const partesUsuario = nomeUsuario.split(" ");

      // Verificar se alguma parte do nome buscado está no nome do usuário
      for (const parteBusca of partesBusca) {
        if (parteBusca.length > 2) {
          // Ignorar partes muito curtas
          for (const parteUsuario of partesUsuario) {
            if (
              parteUsuario.includes(parteBusca) ||
              parteBusca.includes(parteUsuario)
            ) {
              pontuacao += 1;
              console.log(
                `   ✅ Parte "${parteBusca}" corresponde a "${parteUsuario}"`
              );
            }
          }
        }
      }

      // 🔥 CORREÇÃO: Verificar se é um apelido comum
      const apelidos: { [key: string]: string[] } = {
        claudenir: ["clau", "claudenir", "nenir"],
        beatriz: ["bia", "bea", "beatriz"],
        filho: ["junior", "jr", "filho"],
      };

      for (const [nomeCompleto, variacoes] of Object.entries(apelidos)) {
        if (
          variacoes.includes(nomeBusca) &&
          nomeUsuario.includes(nomeCompleto)
        ) {
          pontuacao += 2;
          console.log(
            `   ✅ Apelido "${nomeBusca}" corresponde a "${nomeCompleto}"`
          );
        }
      }

      if (pontuacao > melhorPontuacao) {
        melhorPontuacao = pontuacao;
        melhorUsuario = usuario;
        console.log(
          `   🏆 Novo melhor usuário: ${usuario.name} (pontuação: ${pontuacao})`
        );
      }
    }

    // 🔥 CORREÇÃO: Só retornar se tiver uma pontuação mínima
    if (melhorUsuario && melhorPontuacao >= 1) {
      console.log(
        `✅ Usuário encontrado: ${melhorUsuario.name} (pontuação: ${melhorPontuacao})`
      );
      return melhorUsuario;
    }

    console.log(`❌ Nenhum usuário adequado encontrado para: "${nome}"`);
    console.log(
      `📊 Melhor pontuação: ${melhorPontuacao} (mínimo necessário: 1)`
    );
    return null;
  } catch (error) {
    console.error("❌ Erro ao buscar usuário:", error);
    return null;
  }
}

async function detectarComandoComIA(
  mensagem: string
): Promise<{ tipo: string | null; idioma?: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    // Fallback manual com detecção de idioma
    const idioma = detectarIdioma(mensagem);
    const comandoManual = detectarComando(mensagem);
    return {
      tipo: comandoManual.tipo,
      idioma,
    };
  }

  const prompt = `Analise esta mensagem e identifique se é um comando específico do sistema financeiro BeCash.

MENSAGEM: "${mensagem}"

COMANDOS SUPORTADOS:
1. LISTAR_CATEGORIAS - Quando o usuário quer ver suas categorias cadastradas
2. VER_SALDO - Quando quer ver seu saldo atual
3. EXTRATO - Quando quer ver extrato/histórico de lançamentos
4. AJUDA - Quando pede ajuda ou não sabe usar
5. NENHUM - Quando não é nenhum comando, mas sim um lançamento financeiro normal

INSTRUÇÕES:
- Identifique a INTENÇÃO do usuário, independente do idioma
- Detecte também o idioma da mensagem (pt-BR, en-US, es-ES, etc)
- Se for um lançamento financeiro, retorne NENHUM
- IMPORTANTE: Se a mensagem contém valores monetários e descrições de compras, é um lançamento (NENHUM)

EXEMPLOS DE LANÇAMENTOS (deve retornar NENHUM):
- "I spent 20 reais on ice cream"
- "Gastei 50 no almoço"
- "I received 1000 salary"
- "Recebi 1000 salário"

EXEMPLOS DE COMANDOS (não deve retornar NENHUM):
- "Which categories do I have?" → LISTAR_CATEGORIAS
- "Help" → AJUDA
- "Show my balance" → VER_SALDO

RESPONDA APENAS NO FORMATO JSON:
{
  "tipo": "LISTAR_CATEGORIAS" | "VER_SALDO" | "EXTRATO" | "AJUDA" | "NENHUM",
  "idioma": "pt-BR" | "en-US" | "es-ES" | "fr-FR" | "de-DE" | etc,
  "confianca": 0.0 a 1.0
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 150,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API: ${response.status}`);
    }

    const data = await response.json();
    const resultado = data.content[0].text.trim();

    console.log(`🤖 Resposta da IA para comando:`, resultado);

    // Extrair JSON (remover markdown se houver)
    const jsonLimpo = resultado.replace(/```json|```/g, "").trim();
    const comandoDetectado = JSON.parse(jsonLimpo);

    console.log(`🎯 Comando detectado:`, comandoDetectado);

    // Se confiança baixa, tratar como lançamento normal
    if (
      comandoDetectado.confianca < 0.7 ||
      comandoDetectado.tipo === "NENHUM"
    ) {
      return {
        tipo: null,
        idioma: comandoDetectado.idioma || detectarIdioma(mensagem),
      };
    }

    return {
      tipo: comandoDetectado.tipo,
      idioma: comandoDetectado.idioma,
    };
  } catch (error) {
    console.error("Erro ao detectar comando com IA:", error);
    // Fallback para detecção manual
    const idioma = detectarIdioma(mensagem);
    const comandoManual = detectarComando(mensagem);
    return {
      tipo: comandoManual.tipo,
      idioma,
    };
  }
}
async function gerarMensagemComIA(
  template: string,
  dados: any,
  idioma: string
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    // Fallback para português
    return template;
  }

  const prompt = `Você é o assistente financeiro BeCash. Gere uma mensagem profissional no idioma ${idioma}.

TEMPLATE BASE (em português):
${template}

DADOS PARA PREENCHER:
${JSON.stringify(dados, null, 2)}

INSTRUÇÕES:
1. Traduza TODA a mensagem para ${idioma}
2. Mantenha a estrutura e formatação (emojis, negrito, separadores)
3. Adapte culturalmente (formato de moeda, datas)
4. Seja profissional e conciso
5. Use formato WhatsApp (markdown simples)

RESPONDA APENAS COM A MENSAGEM TRADUZIDA:`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text.trim();
  } catch (error) {
    console.error("Erro ao gerar mensagem com IA:", error);
    return template; // Fallback
  }
}
async function processarComandoCategorias(
  userPhone: string,
  userId: string,
  idioma: string = "pt-BR"
) {
  try {
    const categorias = await getCategoriasUsuario(userId);

    if (categorias.length === 0) {
      const template =
        "❌ Você ainda não tem categorias cadastradas.\n\n💡 Acesse o app BeCash para criar suas categorias.";
      const mensagem = await gerarMensagemComIA(template, {}, idioma);
      await sendWhatsAppMessage(userPhone, mensagem);
      return;
    }

    const categoriasPorTipo = {
      RECEITA: categorias.filter((c) => c.tipo === "RECEITA"),
      DESPESA: categorias.filter((c) => c.tipo === "DESPESA"),
    };

    // Template em português - será traduzido pela IA
    let templatePT = "*📋 SUAS CATEGORIAS*\n";
    templatePT += "━━━━━━━━━━━━━━\n\n";

    if (categoriasPorTipo.DESPESA.length > 0) {
      templatePT += "*💸 DESPESAS:*\n";
      categoriasPorTipo.DESPESA.forEach((cat, i) => {
        templatePT += `${i + 1}. ${cat.nome}\n`;
      });
      templatePT += "\n";
    }

    if (categoriasPorTipo.RECEITA.length > 0) {
      templatePT += "*💰 RECEITAS:*\n";
      categoriasPorTipo.RECEITA.forEach((cat, i) => {
        templatePT += `${i + 1}. ${cat.nome}\n`;
      });
    }

    templatePT += "\n━━━━━━━━━━━━━━\n";
    templatePT += `✨ Total: ${categorias.length} categoria(s)`;

    // 🔥 Traduzir com IA se não for português
    const mensagemFinal =
      idioma === "pt-BR"
        ? templatePT
        : await gerarMensagemComIA(
            templatePT,
            { categorias: categoriasPorTipo },
            idioma
          );

    await sendWhatsAppMessage(userPhone, mensagemFinal);
  } catch (error) {
    console.error("Erro ao listar categorias:", error);
    const template = "❌ Erro ao buscar suas categorias. Tente novamente.";
    const mensagem = await gerarMensagemComIA(template, {}, idioma);
    await sendWhatsAppMessage(userPhone, mensagem);
  }
}

// 🔥 FUNÇÃO MELHORADA: Limpar descrição com Claude
async function limparDescricaoComClaude(
  descricaoOriginal: string,
  idioma: string = "pt-BR"
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return descricaoOriginal.trim();
  }

  let prompt = "";

  if (idioma === "en-US") {
    prompt = `Analyze this financial transaction description and extract ONLY the name of the establishment, product or service:

ORIGINAL DESCRIPTION: "${descricaoOriginal}"

STRICT RULES:
1. Extract ONLY the name of establishment/product/service
2. COMPLETELY REMOVE:
   - Payment methods (card, credit, debit, cash, nubank, etc.)
   - Monetary values
   - Dates
   - Verbs like "spent", "paid", "received", "bought"
   - Words like "reais", "real", "R$", "dollars", "$"
3. KEEP ONLY 1-2 words that identify WHAT was bought/WHERE it was spent
4. BE CONCISE: maximum 2 words
5. DO NOT INCLUDE payment information, banks or cards

EXAMPLES:
- "uber credit card nubank" → "Uber"
- "supermarket paid 50 reais" → "Supermarket" 
- "lunch at restaurant card" → "Lunch"
- "bought nike shoes installments" → "Nike Shoes"
- "pharmacy drugstore" → "Pharmacy"

CLEANED DESCRIPTION:`;
  } else {
    prompt = `Analise esta descrição de transação financeira e extraia APENAS o nome do estabelecimento, produto ou serviço:

DESCRIÇÃO ORIGINAL: "${descricaoOriginal}"

REGRAS ESTRITAS:
1. EXTRAIA APENAS o nome do estabelecimento/produto/serviço
2. REMOVA COMPLETAMENTE: 
   - Métodos de pagamento (cartão, crédito, débito, pix, nubank, etc.)
   - Valores monetários 
   - Datas
   - Verbos como "gastei", "paguei", "recebi", "comprei"
   - Palavras como "reais", "real", "R$"
3. MANTENHA APENAS 1-2 palavras que identificam O QUE foi comprado/ONDE foi gasto
4. SEJA CONCISO: máximo 2 palavras
5. NÃO INCLUA informações de pagamento, bancos ou cartões

EXEMPLOS:
- "uber cartao credito nubank" → "Uber"
- "mercado paguei 50 reais" → "Mercado" 
- "almoço no restaurante cartao" → "Almoço"
- "comprei tenis nike parcelado" → "Tênis Nike"
- "farmacia drogaria pix" → "Farmácia"

DESCRIÇÃO LIMPA:`;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 100,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API: ${response.status}`);
    }

    const data = await response.json();
    const descricaoLimpa = data.content[0].text.trim();

    console.log(
      `🧹 Descrição limpa com Claude: "${descricaoOriginal}" → "${descricaoLimpa}"`
    );

    // Validação adicional: remover qualquer menção a bancos/cartões que possa ter escapado
    const termosProibidos = [
      "nubank",
      "credito",
      "debito",
      "cartao",
      "cartão",
      "pix",
      "bb",
      "itau",
      "bradesco",
      "santander",
    ];
    let descricaoValidada = descricaoLimpa;

    termosProibidos.forEach((termo) => {
      const regex = new RegExp(`\\s*${termo}\\s*`, "gi");
      descricaoValidada = descricaoValidada.replace(regex, " ");
    });

    // Limpeza final
    descricaoValidada = descricaoValidada.replace(/\s+/g, " ").trim();

    // Se ficou vazio após validação, usar fallback
    if (!descricaoValidada || descricaoValidada.length > 30) {
      // Tentar extrair a primeira palavra substantiva como fallback
      const palavras = descricaoOriginal.split(/\s+/);
      const palavraSubstantiva = palavras.find(
        (palavra) =>
          palavra.length > 2 &&
          !termosProibidos.some((termo) =>
            palavra.toLowerCase().includes(termo)
          )
      );

      descricaoValidada = palavraSubstantiva || "Transação";
      console.log(`🔄 Fallback para descrição: "${descricaoValidada}"`);
    }

    // Capitalizar primeira letra
    if (descricaoValidada.length > 0) {
      descricaoValidada =
        descricaoValidada.charAt(0).toUpperCase() + descricaoValidada.slice(1);
    }

    console.log(`✅ Descrição final: "${descricaoValidada}"`);
    return descricaoValidada;
  } catch (error) {
    console.error("Erro ao limpar descrição com Claude:", error);
    // Fallback inteligente
    const termosProibidos = [
      "nubank",
      "credito",
      "debito",
      "cartao",
      "cartão",
      "pix",
    ];
    const palavras = descricaoOriginal.split(/\s+/);
    const palavraSubstantiva = palavras.find(
      (palavra) =>
        palavra.length > 2 &&
        !termosProibidos.some((termo) => palavra.toLowerCase().includes(termo))
    );

    return palavraSubstantiva
      ? palavraSubstantiva.charAt(0).toUpperCase() + palavraSubstantiva.slice(1)
      : "Transação";
  }
}

// ATUALIZE COMPLETAMENTE a função limparDescricao:
function limparDescricao(descricao: string): string {
  console.log(`🔧🔧🔧 LIMPANDO DESCRIÇÃO INICIADA 🔧🔧🔧`);
  console.log(`📨 Descrição original: "${descricao}"`);

  let descricaoLimpa = descricao.trim();

  // 🔥 PRIMEIRO: Se a descrição contiver partes que sabemos que são lixo
  const padroesLixo = [
    // Remover "reais com", "reais em", etc
    /^reais\s+(?:com|em|no|na)\s+/i,
    // Remover artigos no início
    /^(?:o|a|os|as)\s+/i,
    // Remover "de despesa", "de receita"
    /\s+de\s+(?:despesa|receita)\s*$/i,
  ];

  padroesLixo.forEach((padrao) => {
    const antes = descricaoLimpa;
    descricaoLimpa = descricaoLimpa.replace(padrao, "");
    if (antes !== descricaoLimpa) {
      console.log(
        `🔧 Removido lixo "${padrao}": "${antes}" → "${descricaoLimpa}"`
      );
    }
  });

  // 🔥 SEGUNDO: Remover menções de pagamento (mais agressivo)
  const termosPagamento = [
    "cartão de crédito",
    "cartão de debito",
    "cartão credito",
    "cartão debito",
    "cartão crédito",
    "cartão débito",
    "crédito",
    "débito",
    "debito",
    "nubank",
    "visa",
    "mastercard",
    "elo",
    "hipercard",
    "pix",
    "transferência",
    "transferencia",
    "dinheiro",
    "efetivo",
  ];

  termosPagamento.forEach((termo) => {
    const regex = new RegExp(`\\s*${termo}\\s*`, "gi");
    const antes = descricaoLimpa;
    descricaoLimpa = descricaoLimpa.replace(regex, " ");
    if (antes !== descricaoLimpa) {
      console.log(
        `🔧 Removido pagamento "${termo}": "${antes}" → "${descricaoLimpa}"`
      );
    }
  });

  // 🔥 TERCEIRO: Remover pontuação problemática e espaços extras
  descricaoLimpa = descricaoLimpa
    .replace(/\s*,\s*/g, " ") // Vírgulas viram espaços
    .replace(/\s*\.\s*/g, " ") // Pontos viram espaços
    .replace(/\s+/g, " ") // Múltiplos espaços viram um
    .trim();

  // 🔥 QUARTO: Remover palavras comuns que não agregam
  const palavrasVazias = [
    "reais",
    "real",
    "r$",
    "valor",
    "gastei",
    "paguei",
    "recebi",
    "ganhei",
    "com",
    "em",
    "no",
    "na",
    "do",
    "da",
    "dos",
    "das",
    "de",
  ];

  palavrasVazias.forEach((palavra) => {
    const regex = new RegExp(`\\b${palavra}\\b`, "gi");
    const antes = descricaoLimpa;
    descricaoLimpa = descricaoLimpa.replace(regex, "");
    if (antes !== descricaoLimpa) {
      console.log(
        `🔧 Removido palavra vazia "${palavra}": "${antes}" → "${descricaoLimpa}"`
      );
    }
  });

  // Limpeza final
  descricaoLimpa = descricaoLimpa
    .replace(/\s+/g, " ")
    .replace(/^\s+|\s+$/g, "")
    .trim();

  // 🔥 QUINTO: Se ficou muito curta, tentar inteligência contextual
  if (!descricaoLimpa || descricaoLimpa.length < 2) {
    console.log(`🔧 Descrição muito curta após limpeza: "${descricaoLimpa}"`);

    // Tentar extrair a primeira palavra substantiva da descrição original
    const palavras = descricao.split(/\s+/);
    const palavrasSubstantivas = palavras.filter(
      (palavra) =>
        palavra.length > 2 &&
        !palavrasVazias.includes(palavra.toLowerCase()) &&
        !termosPagamento.some((termo) => palavra.toLowerCase().includes(termo))
    );

    if (palavrasSubstantivas.length > 0) {
      descricaoLimpa = palavrasSubstantivas[0];
      console.log(`🔧 Usando palavra substantiva: "${descricaoLimpa}"`);
    } else {
      descricaoLimpa = "Transação";
      console.log(`🔧 Usando fallback padrão: "${descricaoLimpa}"`);
    }
  }

  // Capitalizar primeira letra
  if (descricaoLimpa.length > 0) {
    descricaoLimpa =
      descricaoLimpa.charAt(0).toUpperCase() + descricaoLimpa.slice(1);
  }

  console.log(
    `🔧🔧🔧 DESCRIÇÃO FINAL LIMPA: "${descricao}" → "${descricaoLimpa}"`
  );

  return descricaoLimpa;
}

// Função para a IA escolher a melhor categoria
async function escolherMelhorCategoria(
  descricao: string,
  categorias: any[],
  tipo: string,
  categoriaSugerida?: string // 🔥 NOVO PARÂMETRO
) {
  if (!process.env.ANTHROPIC_API_KEY) {
    // 🔥 PRIMEIRO: Verificar se o usuário sugeriu uma categoria
    if (categoriaSugerida) {
      console.log(`🎯 Usuário sugeriu categoria: "${categoriaSugerida}"`);

      // Procurar exatamente a categoria sugerida
      const categoriaExata = categorias.find(
        (c) =>
          c.tipo === tipo &&
          c.nome.toLowerCase() === categoriaSugerida.toLowerCase()
      );

      if (categoriaExata) {
        console.log(
          `✅ Usando categoria sugerida pelo usuário: ${categoriaExata.nome}`
        );
        return categoriaExata;
      }

      // Tentar encontrar similar
      const categoriaSimilar = categorias.find(
        (c) =>
          c.tipo === tipo &&
          c.nome.toLowerCase().includes(categoriaSugerida.toLowerCase())
      );

      if (categoriaSimilar) {
        console.log(
          `✅ Usando categoria similar à sugerida: ${categoriaSimilar.nome}`
        );
        return categoriaSimilar;
      }
    }

    // Fallback simples se não tiver API key
    const categoriasFiltradas = categorias.filter((c) => c.tipo === tipo);
    return categoriasFiltradas.length > 0 ? categoriasFiltradas[0] : null;
  }

  const categoriasFiltradas = categorias.filter((c) => c.tipo === tipo);

  if (categoriasFiltradas.length === 0) {
    return null;
  }

  // 🔥 ADICIONE ISSO NO PROMPT DA IA:
  let prompt = `Analise a descrição "${descricao}" e escolha a categoria mais adequada entre estas opções:`;

  // 🔥 SE O USUÁRIO SUGERIU UMA CATEGORIA, PRIORIZE!
  if (categoriaSugerida) {
    prompt += `\n\nIMPORTANTE: O usuário sugeriu a categoria "${categoriaSugerida}". PRIORIZE esta categoria se estiver disponível.`;
  }

  prompt += `\n\nCATEGORIAS DISPONÍVEIS:\n${categoriasFiltradas.map((c, i) => `${i + 1}. ${c.nome}`).join("\n")}`;

  prompt += `\n\nINSTRUÇÕES:\n- Escolha APENAS o nome da categoria mais adequada\n- Não explique, não dê justificativas\n- Retorne apenas o nome exato da categoria escolhida\n- Se o usuário sugeriu uma categoria e ela estiver disponível, USE-A`;

  prompt += `\n\nRESPOSTA (apenas o nome da categoria):`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 100,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API: ${response.status}`);
    }

    const data = await response.json();
    const categoriaEscolhida = data.content[0].text.trim();

    // Encontrar a categoria correspondente
    return (
      categoriasFiltradas.find(
        (c) => c.nome.toLowerCase() === categoriaEscolhida.toLowerCase()
      ) || categoriasFiltradas[0]
    );
  } catch (error) {
    console.error("Erro ao escolher categoria com IA:", error);

    // 🔥 FALLBACK: Se o usuário sugeriu, tentar encontrar
    if (categoriaSugerida) {
      const categoriaFallback = categoriasFiltradas.find((c) =>
        c.nome.toLowerCase().includes(categoriaSugerida.toLowerCase())
      );
      if (categoriaFallback) {
        console.log(
          `🔄 Fallback para categoria sugerida: ${categoriaFallback.nome}`
        );
        return categoriaFallback;
      }
    }

    return categoriasFiltradas[0];
  }
}

// Adicione estas funções ANTES da função extrairDadosLancamento

// ATUALIZE a função extrairMetodoPagamento:
function extrairMetodoPagamento(
  texto: string,
  ehParcelado: boolean = false
): string {
  const textoLower = texto.toLowerCase();

  console.log(`🔍🔍🔍 ANALISANDO MÉTODO PAGAMENTO: "${textoLower}"`);
  console.log(`🔍 É PARCELADO?: ${ehParcelado}`);

  // 🔥 REGRA 1: Se for parcelado, SEMPRE é crédito
  if (ehParcelado) {
    console.log(`✅ PARCELAMENTO DETECTADO - FORÇANDO CRÉDITO`);
    return "CREDITO";
  }

  // 🔥 REGRA 2: Verificar menções EXPLÍCITAS primeiro
  if (textoLower.includes("crédito") || textoLower.includes("credito")) {
    console.log(`✅ MENÇÃO EXPLÍCITA A CRÉDITO DETECTADA`);
    return "CREDITO";
  }

  if (textoLower.includes("débito") || textoLower.includes("debito")) {
    console.log(`✅ MENÇÃO EXPLÍCITA A DÉBITO DETECTADA`);
    return "DEBITO";
  }

  // 🔥 REGRA 3: Se mencionar "cartão" sem especificar, verificar contexto
  if (textoLower.includes("cartão") || textoLower.includes("cartao")) {
    // Se for uma compra parcelada ou mencionar "fatura", é crédito
    if (
      textoLower.includes("parcela") ||
      textoLower.includes("vezes") ||
      textoLower.includes("fatura") ||
      textoLower.includes("meses")
    ) {
      console.log(`✅ CONTEXTO DE CARTÃO COM PARCELAMENTO - CRÉDITO`);
      return "CREDITO";
    }

    // Se mencionar compras típicas de crédito
    const comprasCredito = [
      "ecommerce",
      "online",
      "internet",
      "app",
      "aplicativo",
      "amazon",
      "mercado livre",
      "shopee",
      "aliexpress",
    ];

    if (comprasCredito.some((palavra) => textoLower.includes(palavra))) {
      console.log(`✅ COMPRA ONLINE TÍPICA DE CRÉDITO DETECTADA`);
      return "CREDITO";
    }

    // Default para débito se não houver indicações de crédito
    console.log(`✅ CARTÃO MENCIONADO SEM INDICAÇÃO DE CRÉDITO - DÉBITO`);
    return "DEBITO";
  }

  // 🔥 REGRA 4: Outros métodos
  if (textoLower.includes("pix")) {
    return "PIX";
  } else if (
    textoLower.includes("transferência") ||
    textoLower.includes("transferencia")
  ) {
    return "TRANSFERENCIA";
  } else if (
    textoLower.includes("dinheiro") ||
    textoLower.includes("efetivo")
  ) {
    return "DINHEIRO";
  }

  // 🔥 REGRA 5: Default mais inteligente
  // Se não mencionou método específico, usar PIX como fallback
  console.log(
    `🔍 NENHUM MÉTODO ESPECÍFICO DETECTADO - USANDO PIX COMO FALLBACK`
  );
  return "PIX";
}

// Função para identificar cartão específico
async function identificarCartao(texto: string, userId: string) {
  const textoLower = texto.toLowerCase();

  // Buscar cartões do usuário COM CÁLCULO DOS TOTAIS
  const cartoes = await db.cartao.findMany({
    where: {
      OR: [
        { userId: userId },
        { ColaboradorCartao: { some: { userId: userId } } },
      ],
    },
    include: {
      user: { select: { id: true, name: true } },
      lancamentos: {
        where: {
          pago: false,
          metodoPagamento: "CREDITO",
        },
      },
    },
  });

  console.log(`🔍 Buscando cartão no texto: "${textoLower}"`);
  console.log(
    `📋 Cartões disponíveis:`,
    cartoes.map((c) => ({
      id: c.id,
      nome: c.nome,
      bandeira: c.bandeira,
      limite: c.limite,
      totalLancamentos: c.lancamentos.length,
    }))
  );

  if (cartoes.length === 0) {
    console.log(`❌ Nenhum cartão cadastrado para o usuário`);
    return null;
  }
  // 🔥 CALCULAR TOTAIS PARA CADA CARTÃO (igual à API)
  const cartoesComTotais = cartoes.map((cartao) => {
    const totalUtilizado = cartao.lancamentos.reduce((total, lancamento) => {
      return total + lancamento.valor;
    }, 0);

    const limite = cartao.limite || 0;
    const utilizacaoPercentual =
      limite > 0
        ? (totalUtilizado / limite) * 100
        : totalUtilizado > 0
          ? 100
          : 0;

    return {
      ...cartao,
      totalGasto: totalUtilizado,
      utilizacaoLimite: utilizacaoPercentual,
      limiteDisponivel: limite - totalUtilizado,
    };
  });

  console.log(
    `📊 Cartões com totais calculados:`,
    cartoesComTotais.map((c) => ({
      nome: c.nome,
      limite: c.limite,
      totalGasto: c.totalGasto,
      limiteDisponivel: c.limiteDisponivel,
      utilizacao: c.utilizacaoLimite,
    }))
  );

  // 🔥 Mapeamento inteligente de cartões
  const cartaoMatches = cartoesComTotais.map((cartao) => {
    const nomeCartaoLower = cartao.nome.toLowerCase();
    const bandeiraLower = cartao.bandeira.toLowerCase();

    let pontuacao = 0;
    const palavrasCartao = nomeCartaoLower.split(/[\s-]+/);
    const palavrasTexto = textoLower.split(/[\s,]+/);

    console.log(`🎯 Analisando cartão: "${cartao.nome}"`);
    console.log(
      `   💰 Limite: R$ ${cartao.limite}, Utilizado: R$ ${cartao.totalGasto}, Disponível: R$ ${cartao.limiteDisponivel}`
    );

    // 🔍 1. Busca por nome completo (maior peso)
    if (textoLower.includes(nomeCartaoLower)) {
      pontuacao += 10;
      console.log(`   ✅ Nome completo encontrado (+10)`);
    }

    // 🔍 2. Busca por palavras-chave do nome do cartão
    palavrasCartao.forEach((palavra) => {
      if (palavra.length > 3 && textoLower.includes(palavra)) {
        pontuacao += 5;
        console.log(`   ✅ Palavra "${palavra}" encontrada (+5)`);
      }
    });

    // 🔍 3. Busca por bandeira
    if (textoLower.includes(bandeiraLower)) {
      pontuacao += 4;
      console.log(`   ✅ Bandeira "${cartao.bandeira}" encontrada (+4)`);
    }

    // 🔍 4. Busca por nomes comuns/abreviações
    const mapeamentoCartoes: { [key: string]: string[] } = {
      // Nubank
      nubank: ["nu", "nubank", "nu bank", "roxinho", "roxo"],
      // Itaú
      itau: ["itau", "itau uniclass", "uniclass", "itaú"],
      personnalité: ["personnalité", "personalite", "personalité"],
      // Bradesco
      bradesco: ["bradesco", "brad", "bradesco mastercard"],
      "bradesco elo": ["bradesco elo", "elo nanquim", "nanquim"],
      // Santander
      santander: ["santander", "santa"],
      "santander free": ["santander free", "free"],
      "santander universe": ["universe", "santander universe"],
      // C6
      c6: ["c6", "c6 bank", "c6bank", "carbon"],
      "c6 carbon": ["carbon", "c6 carbon"],
      // Inter
      inter: ["inter", "inter medium", "inter mastercard"],
      // Original
      ourocard: ["ourocard", "ouro", "ouro card", "visa infinite"],
      "ourocard visa infinite": [
        "ourocard visa infinite",
        "visa infinite",
        "infinite",
      ],
      // Nomes de bandeiras comuns
      visa: ["visa"],
      mastercard: ["mastercard", "master"],
      elo: ["elo"],
      "american express": ["american express", "amex", "american"],
      hipercard: ["hipercard", "hiper"],
    };

    // Verificar mapeamentos
    Object.entries(mapeamentoCartoes).forEach(([nomeMapeado, keywords]) => {
      if (nomeCartaoLower.includes(nomeMapeado)) {
        keywords.forEach((keyword) => {
          if (textoLower.includes(keyword)) {
            pontuacao += 3;
            console.log(
              `   ✅ Keyword "${keyword}" para "${nomeMapeado}" (+3)`
            );
          }
        });
      }
    });

    // 🔍 5. Busca por padrões específicos
    const padroesEspeciais = [
      { regex: /(cart[aã]o.*)(nubank|nu\s*bank)/i, cartao: "nubank" },
      { regex: /(cart[aã]o.*)(itau|ita[uú])/i, cartao: "itau" },
      { regex: /(cart[aã]o.*)(bradesco)/i, cartao: "bradesco" },
      { regex: /(cart[aã]o.*)(santander)/i, cartao: "santander" },
      { regex: /(cart[aã]o.*)(c6|c6\s*bank)/i, cartao: "c6" },
      { regex: /(cart[aã]o.*)(inter)/i, cartao: "inter" },
      { regex: /(cart[aã]o.*)(ourocard|ouro\s*card)/i, cartao: "ourocard" },
      { regex: /(visa\s*infinite)/i, cartao: "visa infinite" },
    ];

    padroesEspeciais.forEach((padrao) => {
      if (
        padrao.regex.test(textoLower) &&
        nomeCartaoLower.includes(padrao.cartao)
      ) {
        pontuacao += 8;
        console.log(`   ✅ Padrão especial "${padrao.cartao}" encontrado (+8)`);
      }
    });

    console.log(`   📊 Pontuação final: ${pontuacao}`);

    return {
      cartao,
      pontuacao,
      palavrasCartao,
    };
  });

  // 🔥 Encontrar o cartão com maior pontuação
  cartaoMatches.sort((a, b) => b.pontuacao - a.pontuacao);

  console.log(`🏆 Ranking de cartões:`);
  cartaoMatches.forEach((match, index) => {
    console.log(
      `   ${index + 1}. ${match.cartao.nome}: ${match.pontuacao} pontos`
    );
  });

  // 🔥 Retornar apenas se tiver uma pontuação mínima
  const melhorMatch = cartaoMatches[0];

  if (melhorMatch && melhorMatch.pontuacao >= 3) {
    console.log(
      `✅ Cartão selecionado: ${melhorMatch.cartao.nome} (${melhorMatch.pontuacao} pontos)`
    );
    return melhorMatch.cartao;
  }

  console.log(
    `❌ Nenhum cartão adequado encontrado (melhor pontuação: ${melhorMatch?.pontuacao || 0})`
  );

  // 🔥 Fallback: Primeiro cartão de crédito do usuário (se for mencionado crédito)
  if (textoLower.includes("crédito") || textoLower.includes("credito")) {
    const cartaoCreditoFallback = cartoes.find(
      (c) =>
        c.bandeira &&
        ["VISA", "MASTERCARD", "ELO", "AMERICAN_EXPRESS"].includes(c.bandeira)
    );

    if (cartaoCreditoFallback) {
      console.log(
        `⚠️ Usando fallback de crédito: ${cartaoCreditoFallback.nome}`
      );
      return cartaoCreditoFallback;
    }
  }

  return null;
}
function detectarIdioma(mensagem: string): string {
  const texto = mensagem.toLowerCase();

  // Palavras-chave em inglês
  const palavrasIngles = [
    "i",
    "spent",
    "paid",
    "received",
    "earned",
    "bought",
    "purchased",
    "on",
    "for",
    "at",
    "using",
    "with",
    "my",
    "card",
    "credit",
    "debit",
    "cash",
    "money",
    "dollars",
    "usd",
    "answer",
    "english",
  ];

  // Palavras-chave em português
  const palavrasPortugues = [
    "eu",
    "gastei",
    "paguei",
    "recebi",
    "ganhei",
    "comprei",
    "com",
    "em",
    "no",
    "na",
    "do",
    "da",
    "meu",
    "minha",
    "cartão",
    "crédito",
    "débito",
    "pix",
    "dinheiro",
    "reais",
  ];

  let contadorIngles = 0;
  let contadorPortugues = 0;

  // Verificar palavras-chave (peso maior para verbos)
  const verbosIngles = ["spent", "paid", "received", "earned", "bought"];
  const verbosPortugues = ["gastei", "paguei", "recebi", "ganhei", "comprei"];

  verbosIngles.forEach((verbo) => {
    if (texto.includes(verbo)) contadorIngles += 3; // Peso maior
  });

  verbosPortugues.forEach((verbo) => {
    if (texto.includes(verbo)) contadorPortugues += 3; // Peso maior
  });

  palavrasIngles.forEach((palavra) => {
    if (texto.includes(palavra)) contadorIngles += 1;
  });

  palavrasPortugues.forEach((palavra) => {
    if (texto.includes(palavra)) contadorPortugues += 1;
  });

  console.log(
    `🌐 Contagem idioma: Inglês=${contadorIngles}, Português=${contadorPortugues}`
  );

  if (contadorIngles > contadorPortugues) {
    return "en-US";
  } else {
    return "pt-BR";
  }
}

function extrairMetodoPagamentoInternacional(
  texto: string,
  ehParcelado: boolean = false,
  idioma: string = "pt-BR"
): string {
  const textoLower = texto.toLowerCase();

  console.log(
    `🔍🔍🔍 ANALISANDO MÉTODO PAGAMENTO (${idioma}): "${textoLower}"`
  );
  console.log(`🔍 É PARCELADO?: ${ehParcelado}`);

  // 🔥 REGRA 1: Se for parcelado, SEMPRE é crédito
  if (ehParcelado) {
    console.log(`✅ PARCELAMENTO DETECTADO - FORÇANDO CRÉDITO`);
    return "CREDITO";
  }

  // 🔥 DETECÇÃO EM INGLÊS
  if (idioma === "en-US") {
    if (textoLower.includes("credit card") || textoLower.includes("credit")) {
      console.log(`✅ ENGLISH: Credit card detected`);
      return "CREDITO";
    }
    if (textoLower.includes("debit card") || textoLower.includes("debit")) {
      console.log(`✅ ENGLISH: Debit card detected`);
      return "DEBITO";
    }
    if (textoLower.includes("cash")) {
      return "DINHEIRO";
    }
    if (textoLower.includes("transfer")) {
      return "TRANSFERENCIA";
    }
    // Se mencionar "nubank" ou similar, assumir crédito
    if (textoLower.includes("nubank")) {
      return "CREDITO";
    }
  } else {
    // 🔥 DETECÇÃO EM PORTUGUÊS (existente)
    if (textoLower.includes("crédito") || textoLower.includes("credito")) {
      console.log(`✅ PORTUGUESE: Crédito detectado`);
      return "CREDITO";
    }
    if (textoLower.includes("débito") || textoLower.includes("debito")) {
      console.log(`✅ PORTUGUESE: Débito detectado`);
      return "DEBITO";
    }
    if (textoLower.includes("pix")) {
      return "PIX";
    }
    if (
      textoLower.includes("transferência") ||
      textoLower.includes("transferencia")
    ) {
      return "TRANSFERENCIA";
    }
    if (textoLower.includes("dinheiro") || textoLower.includes("efetivo")) {
      return "DINHEIRO";
    }
  }

  // 🔥 REGRA DEFAULT
  console.log(
    `🔍 NENHUM MÉTODO ESPECÍFICO DETECTADO - USANDO PIX COMO FALLBACK`
  );
  return "PIX";
}

function extrairDadosLancamento(mensagem: string): ResultadoExtracao {
  const texto = mensagem.toLowerCase().trim();
  const idioma = detectarIdioma(mensagem);

  console.log(`🔍🔍🔍 DEBUG COMPLETO INICIADO 🔍🔍🔍`);
  console.log(`📨 Mensagem original: "${mensagem}"`);
  console.log(`🌐 Idioma detectado: ${idioma}`);
  console.log(`🔧 Mensagem lower: "${texto}"`);

  // Detecções
  const compartilhamento = detectarCompartilhamento(mensagem);
  const parcelamento = detectarParcelamento(mensagem);

  console.log(`🎯 Detecções:`, { compartilhamento, parcelamento });

  // 🔥 PADRÕES EM INGLÊS MELHORADOS
  const padroesIngles = [
    // 🔥 PADRÃO 1: "I spent 20 on ice cream"
    /(?:i\s+)?(spent|paid|received|earned|bought|purchased)\s+([\d.,]+)\s+(?:reais?|r\$)?\s*(?:on|for|at|with)\s+(?:the\s+)?([^,.\d]+?)(?=\s*,\s*|\s*\.|\s+card|\s+using|\s+with|\s+via|\s+$)/i,

    // 🔥 PADRÃO 2: "I spent 20 on ice cream using my credit card"
    /(?:i\s+)?(spent|paid|received|earned)\s+([\d.,]+)\s+(?:reais?|r\$)?\s*on\s+(?:the\s+)?([^,.\d]+)/i,

    // 🔥 PADRÃO 3: "I spent 20 at supermarket"
    /(?:i\s+)?(spent|paid|received|earned)\s+([\d.,]+)\s+(?:reais?|r\$)?\s*at\s+(?:the\s+)?([^,.\d]+)/i,

    // 🔥 PADRÃO 4: "I spent 20 for lunch"
    /(?:i\s+)?(spent|paid|received|earned)\s+([\d.,]+)\s+(?:reais?|r\$)?\s*for\s+(?:the\s+)?([^,.\d]+)/i,

    // 🔥 PADRÃO 5: "I bought 20 of ice cream"
    /(?:i\s+)?(bought|purchased)\s+([\d.,]+)\s+(?:reais?|r\$)?\s*(?:of|of\s+the)?\s*([^,.\d]+)/i,

    // 🔥 PADRÃO 6: "Spent 20 on ice cream" (sem "I")
    /(spent|paid|received|earned|bought|purchased)\s+([\d.,]+)\s+(?:reais?|r\$)?\s*(?:on|for|at)\s+(?:the\s+)?([^,.\d]+)/i,

    // 🔥 PADRÃO 7: Formato simples "20 on ice cream"
    /([\d.,]+)\s+(?:reais?|r\$)?\s*(?:on|for|at)\s+(?:the\s+)?([^,.\d]+)/i,
  ];

  const padroesPortugues = [
    // 🔥 PADRÕES PORTUGUÊS (seus padrões existentes)
    /(?:eu\s+)?(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+reais?\s+com\s+(?:o\s+)?([^,.\d]+?)(?=\s*,\s*|\s*\.|\s+cartão|\s+no\s+|\s+do\s+|$)/i,
    /(?:eu\s+)?(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+reais?\s+em\s+(?:o\s+)?([^,.\d]+?)(?=\s*,\s*|\s*\.|\s+cartão|\s+no\s+|\s+do\s+|$)/i,
    /(?:eu\s+)?(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+reais?\s+no\s+(?:o\s+)?([^,.\d]+?)(?=\s*,\s*|\s*\.|\s+cartão|\s+no\s+|\s+do\s+|$)/i,
    /(?:eu\s+)?(gastei|paguei|recebi|ganhei)\s+r\$\s*([\d.,]+)\s+com\s+(?:o\s+)?([^,.\d]+?)(?=\s*,\s*|\s*\.|\s+cartão|\s+no\s+|\s+do\s+|$)/i,
    /(?:eu\s+)?(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+com\s+(.+)/i,
    /(?:eu\s+)?(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+no\s+(.+)/i,
    /(?:eu\s+)?(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+em\s+(.+)/i,
  ];

  // 🔥 ESCOLHER OS PADRÕES CORRETOS BASEADO NO IDIOMA
  const padroesParaTestar =
    idioma === "en-US"
      ? [...padroesIngles, ...padroesPortugues]
      : [...padroesPortugues, ...padroesIngles];

  let melhorMatch = null;
  let melhorPadrao = "";

  for (const padrao of padroesParaTestar) {
    const match = texto.match(padrao);
    console.log(`🔍 Testando padrão ${padrao}:`, match ? "MATCH!" : "null");
    if (match && (!melhorMatch || match[0].length > melhorMatch[0].length)) {
      melhorMatch = match;
      melhorPadrao = padrao.toString();
    }
  }

  console.log(`🏆 Melhor match encontrado:`, melhorMatch);
  console.log(`🎯 Melhor padrão: ${melhorPadrao}`);

  if (melhorMatch) {
    let acao, valor, descricao;

    // 🔥 AJUSTE PARA DIFERENTES FORMATOS DE MATCH
    if (melhorMatch.length >= 4) {
      // Formato padrão: acao, valor, descricao
      acao = melhorMatch[1];
      valor = melhorMatch[2];
      descricao = melhorMatch[3] ? melhorMatch[3].trim() : "";
    } else if (melhorMatch.length === 3) {
      // Formato simples: valor, descricao
      acao = "spent"; // Default
      valor = melhorMatch[1];
      descricao = melhorMatch[2] ? melhorMatch[2].trim() : "";
    } else {
      console.log(`❌ Formato de match inesperado:`, melhorMatch);
      acao = "spent";
      valor = "";
      descricao = "";
    }

    console.log(`📝 Dados brutos extraídos:`, { acao, valor, descricao });

    // 🔥 LIMPEZA DA DESCRIÇÃO
    if (descricao) {
      // Remover "using my" ou "with my" no final
      descricao = descricao.replace(/\s+(?:using|with)\s+my\s+.*$/i, "");
      // Remover "via" no final
      descricao = descricao.replace(/\s+via\s+.*$/i, "");
      // Remover vírgulas extras
      descricao = descricao.replace(/\s*,\s*$/, "");
      descricao = descricao.trim();
    }

    // 🔥 DETECTAR TIPO BASEADO NO IDIOMA E AÇÃO
    let tipo;
    if (idioma === "en-US") {
      tipo =
        acao && (acao.includes("received") || acao.includes("earned"))
          ? "RECEITA"
          : "DESPESA";
    } else {
      tipo =
        acao && (acao.includes("recebi") || acao.includes("ganhei"))
          ? "RECEITA"
          : "DESPESA";
    }

    // Se não conseguiu detectar ação, assumir despesa
    if (!acao || acao === "") {
      tipo = "DESPESA";
    }

    // 🔥 DETECTAR MÉTODO DE PAGAMENTO
    const metodoPagamentoCorrigido = extrairMetodoPagamentoInternacional(
      mensagem,
      parcelamento.ehParcelado,
      idioma
    );

    // 🔥 VALIDAÇÃO FINAL DOS DADOS
    if (!valor || valor === "") {
      console.log(`❌ Valor não extraído`);
      return gerarErroIdioma(
        idioma,
        "Não foi possível extrair o valor da mensagem."
      );
    }

    if (!descricao || descricao === "") {
      console.log(`❌ Descrição não extraída`);
      // Tentar extrair descrição da mensagem original
      const palavras = mensagem.split(/\s+/);
      const possiveisDescricoes = palavras.filter(
        (palavra, index) =>
          index > 1 && // Ignorar "I spent" ou similar
          !/\d+/.test(palavra) && // Não números
          !["on", "for", "at", "with", "using", "via", "my", "the"].includes(
            palavra.toLowerCase()
          )
      );

      if (possiveisDescricoes.length > 0) {
        descricao = possiveisDescricoes.join(" ").trim();
        console.log(`🔄 Descrição extraída do contexto: "${descricao}"`);
      } else {
        descricao = "Transação";
      }
    }

    console.log(`✅ Dados processados:`, {
      tipo,
      valor,
      descricao,
      metodoPagamento: metodoPagamentoCorrigido,
    });

    return {
      sucesso: true,
      dados: {
        tipo,
        valor: valor.replace(",", "."),
        descricao: descricao,
        metodoPagamento: metodoPagamentoCorrigido,
        data: "hoje",
        ehCompartilhado: compartilhamento.ehCompartilhado,
        nomeUsuarioCompartilhado: compartilhamento.nomeUsuario,
        ehParcelado: parcelamento.ehParcelado,
        parcelas: parcelamento.parcelas,
        tipoParcelamento: parcelamento.tipoParcelamento,
      },
    };
  }

  // 🔥 SE NENHUM PADRÃO FUNCIONOU, TENTAR FALLBACK INTELIGENTE
  console.log(`❌ Nenhum padrão funcionou, tentando fallback...`);

  const resultadoFallback = tentarFallbackExtracao(mensagem, idioma);
  if (resultadoFallback) {
    console.log(`✅ Fallback bem-sucedido!`);
    return resultadoFallback;
  }

  // 🔥 MENSAGEM DE ERRO MULTI-IDIOMA
  return gerarErroIdioma(idioma);
}

// Função para criar um lançamento via WhatsApp
async function createLancamento(
  userId: string,
  dados: any,
  categoriaEscolhida: any,
  userMessage: string,
  descricaoLimpa: string, // 🔥 AGORA RECEBE A DESCRIÇÃO JÁ LIMPA
  cartaoEncontrado?: any
) {
  try {
    console.log(`🔥🔥🔥 HOTFIX GLOBAL INICIADO 🔥🔥🔥`);
    console.log(`📨 Mensagem recebida: "${userMessage}"`);

    // HOTFIX compartilhamento
    const msgLower = userMessage?.toLowerCase() || "";
    if (msgLower.includes("compartilhada") && msgLower.includes("beatriz")) {
      dados.ehCompartilhado = true;
      dados.nomeUsuarioCompartilhado = "beatriz";
    }

    // 🔥 CORREÇÃO DA DATA
    let dataLancamento = new Date();
    const offsetBrasilia = -3 * 60;
    dataLancamento.setMinutes(
      dataLancamento.getMinutes() +
        dataLancamento.getTimezoneOffset() +
        offsetBrasilia
    );

    if (dados.data === "ontem") {
      dataLancamento.setDate(dataLancamento.getDate() - 1);
    } else if (dados.data.includes("/")) {
      const [dia, mes, ano] = dados.data.split("/").map(Number);
      dataLancamento = new Date(
        ano || new Date().getFullYear(),
        mes - 1 || new Date().getMonth(),
        dia || new Date().getDate()
      );
    }

    console.log(
      `📅 Data do lançamento (Brasília): ${dataLancamento.toLocaleDateString("pt-BR")}`
    );

    let cartaoId = null;
    let usuarioAlvo = null;

    // ✅ CALCULAR VALOR BASE
    const valorTotal = parseFloat(dados.valor);
    let valorUsuarioCriador = valorTotal;
    let valorCompartilhado = 0;

    console.log(
      `🛒 Dados: Compartilhado=${dados.ehCompartilhado}, Parcelado=${dados.ehParcelado}, Parcelas=${dados.parcelas}`
    );

    // ✅ LÓGICA: Se for crédito, identificar cartão
    if (dados.metodoPagamento === "CREDITO") {
      cartaoEncontrado = await identificarCartao(dados.descricao, userId);
      if (!cartaoEncontrado && userMessage) {
        cartaoEncontrado = await identificarCartao(userMessage, userId);
      }
      if (cartaoEncontrado) {
        cartaoId = cartaoEncontrado.id;
      } else {
        throw new Error("Cartão de crédito mencionado, mas não identificado.");
      }
    }

    // ✅ LÓGICA DE COMPARTILHAMENTO
    if (dados.ehCompartilhado && dados.nomeUsuarioCompartilhado) {
      console.log(
        `🔍 Buscando usuário para compartilhamento: "${dados.nomeUsuarioCompartilhado}"`
      );

      usuarioAlvo = await encontrarUsuarioPorNome(
        dados.nomeUsuarioCompartilhado,
        userId
      );

      if (usuarioAlvo) {
        console.log(
          `✅ Usuário encontrado para compartilhamento: ${usuarioAlvo.name} (${usuarioAlvo.id})`
        );
        valorCompartilhado = valorTotal / 2;
        valorUsuarioCriador = valorTotal / 2;
        console.log(
          `💰 VALORES DIVIDIDOS: Total=${valorTotal}, Seu=${valorUsuarioCriador}, Compartilhado=${valorCompartilhado}`
        );
      } else {
        console.log(
          `❌ Usuário para compartilhamento não encontrado: "${dados.nomeUsuarioCompartilhado}"`
        );
        console.log(`⚠️ Continuando sem compartilhamento...`);
        // Continua sem compartilhamento
        dados.ehCompartilhado = false;
        dados.nomeUsuarioCompartilhado = undefined;
      }
    }

    // 🔥🔥🔥 AGORA A LÓGICA DE PARCELAMENTO
    if (dados.ehParcelado && dados.parcelas && dados.parcelas > 1) {
      console.log(`🔄 CRIANDO PARCELAMENTO: ${dados.parcelas} parcelas`);

      const valorParcela = valorUsuarioCriador / dados.parcelas;
      const valorParcelaCompartilhada = valorCompartilhado / dados.parcelas;

      console.log(
        `💰 VALOR POR PARCELA: Sua parte=${valorParcela}, Compartilhada=${valorParcelaCompartilhada}`
      );

      // Criar primeira parcela (lançamento principal)
      const lancamentoPrincipalData: any = {
        descricao: `${descricaoLimpa} (1/${dados.parcelas})`,
        valor: valorParcela,
        tipo: dados.tipo.toUpperCase(),
        metodoPagamento: dados.metodoPagamento,
        data: dataLancamento,
        categoriaId: categoriaEscolhida.id,
        userId: userId,
        pago: false, // Parcelas de crédito nunca são pagas inicialmente
        tipoParcelamento: "PARCELADO",
        parcelasTotal: dados.parcelas,
        parcelaAtual: 1,
        recorrente: false,
        observacoes:
          `Criado via WhatsApp - Categoria: ${categoriaEscolhida.nome}` +
          (cartaoEncontrado ? ` - Cartão: ${cartaoEncontrado.nome}` : "") +
          (usuarioAlvo ? ` - Compartilhado com: ${usuarioAlvo.name}` : "") +
          ` - Parcelado em ${dados.parcelas}x`,
      };

      if (dados.metodoPagamento === "CREDITO" && cartaoId) {
        lancamentoPrincipalData.cartaoId = cartaoId;
      }

      const lancamentoPrincipal = await db.lancamento.create({
        data: lancamentoPrincipalData,
        include: { categoria: true, cartao: true },
      });

      // ✅ Criar compartilhamento para a primeira parcela se necessário
      if (
        dados.ehCompartilhado &&
        usuarioAlvo &&
        valorParcelaCompartilhada > 0
      ) {
        await db.lancamentoCompartilhado.create({
          data: {
            lancamentoId: lancamentoPrincipal.id,
            usuarioCriadorId: userId,
            usuarioAlvoId: usuarioAlvo.id,
            valorCompartilhado: valorParcelaCompartilhada,
            status: "PENDENTE",
          },
        });
      }

      // ✅ Associar primeira parcela à fatura
      if (dados.metodoPagamento === "CREDITO" && cartaoId) {
        await FaturaService.adicionarLancamentoAFatura(lancamentoPrincipal.id);
      }

      // 🔥 CRIAR PARCELAS FUTURAS
      const parcelasFuturas = [];
      for (let i = 2; i <= dados.parcelas; i++) {
        const dataParcela = new Date(dataLancamento);
        dataParcela.setMonth(dataParcela.getMonth() + (i - 1));

        const parcelaData = {
          descricao: `${descricaoLimpa} (${i}/${dados.parcelas})`,
          valor: valorParcela,
          tipo: dados.tipo.toUpperCase(),
          metodoPagamento: dados.metodoPagamento,
          data: dataParcela,
          categoriaId: categoriaEscolhida.id,
          cartaoId: dados.metodoPagamento === "CREDITO" ? cartaoId : null,
          userId: userId,
          pago: false,
          tipoParcelamento: "PARCELADO",
          parcelasTotal: dados.parcelas,
          parcelaAtual: i,
          recorrente: false,
          lancamentoPaiId: lancamentoPrincipal.id,
          observacoes: `Parcela ${i} de ${dados.parcelas} - Criado via WhatsApp`,
        };

        parcelasFuturas.push(parcelaData);
      }

      // Criar todas as parcelas futuras
      if (parcelasFuturas.length > 0) {
        const parcelasCriadas = await db.lancamento.createManyAndReturn({
          data: parcelasFuturas,
        });

        // ✅ Associar cada parcela futura à sua fatura e criar compartilhamentos
        for (const parcela of parcelasCriadas) {
          if (dados.metodoPagamento === "CREDITO" && cartaoId) {
            await FaturaService.adicionarLancamentoAFatura(parcela.id);
          }

          // ✅ Criar compartilhamento para cada parcela futura
          if (
            dados.ehCompartilhado &&
            usuarioAlvo &&
            valorParcelaCompartilhada > 0
          ) {
            await db.lancamentoCompartilhado.create({
              data: {
                lancamentoId: parcela.id,
                usuarioCriadorId: userId,
                usuarioAlvoId: usuarioAlvo.id,
                valorCompartilhado: valorParcelaCompartilhada,
                status: "PENDENTE",
              },
            });
          }
        }
      }

      console.log(
        `✅ PARCELAMENTO CRIADO: ${dados.parcelas} parcelas de R$ ${valorParcela.toFixed(2)}`
      );

      return {
        lancamento: lancamentoPrincipal,
        cartaoEncontrado,
        usuarioAlvo,
        valorCompartilhado,
        valorUsuarioCriador,
        ehParcelado: true,
        parcelasTotal: dados.parcelas,
        valorParcela: valorParcela,
      };
    }
    if (dados.ehParcelado && dados.metodoPagamento !== "CREDITO") {
      console.log(`🚨 CORREÇÃO AUTOMÁTICA: Parcelamento forçado para CRÉDITO`);
      dados.metodoPagamento = "CREDITO";
    }
    // 🔥 SE NÃO FOR PARCELADO, MANTEM O CÓDIGO ORIGINAL
    const lancamentoData: any = {
      descricao: descricaoLimpa,
      valor: valorUsuarioCriador,
      tipo: dados.tipo.toUpperCase(),
      metodoPagamento: dados.metodoPagamento,
      data: dataLancamento,
      categoriaId: categoriaEscolhida.id,
      userId: userId,
      pago: dados.metodoPagamento !== "CREDITO",
      observacoes:
        `Criado via WhatsApp - Categoria: ${categoriaEscolhida.nome}` +
        (cartaoEncontrado ? ` - Cartão: ${cartaoEncontrado.nome}` : "") +
        (usuarioAlvo ? ` - Compartilhado com: ${usuarioAlvo.name}` : ""),
    };

    if (dados.metodoPagamento === "CREDITO" && cartaoId) {
      lancamentoData.cartaoId = cartaoId;
    }

    const lancamento = await db.lancamento.create({
      data: lancamentoData,
      include: { categoria: true, cartao: true },
    });

    // ✅ Compartilhamento para lançamento único
    if (dados.ehCompartilhado && usuarioAlvo) {
      await db.lancamentoCompartilhado.create({
        data: {
          lancamentoId: lancamento.id,
          usuarioCriadorId: userId,
          usuarioAlvoId: usuarioAlvo.id,
          valorCompartilhado: valorCompartilhado,
          status: "PENDENTE",
        },
      });
    }

    // ✅ Associar à fatura se for crédito
    if (dados.metodoPagamento === "CREDITO" && cartaoId) {
      await FaturaService.adicionarLancamentoAFatura(lancamento.id);
    }

    return {
      lancamento,
      cartaoEncontrado,
      usuarioAlvo,
      valorCompartilhado,
      valorUsuarioCriador,
    };
  } catch (error) {
    console.error("Erro ao criar lançamento:", error);
    throw error;
  }
}

// Função principal do Claude API para criação de lançamentos
async function callClaudeAPICriacao(
  userMessage: string,
  dadosExtracao: any,
  categoriasUsuario: any[],
  categoriaEscolhida: any,
  resultadoCriacao?: any
) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY não configurada");
  }

  let prompt = `Você é o BeCash, um assistente financeiro profissional via WhatsApp. 

MENSAGEM DO CLIENTE: "${userMessage}"

`;

  if (dadosExtracao.sucesso) {
    // 🔥 CORREÇÃO DA DATA: Usar horário de Brasília
    const hoje = new Date();
    const offsetBrasilia = -3 * 60; // UTC-3 em minutos
    hoje.setMinutes(
      hoje.getMinutes() + hoje.getTimezoneOffset() + offsetBrasilia
    );

    let dataFormatada;
    if (dadosExtracao.dados.data === "hoje") {
      dataFormatada = hoje.toLocaleDateString("pt-BR");
    } else if (dadosExtracao.dados.data === "ontem") {
      const ontem = new Date(hoje);
      ontem.setDate(hoje.getDate() - 1);
      dataFormatada = ontem.toLocaleDateString("pt-BR");
    } else if (dadosExtracao.dados.data.includes("/")) {
      dataFormatada = dadosExtracao.dados.data;
    } else {
      dataFormatada = hoje.toLocaleDateString("pt-BR");
    }

    console.log(`📅 Data formatada para resposta: ${dataFormatada}`);

    // Usar a descrição limpa
    const descricao = resultadoCriacao?.sucesso
      ? resultadoCriacao.lancamento.descricao
      : await limparDescricaoComClaude(dadosExtracao.dados.descricao);

    const valorReal = resultadoCriacao?.sucesso
      ? resultadoCriacao.lancamento.valor
      : parseFloat(dadosExtracao.dados.valor);

    console.log(
      `💰💰💰 CLAUDE - Valor REAL: ${valorReal}, Valor extraído: ${dadosExtracao.dados.valor}`
    );

    const valorFormatado = valorReal.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    // E adicione logs:
    console.log(
      `💰 VALOR NO CLAUDE: Extraído=${dadosExtracao.dados.valor}, Real=${valorReal}, Formatado=${valorFormatado}`
    );

    const metodosMap: { [key: string]: string } = {
      PIX: "PIX",
      DEBITO: "Cartão de Débito",
      CREDITO: "Cartão de Crédito",
      TRANSFERENCIA: "Transferência",
    };

    const metodoText = metodosMap[dadosExtracao.dados.metodoPagamento] || "PIX";

    prompt += `
DADOS DO LANÇAMENTO:
• Valor: ${valorFormatado}
• Descrição: ${descricao}
• Categoria: ${categoriaEscolhida?.nome}
• Tipo: ${dadosExtracao.dados.tipo === "DESPESA" ? "Despesa" : "Receita"}
• Método: ${metodoText}
• Data: ${dataFormatada}
`;

    // ✅ ✅ ✅ COLOQUE AQUI:
    if (resultadoCriacao?.usuarioAlvo) {
      prompt += `• Compartilhado com: ${resultadoCriacao.usuarioAlvo.name}\n`;
      prompt += `• Seu valor: R$ ${resultadoCriacao.valorUsuarioCriador.toLocaleString("pt-BR")}\n`;
      prompt += `• Valor compartilhado: R$ ${resultadoCriacao.valorCompartilhado.toLocaleString("pt-BR")}\n`;
    }
    if (resultadoCriacao?.ehParcelado) {
      prompt += `• Parcelado: ${resultadoCriacao.parcelasTotal}x\n`;
      prompt += `• Valor por parcela: R$ ${resultadoCriacao.valorParcela.toLocaleString("pt-BR")}\n`;
    }
    // E depois continua com:
    if (resultadoCriacao?.cartaoEncontrado) {
      prompt += `• Cartão: ${resultadoCriacao.cartaoEncontrado.nome}\n`;
    }

    if (resultadoCriacao) {
      if (resultadoCriacao.erro) {
        prompt += `

ERRO: ${resultadoCriacao.erro}

FORNEÇA UMA MENSAGEM PROFISSIONAL EXPLICANDO O ERRO:`;
      } else {
        prompt += `

✅ LANÇAMENTO REGISTRADO COM SUCESSO!

FORNEÇA UMA CONFIRMAÇÃO NO FORMATO FIXO ABAIXO:`;
      }
    } else {
      prompt += `

CONFIRME OS DADOS NO FORMATO FIXO ABAIXO:`;
    }
  } else {
    prompt += `

NÃO FOI POSSÍVEL IDENTIFICAR UM LANÇAMENTO.

ERRO: ${dadosExtracao.erro}

EXPLIQUE DE FORMA PROFISSIONAL COMO CRIAR UM LANÇAMENTO:`;
  }

  // 🔥 FORMATO FIXO ESTRITO - O Claude DEVE SEGUIR ISSO
  prompt += `

📌 Lançamento Confirmado
━━━━━━━━━━━━━━━

[APENAS OS DETALHES DO LANÇAMENTO AQUI - máximo 5-6 linhas]

━━━━━━━━━━━━━━━  
✨ Obrigado por organizar suas finanças!

🚫 **PROIBIDO:**
- Não adicione "Olá [nome]"
- Não use emojis diferentes 
- Não altere a estrutura
- Não adicione agradecimentos extras
- Não explique nada além dos detalhes

📝 **DETALHES PERMITIDOS (escolha os mais relevantes):**
- Descrição: [descrição limpa]
- Valor: R$ [valor]
- Categoria: [categoria]
- Método: [método pagamento] 
- Cartão: [nome cartão] (apenas se for crédito)
- Data: [data]
- Status: [status] (apenas se for crédito)

**RESPONDA APENAS NO FORMATO ACIMA SEM ALTERAÇÕES:**`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error("Erro ao chamar Claude API:", error);
    throw error;
  }
}

// Função SIMPLIFICADA para enviar mensagem
async function sendWhatsAppMessage(to: string, message: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  console.log("🔑 Enviando mensagem REAL pelo WhatsApp...");
  console.log("👤 Para (recebido):", to);

  if (!phoneNumberId || !accessToken) {
    throw new Error("Credenciais do WhatsApp não configuradas");
  }

  // 🔥 SOLUÇÃO SIMPLES: Se o número tem menos de 12 dígitos, usar formatação fixa
  const apenasNumeros = to.replace(/\D/g, "");
  let numeroWhatsApp = apenasNumeros;

  // Regra FIXA baseada no SEU número real
  if (apenasNumeros === "85991486998" || apenasNumeros === "991486998") {
    // Se receber o número local, converter para internacional
    numeroWhatsApp = "5585991486998";
    console.log(
      `✅ Convertendo local → internacional: ${apenasNumeros} → ${numeroWhatsApp}`
    );
  } else if (apenasNumeros.length === 12 && apenasNumeros.startsWith("55")) {
    // Se já tem 12 dígitos com DDI, adicionar o 9 que falta
    const ddi = "55";
    const ddd = apenasNumeros.substring(2, 4);
    const resto = apenasNumeros.substring(4);
    numeroWhatsApp = ddi + ddd + "9" + resto;
    console.log(
      `✅ Adicionando 9 faltante: ${apenasNumeros} → ${numeroWhatsApp}`
    );
  }

  console.log("👤 Para (enviando):", numeroWhatsApp);
  console.log(`📤 Mensagem (${message.length} chars):`, message);

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: numeroWhatsApp,
          text: { body: message },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Erro ao enviar mensagem WhatsApp:", errorData);
      throw new Error(`Erro WhatsApp: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Mensagem enviada com sucesso:", {
      to: data.contacts?.[0]?.wa_id,
      messageId: data.messages?.[0]?.id,
    });
    return data;
  } catch (error) {
    console.error("💥 Erro no envio WhatsApp:", error);
    throw error;
  }
}

// 🔥 ATUALIZE A FUNÇÃO POST PRINCIPAL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return NextResponse.json({ status: "received" });
    }

    const userPhone = message.from;

    console.log("📱 Tipo de mensagem recebida:", message.type);
    console.log("👤 De:", userPhone);

    // 🔥 PROCESSAR DIFERENTES TIPOS DE MENSAGEM
    if (message.type === "text") {
      await processarMensagemTexto(message);
    } else if (message.type === "audio") {
      await processarAudioWhatsApp(message, userPhone);
    } else {
      console.log(`❌ Tipo de mensagem não suportado: ${message.type}`);
      await sendWhatsAppMessage(
        userPhone,
        "❌ Ainda não consigo processar este tipo de mídia.\n\n💡 Envie apenas mensagens de texto ou áudio com seus lançamentos."
      );
    }

    return NextResponse.json({ status: "received" });
  } catch (error) {
    console.error("💥 Erro geral no webhook:", error);
    return NextResponse.json({ status: "received" });
  }
}
// 🔥 FUNÇÃO AUXILIAR: Gerar erro no idioma correto
function gerarErroIdioma(
  idioma: string,
  mensagemPersonalizada?: string
): ResultadoExtracao {
  let erroMsg = "";

  if (idioma === "en-US") {
    if (mensagemPersonalizada) {
      erroMsg = `I didn't understand: "${mensagemPersonalizada}"`;
    } else {
      erroMsg =
        "I didn't understand the format. Use: 'I spent 50 on lunch' or 'I received 1000 salary' or 'R$ 20 at the supermarket'";
    }
  } else {
    if (mensagemPersonalizada) {
      erroMsg = `Não entendi: "${mensagemPersonalizada}"`;
    } else {
      erroMsg =
        "Não entendi o formato. Use: 'Gastei 50 no almoço' ou 'Recebi 1000 salário' ou 'R$ 20 no mercado'";
    }
  }

  console.log(`❌ ${erroMsg}`);
  return {
    sucesso: false,
    erro: erroMsg,
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const hubMode = url.searchParams.get("hub.mode");
  const hubToken = url.searchParams.get("hub.verify_token");
  const hubChallenge = url.searchParams.get("hub.challenge");

  console.log("🔐 Verificação do webhook:");
  console.log("   Mode:", hubMode);
  console.log("   Token recebido:", hubToken);
  console.log("   Token esperado:", process.env.WHATSAPP_VERIFY_TOKEN);

  if (
    hubMode === "subscribe" &&
    hubToken === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    console.log("✅ Webhook verificado com sucesso!");
    return new Response(hubChallenge, { status: 200 });
  }

  console.log("❌ Falha na verificação");
  return new Response("Verification failed", { status: 403 });
}
