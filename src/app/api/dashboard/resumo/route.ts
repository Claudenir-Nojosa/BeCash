// app/api/dashboard/resumo/route.ts (com logs)
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    console.log("API Resumo - Sessão:", session?.user?.id);

    if (!session?.user?.id) {
      console.log("API Resumo - Não autorizado");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mes =
      searchParams.get("mes") || (new Date().getMonth() + 1).toString();
    const ano = searchParams.get("ano") || new Date().getFullYear().toString();

    console.log("API Resumo - Parâmetros:", {
      mes,
      ano,
      userId: session.user.id,
    });

    const primeiroDiaMes = new Date(Number(ano), Number(mes) - 1, 1);
    const ultimoDiaMes = new Date(Number(ano), Number(mes), 0);

    console.log("API Resumo - Período:", { primeiroDiaMes, ultimoDiaMes });

    // Receitas do mês
    const receitas = await db.lancamento.aggregate({
      where: {
        userId: session.user.id,
        tipo: "RECEITA",
        data: {
          gte: primeiroDiaMes,
          lte: ultimoDiaMes,
        },
      },
      _sum: {
        valor: true,
      },
    });

    console.log("API Resumo - Receitas:", receitas);

    // Despesas do mês
    const despesas = await db.lancamento.aggregate({
      where: {
        userId: session.user.id,
        tipo: "DESPESA",
        data: {
          gte: primeiroDiaMes,
          lte: ultimoDiaMes,
        },
      },
      _sum: {
        valor: true,
      },
    });

    console.log("API Resumo - Despesas:", despesas);

    // Despesas compartilhadas pendentes
    const despesasCompartilhadas = await db.lancamentoCompartilhado.aggregate({
      where: {
        usuarioAlvoId: session.user.id,
        status: "PENDENTE",
        lancamento: {
          data: {
            gte: primeiroDiaMes,
            lte: ultimoDiaMes,
          },
        },
      },
      _sum: {
        valorCompartilhado: true,
      },
    });

    console.log("API Resumo - Compartilhadas:", despesasCompartilhadas);

    const resumo = {
      receita: receitas._sum.valor || 0,
      despesa: despesas._sum.valor || 0,
      despesasCompartilhadas:
        despesasCompartilhadas._sum.valorCompartilhado || 0,
      saldo: (receitas._sum.valor || 0) - (despesas._sum.valor || 0),
      limites: 0,
    };

    console.log("API Resumo - Resultado final:", resumo);

    return NextResponse.json(resumo);
  } catch (error) {
    console.error("Erro ao calcular resumo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
