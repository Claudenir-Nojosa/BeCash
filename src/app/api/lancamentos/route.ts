// app/api/lancamentos/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../auth";

// Função para gerar ocorrências de lançamentos recorrentes
async function gerarOcorrenciasRecorrentes(
  mes: number,
  ano: number,
  usuarioId: string
) {
  const inicioMes = new Date(ano, mes - 1, 1);
  const fimMes = new Date(ano, mes, 1);

  // Buscar todas as recorrências ativas que devem gerar lançamentos neste mês
  const recorenciasAtivas = await db.lancamentoRecorrente.findMany({
    where: {
      usuarioId,
      ativo: true,
      dataInicio: {
        lte: fimMes,
      },
    },
  });

  for (const recorrente of recorenciasAtivas) {
    // Verificar se já existe lançamento para este mês
    const existeLancamento = await db.lancamento.findFirst({
      where: {
        recorrenteId: recorrente.id,
        data: {
          gte: inicioMes,
          lt: fimMes,
        },
      },
    });

    if (!existeLancamento) {
      // Calcular data da ocorrência
      let dataOcorrencia = new Date(recorrente.dataInicio);
      const mesesDiff =
        (ano - dataOcorrencia.getFullYear()) * 12 +
        (mes - dataOcorrencia.getMonth() - 1);

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

      // Verificar limite de parcelas
      if (
        deveGerar &&
        recorrente.parcelas &&
        mesesDiff >= recorrente.parcelas
      ) {
        deveGerar = false;
        // Desativar recorrência se atingiu o limite
        await db.lancamentoRecorrente.update({
          where: { id: recorrente.id },
          data: { ativo: false },
        });
      }

      if (deveGerar) {
        dataOcorrencia.setMonth(dataOcorrencia.getMonth() + mesesDiff);

        // Criar a ocorrência
        await db.lancamento.create({
          data: {
            descricao: recorrente.descricao,
            valor: recorrente.valor,
            tipo: recorrente.tipo,
            categoria: recorrente.categoria,
            tipoLancamento: recorrente.tipoLancamento,
            responsavel: recorrente.responsavel,
            data: dataOcorrencia,
            pago: false,
            parcelaAtual: mesesDiff + 1,
            observacoes: recorrente.observacoes,
            usuarioId: recorrente.usuarioId,
            recorrenteId: recorrente.id,
            origem: "recorrente",
          },
        });
      }
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get("mes");
    const ano = searchParams.get("ano");
    const categoria = searchParams.get("categoria");
    const tipo = searchParams.get("tipo");
    const responsavel = searchParams.get("responsavel"); // Adicione esta linha

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
    const {
      descricao,
      valor,
      tipo,
      categoria,
      tipoLancamento,
      responsavel,
      data,
      pago,
      recorrente,
      frequencia,
      parcelas,
      observacoes,
      origem = "manual",
      apiKey,
      usuarioId: usuarioIdFromBody,
      // Novo campo para divisão automática
      divisaoAutomatica = true, // Padrão: dividir automaticamente
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

    if (recorrente && !frequencia) {
      return NextResponse.json(
        { error: "Frequência é obrigatória para lançamentos recorrentes" },
        { status: 400 }
      );
    }

    let resultado;

    // VERIFICAÇÃO SIMPLIFICADA - APENAS PELO TIPO LANÇAMENTO
    const isCompartilhado = tipoLancamento === "compartilhado";

    if (recorrente) {
      // Criar lançamento recorrente
      const lancamentoRecorrente = await db.lancamentoRecorrente.create({
        data: {
          descricao,
          valor: parseFloat(valor),
          tipo,
          categoria,
          tipoLancamento,
          responsavel,
          dataInicio: new Date(data),
          frequencia,
          parcelas: parcelas ? parseInt(parcelas) : null,
          observacoes: observacoes || null,
          usuarioId: finalUsuarioId,
        },
      });

      // Criar primeira ocorrência
      const primeiraOcorrencia = await db.lancamento.create({
        data: {
          descricao,
          valor: parseFloat(valor),
          tipo,
          categoria,
          tipoLancamento,
          responsavel,
          data: new Date(data),
          pago: Boolean(pago),
          parcelaAtual: 1,
          observacoes: observacoes || null,
          origem,
          usuarioId: finalUsuarioId,
          recorrenteId: lancamentoRecorrente.id,
          // Se for compartilhado, criar as divisões automaticamente
          ...(isCompartilhado &&
            divisaoAutomatica && {
              divisao: {
                create: await criarDivisoesAutomaticas(
                  finalUsuarioId,
                  parseFloat(valor)
                ),
              },
            }),
        },
        include: {
          recorrente: true,
          ...(isCompartilhado && divisaoAutomatica && { divisao: true }),
        },
      });

      resultado = { ...primeiraOcorrencia, recorrente: lancamentoRecorrente };
    } else {
      // Criar lançamento único
      resultado = await db.lancamento.create({
        data: {
          descricao,
          valor: parseFloat(valor),
          tipo,
          categoria,
          tipoLancamento,
          responsavel,
          data: new Date(data),
          pago: Boolean(pago),
          observacoes: observacoes || null,
          origem,
          usuarioId: finalUsuarioId,
          // Se for compartilhado, criar as divisões automaticamente
          ...(isCompartilhado &&
            divisaoAutomatica && {
              divisao: {
                create: await criarDivisoesAutomaticas(
                  finalUsuarioId,
                  parseFloat(valor)
                ),
              },
            }),
        },
        include: {
          recorrente: true,
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

// Função auxiliar para criar divisões automáticas
async function criarDivisoesAutomaticas(usuarioId: string, valorTotal: number) {
  try {
    // Buscar todos os usuários (exceto o atual)
    const usuarios = await db.usuario.findMany({
      where: {
        id: {
          not: usuarioId,
        },
      },
    });

    // Se não há outros usuários, criar divisão apenas para o usuário atual
    if (usuarios.length === 0) {
      return [
        {
          usuarioId: usuarioId,
          valorDivisao: valorTotal,
          valorPago: 0,
        },
      ];
    }

    // Dividir o valor igualmente entre todos os usuários (incluindo o atual)
    const valorPorPessoa = valorTotal / (usuarios.length + 1);

    const divisoes = [
      // Divisão para o usuário atual
      {
        usuarioId: usuarioId,
        valorDivisao: valorPorPessoa,
        valorPago: 0,
      },
      // Divisões para os outros usuários
      ...usuarios.map((usuario) => ({
        usuarioId: usuario.id,
        valorDivisao: valorPorPessoa,
        valorPago: 0,
      })),
    ];

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
