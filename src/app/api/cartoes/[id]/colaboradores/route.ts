import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../../auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const params = await context.params;
    const cartaoId = params.id;

    // Verificar se o usuário tem acesso ao cartão (dono ou colaborador)
    const cartao = await db.cartao.findFirst({
      where: {
        id: cartaoId,
        OR: [
          { userId: session.user.id },
          { ColaboradorCartao: { some: { userId: session.user.id } } },
        ],
      },
      include: {
        // 👇 CORREÇÃO: Use o nome correto
        ColaboradorCartao: {
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
        // 👇 CORREÇÃO: Use o nome correto
        ConviteCartao: {
          where: {
            status: "PENDENTE",
          },
        },
      },
    });

    if (!cartao) {
      return NextResponse.json(
        { error: "Cartão não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      colaboradores: cartao.ColaboradorCartao,
      convites: cartao.ConviteCartao,
    });
  } catch (error) {
    console.error("Erro ao buscar colaboradores:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const params = await context.params;
    const cartaoId = params.id;
    const body = await request.json();
    const { emailConvidado, permissao = "LEITURA" } = body;

    if (!emailConvidado) {
      return NextResponse.json(
        { error: "Email do convidado é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o usuário é o dono do cartão
    const cartao = await db.cartao.findFirst({
      where: {
        id: cartaoId,
        userId: session.user.id,
      },
    });

    if (!cartao) {
      return NextResponse.json(
        { error: "Cartão não encontrado ou você não tem permissão" },
        { status: 404 }
      );
    }

    // Verificar se o convidado já existe como usuário
    const usuarioConvidado = await db.user.findUnique({
      where: { email: emailConvidado },
    });

    if (!usuarioConvidado) {
      return NextResponse.json(
        { error: "Usuário não encontrado no sistema" },
        { status: 404 }
      );
    }

    // Verificar se o usuário está tentando convidar a si mesmo
    if (usuarioConvidado.id === session.user.id) {
      return NextResponse.json(
        { error: "Você não pode convidar a si mesmo" },
        { status: 400 }
      );
    }

    // Verificar se já é colaborador ATIVO
    const jaColaborador = await db.colaboradorCartao.findFirst({
      where: {
        cartaoId,
        userId: usuarioConvidado.id,
      },
    });

    if (jaColaborador) {
      return NextResponse.json(
        { error: "Usuário já é colaborador deste cartão" },
        { status: 400 }
      );
    }

    // Verificar se já existe convite PENDENTE
    const convitePendente = await db.conviteCartao.findFirst({
      where: {
        cartaoId,
        emailConvidado,
        status: "PENDENTE",
      },
    });

    if (convitePendente) {
      return NextResponse.json(
        { error: "Já existe um convite pendente para este email" },
        { status: 400 }
      );
    }

    // Se existe um convite antigo (ACEITO, RECUSADO, etc), vamos atualizá-lo
    const conviteExistente = await db.conviteCartao.findFirst({
      where: {
        cartaoId,
        emailConvidado,
        status: { in: ["ACEITO", "RECUSADO", "EXPIRADO", "CANCELADO"] },
      },
    });

    // Criar token único
    const token =
      Math.random().toString(36).substring(2) + Date.now().toString(36);

    if (conviteExistente) {
      // Atualizar convite existente
      const convite = await db.conviteCartao.update({
        where: { id: conviteExistente.id },
        data: {
          token,
          status: "PENDENTE",
          expiraEm: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
          atualizadoEm: new Date(),
        },
      });

      console.log(`Convite reativado: ${token} para ${emailConvidado}`);
      return NextResponse.json(convite, { status: 200 });
    } else {
      // Criar novo convite
      const convite = await db.conviteCartao.create({
        data: {
          cartaoId,
          emailConvidado,
          token,
          status: "PENDENTE",
          expiraEm: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
          usuarioCriadorId: session.user.id,
        },
      });

      console.log(`Convite criado: ${token} para ${emailConvidado}`);
      return NextResponse.json(convite, { status: 201 });
    }
  } catch (error: any) {
    console.error("Erro ao convidar colaborador:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe um convite para este email" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
