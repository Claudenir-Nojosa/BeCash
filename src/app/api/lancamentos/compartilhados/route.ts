// app/api/lancamentos/compartilhados/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

// GET - Buscar lançamentos compartilhados pendentes
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const whereClause: any = {
      usuarioAlvoId: session.user.id,
    };

    if (status) {
      whereClause.status = status;
    }

    const lancamentosCompartilhados = await db.lancamentoCompartilhado.findMany(
      {
        where: whereClause,
        include: {
          lancamento: {
            include: {
              categoria: true,
              cartao: true,
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
          usuarioCriador: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
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

// PATCH - Atualizar status do lançamento compartilhado
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { lancamentoCompartilhadoId, status } = body;

    if (!lancamentoCompartilhadoId || !status) {
      return NextResponse.json(
        { error: "ID do lançamento compartilhado e status são obrigatórios" },
        { status: 400 }
      );
    }

    if (!["ACEITO", "RECUSADO"].includes(status)) {
      return NextResponse.json(
        { error: "Status deve ser ACEITO ou RECUSADO" },
        { status: 400 }
      );
    }

    // Verificar se o lançamento compartilhado pertence ao usuário
    const lancamentoCompartilhado = await db.lancamentoCompartilhado.findFirst({
      where: {
        id: lancamentoCompartilhadoId,
        usuarioAlvoId: session.user.id,
        status: "PENDENTE",
      },
      include: {
        lancamento: true,
      },
    });

    if (!lancamentoCompartilhado) {
      return NextResponse.json(
        { error: "Lançamento compartilhado não encontrado ou já processado" },
        { status: 404 }
      );
    }

    // Atualizar status
    const updated = await db.lancamentoCompartilhado.update({
      where: { id: lancamentoCompartilhadoId },
      data: { status },
    });

    // Se aceito, criar o lançamento para o usuário alvo
    if (status === "ACEITO") {
      const lancamentoOriginal = lancamentoCompartilhado.lancamento;

      await db.lancamento.create({
        data: {
          descricao: `${lancamentoOriginal.descricao} (Compartilhado)`,
          valor: lancamentoCompartilhado.valorCompartilhado,
          tipo: lancamentoOriginal.tipo,
          metodoPagamento: lancamentoOriginal.metodoPagamento,
          data: lancamentoOriginal.data,
          categoriaId: lancamentoOriginal.categoriaId,
          cartaoId: lancamentoOriginal.cartaoId,
          observacoes: `Compartilhado por: ${lancamentoCompartilhado.usuarioCriadorId}`,
          userId: session.user.id,
          pago: lancamentoOriginal.pago,
          tipoParcelamento: lancamentoOriginal.tipoParcelamento,
          parcelasTotal: lancamentoOriginal.parcelasTotal,
          parcelaAtual: lancamentoOriginal.parcelaAtual,
          recorrente: lancamentoOriginal.recorrente,
          dataFimRecorrencia: lancamentoOriginal.dataFimRecorrencia,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar lançamento compartilhado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
