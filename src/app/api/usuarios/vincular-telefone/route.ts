import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

// GET - Verificar se usuário já tem telefone vinculado
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const usuario = await db.user.findUnique({
      where: { email: session.user.email },
      select: {
        telefone: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json({
      success: true,
      temTelefoneVinculado: !!usuario?.telefone,
      telefone: usuario?.telefone,
      usuario: {
        name: usuario?.name,
        email: usuario?.email,
      },
    });
  } catch (error) {
    console.error("Erro ao verificar telefone:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Vincular telefone (mantém o existente)
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

    // 🔥 NORMALIZAR TELEFONE: remover tudo que não é número
    const telefoneNormalizado = telefone.replace(/\D/g, "");

    console.log(`📞 Telefone recebido: ${telefone}`);
    console.log(`🔧 Telefone normalizado: ${telefoneNormalizado}`);

    // Verificar se usuário já tem telefone vinculado
    const usuarioAtual = await db.user.findUnique({
      where: { email: session.user.email },
      select: { telefone: true },
    });

    if (usuarioAtual?.telefone) {
      return NextResponse.json({
        success: false,
        error: "Você já possui um telefone vinculado",
        telefoneAtual: usuarioAtual.telefone,
      }, { status: 400 });
    }

    // Verificar se telefone já está em uso por outro usuário
    const telefoneExistente = await db.user.findFirst({
      where: {
        OR: [
          { telefone: telefoneNormalizado },
          { telefone: `+${telefoneNormalizado}` },
          { telefone: telefoneNormalizado.replace(/^55/, "") },
          { telefone: `+55${telefoneNormalizado.replace(/^55/, "")}` },
        ],
        NOT: { email: session.user.email },
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

    // 🔥 SALVAR SEM DDI (apenas números)
    const telefoneParaSalvar = telefoneNormalizado.replace(/^55/, "");

    // Atualizar usuário atual com o telefone
    const usuarioAtualizado = await db.user.update({
      where: { email: session.user.email },
      data: { telefone: telefoneParaSalvar },
    });

    console.log(`✅ Telefone salvo no banco: ${telefoneParaSalvar}`);

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

// DELETE - Desvincular telefone
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const usuarioAtualizado = await db.user.update({
      where: { email: session.user.email },
      data: { telefone: null },
    });

    return NextResponse.json({
      success: true,
      message: "Telefone desvinculado com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao desvincular telefone:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}