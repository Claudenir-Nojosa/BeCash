// app/api/bicla/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

interface GastoRecorrente {
  descricao: string;
  frequencia: number;
  valorMedio: number;
  valorTotal: number;
}

interface Lancamento {
  id: string;
  userId: string;
  descricao: string;
  valor: number;
  tipo: "RECEITA" | "DESPESA";
  data: Date;
  categoria: {
    id: string;
    nome: string;
  };
  cartao: {
    id: string;
    nome: string;
  } | null;
}

interface AnalisePeriodo {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  taxaPoupanca: number;
  categorias: Record<string, { total: number; count: number; media: number }>;
  gastosPorMes: Record<string, number>;
  mediaMensal: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { message, language = "pt" } = await request.json();
    const usuarioId = session.user.id;

    if (!message) {
      return NextResponse.json(
        { error: "Mensagem é obrigatória" },
        { status: 400 },
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Anthropic API key não configurada" },
        { status: 500 },
      );
    }

    // Buscar dados financeiros completos do usuário
    const dadosUsuario = await buscarDadosFinanceirosCompletos(usuarioId);

    // Criar prompt contextualizado premium
    const prompt = criarPromptFinanceiroPremium(
      message,
      dadosUsuario,
      language,
    );

    // Chamar Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000, // Aumentado para respostas mais completas
        temperature: 0.7, // Mais criativo mas ainda preciso
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro da API Anthropic:", errorText);
      throw new Error(`Erro na API Anthropic: ${response.status}`);
    }

    const data = await response.json();
    const resposta = data.content[0].text;

    if (!resposta) {
      throw new Error("Não foi possível gerar a resposta");
    }

    // Calcular métricas avançadas
    const metricas = calcularMetricasAvancadas(dadosUsuario, language);

    return NextResponse.json({
      resposta,
      metricas,
      tipo: "analysis",
    });
  } catch (error) {
    console.error("Erro no chat da Bicla:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

async function buscarDadosFinanceirosCompletos(userId: string) {
  // Buscar dados dos últimos 12 meses para análise mais robusta
  const dozesMesesAtras = new Date();
  dozesMesesAtras.setMonth(dozesMesesAtras.getMonth() - 12);

  const seisMesesAtras = new Date();
  seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

  const tresMesesAtras = new Date();
  tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);

  // Buscar lançamentos com todas as informações
  const lancamentos = (await db.lancamento.findMany({
    where: {
      userId,
      data: {
        gte: dozesMesesAtras,
      },
    },
    include: {
      categoria: true,
      cartao: true,
    },
    orderBy: {
      data: "desc",
    },
  })) as Lancamento[];

  // Buscar metas com progresso
  const metas = await db.metaPessoal.findMany({
    where: {
      userId,
    },
    include: {
      ContribuicaoMeta: {
        orderBy: {
          dataContribuicao: "desc",
        },
      },
    },
  });

  // Buscar limites de categoria
  const limites = await db.limiteCategoria.findMany({
    where: {
      userId,
    },
    include: {
      categoria: true,
    },
  });

  // Buscar cartões e faturas
  const cartoes = await db.cartao.findMany({
    where: {
      userId,
    },
    include: {
      Fatura: {
        where: {
          mesReferencia: {
            gte: new Date().toISOString().slice(0, 7), // Últimos meses
          },
        },
        include: {
          lancamentos: true,
        },
      },
    },
  });

  // Análise temporal - últimos 12, 6 e 3 meses
  const analiseDozesMeses = analisarPeriodo(lancamentos, dozesMesesAtras);
  const analiseSeisMeses = analisarPeriodo(lancamentos, seisMesesAtras);
  const analiseTresMeses = analisarPeriodo(lancamentos, tresMesesAtras);

  // Calcular tendências
  const tendencias = calcularTendencias(
    analiseDozesMeses,
    analiseSeisMeses,
    analiseTresMeses,
  );

  // Análise de padrões de gastos
  const padroes = analisarPadroes(lancamentos);

  // Análise de metas
  const analiseMetas = analisarMetas(metas);

  // Análise de dívidas e faturas
  const analiseDividas = analisarDividas(cartoes);

  return {
    lancamentos,
    metas,
    limites,
    cartoes,
    analise: {
      dozesMeses: analiseDozesMeses,
      seisMeses: analiseSeisMeses,
      tresMeses: analiseTresMeses,
    },
    tendencias,
    padroes,
    analiseMetas,
    analiseDividas,
    periodo: {
      inicio: dozesMesesAtras,
      fim: new Date(),
    },
  };
}

function analisarPeriodo(
  lancamentos: Lancamento[],
  dataInicio: Date,
): AnalisePeriodo {
  const lancamentosPeriodo = lancamentos.filter(
    (l) => new Date(l.data) >= dataInicio,
  );

  const receitas = lancamentosPeriodo.filter((l) => l.tipo === "RECEITA");
  const despesas = lancamentosPeriodo.filter((l) => l.tipo === "DESPESA");

  const totalReceitas = receitas.reduce((sum, l) => sum + l.valor, 0);
  const totalDespesas = despesas.reduce((sum, l) => sum + l.valor, 0);
  const saldo = totalReceitas - totalDespesas;

  // Agrupar por categoria
  const categoriasDespesas = despesas.reduce(
    (acc, l) => {
      const categoria = l.categoria.nome;
      if (!acc[categoria]) {
        acc[categoria] = { total: 0, count: 0, media: 0 };
      }
      acc[categoria].total += l.valor;
      acc[categoria].count += 1;
      acc[categoria].media = acc[categoria].total / acc[categoria].count;
      return acc;
    },
    {} as Record<string, { total: number; count: number; media: number }>,
  );

  // Agrupar por mês - CORREÇÃO AQUI
  const gastosPorMes: Record<string, number> = {};

  despesas.forEach((l) => {
    const mes = new Date(l.data).toISOString().slice(0, 7);
    if (!gastosPorMes[mes]) {
      gastosPorMes[mes] = 0;
    }
    gastosPorMes[mes] += l.valor;
  });

  const mesesComDados = Object.keys(gastosPorMes).length;
  const mediaMensal =
    mesesComDados > 0
      ? Object.values(gastosPorMes).reduce((a, b) => a + b, 0) / mesesComDados
      : 0;

  return {
    totalReceitas,
    totalDespesas,
    saldo,
    taxaPoupanca: totalReceitas > 0 ? (saldo / totalReceitas) * 100 : 0,
    categorias: categoriasDespesas,
    gastosPorMes,
    mediaMensal,
  };
}

function calcularTendencias(doze: any, seis: any, tres: any) {
  return {
    despesas: {
      variacao12para6: calcularVariacaoPercentual(
        doze.mediaMensal,
        seis.mediaMensal,
      ),
      variacao6para3: calcularVariacaoPercentual(
        seis.mediaMensal,
        tres.mediaMensal,
      ),
      tendencia: classificarTendencia(
        doze.mediaMensal,
        seis.mediaMensal,
        tres.mediaMensal,
      ),
    },
    poupanca: {
      taxa12meses: doze.taxaPoupanca,
      taxa6meses: seis.taxaPoupanca,
      taxa3meses: tres.taxaPoupanca,
      tendencia: classificarTendencia(
        doze.taxaPoupanca,
        seis.taxaPoupanca,
        tres.taxaPoupanca,
      ),
    },
  };
}

function calcularVariacaoPercentual(valorAntigo: number, valorNovo: number) {
  if (valorAntigo === 0) return 0;
  return ((valorNovo - valorAntigo) / valorAntigo) * 100;
}

function classificarTendencia(v12: number, v6: number, v3: number) {
  if (v3 > v6 && v6 > v12) return "CRESCENTE";
  if (v3 < v6 && v6 < v12) return "DECRESCENTE";
  return "ESTÁVEL";
}

function analisarPadroes(lancamentos: Lancamento[]) {
  // Detectar gastos recorrentes
  const descricoes = lancamentos.reduce(
    (acc, l) => {
      const desc = l.descricao.toLowerCase().trim();
      if (!acc[desc]) acc[desc] = [];
      acc[desc].push(l);
      return acc;
    },
    {} as Record<string, Lancamento[]>,
  );

  const gastosRecorrentes = Object.entries(descricoes)
    .filter(([_, lancamentosArray]) => lancamentosArray.length >= 3)
    .map(([descricao, lancamentosArray]) => ({
      descricao,
      frequencia: lancamentosArray.length,
      valorMedio:
        lancamentosArray.reduce((sum, l) => sum + l.valor, 0) /
        lancamentosArray.length,
      valorTotal: lancamentosArray.reduce((sum, l) => sum + l.valor, 0),
    }))
    .sort((a, b) => b.valorTotal - a.valorTotal);

  // Detectar gastos incomuns (outliers)
  const despesas = lancamentos.filter((l) => l.tipo === "DESPESA");
  const mediaDespesas =
    despesas.reduce((sum, l) => sum + l.valor, 0) / despesas.length;
  const despesasIncomuns = despesas
    .filter((l) => l.valor > mediaDespesas * 2)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

  // Analisar horários de gastos (dia da semana, hora)
  const gastoPorDiaSemana = despesas.reduce(
    (acc, l) => {
      const diaSemana = new Date(l.data).getDay();
      if (!acc[diaSemana]) acc[diaSemana] = 0;
      acc[diaSemana] += l.valor;
      return acc;
    },
    {} as Record<number, number>,
  );

  return {
    gastosRecorrentes,
    despesasIncomuns,
    gastoPorDiaSemana,
  };
}

function analisarMetas(metas: any[]) {
  const metasAtivas = metas.filter((m) => new Date(m.dataAlvo) > new Date());
  const metasVencidas = metas.filter((m) => new Date(m.dataAlvo) <= new Date());

  const analise = metasAtivas.map((meta) => {
    const progresso = (meta.valorAtual / meta.valorAlvo) * 100;
    const diasRestantes = Math.ceil(
      (new Date(meta.dataAlvo).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const valorFaltante = meta.valorAlvo - meta.valorAtual;
    const economiaDiariaNecessaria =
      diasRestantes > 0 ? valorFaltante / diasRestantes : 0; // 👈 CORREÇÃO DO NOME

    return {
      titulo: meta.titulo,
      progresso,
      diasRestantes,
      valorFaltante,
      economiaDiariaNecessaria, // 👈 NOME CORRETO
      status:
        progresso >= 100
          ? "CONCLUÍDA"
          : progresso >= 75
            ? "BOM_ANDAMENTO"
            : progresso >= 50
              ? "ATENÇÃO"
              : "CRÍTICO",
    };
  });

  return {
    total: metas.length,
    ativas: metasAtivas.length,
    vencidas: metasVencidas.length,
    analise,
  };
}

function analisarDividas(cartoes: any[]) {
  const faturasAbertas = cartoes.flatMap((c) =>
    c.Fatura.filter((f: any) => f.status === "ABERTA"),
  );

  const totalDividas = faturasAbertas.reduce(
    (sum, f) => sum + (f.valorTotal - f.valorPago),
    0,
  );

  const detalhes = faturasAbertas.map((f: any) => ({
    cartao: cartoes.find((c) => c.id === f.cartaoId)?.nome,
    valor: f.valorTotal - f.valorPago,
    vencimento: f.dataVencimento,
    diasAteVencimento: Math.ceil(
      (new Date(f.dataVencimento).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  }));

  return {
    totalDividas,
    quantidadeFaturas: faturasAbertas.length,
    detalhes: detalhes.sort(
      (a, b) => a.diasAteVencimento - b.diasAteVencimento,
    ),
  };
}

function criarPromptFinanceiroPremium(
  pergunta: string,
  dados: any,
  language: string = "pt",
) {
  const { analise, tendencias, padroes, analiseMetas, analiseDividas } = dados;

  // Textos traduzidos
  const translations = {
    pt: {
      title: "ANÁLISE FINANCEIRA COMPLETA DO USUÁRIO",
      overview: "VISÃO GERAL (12 MESES)",
      revenues: "Receitas",
      expenses: "Despesas",
      balance: "Saldo",
      savingsRate: "Taxa de Poupança",
      monthlyAvg: "Média Mensal de Gastos",
      trends: "TENDÊNCIAS IDENTIFICADAS",
      lastMonths: "últimos 6→3 meses",
      patterns: "PADRÕES DE COMPORTAMENTO",
      recurring: "Gastos Recorrentes Identificados",
      topRecurring: "Top 3 Gastos Recorrentes",
      unusual: "Despesas Incomuns Detectadas",
      largestUnusual: "Maior despesa incomum",
      mainCategories: "CATEGORIAS PRINCIPAIS",
      goals: "METAS FINANCEIRAS",
      totalGoals: "Total de Metas",
      activeGoals: "Metas Ativas",
      goalsStatus: "Status das Metas",
      daysLeft: "Faltam",
      days: "dias",
      debts: "DÍVIDAS E COMPROMISSOS",
      totalDebts: "Dívidas Totais em Aberto",
      pendingInvoices: "Faturas Pendentes",
      nextDue: "Próximo Vencimento",
      userQuestion: "PERGUNTA DO USUÁRIO",
      instructions: "INSTRUÇÕES PARA RESPOSTA DE ELITE",
      responseStructure: "ESTRUTURA DA RESPOSTA",
      directAnswer: "Resposta Direta",
      dataInsights: "Insights Baseados nos Seus Dados",
      importantAlerts: "Alertas Importantes",
      recommendations: "Recomendações Prioritárias",
      nextSteps: "Próximos Passos",
      differentials: "DIFERENCIAIS DA SUA RESPOSTA",
      respondIn: "RESPONDA EM PORTUGUÊS BRASILEIRO",
    },
    en: {
      title: "COMPLETE FINANCIAL ANALYSIS",
      overview: "OVERVIEW (12 MONTHS)",
      revenues: "Revenues",
      expenses: "Expenses",
      balance: "Balance",
      savingsRate: "Savings Rate",
      monthlyAvg: "Monthly Average Spending",
      trends: "IDENTIFIED TRENDS",
      lastMonths: "last 6→3 months",
      patterns: "BEHAVIOR PATTERNS",
      recurring: "Recurring Expenses Identified",
      topRecurring: "Top 3 Recurring Expenses",
      unusual: "Unusual Expenses Detected",
      largestUnusual: "Largest unusual expense",
      mainCategories: "MAIN CATEGORIES",
      goals: "FINANCIAL GOALS",
      totalGoals: "Total Goals",
      activeGoals: "Active Goals",
      goalsStatus: "Goals Status",
      daysLeft: "Days left",
      days: "days",
      debts: "DEBTS AND COMMITMENTS",
      totalDebts: "Total Outstanding Debts",
      pendingInvoices: "Pending Invoices",
      nextDue: "Next Due",
      userQuestion: "USER QUESTION",
      instructions: "ELITE RESPONSE INSTRUCTIONS",
      responseStructure: "RESPONSE STRUCTURE",
      directAnswer: "Direct Answer",
      dataInsights: "Insights Based on Your Data",
      importantAlerts: "Important Alerts",
      recommendations: "Priority Recommendations",
      nextSteps: "Next Steps",
      differentials: "RESPONSE DIFFERENTIALS",
      respondIn: "RESPOND IN ENGLISH",
    },
  };

  const t =
    translations[language as keyof typeof translations] || translations.pt;
  const topRecorrentes = padroes.gastosRecorrentes
    .slice(0, 3)
    .map(
      (g: GastoRecorrente, i: number) =>
        `  ${i + 1}. ${g.descricao}: R$ ${g.valorMedio.toFixed(2)}/${language === "pt" ? "mês" : "month"} (${g.frequencia}x)`,
    )
    .join("\n");

  return `
You are Bicla, an elite financial assistant with expertise in personal financial analysis, wealth planning, and investment consulting. You are known for providing deep, actionable, and personalized insights that transform people's financial lives.

📊 ${t.title}:

## ${t.overview}:
- ${t.revenues}: R$ ${analise.dozesMeses.totalReceitas.toFixed(2)}
- ${t.expenses}: R$ ${analise.dozesMeses.totalDespesas.toFixed(2)}
- ${t.balance}: R$ ${analise.dozesMeses.saldo.toFixed(2)}
- ${t.savingsRate}: ${analise.dozesMeses.taxaPoupanca.toFixed(1)}%
- ${t.monthlyAvg}: R$ ${analise.dozesMeses.mediaMensal.toFixed(2)}

## ${t.trends}:
- ${t.expenses} (${t.lastMonths}): ${tendencias.despesas.tendencia} (${tendencias.despesas.variacao6para3 > 0 ? "+" : ""}${tendencias.despesas.variacao6para3.toFixed(1)}%)
- ${t.savingsRate}: ${tendencias.poupanca.tendencia}
  * 12 ${language === "pt" ? "meses" : "months"}: ${tendencias.poupanca.taxa12meses.toFixed(1)}%
  * 6 ${language === "pt" ? "meses" : "months"}: ${tendencias.poupanca.taxa6meses.toFixed(1)}%
  * 3 ${language === "pt" ? "meses" : "months"}: ${tendencias.poupanca.taxa3meses.toFixed(1)}%

## ${t.patterns}:
- ${t.recurring}: ${padroes.gastosRecorrentes.length}
- ${t.topRecurring}:
${topRecorrentes}

- ${t.unusual}: ${padroes.despesasIncomuns.length}
${padroes.despesasIncomuns.length > 0 ? `- ${t.largestUnusual}: R$ ${padroes.despesasIncomuns[0].valor.toFixed(2)} ${language === "pt" ? "em" : "in"} ${padroes.despesasIncomuns[0].descricao}` : ""}

## ${t.mainCategories}:
${Object.entries(analise.dozesMeses.categorias)
  .sort(([, a]: [string, any], [, b]: [string, any]) => b.total - a.total)
  .slice(0, 5)
  .map(
    ([cat, dados]: [string, any], i: number) =>
      `${i + 1}. ${cat}: R$ ${dados.total.toFixed(2)} (${((dados.total / analise.dozesMeses.totalDespesas) * 100).toFixed(1)}%)`,
  )
  .join("\n")}

## ${t.goals}:
- ${t.totalGoals}: ${analiseMetas.total}
- ${t.activeGoals}: ${analiseMetas.ativas}
- ${t.goalsStatus}:
${analiseMetas.analise.map((m: any) => `  - ${m.titulo}: ${m.progresso.toFixed(1)}% (${m.status}) - ${t.daysLeft} ${m.diasRestantes} ${t.days}`).join("\n")}

## ${t.debts}:
- ${t.totalDebts}: R$ ${analiseDividas.totalDividas.toFixed(2)}
- ${t.pendingInvoices}: ${analiseDividas.quantidadeFaturas}
${analiseDividas.detalhes.length > 0 ? `- ${t.nextDue}: ${analiseDividas.detalhes[0].cartao} - R$ ${analiseDividas.detalhes[0].valor.toFixed(2)} ${language === "pt" ? "em" : "in"} ${analiseDividas.detalhes[0].diasAteVencimento} ${t.days}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 ${t.userQuestion}: "${pergunta}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 ${t.instructions}:

1. **${language === "pt" ? "ANÁLISE PROFUNDA" : "DEEP ANALYSIS"}**: ${language === "pt" ? "Use TODOS os dados fornecidos para dar uma resposta contextualizada e baseada em evidências reais" : "Use ALL provided data to give a contextualized response based on real evidence"}
2. **${language === "pt" ? "INSIGHTS ACIONÁVEIS" : "ACTIONABLE INSIGHTS"}**: ${language === "pt" ? "Forneça recomendações específicas, não genéricas. Cite números, percentuais e valores exatos" : "Provide specific recommendations, not generic ones. Cite exact numbers, percentages, and values"}
3. **${language === "pt" ? "PRIORIZAÇÃO" : "PRIORITIZATION"}**: ${language === "pt" ? "Identifique as 3 ações mais impactantes que o usuário pode tomar AGORA" : "Identify the 3 most impactful actions the user can take NOW"}
4. **${language === "pt" ? "COMPARAÇÕES" : "COMPARISONS"}**: ${language === "pt" ? "Compare o desempenho do usuário com benchmarks (ex: taxa de poupança ideal de 20-30%)" : "Compare user performance with benchmarks (e.g., ideal savings rate of 20-30%)"}
5. **${language === "pt" ? "TENDÊNCIAS" : "TRENDS"}**: ${language === "pt" ? "Destaque padrões preocupantes ou positivos observados nos dados" : "Highlight concerning or positive patterns observed in the data"}
6. **${language === "pt" ? "METAS" : "GOALS"}**: ${language === "pt" ? "Relacione suas recomendações com as metas existentes do usuário" : "Relate your recommendations to the user's existing goals"}
7. **${language === "pt" ? "ALERTAS" : "ALERTS"}**: ${language === "pt" ? "Identifique riscos financeiros iminentes (vencimentos, gastos crescentes, etc.)" : "Identify imminent financial risks (due dates, increasing expenses, etc.)"}
8. **${language === "pt" ? "OPORTUNIDADES" : "OPPORTUNITIES"}**: ${language === "pt" ? "Aponte áreas onde o usuário pode economizar ou otimizar" : "Point out areas where the user can save or optimize"}

📋 ${t.responseStructure}:

## 🎯 ${t.directAnswer}
[${language === "pt" ? "Responda a pergunta de forma clara e objetiva" : "Answer the question clearly and objectively"}]

## 📊 ${t.dataInsights}
[${language === "pt" ? "2-3 insights específicos extraídos dos dados reais do usuário" : "2-3 specific insights extracted from the user's real data"}]

## ⚠️ ${t.importantAlerts}
[${language === "pt" ? "Se houver algo crítico que precise de atenção imediata" : "If there's anything critical that needs immediate attention"}]

## 💡 ${t.recommendations}
1. [${language === "pt" ? "Ação específica com impacto estimado" : "Specific action with estimated impact"}]
2. [${language === "pt" ? "Ação específica com impacto estimado" : "Specific action with estimated impact"}]
3. [${language === "pt" ? "Ação específica com impacto estimado" : "Specific action with estimated impact"}]

## 🚀 ${t.nextSteps}
[${language === "pt" ? "Plano de ação concreto e temporal" : "Concrete and temporal action plan"}]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💎 ${t.differentials}:
- ${language === "pt" ? "Use dados REAIS do usuário, cite valores específicos" : "Use user's REAL data, cite specific values"}
- ${language === "pt" ? "Compare com períodos anteriores para mostrar evolução" : "Compare with previous periods to show evolution"}
- ${language === "pt" ? "Calcule potenciais economias ou ganhos" : "Calculate potential savings or gains"}
- ${language === "pt" ? "Seja honesto sobre desafios mas sempre otimista e solucionador" : "Be honest about challenges but always optimistic and solution-oriented"}
- ${language === "pt" ? "Use emojis estrategicamente para destacar pontos importantes" : "Use emojis strategically to highlight important points"}
- ${language === "pt" ? "Formate com markdown para máxima legibilidade" : "Format with markdown for maximum readability"}

${t.respondIn} ${language === "pt" ? "de forma profissional, empática e empoderadora" : "in a professional, empathetic and empowering way"}:
`;
}

function calcularMetricasAvancadas(dados: any, language: string = "pt") {
  const { analise, tendencias, padroes, analiseMetas, analiseDividas } = dados;

  // Calcular score de saúde financeira (0-100)
  let scoreTotal = 50;

  const taxaPoupanca = analise.tresMeses.taxaPoupanca;
  if (taxaPoupanca >= 30) scoreTotal += 30;
  else if (taxaPoupanca >= 20) scoreTotal += 20;
  else if (taxaPoupanca >= 10) scoreTotal += 10;
  else if (taxaPoupanca < 0) scoreTotal -= 20;

  if (tendencias.despesas.tendencia === "DECRESCENTE") scoreTotal += 20;
  else if (tendencias.despesas.tendencia === "ESTÁVEL") scoreTotal += 10;
  else scoreTotal -= 10;

  const metasEmBomAndamento = analiseMetas.analise.filter(
    (m: any) => m.status === "BOM_ANDAMENTO" || m.status === "CONCLUÍDA",
  ).length;
  scoreTotal += Math.min(15, metasEmBomAndamento * 5);

  if (analiseDividas.totalDividas === 0) scoreTotal += 15;
  else if (analiseDividas.totalDividas < analise.tresMeses.totalReceitas * 0.3)
    scoreTotal += 10;
  else scoreTotal -= 10;

  scoreTotal = Math.max(0, Math.min(100, scoreTotal));

  const categorias = {
    pt: {
      excelente: "Excelente",
      boa: "Boa",
      regular: "Regular",
      precisaAtencao: "Precisa Atenção",
    },
    en: {
      excelente: "Excellent",
      boa: "Good",
      regular: "Fair",
      precisaAtencao: "Needs Attention",
    },
  };

  const t = categorias[language as keyof typeof categorias] || categorias.pt;

  return {
    scoreGeral: Math.round(scoreTotal),
    categoria:
      scoreTotal >= 80
        ? t.excelente
        : scoreTotal >= 60
          ? t.boa
          : scoreTotal >= 40
            ? t.regular
            : t.precisaAtencao,
    detalhes: {
      taxaPoupanca: analise.tresMeses.taxaPoupanca.toFixed(1),
      tendenciaDespesas: tendencias.despesas.tendencia,
      metasProgresso: analiseMetas.ativas,
      dividas: analiseDividas.totalDividas.toFixed(2),
    },
  };
}
