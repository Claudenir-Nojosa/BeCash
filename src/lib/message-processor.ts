// lib/message-processor.ts (atualizado para Supabase)
import { callClaudeApi } from "../lib/claude-api";
import db from "./db";
import twilio from "twilio";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function processMessage(from: string, message: string, type: string) {
  try {
    console.log("Processando mensagem do Twilio:", { from, message });
    
    // Ignorar mensagens muito curtas
    if (message.length < 3) return;
    
    // Usar Claude para interpretar a mensagem
    const prompt = `Analise esta mensagem sobre gastos em português do Brasil e extraia as informações em JSON:
    
    Mensagem: "${message}"
    
    Extraia:
    - descricao: string (descrição do gasto)
    - valor: number (valor em reais)
    - categoria: [alimentacao, transporte, casa, pessoal, lazer, receita, outros]
    - tipo: [individual, compartilhado]
    - responsavel: [Claudenir, Beatriz]
    - data: YYYY-MM-DD (use hoje se não especificado)
    
    Retorne apenas JSON. Exemplo: 
    {"descricao": "Almoço", "valor": 50, "categoria": "alimentacao", "tipo": "individual", "responsavel": "Claudenir", "data": "2023-10-15"}`;

    const claudeData = await callClaudeApi(prompt);
    const resposta = claudeData.content[0].text;
    
    // Extrair JSON da resposta
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      await enviarRespostaTwilio(from, "❌ Não entendi sua mensagem. Formato correto: 'Gastei 50 no almoço'");
      return;
    }
    
    const dadosGasto = JSON.parse(jsonMatch[0]);
    
    // Determinar usuário
    const usuario = await determinarUsuario(from);
    
    // Salvar no Supabase
    const gastoCompleto = {
      descricao: dadosGasto.descricao || "Gasto não identificado",
      valor: dadosGasto.valor || 0,
      categoria: dadosGasto.categoria || "outros",
      tipo: dadosGasto.tipo || "individual",
      responsavel: dadosGasto.responsavel || "Claudenir",
      data: dadosGasto.data ? new Date(dadosGasto.data) : new Date(),
      pago: false,
      origem: "whatsapp",
      mensagemOriginal: message,
      usuarioId: usuario.id,
    };

    await db.gasto.create({
      data: gastoCompleto
    });
    
    // Enviar confirmação via Twilio
    await enviarRespostaTwilio(
      from, 
      `✅ Gasto registrado!\n• ${gastoCompleto.descricao}\n• Valor: R$ ${gastoCompleto.valor.toFixed(2)}\n• Categoria: ${gastoCompleto.categoria}`
    );
    
  } catch (error) {
    console.error("Erro ao processar mensagem:", error);
    await enviarRespostaTwilio(from, "❌ Erro ao processar sua mensagem. Tente novamente.");
  }
}

async function enviarRespostaTwilio(to: string, message: string) {
  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: to
    });
  } catch (error) {
    console.error("Erro ao enviar resposta via Twilio:", error);
  }
}

async function determinarUsuario(from: string) {
  // Extrair número (Twilio envia no formato whatsapp:+5511999999999)
  const numero = from.replace('whatsapp:', '').replace(/\D/g, '');
  
  // Buscar usuário pelo telefone no mapeamento
  const mapeamento = await db.mapeamentoTelefone.findUnique({
    where: {
      telefone: numero
    },
    include: {
      usuario: true
    }
  });
  
  if (mapeamento) {
    return mapeamento.usuario;
  }
  
  // Se não encontrou, usar usuário padrão ou criar mapeamento
  let usuario = await db.usuario.findFirst({
    where: { email: "clau.nojosaf@gmail.com" } // Use seu email real aqui
  });
  
   if (!usuario) {
    // Se não encontrar, use o primeiro usuário disponível
    usuario = await db.usuario.findFirst();
    
    if (!usuario) {
      throw new Error("Nenhum usuário encontrado no banco de dados");
    }
  }
  // Criar mapeamento para futuro
  await db.mapeamentoTelefone.create({
    data: {
      telefone: numero,
      usuarioId: usuario.id,
      nome: from.includes('5511') ? "Claudenir" : "Beatriz"
    }
  });
  
  return usuario;
}