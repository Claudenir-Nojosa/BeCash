// app/api/gerar-grafico-financeiro/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// 🔎 Função para extrair "mês de ano" do texto
function extrairDataReferencia(mensagem: string): Date | null {
  const meses: Record<string, number> = {
    janeiro: 0,
    fevereiro: 1,
    março: 2,
    abril: 3,
    maio: 4,
    junho: 5,
    julho: 6,
    agosto: 7,
    setembro: 8,
    outubro: 9,
    novembro: 10,
    dezembro: 11,
  };

  const regex =
    /(?:de\s)?(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+(?:de\s+)?(\d{4})/i;

  const match = mensagem.match(regex);

  if (match) {
    const mes = meses[match[1].toLowerCase()];
    const ano = parseInt(match[2], 10);
    return new Date(ano, mes, 1);
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { mensagemOriginal, usuarioId, tipoGrafico, dataReferencia } =
      await request.json();

    // 🔎 Primeiro tenta extrair a data da mensagem
    let base = extrairDataReferencia(mensagemOriginal);

    // 🔎 Se não achar, usa dataReferencia enviada ou data atual
    if (!base) {
      base = dataReferencia ? new Date(dataReferencia) : new Date();
    }

    const inicioDoMes = new Date(base.getFullYear(), base.getMonth(), 1);
    const fimDoMes = new Date(
      base.getFullYear(),
      base.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    console.log("Dados recebidos para gráfico financeiro:", {
      mensagemOriginal,
      usuarioId,
      tipoGrafico,
      inicioDoMes,
      fimDoMes,
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

    const usuario = await db.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        Lancamento: {
          where: {
            data: {
              gte: inicioDoMes,
              lte: fimDoMes,
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
            deUsuario: { select: { name: true } },
            paraUsuario: { select: { name: true } },
          },
        },
        saldosComoCredor: {
          include: {
            deUsuario: { select: { name: true } },
            paraUsuario: { select: { name: true } },
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
      ...usuario.saldosComoDevedor.map((s) => ({ ...s, tipo: "devedor" })),
      ...usuario.saldosComoCredor.map((s) => ({ ...s, tipo: "credor" })),
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

INSTRUÇÕES CRÍTICAS PARA SUA RESPOSTA:

1. NUNCA use asteriscos (*) para formatação ou negrito
2. Use apenas emojis para destacar seções importantes
3. Formate com quebras de linha limpas e espaçamento adequado
4. Seja direto e objetivo na análise
5. Use números formatados como R$ X.XX
6. Limite a resposta a 1000-1500 caracteres
7. Comece com um título simples com emoji
8. Use apenas traços (-) para listas quando necessário
9. Mantenha o português claro e natural
10. Foque na solicitação específica: "${mensagemOriginal}"

Gere uma análise perspicaz que complementará visualmente o gráfico ${tipoGrafico} que será mostrado.`;
}
