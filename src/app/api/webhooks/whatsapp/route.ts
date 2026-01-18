// app/api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { MessageHandler } from "./handlers/message.handler";
import { AudioHandler } from "./handlers/audio.handler";
import { WhatsAppService } from "./services/whatsapp.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return NextResponse.json({ status: "received" });
    }

    const userPhone = message.from;

    console.log("📱 Tipo de mensagem recebida:", message.type);
    console.log("👤 De:", userPhone);

    // Processar diferentes tipos de mensagem
    if (message.type === "text") {
      await MessageHandler.processarMensagemTexto(message);
    } else if (message.type === "audio") {
      await AudioHandler.processarAudio(message, userPhone);
    } else {
      console.log(`❌ Tipo de mensagem não suportado: ${message.type}`);
      await WhatsAppService.sendMessage(
        userPhone,
        "❌ Ainda não consigo processar este tipo de mídia.\n\n💡 Envie apenas mensagens de texto ou áudio com seus lançamentos."
      );
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

  if (hubMode === "subscribe" && hubToken === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("✅ Webhook verificado com sucesso!");
    return new Response(hubChallenge, { status: 200 });
  }

  console.log("❌ Falha na verificação");
  return new Response("Verification failed", { status: 403 });
}