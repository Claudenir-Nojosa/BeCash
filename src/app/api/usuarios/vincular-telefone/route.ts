// app/api/usuarios/vincular-telefone/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

export async function POST(request: NextRequest) {
  try {
     const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { telefone } = await request.json();

    if (!telefone) {
      return NextResponse.json(
        { error: "Telefone é obrigatório" },
        { status: 400 }
      );
    }

    // Formatar telefone (remover caracteres especiais)
    const telefoneFormatado = telefone.replace(/\D/g, "");

    // Verificar se telefone já está em uso por outro usuário
    const telefoneExistente = await db.user.findFirst({
      where: {
        telefone: telefoneFormatado,
        NOT: { email: session.user.email }, // Excluir o próprio usuário
      },
    });

    if (telefoneExistente) {
      return NextResponse.json(
        {
          error: "Este telefone já está vinculado a outra conta",
        },
        { status: 400 }
      );
    }

    // Atualizar usuário atual com o telefone
    const usuarioAtualizado = await db.user.update({
      where: { email: session.user.email },
      data: { telefone: telefoneFormatado },
    });

    return NextResponse.json({
      success: true,
      message: "Telefone vinculado com sucesso!",
      usuario: {
        name: usuarioAtualizado.name,
        telefone: usuarioAtualizado.telefone,
      },
    });
  } catch (error: any) {
    console.error("Erro ao vincular telefone:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error: "Este telefone já está em uso por outra conta",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
