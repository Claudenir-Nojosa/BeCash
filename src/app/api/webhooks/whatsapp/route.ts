// app/api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from "next/server";

async function callClaudeAPI(userMessage: string, context?: string) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY não configurada");
  }

  const prompt = `Você é um assistente útil no WhatsApp. Responda de forma amigável e direta em português.

Mensagem: "${userMessage}"

Responda naturalmente:`;

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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error("Erro Claude API:", error);
    throw error;
  }
}

async function sendWhatsAppMessage(to: string, message: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  console.log("🔑 Verificando credenciais WhatsApp...");
  console.log("📱 Phone Number ID:", phoneNumberId);
  console.log("🔐 Access Token existe:", !!accessToken);
  console.log(
    "🔐 Primeiros chars do token:",
    accessToken?.substring(0, 20) + "..."
  );

  if (!phoneNumberId || !accessToken) {
    throw new Error("Credenciais WhatsApp não encontradas");
  }

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
  console.log("🌐 URL da API:", url);

  const requestBody = {
    messaging_product: "whatsapp",
    to: to,
    text: { body: message },
  };

  console.log("📦 Request Body:", JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log("📡 Status da resposta:", response.status);
    console.log("📡 Headers da resposta:", response.headers);

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        "❌ Erro detalhado WhatsApp API:",
        JSON.stringify(errorData, null, 2)
      );

      if (response.status === 401) {
        throw new Error("TOKEN_INVALIDO: Access Token expirado ou inválido");
      } else if (response.status === 404) {
        throw new Error(
          "PHONE_NUMBER_INVALIDO: Phone Number ID não encontrado"
        );
      } else {
        throw new Error(
          `WhatsApp API: ${response.status} - ${errorData.error?.message}`
        );
      }
    }

    const data = await response.json();
    console.log("✅ Mensagem enviada com sucesso!");
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
        let claudeResponse;

        // Processar com Claude
        try {
          claudeResponse = await callClaudeAPI(userMessage);
          console.log("🤖 Resposta do Claude:", claudeResponse);
        } catch (error) {
          console.error("❌ Erro no Claude:", error);
          claudeResponse = `Olá! Recebi: "${userMessage}". No momento estou em desenvolvimento! 😊`;
        }

        // Enviar resposta
        try {
          console.log("📤 Tentando enviar resposta...");
          await sendWhatsAppMessage(userPhone, claudeResponse);
          console.log("🎉 Mensagem enviada com sucesso!");
        } catch (whatsappError) {
          console.error("💥 Falha no envio WhatsApp:", whatsappError);
          // Não propaga o erro - retorna sucesso para o webhook
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
