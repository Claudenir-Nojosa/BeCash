import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import db from "@/lib/db";

// 🔹 Buscar todas as categorias do usuário
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const categorias = await db.categoria.findMany({
      where: { userId: session.user.id },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json(categorias);
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// 🔹 Criar uma nova categoria
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 🔴 VERIFICAÇÃO DE LIMITE DE CATEGORIAS PARA PLANO FREE
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });

    // Aplicar limite SOMENTE se for free
    if (!subscription || subscription.plano === "free") {
      // Contar categorias do usuário
      const categoriasCount = await db.categoria.count({
        where: { userId: session.user.id },
      });

      // Limite para plano free: 10 categorias
      const LIMITE_CATEGORIAS_FREE = 10;

      if (categoriasCount >= LIMITE_CATEGORIAS_FREE) {
        return NextResponse.json(
          {
            error: "Limite de categorias atingido",
            message: `Plano free permite apenas ${LIMITE_CATEGORIAS_FREE} categorias. Faça upgrade para criar mais.`,
            limite: LIMITE_CATEGORIAS_FREE,
            atual: categoriasCount,
          },
          { status: 403 },
        );
      }
    }

    const body = await request.json();
    const { nome, tipo, cor, icone } = body;

    if (!nome || !tipo) {
      return NextResponse.json(
        { error: "Nome e tipo são obrigatórios" },
        { status: 400 },
      );
    }

    if (!["RECEITA", "DESPESA"].includes(tipo)) {
      return NextResponse.json(
        { error: "Tipo deve ser RECEITA ou DESPESA" },
        { status: 400 },
      );
    }

    const categoria = await db.categoria.create({
      data: {
        nome,
        tipo,
        cor: cor || "#3B82F6",
        icone: icone || "Tag",
        userId: session.user.id,
      },
    });

    return NextResponse.json(categoria, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
