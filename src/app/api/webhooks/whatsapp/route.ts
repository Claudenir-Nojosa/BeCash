// app/api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from "next/server";

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

    if (message) {
      console.log("✅ NOVA MENSAGEM DETECTADA!");
      console.log("👤 De:", message.from);
      console.log("💬 Texto:", message.text?.body);
      console.log("🆔 Message ID:", message.id);
      console.log("📅 Timestamp:", message.timestamp);
      console.log("📞 Tipo:", message.type);
    } else {
      console.log("❌ Estrutura diferente do esperado");
      console.log("Possível status update ou outro eventos");
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
