// app/api/lancamentos/[id]/visualizar/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../../auth";

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
    const lancamentoId = params.id;

    const lancamento = await db.lancamento.findUnique({
      where: { id: lancamentoId },
      include: {
        categoria: true,
        cartao: true,
        lancamentosFilhos: {
          include: {
            categoria: true,
            cartao: true,
          },
          orderBy: { parcelaAtual: "asc" },
        },
        LancamentoCompartilhado: {
          include: {
            usuarioAlvo: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            usuarioCriador: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!lancamento) {
      return NextResponse.json(
        { error: "Lançamento não encontrado" },
        { status: 404 }
      );
    }

    if (lancamento.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    return NextResponse.json(lancamento);
  } catch (error) {
    console.error("Erro ao buscar lançamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
