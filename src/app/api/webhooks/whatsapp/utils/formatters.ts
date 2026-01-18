// app/api/webhooks/whatsapp/utils/formatters.ts

export function formatarValorComMoeda(valor: number, idioma: string = "pt-BR"): string {
  if (idioma === "en-US") {
    return valor.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
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

export function traduzirMetodoPagamento(metodo: string, idioma: string): string {
  const mapaPt: Record<string, string> = {
    CREDITO: "💳 Cartão de Crédito",
    DEBITO: "💳 Cartão de Débito",
    PIX: "📱 PIX",
    DINHEIRO: "💵 Dinheiro",
    TRANSFERENCIA: "🔄 Transferência",
  };

  const mapaEn: Record<string, string> = {
    CREDITO: "💳 Credit Card",
    DEBITO: "💳 Debit Card",
    PIX: "📱 PIX",
    DINHEIRO: "💵 Cash",
    TRANSFERENCIA: "🔄 Transfer",
  };

  if (idioma === "en-US") {
    return mapaEn[metodo] || `💳 ${metodo}`;
  } else {
    return mapaPt[metodo] || `💳 ${metodo}`;
  }
}

export function calcularDataBrasilia(dataReferencia?: string): Date {
  let dataLancamento = new Date();
  const offsetBrasilia = -3 * 60;
  dataLancamento.setMinutes(
    dataLancamento.getMinutes() + dataLancamento.getTimezoneOffset() + offsetBrasilia
  );

  if (dataReferencia === "ontem") {
    dataLancamento.setDate(dataLancamento.getDate() - 1);
  } else if (dataReferencia && dataReferencia.includes("/")) {
    const [dia, mes, ano] = dataReferencia.split("/").map(Number);
    dataLancamento = new Date(
      ano || new Date().getFullYear(),
      mes - 1 || new Date().getMonth(),
      dia || new Date().getDate()
    );
  }

  return dataLancamento;
}