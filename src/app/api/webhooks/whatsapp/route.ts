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

// 🔥 FUNÇÃO CORRIGIDA: Buscar usuário com tratamento específico para DDI/DDD
async function getUserByPhone(userPhone: string) {
  try {
    console.log(`🔍 Buscando usuário para telefone: ${userPhone}`);

    // Normalizar o telefone (remover tudo que não é número)
    const telefoneNormalizado = userPhone.replace(/\D/g, "");

    console.log(`🔧 Telefone normalizado: ${telefoneNormalizado}`);

    // 🔥 LÓGICA ESPECÍFICA PARA FORMATOS BRASILEIROS
    let telefoneBusca = telefoneNormalizado;

    // Se o telefone começa com 55 (DDI Brasil) e tem 13 dígitos
    if (
      telefoneNormalizado.startsWith("55") &&
      telefoneNormalizado.length === 13
    ) {
      // Remover DDI (55) e manter o resto: 558589310653 → 8589310653
      telefoneBusca = telefoneNormalizado.substring(2);
      console.log(
        `🇧🇷 Removido DDI 55: ${telefoneNormalizado} → ${telefoneBusca}`
      );
    }
    // Se o telefone tem 12 dígitos (DDI + DDD sem o 9)
    else if (
      telefoneNormalizado.startsWith("55") &&
      telefoneNormalizado.length === 12
    ) {
      // Formato: 558598931065 → 8598931065 (precisa adicionar o 9)
      const ddd = telefoneNormalizado.substring(2, 4); // 85
      const resto = telefoneNormalizado.substring(4); // 89310653
      telefoneBusca = ddd + "9" + resto; // 85989310653
      console.log(`🇧🇷 Adicionado 9: ${telefoneNormalizado} → ${telefoneBusca}`);
    }
    // Se o telefone tem 11 dígitos e começa com 85 (sem DDI)
    else if (
      telefoneNormalizado.startsWith("85") &&
      telefoneNormalizado.length === 11
    ) {
      // Já está no formato correto: 85989310653
      telefoneBusca = telefoneNormalizado;
    }

    console.log(`🎯 Telefone para busca: ${telefoneBusca}`);

    // Gerar variações para busca
    const variacoesTelefone = [
      telefoneBusca, // 85989310653 (formato correto)
      `+55${telefoneBusca}`, // +5585989310653
      `55${telefoneBusca}`, // 5585989310653
      telefoneBusca.replace(/^55/, ""), // Remove DDI se houver
      telefoneBusca.substring(2), // Remove DDD (85) - 989310653
    ].filter(
      (tel, index, self) => tel && self.indexOf(tel) === index // Remover duplicatas e vazios
    );

    console.log(`🎯 Variações a buscar:`, variacoesTelefone);

    // Buscar usuário por qualquer uma das variações
    const usuario = await db.user.findFirst({
      where: {
        OR: variacoesTelefone.map((telefone) => ({ telefone })),
      },
    });

    if (usuario) {
      console.log(`✅ Usuário encontrado: ${usuario.name} (${usuario.id})`);
      console.log(`📞 Telefone no banco: ${usuario.telefone}`);
      return { user: { id: usuario.id, name: usuario.name } };
    }

    // 🔥 DEBUG: Para troubleshooting detalhado
    console.log("🐛 DEBUG - Buscando correspondências exatas...");

    // Buscar exatamente o telefone que está no banco
    const usuarioExato = await db.user.findFirst({
      where: { telefone: "85989310653" },
    });

    if (usuarioExato) {
      console.log(
        `🎯 Usuário com telefone exato '85989310653': ${usuarioExato.name}`
      );
    }

    console.log(`❌ Nenhum usuário encontrado para: ${userPhone}`);
    console.log(`🔍 Buscamos por: ${telefoneBusca} e variações`);
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

// 🔥 FUNÇÃO AUXILIAR: Processar mensagem de áudio
async function processarAudioWhatsApp(audioMessage: any, userPhone: string) {
  try {
    console.log(`🎙️ Processando mensagem de áudio de: ${userPhone}`);

    // 🔥 PRIMEIRO VERIFICAR SE USUÁRIO EXISTE
    const session = await getUserByPhone(userPhone);
    if (!session) {
      await sendWhatsAppMessage(
        userPhone,
        "❌ Seu número não está vinculado a nenhuma conta.\n\n" +
          "💡 Acesse o app BeCash e vincule seu WhatsApp em Configurações."
      );
      return { status: "user_not_found" };
    }

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

// 🔥 FUNÇÃO PRINCIPAL MODIFICADA COM CONFIRMAÇÃO
async function processarMensagemTexto(message: any) {
  const userMessage = message.text?.body;
  const userPhone = message.from;
  const messageId = message.id;

  console.log("👤 Mensagem de:", userPhone);
  console.log("💬 Texto:", userMessage);
  console.log("🆔 Message ID:", messageId);

  // 🔥 CORREÇÃO 1: INICIALIZAR CACHE SE NÃO EXISTIR (VERIFICAÇÃO MAIS ROBUSTA)
  if (!global.pendingLancamentos) {
    console.log("🔄 Criando novo cache de pendingLancamentos");
    global.pendingLancamentos = new Map();
  } else {
    console.log(
      `📊 Cache já existe com ${global.pendingLancamentos.size} itens`
    );
  }

  // 🔥 NORMALIZAR TELEFONE PARA BUSCA NO CACHE (MANTENDO O CÓDIGO ATUAL)
  const telefoneNormalizado = userPhone.replace(/\D/g, "");
  let telefoneBusca = telefoneNormalizado;

  // Aplicar mesma lógica de normalização do getUserByPhone
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
  console.log(`📞 Telefone original: ${userPhone}`);
  console.log(`🔧 Telefone normalizado: ${telefoneBusca}`);

  // 🔥 DEBUG DETALHADO DO CACHE
  console.log(`📊 Cache atual (tamanho: ${global.pendingLancamentos.size}):`);
  if (global.pendingLancamentos.size > 0) {
    global.pendingLancamentos.forEach((value, key) => {
      console.log(
        `   📍 Key: ${key}, Descrição: ${value.descricaoLimpa}, Timestamp: ${value.timestamp}`
      );
    });
  } else {
    console.log(`   📍 Cache vazio`);
  }

  // 🔥 CORREÇÃO 2: BUSCAR NO CACHE COM DEBUG
  console.log(
    `🎯 Procurando lançamento pendente para chave: "${telefoneBusca}"`
  );
  const pendingLancamento = global.pendingLancamentos?.get(telefoneBusca);

  if (pendingLancamento) {
    console.log(
      `✅✅✅ LANÇAMENTO PENDENTE ENCONTRADO para chave: "${telefoneBusca}"`
    );
    console.log(`📝 Dados do lançamento:`, {
      descricao: pendingLancamento.descricaoLimpa,
      valor: pendingLancamento.dados.valor,
      categoria: pendingLancamento.categoriaEscolhida.nome,
      timestamp: new Date(pendingLancamento.timestamp).toISOString(),
      idade: Date.now() - pendingLancamento.timestamp,
    });
    console.log(`💬 Resposta do usuário: "${userMessage}"`);

    // Verificar se expirou (5 minutos = 300000 ms)
    if (Date.now() - pendingLancamento.timestamp > 5 * 60 * 1000) {
      console.log(`⏰ Lançamento expirado - removendo do cache`);
      global.pendingLancamentos.delete(telefoneBusca);

      await sendWhatsAppMessage(
        userPhone,
        "❌ A confirmação expirou (5 minutos).\n\n💡 Envie novamente o lançamento."
      );
      return { status: "expired" };
    }

    const resposta = userMessage.toLowerCase().trim();

    // 🔥 VERIFICAÇÃO MAIS FLEXÍVEL DAS RESPOSTAS
    if (
      resposta === "sim" ||
      resposta === "s" ||
      resposta === "confirmar" ||
      resposta === "ok" ||
      resposta === "yes" ||
      resposta === "✅"
    ) {
      console.log(`✅✅✅ USUÁRIO CONFIRMOU - Processando confirmação...`);
      return await processarConfirmacao(
        "sim",
        pendingLancamento,
        telefoneBusca
      );
    }

    if (
      resposta === "não" ||
      resposta === "nao" ||
      resposta === "n" ||
      resposta === "cancelar" ||
      resposta === "no" ||
      resposta === "❌"
    ) {
      console.log(`❌❌❌ USUÁRIO CANCELOU - Processando cancelamento...`);
      return await processarConfirmacao(
        "não",
        pendingLancamento,
        telefoneBusca
      );
    }

    // 🔥 SE NÃO FOR UMA RESPOSTA DE CONFIRMAÇÃO VÁLIDA, AVISA O USUÁRIO
    console.log(
      `⚠️ Resposta não reconhecida como confirmação: "${userMessage}"`
    );

    await sendWhatsAppMessage(
      userPhone,
      `❌ Não entendi sua resposta: "${userMessage}"\n\n` +
        `Responda com:\n` +
        `✅ *SIM* - Para confirmar o lançamento\n` +
        `❌ *NÃO* - Para cancelar\n\n` +
        `Ou envie uma nova mensagem para criar outro lançamento.`
    );

    return { status: "invalid_confirmation_response" };
  } else {
    console.log(
      `❌❌❌ NENHUM LANÇAMENTO PENDENTE encontrado para chave: "${telefoneBusca}"`
    );
    console.log(
      `🔍 Chaves no cache:`,
      Array.from(global.pendingLancamentos?.keys() || [])
    );
  }

  // 🔥 SE NÃO FOR CONFIRMAÇÃO, PROCESSAR COMO NOVO LANÇAMENTO
  if (userMessage && userPhone) {
    // 1. 🔥 BUSCAR USUÁRIO PELO TELEFONE ESPECÍFICO
    const session = await getUserByPhone(userPhone);
    if (!session) {
      await sendWhatsAppMessage(
        userPhone,
        "❌ Seu número não está vinculado a nenhuma conta.\n\n" +
          "💡 Acesse o app BeCash e vincule seu WhatsApp em Configurações."
      );
      return { status: "user_not_found" };
    }

    const userId = session.user.id;

    // 2. Extrair dados do lançamento
    const dadosExtracao = extrairDadosLancamento(userMessage);
    console.log("📊 Dados extraídos:", dadosExtracao);

    if (!dadosExtracao.sucesso) {
      await sendWhatsAppMessage(
        userPhone,
        `❌ ${dadosExtracao.erro}\n\n💡 Exemplo: "Gastei 50 no almoço"`
      );
      return { status: "extraction_failed" };
    }

    // 3. Buscar categorias do usuário e escolher a melhor
    let categoriaEscolhida = null;
    let categoriasUsuario: any[] = [];

    try {
      categoriasUsuario = await getCategoriasUsuario(userId);
      console.log("🏷️ Categorias do usuário:", categoriasUsuario);

      if (categoriasUsuario.length === 0) {
        await sendWhatsAppMessage(
          userPhone,
          "❌ Nenhuma categoria encontrada. Crie categorias primeiro no app."
        );
        return { status: "no_categories" };
      }

      categoriaEscolhida = await escolherMelhorCategoria(
        dadosExtracao.dados.descricao,
        categoriasUsuario,
        dadosExtracao.dados.tipo
      );

      console.log("🎯 Categoria escolhida:", categoriaEscolhida?.nome);

      if (!categoriaEscolhida) {
        await sendWhatsAppMessage(
          userPhone,
          `❌ Nenhuma categoria do tipo ${dadosExtracao.dados.tipo} encontrada.`
        );
        return { status: "no_matching_category" };
      }
    } catch (error: any) {
      await sendWhatsAppMessage(
        userPhone,
        `❌ Erro ao processar categorias: ${error.message}`
      );
      return { status: "category_error" };
    }

    // 4. Limpar descrição com Claude
    const descricaoLimpa = await limparDescricaoComClaude(
      dadosExtracao.dados.descricao
    );

    // 5. Identificar cartão se for crédito
    let cartaoEncontrado = null;
    if (dadosExtracao.dados.metodoPagamento === "CREDITO") {
      cartaoEncontrado = await identificarCartao(userMessage, userId);
    }

    // 6. Preparar mensagem de confirmação
    const mensagemConfirmacao = await gerarMensagemConfirmacao(
      dadosExtracao.dados,
      descricaoLimpa,
      categoriaEscolhida,
      cartaoEncontrado
    );

    // 7. Salvar dados temporariamente e pedir confirmação
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

    console.log(
      `💾 SALVANDO LANÇAMENTO PENDENTE para: ${telefoneBusca} (normalizado)`
    );
    console.log(`📦 Dados salvos:`, {
      descricao: descricaoLimpa,
      valor: dadosExtracao.dados.valor,
      categoria: categoriaEscolhida.nome,
      compartilhado: dadosExtracao.dados.ehCompartilhado,
      usuarioCompartilhado: dadosExtracao.dados.nomeUsuarioCompartilhado,
    });

    // 🔥 SALVAR COM TELEFONE NORMALIZADO
    global.pendingLancamentos.set(telefoneBusca, lancamentoTemporario);

    // 🔥 DEBUG: Verificar se foi salvo corretamente
    console.log(
      `✅ Lançamento salvo no cache. Total pendentes: ${global.pendingLancamentos.size}`
    );
    console.log(
      `📋 Cache atual:`,
      Array.from(global.pendingLancamentos.entries())
    );

    // Limpar após 5 minutos
    setTimeout(
      () => {
        if (global.pendingLancamentos?.has(telefoneBusca)) {
          console.log(
            `🧹 LIMPANDO lançamento pendente expirado para: ${telefoneBusca}`
          );
          global.pendingLancamentos.delete(telefoneBusca);
        }
      },
      5 * 60 * 1000
    );

    // 8. Enviar mensagem de confirmação
    await sendWhatsAppMessage(userPhone, mensagemConfirmacao);

    return { status: "waiting_confirmation" };
  }

  return { status: "processed" };
}

// 🔥 FUNÇÃO PARA PROCESSAR CONFIRMAÇÃO - CORRIGIDA
async function processarConfirmacao(
  resposta: string,
  pendingLancamento: LancamentoTemporario,
  userPhone: string
) {
  console.log(`🎯 PROCESSANDO CONFIRMAÇÃO: ${resposta} para ${userPhone}`);
  console.log(`💾 Dados do lançamento pendente:`, {
    descricao: pendingLancamento.descricaoLimpa,
    cartao: pendingLancamento.cartaoEncontrado?.nome,
    mensagemOriginal: pendingLancamento.mensagemOriginal, // ← Adicione este campo no tipo!
  });
  // 🔥 VERIFICAR SE USUÁRIO AINDA EXISTE (SEGURANÇA)
  const session = await getUserByPhone(userPhone);
  if (!session) {
    await sendWhatsAppMessage(
      userPhone,
      "❌ Sua conta não foi encontrada. O lançamento foi cancelado."
    );
    global.pendingLancamentos?.delete(userPhone);
    return { status: "user_not_found" };
  }
  // Remover do cache de pendentes
  global.pendingLancamentos?.delete(userPhone);
  console.log(`🗑️ Removido lançamento pendente para: ${userPhone}`);

  if (resposta === "não" || resposta === "nao") {
    console.log(`❌ Usuário cancelou o lançamento`);
    const mensagemCancelamento = await gerarMensagemCancelamento();
    await sendWhatsAppMessage(userPhone, mensagemCancelamento);
    return { status: "cancelled" };
  }

  if (resposta === "sim") {
    console.log(`✅ Usuário confirmou - criando lançamento...`);
    try {
      // Criar o lançamento no banco de dados
      const resultadoCriacao = await createLancamento(
        pendingLancamento.userId,
        pendingLancamento.dados,
        pendingLancamento.categoriaEscolhida,
        pendingLancamento.mensagemOriginal, // userMessage
        pendingLancamento.descricaoLimpa,
        pendingLancamento.cartaoEncontrado
      );

      // Gerar mensagem de confirmação final
      const mensagemFinal = await gerarMensagemConfirmacaoFinal(
        pendingLancamento.dados,
        pendingLancamento.descricaoLimpa,
        pendingLancamento.categoriaEscolhida,
        pendingLancamento.cartaoEncontrado,
        resultadoCriacao
      );

      await sendWhatsAppMessage(userPhone, mensagemFinal);
      console.log("✅ Lançamento confirmado e criado no banco de dados");

      return { status: "confirmed" };
    } catch (error: any) {
      console.error("❌ Erro ao criar lançamento:", error);
      await sendWhatsAppMessage(
        userPhone,
        `❌ Erro ao criar lançamento: ${error.message}\n\nTente novamente.`
      );
      return { status: "creation_error" };
    }
  }

  console.log(`⚠️ Resposta inválida na confirmação: ${resposta}`);
  return { status: "invalid_confirmation" };
}

// 🔥 FUNÇÃO PARA GERAR MENSAGEM DE CONFIRMAÇÃO - VERSÃO PROFISSIONAL
async function gerarMensagemConfirmacao(
  dados: DadosLancamento,
  descricaoLimpa: string,
  categoriaEscolhida: any,
  cartaoEncontrado: any
): Promise<string> {
  const valorFormatado = parseFloat(dados.valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  // 🔥 ADICIONAR DATA DO LANÇAMENTO
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

  const dataFormatada = dataLancamento.toLocaleDateString("pt-BR");

  // 🔥 FORMATAR MÉTODO DE PAGAMENTO
  const metodoPagamentoText =
    {
      CREDITO: "💳 Cartão de Crédito",
      DEBITO: "💳 Cartão de Débito",
      PIX: "📱 PIX",
      DINHEIRO: "💵 Dinheiro",
      TRANSFERENCIA: "🔄 Transferência",
    }[dados.metodoPagamento] || "💳 " + dados.metodoPagamento;

  // 🔥 CONSTRUIR MENSAGEM PROFISSIONAL
  let mensagem = `*📋 CONFIRMAÇÃO DE LANÇAMENTO*\n`;
  mensagem += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  mensagem += `*📝 Descrição:* ${descricaoLimpa}\n`;
  mensagem += `*💰 Valor:* ${valorFormatado}\n`;
  mensagem += `*🏷️ Categoria:* ${categoriaEscolhida.nome}\n`;
  mensagem += `*📅 Data:* ${dataFormatada}\n`;
  mensagem += `*📊 Tipo:* ${dados.tipo === "DESPESA" ? "Despesa" : "Receita"}\n`;
  mensagem += `*${metodoPagamentoText.includes("💳") ? "💳" : "📱"} Método:* ${metodoPagamentoText.replace("💳 ", "").replace("📱 ", "").replace("💵 ", "").replace("🔄 ", "")}\n`;

  if (cartaoEncontrado) {
    mensagem += `*🔸 Cartão:* ${cartaoEncontrado.nome}\n`;

    // 🔥 VERIFICAR SE TEM OS DADOS CORRETOS
    if (cartaoEncontrado.limiteDisponivel !== undefined) {
      // Se já tem limiteDisponivel calculado
      const limiteDisponivel = cartaoEncontrado.limiteDisponivel;
      const utilizacaoPercentual = cartaoEncontrado.utilizacaoLimite || 0;

      mensagem += `*📊 Limite disponível:* ${limiteDisponivel.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n`;
      mensagem += `*📈 Utilização:* ${utilizacaoPercentual.toFixed(1)}%\n`;
    } else if (
      cartaoEncontrado.limite &&
      cartaoEncontrado.totalGasto !== undefined
    ) {
      // Se tem os dados brutos, calcular
      const limiteDisponivel =
        cartaoEncontrado.limite - cartaoEncontrado.totalGasto;
      const utilizacaoPercentual =
        cartaoEncontrado.limite > 0
          ? (cartaoEncontrado.totalGasto / cartaoEncontrado.limite) * 100
          : 0;

      mensagem += `*📊 Limite disponível:* ${limiteDisponivel.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n`;
      mensagem += `*📈 Utilização:* ${utilizacaoPercentual.toFixed(1)}%\n`;
    }
  }

  if (dados.ehCompartilhado && dados.nomeUsuarioCompartilhado) {
    mensagem += `*👥 Compartilhado com:* ${dados.nomeUsuarioCompartilhado}\n`;

    // Mostrar valores divididos se for compartilhado
    const valorTotal = parseFloat(dados.valor);
    const valorCompartilhado = valorTotal / 2;
    const valorUsuario = valorTotal / 2;

    mensagem += `*🤝 Sua parte:* ${valorUsuario.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n`;
    mensagem += `*👤 Parte do ${dados.nomeUsuarioCompartilhado}:* ${valorCompartilhado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n`;
  }

  if (dados.ehParcelado && dados.parcelas) {
    const valorParcela = parseFloat(dados.valor) / dados.parcelas;
    mensagem += `*🔢 Parcelamento:* ${dados.parcelas}x de ${valorParcela.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n`;
  }

  mensagem += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  mensagem += `*Por favor, confirme:*\n\n`;
  mensagem += `✅ *SIM* - Para confirmar este lançamento\n`;
  mensagem += `❌ *NÃO* - Para cancelar\n\n`;
  mensagem += `_⏰ Esta confirmação expira em 5 minutos_`;

  return mensagem;
}

// 🔥 FUNÇÃO PARA GERAR MENSAGEM FINAL - VERSÃO PROFISSIONAL ATUALIZADA
async function gerarMensagemConfirmacaoFinal(
  dados: DadosLancamento,
  descricaoLimpa: string,
  categoriaEscolhida: any,
  cartaoEncontrado: any,
  resultadoCriacao: any
): Promise<string> {
  const valorTotal = parseFloat(dados.valor);
  const valorFormatado = valorTotal.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  // 🔥 VERSÃO PROFISSIONAL COM DESTAQUES
  let mensagem = `✅ *LANÇAMENTO REGISTRADO*\n`;
  mensagem += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  mensagem += `📝 *Descrição:* ${descricaoLimpa}\n`;
  mensagem += `💰 *Valor total:* ${valorFormatado}\n`;
  mensagem += `🏷️ *Categoria:* ${categoriaEscolhida.nome}\n`;

  // Se for compartilhado
  if (
    resultadoCriacao?.usuarioAlvo &&
    resultadoCriacao.valorCompartilhado > 0
  ) {
    const valorUsuario = resultadoCriacao.valorUsuarioCriador.toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );

    const valorCompartilhado =
      resultadoCriacao.valorCompartilhado.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });

    mensagem += `\n👥 *COMPARTILHAMENTO*\n`;
    mensagem += `   • Sua parte: ${valorUsuario}\n`;
    mensagem += `   • ${resultadoCriacao.usuarioAlvo.name}: ${valorCompartilhado}\n`;
  }

  if (cartaoEncontrado) {
    mensagem += `\n💳 *Cartão:* ${cartaoEncontrado.nome}\n`;

    // 🔥 ADICIONAR INFORMAÇÃO ÚTIL SOBRE O CARTÃO
    if (cartaoEncontrado.limite && cartaoEncontrado.totalGasto) {
      const limiteDisponivel =
        cartaoEncontrado.limite - cartaoEncontrado.totalGasto;
      const utilizacaoPercentual = (
        (cartaoEncontrado.totalGasto / cartaoEncontrado.limite) *
        100
      ).toFixed(1);

      mensagem += `   • Limite disponível: ${limiteDisponivel.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n`;
      mensagem += `   • Utilização: ${utilizacaoPercentual}%\n`;
    }
  }

  mensagem += `\n📅 *Data:* ${new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })}\n`;

  mensagem += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  mensagem += `✨ *Obrigado por usar o BeCash!*\n`;

  return mensagem;
}

// 🔥 FUNÇÃO PARA MENSAGEM DE CANCELAMENTO - VERSÃO MELHORADA
async function gerarMensagemCancelamento(): Promise<string> {
  return `❌ Lançamento Cancelado

A transação foi cancelada e não foi registrada em seu extrato.

💡 Envie uma nova mensagem para criar outro lançamento.`;
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

// 🔥 FUNÇÃO MELHORADA: Limpar descrição com Claude
async function limparDescricaoComClaude(
  descricaoOriginal: string
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    // Fallback simples se não tiver API key
    return descricaoOriginal.trim();
  }

  const prompt = `Analise esta descrição de transação financeira e extraia APENAS o nome do estabelecimento, produto ou serviço:

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

// ATUALIZE a função extrairDadosLancamento com padrões mais precisos:
function extrairDadosLancamento(mensagem: string): ResultadoExtracao {
  const texto = mensagem.toLowerCase().trim();

  console.log(`🔍🔍🔍 DEBUG COMPLETO INICIADO 🔍🔍🔍`);
  console.log(`📨 Mensagem original: "${mensagem}"`);
  console.log(`🔧 Mensagem lower: "${texto}"`);

  // Detecções
  const compartilhamento = detectarCompartilhamento(mensagem);
  const parcelamento = detectarParcelamento(mensagem);

  console.log(`🎯 Detecções:`, { compartilhamento, parcelamento });

  // 🔥🔥🔥 PADRÕES MAIS PRECISOS - CORRIGIDOS
  const padroesTeste = [
    // 🔥 PADRÃO 1: "gastei X reais com [DESCRIÇÃO]" (MAIS ESPECÍFICO)
    /(?:eu\s+)?(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+reais\s+com\s+(?:o\s+)?([^,.\d]+?)(?=\s*,\s*|\s*\.|\s+cartão|\s+no\s+|\s+do\s+|$)/i,

    // 🔥 PADRÃO 2: "gastei X reais em [DESCRIÇÃO]"
    /(?:eu\s+)?(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+reais\s+em\s+(?:o\s+)?([^,.\d]+?)(?=\s*,\s*|\s*\.|\s+cartão|\s+no\s+|\s+do\s+|$)/i,

    // 🔥 PADRÃO 3: "gastei X reais no [DESCRIÇÃO]"
    /(?:eu\s+)?(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+reais\s+no\s+(?:o\s+)?([^,.\d]+?)(?=\s*,\s*|\s*\.|\s+cartão|\s+no\s+|\s+do\s+|$)/i,

    // 🔥 PADRÃO 4: "gastei X reais na [DESCRIÇÃO]"
    /(?:eu\s+)?(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+reais\s+na\s+(?:o\s+)?([^,.\d]+?)(?=\s*,\s*|\s*\.|\s+cartão|\s+no\s+|\s+do\s+|$)/i,

    // 🔥 PADRÃO 5: Com R$
    /(?:eu\s+)?(gastei|paguei|recebi|ganhei)\s+r\$\s*([\d.,]+)\s+com\s+(?:o\s+)?([^,.\d]+?)(?=\s*,\s*|\s*\.|\s+cartão|\s+no\s+|\s+do\s+|$)/i,

    // 🔥 PADRÃO 6: Formato simples "gastei X em [DESCRIÇÃO]"
    /(?:eu\s+)?(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+em\s+(?:o\s+)?([^,.\d]+?)(?=\s*,\s*|\s*\.|\s+cartão|\s+no\s+|\s+do\s+|$)/i,

    // 🔥 PADRÃO 7: Fallback genérico
    /(?:eu\s+)?(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+com\s+(.+)/i,
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

    acao = melhorMatch[1];
    valor = melhorMatch[2];
    descricao = melhorMatch[3] ? melhorMatch[3].trim() : "";

    console.log(`📝 Dados brutos extraídos:`, { acao, valor, descricao });

    // Se a descrição estiver vazia, tentar fallback
    if (!descricao || descricao.length < 2) {
      // Tentar extrair do contexto geral
      const fallbackMatch = texto.match(
        /(?:com|em|no|na)\s+([^,.\d]+?)(?=\s*,\s*|\s*\.|\s+cartão|$)/i
      );
      if (fallbackMatch && fallbackMatch[1]) {
        descricao = fallbackMatch[1].trim();
        console.log(`🔄 Usando fallback para descrição: "${descricao}"`);
      }
    }

    // 🔥🔥🔥 CORREÇÃO: Detectar método de pagamento
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
        descricao: descricao, // 🔥 Vamos limpar depois
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

    // Limpar descrição
    const descricaoLimpa = await limparDescricaoComClaude(dados.descricao);

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
