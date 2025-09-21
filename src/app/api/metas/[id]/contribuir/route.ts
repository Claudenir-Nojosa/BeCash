import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../../auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { valor, observacoes } = body;

    if (!valor || valor <= 0) {
      return NextResponse.json(
        { error: "Valor deve ser maior que zero" },
        { status: 400 }
      );
    }

    // Verificar se a meta existe e pertence ao usuário
    const meta = await db.meta.findUnique({
      where: { id },
    });

    if (!meta) {
      return NextResponse.json(
        { error: "Meta não encontrada" },
        { status: 404 }
      );
    }

    if (meta.usuarioId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    if (meta.concluida) {
      return NextResponse.json({ error: "Meta já concluída" }, { status: 400 });
    }

    // Calcular novo valor atual
    const novoValorAtual = meta.valorAtual + parseFloat(valor);
    const tolerancia = 0.01; // 1 centavo de tolerância
    const concluida = novoValorAtual >= meta.valorAlvo - tolerancia;

    const valorContribuicaoAjustado = concluida
      ? Math.min(parseFloat(valor), meta.valorAlvo - meta.valorAtual)
      : parseFloat(valor);

    // Criar lançamento de despesa automaticamente
    const lancamento = await db.lancamento.create({
      data: {
        descricao: `Contribuição para meta: ${meta.titulo}`,
        valor: valorContribuicaoAjustado, // Usar valor ajustado
        tipo: "despesa",
        categoria: "outros",
        tipoLancamento: meta.tipo,
        responsavel: meta.responsavel,
        data: new Date(),
        pago: true,
        observacoes: observacoes || `Contribuição para meta: ${meta.titulo}`,
        origem: "meta",
        usuarioId: session.user.id,
      },
    });

    // Criar contribuição e atualizar meta
    const contribuicao = await db.contribuicaoMeta.create({
      data: {
        valor: valorContribuicaoAjustado, // Usar valor ajustado
        observacoes,
        metaId: id,
        lancamentoId: lancamento.id,
      },
    });

    // Atualizar meta com novo valor (garantir que não ultrapasse o valor alvo)
    const valorAtualAjustado = Math.min(novoValorAtual, meta.valorAlvo);
    const metaAtualizada = await db.meta.update({
      where: { id },
      data: {
        valorAtual: valorAtualAjustado,
        concluida: valorAtualAjustado >= meta.valorAlvo - tolerancia,
      },
      include: {
        contribuicoes: {
          orderBy: {
            data: "desc",
          },
        },
      },
    });

    return NextResponse.json(
      {
        meta: metaAtualizada,
        contribuicao,
        lancamento,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao contribuir para meta:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
