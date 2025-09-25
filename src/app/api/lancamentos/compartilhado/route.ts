// app/api/lancamentos/compartilhado/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar lançamentos compartilhados do usuário
    const lancamentos = await db.lancamento.findMany({
      where: {
        OR: [
          { usuarioId: session.user.id, tipoLancamento: "compartilhado" },
          {
            divisao: {
              some: {
                usuarioId: session.user.id,
              },
            },
          },
        ],
      },
      include: {
        divisao: {
          include: {
            usuario: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        data: "desc",
      },
    });

    return NextResponse.json({ lancamentos });
  } catch (error) {
    console.error("Erro ao buscar lançamentos compartilhados:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { descricao, valor, categoria, data, divisao, observacoes } = body;

    // Validar participantes
    if (!divisao || divisao.length === 0) {
      return NextResponse.json(
        { error: "É necessário informar os participantes" },
        { status: 400 }
      );
    }

    // Verificar se o valor total bate com a soma das divisões
    const somaDivisoes = divisao.reduce(
      (sum: number, d: any) => sum + d.valorDivisao,
      0
    );
    const valorTotal = parseFloat(valor.toString());

    if (Math.abs(somaDivisoes - valorTotal) > 0.01) {
      // Tolerância para floats
      return NextResponse.json(
        { error: "A soma das divisões não corresponde ao valor total" },
        { status: 400 }
      );
    }

    // Criar lançamento compartilhado
    const lancamento = await db.lancamento.create({
      data: {
        descricao,
        valor: valorTotal,
        tipo: "despesa",
        categoria,
        tipoLancamento: "compartilhado",
        responsavel: "Compartilhado",
        data: new Date(data),
        observacoes,
        usuarioId: session.user.id,
        divisao: {
          create: divisao.map((p: any) => ({
            usuarioId: p.usuarioId,
            valorDivisao: p.valorDivisao,
            valorPago: 0,
          })),
        },
      },
      include: {
        divisao: {
          include: {
            usuario: true,
          },
        },
      },
    });

    return NextResponse.json(lancamento, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar lançamento compartilhado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

async function calcularSaldosCompartilhados(lancamentoId: string) {
  const lancamento = await db.lancamento.findUnique({
    where: { id: lancamentoId },
    include: {
      divisao: {
        include: {
          usuario: true,
        },
      },
    },
  });

  if (!lancamento) return;

  // Lógica para calcular saldos entre participantes
  // Esta é uma implementação simplificada
  for (const divisao of lancamento.divisao) {
    // Aqui você pode implementar a lógica de cálculo de saldos
    // Por exemplo, comparar valorPago com valorDivisao
  }
}
