// app/api/cartoes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Extrair o ID da URL manualmente (mesmo método que funciona na outra rota)
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const cartaoId = pathParts[pathParts.length - 1];

    if (!cartaoId) {
      return NextResponse.json(
        { error: "ID do cartão não fornecido" },
        { status: 400 }
      );
    }

    const cartao = await db.cartao.findFirst({
      where: {
        id: cartaoId,
        userId: session.user.id,
      },
      include: {
        lancamentos: {
          include: {
            categoria: true, // 👈 ADICIONAR ESTA LINHA
            Fatura: {
              select: {
                status: true,
                mesReferencia: true,
              },
            },
          },
          orderBy: {
            data: "desc",
          },
        },
        Fatura: {
          orderBy: {
            mesReferencia: "desc",
          },
        },
      },
    });

    if (!cartao) {
      return NextResponse.json(
        { error: "Cartão não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(cartao);
  } catch (error) {
    console.error("Erro ao buscar cartão:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar cartão
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Extrair o ID da URL manualmente
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const cartaoId = pathParts[pathParts.length - 1];

    if (!cartaoId) {
      return NextResponse.json(
        { error: "ID do cartão não fornecido" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      nome,
      bandeira,
      limite,
      diaFechamento,
      diaVencimento,
      cor,
      observacoes,
    } = body;

    // Verificar se o cartão pertence ao usuário
    const cartaoExistente = await db.cartao.findFirst({
      where: {
        id: cartaoId,
        userId: session.user.id,
      },
    });

    if (!cartaoExistente) {
      return NextResponse.json(
        { error: "Cartão não encontrado" },
        { status: 404 }
      );
    }

    // Validações
    if (!nome || !bandeira || !limite || !diaFechamento || !diaVencimento) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    if (
      diaFechamento < 1 ||
      diaFechamento > 31 ||
      diaVencimento < 1 ||
      diaVencimento > 31
    ) {
      return NextResponse.json(
        { error: "Dias de fechamento e vencimento devem ser entre 1 e 31" },
        { status: 400 }
      );
    }

    const cartao = await db.cartao.update({
      where: {
        id: cartaoId,
      },
      data: {
        nome,
        bandeira,
        limite: parseFloat(limite),
        diaFechamento: parseInt(diaFechamento),
        diaVencimento: parseInt(diaVencimento),
        cor,
        observacoes: observacoes || null,
      },
    });

    return NextResponse.json(cartao);
  } catch (error) {
    console.error("Erro ao atualizar cartão:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Extrair o ID da URL manualmente
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const cartaoId = pathParts[pathParts.length - 1];

    if (!cartaoId) {
      return NextResponse.json(
        { error: "ID do cartão não fornecido" },
        { status: 400 }
      );
    }

    // Verificar se o cartão pertence ao usuário
    const cartao = await db.cartao.findFirst({
      where: {
        id: cartaoId,
        userId: session.user.id,
      },
      include: {
        lancamentos: {
          where: {
            pago: false,
          },
        },
      },
    });

    if (!cartao) {
      return NextResponse.json(
        { error: "Cartão não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se existem lançamentos em aberto
    if (cartao.lancamentos.length > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir cartão com lançamentos em aberto" },
        { status: 400 }
      );
    }

    // Excluir o cartão
    await db.cartao.delete({
      where: {
        id: cartaoId,
      },
    });

    return NextResponse.json({ message: "Cartão excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir cartão:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
