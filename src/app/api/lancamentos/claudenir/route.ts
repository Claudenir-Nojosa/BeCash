// app/api/lancamentos/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

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

    // Calcular datas do período
    const inicioMes = new Date(anoNum, mesNum - 1, 1);
    const fimMes = new Date(anoNum, mesNum, 1);

    console.log(
      `Filtrando por período: ${inicioMes.toISOString()} até ${fimMes.toISOString()}`
    );

    // Construir filtros para lançamentos do Claudenir
    const where: any = {
      OR: [
        // Lançamentos individuais do Claudenir
        {
          AND: [
            { responsavel: "Claudenir" },
            {
              data: {
                gte: inicioMes,
                lt: fimMes,
              },
            },
          ],
        },
        // Lançamentos compartilhados onde Claudenir participa
        {
          AND: [
            { responsavel: "Compartilhado" },
            {
              data: {
                gte: inicioMes,
                lt: fimMes,
              },
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
      },
    });

    console.log(`Encontrados ${lancamentos.length} lançamentos`);

    // Calcular totais por categoria
    const totaisPorCategoria = await db.lancamento.groupBy({
      where,
      by: ["categoria", "tipo"],
      _sum: {
        valor: true,
      },
    });

    // Calcular resumo
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
    console.error("Erro ao buscar lançamentos do Claudenir:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
