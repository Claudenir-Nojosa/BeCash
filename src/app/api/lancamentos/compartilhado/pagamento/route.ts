// app/api/lancamentos/compartilhado/pagamento/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../../auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { divisaoId, valorPago } = body;

    // Buscar a divisão atual
    const divisao = await db.divisaoLancamento.findUnique({
      where: { id: divisaoId },
      include: {
        lancamento: {
          include: {
            divisao: {
              include: {
                usuario: true,
              },
            },
          },
        },
        usuario: true,
      },
    });

    if (!divisao) {
      return NextResponse.json(
        { error: "Divisão não encontrada" },
        { status: 404 }
      );
    }

    // Atualizar o valor pago
    const novoValorPago = divisao.valorPago + parseFloat(valorPago.toString());
    const agoraPago = novoValorPago >= divisao.valorDivisao;

    // Atualizar a divisão
    await db.divisaoLancamento.update({
      where: { id: divisaoId },
      data: {
        valorPago: novoValorPago,
        pago: agoraPago,
      },
    });

    // ✅ NOVO: Verificar se todas as divisões estão pagas e atualizar o lançamento principal
    await verificarEAtualizarStatusLancamento(divisao.lancamentoId);

    // Calcular e atualizar saldos compartilhados
    await atualizarSaldosCompartilhados(divisao.lancamento.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao registrar pagamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// ✅ NOVA FUNÇÃO: Verificar se todas as divisões estão pagas e atualizar o lançamento principal
async function verificarEAtualizarStatusLancamento(lancamentoId: string) {
  // Buscar todas as divisões do lançamento
  const divisoes = await db.divisaoLancamento.findMany({
    where: { lancamentoId },
  });

  // Verificar se todas as divisões estão pagas
  const todasDivisoesPagas = divisoes.every(
    (divisao) => divisao.valorPago >= divisao.valorDivisao
  );

  // Atualizar o status do lançamento principal
  await db.lancamento.update({
    where: { id: lancamentoId },
    data: {
      pago: todasDivisoesPagas,
    },
  });
}

// ... o restante do código permanece igual
async function atualizarSaldosCompartilhados(lancamentoId: string) {
  // Buscar todas as divisões do lançamento
  const lancamento = await db.lancamento.findUnique({
    where: { id: lancamentoId },
    include: {
      divisao: {
        include: {
          usuario: true,
        },
      },
    },
  });

  if (!lancamento) return;

  const divisoes = lancamento.divisao;

  // Encontrar os dois usuários envolvidos
  if (divisoes.length !== 2) return; // Só funciona para 2 pessoas

  const [divisao1, divisao2] = divisoes;

  // Calcular a diferença de pagamento entre os dois
  const diferenca1 = divisao1.valorPago - divisao1.valorDivisao;
  const diferenca2 = divisao2.valorPago - divisao2.valorDivisao;

  // Se um pagou mais do que devia e o outro menos, criar saldo
  if (diferenca1 > 0 && diferenca2 < 0) {
    // Usuario2 deve para Usuario1
    const valorDevido = Math.min(Math.abs(diferenca1), Math.abs(diferenca2));

    await criarOuAtualizarSaldo(
      divisao2.usuarioId, // deUsuarioId (quem deve)
      divisao1.usuarioId, // paraUsuarioId (para quem deve)
      valorDevido,
      `Ajuste: ${lancamento.descricao}`
    );
  } else if (diferenca2 > 0 && diferenca1 < 0) {
    // Usuario1 deve para Usuario2
    const valorDevido = Math.min(Math.abs(diferenca2), Math.abs(diferenca1));

    await criarOuAtualizarSaldo(
      divisao1.usuarioId, // deUsuarioId (quem deve)
      divisao2.usuarioId, // paraUsuarioId (para quem deve)
      valorDevido,
      `Ajuste: ${lancamento.descricao}`
    );
  }
}

async function criarOuAtualizarSaldo(
  deUsuarioId: string,
  paraUsuarioId: string,
  valor: number,
  descricao?: string
) {
  if (valor <= 0) return;

  // Verificar se já existe um saldo entre esses usuários
  const saldoExistente = await db.saldoCompartilhado.findUnique({
    where: {
      deUsuarioId_paraUsuarioId: {
        deUsuarioId,
        paraUsuarioId,
      },
    },
  });

  if (saldoExistente) {
    // Atualizar saldo existente
    await db.saldoCompartilhado.update({
      where: {
        id: saldoExistente.id,
      },
      data: {
        valor: saldoExistente.valor + valor,
        descricao: descricao || saldoExistente.descricao,
        pago: false, // Resetar status de pago ao atualizar
      },
    });
  } else {
    // Criar novo saldo
    await db.saldoCompartilhado.create({
      data: {
        deUsuarioId,
        paraUsuarioId,
        valor,
        descricao,
        pago: false,
      },
    });
  }
}
