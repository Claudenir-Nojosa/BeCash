// app/api/webhooks/whatsapp/services/whatsapp.service.ts
import { validarCredenciaisWhatsApp } from "../utils/validators";

export class WhatsAppService {
  static async sendMessage(to: string, message: string) {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    console.log("🔑 Enviando mensagem REAL pelo WhatsApp...");
    console.log("👤 Para (recebido):", to);

    if (!validarCredenciaisWhatsApp()) {
      throw new Error("Credenciais do WhatsApp não configuradas");
    }

    const apenasNumeros = to.replace(/\D/g, "");
    let numeroWhatsApp = apenasNumeros;

    // Normalização do número
    if (apenasNumeros === "85991486998" || apenasNumeros === "991486998") {
      numeroWhatsApp = "5585991486998";
      console.log(`✅ Convertendo local → internacional: ${apenasNumeros} → ${numeroWhatsApp}`);
    } else if (apenasNumeros.length === 12 && apenasNumeros.startsWith("55")) {
      const ddi = "55";
      const ddd = apenasNumeros.substring(2, 4);
      const resto = apenasNumeros.substring(4);
      numeroWhatsApp = ddi + ddd + "9" + resto;
      console.log(`✅ Adicionando 9 faltante: ${apenasNumeros} → ${numeroWhatsApp}`);
    }

    console.log("👤 Para (enviando):", numeroWhatsApp);
    console.log(`📤 Mensagem (${message.length} chars):`, message);

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
            to: numeroWhatsApp,
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
      console.log("✅ Mensagem enviada com sucesso:", {
        to: data.contacts?.[0]?.wa_id,
        messageId: data.messages?.[0]?.id,
      });
      return data;
    } catch (error) {
      console.error("💥 Erro no envio WhatsApp:", error);
      throw error;
    }
  }

  static async downloadAudio(audioId: string): Promise<ArrayBuffer> {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!validarCredenciaisWhatsApp()) {
      throw new Error("Credenciais do WhatsApp não configuradas");
    }

    // Buscar URL do áudio
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${audioId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!mediaResponse.ok) {
      const errorData = await mediaResponse.text();
      console.error("❌ Erro ao buscar URL do áudio:", errorData);
      throw new Error(`Erro ao buscar mídia: ${mediaResponse.status}`);
    }

    const mediaData = await mediaResponse.json();
    const audioUrl = mediaData.url;

    console.log(`🔗 URL do áudio obtida: ${audioUrl}`);

    if (!audioUrl) {
      throw new Error("URL do áudio não encontrada");
    }

    // Baixar o arquivo de áudio
    const audioFileResponse = await fetch(audioUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!audioFileResponse.ok) {
      throw new Error(`Erro ao baixar áudio: ${audioFileResponse.status}`);
    }

    return await audioFileResponse.arrayBuffer();
  }
}