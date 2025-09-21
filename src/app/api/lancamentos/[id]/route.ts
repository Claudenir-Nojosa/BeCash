// app/api/lancamentos/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const { id } = await params; // Adicione await aqui
    const body = await request.json();
    const { pago } = body;

    // Verificar se o lançamento existe e pertence ao usuário
    const lancamentoExistente = await db.lancamento.findUnique({
      where: { id },
    });

    if (!lancamentoExistente) {
      return NextResponse.json(
        { error: "Lançamento não encontrado" },
        { status: 404 }
      );
    }

    if (lancamentoExistente.usuarioId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Atualizar o status de pagamento
    const lancamento = await db.lancamento.update({
      where: { id },
      data: { pago },
    });

    return NextResponse.json(lancamento);
  } catch (error) {
    console.error("Erro ao atualizar lançamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const { id } = await params; // Adicione await aqui

    const lancamento = await db.lancamento.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            name: true,
            email: true,
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

    if (lancamento.usuarioId !== session.user.id) {
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const { id } = await params; // Adicione await aqui

    // Verificar se o lançamento existe e pertence ao usuário
    const lancamentoExistente = await db.lancamento.findUnique({
      where: { id },
    });

    if (!lancamentoExistente) {
      return NextResponse.json(
        { error: "Lançamento não encontrado" },
        { status: 404 }
      );
    }

    if (lancamentoExistente.usuarioId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Excluir o lançamento
    await db.lancamento.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Lançamento excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir lançamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
