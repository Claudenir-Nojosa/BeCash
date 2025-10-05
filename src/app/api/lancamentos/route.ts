// app/api/lancamentos/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../auth";

async function gerarOcorrenciasRecorrentes(
  mes: number,
  ano: number,
  usuarioId: string
) {
  console.log(`=== GERANDO RECORRÊNCIAS ${mes}/${ano} ===`);

  const inicioMes = new Date(ano, mes - 1, 1);
  const fimMes = new Date(ano, mes, 1);

  // Buscar TODAS as recorrências ativas
  const recorenciasAtivas = await db.lancamentoRecorrente.findMany({
    where: {
      usuarioId,
      ativo: true,
    },
    include: {
      ocorrencias: {
        where: {
          OR: [
            {
              data: {
                gte: inicioMes,
                lt: fimMes,
              },
            },
            {
              dataVencimento: {
                gte: inicioMes,
                lt: fimMes,
              },
            },
          ],
        },
      },
    },
  });

  console.log(`📊 Recorrências ativas: ${recorenciasAtivas.length}`);

  let ocorrenciasCriadas = 0;

  for (const recorrente of recorenciasAtivas) {
    console.log(
      `\n🔍 Analisando: "${recorrente.descricao}" (${recorrente.tipoRecorrencia})`
    );

    // SE JÁ EXISTE lançamento para este mês, PULAR
    if (recorrente.ocorrencias.length > 0) {
      console.log(`✅ Já existe lançamento para ${mes}/${ano}, pulando...`);
      continue;
    }

    // Buscar TODOS os lançamentos deste recorrente
    const todosLancamentos = await db.lancamento.findMany({
      where: {
        recorrenteId: recorrente.id,
      },
      orderBy: {
        data: "asc",
      },
    });

    if (todosLancamentos.length === 0) {
      console.log(`❌ Nenhum lançamento encontrado para esta recorrência`);
      continue;
    }

    const primeiroLancamento = todosLancamentos[0];

    // LÓGICA DIFERENCIADA POR TIPO
    if (recorrente.tipoRecorrencia === "PARCELAMENTO") {
      ocorrenciasCriadas += await gerarParcela(
        recorrente,
        primeiroLancamento,
        todosLancamentos,
        mes,
        ano
      );
    } else {
      ocorrenciasCriadas += await gerarRecorrencia(
        recorrente,
        primeiroLancamento,
        mes,
        ano
      );
    }
  }

  console.log(
    `🎯 TOTAL: ${ocorrenciasCriadas} ocorrências criadas para ${mes}/${ano}`
  );
  return ocorrenciasCriadas;
}

// NOVA FUNÇÃO: Verificar se já existe lançamento duplicado
async function verificarDuplicacaoCartaoCredito(
  recorrente: any,
  mes: number,
  ano: number,
  usuarioId: string
): Promise<boolean> {
  // Para cartão de crédito, verificar se já existe lançamento MANUAL no mesmo mês
  const inicioMes = new Date(ano, mes - 1, 1);
  const fimMes = new Date(ano, mes, 1);

  const lancamentoManual = await db.lancamento.findFirst({
    where: {
      usuarioId,
      descricao: recorrente.descricao,
      tipoTransacao: "CARTAO_CREDITO",
      dataVencimento: {
        gte: inicioMes,
        lt: fimMes,
      },
      recorrenteId: null, // É um lançamento manual, não de recorrência
    },
  });

  if (lancamentoManual) {
    console.log(
      `🚫 Já existe lançamento MANUAL para cartão em ${mes}/${ano}, evitando duplicação`
    );
    return true;
  }

  return false;
}

async function gerarParcela(
  recorrente: any,
  primeiroLancamento: any,
  todosLancamentos: any[],
  mes: number,
  ano: number
) {
  console.log(`📦 Processando PARCELAMENTO: "${recorrente.descricao}"`);
  
  // 1. Contar quantas parcelas JÁ EXISTEM (incluindo a manual)
  const totalParcelasExistentes = todosLancamentos.length;
  console.log(`   Parcelas existentes: ${totalParcelasExistentes}, Total desejado: ${recorrente.parcelas}`);

  // 2. Se já temos todas as parcelas, PARAR
  if (totalParcelasExistentes >= recorrente.parcelas) {
    console.log(`⏹️ Já temos ${totalParcelasExistentes} parcelas de ${recorrente.parcelas}, parando`);
    await db.lancamentoRecorrente.update({
      where: { id: recorrente.id },
      data: { ativo: false },
    });
    return 0;
  }

  // 3. Calcular número da PRÓXIMA parcela
  const numeroParcela = totalParcelasExistentes + 1;
  
  // 4. Calcular data da PRÓXIMA parcela
  const dataPrimeiraParcela = new Date(primeiroLancamento.dataVencimento || primeiroLancamento.data);
  let dataParcela = new Date(dataPrimeiraParcela);
  
  // SIMPLES: Parcela 1 = mês 0, Parcela 2 = mês +1, Parcela 3 = mês +2
  dataParcela.setMonth(dataPrimeiraParcela.getMonth() + (numeroParcela - 1));

  // 5. Verificar se esta parcela é para o mês atual
  const mesParcela = dataParcela.getMonth() + 1;
  const anoParcela = dataParcela.getFullYear();
  
  if (mesParcela !== mes || anoParcela !== ano) {
    console.log(`📅 Parcela ${numeroParcela} não é para ${mes}/${ano} (é para ${mesParcela}/${anoParcela})`);
    return 0;
  }

  console.log(`🔄 Criando PARCELA ${numeroParcela}/${recorrente.parcelas} para ${dataParcela.toISOString()}`);

  // 6. Calcular data de vencimento
  let dataVencimento = null;
  if (primeiroLancamento.dataVencimento) {
    const vencimentoOriginal = new Date(primeiroLancamento.dataVencimento);
    dataVencimento = new Date(vencimentoOriginal);
    dataVencimento.setMonth(vencimentoOriginal.getMonth() + (numeroParcela - 1));
  }

  // 7. Criar a parcela
  const dadosLancamento: any = {
    descricao: `${recorrente.descricao} (${numeroParcela}/${recorrente.parcelas})`,
    valor: recorrente.valor,
    tipo: recorrente.tipo,
    categoria: recorrente.categoria,
    tipoLancamento: recorrente.tipoLancamento,
    tipoTransacao: primeiroLancamento.tipoTransacao,
    responsavel: recorrente.responsavel,
    data: dataParcela,
    dataVencimento: dataVencimento,
    pago: false,
    parcelaAtual: numeroParcela,
    observacoes: recorrente.observacoes,
    usuarioId: recorrente.usuarioId,
    recorrenteId: recorrente.id,
    origem: "recorrente",
    cartaoId: primeiroLancamento.cartaoId,
  };

  await db.lancamento.create({
    data: dadosLancamento,
  });

  console.log(`✅ Parcela ${numeroParcela} criada com sucesso!`);
  return 1;
}

// Função para RECORRÊNCIAS (assinaturas, mensalidades)
async function gerarRecorrencia(
  recorrente: any,
  primeiroLancamento: any,
  mes: number,
  ano: number
) {
  const dataInicio = new Date(recorrente.dataInicio);

  console.log(`📅 Analisando recorrência: "${recorrente.descricao}"`);
  console.log(`   Data início: ${dataInicio.toISOString()}`);
  console.log(`   Mês/Ano alvo: ${mes}/${ano}`);
  console.log(`   Tipo: ${recorrente.tipoRecorrencia}`);

  // Lógica normal para recorrência
  const mesesDiff =
    (ano - dataInicio.getFullYear()) * 12 + (mes - dataInicio.getMonth() - 1);

  console.log(`   Meses desde início: ${mesesDiff}`);

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

  if (!deveGerar) {
    console.log(`❌ Recorrência não deve gerar para ${mes}/${ano}`);
    return 0;
  }

  // Calcular data baseada na data de início
  const diaOriginal = dataInicio.getDate();
  let dataOcorrencia = new Date(ano, mes - 1, diaOriginal);

  const ultimoDiaMes = new Date(ano, mes, 0).getDate();
  if (dataOcorrencia.getDate() > ultimoDiaMes) {
    dataOcorrencia = new Date(ano, mes, 0);
  }

  // Calcular data de vencimento (se existia no primeiro)
  let dataVencimento = null;
  if (primeiroLancamento.dataVencimento) {
    const vencimentoOriginal = new Date(primeiroLancamento.dataVencimento);
    dataVencimento = new Date(ano, mes - 1, vencimentoOriginal.getDate());

    // Ajustar para último dia do mês se necessário
    const ultimoDia = new Date(ano, mes, 0).getDate();
    if (dataVencimento.getDate() > ultimoDia) {
      dataVencimento = new Date(ano, mes, 0);
    }
  }

  console.log(`🔄 Criando RECORRÊNCIA para ${dataOcorrencia.toISOString()}`);

  // VERIFICAR SE JÁ EXISTE lançamento para evitar duplicação
  const lancamentoExistente = await db.lancamento.findFirst({
    where: {
      recorrenteId: recorrente.id,
      OR: [
        { data: { gte: new Date(ano, mes - 1, 1), lt: new Date(ano, mes, 1) } },
        {
          dataVencimento: {
            gte: new Date(ano, mes - 1, 1),
            lt: new Date(ano, mes, 1),
          },
        },
      ],
    },
  });

  if (lancamentoExistente) {
    console.log(`⚠️ Lançamento já existe para ${mes}/${ano}, pulando...`);
    return 0;
  }

  const dadosLancamento: any = {
    descricao: recorrente.descricao,
    valor: recorrente.valor,
    tipo: recorrente.tipo,
    categoria: recorrente.categoria,
    tipoLancamento: recorrente.tipoLancamento,
    tipoTransacao:
      primeiroLancamento.tipoTransacao ||
      recorrente.tipoTransacao ||
      "DINHEIRO",
    responsavel: recorrente.responsavel,
    data: dataOcorrencia,
    dataVencimento: dataVencimento,
    pago: false,
    observacoes: recorrente.observacoes,
    usuarioId: recorrente.usuarioId,
    recorrenteId: recorrente.id,
    origem: "recorrente",
    cartaoId: primeiroLancamento.cartaoId,
  };

  await db.lancamento.create({
    data: dadosLancamento,
  });

  console.log(`✅ Recorrência criada com sucesso!`);
  return 1;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get("mes");
    const ano = searchParams.get("ano");
    const categoria = searchParams.get("categoria");
    const tipo = searchParams.get("tipo");
    const responsavel = searchParams.get("responsavel");

    // Autenticação
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const usuarioId = session.user.id;

    // Gerar ocorrências recorrentes para o mês solicitado
    if (mes && ano) {
      await gerarOcorrenciasRecorrentes(
        parseInt(mes),
        parseInt(ano),
        usuarioId
      );
    }

    // Construir filtros
    const where: any = {
      usuarioId,
    };

    if (mes && ano) {
      where.data = {
        gte: new Date(`${ano}-${mes}-01`),
        lt: new Date(`${ano}-${Number(mes) + 1}-01`),
      };
    }

    if (categoria && categoria !== "todas") {
      where.categoria = categoria;
    }

    if (tipo && tipo !== "todos") {
      where.tipo = {
        equals: tipo,
        mode: "insensitive",
      };
    }

    // ADICIONE ESTE FILTRO PARA RESPONSÁVEL
    if (responsavel) {
      where.responsavel = {
        equals: responsavel,
        mode: "insensitive",
      };
    }

    // Buscar lançamentos do banco
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
      },
    });

    // Calcular totais
    const totaisPorCategoria = await db.lancamento.groupBy({
      where,
      by: ["categoria", "tipo"],
      _sum: {
        valor: true,
      },
    });

    const totalReceitas = await db.lancamento.aggregate({
      where: {
        ...where,
        tipo: {
          equals: "receita",
          mode: "insensitive",
        },
      },
      _sum: {
        valor: true,
      },
    });

    const totalDespesas = await db.lancamento.aggregate({
      where: {
        ...where,
        tipo: {
          equals: "despesa",
          mode: "insensitive",
        },
      },
      _sum: {
        valor: true,
      },
    });

    return NextResponse.json({
      lancamentos,
      totaisPorCategoria,
      resumo: {
        receitas: totalReceitas._sum.valor || 0,
        despesas: totalDespesas._sum.valor || 0,
        saldo:
          (totalReceitas._sum.valor || 0) - (totalDespesas._sum.valor || 0),
      },
    });
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
    const body = await request.json();
    let {
      descricao,
      valor,
      tipo,
      categoria,
      tipoLancamento,
      tipoTransacao = "DINHEIRO",
      responsavel,
      data,
      dataVencimento,
      pago,
      recorrente,
      tipoRecorrencia,
      frequencia,
      parcelas,
      observacoes,
      origem = "manual",
      apiKey,
      usuarioId: usuarioIdFromBody,
      cartaoId,
      divisaoAutomatica = true,
    } = body;

    // Determinar o usuarioId baseado no tipo de autenticação
    let finalUsuarioId;

    if (apiKey) {
      // Autenticação via API Key (n8n)
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
    } else {
      // Autenticação via sessão (frontend)
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
      finalUsuarioId = session.user.id;
    }

    // Validações básicas
    if (
      !descricao ||
      !valor ||
      !tipo ||
      !categoria ||
      !tipoLancamento ||
      !responsavel ||
      !data
    ) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    // Validações para cartão de crédito
    if (tipoTransacao === "CARTAO_CREDITO") {
      if (!cartaoId) {
        return NextResponse.json(
          { error: "Cartão é obrigatório para compras no cartão de crédito" },
          { status: 400 }
        );
      }
      if (!dataVencimento) {
        return NextResponse.json(
          { error: "Data de vencimento é obrigatória para cartão de crédito" },
          { status: 400 }
        );
      }
    }

    if (recorrente && !frequencia && tipoRecorrencia === "RECORRENCIA") {
      return NextResponse.json(
        { error: "Frequência é obrigatória para lançamentos recorrentes" },
        { status: 400 }
      );
    }

    if (recorrente && !parcelas && tipoRecorrencia === "PARCELAMENTO") {
      return NextResponse.json(
        { error: "Número de parcelas é obrigatório para parcelamento" },
        { status: 400 }
      );
    }

    let resultado;
    let faturaId = null;

    // LÓGICA PARA CARTÃO DE CRÉDITO - CRIAR/ATUALIZAR FATURA
    if (tipoTransacao === "CARTAO_CREDITO" && cartaoId) {
      faturaId = await criarOuAtualizarFatura({
        cartaoId,
        dataVencimento: new Date(dataVencimento),
        valor: parseFloat(valor),
        usuarioId: finalUsuarioId,
      });
    }

    // VERIFICAÇÃO SIMPLIFICADA - APENAS PELO TIPO LANÇAMENTO
    const isCompartilhado = tipoLancamento === "compartilhado";

    // CORREÇÃO: Para parcelamento, dividir o valor
    const valorFinal =
      tipoRecorrencia === "PARCELAMENTO" && parcelas
        ? parseFloat(valor) / parseInt(parcelas)
        : parseFloat(valor);

    // Dados base para criação do lançamento
    const dadosLancamento = {
      descricao,
      valor: valorFinal,
      tipo,
      categoria,
      tipoLancamento,
      tipoTransacao,
      responsavel,
      data: new Date(data),
      dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
      pago: tipoTransacao === "CARTAO_CREDITO" ? false : Boolean(pago),
      observacoes: observacoes || null,
      origem,
      usuarioId: finalUsuarioId,
      cartaoId: tipoTransacao === "CARTAO_CREDITO" ? cartaoId : null,
      faturaId,
      ...(isCompartilhado &&
        divisaoAutomatica && {
          divisao: {
            create: await criarDivisoesAutomaticas(finalUsuarioId, valorFinal),
          },
        }),
    };

    // LÓGICA SIMPLIFICADA PARA PARCELAMENTO
    if (recorrente && tipoRecorrencia === "PARCELAMENTO") {
      // PARA PARCELAMENTO: Criar APENAS o lançamento manual (Parcela 1)
      const lancamentoManual = await db.lancamento.create({
        data: {
          ...dadosLancamento,
          origem: "manual",
          parcelaAtual: 1,
          // NÃO adicionar recorrenteId - é manual
        },
        include: {
          cartao: true,
          fatura: true,
          ...(isCompartilhado && divisaoAutomatica && { divisao: true }),
        },
      });

      // Criar o registro de recorrência APENAS para controle futuro
      const lancamentoRecorrente = await db.lancamentoRecorrente.create({
        data: {
          descricao,
          valor: valorFinal, // Valor já dividido
          tipo,
          categoria,
          tipoLancamento,
          tipoTransacao,
          responsavel,
          dataInicio: new Date(dataVencimento), // Usar data de vencimento como referência
          frequencia: "mensal",
          parcelas: parseInt(parcelas),
          observacoes: observacoes || null,
          usuarioId: finalUsuarioId,
          tipoRecorrencia: "PARCELAMENTO",
        },
      });

      resultado = {
        ...lancamentoManual,
        recorrente: lancamentoRecorrente,
      };

    } else if (recorrente) {
      // PARA RECORRÊNCIA NORMAL (não parcelamento)
      const lancamentoRecorrente = await db.lancamentoRecorrente.create({
        data: {
          descricao,
          valor: valorFinal,
          tipo,
          categoria,
          tipoLancamento,
          tipoTransacao,
          responsavel,
          dataInicio: new Date(data),
          frequencia,
          parcelas: parcelas ? parseInt(parcelas) : null,
          observacoes: observacoes || null,
          usuarioId: finalUsuarioId,
          tipoRecorrencia: tipoRecorrencia || "RECORRENCIA",
        },
      });

      // Criar primeira ocorrência
      const primeiraOcorrencia = await db.lancamento.create({
        data: {
          ...dadosLancamento,
          recorrenteId: lancamentoRecorrente.id,
        },
        include: {
          recorrente: true,
          cartao: true,
          fatura: true,
          ...(isCompartilhado && divisaoAutomatica && { divisao: true }),
        },
      });

      resultado = {
        ...primeiraOcorrencia,
        recorrente: lancamentoRecorrente,
      };

    } else {
      // LANÇAMENTO ÚNICO (não recorrente)
      resultado = await db.lancamento.create({
        data: dadosLancamento,
        include: {
          recorrente: true,
          cartao: true,
          fatura: true,
          ...(isCompartilhado &&
            divisaoAutomatica && {
              divisao: {
                include: {
                  usuario: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            }),
        },
      });
    }

    return NextResponse.json(resultado, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar lançamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Função auxiliar para criar ou atualizar fatura
async function criarOuAtualizarFatura({
  cartaoId,
  dataVencimento,
  valor,
  usuarioId,
}: {
  cartaoId: string;
  dataVencimento: Date;
  valor: number;
  usuarioId: string;
}) {
  try {
    // Verificar se o cartão pertence ao usuário
    const cartao = await db.cartao.findFirst({
      where: {
        id: cartaoId,
        usuarioId: usuarioId,
      },
    });

    if (!cartao) {
      throw new Error("Cartão não encontrado");
    }

    // Calcular mês de referência baseado na data de vencimento
    const mesReferencia = new Date(dataVencimento);
    mesReferencia.setDate(1); // Primeiro dia do mês

    // Calcular data de fechamento (fechamento é 1 mês antes do vencimento)
    const dataFechamento = new Date(dataVencimento);
    dataFechamento.setMonth(dataFechamento.getMonth() - 1);
    dataFechamento.setDate(cartao.diaFechamento);

    // Verificar se já existe uma fatura para este mês
    let fatura = await db.fatura.findFirst({
      where: {
        cartaoId,
        mesReferencia,
      },
    });

    if (fatura) {
      // Atualizar fatura existente
      fatura = await db.fatura.update({
        where: { id: fatura.id },
        data: {
          valorTotal: { increment: valor },
        },
      });
    } else {
      // Criar nova fatura
      fatura = await db.fatura.create({
        data: {
          cartaoId,
          mesReferencia,
          valorTotal: valor,
          dataFechamento,
          dataVencimento,
          status: "ABERTA",
        },
      });
    }

    return fatura.id;
  } catch (error) {
    console.error("Erro ao criar/atualizar fatura:", error);
    throw error;
  }
}

// Função auxiliar para criar divisões automáticas
async function criarDivisoesAutomaticas(usuarioId: string, valorTotal: number) {
  try {
    // Buscar APENAS os usuários principais (Claudenir e Beatriz)
    const usuariosPrincipais = await db.usuario.findMany({
      where: {
        OR: [
          { email: "clau.nojosaf@gmail.com" }, // Claudenir Filho
          { email: "blaurindo23@gmail.com" }, // Beatriz Laurindo
        ],
        // Garantir que não inclua o usuário atual duplicado
        id: {
          not: usuarioId,
        },
      },
    });

    console.log(
      "Usuários principais encontrados:",
      usuariosPrincipais.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
      }))
    );

    // Se não encontrou os usuários principais, usar fallback
    if (usuariosPrincipais.length === 0) {
      console.log("Nenhum usuário principal encontrado, usando fallback");
      return [
        {
          usuarioId: usuarioId,
          valorDivisao: valorTotal,
          valorPago: 0,
        },
      ];
    }

    // Dividir o valor igualmente entre o usuário atual + usuários principais
    const totalParticipantes = usuariosPrincipais.length + 1;
    const valorPorPessoa = valorTotal / totalParticipantes;

    console.log(
      `Dividindo R$ ${valorTotal} entre ${totalParticipantes} pessoas: R$ ${valorPorPessoa} cada`
    );

    const divisoes = [
      // Divisão para o usuário atual (quem criou o lançamento)
      {
        usuarioId: usuarioId,
        valorDivisao: valorPorPessoa,
        valorPago: 0,
      },
      // Divisões para os usuários principais
      ...usuariosPrincipais.map((usuario) => ({
        usuarioId: usuario.id,
        valorDivisao: valorPorPessoa,
        valorPago: 0,
      })),
    ];

    console.log("Divisões criadas:", divisoes);
    return divisoes;
  } catch (error) {
    console.error("Erro ao criar divisões automáticas:", error);
    // Em caso de erro, criar divisão apenas para o usuário atual
    return [
      {
        usuarioId: usuarioId,
        valorDivisao: valorTotal,
        valorPago: 0,
      },
    ];
  }
}
