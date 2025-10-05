// Adicione este endpoint para verificar uma recorrência específica
// app/api/debug/recorrente/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../../auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const recorrenteId = params.id;

    // Buscar a recorrência específica
    const recorrente = await db.lancamentoRecorrente.findFirst({
      where: {
        id: recorrenteId,
        usuarioId: session.user.id,
      },
    });

    if (!recorrente) {
      return NextResponse.json(
        { error: "Recorrência não encontrada" },
        { status: 404 }
      );
    }

    // Buscar lançamentos gerados por esta recorrência
    const lancamentos = await db.lancamento.findMany({
      where: {
        recorrenteId: recorrenteId,
      },
      orderBy: {
        data: "asc",
      },
    });

    // Calcular próximo mês que deveria gerar
    const mesAtual = new Date().getMonth() + 1;
    const anoAtual = new Date().getFullYear();

    const dataInicio = new Date(recorrente.dataInicio);
    const mesesDiff =
      (anoAtual - dataInicio.getFullYear()) * 12 +
      (mesAtual - dataInicio.getMonth() - 1);

    let proximoMes = null;
    if (recorrente.ativo) {
      switch (recorrente.frequencia) {
        case "mensal":
          proximoMes = { mes: mesAtual, ano: anoAtual };
          break;
        case "trimestral":
          const proxTrimestre = Math.ceil((mesesDiff + 1) / 3) * 3;
          proximoMes = {
            mes: (dataInicio.getMonth() + proxTrimestre) % 12 || 12,
            ano:
              anoAtual +
              Math.floor((dataInicio.getMonth() + proxTrimestre) / 12),
          };
          break;
        case "anual":
          proximoMes = {
            mes: dataInicio.getMonth() + 1,
            ano: anoAtual + 1,
          };
          break;
      }
    }

    return NextResponse.json({
      recorrente,
      totalLancamentos: lancamentos.length,
      lancamentos,
      analise: {
        mesesDesdeInicio: mesesDiff,
        ativo: recorrente.ativo,
        proximoMesGeracao: proximoMes,
        deveGerarEsteMes:
          mesesDiff >= 0 &&
          (recorrente.frequencia === "mensal" ||
            (recorrente.frequencia === "trimestral" && mesesDiff % 3 === 0) ||
            (recorrente.frequencia === "anual" && mesesDiff % 12 === 0)),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar recorrência:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
