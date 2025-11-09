// app/api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("🔔 WEBHOOK RECEBIDO (POST)!");
    console.log("📦 Body completo:", JSON.stringify(body, null, 2));

    const messageText =
      body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;

    if (messageText) {
      console.log("✅ MENSAGEM DE TEXTO ENCONTRADA:");
      console.log("💬 Texto:", messageText);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("❌ Erro no webhook POST:", error);
    return NextResponse.json({ error: "deu erro" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Debug completo do que está chegando
  const url = new URL(request.url);
  const searchParams = Object.fromEntries(url.searchParams.entries());

  console.log("🔍 META WEBHOOK VERIFICATION DEBUG:");
  console.log("📋 URL completa:", request.url);
  console.log("🔍 Query parameters:", searchParams);
  console.log("🔍 Headers:", Object.fromEntries(request.headers.entries()));

  const hubMode = url.searchParams.get("hub.mode");
  const hubToken = url.searchParams.get("hub.verify_token");
  const hubChallenge = url.searchParams.get("hub.challenge");

  console.log("📊 Valores extraídos:");
  console.log("   hub.mode:", hubMode);
  console.log("   hub.verify_token:", hubToken);
  console.log("   hub.challenge:", hubChallenge);
  console.log("   EXPECTED_TOKEN:", process.env.WHATSAPP_VERIFY_TOKEN);

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
