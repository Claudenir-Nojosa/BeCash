// app/api/whatsapp/twilio/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

console.log("🔧 API Twilio carregada - Verificando variáveis de ambiente:");
console.log(
  "ANTHROPIC_API_KEY:",
  process.env.ANTHROPIC_API_KEY ? "✅ Configurada" : "❌ Faltando"
);
console.log(
  "TWILIO_ACCOUNT_SID:",
  process.env.TWILIO_ACCOUNT_SID ? "✅ Configurada" : "❌ Faltando"
);
console.log(
  "TWILIO_AUTH_TOKEN:",
  process.env.TWILIO_AUTH_TOKEN ? "✅ Configurada" : "❌ Faltando"
);

async function callClaudeApi(prompt: string) {
  console.log("🤖 Chamando Claude API...");
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514", // Modelo mais recente e disponível
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    console.log("📊 Status Claude:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro Claude:", response.status, errorText);
      throw new Error(`Erro na API Claude: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Resposta Claude recebida");
    return data;
  } catch (error) {
    console.error("❌ Erro ao chamar Claude API:", error);
    throw error;
  }
}

async function enviarRespostaTwilio(to: string, message: string) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error("Credenciais Twilio não configuradas");
    }

    // Usar fetch diretamente (mais simples que a biblioteca twilio)
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          To: `whatsapp:${to}`,
          From: "whatsapp:+14783756654",
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Twilio error: ${response.status} - ${errorText}`);
    }

    console.log("✅ Mensagem Twilio enviada");
  } catch (error) {
    console.error("❌ Erro ao enviar resposta Twilio:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  console.log("📨 Incoming Twilio webhook request");

  try {
    const formData = await request.formData();
    const formDataObj = Object.fromEntries(formData.entries());
    console.log("📋 FormData recebido:", formDataObj);

    const {
      From: from,
      Body: message,
      MessageStatus: messageStatus,
    } = formDataObj;
    // ✅ VERIFICAR SE É STATUS CALLBACK (SEM BODY)
    if (!message && messageStatus) {
      console.log("⚙️ Delivery status callback ignorado:", messageStatus);
      return new Response(null, { status: 200 });
    }

    // ✅ VERIFICAR SE É STATUS CALLBACK DE MENSAGEM ENVIADA
    if (messageStatus === "sent" || messageStatus === "delivered") {
      console.log("⚙️ Status de mensagem enviada ignorado:", messageStatus);
      return new Response(null, { status: 200 });
    }

    const messageText = message.toString().trim();
    console.log("💬 Mensagem processada:", messageText);

    // Ignorar mensagens de sistema
    if (messageText.toLowerCase().includes("join") || messageText.length < 2) {
      console.log("⚙️ Mensagem de sistema ignorada");
      return new Response(null, { status: 200 });
    }

    // Usuário fixo para WhatsApp
    const USER_ID_WHATSAPP = "cma37wgm30004uf7836dzx3ag";

    let dadosExtraidos;
    try {
      console.log("🧠 Processando com Claude...");

      const hojeReal = new Date().toISOString().split("T")[0];

      const prompt = `Extraia informações financeiras desta mensagem em JSON STRICT: "${messageText}"

Regras:
- Tipo: "receita" ou "despesa" 
- Descrição: breve descrição baseada na mensagem
- Valor: apenas números
- Categoria: alimentacao, transporte, casa, pessoal, lazer, salario, freela, investimentos, outros
- Responsavel: "Claudenir" ou "Beatriz"
- Data: use ${hojeReal}
- pago: true

Retorne APENAS JSON sem textos adicionais. Exemplo: 
{"tipo":"despesa","descricao":"Almoço","valor":45,"categoria":"alimentacao","responsavel":"Claudenir","data":"${hojeReal}","pago":true}`;

      const claudeResponse = await callClaudeApi(prompt);
      const resposta = claudeResponse.content[0].text;
      console.log("📝 Resposta Claude:", resposta);

      const jsonMatch = resposta.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        dadosExtraidos = JSON.parse(jsonMatch[0]);
        console.log("✅ Dados extraídos:", dadosExtraidos);
      } else {
        throw new Error("JSON não encontrado");
      }
    } catch (error) {
      console.error("❌ Erro Claude, usando fallback manual:", error);
      dadosExtraidos = extrairDadosManualmente(messageText);
    }

    // Dados para salvar
    const dadosParaSalvar = {
      descricao: dadosExtraidos.descricao || messageText.substring(0, 50),
      valor: Math.abs(dadosExtraidos.valor || 0),
      tipo: dadosExtraidos.tipo || "despesa",
      categoria: dadosExtraidos.categoria || "outros",
      tipoLancamento: "individual",
      responsavel: dadosExtraidos.responsavel || "Claudenir",
      data: new Date(dadosExtraidos.data || new Date()),
      pago: true,
      origem: "whatsapp",
      mensagemOriginal: messageText.substring(0, 500),
      usuarioId: USER_ID_WHATSAPP,
    };

    console.log("📦 Dados para salvar:", dadosParaSalvar);

    // Salvar no banco
    const resultado = await db.lancamento.create({
      data: dadosParaSalvar,
    });

    console.log("✅ Salvo com sucesso! ID:", resultado.id);

    // Enviar confirmação via Twilio
    const numeroFormatado = from.toString().replace("whatsapp:", "");

    await enviarRespostaTwilio(
      numeroFormatado,
      "✅ Lançamento registrado com sucesso!"
    );

    console.log("✅ Resposta enviada via Twilio para:", numeroFormatado);

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("💣 ERRO GRAVE:", error);

    // Tentar enviar mensagem de erro
    try {
      const formData = await request.formData();
      const formDataObj = Object.fromEntries(formData.entries());
      const { From: from } = formDataObj;

      if (from) {
        const numeroFormatado = from.toString().replace("whatsapp:", "");
        await enviarRespostaTwilio(
          numeroFormatado,
          "❌ Erro ao processar mensagem. Tente novamente."
        );
      }
    } catch (twilioError) {
      console.error("❌ Erro ao enviar mensagem de erro:", twilioError);
    }

    return new Response(null, { status: 200 }); // ✅ SEMPRE retornar 200 para o Twilio
  }
}

// Melhorar a extração manual
function extrairDadosManualmente(mensagem: string) {
  console.log("🔄 Usando fallback manual para:", mensagem);

  const mensagemLower = mensagem.toLowerCase();

  return {
    tipo:
      mensagemLower.includes("receita") || mensagemLower.includes("salário")
        ? "receita"
        : "despesa",
    descricao: mensagem.substring(0, 30),
    valor: extrairValor(mensagem),
    categoria: determinarCategoria(mensagemLower),
    responsavel: determinarResponsavel(mensagemLower),
    tipoLancamento: "individual",
    pago: true,
  };
}

function extrairValor(mensagem: string): number {
  const match = mensagem.match(/(\d+[,.]?\d*)/);
  return match ? parseFloat(match[1].replace(",", ".")) : 0;
}

function determinarCategoria(mensagemLower: string): string {
  if (
    mensagemLower.includes("uber") ||
    mensagemLower.includes("taxi") ||
    mensagemLower.includes("transporte")
  )
    return "transporte";
  if (
    mensagemLower.includes("comida") ||
    mensagemLower.includes("almoço") ||
    mensagemLower.includes("restaurante")
  )
    return "alimentacao";
  if (
    mensagemLower.includes("luz") ||
    mensagemLower.includes("água") ||
    mensagemLower.includes("casa")
  )
    return "casa";
  return "outros";
}

function determinarResponsavel(mensagemLower: string): string {
  if (mensagemLower.includes("beatriz")) return "Beatriz";
  return "Claudenir";
}

function formatarCategoria(categoria: string) {
  const categorias: { [key: string]: string } = {
    alimentacao: "Alimentação",
    transporte: "Transporte",
    casa: "Casa",
    pessoal: "Pessoal",
    lazer: "Lazer",
    salario: "Salário",
    freela: "Freelance",
    investimentos: "Investimentos",
    outros: "Outros",
  };

  return categorias[categoria] || categoria;
}
