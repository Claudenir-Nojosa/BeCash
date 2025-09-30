import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";

export async function POST(request: NextRequest) {
  try {
    const { mensagemOriginal, usuarioId, tipoGrafico } = await request.json();

    if (!mensagemOriginal || !usuarioId) {
      return NextResponse.json(
        { error: "mensagemOriginal e usuarioId são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar dados do usuário (similar à rota de análise)
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
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Gerar gráfico baseado no tipo solicitado
    const chartBuffer = await gerarGraficoFinanceiro(
      usuario.Lancamento,
      tipoGrafico,
      mensagemOriginal
    );

    // Converter imagem para base64 para enviar via WhatsApp
    const chartBase64 = chartBuffer.toString("base64");

    // Gerar análise textual do gráfico
    const analiseGrafico = await gerarAnaliseDoGrafico(
      usuario.Lancamento,
      mensagemOriginal
    );

    return NextResponse.json({
      analise: analiseGrafico,
      graficoBase64: chartBase64,
      tipoGrafico: tipoGrafico,
      mimeType: "image/png",
    });
  } catch (error) {
    console.error("Erro ao gerar gráfico:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

async function gerarGraficoFinanceiro(
  lancamentos: any[],
  tipoGrafico: string,
  mensagem: string
) {
  const width = 800;
  const height = 600;
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  // Preparar dados para gráfico
  const categorias = [...new Set(lancamentos.map((l) => l.categoria))];
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

  // Definir interface para o dataset
  interface Dataset {
    label?: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
  }

  // Configuração base
  const configuration: any = {
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
            "#FF6384",
            "#C9CBCF",
          ],
          borderWidth: 2,
          borderColor: "#fff",
        } as Dataset,
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Distribuição de Gastos por Categoria",
          font: { size: 18 },
        },
        legend: {
          position: "right",
        },
      },
    },
  };

  // Adaptar para gráfico de barras
  if (tipoGrafico === "barras" || mensagem.toLowerCase().includes("barras")) {
    configuration.type = "bar";
    configuration.data.datasets = [
      {
        label: "Despesas",
        data: despesasPorCategoria,
        backgroundColor: "#FF6384",
        borderWidth: 1,
      } as Dataset,
      {
        label: "Receitas",
        data: receitasPorCategoria,
        backgroundColor: "#36A2EB",
        borderWidth: 1,
      } as Dataset,
    ];
  }

  // Adaptar para gráfico de linhas
  if (tipoGrafico === "linhas" || mensagem.toLowerCase().includes("linhas")) {
    const lancamentosPorData = agruparPorData(lancamentos);
    const datas = Object.keys(lancamentosPorData);

    configuration.type = "line";
    configuration.data.labels = datas;
    configuration.data.datasets = [
      {
        label: "Despesas",
        data: datas.map((data) => lancamentosPorData[data].despesas),
        borderColor: "#FF6384",
        backgroundColor: "rgba(255, 99, 132, 0.1)",
        fill: false,
        borderWidth: 3,
        tension: 0.1,
      } as Dataset,
      {
        label: "Receitas",
        data: datas.map((data) => lancamentosPorData[data].receitas),
        borderColor: "#36A2EB",
        backgroundColor: "rgba(54, 162, 235, 0.1)",
        fill: false,
        borderWidth: 3,
        tension: 0.1,
      } as Dataset,
    ];
  }

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

function agruparPorData(lancamentos: any[]) {
  return lancamentos.reduce((acc, lancamento) => {
    const data = lancamento.data.toISOString().split("T")[0];
    if (!acc[data]) acc[data] = { receitas: 0, despesas: 0 };

    if (lancamento.tipo === "Receita") {
      acc[data].receitas += lancamento.valor;
    } else {
      acc[data].despesas += lancamento.valor;
    }

    return acc;
  }, {});
}

async function gerarAnaliseDoGrafico(
  lancamentos: any[],
  mensagem: string
): Promise<string> {
  // Calcular totais para a análise
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
