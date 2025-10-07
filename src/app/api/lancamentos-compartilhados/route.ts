// app/api/lancamentos-compartilhados/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import db from "@/lib/db";

// GET - Listar lançamentos compartilhados pendentes
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const lancamentosCompartilhados = await db.lancamentoCompartilhado.findMany(
      {
        where: {
          usuarioAlvoId: session.user.id,
          status: "PENDENTE",
        },
        include: {
          lancamento: {
            include: {
              categoria: true,
              user: {
                // ← Use 'user' em vez de 'usuarioCriador'
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          usuarioCriador: {
            // ← E inclua o usuarioCriador do LancamentoCompartilhado
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }
    );

    return NextResponse.json(lancamentosCompartilhados);
  } catch (error) {
    console.error("Erro ao buscar lançamentos compartilhados:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PATCH - Aceitar/recusar lançamento compartilhado
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { lancamentoCompartilhadoId, action } = body;

    if (!lancamentoCompartilhadoId || !action) {
      return NextResponse.json(
        { error: "ID do lançamento e ação são obrigatórios" },
        { status: 400 }
      );
    }

    if (!["ACEITAR", "RECUSAR"].includes(action)) {
      return NextResponse.json(
        { error: "Ação deve ser ACEITAR ou RECUSAR" },
        { status: 400 }
      );
    }

    // Verificar se o lançamento existe e pertence ao usuário
    const lancamentoCompartilhado = await db.lancamentoCompartilhado.findFirst({
      where: {
        id: lancamentoCompartilhadoId,
        usuarioAlvoId: session.user.id,
        status: "PENDENTE",
      },
      include: {
        lancamento: {
          include: {
            user: {
              // ← Use 'user' aqui também
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        usuarioCriador: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!lancamentoCompartilhado) {
      return NextResponse.json(
        { error: "Lançamento compartilhado não encontrado" },
        { status: 404 }
      );
    }

    if (action === "ACEITAR") {
      // Usar o nome do usuarioCriador do LancamentoCompartilhado
      const nomeUsuarioCriador =
        lancamentoCompartilhado.usuarioCriador?.name ||
        lancamentoCompartilhado.lancamento.user?.name ||
        "Usuário";

      // Criar um novo lançamento para o usuário que aceitou
      const novoLancamento = await db.lancamento.create({
        data: {
          descricao: `Compartilhado: ${lancamentoCompartilhado.lancamento.descricao}`,
          valor: lancamentoCompartilhado.valorCompartilhado,
          tipo: lancamentoCompartilhado.lancamento.tipo,
          metodoPagamento: lancamentoCompartilhado.lancamento.metodoPagamento,
          data: lancamentoCompartilhado.lancamento.data,
          categoriaId: lancamentoCompartilhado.lancamento.categoriaId,
          cartaoId: lancamentoCompartilhado.lancamento.cartaoId,
          observacoes: `Lançamento compartilhado por ${nomeUsuarioCriador}`,
          userId: session.user.id,
          pago: lancamentoCompartilhado.lancamento.pago,
          tipoParcelamento: lancamentoCompartilhado.lancamento.tipoParcelamento,
          parcelasTotal: lancamentoCompartilhado.lancamento.parcelasTotal,
          parcelaAtual: lancamentoCompartilhado.lancamento.parcelaAtual,
          recorrente: lancamentoCompartilhado.lancamento.recorrente,
          dataFimRecorrencia:
            lancamentoCompartilhado.lancamento.dataFimRecorrencia,
        },
      });

      // Atualizar o status para ACEITO
      await db.lancamentoCompartilhado.update({
        where: { id: lancamentoCompartilhadoId },
        data: { status: "ACEITO" },
      });

      return NextResponse.json({
        message: "Lançamento aceito com sucesso",
        lancamento: novoLancamento,
      });
    } else if (action === "RECUSAR") {
      // Atualizar o status para RECUSADO
      await db.lancamentoCompartilhado.update({
        where: { id: lancamentoCompartilhadoId },
        data: { status: "RECUSADO" },
      });

      return NextResponse.json({
        message: "Lançamento recusado",
      });
    }
  } catch (error) {
    console.error("Erro ao processar lançamento compartilhado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
