// app/api/gerar-grafico-financeiro/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { mensagemOriginal, usuarioId, tipoGrafico } = await request.json();

    console.log("Dados recebidos para gráfico financeiro:", {
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
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
          orderBy: { data: "desc" },
        },
        Meta: {
          where: {
            concluida: false,
          },
        },
        saldosComoDevedor: {
          include: {
            deUsuario: {
              select: { name: true },
            },
            paraUsuario: {
              select: { name: true },
            },
          },
        },
        saldosComoCredor: {
          include: {
            deUsuario: {
              select: { name: true },
            },
            paraUsuario: {
              select: { name: true },
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

    // Juntar todos os saldos compartilhados
    const todosSaldosCompartilhados = [
      ...usuario.saldosComoDevedor.map((s) => ({
        ...s,
        tipo: "devedor",
      })),
      ...usuario.saldosComoCredor.map((s) => ({
        ...s,
        tipo: "credor",
      })),
    ];

    // Preparar dados para análise
    const dadosFinanceiros = {
      lancamentos: usuario.Lancamento,
      metas: usuario.Meta,
      saldosCompartilhados: todosSaldosCompartilhados,
      totalReceitas: usuario.Lancamento.filter(
        (l) => l.tipo === "Receita"
      ).reduce((sum, l) => sum + l.valor, 0),
      totalDespesas: usuario.Lancamento.filter(
        (l) => l.tipo === "Despesa"
      ).reduce((sum, l) => sum + l.valor, 0),
      saldoAtual:
        usuario.Lancamento.filter((l) => l.tipo === "Receita").reduce(
          (sum, l) => sum + l.valor,
          0
        ) -
        usuario.Lancamento.filter((l) => l.tipo === "Despesa").reduce(
          (sum, l) => sum + l.valor,
          0
        ),
    };

    // Criar prompt para o Claude ESPECÍFICO para gráficos
    const prompt = criarPromptGraficoFinanceiro(
      mensagemOriginal,
      dadosFinanceiros,
      tipoGrafico
    );

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
    const analise = data.content[0].text;

    if (!analise) {
      throw new Error("Não foi possível gerar a análise");
    }

    // Retornar análise do Claude + lançamentos + mensagemOriginal
    return NextResponse.json({
      analise: analise,
      lancamentos: usuario.Lancamento,
      tipoGrafico: tipoGrafico || "pizza",
      mensagemOriginal: mensagemOriginal,
      success: true,
      dadosResumidos: {
        totalReceitas: dadosFinanceiros.totalReceitas,
        totalDespesas: dadosFinanceiros.totalDespesas,
        saldoAtual: dadosFinanceiros.saldoAtual,
        quantidadeLancamentos: dadosFinanceiros.lancamentos.length,
        quantidadeMetas: dadosFinanceiros.metas.length,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar gráfico financeiro:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

function criarPromptGraficoFinanceiro(
  mensagemOriginal: string,
  dados: any,
  tipoGrafico: string = "pizza"
): string {
  // Formatar saldos para exibição
  const saldosFormatados = dados.saldosCompartilhados.map((s: any) => {
    if (s.tipo === "devedor") {
      return `➡️ Você deve R$ ${s.valor.toFixed(2)} para ${s.paraUsuario.name}${s.pago ? " ✅ PAGO" : ""}`;
    } else {
      return `⬅️ ${s.deUsuario.name} deve R$ ${s.valor.toFixed(2)} para você${s.pago ? " ✅ PAGO" : ""}`;
    }
  });

  // Calcular gastos por categoria
  const gastosPorCategoria = dados.lancamentos
    .filter((l: any) => l.tipo === "Despesa")
    .reduce((acc: any, l: any) => {
      acc[l.categoria] = (acc[l.categoria] || 0) + l.valor;
      return acc;
    }, {});

  const receitasPorCategoria = dados.lancamentos
    .filter((l: any) => l.tipo === "Receita")
    .reduce((acc: any, l: any) => {
      acc[l.categoria] = (acc[l.categoria] || 0) + l.valor;
      return acc;
    }, {});

  return `O usuário solicitou: "${mensagemOriginal}"

O sistema irá gerar um gráfico do tipo: ${tipoGrafico}

ANÁLISE DOS DADOS FINANCEIROS:

RESUMO GERAL:
- Receitas: R$ ${dados.totalReceitas.toFixed(2)}
- Despesas: R$ ${dados.totalDespesas.toFixed(2)}
- Saldo: R$ ${dados.saldoAtual.toFixed(2)}
- Total de lançamentos: ${dados.lancamentos.length}

ÚLTIMOS LANÇAMENTOS (mês atual):
${dados.lancamentos
  .slice(0, 10)
  .map(
    (l: any) =>
      `📅 ${new Date(l.data).toLocaleDateString("pt-BR")} | ${l.tipo === "Receita" ? "💚" : "💸"} ${l.categoria} | R$ ${l.valor.toFixed(2)} | ${l.descricao}`
  )
  .join("\n")}

METAS EM ANDAMENTO:
${
  dados.metas.length > 0
    ? dados.metas
        .map(
          (m: any) =>
            `🎯 ${m.titulo}: R$ ${m.valorAtual.toFixed(2)} / R$ ${m.valorAlvo.toFixed(2)} (${((m.valorAtual / m.valorAlvo) * 100).toFixed(1)}%)`
        )
        .join("\n")
    : "📝 Nenhuma meta ativa no momento"
}

SALDOS COMPARTILHADOS:
${saldosFormatados.length > 0 ? saldosFormatados.join("\n") : "✅ Nenhum saldo pendente"}

DISTRIBUIÇÃO DE GASTOS POR CATEGORIA:
${Object.entries(gastosPorCategoria)
  .map(
    ([categoria, valor]: [string, any]) =>
      `📊 ${categoria}: R$ ${valor.toFixed(2)}`
  )
  .join("\n")}

DISTRIBUIÇÃO DE RECEITAS POR CATEGORIA:
${Object.entries(receitasPorCategoria)
  .map(
    ([categoria, valor]: [string, any]) =>
      `💚 ${categoria}: R$ ${valor.toFixed(2)}`
  )
  .join("\n")}

INSTRUÇÕES PARA SUA RESPOSTA:

1. FOCO NA SOLICITAÇÃO: "${mensagemOriginal}" - analise especificamente o que o usuário pediu
2. CONTEXTO DO GRÁFICO: Um gráfico ${tipoGrafico} será gerado com estes dados
3. DESTAQUE PADRÕES: Identifique tendências, categorias problemáticas, oportunidades
4. LINGUAGEM NATURAL: Seja direto, claro e use emojis para tornar visual
5. FORMATAÇÃO: Use quebras de linha, mas SEM asteriscos ou markdown complexo
6. TAMANHO: Limite a resposta a 1000-1500 caracteres
7. PERSONALIZAÇÃO: Relacione com os dados específicos do usuário

Gere uma análise perspicaz que complementará visualmente o gráfico que será mostrado.`;
}
