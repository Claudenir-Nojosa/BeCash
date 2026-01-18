// app/api/webhooks/whatsapp/handlers/audio.handler.ts
import { UserService } from "../services/user.service";
import { AIService } from "../services/ai.service";
import { WhatsAppService } from "../services/whatsapp.service";
import { MessageHandler } from "./message.handler";
import { detectarIdioma } from "../utils/detectors";

export class AudioHandler {
  static async processarAudio(audioMessage: any, userPhone: string) {
    try {
      console.log(`🎙️ Processando mensagem de áudio de: ${userPhone}`);

      const session = await UserService.getUserByPhone(userPhone);
      if (!session) {
        let mensagemErro = "";
        const idiomaDetectado = detectarIdioma(audioMessage.text?.body || "");
        
        if (idiomaDetectado === "en-US") {
          mensagemErro =
            "❌ Your number is not linked to any account.\n\n" +
            "💡 Access the BeCash app and link your WhatsApp in Settings.";
        } else {
          mensagemErro =
            "❌ Seu número não está vinculado a nenhuma conta.\n\n" +
            "💡 Acesse o app BeCash e vincule seu WhatsApp em Configurações.";
        }
        
        await WhatsAppService.sendMessage(userPhone, mensagemErro);
        return { status: "user_not_found" };
      }

      // Transcrever o áudio
      const audioId = audioMessage.audio?.id;
      if (!audioId) {
        throw new Error("ID do áudio não encontrado");
      }

      const textoTranscrito = await AIService.transcreverAudio(audioId);

      console.log(`📝 Áudio transcrito: "${textoTranscrito}"`);

      // Processar o texto transcrito
      return await MessageHandler.processarMensagemTexto({
        type: "text",
        text: { body: textoTranscrito },
        from: userPhone,
        id: audioMessage.id,
      });
    } catch (error: any) {
      console.error("❌ Erro ao processar áudio:", error);

      const session = await UserService.getUserByPhone(userPhone);
      const idiomaPreferido = session?.idiomaPreferido;

      let mensagemErro = "";
      if (idiomaPreferido === "en-US") {
        mensagemErro = `❌ I couldn't understand the audio. Error: ${error.message}\n\n💡 Try sending a text message or speak more clearly.`;
      } else {
        mensagemErro = `❌ Não consegui entender o áudio. Erro: ${error.message}\n\n💡 Tente enviar em texto ou falar mais claramente.`;
      }

      await WhatsAppService.sendMessage(userPhone, mensagemErro);
      throw error;
    }
  }
}