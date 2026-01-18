// app/api/webhooks/whatsapp/utils/detectors.ts

export function detectarIdioma(mensagem: string): string {
  const texto = mensagem.toLowerCase();

  const palavrasIngles = [
    "i", "spent", "paid", "received", "earned", "bought", "purchased",
    "on", "for", "at", "using", "with", "my", "card", "credit", "debit",
    "cash", "money", "dollars", "usd", "answer", "english"
  ];

  const palavrasPortugues = [
    "eu", "gastei", "paguei", "recebi", "ganhei", "comprei",
    "com", "em", "no", "na", "do", "da", "meu", "minha",
    "cartão", "crédito", "débito", "pix", "dinheiro", "reais"
  ];

  let contadorIngles = 0;
  let contadorPortugues = 0;

  const verbosIngles = ["spent", "paid", "received", "earned", "bought"];
  const verbosPortugues = ["gastei", "paguei", "recebi", "ganhei", "comprei"];

  verbosIngles.forEach(verbo => {
    if (texto.includes(verbo)) contadorIngles += 3;
  });

  verbosPortugues.forEach(verbo => {
    if (texto.includes(verbo)) contadorPortugues += 3;
  });

  palavrasIngles.forEach(palavra => {
    if (texto.includes(palavra)) contadorIngles += 1;
  });

  palavrasPortugues.forEach(palavra => {
    if (texto.includes(palavra)) contadorPortugues += 1;
  });

  console.log(`🌐 Contagem idioma: Inglês=${contadorIngles}, Português=${contadorPortugues}`);

  return contadorIngles > contadorPortugues ? "en-US" : "pt-BR";
}

export function detectarComando(mensagem: string): { tipo: string | null } {
  const textoLower = mensagem.toLowerCase().trim();

  const comandosCategorias = [
    "quais categorias", "categorias disponíveis", "minhas categorias",
    "listar categorias", "ver categorias", "mostrar categorias",
    "categorias cadastradas"
  ];

  if (comandosCategorias.some(cmd => textoLower.includes(cmd))) {
    return { tipo: "LISTAR_CATEGORIAS" };
  }

  return { tipo: null };
}

export function detectarCompartilhamento(mensagem: string): {
  ehCompartilhado: boolean;
  nomeUsuario?: string;
  tipoCompartilhamento?: string;
} {
  console.log(`🔍🔍🔍 DETECÇÃO COMPARTILHAMENTO INICIADA 🔍🔍🔍`);
  console.log(`🔍 Mensagem ORIGINAL: "${mensagem}"`);

  const msgLower = mensagem.toLowerCase();

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

  // Tentativa 3: Procurar por nome explicitamente
  if (!nomeUsuario && msgLower.includes("beatriz")) {
    nomeUsuario = "beatriz";
    console.log(`✅ Nome extraído (fallback beatriz): "${nomeUsuario}"`);
  }

  // Tentativa 4: Último recurso - pegar última palavra após "com"
  if (!nomeUsuario) {
    const palavras = mensagem.split(" ");
    const indexCom = palavras.findIndex(p => p.toLowerCase() === "com");
    if (indexCom !== -1 && indexCom < palavras.length - 1) {
      nomeUsuario = palavras[indexCom + 1].replace(/[.,]/g, "").trim();
      console.log(`✅ Nome extraído (última palavra): "${nomeUsuario}"`);
    }
  }

  if (nomeUsuario) {
    const resultado = {
      ehCompartilhado: true,
      nomeUsuario: nomeUsuario,
      tipoCompartilhamento: msgLower.includes("despesa") ? "DESPESA" 
        : msgLower.includes("receita") ? "RECEITA" : undefined,
    };
    console.log(`✅✅✅ COMPARTILHAMENTO CONFIRMADO:`, resultado);
    return resultado;
  }

  console.log(`❌ Compartilhamento detectado mas nome não extraído`);
  return {
    ehCompartilhado: true,
    nomeUsuario: "beatriz",
    tipoCompartilhamento: "DESPESA",
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

  if (texto.includes("parcelada") || texto.includes("parcelado") || texto.includes("vezes")) {
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