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

    // Buscar metas onde o usuário é dono OU colaborador
    const metas = await db.metaPessoal.findMany({
      where: {
        OR: [
          { userId: session.user.id }, // Metas do usuário
          { ColaboradorMeta: { some: { userId: session.user.id } } }, // Metas compartilhadas
        ],
      },
      include: {
        // Incluir informações do dono para identificar metas compartilhadas
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        // Incluir informações de colaboradores
        ColaboradorMeta: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: [{ dataAlvo: "asc" }, { createdAt: "desc" }],
    });

    // Adicionar flag para identificar se é meta compartilhada
    const metasComInfo = metas.map(meta => ({
      ...meta,
      ehCompartilhada: meta.userId !== session.user.id,
    }));

    return NextResponse.json(metasComInfo);
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
    const {
      titulo,
      descricao,
      valorAlvo,
      valorAtual,
      dataAlvo,
      categoria,
      cor,
      icone,
      imagemUrl, // 👈 ADICIONE ESTE CAMPO
    } = body;

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
        valorAtual: parseFloat(valorAtual) || 0,
        dataAlvo: new Date(dataAlvo),
        categoria,
        cor: cor || "#3B82F6",
        icone: icone || "🎯",
        imagemUrl: imagemUrl || null, // 👈 ADICIONE ESTE CAMPO
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
