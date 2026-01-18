import { DadosLancamento, ResultadoExtracao } from "../types";
import { detectarIdioma, detectarCompartilhamento, detectarParcelamento } from "./detectors";

// NOVA FUNÇÃO: Detectar divisão personalizada
export function detectarDivisaoPersonalizada(texto: string): {
  tipo: 'metade' | 'porcentagem' | 'valor_fixo';
  valor?: number;
} | null {
  const lower = texto.toLowerCase();
  
  // Padrões para porcentagem: "eu pago 60%", "minha parte é 70 por cento"
  const porcentagemMatch = lower.match(/(eu\s+pago|minha\s+parte[ée]?|eu\s+fico\s+com|eu\s+assumo)\s*(\d{1,3})\s*(%|por\s+cento|porcento)/);
  if (porcentagemMatch) {
    const porcentagem = parseInt(porcentagemMatch[2]);
    if (porcentagem >= 0 && porcentagem <= 100) {
      console.log(`✅ Divisão por porcentagem detectada: ${porcentagem}%`);
      return { tipo: 'porcentagem', valor: porcentagem };
    }
  }
  
  // Padrões para valor fixo: "eu pago 6 reais", "minha parte é 25"
  const valorMatch = lower.match(/(eu\s+pago|minha\s+parte[ée]?|eu\s+fico\s+com|eu\s+assumo)\s*(r\$?\s*)?(\d+([.,]\d{1,2})?)\s*(?:reais?)?/);
  if (valorMatch) {
    const valorTexto = valorMatch[3].replace(',', '.');
    const valor = parseFloat(valorTexto);
    if (!isNaN(valor) && valor > 0) {
      console.log(`✅ Divisão por valor fixo detectada: R$ ${valor}`);
      return { tipo: 'valor_fixo', valor };
    }
  }
  
  // Padrões alternativos: "6 reais pra mim", "fico com 8"
  const valorAlternativoMatch = lower.match(/(?:(\d+([.,]\d{1,2})?)\s*reais?\s*(?:para|pra)\s*mim|(?:para|pra)\s*mim\s*(\d+([.,]\d{1,2})?)\s*reais?|(?:fico\s+com|assumo)\s*(\d+([.,]\d{1,2})?))/);
  if (valorAlternativoMatch) {
    const valores = [valorAlternativoMatch[1], valorAlternativoMatch[3], valorAlternativoMatch[5]].filter(v => v);
    if (valores.length > 0) {
      const valorTexto = valores[0].replace(',', '.');
      const valor = parseFloat(valorTexto);
      if (!isNaN(valor) && valor > 0) {
        console.log(`✅ Divisão por valor fixo (alternativo) detectada: R$ ${valor}`);
        return { tipo: 'valor_fixo', valor };
      }
    }
  }
  
  // Padrões para "metade", "meio a meio", etc (já existente)
  if (lower.includes('metade') || lower.includes('meio a meio') || lower.includes('50%') || lower.includes('meio')) {
    console.log(`✅ Divisão por metade detectada`);
    return { tipo: 'metade', valor: 50 };
  }
  
  return null;
}

export function extrairMetodoPagamento(texto: string, ehParcelado: boolean = false): string {
  const textoLower = texto.toLowerCase();

  console.log(`🔍 ANALISANDO MÉTODO PAGAMENTO: "${textoLower}"`);
  console.log(`🔍 É PARCELADO?: ${ehParcelado}`);

  if (ehParcelado) {
    console.log(`✅ PARCELAMENTO DETECTADO - FORÇANDO CRÉDITO`);
    return "CREDITO";
  }

  if (textoLower.includes("crédito") || textoLower.includes("credito")) {
    console.log(`✅ MENÇÃO EXPLÍCITA A CRÉDITO DETECTADA`);
    return "CREDITO";
  }

  if (textoLower.includes("débito") || textoLower.includes("debito")) {
    console.log(`✅ MENÇÃO EXPLÍCITA A DÉBITO DETECTADA`);
    return "DEBITO";
  }

  if (textoLower.includes("cartão") || textoLower.includes("cartao")) {
    if (
      textoLower.includes("parcela") ||
      textoLower.includes("vezes") ||
      textoLower.includes("fatura") ||
      textoLower.includes("meses")
    ) {
      console.log(`✅ CONTEXTO DE CARTÃO COM PARCELAMENTO - CRÉDITO`);
      return "CREDITO";
    }

    const comprasCredito = [
      "ecommerce", "online", "internet", "app", "aplicativo",
      "amazon", "mercado livre", "shopee", "aliexpress",
    ];

    if (comprasCredito.some(palavra => textoLower.includes(palavra))) {
      console.log(`✅ COMPRA ONLINE TÍPICA DE CRÉDITO DETECTADA`);
      return "CREDITO";
    }

    console.log(`✅ CARTÃO MENCIONADO SEM INDICAÇÃO DE CRÉDITO - DÉBITO`);
    return "DEBITO";
  }

  if (textoLower.includes("pix")) {
    return "PIX";
  } else if (textoLower.includes("transferência") || textoLower.includes("transferencia")) {
    return "TRANSFERENCIA";
  } else if (textoLower.includes("dinheiro") || textoLower.includes("efetivo")) {
    return "DINHEIRO";
  }

  console.log(`🔍 NENHUM MÉTODO ESPECÍFICO DETECTADO - USANDO PIX COMO FALLBACK`);
  return "PIX";
}

export function extrairMetodoPagamentoInternacional(
  texto: string,
  ehParcelado: boolean = false,
  idioma: string = "pt-BR"
): string {
  const textoLower = texto.toLowerCase();

  if (ehParcelado) {
    return "CREDITO";
  }

  if (idioma === "en-US") {
    if (textoLower.includes("credit card") || textoLower.includes("credit")) {
      return "CREDITO";
    }
    if (textoLower.includes("debit card") || textoLower.includes("debit")) {
      return "DEBITO";
    }
    if (textoLower.includes("cash")) {
      return "DINHEIRO";
    }
    if (textoLower.includes("transfer")) {
      return "TRANSFERENCIA";
    }
    if (textoLower.includes("nubank")) {
      return "CREDITO";
    }
  } else {
    if (textoLower.includes("crédito") || textoLower.includes("credito")) {
      return "CREDITO";
    }
    if (textoLower.includes("débito") || textoLower.includes("debito")) {
      return "DEBITO";
    }
    if (textoLower.includes("pix")) {
      return "PIX";
    }
    if (textoLower.includes("transferência") || textoLower.includes("transferencia")) {
      return "TRANSFERENCIA";
    }
    if (textoLower.includes("dinheiro") || textoLower.includes("efetivo")) {
      return "DINHEIRO";
    }
  }

  return "PIX";
}

export function tentarFallbackExtracao(mensagem: string, idioma: string): ResultadoExtracao | null {
  const texto = mensagem.toLowerCase();
  const numeros = texto.match(/\d+[\.,]?\d*/g);
  
  if (!numeros || numeros.length === 0) {
    console.log(`🔍 Fallback: Nenhum número encontrado`);
    return null;
  }

  const valor = numeros[0].replace(",", ".");
  console.log(`🔍 Fallback: Valor encontrado: ${valor}`);

  // NOVO: Detectar divisão personalizada no fallback também
  const divisao = detectarDivisaoPersonalizada(mensagem);
  
  let descricao = "";
  const palavras = mensagem.split(/\s+/);
  const indexValor = palavras.findIndex(palavra => palavra.includes(valor.replace(".", "")));

  if (indexValor !== -1 && indexValor < palavras.length - 1) {
    descricao = palavras.slice(indexValor + 1, indexValor + 4).join(" ");
    const palavrasComuns = [
      "on", "for", "at", "with", "using", "via", "my", "the",
      "reais", "real", "r$", "$", "compartilhado", "compartilhada",
      "com", "compartilhar", "share", "shared"
    ];
    descricao = descricao
      .split(/\s+/)
      .filter(palavra => !palavrasComuns.includes(palavra.toLowerCase()))
      .join(" ");
  }

  if (!descricao || descricao.trim() === "") {
    descricao = "Transação";
  }

  let tipo = "DESPESA";
  if (
    texto.includes("received") || texto.includes("earned") ||
    texto.includes("recebi") || texto.includes("ganhei") ||
    texto.includes("salary") || texto.includes("salário")
  ) {
    tipo = "RECEITA";
  }

  const metodoPagamento = extrairMetodoPagamentoInternacional(mensagem, false, idioma);
  const compartilhamento = detectarCompartilhamento(mensagem);

  console.log(`🔍 Fallback resultado:`, { tipo, valor, descricao, metodoPagamento, divisao });

  const dados: DadosLancamento = {
    tipo,
    valor,
    descricao: descricao.trim(),
    metodoPagamento,
    data: "hoje",
    ehCompartilhado: compartilhamento.ehCompartilhado,
    nomeUsuarioCompartilhado: compartilhamento.nomeUsuario,
    ehParcelado: false,
    parcelas: undefined,
    tipoParcelamento: undefined,
  };

  // Adicionar informações de divisão se detectadas
  if (divisao) {
    if (divisao.tipo === 'porcentagem') {
      dados.porcentagemUsuario = divisao.valor;
      dados.tipoDivisao = 'porcentagem';
    } else if (divisao.tipo === 'valor_fixo') {
      dados.valorUsuario = divisao.valor;
      dados.tipoDivisao = 'valor_fixo';
    } else if (divisao.tipo === 'metade') {
      dados.tipoDivisao = 'metade';
      dados.porcentagemUsuario = 50;
    }
  }

  return {
    sucesso: true,
    dados: dados,
  };
}

export function extrairDadosLancamento(mensagem: string): ResultadoExtracao {
  const texto = mensagem.toLowerCase().trim();
  const idioma = detectarIdioma(mensagem);

  console.log(`🔍🔍🔍 DEBUG COMPLETO INICIADO 🔍🔍🔍`);
  console.log(`📨 Mensagem original: "${mensagem}"`);
  console.log(`🌐 Idioma detectado: ${idioma}`);

  const compartilhamento = detectarCompartilhamento(mensagem);
  const parcelamento = detectarParcelamento(mensagem);
  // NOVO: Detectar divisão personalizada
  const divisao = detectarDivisaoPersonalizada(mensagem);

  const padroesIngles = [
    /(?:i\s+)?(spent|paid|received|earned|bought|purchased)\s+([\d.,]+)\s+(?:reais?|r\$)?\s*(?:on|for|at|with)\s+(?:the\s+)?([^,.\d]+?)(?=\s*,\s*|\s*\.|\s+card|\s+using|\s+with|\s+via|\s+$)/i,
    /(?:i\s+)?(spent|paid|received|earned)\s+([\d.,]+)\s+(?:reais?|r\$)?\s*on\s+(?:the\s+)?([^,.\d]+)/i,
    /(?:i\s+)?(spent|paid|received|earned)\s+([\d.,]+)\s+(?:reais?|r\$)?\s*at\s+(?:the\s+)?([^,.\d]+)/i,
    /(?:i\s+)?(spent|paid|received|earned)\s+([\d.,]+)\s+(?:reais?|r\$)?\s*for\s+(?:the\s+)?([^,.\d]+)/i,
    /(?:i\s+)?(bought|purchased)\s+([\d.,]+)\s+(?:reais?|r\$)?\s*(?:of|of\s+the)?\s*([^,.\d]+)/i,
    /(spent|paid|received|earned|bought|purchased)\s+([\d.,]+)\s+(?:reais?|r\$)?\s*(?:on|for|at)\s+(?:the\s+)?([^,.\d]+)/i,
    /([\d.,]+)\s+(?:reais?|r\$)?\s*(?:on|for|at)\s+(?:the\s+)?([^,.\d]+)/i,
  ];

  const padroesPortugues = [
    /(?:eu\s+)?(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+reais?\s+com\s+(?:o\s+)?([^,.\d]+?)(?=\s*,\s*|\s*\.|\s+cartão|\s+no\s+|\s+do\s+|$)/i,
    /(?:eu\s+)?(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+reais?\s+em\s+(?:o\s+)?([^,.\d]+?)(?=\s*,\s*|\s*\.|\s+cartão|\s+no\s+|\s+do\s+|$)/i,
    /(?:eu\s+)?(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+reais?\s+no\s+(?:o\s+)?([^,.\d]+?)(?=\s*,\s*|\s*\.|\s+cartão|\s+no\s+|\s+do\s+|$)/i,
    /(?:eu\s+)?(gastei|paguei|recebi|ganhei)\s+r\$\s*([\d.,]+)\s+com\s+(?:o\s+)?([^,.\d]+?)(?=\s*,\s*|\s*\.|\s+cartão|\s+no\s+|\s+do\s+|$)/i,
    /(?:eu\s+)?(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+com\s+(.+)/i,
    /(?:eu\s+)?(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+no\s+(.+)/i,
    /(?:eu\s+)?(gastei|paguei|recebi|ganhei)\s+([\d.,]+)\s+em\s+(.+)/i,
  ];

  const padroesParaTestar = idioma === "en-US"
    ? [...padroesIngles, ...padroesPortugues]
    : [...padroesPortugues, ...padroesIngles];

  let melhorMatch = null;

  for (const padrao of padroesParaTestar) {
    const match = texto.match(padrao);
    if (match && (!melhorMatch || match[0].length > melhorMatch[0].length)) {
      melhorMatch = match;
    }
  }

  if (melhorMatch) {
    let acao, valor, descricao;

    if (melhorMatch.length >= 4) {
      acao = melhorMatch[1];
      valor = melhorMatch[2];
      descricao = melhorMatch[3] ? melhorMatch[3].trim() : "";
    } else if (melhorMatch.length === 3) {
      acao = "spent";
      valor = melhorMatch[1];
      descricao = melhorMatch[2] ? melhorMatch[2].trim() : "";
    } else {
      acao = "spent";
      valor = "";
      descricao = "";
    }

    if (descricao) {
      descricao = descricao.replace(/\s+(?:using|with)\s+my\s+.*$/i, "");
      descricao = descricao.replace(/\s+via\s+.*$/i, "");
      descricao = descricao.replace(/\s*,\s*$/, "");
      descricao = descricao.trim();
    }

    let tipo;
    if (idioma === "en-US") {
      tipo = acao && (acao.includes("received") || acao.includes("earned")) ? "RECEITA" : "DESPESA";
    } else {
      tipo = acao && (acao.includes("recebi") || acao.includes("ganhei")) ? "RECEITA" : "DESPESA";
    }

    if (!acao || acao === "") {
      tipo = "DESPESA";
    }

    const metodoPagamentoCorrigido = extrairMetodoPagamentoInternacional(
      mensagem,
      parcelamento.ehParcelado,
      idioma
    );

    if (!valor || valor === "") {
      return gerarErroIdioma(idioma, "Não foi possível extrair o valor da mensagem.");
    }

    if (!descricao || descricao === "") {
      const palavras = mensagem.split(/\s+/);
      const possiveisDescricoes = palavras.filter(
        (palavra, index) =>
          index > 1 &&
          !/\d+/.test(palavra) &&
          !["on", "for", "at", "with", "using", "via", "my", "the"].includes(palavra.toLowerCase())
      );

      if (possiveisDescricoes.length > 0) {
        descricao = possiveisDescricoes.join(" ").trim();
      } else {
        descricao = "Transação";
      }
    }

    const dados: DadosLancamento = {
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
    };

    // Adicionar informações de divisão se detectadas
    if (divisao && dados.ehCompartilhado) {
      if (divisao.tipo === 'porcentagem') {
        dados.porcentagemUsuario = divisao.valor;
        dados.tipoDivisao = 'porcentagem';
      } else if (divisao.tipo === 'valor_fixo') {
        dados.valorUsuario = divisao.valor;
        dados.tipoDivisao = 'valor_fixo';
      } else if (divisao.tipo === 'metade') {
        dados.tipoDivisao = 'metade';
        dados.porcentagemUsuario = 50;
      }
    }

    return {
      sucesso: true,
      dados: dados,
    };
  }

  const resultadoFallback = tentarFallbackExtracao(mensagem, idioma);
  if (resultadoFallback) {
    return resultadoFallback;
  }

  return gerarErroIdioma(idioma);
}

function gerarErroIdioma(idioma: string, mensagemPersonalizada?: string): ResultadoExtracao {
  let erroMsg = "";

  if (idioma === "en-US") {
    if (mensagemPersonalizada) {
      erroMsg = `I didn't understand: "${mensagemPersonalizada}"`;
    } else {
      erroMsg = "I didn't understand the format. Use: 'I spent 50 on lunch' or 'I received 1000 salary' or 'R$ 20 at the supermarket'";
    }
  } else {
    if (mensagemPersonalizada) {
      erroMsg = `Não entendi: "${mensagemPersonalizada}"`;
    } else {
      erroMsg = "Não entendi o formato. Use: 'Gastei 50 no almoço' ou 'Recebi 1000 salário' ou 'R$ 20 no mercado'";
    }
  }

  return { sucesso: false, erro: erroMsg };
}