// app/api/dashboard/limites/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import db from "@/lib/db";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params; // Desestruturar após await
    const body = await request.json();
    const {
      titulo,
      descricao,
      valorAlvo,
      valorAtual,
      dataAlvo,
      categoria,
      cor,
      icone,
    } = body;

    // Verificar se a meta pertence ao usuário
    const metaExistente = await db.metaPessoal.findFirst({
      where: {
        id: id, // Usar id desestruturado
        userId: session.user.id,
      },
    });

    if (!metaExistente) {
      return NextResponse.json(
        { error: "Meta não encontrada" },
        { status: 404 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {};

    // Se estiver atualizando apenas o valorAtual (do botão +)
    if (valorAtual !== undefined && Object.keys(body).length === 1) {
      updateData.valorAtual = parseFloat(valorAtual);
    } else {
      // Se estiver fazendo uma edição completa, validar campos obrigatórios
      if (!titulo || !valorAlvo || !dataAlvo || !categoria) {
        return NextResponse.json(
          { error: "Campos obrigatórios faltando" },
          { status: 400 }
        );
      }

      updateData.titulo = titulo;
      updateData.descricao = descricao || "";
      updateData.valorAlvo = parseFloat(valorAlvo);
      updateData.valorAtual = parseFloat(valorAtual);
      updateData.dataAlvo = new Date(dataAlvo);
      updateData.categoria = categoria;
      updateData.cor = cor || "#3B82F6";
      updateData.icone = icone || "🏠";
    }

    const meta = await db.metaPessoal.update({
      where: { id: id }, // Usar id desestruturado
      data: updateData,
    });

    return NextResponse.json(meta);
  } catch (error) {
    console.error("Erro ao atualizar meta:", error);
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
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params; // Desestruturar após await

    // Verificar se a meta pertence ao usuário
    const metaExistente = await db.metaPessoal.findFirst({
      where: {
        id: id, // Usar id desestruturado
        userId: session.user.id,
      },
    });

    if (!metaExistente) {
      return NextResponse.json(
        { error: "Meta não encontrada" },
        { status: 404 }
      );
    }

    await db.metaPessoal.delete({
      where: { id: id }, // Usar id desestruturado
    });

    return NextResponse.json({ message: "Meta excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir meta:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
