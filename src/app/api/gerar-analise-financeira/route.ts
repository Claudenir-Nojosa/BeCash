// app/api/gerar-analise-financeira/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { mensagemOriginal, usuarioId, dataReferencia } =
      await request.json();

    console.log("Dados recebidos para análise financeira:", {
      mensagemOriginal,
      usuarioId,
      dataReferencia,
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

    // Definir intervalo de início e fim do mês com base na dataReferencia (ou mês atual se não enviada)
    const base = dataReferencia
      ? new Date(dataReferencia)
      : new Date(
          new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
        );

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

    // Buscar dados do usuário no Supabase usando os nomes CORRETOS em PascalCase
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
          where: { concluida: false },
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
      lancamentos: usuario.Lancamento, // PascalCase
      metas: usuario.Meta, // PascalCase
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

    // Criar prompt para o Claude
    const prompt = criarPromptAnaliseFinanceira(
      mensagemOriginal,
      dadosFinanceiros
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

    return NextResponse.json({
      analise,
      dadosResumidos: {
        totalReceitas: dadosFinanceiros.totalReceitas,
        totalDespesas: dadosFinanceiros.totalDespesas,
        saldoAtual: dadosFinanceiros.saldoAtual,
        quantidadeLancamentos: dadosFinanceiros.lancamentos.length,
        quantidadeMetas: dadosFinanceiros.metas.length,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar análise financeira:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

function criarPromptAnaliseFinanceira(
  mensagemOriginal: string,
  dados: any
): string {
  // Formatar saldos para exibição
  const saldosFormatados = dados.saldosCompartilhados.map((s: any) => {
    if (s.tipo === "devedor") {
      return `➡️ Você deve R$ ${s.valor.toFixed(2)} para ${s.paraUsuario.name}${s.pago ? " ✅ PAGO" : ""}`;
    } else {
      return `⬅️ ${s.deUsuario.name} deve R$ ${s.valor.toFixed(2)} para você${s.pago ? " ✅ PAGO" : ""}`;
    }
  });

  return `Analise estes dados financeiros e responda à pergunta: "${mensagemOriginal}"

DADOS FINANCEIROS:

RESUMO:
- Receitas: R$ ${dados.totalReceitas.toFixed(2)}
- Despesas: R$ ${dados.totalDespesas.toFixed(2)}
- Saldo: R$ ${dados.saldoAtual.toFixed(2)}
- Lançamentos: ${dados.lancamentos.length}

ÚLTIMOS LANÇAMENTOS:
${dados.lancamentos
  .slice(0, 8)
  .map(
    (l: any) =>
      `📅 ${l.data.toLocaleDateString("pt-BR")} | ${l.tipo === "Receita" ? "💚" : "💸"} ${l.categoria} | R$ ${l.valor.toFixed(2)} | ${l.descricao}`
  )
  .join("\n")}

METAS:
${
  dados.metas.length > 0
    ? dados.metas
        .map(
          (m: any) =>
            `🎯 ${m.titulo}: R$ ${m.valorAtual.toFixed(2)} / R$ ${m.valorAlvo.toFixed(2)} (${((m.valorAtual / m.valorAlvo) * 100).toFixed(1)}%)`
        )
        .join("\n")
    : "📝 Nenhuma meta ativa"
}

SALDOS:
${saldosFormatados.length > 0 ? saldosFormatados.join("\n") : "✅ Nenhum saldo pendente"}

GASTOS POR CATEGORIA:
${Object.entries(
  dados.lancamentos
    .filter((l: any) => l.tipo === "Despesa")
    .reduce((acc: any, l: any) => {
      acc[l.categoria] = (acc[l.categoria] || 0) + l.valor;
      return acc;
    }, {})
)
  .map(
    ([categoria, valor]: [string, any]) =>
      `📊 ${categoria}: R$ ${valor.toFixed(2)}`
  )
  .join("\n")}

INSTRUÇÕES CRÍTICAS PARA SUA RESPOSTA:
1. NUNCA use asteriscos (*) para formatação
2. Use apenas emojis para destacar seções
3. Formate com quebras de linha limpas
4. Seja direto e objetivo
5. Use números formatados como R$ X.XX
6. Limite a resposta a 1000 caracteres
7. Comece com um título simples com emoji
8. Use apenas traços (-) para listas
9. Mantenha o português claro e natural

Agora analise os dados acima e responda:`;
}
