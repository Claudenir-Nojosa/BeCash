// app/api/debug/gerar-recorrentes/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";


export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { mes, ano } = body;

    const mesNum = parseInt(mes) || new Date().getMonth() + 1;
    const anoNum = parseInt(ano) || new Date().getFullYear();

    const inicioMes = new Date(anoNum, mesNum - 1, 1);
    const fimMes = new Date(anoNum, mesNum, 1);

    console.log(`=== DEBUG RECORRÊNCIAS ===`);
    console.log(`Período: ${inicioMes.toISOString()} até ${fimMes.toISOString()}`);
    console.log(`Usuário: ${session.user.id}`);

    // Buscar TODAS as recorrências do usuário
    const todasRecorrencias = await db.lancamentoRecorrente.findMany({
      where: {
        usuarioId: session.user.id,
      },
    });

    console.log(`Total de recorrências no banco: ${todasRecorrencias.length}`);

    // Buscar recorrências ativas
    const recorenciasAtivas = await db.lancamentoRecorrente.findMany({
      where: {
        usuarioId: session.user.id,
        ativo: true,
        dataInicio: {
          lte: fimMes,
        },
      },
    });

    console.log(`Recorrências ativas: ${recorenciasAtivas.length}`);

    let ocorrenciasCriadas = 0;
    const detalhes = [];

    for (const recorrente of recorenciasAtivas) {
      console.log(`\n--- Analisando: ${recorrente.descricao} ---`);
      console.log(`ID: ${recorrente.id}`);
      console.log(`Data início: ${recorrente.dataInicio}`);
      console.log(`Frequência: ${recorrente.frequencia}`);
      console.log(`Parcelas: ${recorrente.parcelas}`);

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

      if (existeLancamento) {
        console.log(`❌ Já existe lançamento para este mês: ${existeLancamento.id}`);
        detalhes.push({
          recorrente: recorrente.descricao,
          status: 'já_existe',
          lancamentoId: existeLancamento.id
        });
        continue;
      }

      // Calcular diferença em meses
      const dataInicio = new Date(recorrente.dataInicio);
      const mesesDiff = (anoNum - dataInicio.getFullYear()) * 12 + (mesNum - dataInicio.getMonth() - 1);
      
      console.log(`Meses desde início: ${mesesDiff}`);

      // Verificar frequência
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

      console.log(`Deve gerar? ${deveGerar}`);

      // Verificar parcelas
      if (deveGerar && recorrente.parcelas && mesesDiff >= recorrente.parcelas) {
        console.log(`❌ Limite de parcelas atingido: ${recorrente.parcelas}`);
        deveGerar = false;
        await db.lancamentoRecorrente.update({
          where: { id: recorrente.id },
          data: { ativo: false },
        });
      }

      if (deveGerar) {
        // Criar data da ocorrência (usar o dia do mês da data inicial)
        const diaOriginal = dataInicio.getDate();
        const dataOcorrencia = new Date(anoNum, mesNum - 1, diaOriginal);
        
        // Se a data for futura, usar o último dia do mês atual
        const dataAtual = new Date();
        if (dataOcorrencia > dataAtual) {
          dataOcorrencia.setDate(0); // Último dia do mês anterior
        }

        console.log(`✅ Criando ocorrência para: ${dataOcorrencia}`);

        // Criar lançamento
        const novoLancamento = await db.lancamento.create({
          data: {
            descricao: recorrente.descricao,
            valor: recorrente.valor,
            tipo: recorrente.tipo,
            categoria: recorrente.categoria,
            tipoLancamento: recorrente.tipoLancamento,
            tipoTransacao: recorrente.tipoTransacao || "DINHEIRO",
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

        ocorrenciasCriadas++;
        detalhes.push({
          recorrente: recorrente.descricao,
          status: 'criado',
          lancamentoId: novoLancamento.id,
          data: dataOcorrencia
        });
        
        console.log(`✅ Ocorrência criada: ${novoLancamento.id}`);
      } else {
        detalhes.push({
          recorrente: recorrente.descricao,
          status: 'nao_gerar',
          motivo: mesesDiff < 0 ? 'data_futura' : 
                 (recorrente.parcelas && mesesDiff >= recorrente.parcelas) ? 'limite_parcelas' : 'frequencia_nao_atendida'
        });
      }
    }

    console.log(`=== FIM DEBUG ===`);
    console.log(`Ocorrências criadas: ${ocorrenciasCriadas}`);

    return NextResponse.json({
      success: true,
      periodo: { mes: mesNum, ano: anoNum },
      totalRecorrencias: todasRecorrencias.length,
      recorrenciasAtivas: recorenciasAtivas.length,
      ocorrenciasCriadas,
      detalhes
    });

  } catch (error) {
    console.error("Erro no debug de recorrências:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}