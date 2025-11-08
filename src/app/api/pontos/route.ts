// app/api/pontos/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get("mes");
    const ano = searchParams.get("ano");
    const programa = searchParams.get("programa");
    const tipo = searchParams.get("tipo");
    const todos = searchParams.get("todos"); // ← Novo parâmetro

    // Autenticação
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const userId = session.user.id;

    // Construir filtros
    const where: any = { userId };

    // Se não for "todos", aplicar filtro de data
    if (!todos) {
      if (!mes || !ano) {
        return NextResponse.json(
          { error: "Mês e ano são obrigatórios" },
          { status: 400 }
        );
      }

      const mesNum = parseInt(mes);
      const anoNum = parseInt(ano);

      const inicioMes = new Date(anoNum, mesNum - 1, 1);
      const fimMes = new Date(anoNum, mesNum, 1);

      where.data = {
        gte: inicioMes,
        lt: fimMes,
      };
    }

    if (programa && programa !== "todos") {
      where.programa = programa;
    }

    if (tipo && tipo !== "todos") {
      where.tipo = tipo;
    }

    // Resto do código permanece igual...
    const pontos = await db.pontos.findMany({
      where,
      orderBy: {
        data: "desc",
      },
    });

    // 🆕 Buscar TODOS os pontos para calcular saldos totais
    const todosPontos = await db.pontos.findMany({
      where: { userId },
    });

    const analiseCPM = calcularAnaliseCPM(pontos);

    const resumo = {
      totalPontos: calcularSaldoAtual(todosPontos), // ← Agora usa todosPontos
      pontosGanhos: calcularTotalPorTipo(pontos, "GANHO"),
      pontosResgatados: calcularTotalPorTipo(pontos, "RESGATE"),
      pontosExpirados: calcularTotalPorTipo(pontos, "EXPIRACAO"),
      valorTotalResgatado: calcularValorResgatado(pontos),
      analiseCPM,
      // 🆕 Adicionar saldos por programa
      saldosPorPrograma: calcularSaldosPorPrograma(todosPontos),
      cpmPorPrograma: calcularCPMPorPrograma(todosPontos),
    };

    return NextResponse.json({
      pontos,
      resumo,
      todosPontos: todos ? todosPontos : [], // ← Retorna todos se solicitado
    });
  } catch (error) {
    console.error("Erro ao buscar pontos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// 🆕 Adicionar estas funções auxiliares
function calcularSaldosPorPrograma(pontos: any[]): {
  [programa: string]: number;
} {
  const saldos: { [programa: string]: number } = {};

  pontos.forEach((ponto) => {
    if (!saldos[ponto.programa]) {
      saldos[ponto.programa] = 0;
    }

    if (ponto.tipo === "GANHO" || ponto.tipo === "TRANSFERENCIA") {
      saldos[ponto.programa] += ponto.quantidade;
    } else if (ponto.tipo === "RESGATE" || ponto.tipo === "EXPIRACAO") {
      saldos[ponto.programa] -= ponto.quantidade;
    }
  });

  return saldos;
}

function calcularCPMPorPrograma(pontos: any[]): { [programa: string]: number } {
  const cpm: { [programa: string]: number } = {};

  const programas = [...new Set(pontos.map((p) => p.programa))];

  programas.forEach((programa) => {
    const pontosComGasto = pontos.filter(
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

    cpm[programa] = totalPontos > 0 ? totalGasto / (totalPontos / 1000) : 0;
  });

  return cpm;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      programa,
      quantidade,
      descricao,
      data,
      tipo,
      valorResgate,
      // 🆕 Novos campos
      valorGasto,
      tipoTransferencia,
      bonusPercentual,
      pontosOriginais,
    } = body;

    // Autenticação
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const userId = session.user.id;

    // Validações
    if (!programa || !quantidade || !descricao || !data || !tipo) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    // 🆕 Calcular CPM automaticamente
    let custoPorMilheiro = null;
    let pontosBonus = null;
    let pontosFinais = parseInt(quantidade);

    if (valorGasto && parseFloat(valorGasto) > 0) {
      if (tipoTransferencia === "TRANSFERENCIA" && bonusPercentual) {
        // Para transferências com bônus
        pontosBonus = Math.round(
          pontosFinais * (parseFloat(bonusPercentual) / 100)
        );
        custoPorMilheiro = parseFloat(valorGasto) / (pontosFinais / 1000);
      } else {
        // Para compras normais
        custoPorMilheiro = parseFloat(valorGasto) / (pontosFinais / 1000);
      }
    }

    // Criar ponto
    const ponto = await db.pontos.create({
      data: {
        programa,
        quantidade: pontosFinais,
        descricao,
        data: new Date(data),
        tipo,
        valorResgate: valorResgate ? parseFloat(valorResgate) : null,
        // 🆕 Novos campos
        valorGasto: valorGasto ? parseFloat(valorGasto) : null,
        custoPorMilheiro,
        tipoTransferencia: tipoTransferencia || "COMPRA",
        bonusPercentual: bonusPercentual ? parseFloat(bonusPercentual) : null,
        pontosOriginais: pontosOriginais ? parseInt(pontosOriginais) : null,
        pontosBonus,
        userId,
      },
    });

    return NextResponse.json(ponto, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar ponto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// 🆕 Adicione esta função para calcular análise CPM
function calcularAnaliseCPM(pontos: any[]) {
  const pontosComGasto = pontos.filter(
    (ponto) =>
      ponto.tipo === "GANHO" && ponto.valorGasto && ponto.valorGasto > 0
  );

  const totalGasto = pontosComGasto.reduce(
    (sum, ponto) => sum + ponto.valorGasto,
    0
  );
  const totalPontosGanhos = pontosComGasto.reduce(
    (sum, ponto) => sum + ponto.quantidade,
    0
  );

  const cpmGeral =
    totalPontosGanhos > 0 ? totalGasto / (totalPontosGanhos / 1000) : 0;

  // CPM por programa
  const cpmPorPrograma = pontosComGasto.reduce((acc, ponto) => {
    if (!acc[ponto.programa]) {
      acc[ponto.programa] = { totalGasto: 0, totalPontos: 0, cpm: 0 };
    }
    acc[ponto.programa].totalGasto += ponto.valorGasto;
    acc[ponto.programa].totalPontos += ponto.quantidade;
    acc[ponto.programa].cpm =
      acc[ponto.programa].totalPontos > 0
        ? acc[ponto.programa].totalGasto /
          (acc[ponto.programa].totalPontos / 1000)
        : 0;
    return acc;
  }, {} as any);

  return {
    totalGasto,
    totalPontosGanhos,
    cpmGeral,
    cpmPorPrograma,
    quantidadeRegistros: pontosComGasto.length,
  };
}

// Funções auxiliares
function calcularSaldoAtual(pontos: any[]): number {
  return pontos.reduce((saldo, ponto) => {
    if (ponto.tipo === "GANHO") {
      return saldo + ponto.quantidade;
    } else {
      return saldo - ponto.quantidade;
    }
  }, 0);
}

function calcularTotalPorTipo(pontos: any[], tipo: string): number {
  return pontos
    .filter((ponto) => ponto.tipo === tipo)
    .reduce((total, ponto) => total + ponto.quantidade, 0);
}

function calcularValorResgatado(pontos: any[]): number {
  return pontos
    .filter((ponto) => ponto.tipo === "RESGATE" && ponto.valorResgate)
    .reduce((total, ponto) => total + (ponto.valorResgate || 0), 0);
}
