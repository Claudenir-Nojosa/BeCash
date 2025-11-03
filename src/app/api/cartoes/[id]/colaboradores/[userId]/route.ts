import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../../../auth";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const params = await context.params;
    const { id: cartaoId, userId } = params;

    console.log(`Removendo colaborador ${userId} do cartão ${cartaoId}`);

    // Verificar se o usuário é o dono do cartão
    const cartao = await db.cartao.findFirst({
      where: {
        id: cartaoId,
        userId: session.user.id, // Só o dono pode remover
      },
    });

    if (!cartao) {
      console.log("Cartão não encontrado ou usuário não é o dono");
      return NextResponse.json(
        { error: "Cartão não encontrado ou você não tem permissão" },
        { status: 404 }
      );
    }

    // Verificar se o colaborador existe
    const colaborador = await db.colaboradorCartao.findFirst({
      where: {
        cartaoId,
        userId,
      },
    });

    if (!colaborador) {
      console.log("Colaborador não encontrado");
      return NextResponse.json(
        { error: "Colaborador não encontrado" },
        { status: 404 }
      );
    }

    // Buscar o usuário para obter o email
    const usuario = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!usuario) {
      console.log("Usuário não encontrado");
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Remover colaborador
    await db.colaboradorCartao.deleteMany({
      where: {
        cartaoId,
        userId,
      },
    });

    // Atualizar convites para CANCELADO
    await db.conviteCartao.updateMany({
      where: {
        cartaoId,
        emailConvidado: usuario.email,
        status: "ACEITO", // Só atualiza convites que foram aceitos
      },
      data: {
        status: "CANCELADO",
        atualizadoEm: new Date(),
      },
    });

    console.log("Colaborador removido com sucesso e convite cancelado");
    return NextResponse.json({ message: "Colaborador removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover colaborador:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
