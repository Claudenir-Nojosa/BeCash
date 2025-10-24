// app/api/pontos/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pontoId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Verificar se o ponto existe e pertence ao usuário
    const ponto = await db.pontos.findUnique({
      where: { id: pontoId },
    });

    if (!ponto) {
      return NextResponse.json(
        { error: "Ponto não encontrado" },
        { status: 404 }
      );
    }

    if (ponto.userId !== userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Deletar o ponto
    await db.pontos.delete({
      where: { id: pontoId },
    });

    return NextResponse.json({ message: "Ponto deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar ponto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pontoId } = await params;
    const body = await request.json();
    const { programa, quantidade, descricao, data, tipo, valorResgate } = body;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Verificar se o ponto existe e pertence ao usuário
    const pontoExistente = await db.pontos.findUnique({
      where: { id: pontoId },
    });

    if (!pontoExistente) {
      return NextResponse.json(
        { error: "Ponto não encontrado" },
        { status: 404 }
      );
    }

    if (pontoExistente.userId !== userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Validações
    if (!programa || !quantidade || !descricao || !data || !tipo) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    // Atualizar ponto
    const pontoAtualizado = await db.pontos.update({
      where: { id: pontoId },
      data: {
        programa,
        quantidade: parseInt(quantidade),
        descricao,
        data: new Date(data),
        tipo,
        valorResgate: valorResgate ? parseFloat(valorResgate) : null,
      },
    });

    return NextResponse.json(pontoAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar ponto:", error);
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
    const { id: pontoId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Buscar ponto específico
    const ponto = await db.pontos.findUnique({
      where: { id: pontoId },
    });

    if (!ponto) {
      return NextResponse.json(
        { error: "Ponto não encontrado" },
        { status: 404 }
      );
    }

    if (ponto.userId !== userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    return NextResponse.json(ponto);
  } catch (error) {
    console.error("Erro ao buscar ponto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
