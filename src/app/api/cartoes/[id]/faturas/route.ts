import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../../auth";

// Correção: Use esta assinatura para rotas dinâmicas no App Router
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const params = await context.params;
    const cartaoId = params.id;

    // Verificar se o usuário tem acesso ao cartão (dono OU colaborador)
    const cartao = await db.cartao.findFirst({
      where: {
        id: cartaoId,
        OR: [
          { userId: session.user.id },
          { ColaboradorCartao: { some: { userId: session.user.id } } },
        ],
      },
    });

    if (!cartao) {
      return NextResponse.json(
        { error: "Cartão não encontrado ou você não tem acesso" },
        { status: 404 }
      );
    }

    // Buscar faturas existentes do cartão
    const faturasExistentes = await db.fatura.findMany({
      where: {
        cartaoId,
      },
      include: {
        lancamentos: {
          include: {
            categoria: true,
          },
          orderBy: {
            data: "desc",
          },
        },
        PagamentoFatura: {
          orderBy: {
            data: "desc",
          },
        },
      },
      orderBy: {
        mesReferencia: "desc",
      },
    });

    // Gerar previsão de faturas futuras (próximos 6 meses)
    const faturasFuturas = await gerarPrevisaoFaturasFuturas(cartaoId, cartao);

    // Combinar faturas existentes com previsões futuras
    const todasFaturas = [...faturasExistentes, ...faturasFuturas];

    // Ordenar por mês de referência (mais recente primeiro)
    todasFaturas.sort((a, b) => {
      const dateA = new Date(a.mesReferencia + "-01");
      const dateB = new Date(b.mesReferencia + "-01");
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json(todasFaturas);
  } catch (error) {
    console.error("Erro ao buscar faturas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Função para gerar previsão de faturas futuras
async function gerarPrevisaoFaturasFuturas(cartaoId: string, cartao: any) {
  const faturasFuturas = [];
  const hoje = new Date();

  // Buscar lançamentos recorrentes e parcelados futuros
  const lancamentosFuturos = await db.lancamento.findMany({
    where: {
      cartaoId,
      OR: [
        {
          // Lançamentos recorrentes ativos
          recorrente: true,
          OR: [
            { dataFimRecorrencia: null },
            { dataFimRecorrencia: { gte: hoje } },
          ],
        },
        {
          // Parcelas futuras
          lancamentoPaiId: { not: null },
          data: { gte: hoje },
        },
      ],
    },
    include: {
      categoria: true,
      lancamentoPai: true,
    },
  });

  // Gerar previsão para os próximos 6 meses
  for (let i = 0; i < 6; i++) {
    const dataReferencia = new Date();
    dataReferencia.setMonth(dataReferencia.getMonth() + i);
    const mesReferencia = dataReferencia.toISOString().slice(0, 7); // YYYY-MM

    // Verificar se já existe fatura para este mês
    const faturaExistente = await db.fatura.findFirst({
      where: {
        cartaoId,
        mesReferencia,
      },
    });

    if (!faturaExistente) {
      // Calcular data de fechamento e vencimento
      const dataFechamento = calcularDataFechamento(
        cartao.diaFechamento,
        mesReferencia
      );
      const dataVencimento = calcularDataVencimento(
        cartao.diaVencimento,
        mesReferencia
      );

      // Calcular valor previsto baseado em lançamentos futuros
      const lancamentosPrevistos = lancamentosFuturos.filter((lancamento) => {
        const dataLancamento = new Date(lancamento.data);
        return dataLancamento.toISOString().slice(0, 7) === mesReferencia;
      });

      const valorTotalPrevisto = lancamentosPrevistos.reduce(
        (sum, lanc) => sum + lanc.valor,
        0
      );

      faturasFuturas.push({
        id: `previsao-${mesReferencia}`,
        mesReferencia,
        dataFechamento,
        dataVencimento,
        valorTotal: valorTotalPrevisto,
        valorPago: 0,
        status: "PREVISTA",
        lancamentos: lancamentosPrevistos,
        PagamentoFatura: [],
        ehPrevisao: true,
      });
    }
  }

  return faturasFuturas;
}

// Funções auxiliares para calcular datas
function calcularDataFechamento(
  diaFechamento: number | null,
  mesReferencia: string
) {
  if (!diaFechamento) diaFechamento = 1;

  const [ano, mes] = mesReferencia.split("-").map(Number);
  const ultimoDiaMes = new Date(ano, mes, 0).getDate();
  const dia = Math.min(diaFechamento, ultimoDiaMes);

  return new Date(ano, mes - 1, dia);
}

function calcularDataVencimento(
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
