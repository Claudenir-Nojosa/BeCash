// app/api/faturas/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import db from "@/lib/db";

// Correção: Use esta assinatura para rotas dinâmicas no App Router
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // params é uma Promise
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Aguarde os params serem resolvidos
    const params = await context.params;
    const faturaId = params.id;

    const fatura = await db.fatura.findFirst({
      where: {
        id: faturaId,
        cartao: {
          userId: session.user.id,
        },
      },
      include: {
        cartao: {
          select: {
            id: true,
            nome: true,
            bandeira: true,
            cor: true,
          },
        },
        lancamentos: {
          select: {
            id: true,
            descricao: true,
            valor: true,
            data: true,
          },
          orderBy: {
            data: "desc",
          },
        },
      },
    });

    if (!fatura) {
      return NextResponse.json(
        { error: "Fatura não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(fatura);
  } catch (error) {
    console.error("Erro ao buscar fatura:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
