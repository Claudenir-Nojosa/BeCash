// app/api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

type DadosLancamento = {
  tipo: string;
  valor: string;
  descricao: string;
  metodoPagamento: string;
  data: string;
};

type ExtracaoSucesso = {
  sucesso: true;
  dados: DadosLancamento;
};

type ExtracaoErro = {
  sucesso: false;
  erro: string;
};

type ResultadoExtracao = ExtracaoSucesso | ExtracaoErro;

// Função para autenticar via API
async function getApiAuth() {
  const user = await db.user.findFirst();
  return user ? { user: { id: user.id } } : null;
}

// Função para buscar categorias do usuário
async function getCategoriasUsuario(userId: string) {
  try {
    const categorias = await db.categoria.findMany({
      where: { userId },
      orderBy: { nome: "asc" },
    });
    return categorias;
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return [];
  }
}

// Função para a IA escolher a melhor categoria
async function escolherMelhorCategoria(
  descricao: string,
  categorias: any[],
  tipo: string
) {
  if (!process.env.ANTHROPIC_API_KEY) {
    // Fallback simples se não tiver API key
    const categoriasFiltradas = categorias.filter((c) => c.tipo === tipo);
    return categoriasFiltradas.length > 0 ? categoriasFiltradas[0] : null;
  }

  const categoriasFiltradas = categorias.filter((c) => c.tipo === tipo);

  if (categoriasFiltradas.length === 0) {
    return null;
  }

  const prompt = `Analise a descrição "${descricao}" e escolha a categoria mais adequada entre estas opções:

CATEGORIAS DISPONÍVEIS:
${categoriasFiltradas.map((c, i) => `${i + 1}. ${c.nome}`).join("\n")}

INSTRUÇÕES:
- Escolha APENAS o nome da categoria mais adequada
- Não explique, não dê justificativas
- Retorne apenas o nome exato da categoria escolhida
- Se não houver uma boa correspondência, escolha a primeira categoria

RESPOSTA (apenas o nome da categoria):`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 100,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API: ${response.status}`);
    }

    const data = await response.json();
    const categoriaEscolhida = data.content[0].text.trim();

    // Encontrar a categoria correspondente
    return (
      categoriasFiltradas.find(
        (c) => c.nome.toLowerCase() === categoriaEscolhida.toLowerCase()
      ) || categoriasFiltradas[0]
    );
  } catch (error) {
    console.error("Erro ao escolher categoria com IA:", error);
    return categoriasFiltradas[0];
  }
}

// Função para analisar mensagens e extrair dados de lançamentos
function extrairDadosLancamento(mensagem: string): ResultadoExtracao {
  const texto = mensagem.toLowerCase().trim();

  // Padrão principal: [ação] [valor] [descrição] [método opcional] [data opcional]
  const padraoPrincipal = texto.match(
    /(gastei|paguei|recebi|ganhei)\s+(\d+[.,]?\d*)\s+(?:em|para|com|no)\s+(.+?)(?:\s+(?:no|com)\s+(cartão|pix|débito|dinheiro|crédito))?(?:\s+(hoje|ontem|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?))?$/i
  );

  if (padraoPrincipal) {
    const [, acao, valor, descricao, metodo, data] = padraoPrincipal;

    return {
      sucesso: true,
      dados: {
        tipo:
          acao.includes("recebi") || acao.includes("ganhei")
            ? "RECEITA"
            : "DESPESA",
        valor: valor.replace(",", "."),
        descricao: descricao.trim(),
        metodoPagamento: metodo ? metodo.toUpperCase() : "PIX",
        data: data || "hoje",
      },
    };
  }

  // Padrão alternativo: [valor] [descrição] [implícito despesa]
  const padraoAlternativo = texto.match(
    /(\d+[.,]?\d*)\s+(?:em|para|com|no)\s+(.+)/i
  );

  if (padraoAlternativo) {
    const [, valor, descricao] = padraoAlternativo;

    return {
      sucesso: true,
      dados: {
        tipo: "DESPESA",
        valor: valor.replace(",", "."),
        descricao: descricao.trim(),
        metodoPagamento: "PIX",
        data: "hoje",
      },
    };
  }

  return {
    sucesso: false,
    erro: "Não entendi o formato. Use: 'Gastei 50 no almoço' ou 'Recebi 1000 salário'",
  };
}

// Função para criar um lançamento via WhatsApp
async function createLancamento(
  userId: string,
  dados: any,
  categoriaEscolhida: any
) {
  try {
    // Processar data
    let dataLancamento = new Date();
    if (dados.data === "ontem") {
      dataLancamento.setDate(dataLancamento.getDate() - 1);
    } else if (dados.data.includes("/")) {
      const [dia, mes, ano] = dados.data.split("/").map(Number);
      dataLancamento = new Date(
        ano || new Date().getFullYear(),
        mes - 1 || new Date().getMonth(),
        dia || new Date().getDate()
      );
    }

    const lancamentoData = {
      descricao: dados.descricao,
      valor: parseFloat(dados.valor),
      tipo: dados.tipo.toUpperCase(),
      metodoPagamento: dados.metodoPagamento || "PIX",
      data: dataLancamento,
      categoriaId: categoriaEscolhida.id,
      userId: userId,
      pago: dados.metodoPagamento !== "CREDITO",
      observacoes: `Criado via WhatsApp - Categoria: ${categoriaEscolhida.nome}`,
    };

    const lancamento = await db.lancamento.create({
      data: lancamentoData,
      include: {
        categoria: true,
      },
    });

    return lancamento;
  } catch (error) {
    console.error("Erro ao criar lançamento:", error);
    throw error;
  }
}

// Função principal do Claude API com retry
async function callClaudeAPICriacao(
  userMessage: string,
  dadosExtracao: any,
  categoriasUsuario: any[],
  categoriaEscolhida: any,
  resultadoCriacao?: any
) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY não configurada");
  }

  let prompt = `Você é um assistente especializado em criar lançamentos financeiros via WhatsApp. 

MENSAGEM ORIGINAL DO USUÁRIO: "${userMessage}"

`;

  if (dadosExtracao.sucesso) {
    prompt += `
DADOS EXTRAÍDOS:
• Tipo: ${dadosExtracao.dados.tipo}
• Valor: R$ ${parseFloat(dadosExtracao.dados.valor).toFixed(2)}
• Descrição: ${dadosExtracao.dados.descricao}
• Método: ${dadosExtracao.dados.metodoPagamento}
• Data: ${dadosExtracao.dados.data}

CATEGORIA ESCOLHIDA: ${categoriaEscolhida?.nome}
`;

    if (resultadoCriacao) {
      if (resultadoCriacao.erro) {
        prompt += `

ERRO: ${resultadoCriacao.erro}

AJUDE O USUÁRIO:`;
      } else {
        prompt += `

✅ SUCESSO! CONFIRME O LANÇAMENTO:`;
      }
    } else {
      prompt += `

CONFIRME OS DADOS:`;
    }
  } else {
    prompt += `

ERRO: ${dadosExtracao.erro}

EXPLIQUE COMO CRIAR UM LANÇAMENTO:`;
  }

  prompt += `

INSTRUÇÕES:
- Seja direto e amigável
- Use 1-2 emojis
- Formate: R$ 123,45
- Resposta curta

RESPONDA:`;

  // Tentar até 3 vezes com delay
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (response.status === 529 || response.status === 429) {
        // Overloaded ou rate limit - esperar e tentar novamente
        if (attempt < 3) {
          const delay = attempt * 2000; // 2s, 4s
          console.log(
            `⚠️ Claude overloaded, tentando novamente em ${delay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error: any) {
      if (attempt === 3) {
        // Última tentativa falhou
        console.error(
          `❌ Claude API falhou após ${attempt} tentativas:`,
          error
        );
        throw error;
      }

      if (error.message.includes("529") || error.message.includes("429")) {
        const delay = attempt * 2000;
        console.log(`⚠️ Claude error, retry ${attempt} em ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        // Outro erro, não tente novamente
        throw error;
      }
    }
  }

  throw new Error("Todas as tentativas falharam");
}

// Função REAL para enviar mensagem pelo WhatsApp Business API
async function sendWhatsAppMessage(to: string, message: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  console.log("🔑 Enviando mensagem REAL pelo WhatsApp...");
  console.log("📱 Phone Number ID:", phoneNumberId);
  console.log("👤 Para:", to);

  if (!phoneNumberId || !accessToken) {
    throw new Error("Credenciais do WhatsApp não configuradas");
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to,
          text: { body: message },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Erro ao enviar mensagem WhatsApp:", errorData);
      throw new Error(`Erro WhatsApp: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Mensagem enviada com sucesso:", data);
    return data;
  } catch (error) {
    console.error("💥 Erro no envio WhatsApp:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message && message.type === "text") {
      const userMessage = message.text?.body;
      const userPhone = message.from;

      console.log("👤 Mensagem de:", userPhone);
      console.log("💬 Texto:", userMessage);

      if (userMessage && userPhone) {
        // 1. Autenticar usuário
        const session = await getApiAuth();
        if (!session) {
          await sendWhatsAppMessage(
            userPhone,
            "🔐 Sistema em configuração. Em breve poderei criar seus lançamentos!"
          );
          return NextResponse.json({ status: "received" });
        }

        const userId = session.user.id;

        // 2. Extrair dados do lançamento
        const dadosExtracao = extrairDadosLancamento(userMessage);
        console.log("📊 Dados extraídos:", dadosExtracao);

        // 3. Buscar categorias do usuário e escolher a melhor
        let categoriaEscolhida = null;
        let categoriasUsuario: any[] = [];
        let resultadoCriacao = null;

        if (dadosExtracao.sucesso) {
          try {
            // Buscar categorias reais do usuário
            categoriasUsuario = await getCategoriasUsuario(userId);
            console.log("🏷️ Categorias do usuário:", categoriasUsuario);

            if (categoriasUsuario.length === 0) {
              throw new Error(
                "Nenhuma categoria encontrada. Crie categorias primeiro."
              );
            }

            // Escolher a melhor categoria com IA
            categoriaEscolhida = await escolherMelhorCategoria(
              dadosExtracao.dados.descricao,
              categoriasUsuario,
              dadosExtracao.dados.tipo
            );

            console.log("🎯 Categoria escolhida:", categoriaEscolhida?.nome);

            if (!categoriaEscolhida) {
              throw new Error(
                `Nenhuma categoria do tipo ${dadosExtracao.dados.tipo} encontrada.`
              );
            }

            // Criar lançamento com categoria escolhida
            const lancamento = await createLancamento(
              userId,
              dadosExtracao.dados,
              categoriaEscolhida
            );
            resultadoCriacao = { sucesso: true, lancamento };
            console.log("✅ Lançamento criado:", lancamento);
          } catch (error: any) {
            resultadoCriacao = { sucesso: false, erro: error.message };
            console.error("❌ Erro ao criar lançamento:", error);
          }
        }

        // 4. Processar com Claude
        let claudeResponse;
        try {
          claudeResponse = await callClaudeAPICriacao(
            userMessage,
            dadosExtracao,
            categoriasUsuario,
            categoriaEscolhida,
            resultadoCriacao
          );
          console.log("🤖 Resposta do Claude:", claudeResponse);
        } catch (error) {
          console.error("❌ Erro no Claude:", error);
          // Resposta fallback
          if (dadosExtracao.sucesso && resultadoCriacao?.sucesso) {
            claudeResponse = `✅ Lançamento criado! ${dadosExtracao.dados.descricao} - R$ ${dadosExtracao.dados.valor} (Categoria: ${categoriaEscolhida?.nome})`;
          } else if (dadosExtracao.sucesso) {
            claudeResponse = `⚠️ Erro: ${resultadoCriacao?.erro || "Não foi possível criar o lançamento"}`;
          } else {
            claudeResponse = `❌ ${dadosExtracao.erro}\n\n💡 Exemplo: "Gastei 50 no almoço"`;
          }
        }

        // 5. Enviar resposta
        try {
          console.log("📤 Enviando resposta...");
          await sendWhatsAppMessage(userPhone, claudeResponse);
          console.log("🎉 Resposta enviada!");
        } catch (whatsappError) {
          console.error("💥 Falha no envio:", whatsappError);
        }
      }
    }

    return NextResponse.json({ status: "received" });
  } catch (error) {
    console.error("💥 Erro geral no webhook:", error);
    return NextResponse.json({ status: "received" });
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const hubMode = url.searchParams.get("hub.mode");
  const hubToken = url.searchParams.get("hub.verify_token");
  const hubChallenge = url.searchParams.get("hub.challenge");

  console.log("🔐 Verificação do webhook:");
  console.log("   Mode:", hubMode);
  console.log("   Token recebido:", hubToken);
  console.log("   Token esperado:", process.env.WHATSAPP_VERIFY_TOKEN);

  if (
    hubMode === "subscribe" &&
    hubToken === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    console.log("✅ Webhook verificado com sucesso!");
    return new Response(hubChallenge, { status: 200 });
  }

  console.log("❌ Falha na verificação");
  return new Response("Verification failed", { status: 403 });
}
