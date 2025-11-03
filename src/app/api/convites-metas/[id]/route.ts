import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const params = await context.params;
    const conviteId = params.id;
    const body = await request.json();
    const { acao } = body; // "ACEITAR" ou "RECUSAR"

    if (!["ACEITAR", "RECUSAR"].includes(acao)) {
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }

    // Buscar convite
    const convite = await db.conviteMeta.findFirst({
      where: {
        id: conviteId,
        emailConvidado: session.user.email!,
        status: "PENDENTE",
        expiraEm: { gt: new Date() },
      },
      include: {
        meta: true,
      },
    });

    if (!convite) {
      return NextResponse.json(
        { error: "Convite não encontrado, expirado ou já utilizado" },
        { status: 404 }
      );
    }

    if (acao === "ACEITAR") {
      // Adicionar como colaborador
      await db.colaboradorMeta.create({
        data: {
          metaId: convite.metaId,
          userId: session.user.id,
          permissao: "LEITURA",
        },
      });

      // Atualizar status do convite
      await db.conviteMeta.update({
        where: { id: convite.id },
        data: { status: "ACEITO" },
      });

      return NextResponse.json({ message: "Convite aceito com sucesso" });
    } else {
      // Recusar convite
      await db.conviteMeta.update({
        where: { id: convite.id },
        data: { status: "RECUSADO" },
      });

      return NextResponse.json({ message: "Convite recusado" });
    }
  } catch (error) {
    console.error("Erro ao processar convite:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
