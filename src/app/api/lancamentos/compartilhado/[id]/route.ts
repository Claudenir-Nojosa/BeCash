// app/api/lancamentos/compartilhado/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../../auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const lancamentoId = params.id;

    const divisoes = await db.divisaoLancamento.findMany({
      where: { lancamentoId },
      include: {
        usuario: true,
        lancamento: true,
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
