import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// Instância do ChartJSNodeCanvas (fora da função para melhor performance)
let chartJSNodeCanvas: any = null;

function getChartJSNodeCanvas() {
  if (!chartJSNodeCanvas) {
    const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
    chartJSNodeCanvas = new ChartJSNodeCanvas({
      width: 800,
      height: 600,
      backgroundColour: "white",
    });
  }
  return chartJSNodeCanvas;
}

export async function POST(request: NextRequest) {
  try {
    const { mensagemOriginal, usuarioId, tipoGrafico } = await request.json();

    console.log("Dados recebidos para gráfico:", {
      mensagemOriginal,
      usuarioId,
      tipoGrafico,
    });

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
          orderBy: { data: "desc" },
        },
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se há lançamentos
    if (usuario.Lancamento.length === 0) {
      return NextResponse.json({
        analise:
          "📊 **Não há dados financeiros para gerar gráfico**\n\nNão encontrei lançamentos financeiros para este mês. Adicione algumas despesas ou receitas primeiro!",
        graficoBase64: null,
        tipoGrafico: tipoGrafico || "pizza",
      });
    }

    // Gerar gráfico
    const chartBuffer = await gerarGraficoFinanceiro(
      usuario.Lancamento,
      tipoGrafico || "pizza",
      mensagemOriginal
    );

    // Converter para base64
    const chartBase64 = chartBuffer.toString("base64");

    // Gerar análise
    const analiseGrafico = await gerarAnaliseDoGrafico(
      usuario.Lancamento,
      mensagemOriginal
    );

    return NextResponse.json({
      analise: analiseGrafico,
      graficoBase64: chartBase64,
      tipoGrafico: tipoGrafico || "pizza",
      mimeType: "image/png",
      success: true,
    });
  } catch (error) {
    console.error("Erro ao gerar gráfico:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function gerarGraficoFinanceiro(
  lancamentos: any[],
  tipoGrafico: string,
  mensagem: string
) {
  const chartJSNodeCanvas = getChartJSNodeCanvas();

  // Preparar dados
  const categorias = [...new Set(lancamentos.map((l) => l.categoria))];

  // Calcular totais por categoria
  const despesasPorCategoria = categorias.map((categoria) =>
    lancamentos
      .filter((l) => l.tipo === "Despesa" && l.categoria === categoria)
      .reduce((sum, l) => sum + l.valor, 0)
  );

  const receitasPorCategoria = categorias.map((categoria) =>
    lancamentos
      .filter((l) => l.tipo === "Receita" && l.categoria === categoria)
      .reduce((sum, l) => sum + l.valor, 0)
  );

  // Configuração base para gráfico de pizza
  let configuration: any = {
    type: "pie",
    data: {
      labels: categorias,
      datasets: [
        {
          data: despesasPorCategoria,
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
            "#8AE52E",
            "#FF6B8B",
          ],
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Distribuição de Gastos por Categoria",
          font: { size: 16 },
        },
        legend: {
          position: "right",
        },
      },
    },
  };

  // Gráfico de barras
  if (tipoGrafico === "barras" || mensagem.toLowerCase().includes("barras")) {
    configuration.type = "bar";
    configuration.data.datasets = [
      {
        label: "Despesas",
        data: despesasPorCategoria,
        backgroundColor: "#FF6384",
        borderWidth: 1,
      },
      {
        label: "Receitas",
        data: receitasPorCategoria,
        backgroundColor: "#36A2EB",
        borderWidth: 1,
      },
    ];
    configuration.options.plugins.title.text =
      "Receitas vs Despesas por Categoria";
  }

  // Gráfico de linhas (simplificado)
  if (tipoGrafico === "linhas" || mensagem.toLowerCase().includes("linhas")) {
    // Agrupar por data dos últimos 30 dias
    const ultimos30Dias = agruparPorUltimos30Dias(lancamentos);
    configuration.type = "line";
    configuration.data.labels = ultimos30Dias.labels;
    configuration.data.datasets = [
      {
        label: "Despesas",
        data: ultimos30Dias.despesas,
        borderColor: "#FF6384",
        backgroundColor: "rgba(255, 99, 132, 0.1)",
        fill: true,
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: "Receitas",
        data: ultimos30Dias.receitas,
        borderColor: "#36A2EB",
        backgroundColor: "rgba(54, 162, 235, 0.1)",
        fill: true,
        borderWidth: 2,
        tension: 0.4,
      },
    ];
    configuration.options.plugins.title.text =
      "Evolução Financeira - Últimos 30 Dias";
  }

  try {
    return await chartJSNodeCanvas.renderToBuffer(configuration);
  } catch (error) {
    console.error("Erro ao renderizar gráfico:", error);
    throw new Error("Falha ao gerar gráfico");
  }
}

function agruparPorUltimos30Dias(lancamentos: any[]) {
  const hoje = new Date();
  const ultimos30Dias = [];

  // Criar array dos últimos 30 dias
  for (let i = 29; i >= 0; i--) {
    const data = new Date();
    data.setDate(hoje.getDate() - i);
    ultimos30Dias.push(data.toISOString().split("T")[0]);
  }

  // Agrupar lançamentos por data
  const lancamentosPorData = lancamentos.reduce((acc, lancamento) => {
    const data = lancamento.data.toISOString().split("T")[0];
    if (!acc[data]) acc[data] = { receitas: 0, despesas: 0 };

    if (lancamento.tipo === "Receita") {
      acc[data].receitas += lancamento.valor;
    } else {
      acc[data].despesas += lancamento.valor;
    }

    return acc;
  }, {});

  // Preencher dados para todos os dias
  const despesas = ultimos30Dias.map(
    (data) => lancamentosPorData[data]?.despesas || 0
  );
  const receitas = ultimos30Dias.map(
    (data) => lancamentosPorData[data]?.receitas || 0
  );

  return {
    labels: ultimos30Dias.map(
      (data) => new Date(data).getDate() + "/" + (new Date(data).getMonth() + 1)
    ),
    despesas,
    receitas,
  };
}

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

  // Encontrar categoria com maior gasto
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

💡 Dica: ${saldo > 0 ? "Ótimo trabalho! Você está com saldo positivo." : "Atenção! Tente reduzir gastos nas categorias mais altas."}

_O gráfico mostra a distribuição detalhada dos seus gastos por categoria._`;
}
