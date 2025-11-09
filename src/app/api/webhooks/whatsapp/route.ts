// app/api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("🔔 WEBHOOK RECEBIDO!");
    console.log("📦 Body completo:", JSON.stringify(body, null, 2));

    // Tentar extrair o texto da mensagem
    const messageText =
      body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;

    if (messageText) {
      console.log("✅ MENSAGEM DE TEXTO ENCONTRADA:");
      console.log("💬 Texto:", messageText);
      console.log("👤 De:", body.entry[0].changes[0].value.messages[0].from);
    } else {
      console.log("❌ Nenhuma mensagem de texto encontrada na estrutura");
    }

    return NextResponse.json({ status: "ok", received: true });
  } catch (error) {
    console.error("❌ Erro no webhook:", error);
    return NextResponse.json({ error: "deu erro" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Para o Meta verificar o webhook
  const { searchParams } = new URL(request.url);
  const hubMode = searchParams.get("hub.mode");
  const hubToken = searchParams.get("hub.verify_token");
  const hubChallenge = searchParams.get("hub.challenge");

  console.log("🔍 Meta tentando verificar webhook...");

  if (
    hubMode === "subscribe" &&
    hubToken === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    console.log("✅ Webhook verificado com sucesso!");
    return new Response(hubChallenge, { status: 200 });
  }

  console.log("❌ Falha na verificação");
  return new Response("Falhou", { status: 403 });
}
