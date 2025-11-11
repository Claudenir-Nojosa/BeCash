// app/api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { FaturaService } from "@/lib/faturaService";

declare global {
  var messageCache: Map<string, boolean> | undefined;
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

// Função para autenticar via API
async function getApiAuth() {
  const user = await db.user.findFirst();
  return user ? { user: { id: user.id } } : null;
}

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

// 🔥 FUNÇÃO AUXILIAR: Processar mensagem de áudio
async function processarAudioWhatsApp(audioMessage: any, userPhone: string) {
  try {
    console.log(`🎙️ Processando mensagem de áudio de: ${userPhone}`);

    // Transcrever o áudio
    const audioId = audioMessage.audio?.id;
    if (!audioId) {
      throw new Error("ID do áudio não encontrado");
    }

    const textoTranscrito = await transcreverAudioWhatsApp(audioId);

    console.log(`📝 Áudio transcrito: "${textoTranscrito}"`);

    // Agora processar o texto transcrito como uma mensagem normal
    return await processarMensagemTexto({
      type: "text",
      text: { body: textoTranscrito },
      from: userPhone,
      id: audioMessage.id,
    });
  } catch (error: any) {
    console.error("❌ Erro ao processar áudio:", error);

    // Enviar mensagem de erro
    await sendWhatsAppMessage(
      userPhone,
      `❌ Não consegui entender o áudio. Erro: ${error.message}\n\n💡 Tente enviar em texto ou falar mais claramente.`
    );

    throw error;
  }
}

// 🔥 FUNÇÃO PRINCIPAL DE PROCESSAMENTO (extrair da função POST)
async function processarMensagemTexto(message: any) {
  const userMessage = message.text?.body;
  const userPhone = message.from;
  const messageId = message.id;

  console.log("👤 Mensagem de:", userPhone);
  console.log("💬 Texto:", userMessage);
  console.log("🆔 Message ID:", messageId);

  // 🔥 DEDUPLICAÇÃO DE MENSAGENS
  if (messageId) {
    if (!global.messageCache) {
      global.messageCache = new Map();
    }

    const cacheKey = `whatsapp_msg_${messageId}`;
    if (global.messageCache.has(cacheKey)) {
      console.log(
        `🔄 Mensagem ${messageId} já processada - ignorando duplicata`
      );
      return { status: "duplicated" };
    }

    // Adicionar ao cache (expira em 30 segundos)
    global.messageCache.set(cacheKey, true);
    setTimeout(() => {
      global.messageCache?.delete(cacheKey);
    }, 30000);
  }

  if (userMessage && userPhone) {
    // 1. Autenticar usuário
    const session = await getApiAuth();
    if (!session) {
      await sendWhatsAppMessage(
        userPhone,
        "🔐 Sistema em configuração. Em breve poderei criar seus lançamentos!"
      );
      return { status: "no_session" };
    }

    const userId = session.user.id;

    // 2. Extrair dados do lançamento
    const dadosExtracao = extrairDadosLancamento(userMessage);
    console.log("📊 Dados extraídos:", dadosExtracao);

    // 3. Buscar categorias do usuário e escolher a melhor
    let categoriaEscolhida = null;
    let categoriasUsuario: any[] = [];
    let resultadoCriacao = null;

    if (dadosExtracao.sucesso) {
      try {
        // Buscar categorias reais do usuário
        categoriasUsuario = await getCategoriasUsuario(userId);
        console.log("🏷️ Categorias do usuário:", categoriasUsuario);

        if (categoriasUsuario.length === 0) {
          throw new Error(
            "Nenhuma categoria encontrada. Crie categorias primeiro."
          );
        }

        // Escolher a melhor categoria com IA
        categoriaEscolhida = await escolherMelhorCategoria(
          dadosExtracao.dados.descricao,
          categoriasUsuario,
          dadosExtracao.dados.tipo
        );

        console.log("🎯 Categoria escolhida:", categoriaEscolhida?.nome);

        if (!categoriaEscolhida) {
          throw new Error(
            `Nenhuma categoria do tipo ${dadosExtracao.dados.tipo} encontrada.`
          );
        }

        const resultadoCreate = await createLancamento(
          userId,
          dadosExtracao.dados,
          categoriaEscolhida,
          userMessage
        );

        resultadoCriacao = {
          sucesso: true,
          lancamento: resultadoCreate.lancamento,
          cartaoEncontrado: resultadoCreate.cartaoEncontrado,
          usuarioAlvo: resultadoCreate.usuarioAlvo,
          valorCompartilhado: resultadoCreate.valorCompartilhado,
          valorUsuarioCriador: resultadoCreate.valorUsuarioCriador,
        };

        console.log("✅ Lançamento criado:", resultadoCreate.lancamento);
      } catch (error: any) {
        resultadoCriacao = { sucesso: false, erro: error.message };
        console.error("❌ Erro ao criar lançamento:", error);
      }
    }

    // 4. Processar com Claude
    let claudeResponse;
    try {
      claudeResponse = await callClaudeAPICriacao(
        userMessage,
        dadosExtracao,
        categoriasUsuario,
        categoriaEscolhida,
        resultadoCriacao
      );
      console.log("🤖 Resposta do Claude:", claudeResponse);
    } catch (error) {
      console.error("❌ Erro no Claude:", error);
      // Resposta fallback
      if (dadosExtracao.sucesso && resultadoCriacao?.sucesso) {
        claudeResponse = `✅ Lançamento criado! ${dadosExtracao.dados.descricao} - R$ ${dadosExtracao.dados.valor} (Categoria: ${categoriaEscolhida?.nome})`;
      } else if (dadosExtracao.sucesso) {
        claudeResponse = `⚠️ Erro: ${resultadoCriacao?.erro || "Não foi possível criar o lançamento"}`;
      } else {
        claudeResponse = `❌ ${dadosExtracao.erro}\n\n💡 Exemplo: "Gastei 50 no almoço"`;
      }
    }

    // 5. Enviar resposta
    try {
      console.log("📤 Enviando resposta...");
      await sendWhatsAppMessage(userPhone, claudeResponse);
      console.log("🎉 Resposta enviada!");
    } catch (whatsappError) {
      console.error("💥 Falha no envio:", whatsappError);
    }
  }

  return { status: "processed" };
}

// [MANTENHA TODAS AS OUTRAS FUNÇÕES EXISTENTES AQUI]
// detectarCompartilhamento, detectarParcelamento, encontrarUsuarioPorNome,
// limparDescricao, escolherMelhorCategoria, extrairMetodoPagamento,
// identificarCartao, extrairDadosLancamento, createLancamento,
// callClaudeAPICriacao, sendWhatsAppMessage

// ... (cole aqui todas as outras funções que já existiam)

// SUBSTITUA a função detectarCompartilhamento por ESTA:
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

// Função para encontrar usuário pelo nome
async function encontrarUsuarioPorNome(nome: string, userIdAtual: string) {
  try {
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

    // Procurar por nome similar
    const nomeBusca = nome.toLowerCase().trim();

    for (const usuario of usuarios) {
      const nomeUsuario = usuario.name.toLowerCase();

      // Verificação exata ou parcial
      if (
        nomeUsuario === nomeBusca ||
        nomeUsuario.includes(nomeBusca) ||
        nomeBusca.includes(nomeUsuario)
      ) {
        return usuario;
      }
    }

    return null;
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return null;
  }
}

// ATUALIZE a função limparDescricao para ser mais inteligente:
function limparDescricao(descricao: string): string {
  let descricaoLimpa = descricao;

  console.log(`🔧🔧🔧 LIMPANDO DESCRIÇÃO ORIGINAL: "${descricao}"`);

  // Se a descrição for muito longa ou contiver "reais com", extrair a parte importante
  if (descricaoLimpa.includes("reais com")) {
    // Extrair apenas o que vem depois de "reais com"
    const match = descricaoLimpa.match(/reais com\s+(.+)/i);
    if (match && match[1]) {
      descricaoLimpa = match[1];
      console.log(`🔧 Extraído após "reais com": "${descricaoLimpa}"`);
    }
  }

  // 🔥 PRIMEIRO: Remover menções de método de pagamento
  const partesPagamento = [
    /do\s+cartão\s+(?:de\s+)?(?:crédito|débito|credito|debito)\s*/i,
    /no\s+cartão\s+(?:de\s+)?(?:crédito|débito|credito|debito)\s*/i,
    /com\s+cartão\s+(?:de\s+)?(?:crédito|débito|credito|debito)\s*/i,
    /cartão\s+(?:de\s+)?(?:crédito|débito|credito|debito)\s*/i,
    /nubank\s*,?/i,
    /,\s*nubank/i,
  ];

  partesPagamento.forEach((parte) => {
    const antes = descricaoLimpa;
    descricaoLimpa = descricaoLimpa.replace(parte, "");
    if (antes !== descricaoLimpa) {
      console.log(`🔧 Removido pagamento: "${parte}" → "${descricaoLimpa}"`);
    }
  });

  // 🔥 SEGUNDO: Remover TODAS as menções de compartilhamento
  const partesCompartilhamento = [
    /despesa\s+compartilhada\s+com\s+[^,.]+/i,
    /compartilhada\s+com\s+[^,.]+/i,
    /compartilhado\s+com\s+[^,.]+/i,
    /,\s*despesa\s+compartilhada/i,
    /,\s*compartilhada/i,
  ];

  partesCompartilhamento.forEach((parte) => {
    const antes = descricaoLimpa;
    descricaoLimpa = descricaoLimpa.replace(parte, "");
    if (antes !== descricaoLimpa) {
      console.log(
        `🔧 Removido compartilhamento: "${parte}" → "${descricaoLimpa}"`
      );
    }
  });

  // Limpeza final
  descricaoLimpa = descricaoLimpa
    .replace(/\s+/g, " ")
    .replace(/^\s+|\s+$/g, "")
    .replace(/^,\s*|,\s*$/g, "")
    .replace(/^\.\s*|\.\s*$/g, "")
    .trim();

  // Se ficou vazia ou muito curta, usar a categoria como fallback
  if (!descricaoLimpa || descricaoLimpa.length < 2) {
    descricaoLimpa = "Transação";
    console.log(
      `🔧 Descrição ficou vazia, usando fallback: "${descricaoLimpa}"`
    );
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
  tipo: string
) {
  if (!process.env.ANTHROPIC_API_KEY) {
    // Fallback simples se não tiver API key
    const categoriasFiltradas = categorias.filter((c) => c.tipo === tipo);
    return categoriasFiltradas.length > 0 ? categoriasFiltradas[0] : null;
  }

  const categoriasFiltradas = categorias.filter((c) => c.tipo === tipo);

  if (categoriasFiltradas.length === 0) {
    return null;
  }

  const prompt = `Analise a descrição "${descricao}" e escolha a categoria mais adequada entre estas opções:

CATEGORIAS DISPONÍVEIS:
${categoriasFiltradas.map((c, i) => `${i + 1}. ${c.nome}`).join("\n")}

INSTRUÇÕES:
- Escolha APENAS o nome da categoria mais adequada
- Não explique, não dê justificativas
- Retorne apenas o nome exato da categoria escolhida
- Se não houver uma boa correspondência, escolha a primeira categoria

RESPOSTA (apenas o nome da categoria):`;

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

  // Buscar cartões do usuário
  const cartoes = await db.cartao.findMany({
    where: {
      OR: [
        { userId: userId },
        { ColaboradorCartao: { some: { userId: userId } } },
      ],
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  console.log(`🔍 Buscando cartão no texto: "${textoLower}"`);
  console.log(
    `📋 Cartões disponíveis:`,
    cartoes.map((c) => ({ nome: c.nome, bandeira: c.bandeira }))
  );

  // 🔥 CORREÇÃO: Buscar por menções específicas primeiro
  const cartoesKeywords = [
    { nome: "nubank", keywords: ["nubank", "nu bank", "nu"] },
    { nome: "ourocard", keywords: ["ourocard", "visa infinite"] },
    // Adicione outros cartões conforme necessário
  ];

  // Primeiro: buscar por keywords específicas
  for (const cartaoKeyword of cartoesKeywords) {
    for (const keyword of cartaoKeyword.keywords) {
      if (textoLower.includes(keyword)) {
        const cartaoEncontrado = cartoes.find((c) =>
          c.nome.toLowerCase().includes(cartaoKeyword.nome)
        );
        if (cartaoEncontrado) {
          console.log(
            `✅ Cartão encontrado por keyword "${keyword}": ${cartaoEncontrado.nome}`
          );
          return cartaoEncontrado;
        }
      }
    }
  }

  // Segundo: buscar por nome exato
  for (const cartao of cartoes) {
    const nomeCartaoLower = cartao.nome.toLowerCase();
    if (textoLower.includes(nomeCartaoLower)) {
      console.log(`✅ Cartão encontrado por nome exato: ${cartao.nome}`);
      return cartao;
    }
  }

  // Terceiro: NÃO usar fallback - lançar erro se não encontrou
  console.log(`❌ Nenhum cartão específico encontrado para: "${textoLower}"`);
  return null;
}

// ATUALIZE a função extrairDadosLancamento para corrigir a extração:
function extrairDadosLancamento(mensagem: string): ResultadoExtracao {
  const texto = mensagem.toLowerCase().trim();

  console.log(`🔍🔍🔍 DEBUG COMPLETO INICIADO 🔍🔍🔍`);
  console.log(`📨 Mensagem original: "${mensagem}"`);
  console.log(`🔧 Mensagem lower: "${texto}"`);

  // Detecções
  const compartilhamento = detectarCompartilhamento(mensagem);
  const parcelamento = detectarParcelamento(mensagem);

  console.log(`🎯 Detecções:`, { compartilhamento, parcelamento });

  // 🔥🔥🔥 PADRÕES MAIS ESPECÍFICOS - CORRIGIDOS
  const padroesTeste = [
    // 🔥 PADRÃO MAIS ESPECÍFICO para "gastei X reais com Y"
    /(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+reais\s+com\s+([^,.\d]+?)(?=,|\.|\s+do\s+cartão|\s+no\s+cartão|\s+despesa|$)/i,
    /(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+reais\s+em\s+([^,.\d]+?)(?=,|\.|\s+do\s+cartão|\s+no\s+cartão|\s+despesa|$)/i,
    /(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+reais\s+na\s+([^,.\d]+?)(?=,|\.|\s+do\s+cartão|\s+no\s+cartão|\s+despesa|$)/i,
    /(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+reais\s+no\s+([^,.\d]+?)(?=,|\.|\s+do\s+cartão|\s+no\s+cartão|\s+despesa|$)/i,

    // Padrões com R$
    /(gastei|paguei|recebi|ganhei)\s+r\$\s*([\d.,]+)\s+com\s+([^,.\d]+?)(?=,|\.|\s+do\s+cartão|\s+no\s+cartão|\s+despesa|$)/i,
    /(gastei|paguei|recebi|ganhei)\s+r\$\s*([\d.,]+)\s+em\s+([^,.\d]+?)(?=,|\.|\s+do\s+cartão|\s+no\s+cartão|\s+despesa|$)/i,

    // Padrões genéricos (fallback)
    /(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+com\s+(.+)/i,
    /(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+em\s+(.+)/i,
    /(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+(.+)/i,
  ];

  let melhorMatch = null;
  let melhorPadrao = "";

  for (const padrao of padroesTeste) {
    const match = texto.match(padrao);
    console.log(`🔍 Testando padrão ${padrao}:`, match);
    if (match && (!melhorMatch || match[0].length > melhorMatch[0].length)) {
      melhorMatch = match;
      melhorPadrao = padrao.toString();
    }
  }

  console.log(`🏆 Melhor match encontrado:`, melhorMatch);
  console.log(`🎯 Melhor padrão: ${melhorPadrao}`);

  if (melhorMatch) {
    let acao, valor, descricao;

    // 🔥 LÓGICA CORRIGIDA - sempre pegar o terceiro grupo para descrição
    acao = melhorMatch[1];
    valor = melhorMatch[2];
    descricao = melhorMatch[3] ? melhorMatch[3].trim() : "";

    console.log(`📝 Dados brutos extraídos:`, { acao, valor, descricao });

    // 🔥🔥🔥 CORREÇÃO: Detectar método de pagamento com info do parcelamento
    const metodoPagamentoCorrigido = extrairMetodoPagamento(
      mensagem,
      parcelamento.ehParcelado
    );

    let tipo =
      acao.includes("recebi") || acao.includes("ganhei")
        ? "RECEITA"
        : "DESPESA";

    if (compartilhamento.tipoCompartilhamento) {
      tipo = compartilhamento.tipoCompartilhamento;
    }

    console.log(`📝 Dados processados:`, {
      acao,
      valor,
      descricao,
      metodoPagamento: metodoPagamentoCorrigido,
      tipo,
    });

    return {
      sucesso: true,
      dados: {
        tipo,
        valor: valor.replace(",", "."),
        descricao: descricao, // 🔥 NÃO limpar aqui - vamos limpar depois
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

  console.log(`❌ Nenhum padrão funcionou`);
  return {
    sucesso: false,
    erro: "Não entendi o formato. Use: 'Gastei 50 no almoço' ou 'Recebi 1000 salário' ou 'R$ 20 no mercado'",
  };
}

// Função para criar um lançamento via WhatsApp
async function createLancamento(
  userId: string,
  dados: any,
  categoriaEscolhida: any,
  userMessage: string
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

    // Limpar descrição
    const descricaoLimpa = limparDescricao(dados.descricao);

    let cartaoId = null;
    let cartaoEncontrado = null;
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
      usuarioAlvo = await encontrarUsuarioPorNome(
        dados.nomeUsuarioCompartilhado,
        userId
      );
      if (usuarioAlvo) {
        valorCompartilhado = valorTotal / 2;
        valorUsuarioCriador = valorTotal / 2;
        console.log(
          `💰 VALORES DIVIDIDOS: Total=${valorTotal}, Seu=${valorUsuarioCriador}, Compartilhado=${valorCompartilhado}`
        );
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
      : limparDescricao(dadosExtracao.dados.descricao);

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

// Função REAL para enviar mensagem pelo WhatsApp Business API
async function sendWhatsAppMessage(to: string, message: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  console.log("🔑 Enviando mensagem REAL pelo WhatsApp...");
  console.log("📱 Phone Number ID:", phoneNumberId);
  console.log("👤 Para:", to);

  if (!phoneNumberId || !accessToken) {
    throw new Error("Credenciais do WhatsApp não configuradas");
  }

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
          to: to,
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
    console.log("✅ Mensagem enviada com sucesso:", data);
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
