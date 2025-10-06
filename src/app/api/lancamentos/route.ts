import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import db from "@/lib/db";
import { FaturaService } from "@/lib/faturaService";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const lancamentos = await db.lancamento.findMany({
      where: {
        usuarioId: session.user.id,
        lancamentoPaiId: null, // Buscar apenas lançamentos principais
      },
      include: {
        categoria: true,
        cartao: true,
        lancamentosFilhos: {
          include: {
            categoria: true,
            cartao: true,
          },
          orderBy: { parcelaAtual: "asc" },
        },
      },
      orderBy: { data: "desc" },
    });

    return NextResponse.json(lancamentos);
  } catch (error) {
    console.error("Erro ao buscar lançamentos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      descricao,
      valor,
      tipo,
      metodoPagamento,
      data,
      categoriaId,
      cartaoId,
      observacoes,
      tipoParcelamento,
      parcelasTotal,
      recorrente,
      dataFimRecorrencia,
    } = body;

    if (!descricao || !valor || !tipo || !metodoPagamento || !categoriaId) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    if (!["RECEITA", "DESPESA"].includes(tipo)) {
      return NextResponse.json(
        { error: "Tipo deve ser RECEITA ou DESPESA" },
        { status: 400 }
      );
    }

    const metodosValidos = ["PIX", "TRANSFERENCIA", "DEBITO", "CREDITO"];
    if (!metodosValidos.includes(metodoPagamento)) {
      return NextResponse.json(
        { error: "Método de pagamento inválido" },
        { status: 400 }
      );
    }

    // Se for cartão de crédito, cartaoId é obrigatório
    if (metodoPagamento === "CREDITO" && !cartaoId) {
      return NextResponse.json(
        { error: "Cartão é obrigatório para pagamento com crédito" },
        { status: 400 }
      );
    }

    // Validações para crédito
    if (metodoPagamento === "CREDITO") {
      if (
        !tipoParcelamento ||
        !["AVISTA", "PARCELADO", "RECORRENTE"].includes(tipoParcelamento)
      ) {
        return NextResponse.json(
          { error: "Tipo de parcelamento é obrigatório para crédito" },
          { status: 400 }
        );
      }

      if (
        tipoParcelamento === "PARCELADO" &&
        (!parcelasTotal || parcelasTotal < 2)
      ) {
        return NextResponse.json(
          { error: "Número de parcelas é obrigatório e deve ser maior que 1" },
          { status: 400 }
        );
      }

      if (tipoParcelamento === "RECORRENTE" && !dataFimRecorrencia) {
        return NextResponse.json(
          { error: "Data final é obrigatória para lançamentos recorrentes" },
          { status: 400 }
        );
      }
    }

    // Criar lançamento principal
    const lancamentoBaseData: any = {
      descricao,
      valor: parseFloat(valor),
      tipo,
      metodoPagamento,
      data: data ? new Date(data) : new Date(),
      categoriaId,
      cartaoId: metodoPagamento === "CREDITO" ? cartaoId : null,
      observacoes: observacoes || null,
      usuarioId: session.user.id,
      pago: metodoPagamento !== "CREDITO",
      tipoParcelamento: metodoPagamento === "CREDITO" ? tipoParcelamento : null,
      parcelasTotal:
        metodoPagamento === "CREDITO" && tipoParcelamento === "PARCELADO"
          ? parseInt(parcelasTotal)
          : null,
      parcelaAtual: 1,
      recorrente:
        metodoPagamento === "CREDITO" && tipoParcelamento === "RECORRENTE",
      dataFimRecorrencia:
        metodoPagamento === "CREDITO" && tipoParcelamento === "RECORRENTE"
          ? new Date(dataFimRecorrencia)
          : null,
    };

    // Se for parcelado, criar as parcelas corretamente
    if (
      metodoPagamento === "CREDITO" &&
      tipoParcelamento === "PARCELADO" &&
      parcelasTotal > 1
    ) {
      const valorParcela = parseFloat(valor) / parseInt(parcelasTotal);

      // Primeiro lançamento (parcela atual) - usar valor da parcela
      const lancamentoPrincipal = await db.lancamento.create({
        data: {
          ...lancamentoBaseData,
          valor: valorParcela, // CORREÇÃO: usar valor da parcela
          descricao: `${descricao} (1/${parcelasTotal})`, // Adicionar indicação de parcela
        },
        include: {
          categoria: true,
          cartao: true,
        },
      });

      // Adicionar à fatura atual (apenas a primeira parcela)
      if (metodoPagamento === "CREDITO" && cartaoId) {
        await FaturaService.adicionarLancamentoAFatura(lancamentoPrincipal.id);
      }

      // Criar parcelas futuras
      const parcelasFuturas = [];

      for (let i = 2; i <= parseInt(parcelasTotal); i++) {
        const dataParcela = new Date(data || new Date());
        dataParcela.setMonth(dataParcela.getMonth() + (i - 1));

        parcelasFuturas.push({
          descricao: `${descricao} (${i}/${parcelasTotal})`,
          valor: valorParcela,
          tipo,
          metodoPagamento,
          data: dataParcela,
          categoriaId,
          cartaoId,
          observacoes: observacoes || null,
          usuarioId: session.user.id,
          pago: false,
          tipoParcelamento,
          parcelasTotal: parseInt(parcelasTotal),
          parcelaAtual: i,
          recorrente: false,
          lancamentoPaiId: lancamentoPrincipal.id,
        });
      }

      if (parcelasFuturas.length > 0) {
        await db.lancamento.createMany({
          data: parcelasFuturas,
        });
      }

      // Buscar o lançamento principal com as parcelas
      const lancamentoComParcelas = await db.lancamento.findUnique({
        where: { id: lancamentoPrincipal.id },
        include: {
          categoria: true,
          cartao: true,
          lancamentosFilhos: {
            include: {
              categoria: true,
              cartao: true,
            },
            orderBy: { parcelaAtual: "asc" },
          },
        },
      });

      return NextResponse.json(lancamentoComParcelas, { status: 201 });
    }

    // Se for à vista ou recorrente, criar apenas um lançamento
    const lancamento = await db.lancamento.create({
      data: lancamentoBaseData,
      include: {
        categoria: true,
        cartao: true,
      },
    });

    // Adicionar à fatura atual se for crédito
    if (metodoPagamento === "CREDITO" && cartaoId) {
      await FaturaService.adicionarLancamentoAFatura(lancamento.id);
    }

    return NextResponse.json(lancamento, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar lançamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
