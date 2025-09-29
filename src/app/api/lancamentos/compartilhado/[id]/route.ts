// app/api/lancamentos/compartilhado/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../../auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params; // Adicione await aqui

    const divisoes = await db.divisaoLancamento.findMany({
      where: { lancamentoId: id },
      include: {
        usuario: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lancamento: {
          select: {
            id: true,
            descricao: true,
            valor: true,
            tipo: true,
            data: true,
          },
        },
      },
    });

    return NextResponse.json({ divisoes });
  } catch (error) {
    console.error("Erro ao buscar divisões:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
