import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { mensagemOriginal, usuarioId, tipoGrafico } = await request.json();

    if (!mensagemOriginal || !usuarioId) {
      return NextResponse.json(
        { error: "mensagemOriginal e usuarioId são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar dados do usuário
    const usuario = await db.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        Lancamento: {
          where: {
            data: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Gerar análise
    const analiseGrafico = await gerarAnaliseDoGrafico(usuario.Lancamento, mensagemOriginal);

    // Retornar TUDO, incluindo mensagemOriginal
    return NextResponse.json({
      analise: analiseGrafico,
      lancamentos: usuario.Lancamento,
      tipoGrafico: tipoGrafico || "pizza",
      mensagemOriginal: mensagemOriginal, // ← ADICIONAR ESTA LINHA
      success: true
    });

  } catch (error) {
    console.error("Erro ao gerar gráfico:", error);
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// Mantenha a função gerarAnaliseDoGrafico existente
async function gerarAnaliseDoGrafico(
  lancamentos: any[],
  mensagem: string
): Promise<string> {
  const totalDespesas = lancamentos
    .filter((l) => l.tipo === "Despesa")
    .reduce((sum, l) => sum + l.valor, 0);

  const totalReceitas = lancamentos
    .filter((l) => l.tipo === "Receita")
    .reduce((sum, l) => sum + l.valor, 0);

  const saldo = totalReceitas - totalDespesas;

  const gastosPorCategoria = lancamentos
    .filter((l) => l.tipo === "Despesa")
    .reduce((acc: any, l) => {
      acc[l.categoria] = (acc[l.categoria] || 0) + l.valor;
      return acc;
    }, {});

  const maiorCategoria = Object.entries(gastosPorCategoria).sort(
    ([, a]: any, [, b]: any) => b - a
  )[0];

  return `📊 **Análise do Seu Gráfico Financeiro**

💸 Total de Despesas: R$ ${totalDespesas.toFixed(2)}
💚 Total de Receitas: R$ ${totalReceitas.toFixed(2)}
💰 Saldo do Mês: R$ ${saldo.toFixed(2)}

🎯 Maior gasto: ${maiorCategoria ? `${maiorCategoria[0]} (R$ ${(maiorCategoria[1] as number).toFixed(2)})` : "Nenhum dado"}

💡 Dica: ${saldo > 0 ? "Ótimo trabalho! Você está com saldo positivo." : "Atenção! Tente reduzir gastos nas categorias mais altas."}`;
}
