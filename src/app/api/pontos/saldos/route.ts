// app/api/pontos/saldos/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

export async function GET(request: NextRequest) {
  try {
    // Autenticação
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const userId = session.user.id;

    // Buscar TODOS os pontos sem filtro de data
    const todosPontos = await db.pontos.findMany({
      where: { userId },
      orderBy: {
        data: "desc",
      },
    });

    // Calcular saldos por programa
    const saldosPorPrograma: { [programa: string]: number } = {};

    todosPontos.forEach((ponto) => {
      if (!saldosPorPrograma[ponto.programa]) {
        saldosPorPrograma[ponto.programa] = 0;
      }

      if (ponto.tipo === "GANHO" || ponto.tipo === "TRANSFERENCIA") {
        saldosPorPrograma[ponto.programa] += ponto.quantidade;
      } else if (ponto.tipo === "RESGATE" || ponto.tipo === "EXPIRACAO") {
        saldosPorPrograma[ponto.programa] -= ponto.quantidade;
      }
    });

    // Calcular CPM por programa
    const cpmPorPrograma: { [programa: string]: number } = {};

    Object.keys(saldosPorPrograma).forEach((programa) => {
      const pontosComGasto = todosPontos.filter(
        (ponto) =>
          ponto.programa === programa &&
          ponto.tipo === "GANHO" &&
          ponto.valorGasto &&
          ponto.valorGasto > 0
      );

      const totalGasto = pontosComGasto.reduce(
        (sum, ponto) => sum + (ponto.valorGasto || 0),
        0
      );
      const totalPontos = pontosComGasto.reduce(
        (sum, ponto) => sum + ponto.quantidade,
        0
      );

      cpmPorPrograma[programa] =
        totalPontos > 0 ? totalGasto / (totalPontos / 1000) : 0;
    });

    return NextResponse.json({
      todosPontos,
      saldosPorPrograma,
      cpmPorPrograma,
    });
  } catch (error) {
    console.error("Erro ao buscar saldos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
