import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import db from "@/lib/db";
import { FaturaService } from "@/lib/faturaService";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cartaoId = searchParams.get("cartaoId");

    let faturas;

    if (cartaoId) {
      faturas = await db.fatura.findMany({
        where: {
          cartaoId,
          cartao: { usuarioId: session.user.id },
        },
        include: {
          lancamentos: {
            include: {
              categoria: true,
            },
          },
          PagamentoFatura: true, // CORREÇÃO: mudado de 'pagamentos' para 'PagamentoFatura'
        },
        orderBy: { mesReferencia: "desc" },
      });
    } else {
      faturas = await db.fatura.findMany({
        where: {
          cartao: { usuarioId: session.user.id },
        },
        include: {
          cartao: true,
          lancamentos: true,
          PagamentoFatura: true, // CORREÇÃO: mudado de 'pagamentos' para 'PagamentoFatura'
        },
        orderBy: { mesReferencia: "desc" },
      });
    }

    return NextResponse.json(faturas);
  } catch (error) {
    console.error("Erro ao buscar faturas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
