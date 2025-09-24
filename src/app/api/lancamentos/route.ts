// app/api/lancamentos/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get("mes");
    const ano = searchParams.get("ano");
    const categoria = searchParams.get("categoria");
    const tipo = searchParams.get("tipo");
    // Construir filtros
    const where: any = {};

    if (mes && ano) {
      where.data = {
        gte: new Date(`${ano}-${mes}-01`),
        lt: new Date(`${ano}-${Number(mes) + 1}-01`),
      };
    }

    if (categoria && categoria !== "todas") {
      where.categoria = categoria;
    }

    if (tipo && tipo !== "todos") {
      where.tipo = tipo;
    }

    // Buscar lançamentos do banco
    const lancamentos = await db.lancamento.findMany({
      where,
      orderBy: {
        data: "desc",
      },
      include: {
        usuario: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Calcular totais
    const totaisPorCategoria = await db.lancamento.groupBy({
      where,
      by: ["categoria", "tipo"],
      _sum: {
        valor: true,
      },
    });

    const totalReceitas = await db.lancamento.aggregate({
      where: {
        ...where,
        tipo: "receita",
      },
      _sum: {
        valor: true,
      },
    });

    const totalDespesas = await db.lancamento.aggregate({
      where: {
        ...where,
        tipo: "despesa",
      },
      _sum: {
        valor: true,
      },
    });

    return NextResponse.json({
      lancamentos,
      totaisPorCategoria,
      resumo: {
        receitas: totalReceitas._sum.valor || 0,
        despesas: totalDespesas._sum.valor || 0,
        saldo:
          (totalReceitas._sum.valor || 0) - (totalDespesas._sum.valor || 0),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar lançamentos:", error);
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
      descricao,
      valor,
      tipo,
      categoria,
      tipoLancamento,
      responsavel,
      data,
      pago,
      recorrente,
      frequencia,
      observacoes,
      origem = "manual",
    } = body;

    // Validações básicas
    if (
      !descricao ||
      !valor ||
      !tipo ||
      !categoria ||
      !tipoLancamento ||
      !responsavel ||
      !data
    ) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "teste" },
        { status: 200 }
      );
    }

    const usuarioId = session?.user.id;

    // Criar lançamento no banco
    const lancamento = await db.lancamento.create({
      data: {
        descricao,
        valor: parseFloat(valor),
        tipo,
        categoria,
        tipoLancamento,
        responsavel,
        data: new Date(data),
        pago: Boolean(pago),
        recorrente: Boolean(recorrente),
        frequencia: frequencia || null,
        observacoes: observacoes || null,
        origem,
        usuarioId,
      },
    });

    return NextResponse.json(lancamento, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar lançamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
