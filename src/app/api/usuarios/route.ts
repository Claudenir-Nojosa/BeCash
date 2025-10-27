// app/api/usuarios/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth"; // Ajuste o caminho conforme sua estrutura
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    console.log("API Usuários - Sessão:", session?.user?.id);

    if (!session?.user?.id) {
      console.log("API Usuários - Não autorizado");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Busca todos os usuários exceto o usuário atual
    const usuarios = await db.user.findMany({
      where: {
        id: {
          not: session.user.id,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log("API Usuários - Usuários encontrados:", usuarios.length);

    return NextResponse.json(usuarios);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
