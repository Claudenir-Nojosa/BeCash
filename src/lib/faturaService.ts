import db from "./db";

interface CartaoComFaturasELancamentos {
  id: string;
  nome: string;
  bandeira: string;
  limite: number | null;
  diaFechamento: number | null;
  diaVencimento: number | null;
  cor: string;
  observacoes: string | null;
  usuarioId: string;
  createdAt: Date;
  updatedAt: Date;
  Fatura: Array<{
    // CORREÇÃO: Fatura com F maiúsculo
    id: string;
    mesReferencia: string;
    status: string;
    valorTotal: number;
    valorPago: number;
  }>;
  lancamentos: Array<{
    id: string;
    valor: number;
    pago: boolean;
    Fatura: {
      // CORREÇÃO: Fatura com F maiúsculo
      status: string;
    } | null;
  }>;
}

export class FaturaService {
  // Obter ou criar fatura do mês atual para um cartão
  static async obterFaturaAtual(cartaoId: string) {
    const cartao = await db.cartao.findUnique({
      where: { id: cartaoId },
    });

    if (!cartao) {
      throw new Error("Cartão não encontrado");
    }

    const hoje = new Date();
    const mesReferencia = hoje.toISOString().slice(0, 7); // YYYY-MM

    // Calcular datas de fechamento e vencimento
    const dataFechamento = this.calcularDataFechamento(
      cartao.diaFechamento,
      mesReferencia
    );
    const dataVencimento = this.calcularDataVencimento(
      cartao.diaVencimento,
      mesReferencia
    );

    return await db.fatura.upsert({
      where: {
        cartaoId_mesReferencia: {
          cartaoId,
          mesReferencia,
        },
      },
      create: {
        cartaoId,
        mesReferencia,
        dataFechamento,
        dataVencimento,
        status: "ABERTA",
      },
      update: {},
    });
  }

  // Calcular data de fechamento
  static calcularDataFechamento(
    diaFechamento: number | null,
    mesReferencia: string
  ) {
    if (!diaFechamento) diaFechamento = 1;

    const [ano, mes] = mesReferencia.split("-").map(Number);
    const ultimoDiaMes = new Date(ano, mes, 0).getDate();
    const dia = Math.min(diaFechamento, ultimoDiaMes);

    return new Date(ano, mes - 1, dia);
  }

  // Calcular data de vencimento
  static calcularDataVencimento(
    diaVencimento: number | null,
    mesReferencia: string
  ) {
    if (!diaVencimento) diaVencimento = 10;

    const [ano, mes] = mesReferencia.split("-").map(Number);
    const mesVencimento = mes === 12 ? 1 : mes + 1;
    const anoVencimento = mes === 12 ? ano + 1 : ano;

    const ultimoDiaMes = new Date(anoVencimento, mesVencimento, 0).getDate();
    const dia = Math.min(diaVencimento, ultimoDiaMes);

    return new Date(anoVencimento, mesVencimento - 1, dia);
  }

  // Adicionar lançamento à fatura
  static async adicionarLancamentoAFatura(lancamentoId: string) {
    const lancamento = await db.lancamento.findUnique({
      where: { id: lancamentoId },
      include: { cartao: true },
    });

    if (
      !lancamento ||
      !lancamento.cartaoId ||
      lancamento.metodoPagamento !== "CREDITO"
    ) {
      return;
    }

    const fatura = await this.obterFaturaAtual(lancamento.cartaoId);

    await db.lancamento.update({
      where: { id: lancamentoId },
      data: { faturaId: fatura.id },
    });

    // Atualizar valor total da fatura
    await this.atualizarValorFatura(fatura.id);
  }

  // Atualizar valor total da fatura
  static async atualizarValorFatura(faturaId: string) {
    const lancamentos = await db.lancamento.findMany({
      where: {
        faturaId,
        pago: false,
      },
    });

    const valorTotal = lancamentos.reduce((sum, lanc) => sum + lanc.valor, 0);

    await db.fatura.update({
      where: { id: faturaId },
      data: { valorTotal },
    });
  }

  // Fechar fatura do mês anterior e criar nova
  static async fecharFaturasVencidas() {
    const hoje = new Date();
    const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const mesReferenciaPassado = mesPassado.toISOString().slice(0, 7);

    const faturasAbertas = await db.fatura.findMany({
      where: {
        mesReferencia: mesReferenciaPassado,
        status: "ABERTA",
      },
      include: {
        cartao: true,
      },
    });

    for (const fatura of faturasAbertas) {
      await db.fatura.update({
        where: { id: fatura.id },
        data: {
          status: "FECHADA",
          dataFechamento: new Date(),
        },
      });

      // Criar fatura do próximo mês
      const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const proximoMesReferencia = proximoMes.toISOString().slice(0, 7);

      await this.obterFaturaAtual(fatura.cartaoId);
    }
  }

  // Pagar fatura
  static async pagarFatura(
    faturaId: string,
    valor: number,
    metodo: string,
    usuarioId: string
  ) {
    const fatura = await db.fatura.findUnique({
      where: { id: faturaId },
      include: { lancamentos: true },
    });

    if (!fatura) {
      throw new Error("Fatura não encontrada");
    }

    // Criar registro de pagamento
    await db.pagamentoFatura.create({
      data: {
        faturaId,
        valor,
        metodo,
        usuarioId,
        observacoes: `Pagamento da fatura ${fatura.mesReferencia}`,
      },
    });

    // Atualizar valor pago
    const novoValorPago = fatura.valorPago + valor;
    const status = novoValorPago >= fatura.valorTotal ? "PAGA" : "FECHADA";

    await db.fatura.update({
      where: { id: faturaId },
      data: {
        valorPago: novoValorPago,
        status,
      },
    });

    // Se a fatura foi totalmente paga, marcar lançamentos como pagos
    if (status === "PAGA") {
      await db.lancamento.updateMany({
        where: { faturaId },
        data: { pago: true },
      });
    }

    return fatura;
  } // FIM do método pagarFatura

  // Obter resumo do cartão - CORRIGIDO
  static async obterResumoCartao(cartaoId: string) {
    const cartao = await db.cartao.findUnique({
      where: { id: cartaoId },
      include: {
        Fatura: {
          where: {
            status: { in: ["ABERTA", "FECHADA"] },
          },
          orderBy: { mesReferencia: "desc" },
          take: 1,
        },
        lancamentos: {
          where: {
            pago: false,
            Fatura: {
              status: { in: ["ABERTA", "FECHADA"] },
            },
          },
          include: {
            Fatura: {
              select: {
                status: true,
              },
            },
          },
        },
      },
    });

    if (!cartao) {
      throw new Error("Cartão não encontrado");
    }

    const faturaAtual = cartao.Fatura[0];
    const totalGasto = cartao.lancamentos.reduce(
      (sum: number, lanc: any) => sum + lanc.valor,
      0
    );
    const limiteDisponivel = (cartao.limite || 0) - totalGasto;
    const utilizacaoLimite = (totalGasto / (cartao.limite || 1)) * 100;

    return {
      cartao,
      faturaAtual,
      totalGasto,
      limiteDisponivel,
      utilizacaoLimite: Math.min(utilizacaoLimite, 100),
    };
  }
}
