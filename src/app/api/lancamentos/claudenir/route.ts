// app/api/lancamentos/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

// Função para gerar ocorrências de lançamentos recorrentes
// Na sua função gerarOcorrenciasRecorrentes, atualize a parte de criação:
async function gerarOcorrenciasRecorrentes(
  mes: number,
  ano: number,
  usuarioId: string
) {
  const inicioMes = new Date(ano, mes - 1, 1);
  const fimMes = new Date(ano, mes, 1);

  console.log(`=== GERANDO RECORRÊNCIAS ${mes}/${ano} ===`);

  // Buscar recorrências ativas
  const recorenciasAtivas = await db.lancamentoRecorrente.findMany({
    where: {
      usuarioId,
      ativo: true,
      dataInicio: {
        lte: fimMes,
      },
    },
    include: {
      // Incluir o primeiro lançamento para pegar dados do cartão
      ocorrencias: {
        take: 1,
        orderBy: {
          data: 'asc'
        },
        include: {
          cartao: true,
          fatura: true
        }
      }
    },
  });

  console.log(`Recorrências ativas encontradas: ${recorenciasAtivas.length}`);

  let ocorrenciasCriadas = 0;

  for (const recorrente of recorenciasAtivas) {
    console.log(`Processando: ${recorrente.descricao}`);
    
    // Buscar o primeiro lançamento para pegar dados do cartão (se houver)
    const primeiroLancamento = recorrente.ocorrencias[0];
    
    // Calcular diferença em meses desde o início
    const dataInicio = new Date(recorrente.dataInicio);
    const mesesDiff = (ano - dataInicio.getFullYear()) * 12 + (mes - dataInicio.getMonth() - 1);
    
    console.log(`Meses desde início: ${mesesDiff}`);

    // Verificar se deve gerar baseado na frequência
    let deveGerar = false;
    switch (recorrente.frequencia) {
      case "mensal":
        deveGerar = mesesDiff >= 0;
        break;
      case "trimestral":
        deveGerar = mesesDiff >= 0 && mesesDiff % 3 === 0;
        break;
      case "anual":
        deveGerar = mesesDiff >= 0 && mesesDiff % 12 === 0;
        break;
    }

    console.log(`Deve gerar para ${mes}/${ano}? ${deveGerar}`);

    // Verificar limite de parcelas
    if (deveGerar && recorrente.parcelas && mesesDiff >= recorrente.parcelas) {
      console.log(`Limite de ${recorrente.parcelas} parcelas atingido`);
      deveGerar = false;
      await db.lancamentoRecorrente.update({
        where: { id: recorrente.id },
        data: { ativo: false },
      });
    }

    if (deveGerar) {
      // Verificar se JÁ EXISTE lançamento para este mês/recorrência
      const existeLancamento = await db.lancamento.findFirst({
        where: {
          recorrenteId: recorrente.id,
          data: {
            gte: inicioMes,
            lt: fimMes,
          },
        },
      });

      if (existeLancamento) {
        console.log(`❌ Já existe lançamento para ${mes}/${ano}: ${existeLancamento.id}`);
        continue;
      }

      // Criar data da ocorrência (usar o mesmo dia do mês da data inicial)
      const diaOriginal = dataInicio.getDate();
      let dataOcorrencia = new Date(ano, mes - 1, diaOriginal);
      
      // Ajustar se o dia for maior que os dias do mês
      const ultimoDiaMes = new Date(ano, mes, 0).getDate();
      if (diaOriginal > ultimoDiaMes) {
        dataOcorrencia = new Date(ano, mes, 0);
      }

      // Calcular data de vencimento para cartão (se o primeiro lançamento tinha)
      let dataVencimento = null;
      if (primeiroLancamento?.dataVencimento) {
        const vencimentoOriginal = new Date(primeiroLancamento.dataVencimento);
        dataVencimento = new Date(ano, mes - 1, vencimentoOriginal.getDate());
      }

      console.log(`✅ Criando ocorrência para: ${dataOcorrencia.toISOString()}`);

      try {
        // Dados base para o lançamento
        const dadosLancamento: any = {
          descricao: recorrente.descricao,
          valor: recorrente.valor,
          tipo: recorrente.tipo,
          categoria: recorrente.categoria,
          tipoLancamento: recorrente.tipoLancamento,
          tipoTransacao: recorrente.tipoTransacao || "DINHEIRO",
          responsavel: recorrente.responsavel,
          data: dataOcorrencia,
          pago: false,
          observacoes: recorrente.observacoes,
          usuarioId: recorrente.usuarioId,
          recorrenteId: recorrente.id,
          origem: "recorrente",
        };

        // Se o primeiro lançamento tinha dados de cartão, replicar para as recorrências
        if (primeiroLancamento?.cartaoId) {
          dadosLancamento.cartaoId = primeiroLancamento.cartaoId;
          dadosLancamento.tipoTransacao = primeiroLancamento.tipoTransacao || "CARTAO_CREDITO";
          dadosLancamento.dataVencimento = dataVencimento;
          dadosLancamento.pago = false; // Cartão nunca marca como pago automaticamente
          
          console.log(`🔄 Replicando dados do cartão: ${primeiroLancamento.cartaoId}`);
        }

        // Criar a ocorrência
        await db.lancamento.create({
          data: dadosLancamento,
        });

        ocorrenciasCriadas++;
        console.log(`✅ Ocorrência criada com sucesso!`);
      } catch (error) {
        console.error(`❌ Erro ao criar ocorrência:`, error);
      }
    }
  }

  console.log(`=== FIM: ${ocorrenciasCriadas} ocorrências criadas ===`);
  return ocorrenciasCriadas;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get("mes");
    const ano = searchParams.get("ano");
    const categoria = searchParams.get("categoria");
    const tipo = searchParams.get("tipo");

    // Autenticação
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const usuarioId = session.user.id;

    // Validar mês e ano
    if (!mes || !ano) {
      return NextResponse.json(
        { error: "Mês e ano são obrigatórios" },
        { status: 400 }
      );
    }

    const mesNum = parseInt(mes);
    const anoNum = parseInt(ano);

    // CHAMAR A FUNÇÃO DE GERAR RECORRÊNCIAS ANTES DE BUSCAR OS LANÇAMENTOS
    console.log("Gerando ocorrências recorrentes...");
    const ocorrenciasCriadas = await gerarOcorrenciasRecorrentes(
      mesNum,
      anoNum,
      usuarioId
    );

    if (ocorrenciasCriadas > 0) {
      console.log(
        `${ocorrenciasCriadas} ocorrências recorrentes foram geradas`
      );
    }

    // Calcular datas do período
    const inicioMes = new Date(anoNum, mesNum - 1, 1);
    const fimMes = new Date(anoNum, mesNum, 1);

    console.log(
      `Filtrando por período: ${inicioMes.toISOString()} até ${fimMes.toISOString()}`
    );

    // CONSTRUIR FILTRO CORRIGIDO - CONSIDERANDO dataVencimento
    const where: any = {
      OR: [
        // Lançamentos individuais do Claudenir - considerando data OU dataVencimento
        {
          AND: [
            { responsavel: "Claudenir" },
            {
              OR: [
                // Lançamentos normais: data está no período
                {
                  data: {
                    gte: inicioMes,
                    lt: fimMes,
                  },
                  dataVencimento: null, // Sem data de vencimento
                },
                // Lançamentos de cartão: dataVencimento está no período
                {
                  dataVencimento: {
                    gte: inicioMes,
                    lt: fimMes,
                  },
                },
              ],
            },
          ],
        },
        // Lançamentos compartilhados onde Claudenir participa - considerando data OU dataVencimento
        {
          AND: [
            { responsavel: "Compartilhado" },
            {
              OR: [
                // Lançamentos normais: data está no período
                {
                  data: {
                    gte: inicioMes,
                    lt: fimMes,
                  },
                  dataVencimento: null, // Sem data de vencimento
                },
                // Lançamentos de cartão: dataVencimento está no período
                {
                  dataVencimento: {
                    gte: inicioMes,
                    lt: fimMes,
                  },
                },
              ],
            },
            {
              divisao: {
                some: {
                  usuario: {
                    name: {
                      contains: "Claudenir",
                      mode: "insensitive",
                    },
                  },
                },
              },
            },
          ],
        },
      ],
    };

    // Aplicar filtro de categoria
    if (categoria && categoria !== "todas") {
      where.AND = where.AND || [];
      where.AND.push({ categoria });
    }

    // Aplicar filtro de tipo
    if (tipo && tipo !== "todos") {
      where.AND = where.AND || [];
      where.AND.push({
        tipo: {
          equals: tipo,
          mode: "insensitive",
        },
      });
    }

    console.log("Where clause:", JSON.stringify(where, null, 2));

    // Buscar lançamentos do banco INCLUINDO as divisões
    const lancamentos = await db.lancamento.findMany({
      where,
      orderBy: {
        data: "desc",
      },
      include: {
        usuario: {
          select: {
            name: true,
            email: true,
          },
        },
        recorrente: true,
        divisao: {
          include: {
            usuario: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        cartao: {
          select: {
            nome: true,
            bandeira: true,
          },
        },
        fatura: {
          select: {
            status: true,
            mesReferencia: true,
          },
        },
      },
    });

    console.log(`Encontrados ${lancamentos.length} lançamentos`);

    // CORREÇÃO: FILTRAR DUPLICAÇÕES DE PARCELAMENTO
    const lancamentosFiltrados = filtrarDuplicacoesParcelamento(lancamentos);
    console.log(`Após filtro: ${lancamentosFiltrados.length} lançamentos`);

    // CALCULAR TOTAIS POR CATEGORIA CORRETAMENTE
    const totaisPorCategoria = await db.lancamento.groupBy({
      where: {
        OR: [
          // Lançamentos do Claudenir individuais
          {
            AND: [
              { responsavel: "Claudenir" },
              {
                OR: [
                  {
                    data: {
                      gte: inicioMes,
                      lt: fimMes,
                    },
                    dataVencimento: null,
                  },
                  {
                    dataVencimento: {
                      gte: inicioMes,
                      lt: fimMes,
                    },
                  },
                ],
              },
            ],
          },
          // Lançamentos compartilhados onde Claudenir participa
          {
            AND: [
              { responsavel: "Compartilhado" },
              {
                OR: [
                  {
                    data: {
                      gte: inicioMes,
                      lt: fimMes,
                    },
                    dataVencimento: null,
                  },
                  {
                    dataVencimento: {
                      gte: inicioMes,
                      lt: fimMes,
                    },
                  },
                ],
              },
              {
                divisao: {
                  some: {
                    usuario: {
                      name: {
                        contains: "Claudenir",
                        mode: "insensitive",
                      },
                    },
                  },
                },
              },
            ],
          },
        ],
        ...(categoria && categoria !== "todas" && { categoria }),
        ...(tipo &&
          tipo !== "todos" && {
            tipo: {
              equals: tipo,
              mode: "insensitive",
            },
          }),
      },
      by: ["categoria", "tipo"],
      _sum: {
        valor: true,
      },
    });

    // CALCULAR RESUMO CORRETAMENTE
    const whereReceitas = {
      ...where,
      tipo: {
        equals: "receita",
        mode: "insensitive",
      },
    };

    const whereDespesas = {
      ...where,
      tipo: {
        equals: "despesa",
        mode: "insensitive",
      },
    };

    const totalReceitas = await db.lancamento.aggregate({
      where: whereReceitas,
      _sum: {
        valor: true,
      },
    });

    const totalDespesas = await db.lancamento.aggregate({
      where: whereDespesas,
      _sum: {
        valor: true,
      },
    });

    return NextResponse.json({
      lancamentos: lancamentosFiltrados, // USAR OS LANÇAMENTOS FILTRADOS
      totaisPorCategoria,
      resumo: {
        receitas: totalReceitas._sum.valor || 0,
        despesas: totalDespesas._sum.valor || 0,
        saldo:
          (totalReceitas._sum.valor || 0) - (totalDespesas._sum.valor || 0),
      },
      ocorrenciasCriadas, // Retornar info sobre recorrências criadas
    });
  } catch (error) {
    console.error("Erro ao buscar lançamentos do Claudenir:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// FUNÇÃO PARA FILTRAR DUPLICAÇÕES DE PARCELAMENTO
function filtrarDuplicacoesParcelamento(lancamentos: any[]) {
  const lancamentosFiltrados: any[] = [];
  const descricoesProcessadas = new Set();

  for (const lancamento of lancamentos) {
    // Extrair a descrição base (sem o número da parcela)
    const descricaoBase = lancamento.descricao.replace(/\s*\(\d+\/\d+\)$/, '').trim();
    
    // Se já processamos esta descrição, verificar duplicação
    if (descricoesProcessadas.has(descricaoBase)) {
      // CORREÇÃO: Manter APENAS o lançamento MANUAL (parcelaAtual: 1, recorrenteId: null)
      // e remover o lançamento automático duplicado
      const lancamentoManualExistente = lancamentosFiltrados.find(
        l => l.descricao.replace(/\s*\(\d+\/\d+\)$/, '').trim() === descricaoBase &&
             l.parcelaAtual === 1 && 
             l.recorrenteId === null
      );

      if (lancamentoManualExistente) {
        // Já temos o manual, pular este automático
        console.log(`🚫 Removendo duplicação automática: ${lancamento.descricao}`);
        continue;
      }

      // Se não encontrou o manual, verificar se temos um automático e este é manual
      const lancamentoAutomaticoExistente = lancamentosFiltrados.find(
        l => l.descricao.replace(/\s*\(\d+\/\d+\)$/, '').trim() === descricaoBase &&
             l.recorrenteId !== null
      );

      if (lancamentoAutomaticoExistente && lancamento.parcelaAtual === 1 && lancamento.recorrenteId === null) {
        // Temos um automático e este é manual - substituir pelo manual
        console.log(`🔄 Substituindo automático por manual: ${lancamento.descricao}`);
        const index = lancamentosFiltrados.indexOf(lancamentoAutomaticoExistente);
        lancamentosFiltrados[index] = lancamento;
        continue;
      }
    }

    // Adicionar à lista e marcar como processado
    lancamentosFiltrados.push(lancamento);
    descricoesProcessadas.add(descricaoBase);
  }

  console.log(`📊 Filtrados ${lancamentos.length} -> ${lancamentosFiltrados.length} lançamentos`);
  return lancamentosFiltrados;
}