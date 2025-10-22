// app/api/dashboard/metas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const metas = await db.metaPessoal.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [{ dataAlvo: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(metas);
  } catch (error) {
    console.error("Erro ao buscar metas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { titulo, descricao, valorAlvo, dataAlvo, categoria, cor, icone } =
      body;

    if (!titulo || !valorAlvo || !dataAlvo || !categoria) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    if (valorAlvo <= 0) {
      return NextResponse.json(
        { error: "Valor alvo deve ser maior que zero" },
        { status: 400 }
      );
    }

    const meta = await db.metaPessoal.create({
      data: {
        titulo,
        descricao: descricao || null,
        valorAlvo: parseFloat(valorAlvo),
        dataAlvo: new Date(dataAlvo),
        categoria,
        cor: cor || "#3B82F6",
        icone: icone || "🎯",
        userId: session.user.id,
      },
    });

    return NextResponse.json(meta, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar meta:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
