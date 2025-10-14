import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../auth";

export async function POST(request: NextRequest) {
  try {
    const { metaId, perguntaEspecifica } = await request.json();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!metaId) {
      return NextResponse.json(
        { error: "ID da meta é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar meta e dados do usuário
    const meta = await db.metaPontos.findUnique({
      where: {
        id: metaId,
        userId: session.user.id,
      },
    });

    if (!meta) {
      return NextResponse.json(
        { error: "Meta não encontrada" },
        { status: 404 }
      );
    }

    // Buscar todos os pontos do usuário para este programa
    const pontos = await db.pontos.findMany({
      where: {
        userId: session.user.id,
        programa: meta.programa,
      },
      orderBy: {
        data: "asc",
      },
    });

    // Calcular estatísticas
    const estatisticas = calcularEstatisticas(pontos, meta);
    const projecao = calcularProjecaoDetalhada(estatisticas, meta);

    // Gerar análise com IA
    const analiseIA = await gerarAnaliseComIA(
      meta,
      estatisticas,
      projecao,
      pontos,
      perguntaEspecifica
    );

    return NextResponse.json({
      analise: analiseIA,
      estatisticas,
      projecao,
      meta,
      success: true,
    });
  } catch (error) {
    console.error("Erro ao analisar meta:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

function calcularEstatisticas(pontos: any[], meta: any) {
  const agora = new Date();
  const trintaDiasAtras = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Pontos dos últimos 30 dias
  const pontosRecentes = pontos.filter(
    (p) => new Date(p.data) >= trintaDiasAtras
  );
  const ganhosRecentes = pontosRecentes.filter((p) => p.tipo === "GANHO");
  const resgatesRecentes = pontosRecentes.filter((p) => p.tipo === "RESGATE");

  // Calcular ritmo
  const totalGanhos30Dias = ganhosRecentes.reduce(
    (sum, p) => sum + p.quantidade,
    0
  );
  const ritmoDiario = totalGanhos30Dias / 30;
  const ritmoMensal = totalGanhos30Dias;

  // Pontos atuais
  const pontosAtuais = pontos.reduce((saldo, ponto) => {
    if (ponto.tipo === "GANHO") return saldo + ponto.quantidade;
    return saldo - ponto.quantidade;
  }, 0);

  return {
    pontosAtuais,
    pontosRestantes: Math.max(0, meta.metaPontos - pontosAtuais),
    ritmoDiario,
    ritmoMensal,
    totalGanhos30Dias,
    totalResgates30Dias: resgatesRecentes.reduce(
      (sum, p) => sum + p.quantidade,
      0
    ),
    diasDesdeInicio: Math.max(
      1,
      Math.floor(
        (agora.getTime() - new Date(pontos[0]?.data || agora).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    ),
    totalTransacoes: pontos.length,
    valorMedioResgate: calcularValorMedioResgate(pontos),
  };
}

function calcularValorMedioResgate(pontos: any[]): number {
  const resgates = pontos.filter((p) => p.tipo === "RESGATE" && p.valorResgate);
  if (resgates.length === 0) return 0;

  const totalValor = resgates.reduce(
    (sum, p) => sum + (p.valorResgate || 0),
    0
  );
  const totalPontos = resgates.reduce((sum, p) => sum + p.quantidade, 0);

  return totalValor / totalPontos; // Valor por ponto
}

function calcularProjecaoDetalhada(estatisticas: any, meta: any) {
  const agora = new Date();
  const dataAlvo = new Date(meta.dataAlvo);
  const diasRestantes = Math.max(
    0,
    Math.floor((dataAlvo.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
  );

  const pontosNecessariosPorDia =
    estatisticas.pontosRestantes / Math.max(1, diasRestantes);

  // Projeção baseada no ritmo atual
  let dataProjecao: Date | null = null;
  let mensagem = "";

  if (estatisticas.ritmoDiario > 0) {
    const diasNecessarios =
      estatisticas.pontosRestantes / estatisticas.ritmoDiario;
    dataProjecao = new Date(
      agora.getTime() + diasNecessarios * 24 * 60 * 60 * 1000
    );

    if (diasNecessarios <= diasRestantes) {
      mensagem = `No seu ritmo atual, você atingirá a meta em ${dataProjecao.toLocaleDateString("pt-BR")}`;
    } else {
      const diasAlem = Math.ceil(diasNecessarios - diasRestantes);
      mensagem = `No seu ritmo atual, você precisará de ${diasAlem} dias além do prazo`;
    }
  } else {
    mensagem = "Você precisa aumentar seu ritmo de ganho de pontos";
  }

  return {
    diasRestantes,
    pontosNecessariosPorDia,
    dataProjecao,
    mensagem,
    atingivelNoPrazo: estatisticas.ritmoDiario >= pontosNecessariosPorDia,
    aceleracaoNecessaria: Math.max(
      0,
      pontosNecessariosPorDia - estatisticas.ritmoDiario
    ),
  };
}

async function gerarAnaliseComIA(
  meta: any,
  estatisticas: any,
  projecao: any,
  pontos: any[],
  perguntaEspecifica?: string
) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return "Anthropic API key não configurada. Configure a variável de ambiente ANTHROPIC_API_KEY.";
  }

  // Preparar dados históricos para análise
  const historicoResumido = pontos
    .slice(-10) // Últimas 10 transações
    .map((p) => ({
      data: new Date(p.data).toLocaleDateString("pt-BR"),
      tipo: p.tipo,
      pontos: p.quantidade,
      descricao: p.descricao,
      valorResgate: p.valorResgate,
    }));

  const categoriasGanhos = extrairCategoriasGanhos(pontos);

  const prompt = `
ANÁLISE DE META DE PONTOS - ${meta.programa}

CRITÉRIOS DE FORMATAÇÃO OBRIGATÓRIOS:
- NUNCA use **asteriscos** para negrito
- NUNCA use _sublinhados_ para itálico  
- NUNCA use # para títulos
- Use apenas EMOJIS para destacar seções
- Use traços • para listas
- Formate com quebras de linha limpas
- Use apenas texto puro sem marcação

DADOS DA META:
- Meta: ${meta.metaPontos.toLocaleString()} pontos
- Data alvo: ${new Date(meta.dataAlvo).toLocaleDateString("pt-BR")}
- Descrição: ${meta.descricao || "Sem descrição"}

SITUAÇÃO ATUAL:
- Pontos atuais: ${estatisticas.pontosAtuais.toLocaleString()}
- Pontos restantes: ${estatisticas.pontosRestantes.toLocaleString()}
- Progresso: ${((estatisticas.pontosAtuais / meta.metaPontos) * 100).toFixed(1)}%

RITMO ATUAL:
- Ganhos últimos 30 dias: ${estatisticas.totalGanhos30Dias.toLocaleString()} pontos
- Ritmo diário: ${estatisticas.ritmoDiario.toFixed(1)} pontos/dia
- Ritmo mensal: ${estatisticas.ritmoMensal.toLocaleString()} pontos/mês

PROJEÇÃO:
- Dias restantes: ${projecao.diasRestantes}
- Pontos necessários/dia: ${projecao.pontosNecessariosPorDia.toFixed(1)}
- ${projecao.mensagem}
- Meta atingível: ${projecao.atingivelNoPrazo ? "SIM" : "NÃO"}

FORNECE UMA ANÁLISE ORGANIZADA EM:

🎯 DIAGNÓSTICO DA SITUAÇÃO
[Análise objetiva da situação atual]

🚀 ESTRATÉGIAS PARA ACELERAR  
[Sugestões práticas e específicas]

📈 PROJEÇÕES DETALHADAS
[Cenários e números realistas]

✅ RECOMENDAÇÕES PRÁTICAS
[Ações concretas para implementar]

REGRA CRÍTICA: USE APENAS TEXTO PURO, EMOJIS E • PARA LISTAS. NUNCA USE MARKDOWN.

${perguntaEspecifica ? `PERGUNTA ESPECÍFICA: "${perguntaEspecifica}"` : ""}
`;

  try {
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
    if (data.content[0].text) {
      return limparFormatacaoMarkdown(data.content[0].text);
    }
  } catch (error) {
    console.error("Erro ao chamar API do Claude:", error);
    return `Não foi possível gerar análise com IA no momento. Aqui está um resumo:\n\nPontos necessários por dia: ${projecao.pontosNecessariosPorDia.toFixed(1)}\nDias restantes: ${projecao.diasRestantes}\nRitmo atual: ${estatisticas.ritmoDiario.toFixed(1)} pontos/dia\n\nRecomendação: ${projecao.atingivelNoPrazo ? "Mantenha o ritmo!" : "Acelere seus ganhos!"}`;
  }
}

function extrairCategoriasGanhos(pontos: any[]) {
  const ganhos = pontos.filter((p) => p.tipo === "GANHO");

  // Extrair categorias das descrições
  const categorias: { [key: string]: number } = {};

  ganhos.forEach((ponto) => {
    const desc = ponto.descricao.toLowerCase();
    let categoria = "Outros";

    if (
      desc.includes("compra") ||
      desc.includes("supermercado") ||
      desc.includes("mercado")
    ) {
      categoria = "Compras";
    } else if (
      desc.includes("combustível") ||
      desc.includes("posto") ||
      desc.includes("gasolina")
    ) {
      categoria = "Combustível";
    } else if (
      desc.includes("farmacia") ||
      desc.includes("drogaria") ||
      desc.includes("remédio")
    ) {
      categoria = "Farmácia";
    } else if (
      desc.includes("restaurante") ||
      desc.includes("comida") ||
      desc.includes("alimentação")
    ) {
      categoria = "Alimentação";
    } else if (
      desc.includes("viagem") ||
      desc.includes("hotel") ||
      desc.includes("voo")
    ) {
      categoria = "Viagens";
    } else if (
      desc.includes("bonus") ||
      desc.includes("promoção") ||
      desc.includes("bônus")
    ) {
      categoria = "Bônus";
    }

    categorias[categoria] = (categorias[categoria] || 0) + ponto.quantidade;
  });

  const total = Object.values(categorias).reduce(
    (sum: number, val: any) => sum + val,
    0
  );

  return Object.entries(categorias)
    .map(([categoria, quantidade]) => ({
      categoria,
      quantidade,
      percentual: (((quantidade as number) / total) * 100).toFixed(1),
    }))
    .sort((a, b) => b.quantidade - a.quantidade);
}
function limparFormatacaoMarkdown(texto: string): string {
  if (!texto) return texto;

  return (
    texto
      // Remove negritos **texto**
      .replace(/\*\*(.*?)\*\*/g, "$1")
      // Remove itálicos *texto* ou _texto_
      .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      // Remove cabeçalhos markdown ##
      .replace(/^#+\s+/gm, "")
      // Remove blocos de código
      .replace(/`(.*?)`/g, "$1")
      // Remove listas markdown
      .replace(/^\s*[-*+]\s+/gm, "• ")
      // Remove links [texto](url)
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      // Mantém apenas uma quebra de linha consecutiva
      .replace(/\n{3,}/g, "\n\n")
      // Limpa espaços extras
      .trim()
  );
}

// Na função que retorna a análise, aplique a limpeza:
function gerarAnaliseLocal(
  meta: any,
  estatisticas: any,
  projecao: any,
  pontos: any[],
  perguntaEspecifica?: string
): string {
  const programa = meta.programa;
  const valorPonto =
    estatisticas.valorMedioResgate > 0 ? estatisticas.valorMedioResgate : 0.01;

  let analise = "";

  // 🎯 DIAGNÓSTICO DA SITUAÇÃO
  analise += `🎯 DIAGNÓSTICO DA SITUAÇÃO\n`;
  const progressoPercentual = (
    (estatisticas.pontosAtuais / meta.metaPontos) *
    100
  ).toFixed(1);

  if (progressoPercentual === "0.0") {
    analise += `Sua jornada começou agora! Meta de ${meta.metaPontos.toLocaleString()} pontos até ${new Date(meta.dataAlvo).toLocaleDateString("pt-BR")}\n`;
    analise += `Você tem ${projecao.diasRestantes} dias para conquistar ${estatisticas.pontosRestantes.toLocaleString()} pontos\n\n`;
  } else if (parseFloat(progressoPercentual) < 25) {
    analise += `Início promissor! Já conquistou ${progressoPercentual}% da meta\n`;
    analise += `Faltam ${estatisticas.pontosRestantes.toLocaleString()} pontos em ${projecao.diasRestantes} dias\n\n`;
  } else if (parseFloat(progressoPercentual) < 75) {
    analise += `Bom progresso! ${progressoPercentual}% do caminho percorrido\n`;
    analise += `Continue assim para atingir a meta no prazo\n\n`;
  } else {
    analise += `Excelente! ${progressoPercentual}% já conquistado\n`;
    analise += `Faltam apenas ${estatisticas.pontosRestantes.toLocaleString()} pontos\n\n`;
  }

  // ⚡ ANÁLISE DE RITMO
  analise += `⚡ ANÁLISE DE RITMO\n`;
  analise += `Seu ritmo atual: ${estatisticas.ritmoDiario.toFixed(1)} pontos por dia\n`;
  analise += `Ritmo necessário: ${projecao.pontosNecessariosPorDia.toFixed(1)} pontos por dia\n`;

  const diferencaRitmo =
    projecao.pontosNecessariosPorDia - estatisticas.ritmoDiario;

  if (diferencaRitmo <= 0) {
    analise += `Status: No caminho certo! Mantenha este ritmo\n\n`;
  } else if (diferencaRitmo < 10) {
    analise += `Status: Quase lá! Precisa acelerar apenas ${diferencaRitmo.toFixed(1)} pontos/dia\n\n`;
  } else if (diferencaRitmo < 50) {
    analise += `Status: Precisa aumentar em ${diferencaRitmo.toFixed(1)} pontos/dia\n\n`;
  } else {
    analise += `Status: Desafio significativo - +${diferencaRitmo.toFixed(1)} pontos/dia necessários\n\n`;
  }

  // 🚀 ESTRATÉGIAS ESPECÍFICAS
  analise += `🚀 ESTRATÉGIAS PARA ${programa}\n`;

  const estrategiasGerais = [
    `Use cartão ${programa} como principal meio de pagamento`,
    `Concentre compras em estabelecimentos com maior multiplicador`,
    `Aproveite promoções sazonais e campanhas especiais`,
    `Participe de programas de indicação para bônus extras`,
    `Use o aplicativo para acompanhar ofertas exclusivas`,
  ];

  estrategiasGerais.forEach((estrategia) => {
    analise += `• ${estrategia}\n`;
  });

  // Dicas específicas por programa
  if (programa === "LIVELO") {
    analise += `• Foque em parceiros como iFood, Americanas, Magazine Luiza\n`;
    analise += `• Use em postos Shell e redes de farmácia parceiras\n`;
  } else if (programa === "SMILES") {
    analise += `• Priorize voos Gol para acumulação máxima\n`;
    analise += `• Use rede de hotéis e aluguel de carros parceiros\n`;
  } else if (programa === "TUDOAZUL") {
    analise += `• Voe Azul sempre que possível\n`;
    analise += `• Use em redes CVC e Ipiranga\n`;
  }
  analise += `\n`;

  // 💰 PROJEÇÕES FINANCEIRAS
  analise += `💰 PROJEÇÕES FINANCEIRAS\n`;
  if (valorPonto > 0) {
    const gastoMensalNecessario =
      (projecao.pontosNecessariosPorDia * 30) / (1000 / valorPonto);
    analise += `Valor estimado por ponto: R$ ${valorPonto.toFixed(4)}\n`;
    analise += `Gasto mensal necessário: R$ ${gastoMensalNecessario.toFixed(2)}\n`;
    analise += `Retorno por 1.000 pontos: R$ ${(valorPonto * 1000).toFixed(2)}\n`;
  } else {
    analise += `Para otimizar, registre valores de resgate para cálculos precisos\n`;
  }
  analise += `\n`;

  // ✅ RECOMENDAÇÕES PRÁTICAS
  analise += `✅ RECOMENDAÇÕES PRÁTICAS\n`;

  if (diferencaRitmo > 50) {
    analise += `• Considere ajustar a meta ou prazo para algo mais realista\n`;
    analise += `• Foque em estabelecimentos com multiplicador 5x ou mais\n`;
    analise += `• Avalie cartão de crédito parceiro para ganhos extras\n`;
  } else if (diferencaRitmo > 0) {
    analise += `• Aumente gradualmente seus gastos em locais parceiros\n`;
    analise += `• Participe de todas as promoções disponíveis\n`;
    analise += `• Revise seu progresso semanalmente\n`;
  } else {
    analise += `• Mantenha sua estratégia atual\n`;
    analise += `• Considere aumentar a meta se estiver muito fácil\n`;
  }

  analise += `• Defina metas mensais intermediárias\n`;
  analise += `• Celebre cada marco de 25% conquistado\n`;
  analise += `• Monitore ofertas especiais regularmente\n`;

  // Resposta a perguntas específicas
  if (perguntaEspecifica) {
    analise += `\n💬 RESPOSTA ESPECÍFICA\n`;

    if (
      perguntaEspecifica.toLowerCase().includes("quanto") &&
      perguntaEspecifica.toLowerCase().includes("gastar")
    ) {
      const gastoMensal =
        (projecao.pontosNecessariosPorDia * 30) / (1000 / (valorPonto || 0.01));
      analise += `Para atingir a meta, estime gastar R$ ${gastoMensal.toFixed(2)} por mês em estabelecimentos parceiros.\n`;
    }

    if (
      perguntaEspecifica.toLowerCase().includes("estratégia") ||
      perguntaEspecifica.toLowerCase().includes("ganhar")
    ) {
      analise += `Foque nos parceiros com maior multiplicador e participe ativamente das promoções do ${programa}.\n`;
    }

    if (
      perguntaEspecifica.toLowerCase().includes("tempo") ||
      perguntaEspecifica.toLowerCase().includes("demorar")
    ) {
      if (projecao.dataProjecao) {
        analise += `No ritmo atual, previsão para ${projecao.dataProjecao.toLocaleDateString("pt-BR")}\n`;
      } else {
        analise += `Com aceleração, possível atingir até ${new Date(meta.dataAlvo).toLocaleDateString("pt-BR")}\n`;
      }
    }
  }

  return analise;
}
