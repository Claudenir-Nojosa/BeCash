// app/api/lancamentos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import db from "@/lib/db";
import { FaturaService } from "@/lib/faturaService";
import { LimiteService } from "@/lib/limiteService";

// ✅ MESMA função do resumo
function calcularMesReferenciaLancamento(lancamento: any): {
  ano: number;
  mes: number;
} {
  const data = new Date(lancamento.data);
  let ano = data.getFullYear();
  let mes = data.getMonth() + 1;

  // ✅ Para CRÉDITO, adiciona +1 mês (mês de PAGAMENTO da fatura)
  if (lancamento.metodoPagamento === "CREDITO" && lancamento.cartao) {
    mes += 1;
    if (mes > 12) {
      mes = 1;
      ano += 1;
    }
  }

  return { ano, mes };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mes = searchParams.get("mes");
    const ano = searchParams.get("ano");

    // ✅ Buscar TODOS os lançamentos
    const todosLancamentos = await db.lancamento.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        categoria: true,
        cartao: {
          select: {
            diaFechamento: true,
            diaVencimento: true,
          },
        },
        LancamentoCompartilhado: true,
      },
      orderBy: {
        createdAt: "desc", // ✅ Mais recentes primeiro
      },
    });

    // ✅ Filtrar pelo mês/ano se fornecido
    let lancamentosFiltrados = todosLancamentos;

    if (mes && ano) {
      const mesNum = Number(mes);
      const anoNum = Number(ano);

      lancamentosFiltrados = todosLancamentos.filter((lancamento) => {
        const { ano, mes } = calcularMesReferenciaLancamento(lancamento);
        return ano === anoNum && mes === mesNum;
      });
    }

    return NextResponse.json(lancamentosFiltrados);
  } catch (error) {
    console.error("Erro ao buscar lançamentos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
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
    // 🔴 VERIFICAÇÃO DE LIMITE DO PLANO FREE
    // Buscar assinatura do usuário
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });

    // Se usuário não tem assinatura ativa (plano free) ou é free
    if (!subscription || subscription.plano === "free") {
      // Contar lançamentos do usuário
      const lancamentosCount = await db.lancamento.count({
        where: { userId: session.user.id },
      });

      // Limite para plano free: 50 lançamentos
      const LIMITE_FREE = 1;

      if (lancamentosCount >= LIMITE_FREE) {
        return NextResponse.json(
          {
            error: "Limite de lançamentos atingido",
            message: `Plano free permite apenas ${LIMITE_FREE} lançamentos. Faça upgrade para criar mais.`,
            limite: LIMITE_FREE,
            atual: lancamentosCount,
          },
          { status: 403 },
        );
      }
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
        { status: 400 },
      );
    }

    if (!["RECEITA", "DESPESA"].includes(tipo)) {
      return NextResponse.json(
        { error: "Tipo deve ser RECEITA ou DESPESA" },
        { status: 400 },
      );
    }

    const metodosValidos = ["PIX", "TRANSFERENCIA", "DEBITO", "CREDITO"];
    if (!metodosValidos.includes(metodoPagamento)) {
      return NextResponse.json(
        { error: "Método de pagamento inválido" },
        { status: 400 },
      );
    }

    // Validações para lançamento compartilhado
    if (tipoLancamento === "compartilhado") {
      if (!usuarioAlvoId) {
        return NextResponse.json(
          {
            error: "Usuário alvo é obrigatório para lançamentos compartilhados",
          },
          { status: 400 },
        );
      }

      const usuarioAlvo = await db.user.findUnique({
        where: { id: usuarioAlvoId },
      });

      if (!usuarioAlvo) {
        return NextResponse.json(
          { error: "Usuário alvo não encontrado" },
          { status: 400 },
        );
      }

      if (usuarioAlvo.id === session.user.id) {
        return NextResponse.json(
          { error: "Não é possível compartilhar um lançamento consigo mesmo" },
          { status: 400 },
        );
      }
    }

    if (metodoPagamento === "CREDITO" && !cartaoId) {
      return NextResponse.json(
        { error: "Cartão é obrigatório para pagamento com crédito" },
        { status: 400 },
      );
    }

    if (metodoPagamento === "CREDITO") {
      if (
        !tipoParcelamento ||
        !["AVISTA", "PARCELADO", "RECORRENTE"].includes(tipoParcelamento)
      ) {
        return NextResponse.json(
          { error: "Tipo de parcelamento é obrigatório para crédito" },
          { status: 400 },
        );
      }

      if (
        tipoParcelamento === "PARCELADO" &&
        (!parcelasTotal || parcelasTotal < 2)
      ) {
        return NextResponse.json(
          { error: "Número de parcelas é obrigatório e deve ser maior que 1" },
          { status: 400 },
        );
      }

      if (tipoParcelamento === "RECORRENTE" && !dataFimRecorrencia) {
        return NextResponse.json(
          { error: "Data final é obrigatória para lançamentos recorrentes" },
          { status: 400 },
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
      const parcelasTotalNum = parseInt(parcelasTotal);
      const valorTotalNum = parseFloat(valor);

      // CORREÇÃO: Só calcular valores de compartilhamento se for realmente compartilhado
      const valorParaCompartilharNum =
        tipoLancamento === "compartilhado"
          ? valorCompartilhado
            ? parseFloat(valorCompartilhado)
            : valorTotalNum / 2
          : 0;

      const valorUsuarioCriadorNum =
        tipoLancamento === "compartilhado"
          ? valorTotalNum - valorParaCompartilharNum
          : valorTotalNum;

      // CORREÇÃO: Dividir o valor correto pelas parcelas
      const valorParcelaCriador = valorUsuarioCriadorNum / parcelasTotalNum;
      const valorParcelaCompartilhada =
        tipoLancamento === "compartilhado"
          ? valorParaCompartilharNum / parcelasTotalNum
          : 0;

      const dataLancamentoPrincipal = data ? new Date(data) : new Date();
      const lancamentoComParcelas = await db.$transaction(
        async (tx) => {
        // Primeiro lançamento (parcela atual) - criador paga sua parte
        const lancamentoPrincipal = await tx.lancamento.create({
          data: {
            ...lancamentoBaseData,
            valor: valorParcelaCriador, // CORREÇÃO: Valor correto por parcela
            descricao: `${descricao} (1/${parcelasTotalNum})`,
          },
          include: {
            categoria: true,
            cartao: true,
          },
        });

        // Criar parcelas futuras para o criador
        const parcelasFuturas = [];
        for (let i = 2; i <= parcelasTotalNum; i++) {
          const dataParcela = new Date(dataLancamentoPrincipal);
          dataParcela.setMonth(dataParcela.getMonth() + (i - 1));

          parcelasFuturas.push({
            descricao: `${descricao} (${i}/${parcelasTotalNum})`,
            valor: valorParcelaCriador,
            tipo,
            metodoPagamento,
            data: dataParcela,
            categoriaId,
            cartaoId,
            observacoes: observacoes || null,
            userId: session.user.id,
            pago: false,
            tipoParcelamento,
            parcelasTotal: parcelasTotalNum,
            parcelaAtual: i,
            recorrente: false,
            lancamentoPaiId: lancamentoPrincipal.id,
          });
        }

        const parcelasCriadas =
          parcelasFuturas.length > 0
            ? await tx.lancamento.createManyAndReturn({ data: parcelasFuturas })
            : [];

        // Criar compartilhamentos em lote (principal + parcelas futuras)
        if (tipoLancamento === "compartilhado") {
          const compartilhamentos = [
            {
              lancamentoId: lancamentoPrincipal.id,
              usuarioCriadorId: session.user.id,
              usuarioAlvoId,
              valorCompartilhado: valorParcelaCompartilhada,
              status: "PENDENTE" as const,
            },
            ...parcelasCriadas.map((parcela) => ({
              lancamentoId: parcela.id,
              usuarioCriadorId: session.user.id,
              usuarioAlvoId,
              valorCompartilhado: valorParcelaCompartilhada,
              status: "PENDENTE" as const,
            })),
          ];

          await tx.lancamentoCompartilhado.createMany({
            data: compartilhamentos,
          });
        }

        // Associar lançamentos às faturas e recalcular somente uma vez por fatura.
        if (metodoPagamento === "CREDITO" && cartaoId) {
          const cartao = await tx.cartao.findUnique({
            where: { id: cartaoId },
            select: { diaFechamento: true, diaVencimento: true },
          });

          if (!cartao) {
            throw new Error("Cartão não encontrado");
          }

          const lancamentosParaVincular = [
            { id: lancamentoPrincipal.id, data: dataLancamentoPrincipal },
            ...parcelasCriadas.map((parcela) => ({
              id: parcela.id,
              data: new Date(parcela.data),
            })),
          ];

          const faturaIdPorMesReferencia = new Map<string, string>();
          const lancamentosPorFatura = new Map<string, string[]>();

          for (const lancamento of lancamentosParaVincular) {
            const mesReferencia = FaturaService.calcularMesReferencia(
              lancamento.data,
              cartao.diaFechamento
            );

            let faturaId = faturaIdPorMesReferencia.get(mesReferencia);

            if (!faturaId) {
              const dataFechamento = FaturaService.calcularDataFechamento(
                cartao.diaFechamento,
                mesReferencia
              );
              const dataVencimento = FaturaService.calcularDataVencimento(
                cartao.diaVencimento,
                mesReferencia
              );

              const fatura = await tx.fatura.upsert({
                where: {
                  cartaoId_mesReferencia: {
                    cartaoId,
                    mesReferencia,
                  },
                },
                create: {
                  cartaoId,
                  mesReferencia,
                  dataFechamento,
                  dataVencimento,
                  status: "ABERTA",
                },
                update: {},
              });

              faturaId = fatura.id;
              faturaIdPorMesReferencia.set(mesReferencia, faturaId);
            }

            const ids = lancamentosPorFatura.get(faturaId) || [];
            ids.push(lancamento.id);
            lancamentosPorFatura.set(faturaId, ids);
          }

          for (const [faturaId, idsLancamentos] of lancamentosPorFatura.entries()) {
            await tx.lancamento.updateMany({
              where: { id: { in: idsLancamentos } },
              data: { faturaId },
            });
          }

          const faturasAfetadas = Array.from(lancamentosPorFatura.keys());

          if (faturasAfetadas.length > 0) {
            const totais = await tx.lancamento.groupBy({
              by: ["faturaId", "tipo"],
              where: {
                faturaId: { in: faturasAfetadas },
                pago: false,
              },
              _sum: { valor: true },
            });

            const totaisPorFatura = new Map<string, number>();
            for (const faturaId of faturasAfetadas) {
              totaisPorFatura.set(faturaId, 0);
            }

            for (const total of totais) {
              if (!total.faturaId) continue;
              const acumulado = totaisPorFatura.get(total.faturaId) || 0;
              const valor = total._sum.valor || 0;
              totaisPorFatura.set(
                total.faturaId,
                total.tipo === "RECEITA" ? acumulado - valor : acumulado + valor
              );
            }

            for (const [faturaId, valorTotal] of totaisPorFatura.entries()) {
              await tx.fatura.update({
                where: { id: faturaId },
                data: { valorTotal },
              });
            }
          }
        }

        return tx.lancamento.findUnique({
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
        },
        {
          maxWait: 10_000,
          timeout: 60_000,
        }
      );

      // ✅ ATUALIZAR LIMITE para a primeira parcela (se for despesa)
      if (tipo === "DESPESA") {
        await LimiteService.atualizarGastoLimite(
          session.user.id,
          categoriaId,
          valorParcelaCriador,
          tipo
        );
      }

      return NextResponse.json(lancamentoComParcelas, { status: 201 });
    }

    // ✅ CORREÇÃO: Lançamento único (à vista ou recorrente)
    const lancamento = await db.lancamento.create({
      data: {
        ...lancamentoBaseData,
        valor:
          tipoLancamento === "compartilhado"
            ? valorTotal -
              (valorCompartilhado
                ? parseFloat(valorCompartilhado)
                : valorTotal / 2)
            : valorTotal,
      },
      include: {
        categoria: true,
        cartao: true,
      },
    });

    // ✅ ATUALIZAR LIMITE para lançamento único (se for despesa)
    if (tipo === "DESPESA") {
      const valorParaAtualizar =
        tipoLancamento === "compartilhado"
          ? valorTotal -
            (valorCompartilhado
              ? parseFloat(valorCompartilhado)
              : valorTotal / 2)
          : valorTotal;

      await LimiteService.atualizarGastoLimite(
        session.user.id,
        categoriaId,
        valorParaAtualizar,
        tipo,
      );
    }

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
      { status: 500 },
    );
  }
}
