// app/api/pontos/metas/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../../auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: metaId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Verificar se a meta existe e pertence ao usuário
    const meta = await db.metaPontos.findUnique({
      where: { id: metaId },
    });

    if (!meta) {
      return NextResponse.json(
        { error: "Meta não encontrada" },
        { status: 404 }
      );
    }

    if (meta.userId !== userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Deletar a meta
    await db.metaPontos.delete({
      where: { id: metaId },
    });

    return NextResponse.json({ message: "Meta deletada com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar meta:", error);
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
    const { id: metaId } = await params;
    const body = await request.json();
    const { programa, metaPontos, descricao, dataAlvo } = body;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Verificar se a meta existe e pertence ao usuário
    const metaExistente = await db.metaPontos.findUnique({
      where: { id: metaId },
    });

    if (!metaExistente) {
      return NextResponse.json(
        { error: "Meta não encontrada" },
        { status: 404 }
      );
    }

    if (metaExistente.userId !== userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Validações
    if (!programa || !metaPontos || !dataAlvo) {
      return NextResponse.json(
        { error: "Programa, meta e data alvo são obrigatórios" },
        { status: 400 }
      );
    }

    // Atualizar meta
    const metaAtualizada = await db.metaPontos.update({
      where: { id: metaId },
      data: {
        programa,
        metaPontos: parseInt(metaPontos),
        descricao,
        dataAlvo: new Date(dataAlvo),
      },
    });

    return NextResponse.json(metaAtualizada);
  } catch (error) {
    console.error("Erro ao atualizar meta:", error);
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
    const { id: metaId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Buscar meta específica
    const meta = await db.metaPontos.findUnique({
      where: { id: metaId },
    });

    if (!meta) {
      return NextResponse.json(
        { error: "Meta não encontrada" },
        { status: 404 }
      );
    }

    if (meta.userId !== userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    return NextResponse.json(meta);
  } catch (error) {
    console.error("Erro ao buscar meta:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
