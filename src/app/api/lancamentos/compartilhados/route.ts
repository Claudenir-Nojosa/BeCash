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
        lancamento: {
          include: {
            cartao: true,
          },
        },
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

      // 🔥 NOVA LÓGICA: Encontrar ou criar fatura para o lançamento compartilhado
      let faturaId = lancamentoOriginal.faturaId;

      // Se o lançamento original não tem fatura, encontrar a fatura correta
      if (!faturaId && lancamentoOriginal.cartaoId) {
        const mesReferencia = new Date(lancamentoOriginal.data)
          .toISOString()
          .slice(0, 7); // YYYY-MM

        const faturaCorreta = await db.fatura.findFirst({
          where: {
            cartaoId: lancamentoOriginal.cartaoId,
            mesReferencia: mesReferencia,
          },
        });

        if (faturaCorreta) {
          faturaId = faturaCorreta.id;
        } else {
          // Se não encontrou fatura, criar uma nova
          const novaFatura = await criarFaturaParaCartao(
            lancamentoOriginal.cartaoId,
            new Date(lancamentoOriginal.data)
          );
          faturaId = novaFatura.id;
        }
      }

      // Criar o lançamento para o usuário alvo COM FATURA
      const novoLancamento = await db.lancamento.create({
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
          faturaId: faturaId, // 👈 AGORA COM FATURA ASSOCIADA
        },
      });

      // Atualizar o valor total da fatura
      if (faturaId) {
        await atualizarValorFatura(faturaId);
      }
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

// 🔥 FUNÇÕES AUXILIARES PARA GERENCIAR FATURAS

// Função para criar fatura para um cartão em um determinado mês
async function criarFaturaParaCartao(cartaoId: string, dataLancamento: Date) {
  const cartao = await db.cartao.findUnique({
    where: { id: cartaoId },
  });

  if (!cartao) {
    throw new Error("Cartão não encontrado");
  }

  const mesReferencia = dataLancamento.toISOString().slice(0, 7); // YYYY-MM

  // Verificar se já existe fatura para este mês
  const faturaExistente = await db.fatura.findFirst({
    where: {
      cartaoId,
      mesReferencia,
    },
  });

  if (faturaExistente) {
    return faturaExistente;
  }

  // Calcular datas de fechamento e vencimento
  const dataFechamento = calcularDataFechamento(
    cartao.diaFechamento,
    mesReferencia
  );
  const dataVencimento = calcularDataVencimento(
    cartao.diaVencimento,
    mesReferencia
  );

  // Criar nova fatura
  return await db.fatura.create({
    data: {
      cartaoId,
      mesReferencia,
      dataFechamento,
      dataVencimento,
      valorTotal: 0, // Será atualizado depois com os lançamentos
      valorPago: 0,
      status: "ABERTA",
    },
  });
}

// Função para atualizar o valor total da fatura
async function atualizarValorFatura(faturaId: string) {
  const lancamentos = await db.lancamento.findMany({
    where: { faturaId },
  });

  const valorTotal = lancamentos.reduce((sum, lanc) => sum + lanc.valor, 0);

  await db.fatura.update({
    where: { id: faturaId },
    data: { valorTotal },
  });
}

// Funções para calcular datas de fechamento e vencimento
function calcularDataFechamento(
  diaFechamento: number | null,
  mesReferencia: string
) {
  if (!diaFechamento) diaFechamento = 1;

  const [ano, mes] = mesReferencia.split("-").map(Number);
  const ultimoDiaMes = new Date(ano, mes, 0).getDate();
  const dia = Math.min(diaFechamento, ultimoDiaMes);

  return new Date(ano, mes - 1, dia);
}

function calcularDataVencimento(
  diaVencimento: number | null,
  mesReferencia: string
) {
  if (!diaVencimento) diaVencimento = 10;

  const [ano, mes] = mesReferencia.split("-").map(Number);
  const mesVencimento = mes === 12 ? 1 : mes + 1;
  const anoVencimento = mes === 12 ? ano + 1 : ano;

  const ultimoDiaMes = new Date(anoVencimento, mesVencimento, 0).getDate();
  const dia = Math.min(diaVencimento, ultimoDiaMes);

  return new Date(anoVencimento, mesVencimento - 1, dia);
}
