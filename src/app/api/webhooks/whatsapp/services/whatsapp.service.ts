// app/api/webhooks/whatsapp/services/whatsapp.service.ts
import { validarCredenciaisWhatsApp } from "../utils/validators";

export class WhatsAppService {
  private static normalizePhoneForWhatsApp(to: string): string {
    const digits = to.replace(/\D/g, "");

    if (!digits) {
      return digits;
    }

    // Already with Brazil country code
    if (digits.startsWith("55")) {
      // 55 + DDD + 9 digits
      if (digits.length === 13) {
        return digits;
      }

      // 55 + DDD + 8 digits (legacy) => insert 9
      if (digits.length === 12) {
        const ddi = "55";
        const ddd = digits.substring(2, 4);
        const local = digits.substring(4);
        return ddi + ddd + "9" + local;
      }

      return digits;
    }

    // Without country code: assume Brazil
    if (digits.length === 11 || digits.length === 10) {
      return `55${digits}`;
    }

    return digits;
  }

  static async sendMessage(to: string, message: string) {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    console.log("Sending REAL WhatsApp message...");
    console.log("To (received):", to);

    if (!validarCredenciaisWhatsApp()) {
      throw new Error("WhatsApp credentials not configured");
    }

    const numeroWhatsApp = this.normalizePhoneForWhatsApp(to);
    console.log(`Phone normalization: ${to} -> ${numeroWhatsApp}`);

    console.log("To (sending):", numeroWhatsApp);
    console.log(`Message (${message.length} chars):`, message);

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
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("WhatsApp send error:", errorData);
        throw new Error(`WhatsApp error: ${response.status}`);
      }

      const data = await response.json();
      const waId = data.contacts?.[0]?.wa_id;

      if (waId && waId !== numeroWhatsApp) {
        console.warn("wa_id returned different from sent number", {
          sent: numeroWhatsApp,
          returned: waId,
        });
      }

      console.log("Message sent successfully:", {
        to: waId,
        messageId: data.messages?.[0]?.id,
      });
      return data;
    } catch (error) {
      console.error("WhatsApp send failure:", error);
      throw error;
    }
  }

  static async downloadAudio(audioId: string): Promise<ArrayBuffer> {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!validarCredenciaisWhatsApp()) {
      throw new Error("WhatsApp credentials not configured");
    }

    // Fetch media URL
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${audioId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!mediaResponse.ok) {
      const errorData = await mediaResponse.text();
      console.error("Error fetching audio URL:", errorData);
      throw new Error(`Error fetching media: ${mediaResponse.status}`);
    }

    const mediaData = await mediaResponse.json();
    const audioUrl = mediaData.url;

    console.log(`Audio URL fetched: ${audioUrl}`);

    if (!audioUrl) {
      throw new Error("Audio URL not found");
    }

    // Download audio file
    const audioFileResponse = await fetch(audioUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!audioFileResponse.ok) {
      throw new Error(`Error downloading audio: ${audioFileResponse.status}`);
    }

    return await audioFileResponse.arrayBuffer();
  }
}
