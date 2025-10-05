import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const metas = await db.metaPontos.findMany({
      where: { usuarioId: session.user.id },
      orderBy: { dataAlvo: "asc" },
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
    const body = await request.json();
    const { programa, metaPontos, descricao, dataAlvo } = body;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!programa || !metaPontos || !dataAlvo) {
      return NextResponse.json(
        { error: "Programa, meta e data alvo são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se já existe meta para este programa
    const metaExistente = await db.metaPontos.findFirst({
      where: {
        programa,
        usuarioId: session.user.id,
      },
    });

    let meta;
    if (metaExistente) {
      // Atualizar meta existente
      meta = await db.metaPontos.update({
        where: { id: metaExistente.id },
        data: {
          metaPontos: parseInt(metaPontos),
          descricao,
          dataAlvo: new Date(dataAlvo),
        },
      });
    } else {
      // Criar nova meta
      meta = await db.metaPontos.create({
        data: {
          programa,
          metaPontos: parseInt(metaPontos),
          descricao,
          dataAlvo: new Date(dataAlvo),
          usuarioId: session.user.id,
        },
      });
    }

    return NextResponse.json(meta, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar/atualizar meta:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}