// app/api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from "next/server";

// Função para chamar o Claude API (similar à que você já tem)
async function callClaudeAPI(userMessage: string, context?: string) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY não configurada");
  }

  const prompt = `
Você é um assistente útil que responde mensagens no WhatsApp.
Responda de forma clara, direta e amigável.

${context ? `Contexto: ${context}` : ""}

Mensagem do usuário: "${userMessage}"

Instruções:
- Seja natural e conversacional
- Use emojis moderadamente
- Responda em português
- Seja objetivo e útil
- Formate com quebras de linha quando necessário

Resposta:`;

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
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na API Anthropic: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error("Erro ao chamar Claude API:", error);
    throw error;
  }
}

// Função para enviar mensagem pelo WhatsApp Business API
async function sendWhatsAppMessage(to: string, message: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

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
      console.error("Erro ao enviar mensagem WhatsApp:", errorData);
      throw new Error(`Erro WhatsApp: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Mensagem enviada com sucesso:", data);
    return data;
  } catch (error) {
    console.error("Erro no envio WhatsApp:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("🔔 MENSAGEM RECEBIDA NO WEBHOOK!");
    console.log("📦 Body completo:", JSON.stringify(body, null, 2));

    // Extrair informações da mensagem
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message && message.type === "text") {
      console.log("✅ NOVA MENSAGEM DE TEXTO DETECTADA!");
      console.log("👤 De:", message.from);
      console.log("💬 Texto:", message.text?.body);
      console.log("🆔 Message ID:", message.id);

      const userMessage = message.text?.body;
      const userPhone = message.from;

      if (userMessage && userPhone) {
        // Processar a mensagem com Claude
        console.log("🤖 Processando mensagem com Claude...");

        let claudeResponse;
        try {
          // Você pode adicionar contexto específico aqui se quiser
          const context = "Usuário enviou mensagem pelo WhatsApp";

          claudeResponse = await callClaudeAPI(userMessage, context);
          console.log("✅ Resposta do Claude:", claudeResponse);
        } catch (error) {
          console.error("❌ Erro ao processar com Claude:", error);
          claudeResponse =
            "Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente mais tarde. 😊";
        }

        // Enviar resposta pelo WhatsApp
        console.log("📤 Enviando resposta pelo WhatsApp...");
        await sendWhatsAppMessage(userPhone, claudeResponse);

        console.log("✅ Fluxo completo concluído!");
      }
    } else if (message) {
      console.log("📞 Tipo de mensagem não suportado:", message.type);

      // Responder para tipos não suportados
      if (message.from) {
        await sendWhatsAppMessage(
          message.from,
          "Olá! Atualmente só consigo processar mensagens de texto. Envie uma mensagem escrita para conversarmos! 📝"
        );
      }
    } else {
      console.log("❌ Estrutura diferente do esperado");
      console.log("Possível status update ou outro evento");
    }

    return NextResponse.json({ status: "received" });
  } catch (error) {
    console.error("❌ Erro no webhook:", error);
    return NextResponse.json({ error: "deu erro" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const hubMode = url.searchParams.get("hub.mode");
  const hubToken = url.searchParams.get("hub.verify_token");
  const hubChallenge = url.searchParams.get("hub.challenge");

  if (
    hubMode === "subscribe" &&
    hubToken === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    console.log("✅ Webhook verificado!");
    return new Response(hubChallenge, { status: 200 });
  }

  return new Response("Verification failed", { status: 403 });
}
