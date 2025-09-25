// app/api/usuarios/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar todos os usuários (no seu caso, você e sua esposa)
    // Você pode ajustar para buscar apenas usuários específicos
    const usuarios = await db.usuario.findMany({
      where: {
        // Filtre pelos usuários que participam do compartilhamento
        // Por exemplo, você pode ter uma tabela de "parceiros" ou usar emails específicos
        OR: [
          { email: "clau.nojosaf@gmail.com" }, // Seu email
          { email: "blaurindo23@gmail.com" }, // Email da sua esposa
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json({ usuarios });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
