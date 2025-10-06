// app/api/bicla/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { message } = await request.json();
    const usuarioId = session.user.id;

    if (!message) {
      return NextResponse.json(
        { error: "Mensagem é obrigatória" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Anthropic API key não configurada" },
        { status: 500 }
      );
    }

    // Buscar dados financeiros do usuário
    const dadosUsuario = await buscarDadosFinanceiros(usuarioId);

    // Criar prompt contextualizado
    const prompt = criarPromptFinanceiro(message, dadosUsuario);

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
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na API Anthropic: ${response.status}`);
    }

    const data = await response.json();
    const resposta = data.content[0].text;

    if (!resposta) {
      throw new Error("Não foi possível gerar a resposta");
    }

    // Calcular pontuação de saúde financeira baseada nos dados
    const pontuacao = calcularPontuacaoSaude(dadosUsuario);

    return NextResponse.json({
      resposta,
      pontuacao,
      tipo: "analysis",
    });
  } catch (error) {
    console.error("Erro no chat da Bicla:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

async function buscarDadosFinanceiros(usuarioId: string) {
  // Buscar dados dos últimos 6 meses
  const seisMesesAtras = new Date();
  seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

  const lancamentos = await db.lancamento.findMany({
    where: {
      usuarioId,
      data: {
        gte: seisMesesAtras,
      },
    },
    orderBy: {
      data: "desc",
    },
  });

  // Calcular métricas básicas
  const receitas = lancamentos.filter((l) => l.tipo === "receita");
  const despesas = lancamentos.filter((l) => l.tipo === "despesa");

  const totalReceitas = receitas.reduce((sum, l) => sum + l.valor, 0);
  const totalDespesas = despesas.reduce((sum, l) => sum + l.valor, 0);
  const saldo = totalReceitas - totalDespesas;

  return {
    lancamentos,
    totais: {
      receitas: totalReceitas,
      despesas: totalDespesas,
      saldo,
    },
    periodo: {
      inicio: seisMesesAtras,
      fim: new Date(),
    },
  };
}

function criarPromptFinanceiro(pergunta: string, dados: any) {
  return `
Você é a Bicla, uma assistente financeira inteligente e especialista em análise de dados financeiros pessoais. Seu papel é analisar os dados financeiros do usuário e fornecer insights valiosos, recomendações práticas e respostas claras.

DADOS FINANCEIROS DO USUÁRIO (últimos 6 meses):
- Receitas totais: R$ ${dados.totais.receitas.toFixed(2)}
- Despesas totais: R$ ${dados.totais.despesas.toFixed(2)}
- Saldo: R$ ${dados.totais.saldo.toFixed(2)}
- Categorias de despesas: ${JSON.stringify(dados.categorias.despesas, null, 2)}
- Metas ativas: ${dados.metas.length}

PERGUNTA DO USUÁRIO: "${pergunta}"

INSTRUÇÕES:
1. Analise os dados financeiros fornecidos
2. Responda de forma direta e útil à pergunta específica
3. Forneça insights baseados nos dados reais do usuário
4. Seja prática e sugira ações concretas
5. Use emojis moderadamente para tornar a resposta mais amigável
6. Mantenha o tom profissional mas acessível

RESPONDA EM PORTUGUÊS BRASILEIRO:
`;
}

function calcularPontuacaoSaude(dados: any) {
  const { receitas, despesas, saldo } = dados.totais;

  if (receitas === 0) return 50; // Caso não haja dados

  const taxaPoupanca = saldo / receitas;
  let pontuacao = 50;

  if (taxaPoupanca > 0.2) pontuacao += 30;
  else if (taxaPoupanca > 0.1) pontuacao += 15;
  else if (taxaPoupanca < 0) pontuacao -= 20;

  // Ajustar baseado na diversificação de gastos
  const categoriasDespesas = Object.keys(dados.categorias.despesas);
  if (categoriasDespesas.length >= 3) pontuacao += 10;

  return Math.max(0, Math.min(100, pontuacao));
}
