import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar convites pendentes para o usuário logado
    const convitesPendentes = await db.conviteCartao.findMany({
      where: {
        emailConvidado: session.user.email!,
        status: "PENDENTE",
        expiraEm: { gt: new Date() },
      },
      include: {
        cartao: {
          select: {
            id: true,
            nome: true,
            bandeira: true,
            cor: true,
          },
        },
        usuarioCriador: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    return NextResponse.json(convitesPendentes);
  } catch (error) {
    console.error("Erro ao buscar convites pendentes:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}