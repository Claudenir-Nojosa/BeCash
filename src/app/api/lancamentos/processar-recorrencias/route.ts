import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    // Buscar lançamentos recorrentes que precisam ser replicados
    const lancamentosRecorrentes = await db.lancamento.findMany({
      where: {
        recorrente: true,
        OR: [
          { dataFimRecorrencia: null },
          { dataFimRecorrencia: { gte: inicioMes } },
        ],
        data: { lte: inicioMes },
      },
      include: {
        categoria: true,
        cartao: true,
      },
    });

    let lancamentosCriados = 0;

    for (const lancamento of lancamentosRecorrentes) {
      // Verificar se já existe lançamento para este mês
      const existeEsteMes = await db.lancamento.findFirst({
        where: {
          lancamentoPaiId: lancamento.id,
          data: {
            gte: inicioMes,
            lte: fimMes,
          },
        },
      });

      if (!existeEsteMes) {
        // Criar novo lançamento para este mês
        await db.lancamento.create({
          data: {
            descricao: lancamento.descricao,
            valor: lancamento.valor,
            tipo: lancamento.tipo,
            metodoPagamento: lancamento.metodoPagamento,
            data: new Date(), // Data atual
            pago: false,
            observacoes: lancamento.observacoes,
            usuarioId: lancamento.usuarioId,
            categoriaId: lancamento.categoriaId,
            cartaoId: lancamento.cartaoId,
            tipoParcelamento: lancamento.tipoParcelamento,
            recorrente: true,
            dataFimRecorrencia: lancamento.dataFimRecorrencia,
            lancamentoPaiId: lancamento.id,
            parcelaAtual: 1,
            parcelasTotal: null,
          },
        });
        lancamentosCriados++;
      }
    }

    return NextResponse.json({
      message: `Processadas ${lancamentosRecorrentes.length} recorrências, criados ${lancamentosCriados} novos lançamentos`,
      data: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro ao processar recorrências:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
