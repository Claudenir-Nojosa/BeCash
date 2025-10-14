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

    // Autenticação
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const userId = session.user.id;

    // Validar mês e ano
    if (!mes || !ano) {
      return NextResponse.json(
        { error: "Mês e ano são obrigatórios" },
        { status: 400 }
      );
    }

    const mesNum = parseInt(mes);
    const anoNum = parseInt(ano);

    // Calcular datas do período
    const inicioMes = new Date(anoNum, mesNum - 1, 1);
    const fimMes = new Date(anoNum, mesNum, 1);

    // Construir filtros
    const where: any = {
      userId,
      data: {
        gte: inicioMes,
        lt: fimMes,
      },
    };

    if (programa && programa !== "todos") {
      where.programa = programa;
    }

    if (tipo && tipo !== "todos") {
      where.tipo = tipo;
    }

    // Buscar pontos
    const pontos = await db.pontos.findMany({
      where,
      orderBy: {
        data: "desc",
      },
    });

    // Calcular resumo
    const todosPontos = await db.pontos.findMany({
      where: { userId },
    });

    const resumo = {
      totalPontos: calcularSaldoAtual(todosPontos),
      pontosGanhos: calcularTotalPorTipo(pontos, "GANHO"),
      pontosResgatados: calcularTotalPorTipo(pontos, "RESGATE"),
      pontosExpirados: calcularTotalPorTipo(pontos, "EXPIRACAO"),
      valorTotalResgatado: calcularValorResgatado(pontos),
    };

    return NextResponse.json({
      pontos,
      resumo,
    });
  } catch (error) {
    console.error("Erro ao buscar pontos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
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

    // Criar ponto
    const ponto = await db.pontos.create({
      data: {
        programa,
        quantidade: parseInt(quantidade),
        descricao,
        data: new Date(data),
        tipo,
        valorResgate: valorResgate ? parseFloat(valorResgate) : null,
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
    .filter(ponto => ponto.tipo === tipo)
    .reduce((total, ponto) => total + ponto.quantidade, 0);
}

function calcularValorResgatado(pontos: any[]): number {
  return pontos
    .filter(ponto => ponto.tipo === "RESGATE" && ponto.valorResgate)
    .reduce((total, ponto) => total + (ponto.valorResgate || 0), 0);
}