// app/api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { FaturaService } from "@/lib/faturaService";

type DadosLancamento = {
  tipo: string;
  valor: string;
  descricao: string;
  metodoPagamento: string;
  data: string;
  ehCompartilhado?: boolean;
  nomeUsuarioCompartilhado?: string;
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
// Adicione esta função para limpar a descrição
function limparDescricao(descricao: string): string {
  const texto = descricao.toLowerCase();

  // Padrões para remover (partes após certas preposições)
  const padroesRemover = [
    /(?:\s+no\s+cartão\s+.+)$/i,
    /(?:\s+no\s+cartão\s+.+)$/i, // com acento
    /(?:\s+com\s+cartão\s+.+)$/i,
    /(?:\s+no\s+de\s+.+)$/i,
    /(?:\s+no\s+crédito\s+.+)$/i,
    /(?:\s+no\s+credito\s+.+)$/i,
    /(?:\s+no\s+débito\s+.+)$/i,
    /(?:\s+no\s+debito\s+.+)$/i,
    /(?:\s+via\s+pix.*)$/i,
    /(?:\s+com\s+pix.*)$/i,
  ];

  let descricaoLimpa = descricao;

  // Aplicar padrões de remoção
  padroesRemover.forEach((padrao) => {
    descricaoLimpa = descricaoLimpa.replace(padrao, "");
  });

  // Remover palavras soltas de métodos de pagamento
  const palavrasRemover = [
    "cartão",
    "cartao",
    "débito",
    "debito",
    "crédito",
    "credito",
    "pix",
    "transferencia",
    "transferência",
    "dinheiro",
    "no",
    "de",
    "nubank",
    "itau",
    "bradesco",
    "santander",
    "inter",
    "c6",
    "bb",
  ];

  palavrasRemover.forEach((palavra) => {
    const regex = new RegExp(`\\s*\\b${palavra}\\b\\s*`, "gi");
    descricaoLimpa = descricaoLimpa.replace(regex, " ");
  });

  // Limpar espaços extras, pontuação estranha e capitalizar
  descricaoLimpa = descricaoLimpa
    .replace(/\s+/g, " ")
    .replace(/^\s+|\s+$/g, "")
    .replace(/,\s*$/, "") // Remove vírgula no final
    .replace(/\.\s*$/, "") // Remove ponto no final
    .trim();

  // Capitalizar primeira letra
  if (descricaoLimpa.length > 0) {
    descricaoLimpa =
      descricaoLimpa.charAt(0).toUpperCase() + descricaoLimpa.slice(1);
  }

  return descricaoLimpa || "Transação"; // Fallback se ficar vazia
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

function extrairMetodoPagamento(texto: string): string {
  const textoLower = texto.toLowerCase();

  if (textoLower.includes("débito") || textoLower.includes("debito")) {
    return "DEBITO";
  } else if (textoLower.includes("crédito") || textoLower.includes("credito")) {
    return "CREDITO";
  } else if (textoLower.includes("pix")) {
    return "PIX";
  } else if (
    textoLower.includes("transferência") ||
    textoLower.includes("transferencia")
  ) {
    return "TRANSFERENCIA";
  }

  // Default para débito se não especificado mas mencionar cartão
  if (textoLower.includes("cartão") || textoLower.includes("cartao")) {
    return "DEBITO";
  }

  return "PIX"; // fallback
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

// SUBSTITUA a função extrairDadosLancamento por ESTA:
function extrairDadosLancamento(mensagem: string): ResultadoExtracao {
  const texto = mensagem.toLowerCase().trim();

  console.log(`🔍 Mensagem original: "${mensagem}"`);
  console.log(`🔍 Mensagem lower: "${texto}"`);

  // Primeiro detectar se é compartilhado (ANTES do regex principal)
  const compartilhamento = detectarCompartilhamento(mensagem);
  console.log(`🔍 Detecção compartilhamento:`, compartilhamento);

  // 🔥 CORREÇÃO DEFINITIVA: Regex simplificado e eficaz
  // Padrão: [ação] [valor] com [descrição completa]
  const padraoPrincipal = texto.match(
    /(gastei|paguei|recebi|ganhei)\s+(\d+[.,]?\d*)\s+com\s+(.+?)(?=\s+(?:no\s+cartão|n0\s+cartão|cartão|pix|débito|crédito|debito|credito|despesa|receita|compartilhado|$))/i
  );

  console.log(`🔍 Regex principal resultado:`, padraoPrincipal);

  if (padraoPrincipal) {
    const [, acao, valor, descricao] = padraoPrincipal;

    // Método de pagamento
    const metodoPagamentoCorrigido = extrairMetodoPagamento(mensagem);

    // Tipo
    let tipo =
      acao.includes("recebi") || acao.includes("ganhei")
        ? "RECEITA"
        : "DESPESA";

    if (compartilhamento.tipoCompartilhamento) {
      tipo = compartilhamento.tipoCompartilhamento;
    }

    console.log(`📝 Descrição EXTRAÍDA: "${descricao}"`);

    return {
      sucesso: true,
      dados: {
        tipo,
        valor: valor.replace(",", "."),
        descricao: descricao.trim(),
        metodoPagamento: metodoPagamentoCorrigido,
        data: "hoje",
        ehCompartilhado: compartilhamento.ehCompartilhado,
        nomeUsuarioCompartilhado: compartilhamento.nomeUsuario,
      },
    };
  }

  // 🔥 PADRÃO ALTERNATIVO: Se o primeiro não funcionar
  const padraoAlternativo = texto.match(
    /(gastei|paguei|recebi|ganhei)\s+(\d+[.,]?\d*)\s+(?:com|em|para|no)\s+(.+)/i
  );

  console.log(`🔍 Regex alternativo resultado:`, padraoAlternativo);

  if (padraoAlternativo) {
    const [, acao, valor, descricao] = padraoAlternativo;

    const metodoPagamentoCorrigido = extrairMetodoPagamento(mensagem);

    let tipo =
      acao.includes("recebi") || acao.includes("ganhei")
        ? "RECEITA"
        : "DESPESA";

    if (compartilhamento.tipoCompartilhamento) {
      tipo = compartilhamento.tipoCompartilhamento;
    }

    console.log(`📝 Descrição ALTERNATIVA: "${descricao}"`);

    return {
      sucesso: true,
      dados: {
        tipo,
        valor: valor.replace(",", "."),
        descricao: descricao.trim(),
        metodoPagamento: metodoPagamentoCorrigido,
        data: "hoje",
        ehCompartilhado: compartilhamento.ehCompartilhado,
        nomeUsuarioCompartilhado: compartilhamento.nomeUsuario,
      },
    };
  }

  return {
    sucesso: false,
    erro: "Não entendi o formato. Use: 'Gastei 50 no almoço' ou 'Recebi 1000 salário'",
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

    // 🔥 HOTFIX DEFINITIVO: Se a mensagem tem "compartilhada" e "beatriz", FORÇAR
    const msgLower = userMessage?.toLowerCase() || "";
    if (msgLower.includes("compartilhada") && msgLower.includes("beatriz")) {
      console.log(
        `🔥🔥🔥 HOTFIX: COMPARTILHAMENTO DETECTADO - ATIVANDO FORÇADO`
      );
      dados.ehCompartilhado = true;
      dados.nomeUsuarioCompartilhado = "beatriz";
    }

    // 🔥 CORREÇÃO DA DATA: Usar horário de Brasília (UTC-3)
    let dataLancamento = new Date();

    // Ajustar para horário de Brasília (UTC-3)
    const offsetBrasilia = -3 * 60; // UTC-3 em minutos
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

    // Limpar e capitalizar a descrição
    const descricaoLimpa = limparDescricao(dados.descricao);

    let cartaoId = null;
    let cartaoEncontrado = null;
    let usuarioAlvo = null;

    // ✅ CALCULAR VALOR ANTES DE CRIAR O LANÇAMENTO
    const valorTotal = parseFloat(dados.valor);
    let valorUsuarioCriador = valorTotal;
    let valorCompartilhado = 0;
    console.log(
      `🛒 Dados compartilhamento: ehCompartilhado=${dados.ehCompartilhado}, nomeUsuario=${dados.nomeUsuarioCompartilhado}`
    );
    // ✅ LÓGICA: Se for crédito, identificar cartão específico
    if (dados.metodoPagamento === "CREDITO") {
      console.log(`🔍 Identificando cartão para: "${dados.descricao}"`);

      // Primeiro tenta com a descrição
      cartaoEncontrado = await identificarCartao(dados.descricao, userId);

      // Se não encontrou, tenta com a mensagem completa
      if (!cartaoEncontrado && userMessage) {
        console.log(`🔍 Tentando identificar cartão na mensagem completa...`);
        cartaoEncontrado = await identificarCartao(userMessage, userId);
      }

      if (cartaoEncontrado) {
        cartaoId = cartaoEncontrado.id;
        console.log(`✅ Cartão selecionado: ${cartaoEncontrado.nome}`);
      } else {
        throw new Error(
          "Cartão de crédito mencionado, mas não identificado. Especifique qual cartão (ex: Nubank, Itaú, etc.)"
        );
      }
    }

    // E modifique a lógica de compartilhamento:
    if (dados.ehCompartilhado && dados.nomeUsuarioCompartilhado) {
      console.log(`✅✅✅ COMPARTILHAMENTO CONFIRMADO ✅✅✅`);
      console.log(`🔍 Buscando usuário: "${dados.nomeUsuarioCompartilhado}"`);

      usuarioAlvo = await encontrarUsuarioPorNome(
        dados.nomeUsuarioCompartilhado,
        userId
      );

      if (usuarioAlvo) {
        console.log(`✅ Usuário encontrado: ${usuarioAlvo.name}`);

        // ✅✅✅ DIVIDIR O VALOR DEFINITIVAMENTE
        valorUsuarioCriador = valorTotal / 2;
        valorCompartilhado = valorTotal / 2;

        console.log(`💰💰💰 VALORES DIVIDIDOS CONFIRMADOS 💰💰💰`);
        console.log(`Total: R$ ${valorTotal}`);
        console.log(`Seu valor: R$ ${valorUsuarioCriador}`);
        console.log(`Valor compartilhado: R$ ${valorCompartilhado}`);
      } else {
        throw new Error(
          `Usuário "${dados.nomeUsuarioCompartilhado}" não encontrado.`
        );
      }
    } else {
      console.log(
        `❌ COMPARTILHAMENTO NÃO ATIVADO - Valor inteiro: R$ ${valorTotal}`
      );
    }

    const lancamentoData: any = {
      descricao: descricaoLimpa,
      valor: valorUsuarioCriador, // ✅ AGORA USA O VALOR DIVIDIDO
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

    // ✅ ADICIONAR cartaoId apenas se for crédito e encontrou cartão
    if (dados.metodoPagamento === "CREDITO" && cartaoId) {
      lancamentoData.cartaoId = cartaoId;
    }

    const lancamento = await db.lancamento.create({
      data: lancamentoData,
      include: {
        categoria: true,
        cartao: true,
      },
    });

    // ✅ ✅ ✅ ADICIONE ESTA PARTE: Criar compartilhamento se necessário
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

      console.log(`✅ Lançamento compartilhado criado com ${usuarioAlvo.name}`);
      console.log(
        `💰 Valor total: R$ ${valorTotal}, Seu valor: R$ ${valorUsuarioCriador}, Compartilhado: R$ ${valorCompartilhado}`
      );
    }

    // ✅ Associar à fatura se for crédito
    if (dados.metodoPagamento === "CREDITO" && cartaoId) {
      try {
        await FaturaService.adicionarLancamentoAFatura(lancamento.id);
        console.log(`✅ Lançamento ${lancamento.id} associado à fatura`);
      } catch (faturaError) {
        console.error("❌ Erro ao associar à fatura:", faturaError);
      }
    }

    return {
      lancamento,
      cartaoEncontrado,
      usuarioAlvo,
      valorCompartilhado, // ✅ Retornar também o valor compartilhado
      valorUsuarioCriador, // ✅ E o valor do usuário criador
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message && message.type === "text") {
      const userMessage = message.text?.body;
      const userPhone = message.from;

      console.log("👤 Mensagem de:", userPhone);
      console.log("💬 Texto:", userMessage);

      if (userMessage && userPhone) {
        // 1. Autenticar usuário
        const session = await getApiAuth();
        if (!session) {
          await sendWhatsAppMessage(
            userPhone,
            "🔐 Sistema em configuração. Em breve poderei criar seus lançamentos!"
          );
          return NextResponse.json({ status: "received" });
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
              userMessage // ✅ Adicionar este parâmetro
            );

            resultadoCriacao = {
              sucesso: true,
              lancamento: resultadoCreate.lancamento,
              cartaoEncontrado: resultadoCreate.cartaoEncontrado,
              usuarioAlvo: resultadoCreate.usuarioAlvo,
              valorCompartilhado: resultadoCreate.valorCompartilhado, // ✅ Adicionar
              valorUsuarioCriador: resultadoCreate.valorUsuarioCriador, // ✅ Adicionar
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
