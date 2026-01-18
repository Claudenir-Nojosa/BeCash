// app/api/webhooks/whatsapp/utils/validators.ts

export function validarCredenciaisWhatsApp(): boolean {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  
  if (!phoneNumberId || !accessToken) {
    console.error("❌ Credenciais do WhatsApp não configuradas");
    return false;
  }
  
  return true;
}

export function validarCredenciaisOpenAI(): boolean {
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY não configurada");
    return false;
  }
  return true;
}

export function validarCredenciaisAnthropic(): boolean {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ ANTHROPIC_API_KEY não configurada");
    return false;
  }
  return true;
}

export function normalizarTelefone(telefone: string): string {
  const telefoneNormalizado = telefone.replace(/\D/g, "");
  let telefoneBusca = telefoneNormalizado;

  if (telefoneNormalizado.startsWith("55") && telefoneNormalizado.length === 13) {
    telefoneBusca = telefoneNormalizado.substring(2);
    console.log(`🇧🇷 Removido DDI 55: ${telefoneNormalizado} → ${telefoneBusca}`);
  } else if (telefoneNormalizado.startsWith("55") && telefoneNormalizado.length === 12) {
    const ddd = telefoneNormalizado.substring(2, 4);
    const resto = telefoneNormalizado.substring(4);
    telefoneBusca = ddd + "9" + resto;
    console.log(`🇧🇷 Adicionado 9: ${telefoneNormalizado} → ${telefoneBusca}`);
  } else if (telefoneNormalizado.startsWith("85") && telefoneNormalizado.length === 11) {
    telefoneBusca = telefoneNormalizado;
  }

  return telefoneBusca;
}

export function validarLancamentoPendente(
  pendingLancamento: any,
  timestamp: number
): { valido: boolean; motivo?: string } {
  if (!pendingLancamento) {
    return { valido: false, motivo: "not_found" };
  }

  // Verificar expiração (5 minutos)
  if (timestamp - pendingLancamento.timestamp > 5 * 60 * 1000) {
    return { valido: false, motivo: "expired" };
  }

  return { valido: true };
}

export function isConfirmacao(resposta: string): boolean {
  const confirmacoes = [
    "sim", "s", "confirmar", "ok", "yes", "✅", "y", "confirm", "yeah", "yep",
    "sure", "affirmative", "positive", "true", "correct", "right", "yea",
    "claro", "pode ser", "vamos", "beleza", "blz", "okay", "tá bom"
  ];
  
  const respostaLower = resposta.toLowerCase().trim();
  
  // Verificar se é apenas um emoji de confirmação
  if (respostaLower === "✅") {
    return true;
  }
  
  // Verificar palavras completas
  return confirmacoes.includes(respostaLower);
}

export function isCancelamento(resposta: string): boolean {
  const cancelamentos = [
    "não", "nao", "n", "cancelar", "no", "❌", "nope", "cancel", "stop",
    "negative", "false", "wrong", "incorrect", "not", "nah", "nem",
    "cancelar", "parar", "desistir", "abortar", "deixa", "esquece",
    "deixa pra lá", "não quero", "nao quero"
  ];
  
  const respostaLower = resposta.toLowerCase().trim();
  
  // Verificar se é apenas um emoji de cancelamento
  if (respostaLower === "❌") {
    return true;
  }
  
  // Verificar palavras completas
  return cancelamentos.includes(respostaLower);
}

// Função auxiliar para verificar se a mensagem é uma resposta simples (sim/não)
export function isRespostaSimples(texto: string): boolean {
  const textoLower = texto.toLowerCase().trim();
  
  // Lista de respostas simples que não devem ser tratadas como lançamentos
  const respostasSimples = [
    "sim", "não", "nao", "s", "n", "yes", "no", "y", "nope", "yep",
    "yeah", "nah", "✅", "❌", "ok", "okay", "cancel", "confirm",
    "cancelar", "confirmar", "claro", "nem", "deixa", "esquece"
  ];
  
  // Verificar se é uma resposta de 1-3 palavras que está na lista
  const palavras = textoLower.split(/\s+/);
  return palavras.length <= 3 && respostasSimples.some(resposta => 
    textoLower === resposta || 
    (palavras.length === 1 && resposta.includes(textoLower)) ||
    (palavras.length === 2 && resposta.includes(palavras[0]))
  );
}