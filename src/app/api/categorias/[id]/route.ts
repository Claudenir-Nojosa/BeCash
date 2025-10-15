import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import db from "@/lib/db";

// 🔹 Atualizar categoria
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // CORREÇÃO: Adicione Promise
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params; // CORREÇÃO: Aguarde o params
    const body = await request.json();
    const { nome, tipo, cor, icone } = body;

    if (!nome || !tipo) {
      return NextResponse.json(
        { error: "Nome e tipo são obrigatórios" },
        { status: 400 }
      );
    }

    const categoriaExistente = await db.categoria.findUnique({
      where: { id },
    });

    if (!categoriaExistente || categoriaExistente.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    const categoriaAtualizada = await db.categoria.update({
      where: { id },
      data: {
        nome,
        tipo,
        cor: cor || "#3B82F6",
        icone: icone || "Tag",
      },
    });

    return NextResponse.json(categoriaAtualizada);
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// 🔹 Deletar categoria
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // CORREÇÃO: Adicione Promise
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params; // CORREÇÃO: Aguarde o params

    const categoria = await db.categoria.findUnique({ where: { id } });

    if (!categoria || categoria.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    await db.categoria.delete({ where: { id } });

    return NextResponse.json({ message: "Categoria deletada com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar categoria:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
