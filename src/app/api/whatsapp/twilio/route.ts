// app/api/whatsapp/twilio/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

// Função para chamar a API da Anthropic Claude
async function callClaudeApi(prompt: string) {
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

    if (!response.ok) {
      throw new Error(`Erro na API Claude: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao chamar Claude API:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const formDataObj = Object.fromEntries(formData.entries());

    const { From: from, Body: message, ProfileName: profileName } = formDataObj;

    console.log("📨 Mensagem recebida via Twilio:", {
      from: from?.toString(),
      profileName: profileName?.toString(),
      message: message?.toString(),
    });

    if (!from || !message) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const messageText = message.toString();

    // Ignorar mensagens de sistema ou muito curtas
    if (
      messageText.toLowerCase().includes("join") ||
      messageText.trim().length < 3
    ) {
      console.log("⚙️ Mensagem de sistema ignorada");
      return new Response(null, { status: 200 });
    }

    // Processar a mensagem com Claude
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

    let dadosExtraidos;
    try {
      const claudeResponse = await callClaudeApi(prompt);
      const resposta = claudeResponse.content[0].text;

      // Extrair JSON da resposta
      const jsonMatch = resposta.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("JSON não encontrado na resposta do Claude");
      }

      dadosExtraidos = JSON.parse(jsonMatch[0]);
      console.log("✅ Dados extraídos pelo Claude:", dadosExtraidos);
    } catch (error) {
      console.error("❌ Erro ao processar com Claude:", error);
      // Fallback para extração manual
      dadosExtraidos = extrairDadosManualmente(messageText);
    }

    // Validar e completar os dados
    const dadosValidados = validarECompletarDados(dadosExtraidos, messageText);

    // Buscar usuário autenticado (Claudenir)
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Usuário não autenticado");
    }

    // Preparar dados para o model Lancamento
    const lancamentoData = {
      descricao: dadosValidados.descricao || "Transação",
      valor: Math.abs(dadosValidados.valor || 0),
      tipo: dadosValidados.tipo || "despesa",
      categoria: dadosValidados.categoria || "outros",
      tipoLancamento: dadosValidados.tipoLancamento || "individual",
      responsavel: dadosValidados.responsavel || "Claudenir",
      data: new Date(dadosValidados.data || new Date()),
      dataVencimento:
        dadosValidados.parcelas > 1 ? new Date(dadosValidados.data) : null,
      pago: dadosValidados.pago !== undefined ? dadosValidados.pago : true,
      origem: "whatsapp",
      mensagemOriginal: messageText.substring(0, 500), // Limitar tamanho
      recorrente: dadosValidados.parcelas > 1,
      frequencia: dadosValidados.parcelas > 1 ? "mensal" : null,
      parcelas: dadosValidados.parcelas > 1 ? dadosValidados.parcelas : null,
      parcelaAtual: dadosValidados.parcelas > 1 ? 1 : null,
      observacoes: `Registrado via WhatsApp: ${messageText.substring(0, 100)}...`,
      usuarioId: session.user.id,
    };

    console.log("💾 Salvando no model Lancamento:", lancamentoData);

    // Salvar no model Lancamento
    const lancamento = await db.lancamento.create({
      data: lancamentoData,
    });
    
    console.log("✅ Lançamento salvo com sucesso no model Lancamento!");

    // Enviar confirmação via Twilio
    await enviarRespostaTwilio(
      from.toString(),
      `✅ ${dadosValidados.tipo === "receita" ? "Receita" : "Despesa"} registrada!\n` +
        `• ${dadosValidados.descricao}\n` +
        `• Valor: R$ ${Math.abs(dadosValidados.valor).toFixed(2)}\n` +
        `• Categoria: ${formatarCategoria(dadosValidados.categoria)}\n` +
        `• Tipo: ${dadosValidados.tipoLancamento === "individual" ? "Individual" : "Compartilhado"}\n` +
        `• Responsável: ${dadosValidados.responsavel}`
    );

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("❌ Erro no webhook Twilio:", error);
    return new Response("Erro interno", { status: 500 });
  }
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
  if (!["Claudenir", "Beatriz"].includes(dadosCompletos.responsavel)) {
    dadosCompletos.responsavel = "Claudenir";
  }

  return dadosCompletos;
}

// Função fallback para extrair dados manualmente
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
