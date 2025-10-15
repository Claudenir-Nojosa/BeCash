// app/api/lancamentos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import db from "@/lib/db";
import { FaturaService } from "@/lib/faturaService";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Obter parâmetro de competência da query string
    const { searchParams } = new URL(request.url);
    const competencia = searchParams.get("competencia");

    let whereClause: any = {
      userId: session.user.id,
    };

    // Se houver competência, filtrar por mês/ano
    if (competencia) {
      const [ano, mes] = competencia.split("-").map(Number);

      // Data inicial: primeiro dia do mês
      const dataInicio = new Date(ano, mes - 1, 1);

      // Data final: último dia do mês
      const dataFim = new Date(ano, mes, 0, 23, 59, 59, 999);

      whereClause.data = {
        gte: dataInicio,
        lte: dataFim,
      };
    }

    const lancamentos = await db.lancamento.findMany({
      where: whereClause,
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
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

// O resto do código POST permanece exatamente igual...
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
      tipoLancamento,
      usuarioAlvoId,
      valorCompartilhado,
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

    // Validações para lançamento compartilhado
    if (tipoLancamento === "compartilhado") {
      if (!usuarioAlvoId) {
        return NextResponse.json(
          {
            error: "Usuário alvo é obrigatório para lançamentos compartilhados",
          },
          { status: 400 }
        );
      }

      const usuarioAlvo = await db.user.findUnique({
        where: { id: usuarioAlvoId },
      });

      if (!usuarioAlvo) {
        return NextResponse.json(
          { error: "Usuário alvo não encontrado" },
          { status: 400 }
        );
      }

      if (usuarioAlvo.id === session.user.id) {
        return NextResponse.json(
          { error: "Não é possível compartilhar um lançamento consigo mesmo" },
          { status: 400 }
        );
      }
    }

    if (metodoPagamento === "CREDITO" && !cartaoId) {
      return NextResponse.json(
        { error: "Cartão é obrigatório para pagamento com crédito" },
        { status: 400 }
      );
    }

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

    const valorTotal = parseFloat(valor);
    const valorParaCompartilhar =
      tipoLancamento === "compartilhado"
        ? valorCompartilhado
          ? parseFloat(valorCompartilhado)
          : valorTotal / 2
        : 0;

    const valorUsuarioCriador =
      tipoLancamento === "compartilhado"
        ? valorTotal - valorParaCompartilhar
        : valorTotal;

    // CORREÇÃO: Usar userId em vez de usuarioId
    const lancamentoBaseData: any = {
      descricao,
      valor: valorUsuarioCriador, // Agora isso será o valor total para individuais
      tipo,
      metodoPagamento,
      data: data ? new Date(data) : new Date(),
      categoriaId,
      cartaoId: metodoPagamento === "CREDITO" ? cartaoId : null,
      observacoes: observacoes || null,
      userId: session.user.id,
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

    if (
      metodoPagamento === "CREDITO" &&
      tipoParcelamento === "PARCELADO" &&
      parcelasTotal > 1
    ) {
      const valorTotal = parseFloat(valor);

      // CORREÇÃO: Só calcular valores de compartilhamento se for realmente compartilhado
      const valorParaCompartilhar =
        tipoLancamento === "compartilhado"
          ? valorCompartilhado
            ? parseFloat(valorCompartilhado)
            : valorTotal / 2
          : 0;

      const valorParcela = valorTotal / parseInt(parcelasTotal);
      const valorUsuarioCriador =
        tipoLancamento === "compartilhado"
          ? valorTotal - valorParaCompartilhar
          : valorTotal;

      // CORREÇÃO: Dividir o valor correto pelas parcelas
      const valorParcelaCriador = valorUsuarioCriador / parseInt(parcelasTotal);
      const valorParcelaCompartilhada =
        tipoLancamento === "compartilhado"
          ? valorParaCompartilhar / parseInt(parcelasTotal)
          : 0;

      // Primeiro lançamento (parcela atual) - criador paga sua parte
      const lancamentoPrincipal = await db.lancamento.create({
        data: {
          ...lancamentoBaseData,
          valor: valorParcelaCriador, // CORREÇÃO: Valor correto por parcela
          descricao: `${descricao} (1/${parcelasTotal})`,
        },
        include: {
          categoria: true,
          cartao: true,
        },
      });

      // CORREÇÃO: Criar registro de compartilhamento com o valor correto por parcela
      if (tipoLancamento === "compartilhado") {
        await db.lancamentoCompartilhado.create({
          data: {
            lancamentoId: lancamentoPrincipal.id,
            usuarioCriadorId: session.user.id,
            usuarioAlvoId: usuarioAlvoId,
            valorCompartilhado: valorParcelaCompartilhada, // CORREÇÃO: Valor compartilhado por parcela
            status: "PENDENTE",
          },
        });
      }

      // Adicionar à fatura atual
      if (metodoPagamento === "CREDITO" && cartaoId) {
        await FaturaService.adicionarLancamentoAFatura(lancamentoPrincipal.id);
      }

      // Criar parcelas futuras para o criador
      const parcelasFuturas = [];

      for (let i = 2; i <= parseInt(parcelasTotal); i++) {
        const dataParcela = new Date(data || new Date());
        dataParcela.setMonth(dataParcela.getMonth() + (i - 1));

        const parcelaData = {
          descricao: `${descricao} (${i}/${parcelasTotal})`,
          valor: valorParcelaCriador, // CORREÇÃO: Apenas a parte do criador
          tipo,
          metodoPagamento,
          data: dataParcela,
          categoriaId,
          cartaoId,
          observacoes: observacoes || null,
          userId: session.user.id,
          pago: false,
          tipoParcelamento,
          parcelasTotal: parseInt(parcelasTotal),
          parcelaAtual: i,
          recorrente: false,
          lancamentoPaiId: lancamentoPrincipal.id,
        };

        parcelasFuturas.push(parcelaData);
      }

      if (parcelasFuturas.length > 0) {
        const parcelasCriadas = await db.lancamento.createManyAndReturn({
          data: parcelasFuturas,
        });

        // CORREÇÃO: Para parcelas futuras também criar compartilhamento
        if (tipoLancamento === "compartilhado") {
          for (const parcela of parcelasCriadas) {
            await db.lancamentoCompartilhado.create({
              data: {
                lancamentoId: parcela.id,
                usuarioCriadorId: session.user.id,
                usuarioAlvoId: usuarioAlvoId,
                valorCompartilhado: valorParcelaCompartilhada,
                status: "PENDENTE",
              },
            });
          }
        }
      }

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
            },
          },
        },
      });

      return NextResponse.json(lancamentoComParcelas, { status: 201 });
    }

    // CORREÇÃO: Se for à vista ou recorrente, criar apenas um lançamento
    const lancamento = await db.lancamento.create({
      data: {
        ...lancamentoBaseData,
        // CORREÇÃO: Só subtrai o valor compartilhado se for lançamento compartilhado
        valor:
          tipoLancamento === "compartilhado"
            ? valorTotal -
              (valorCompartilhado
                ? parseFloat(valorCompartilhado)
                : valorTotal / 2)
            : valorTotal, // Para lançamentos individuais, usa o valor total
      },
      include: {
        categoria: true,
        cartao: true,
      },
    });

    // CORREÇÃO: Criar registro de compartilhamento
    if (tipoLancamento === "compartilhado") {
      await db.lancamentoCompartilhado.create({
        data: {
          lancamentoId: lancamento.id,
          usuarioCriadorId: session.user.id,
          usuarioAlvoId: usuarioAlvoId,
          valorCompartilhado: valorCompartilhado
            ? parseFloat(valorCompartilhado)
            : valorTotal / 2,
          status: "PENDENTE",
        },
      });
    }

    // Adicionar à fatura atual se for crédito
    if (metodoPagamento === "CREDITO" && cartaoId) {
      await FaturaService.adicionarLancamentoAFatura(lancamento.id);
    }

    const lancamentoCompleto = await db.lancamento.findUnique({
      where: { id: lancamento.id },
      include: {
        categoria: true,
        cartao: true,
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
          },
        },
      },
    });

    return NextResponse.json(lancamentoCompleto, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar lançamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
