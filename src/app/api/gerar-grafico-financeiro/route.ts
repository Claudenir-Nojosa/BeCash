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

    // Gerar gráfico usando QuickChart
    const chartUrl = await gerarGraficoQuickChart(usuario.Lancamento, tipoGrafico);
    
    // Baixar a imagem do gráfico
    const chartResponse = await fetch(chartUrl);
    const chartBuffer = await chartResponse.arrayBuffer();
    const chartBase64 = Buffer.from(chartBuffer).toString('base64');

    const analiseGrafico = await gerarAnaliseDoGrafico(usuario.Lancamento, mensagemOriginal);

    return NextResponse.json({
      analise: analiseGrafico,
      graficoBase64: chartBase64,
      tipoGrafico: tipoGrafico || "pizza",
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

async function gerarGraficoQuickChart(lancamentos: any[], tipoGrafico: string = "pie") {
  // Preparar dados
  const categorias = [...new Set(lancamentos.map((l) => l.categoria))];
  const despesasPorCategoria = categorias.map((categoria) =>
    lancamentos
      .filter((l) => l.tipo === "Despesa" && l.categoria === categoria)
      .reduce((sum, l) => sum + l.valor, 0)
  );

  // Configurar o gráfico
  const chartConfig = {
    type: tipoGrafico === "barras" ? "bar" : "pie",
    data: {
      labels: categorias,
      datasets: [{
        data: despesasPorCategoria,
        backgroundColor: [
          "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0",
          "#9966FF", "#FF9F40", "#8AE52E", "#FF6B8B"
        ],
        borderColor: "#ffffff",
        borderWidth: 2
      }]
    },
    options: {
      title: {
        display: true,
        text: "Distribuição de Gastos por Categoria"
      },
      legend: {
        display: true,
        position: "right"
      }
    }
  };

  // Codificar a configuração para URL
  const chartConfigEncoded = encodeURIComponent(JSON.stringify(chartConfig));
  
  // Retornar URL do QuickChart
  return `https://quickchart.io/chart?c=${chartConfigEncoded}&width=600&height=400&backgroundColor=white`;
}

async function gerarAnaliseDoGrafico(lancamentos: any[], mensagem: string): Promise<string> {
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

  const maiorCategoria = Object.entries(gastosPorCategoria)
    .sort(([, a]: any, [, b]: any) => b - a)[0];

  return `📊 **Análise do Seu Gráfico Financeiro**

💸 Total de Despesas: R$ ${totalDespesas.toFixed(2)}
💚 Total de Receitas: R$ ${totalReceitas.toFixed(2)}
💰 Saldo do Mês: R$ ${saldo.toFixed(2)}

🎯 Maior gasto: ${maiorCategoria ? `${maiorCategoria[0]} (R$ ${(maiorCategoria[1] as number).toFixed(2)})` : "Nenhum dado"}

💡 Dica: ${saldo > 0 ? 'Ótimo trabalho! Você está com saldo positivo.' : 'Atenção! Tente reduzir gastos nas categorias mais altas.'}`;
}