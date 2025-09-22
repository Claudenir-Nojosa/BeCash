// app/api/whatsapp/twilio/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

console.log("🔧 API Twilio carregada - Verificando variáveis de ambiente:");
console.log(
  "ANTHROPIC_API_KEY:",
  process.env.ANTHROPIC_API_KEY ? "✅ Configurada" : "❌ Faltando"
);
console.log(
  "TWILIO_ACCOUNT_SID:",
  process.env.TWILIO_ACCOUNT_SID ? "✅ Configurada" : "❌ Faltando"
);
console.log(
  "TWILIO_AUTH_TOKEN:",
  process.env.TWILIO_AUTH_TOKEN ? "✅ Configurada" : "❌ Faltando"
);

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
        model: "claude-sonnet-4-20250514", // Modelo mais recente e disponível
        max_tokens: 2000,
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

    const { From: from, Body: message } = formDataObj;

    if (!from || !message) {
      console.log("❌ Dados incompletos");
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const messageText = message.toString();
    console.log("💬 Mensagem processada:", messageText);

    // Ignorar mensagens de sistema
    if (
      messageText.toLowerCase().includes("join") ||
      messageText.trim().length < 3
    ) {
      console.log("⚙️ Mensagem de sistema ignorada");
      return new Response(null, { status: 200 });
    }

    // SOLUÇÃO: Usar um usuário fixo para WhatsApp
    // No seu caso, vamos usar o ID do Claudenir
    const USER_ID_WHATSAPP = "cma37wgm30004uf7836dzx3ag"; // Substitua pelo ID real do usuário

    let dadosExtraidos;
    try {
      console.log("🧠 Processando com Claude...");

      // PROMPT COMPLETO E PODEROSO
      const prompt = `Você é um assistente especializado em extrair informações financeiras de mensagens do WhatsApp.

ANALISE A MENSAGEM E EXTRAIA AS INFORMAÇÕES EM JSON STRICT:

MENSAGEM: "${messageText}"

REGAS IMPORTANTES:
1. IDENTIFIQUE se é RECEITA ou DESPESA
2. EXTRAIA o VALOR numérico (ex: "120" de "almoço 120 reais")
3. DETERMINE a CATEGORIA correta baseada na mensagem
4. IDENTIFIQUE se é INDIVIDUAL ou COMPARTILHADO
5. DETERMINE o RESPONSÁVEL (Claudenir ou Beatriz)
6. USE a DATA de hoje se não especificado
7. VERIFIQUE se é PARCELADO e extraia informações se mencionado

CATEGORIAS PARA DESPESAS:
- "alimentacao" (comida, restaurante, mercado, lanche, almoço, jantar)
- "transporte" (uber, taxi, gasolina, ônibus, combustível)
- "casa" (aluguel, luz, água, internet, condomínio)
- "pessoal" (roupa, cosméticos, cuidados pessoais)
- "lazer" (cinema, viagem, entretenimento, hobbies)
- "outros" (qualquer outra despesa)

CATEGORIAS PARA RECEITAS:
- "salario" (salário, renda fixa)
- "freela" (freelance, trabalho extra)
- "investimentos" (rendimentos, dividendos, aplicações)
- "outros" (outras receitas)

RESPONSÁVEIS PERMITIDOS: "Claudenir" ou "Beatriz"
TIPOS DE LANÇAMENTO: "individual" ou "compartilhado"

EXEMPLOS CORRETOS:
- "despesa claudenir uber 50 reais" → {"tipo": "despesa", "descricao": "Uber", "valor": 50, "categoria": "transporte", "tipoLancamento": "individual", "responsavel": "Claudenir", "data": "2024-01-15", "pago": true}
- "salario beatriz 3200" → {"tipo": "receita", "descricao": "Salário", "valor": 3200, "categoria": "salario", "tipoLancamento": "individual", "responsavel": "Beatriz", "data": "2024-01-15", "pago": true}
- "almoço compartilhado 120" → {"tipo": "despesa", "descricao": "Almoço", "valor": 120, "categoria": "alimentacao", "tipoLancamento": "compartilhado", "responsavel": "Claudenir", "data": "2024-01-15", "pago": true}
- "conta de luz 180 parcelada 3x" → {"tipo": "despesa", "descricao": "Conta de Luz", "valor": 180, "categoria": "casa", "tipoLancamento": "compartilhado", "responsavel": "Claudenir", "data": "2024-01-15", "pago": false, "parcelas": 3, "parcelaAtual": 1}

RETORNE APENAS JSON VÁLIDO SEM TEXTOS ADICIONAIS.`;

      const claudeResponse = await callClaudeApi(prompt);
      const resposta = claudeResponse.content[0].text;
      console.log("📝 Resposta Claude:", resposta);

      const jsonMatch = resposta.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        dadosExtraidos = JSON.parse(jsonMatch[0]);
        console.log("✅ Dados extraídos:", dadosExtraidos);
      } else {
        throw new Error("JSON não encontrado");
      }
    } catch (error) {
      console.error("❌ Erro Claude, usando fallback manual:", error);
      dadosExtraidos = extrairDadosManualmente(messageText);
    }

    console.log("🔍 Dados para salvar:", dadosExtraidos);

    try {
      // Dados para salvar
      const dadosParaSalvar = {
        descricao: dadosExtraidos.descricao || messageText.substring(0, 50),
        valor: Math.abs(dadosExtraidos.valor || 0),
        tipo: dadosExtraidos.tipo || "despesa",
        categoria: dadosExtraidos.categoria || "outros",
        tipoLancamento: dadosExtraidos.tipoLancamento || "individual",
        responsavel: dadosExtraidos.responsavel || "Claudenir",
        data: new Date(dadosExtraidos.data || new Date()),
        pago: dadosExtraidos.pago !== undefined ? dadosExtraidos.pago : true,
        origem: "whatsapp",
        mensagemOriginal: messageText.substring(0, 500),
        usuarioId: USER_ID_WHATSAPP, // USUÁRIO FIXO PARA WHATSAPP
      };

      console.log("📦 Dados para salvar:", dadosParaSalvar);

      // Salvar no banco
      const resultado = await db.lancamento.create({
        data: dadosParaSalvar,
      });

      console.log("✅ Salvo com sucesso! ID:", resultado.id);

      // CORRIGIR: Formatar número para o Twilio
      const numeroFormatado = from.toString().replace("whatsapp:", "");

      // Enviar resposta
      await enviarRespostaTwilio(
        numeroFormatado,
        `✅ ${dadosParaSalvar.tipo === "receita" ? "Receita" : "Despesa"} registrada!\n` +
          `• ${dadosParaSalvar.descricao}\n` +
          `• Valor: R$ ${dadosParaSalvar.valor.toFixed(2)}\n` +
          `• Categoria: ${formatarCategoria(dadosParaSalvar.categoria)}`
      );

      return new Response(null, { status: 200 });
    } catch (dbError) {
      console.error("💥 ERRO NO BANCO:", dbError);

      // Tentar enviar mensagem de erro
      try {
        const numeroFormatado = from.toString().replace("whatsapp:", "");
        await enviarRespostaTwilio(
          numeroFormatado,
          "⚠️ Erro ao salvar. Mensagem recebida, mas não processada."
        );
      } catch (twilioError) {
        console.error("❌ Erro ao enviar resposta de erro:", twilioError);
      }

      return new Response("Erro interno", { status: 500 });
    }
  } catch (error) {
    console.error("💣 ERRO GRAVE:", error);
    return new Response("Erro interno", { status: 500 });
  }
}

// Corrigir a função enviarRespostaTwilio
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

    // FORMATAR CORRETAMENTE O NÚMERO
    const numeroFormatado = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_NUMBER!, // ex: "whatsapp:+15558382453"
      to: numeroFormatado,
    });

    console.log("✅ Resposta enviada via Twilio para:", numeroFormatado);
  } catch (error) {
    console.error("❌ Erro ao enviar resposta Twilio:", error);
    throw error; // Re-lançar o erro para tratamento superior
  }
}

// Melhorar a extração manual
function extrairDadosManualmente(mensagem: string) {
  console.log("🔄 Usando fallback manual para:", mensagem);

  const mensagemLower = mensagem.toLowerCase();

  return {
    tipo:
      mensagemLower.includes("receita") || mensagemLower.includes("salário")
        ? "receita"
        : "despesa",
    descricao: mensagem.substring(0, 30),
    valor: extrairValor(mensagem),
    categoria: determinarCategoria(mensagemLower),
    responsavel: determinarResponsavel(mensagemLower),
    tipoLancamento: "individual",
    pago: true,
  };
}

function extrairValor(mensagem: string): number {
  const match = mensagem.match(/(\d+[,.]?\d*)/);
  return match ? parseFloat(match[1].replace(",", ".")) : 0;
}

function determinarCategoria(mensagemLower: string): string {
  if (
    mensagemLower.includes("uber") ||
    mensagemLower.includes("taxi") ||
    mensagemLower.includes("transporte")
  )
    return "transporte";
  if (
    mensagemLower.includes("comida") ||
    mensagemLower.includes("almoço") ||
    mensagemLower.includes("restaurante")
  )
    return "alimentacao";
  if (
    mensagemLower.includes("luz") ||
    mensagemLower.includes("água") ||
    mensagemLower.includes("casa")
  )
    return "casa";
  return "outros";
}

function determinarResponsavel(mensagemLower: string): string {
  if (mensagemLower.includes("beatriz")) return "Beatriz";
  return "Claudenir";
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
