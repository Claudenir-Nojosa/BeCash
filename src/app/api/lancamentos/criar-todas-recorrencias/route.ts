import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { recorrenciaId } = body;

    if (!recorrenciaId) {
      return NextResponse.json(
        { error: "ID da recorrência é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar a recorrência original
    const recorrenciaOriginal = await db.lancamento.findFirst({
      where: {
        id: recorrenciaId,
        usuarioId: session.user.id,
        recorrente: true,
      },
      include: {
        categoria: true,
        cartao: true,
        lancamentosFilhos: {
          orderBy: { data: "asc" },
        },
      },
    });

    if (!recorrenciaOriginal) {
      return NextResponse.json(
        { error: "Recorrência não encontrada" },
        { status: 404 }
      );
    }

    const dataInicio = new Date(recorrenciaOriginal.data);
    const dataFim = recorrenciaOriginal.dataFimRecorrencia
      ? new Date(recorrenciaOriginal.dataFimRecorrencia)
      : null;

    let dataAtual = new Date(dataInicio);
    dataAtual.setMonth(dataAtual.getMonth() + 1); // Começar do próximo mês
    let lancamentosCriados = 0;
    let mesCount = 1;

    const lancamentosACriar = [];

    while (true) {
      // Verificar se passou da data final
      if (dataFim && dataAtual > dataFim) {
        break;
      }

      // Limitar a 60 meses
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
          lancamentoPaiId: recorrenciaOriginal.id,
          data: {
            gte: inicioMes,
            lte: fimMes,
          },
        },
      });

      if (!lancamentoExistente) {
        lancamentosACriar.push({
          descricao: recorrenciaOriginal.descricao,
          valor: recorrenciaOriginal.valor,
          tipo: recorrenciaOriginal.tipo,
          metodoPagamento: recorrenciaOriginal.metodoPagamento,
          data: new Date(dataAtual),
          categoriaId: recorrenciaOriginal.categoriaId,
          cartaoId: recorrenciaOriginal.cartaoId,
          observacoes: recorrenciaOriginal.observacoes,
          usuarioId: session.user.id,
          pago: false,
          tipoParcelamento: recorrenciaOriginal.tipoParcelamento,
          recorrente: true,
          dataFimRecorrencia: recorrenciaOriginal.dataFimRecorrencia,
          lancamentoPaiId: recorrenciaOriginal.id,
          parcelaAtual: 1,
          parcelasTotal: null,
        });
      }

      // Próximo mês
      dataAtual.setMonth(dataAtual.getMonth() + 1);
      mesCount++;
    }

    // Criar todos os lançamentos de uma vez
    if (lancamentosACriar.length > 0) {
      await db.lancamento.createMany({
        data: lancamentosACriar,
      });
      lancamentosCriados = lancamentosACriar.length;
    }

    return NextResponse.json({
      message: `Criados ${lancamentosCriados} lançamentos futuros para "${recorrenciaOriginal.descricao}"`,
      totalCriados: lancamentosCriados,
    });
  } catch (error) {
    console.error("Erro ao criar recorrências:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
