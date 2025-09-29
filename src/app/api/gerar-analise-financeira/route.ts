// app/api/gerar-analise-financeira/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { mensagemOriginal, usuarioId, dataReferencia } = await request.json();

    console.log("Dados recebidos para análise financeira:", {
      mensagemOriginal,
      usuarioId,
      dataReferencia
    });

    if (!mensagemOriginal || !usuarioId) {
      return NextResponse.json(
        { error: "mensagemOriginal e usuarioId são obrigatórios" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Anthropic API key não configurada" },
        { status: 500 }
      );
    }

    // Buscar dados do usuário no Supabase
    const usuario = await db.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        Lancamento: {
          where: {
            data: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Mês atual
            }
          },
          orderBy: { data: 'desc' }
        },
        Meta: {
          where: {
            concluida: false
          }
        },
        SaldoCompartilhado: {
          include: {
            deUsuario: {
              select: { name: true }
            },
            paraUsuario: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Preparar dados para análise
    const dadosFinanceiros = {
      lancamentos: usuario.Lancamento,
      metas: usuario.Meta,
      saldosCompartilhados: usuario.SaldoCompartilhado,
      totalReceitas: usuario.Lancamento.filter(l => l.tipo === 'Receita').reduce((sum, l) => sum + l.valor, 0),
      totalDespesas: usuario.Lancamento.filter(l => l.tipo === 'Despesa').reduce((sum, l) => sum + l.valor, 0),
      saldoAtual: usuario.Lancamento.filter(l => l.tipo === 'Receita').reduce((sum, l) => sum + l.valor, 0) - 
                 usuario.Lancamento.filter(l => l.tipo === 'Despesa').reduce((sum, l) => sum + l.valor, 0)
    };

    // Criar prompt para o Claude
    const prompt = criarPromptAnaliseFinanceira(mensagemOriginal, dadosFinanceiros);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na API Anthropic: ${response.status}`);
    }

    const data = await response.json();
    const analise = data.content[0].text;

    if (!analise) {
      throw new Error("Não foi possível gerar a análise");
    }

    return NextResponse.json({
      analise,
      dadosResumidos: {
        totalReceitas: dadosFinanceiros.totalReceitas,
        totalDespesas: dadosFinanceiros.totalDespesas,
        saldoAtual: dadosFinanceiros.saldoAtual,
        quantidadeLancamentos: dadosFinanceiros.lancamentos.length,
        quantidadeMetas: dadosFinanceiros.metas.length
      }
    });
  } catch (error) {
    console.error("Erro ao gerar análise financeira:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

function criarPromptAnaliseFinanceira(mensagemOriginal: string, dados: any): string {
  return `
Você é um assistente financeiro especializado em análise de gastos e receitas. 
Analise os dados financeiros abaixo e responda à pergunta do usuário de forma clara, objetiva e útil.

PERGUNTA DO USUÁRIO: "${mensagemOriginal}"

DADOS FINANCEIROS DO MÊS ATUAL:

RESUMO GERAL:
- Total de Receitas: R$ ${dados.totalReceitas.toFixed(2)}
- Total de Despesas: R$ ${dados.totalDespesas.toFixed(2)}
- Saldo Atual: R$ ${dados.saldoAtual.toFixed(2)}
- Quantidade de Lançamentos: ${dados.lancamentos.length}

LANÇAMENTOS RECENTES (últimos 10):
${dados.lancamentos.slice(0, 10).map((l: any) => 
  `- ${l.data.toLocaleDateString('pt-BR')} | ${l.tipo} | ${l.categoria} | R$ ${l.valor.toFixed(2)} | ${l.descricao}`
).join('\n')}

METAS EM ANDAMENTO:
${dados.metas.map((m: any) => 
  `- ${m.titulo}: R$ ${m.valorAtual.toFixed(2)} / R$ ${m.valorAlvo.toFixed(2)} (${((m.valorAtual / m.valorAlvo) * 100).toFixed(1)}%)`
).join('\n')}

SALDOS COMPARTILHADOS:
${dados.saldosCompartilhados.map((s: any) => 
  `- ${s.deUsuario.name} deve R$ ${s.valor.toFixed(2)} para ${s.paraUsuario.name}${s.pago ? ' (PAGO)' : ''}`
).join('\n')}

ANÁLISE POR CATEGORIA (Despesas):
${Object.entries(
  dados.lancamentos
    .filter((l: any) => l.tipo === 'Despesa')
    .reduce((acc: any, l: any) => {
      acc[l.categoria] = (acc[l.categoria] || 0) + l.valor;
      return acc;
    }, {})
).map(([categoria, valor]: [string, any]) => 
  `- ${categoria}: R$ ${valor.toFixed(2)}`
).join('\n')}

INSTRUÇÕES PARA SUA RESPOSTA:
1. Seja direto e claro
2. Use emojis para tornar a resposta mais amigável
3. Destaque pontos importantes
4. Se relevante, faça recomendações específicas
5. Mantenha a resposta em português brasileiro
6. Formate números como moeda (R$ X.XX)
7. Se a pergunta for sobre resumo, foque nos totais e principais categorias
8. Se for sobre gastos, detalhe as categorias
9. Se for sobre metas, mostre o progresso
10. Limite a resposta a 500-800 caracteres para WhatsApp

Responda agora à pergunta do usuário:
`;
}