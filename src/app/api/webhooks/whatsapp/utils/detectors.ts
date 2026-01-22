// app/api/webhooks/whatsapp/utils/detectors.ts

export function detectarIdioma(mensagem: string): string {
  const texto = mensagem.toLowerCase();

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

  const verbosIngles = ["spent", "paid", "received", "earned", "bought"];
  const verbosPortugues = ["gastei", "paguei", "recebi", "ganhei", "comprei"];

  verbosIngles.forEach((verbo) => {
    if (texto.includes(verbo)) contadorIngles += 3;
  });

  verbosPortugues.forEach((verbo) => {
    if (texto.includes(verbo)) contadorPortugues += 3;
  });

  palavrasIngles.forEach((palavra) => {
    if (texto.includes(palavra)) contadorIngles += 1;
  });

  palavrasPortugues.forEach((palavra) => {
    if (texto.includes(palavra)) contadorPortugues += 1;
  });

  console.log(
    `🌐 Contagem idioma: Inglês=${contadorIngles}, Português=${contadorPortugues}`,
  );

  return contadorIngles > contadorPortugues ? "en-US" : "pt-BR";
}

export function detectarComando(mensagem: string): { tipo: string | null } {
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

export function detectarCompartilhamento(mensagem: string) {
  const lower = mensagem.toLowerCase();
  let ehCompartilhado = false;
  let nomeUsuario = "";
  let username = "";

  // Padrões para detecção de username (@username)
  const usernamePattern = /compartilhad[oa]?\s+(?:com|para|com)\s+@(\w[\w.]*)/i;
  const usernameMatch = mensagem.match(usernamePattern);

  if (usernameMatch) {
    ehCompartilhado = true;
    username = usernameMatch[1];
    console.log(`✅ Username detectado para compartilhamento: @${username}`);
  }

  // Padrões antigos (nome) - fallback
  const patterns = [
    /compartilhad[oa]?\s+(?:com|para|com)\s+([^\s.,!?]+)/i,
    /dividid[oa]?\s+(?:com|para|com)\s+([^\s.,!?]+)/i,
    /(?:com|para|com)\s+([^\s.,!?]+)\s+(?:compartilhad[oa]?|dividid[oa]?)/i,
  ];

  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match && match[1]) {
      ehCompartilhado = true;
      nomeUsuario = match[1];
      console.log(`✅ Nome detectado para compartilhamento: ${nomeUsuario}`);
      break;
    }
  }

  // Detectar por menção simples de "@"
  const simpleAtPattern = /@(\w[\w.]*)/g;
  const atMatches = [...mensagem.matchAll(simpleAtPattern)];

  if (atMatches.length > 0 && !ehCompartilhado) {
    ehCompartilhado = true;
    username = atMatches[0][1];
    console.log(`✅ Username detectado por menção: @${username}`);
  }

  return {
    ehCompartilhado,
    nomeUsuario: nomeUsuario || username,
    username: username || undefined,
  };
}

export function detectarParcelamento(mensagem: string): {
  ehParcelado: boolean;
  parcelas?: number;
  tipoParcelamento?: string;
} {
  const texto = mensagem.toLowerCase();

  console.log(`🔍🔍🔍 DETECÇÃO PARCELAMENTO INICIADA 🔍🔍🔍`);
  console.log(`🔍 Mensagem: "${texto}"`);

  const padroesParcelamento = [
    /parcelad[ao]\s+em\s+(\d+)\s+vezes/i,
    /parcelad[ao]\s+em\s+(\d+)x/i,
    /em\s+(\d+)\s+vezes/i,
    /em\s+(\d+)x/i,
    /(\d+)\s+vezes/i,
    /(\d+)x/i,
    /compra\s+parcelad[ao].*em\s+(\d+)/i,
    /parcelad[ao].*?(\d+)/i,
    /vezes.*?(\d+)/i,
    /parcelas.*?(\d+)/i,
  ];

  for (const padrao of padroesParcelamento) {
    const match = texto.match(padrao);
    if (match && match[1]) {
      const parcelas = parseInt(match[1]);
      if (parcelas > 1 && parcelas <= 24) {
        const resultado = {
          ehParcelado: true,
          parcelas: parcelas,
          tipoParcelamento: "PARCELADO",
        };
        console.log(`✅✅✅ PARCELAMENTO DETECTADO:`, resultado);
        return resultado;
      }
    }
  }

  if (
    texto.includes("parcelada") ||
    texto.includes("parcelado") ||
    texto.includes("vezes")
  ) {
    const todosNumeros = texto.match(/\d+/g);
    if (todosNumeros) {
      for (const numStr of todosNumeros) {
        const numero = parseInt(numStr);
        if (numero > 1 && numero <= 24) {
          const resultado = {
            ehParcelado: true,
            parcelas: numero,
            tipoParcelamento: "PARCELADO",
          };
          console.log(`✅✅✅ PARCELAMENTO DETECTADO (HOTFIX):`, resultado);
          return resultado;
        }
      }
    }
  }

  console.log(`❌ Nenhum parcelamento detectado`);
  return { ehParcelado: false };
}
