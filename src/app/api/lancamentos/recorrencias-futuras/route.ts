import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar TODOS os lançamentos recorrentes ativos
    const recorrenciasAtivas = await db.lancamento.findMany({
      where: {
        usuarioId: session.user.id,
        recorrente: true,
        lancamentoPaiId: null, // Apenas os originais
      },
      include: {
        categoria: true,
        cartao: true,
        lancamentosFilhos: {
          orderBy: { data: "asc" },
        },
      },
    });

    // Gerar previsão COMPLETA até a data final
    const previsoesCompletas = [];

    for (const recorrencia of recorrenciasAtivas) {
      const dataInicio = new Date(recorrencia.data);
      const dataFim = recorrencia.dataFimRecorrencia
        ? new Date(recorrencia.dataFimRecorrencia)
        : null;

      // Calcular todos os meses entre início e fim
      let dataAtual = new Date(dataInicio);
      let mesCount = 0;

      while (true) {
        // Verificar se passou da data final
        if (dataFim && dataAtual > dataFim) {
          break;
        }

        // Limitar a 60 meses (5 anos) para não travar
        if (mesCount > 60) {
          break;
        }

        // Verificar se já existe lançamento para este mês
        const inicioMes = new Date(
          dataAtual.getFullYear(),
          dataAtual.getMonth(),
          1
        );
        const fimMes = new Date(
          dataAtual.getFullYear(),
          dataAtual.getMonth() + 1,
          0
        );

        const lancamentoExistente = await db.lancamento.findFirst({
          where: {
            usuarioId: session.user.id,
            OR: [
              { id: mesCount === 0 ? recorrencia.id : undefined }, // O próprio original
              {
                lancamentoPaiId: recorrencia.id,
                data: {
                  gte: inicioMes,
                  lte: fimMes,
                },
              },
            ],
          },
        });

        previsoesCompletas.push({
          id: `${recorrencia.id}-${mesCount}`,
          descricao: recorrencia.descricao,
          valor: recorrencia.valor,
          tipo: recorrencia.tipo,
          metodoPagamento: recorrencia.metodoPagamento,
          data: new Date(dataAtual),
          categoria: recorrencia.categoria,
          cartao: recorrencia.cartao,
          recorrente: true,
          tipoParcelamento: recorrencia.tipoParcelamento,
          lancamentoPaiId: recorrencia.id,
          jaExiste: !!lancamentoExistente,
          mesReferencia: dataAtual.toISOString().slice(0, 7),
          ehOriginal: mesCount === 0,
        });

        // Próximo mês
        dataAtual.setMonth(dataAtual.getMonth() + 1);
        mesCount++;
      }
    }

    // Ordenar por data
    previsoesCompletas.sort(
      (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
    );

    return NextResponse.json(previsoesCompletas);
  } catch (error) {
    console.error("Erro ao buscar recorrências futuras:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
