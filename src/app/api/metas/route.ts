import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const concluida = searchParams.get("concluida");
    
    const where: any = { usuarioId: session.user.id };
    
    if (concluida !== null) {
      where.concluida = concluida === "true";
    }

    const metas = await db.meta.findMany({
      where,
      include: {
        contribuicoes: {
          orderBy: {
            data: "desc"
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
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
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      titulo,
      descricao,
      valorAlvo,
      dataLimite,
      tipo,
      responsavel,
      categoria,
      icone,
      cor
    } = body;

    if (!titulo || !valorAlvo || !tipo || !responsavel || !categoria) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    const meta = await db.meta.create({
      data: {
        titulo,
        descricao,
        valorAlvo: parseFloat(valorAlvo),
        dataLimite: dataLimite ? new Date(dataLimite) : null,
        tipo,
        responsavel,
        categoria,
        icone,
        cor,
        usuarioId: session.user.id
      }
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