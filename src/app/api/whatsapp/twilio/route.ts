// app/api/whatsapp/twilio/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

console.log("🔧 API Twilio carregada - Verificando variáveis de ambiente:");
console.log("ANTHROPIC_API_KEY:", process.env.ANTHROPIC_API_KEY ? "✅ Configurada" : "❌ Faltando");
console.log("TWILIO_ACCOUNT_SID:", process.env.TWILIO_ACCOUNT_SID ? "✅ Configurada" : "❌ Faltando");
console.log("TWILIO_AUTH_TOKEN:", process.env.TWILIO_AUTH_TOKEN ? "✅ Configurada" : "❌ Faltando");

async function callClaudeApi(prompt: string) {
  console.log("🤖 Chamando Claude API...");
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    console.log("📊 Status Claude:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro Claude:", response.status, errorText);
      throw new Error(`Erro na API Claude: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Resposta Claude recebida");
    return data;
  } catch (error) {
    console.error("❌ Erro ao chamar Claude API:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  console.log("📨 Incoming Twilio webhook request");
  
  try {
    const formData = await request.formData();
    const formDataObj = Object.fromEntries(formData.entries());
    console.log("📋 FormData recebido:", formDataObj);

    const { From: from, Body: message, ProfileName: profileName } = formDataObj;

    if (!from || !message) {
      console.log("❌ Dados incompletos");
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const messageText = message.toString();
    console.log("💬 Mensagem processada:", messageText);

    // Ignorar mensagens de sistema
    if (messageText.toLowerCase().includes("join") || messageText.trim().length < 3) {
      console.log("⚙️ Mensagem de sistema ignorada");
      return new Response(null, { status: 200 });
    }

    let dadosExtraidos;
    try {
      console.log("🧠 Processando com Claude...");
      // ... (código do Claude)
    } catch (error) {
      console.error("❌ Erro Claude, usando fallback manual:", error);
      dadosExtraidos = {
        tipo: messageText.toLowerCase().includes("salário") || messageText.toLowerCase().includes("receita") ? "receita" : "despesa",
        descricao: messageText.substring(0, 50),
        valor: parseFloat(messageText.match(/(\d+)/)?.[1] || "0"),
        categoria: "outros",
        tipoLancamento: "individual",
        responsavel: "Claudenir",
        data: new Date().toISOString().split('T')[0],
        pago: true
      };
    }

    console.log("🔍 Dados para salvar:", dadosExtraidos);

    // SIMPLIFICAR - Salvar apenas o básico primeiro
    try {
      console.log("💾 Tentando salvar no banco...");
      
      const session = await auth();
      console.log("👤 Session:", session ? "✅ Autenticado" : "❌ Não autenticado");

      // CORREÇÃO: Verificar se session existe e tem user
      if (!session || !session.user) {
        console.log("❌ Usuário não autenticado - session ou user é null");
        
        // Enviar mensagem de erro para o usuário
        await enviarRespostaTwilio(
          from.toString(),
          "❌ Erro: Usuário não autenticado. Faça login no sistema primeiro."
        );
        
        return new Response("Usuário não autenticado", { status: 401 });
      }

      // Dados MÍNIMOS para teste
  const dadosMinimos = {
  descricao: dadosExtraidos?.descricao || "Transação WhatsApp",
  valor: Math.abs(dadosExtraidos?.valor || 0),
  tipo: dadosExtraidos?.tipo || "despesa",
  categoria: dadosExtraidos?.categoria || "outros",
  tipoLancamento: dadosExtraidos?.tipoLancamento || "individual",
  responsavel: dadosExtraidos?.responsavel || "Claudenir",
  data: new Date(dadosExtraidos?.data || new Date()),
  pago: true,
  origem: "whatsapp",
  mensagemOriginal: messageText.substring(0, 200),
  usuarioId: session.user.id,
};
      console.log("📦 Dados mínimos:", dadosMinimos);

      // Tentar salvar
      const resultado = await db.lancamento.create({
        data: dadosMinimos
      });

      console.log("✅ Salvo com sucesso!", resultado.id);

      // Responder ao Twilio
      try {
        await enviarRespostaTwilio(
          from.toString(),
          `✅ Registrado: ${dadosMinimos.descricao} - R$ ${dadosMinimos.valor}`
        );
      } catch (twilioError) {
        console.error("❌ Erro Twilio resposta:", twilioError);
      }

      return new Response(null, { status: 200 });

    } catch (dbError) {
      console.error("💥 ERRO NO BANCO:", dbError);
      
      // Tentar resposta mesmo com erro no banco
      try {
        await enviarRespostaTwilio(
          from.toString(),
          "⚠️ Recebido, mas erro interno. Contate suporte."
        );
      } catch (twilioError) {
        console.error("❌ Erro Twilio resposta (fallback):", twilioError);
      }

      return new Response("Erro interno", { status: 500 });
    }

  } catch (error) {
    console.error("💣 ERRO GRAVE:", error);
    return new Response("Erro interno", { status: 500 });
  }
}

// Função auxiliar para tipos seguros
interface UserSafe {
  id: string;
  name: string;
  email: string;
}
// Função para validar e completar dados extraídos
function validarECompletarDados(dados: any, mensagemOriginal: string) {
  const hoje = new Date().toISOString().split("T")[0];

  // Valores padrão
  const dadosPadrao = {
    tipo: "despesa",
    descricao: "Transação",
    valor: 0,
    categoria: "outros",
    tipoLancamento: "individual",
    responsavel: "Claudenir",
    data: hoje,
    pago: true,
    parcelas: 1,
    parcelaAtual: 1,
  };

  // Mesclar com dados extraídos
  const dadosCompletos = { ...dadosPadrao, ...dados };

  // Garantir que todos os campos tenham valores válidos
  if (!dadosCompletos.descricao || dadosCompletos.descricao.trim() === "") {
    dadosCompletos.descricao = "Transação";
  }

  // Extrair valor da mensagem se necessário
  if (dadosCompletos.valor <= 0) {
    const valorMatch = mensagemOriginal.match(/(\d+[,.]?\d*)/);
    if (valorMatch) {
      dadosCompletos.valor = parseFloat(valorMatch[1].replace(",", "."));
    }
  }

  // Corrigir responsável para "Ambos" se for compartilhado
  if (dadosCompletos.tipoLancamento === "compartilhado") {
    dadosCompletos.responsavel = "Ambos";
  } else {
    // Se for individual, garantir que seja Claudenir ou Beatriz
    if (!["Claudenir", "Beatriz"].includes(dadosCompletos.responsavel)) {
      dadosCompletos.responsavel = "Claudenir";
    }
  }

  // Validar categorias
  const categoriasReceitas = ["salario", "freela", "investimentos", "outros"];
  const categoriasDespesas = [
    "alimentacao",
    "transporte",
    "casa",
    "pessoal",
    "lazer",
    "outros",
  ];

  if (
    dadosCompletos.tipo === "receita" &&
    !categoriasReceitas.includes(dadosCompletos.categoria)
  ) {
    dadosCompletos.categoria = "outros";
  }

  if (
    dadosCompletos.tipo === "despesa" &&
    !categoriasDespesas.includes(dadosCompletos.categoria)
  ) {
    dadosCompletos.categoria = "outros";
  }

  // Validar responsáveis
  if (!["Claudenir", "Beatriz", "Ambos"].includes(dadosCompletos.responsavel)) {
    dadosCompletos.responsavel = "Claudenir";
  }

  // Garantir que parcelas seja um número
  dadosCompletos.parcelas = parseInt(dadosCompletos.parcelas) || 1;
  dadosCompletos.parcelaAtual = parseInt(dadosCompletos.parcelaAtual) || 1;

  return dadosCompletos;
}

// Função fallback para extrair dados ma  nualmente
function extrairDadosManualmente(mensagem: string) {
  console.log("🔄 Usando fallback manual para:", mensagem);

  const mensagemLower = mensagem.toLowerCase();
  const hoje = new Date().toISOString().split("T")[0];

  // Detectar tipo (receita ou despesa)
  let tipo = "despesa";
  if (
    mensagemLower.includes("salário") ||
    mensagemLower.includes("salario") ||
    mensagemLower.includes("receita") ||
    mensagemLower.includes("renda")
  ) {
    tipo = "receita";
  }

  // Extrair valor
  const valorMatch = mensagemLower.match(/(\d+[,.]?\d*)/);
  const valor = valorMatch ? parseFloat(valorMatch[1].replace(",", ".")) : 0;

  // Detectar categoria
  let categoria = tipo === "receita" ? "salario" : "outros";

  if (
    mensagemLower.includes("comida") ||
    mensagemLower.includes("almoço") ||
    mensagemLower.includes("almoco") ||
    mensagemLower.includes("jantar") ||
    mensagemLower.includes("restaurante") ||
    mensagemLower.includes("mercado") ||
    mensagemLower.includes("lanche")
  ) {
    categoria = "alimentacao";
  } else if (
    mensagemLower.includes("uber") ||
    mensagemLower.includes("taxi") ||
    mensagemLower.includes("gasolina") ||
    mensagemLower.includes("combustível") ||
    mensagemLower.includes("combustivel") ||
    mensagemLower.includes("ônibus") ||
    mensagemLower.includes("onibus") ||
    mensagemLower.includes("transporte")
  ) {
    categoria = "transporte";
  } else if (
    mensagemLower.includes("luz") ||
    mensagemLower.includes("água") ||
    mensagemLower.includes("agua") ||
    mensagemLower.includes("aluguel") ||
    mensagemLower.includes("internet") ||
    mensagemLower.includes("condomínio") ||
    mensagemLower.includes("condominio")
  ) {
    categoria = "casa";
  } else if (
    mensagemLower.includes("roupa") ||
    mensagemLower.includes("cosmético") ||
    mensagemLower.includes("cosmetico") ||
    mensagemLower.includes("sapato") ||
    mensagemLower.includes("perfume") ||
    mensagemLower.includes("maquiagem")
  ) {
    categoria = "pessoal";
  } else if (
    mensagemLower.includes("cinema") ||
    mensagemLower.includes("filme") ||
    mensagemLower.includes("shopping") ||
    mensagemLower.includes("viagem") ||
    mensagemLower.includes("parque") ||
    mensagemLower.includes("festival")
  ) {
    categoria = "lazer";
  }

  // Detectar responsável e tipo de lançamento
  let responsavel = "Claudenir";
  let tipoLancamento = "individual";

  if (
    mensagemLower.includes("beatriz") ||
    mensagemLower.includes("esposa") ||
    mensagemLower.includes("dela") ||
    mensagemLower.includes("mulher")
  ) {
    responsavel = "Beatriz";
  }

  if (
    mensagemLower.includes("compartilhado") ||
    mensagemLower.includes("conjunto") ||
    mensagemLower.includes("ambos") ||
    mensagemLower.includes("nós") ||
    mensagemLower.includes("nos")
  ) {
    tipoLancamento = "compartilhado";
  }

  // Descrição baseada no conteúdo
  let descricao = "Transação";
  if (mensagemLower.includes("uber") || mensagemLower.includes("taxi"))
    descricao = "Transporte";
  else if (mensagemLower.includes("almoço") || mensagemLower.includes("almoco"))
    descricao = "Almoço";
  else if (mensagemLower.includes("jantar")) descricao = "Jantar";
  else if (mensagemLower.includes("mercado")) descricao = "Mercado";
  else if (
    mensagemLower.includes("salário") ||
    mensagemLower.includes("salario")
  )
    descricao = "Salário";
  else if (mensagemLower.includes("luz")) descricao = "Conta de Luz";
  else if (mensagemLower.includes("água") || mensagemLower.includes("agua"))
    descricao = "Conta de Água";
  else if (mensagemLower.includes("internet")) descricao = "Internet";

  return {
    tipo,
    descricao,
    valor,
    categoria,
    tipoLancamento,
    responsavel,
    data: hoje,
    pago: true,
    parcelas: 1,
  };
}

// Função para formatar categoria para exibição
function formatarCategoria(categoria: string) {
  const categorias: { [key: string]: string } = {
    alimentacao: "Alimentação",
    transporte: "Transporte",
    casa: "Casa",
    pessoal: "Pessoal",
    lazer: "Lazer",
    salario: "Salário",
    freela: "Freelance",
    investimentos: "Investimentos",
    outros: "Outros",
  };

  return categorias[categoria] || categoria;
}

// Função para enviar resposta via Twilio
async function enviarRespostaTwilio(to: string, message: string) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      console.warn("⚠️ Credenciais do Twilio não configuradas");
      return;
    }

    const twilio = require("twilio");
    const client = twilio(accountSid, authToken);

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`,
    });

    console.log("✅ Resposta enviada via Twilio");
  } catch (error) {
    console.error("❌ Erro ao enviar resposta Twilio:", error);
  }
}
