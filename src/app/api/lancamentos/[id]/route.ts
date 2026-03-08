// app/api/lancamentos/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";
import { FaturaService } from "@/lib/faturaService";

// Correção para todas as funções
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
    const lancamentoId = params.id;
    const body = await request.json();
    const { pago } = body;

    // Verificar se o lançamento pertence ao usuário
    const lancamentoExistente = await db.lancamento.findFirst({
      where: {
        id: lancamentoId,
        userId: session.user.id,
      },
    });

    if (!lancamentoExistente) {
      return NextResponse.json(
        { error: "Lançamento não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar o status
    const lancamentoAtualizado = await db.lancamento.update({
      where: { id: lancamentoId },
      data: { pago },
    });

    return NextResponse.json(lancamentoAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar lançamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const id = params.id;

    const lancamento = await db.lancamento.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!lancamento) {
      return NextResponse.json(
        { error: "Lançamento não encontrado" },
        { status: 404 }
      );
    }

    if (lancamento.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    return NextResponse.json(lancamento);
  } catch (error) {
    console.error("Erro ao buscar lançamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;
    
    let finalUsuarioId;
    let body = {};

    // Tentar parsear o body apenas se for uma requisição com corpo
    if (request.headers.get("content-type")?.includes("application/json")) {
      try {
        body = await request.json();
      } catch (error) {
        // Body vazio ou inválido - não é problema, vamos usar auth por sessão
        console.log(
          "Requisição sem body JSON - usando autenticação por sessão"
        );
      }
    }

    const { apiKey, usuarioId: usuarioIdFromBody } = body as any;

    // Verificar autenticação via API Key (n8n)
    if (apiKey) {
      if (apiKey !== process.env.N8N_API_KEY) {
        return NextResponse.json(
          { error: "API Key inválida" },
          { status: 401 }
        );
      }

      if (!usuarioIdFromBody) {
        return NextResponse.json(
          { error: "usuarioId é obrigatório para chamadas via API" },
          { status: 400 }
        );
      }

      finalUsuarioId = usuarioIdFromBody;
      console.log("Autenticação via API Key - usuário:", finalUsuarioId);
    } else {
      // Autenticação via sessão (frontend)
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
      finalUsuarioId = session.user.id;
      console.log("Autenticação via sessão - usuário:", finalUsuarioId);
    }

    // Verificar se o lançamento existe e pertence ao usuário
    const lancamentoExistente = await db.lancamento.findUnique({
      where: { id },
    });

    if (!lancamentoExistente) {
      return NextResponse.json(
        { error: "Lançamento não encontrado" },
        { status: 404 }
      );
    }

    if (lancamentoExistente.userId !== finalUsuarioId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Excluir o lançamento
    await db.lancamento.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Lançamento excluído com sucesso",
      id: id,
    });
  } catch (error) {
    console.error("Erro ao excluir lançamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const params = await context.params;
    const lancamentoId = params.id;
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
      pago,
    } = body;

    // Verificar se o lançamento pertence ao usuário
    const lancamentoExistente = await db.lancamento.findFirst({
      where: {
        id: lancamentoId,
        userId: session.user.id,
      },
    });

    if (!lancamentoExistente) {
      return NextResponse.json(
        { error: "Lançamento não encontrado" },
        { status: 404 }
      );
    }

    const parcelasTotalNum =
      typeof parcelasTotal === "number" ? parcelasTotal : Number(parcelasTotal);
    const valorNum = typeof valor === "number" ? valor : Number(valor);
    const ehParceladoCredito =
      metodoPagamento === "CREDITO" &&
      tipoParcelamento === "PARCELADO" &&
      Number.isFinite(parcelasTotalNum) &&
      parcelasTotalNum > 1;

    const convertendoParaParcelado =
      ehParceladoCredito &&
      lancamentoExistente.tipoParcelamento !== "PARCELADO" &&
      !lancamentoExistente.lancamentoPaiId;

    const descricaoBase = String(descricao || lancamentoExistente.descricao).replace(
      /\s\(\d+\/\d+\)$/,
      ""
    );
    const valorParcela =
      convertendoParaParcelado && Number.isFinite(valorNum)
        ? valorNum / parcelasTotalNum
        : valor;

    // Atualizar o lançamento principal
    await db.lancamento.update({
      where: { id: lancamentoId },
      data: {
        descricao: convertendoParaParcelado
          ? `${descricaoBase} (1/${parcelasTotalNum})`
          : descricao,
        valor: valorParcela,
        tipo,
        metodoPagamento,
        data: new Date(data),
        categoriaId,
        cartaoId,
        observacoes,
        tipoParcelamento,
        parcelasTotal,
        parcelaAtual: convertendoParaParcelado ? 1 : undefined,
        recorrente,
        dataFimRecorrencia: dataFimRecorrencia ? new Date(dataFimRecorrencia) : null,
        pago,
      },
    });

    // Quando um lançamento deixa de ser avista e vira parcelado, criar as parcelas futuras.
    if (convertendoParaParcelado) {
      const parcelasFuturas = [];
      const dataBase = new Date(data);

      for (let i = 2; i <= parcelasTotalNum; i++) {
        const dataParcela = new Date(dataBase);
        dataParcela.setMonth(dataParcela.getMonth() + (i - 1));

        parcelasFuturas.push({
          descricao: `${descricaoBase} (${i}/${parcelasTotalNum})`,
          valor: Number(valorParcela),
          tipo,
          metodoPagamento,
          data: dataParcela,
          categoriaId,
          cartaoId: metodoPagamento === "CREDITO" ? cartaoId : null,
          observacoes: observacoes || null,
          userId: session.user.id,
          pago: false,
          tipoParcelamento,
          parcelasTotal: parcelasTotalNum,
          parcelaAtual: i,
          recorrente: false,
          lancamentoPaiId: lancamentoId,
        });
      }

      if (parcelasFuturas.length > 0) {
        const parcelasCriadas = await db.lancamento.createManyAndReturn({
          data: parcelasFuturas,
        });

        // Associar parcelas futuras às respectivas faturas de crédito.
        if (metodoPagamento === "CREDITO" && cartaoId) {
          for (const parcela of parcelasCriadas) {
            await FaturaService.adicionarLancamentoAFatura(parcela.id);
          }
        }
      }
    }

    const lancamentoAtualizado = await db.lancamento.findUnique({
      where: { id: lancamentoId },
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
        LancamentoCompartilhado: {
          include: {
            usuarioAlvo: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
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
        },
      },
    });

    return NextResponse.json(lancamentoAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar lançamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
