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
  const confirmacoesIngles = [
    "sim", "s", "confirmar", "ok", "yes", "✅", "y", "confirm", "yeah", "yep",
  ];
  
  return confirmacoesIngles.includes(resposta.toLowerCase().trim());
}

export function isCancelamento(resposta: string): boolean {
  const cancelamentosIngles = [
    "não", "nao", "n", "cancelar", "no", "❌", "nope", "cancel", "stop",
  ];
  
  return cancelamentosIngles.includes(resposta.toLowerCase().trim());
}