// app/api/lancamentos/recorrentes/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const recorencias = await db.lancamentoRecorrente.findMany({
      where: {
        usuarioId: session.user.id,
      },
      include: {
        ocorrencias: {
          orderBy: {
            data: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(recorencias);
  } catch (error) {
    console.error("Erro ao buscar recorrências:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ativo } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID da recorrência é obrigatório" },
        { status: 400 }
      );
    }

    const recorrente = await db.lancamentoRecorrente.update({
      where: {
        id,
        usuarioId: session.user.id,
      },
      data: {
        ativo,
      },
    });

    return NextResponse.json(recorrente);
  } catch (error) {
    console.error("Erro ao atualizar recorrência:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}