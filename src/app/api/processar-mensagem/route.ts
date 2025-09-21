// app/api/whatsapp/processar-mensagem/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { message, from, timestamp, type, usuarioId } = await request.json();

    console.log("Mensagem recebida do WhatsApp:", {
      from,
      timestamp,
      type,
      usuarioId,
      message: message.substring(0, 100) + (message.length > 100 ? "..." : ""),
    });

    if (!message || !from || !usuarioId) {
      return NextResponse.json(
        { error: "Mensagem, remetente e usuarioId são obrigatórios" },
        { status: 400 }
      );
    }

    // Processar a mensagem com Claude
    const prompt = `Analise a seguinte mensagem de gasto enviada por WhatsApp e extraia as informações relevantes no formato JSON. 
    A mensagem pode estar em texto ou áudio convertido para texto.
    
    Mensagem: "${message}"
    
    Extraia as seguintes informações quando disponíveis:
    - descricao: descrição do gasto ou receita
    - valor: valor numérico
    - categoria: uma das [alimentacao, transporte, casa, pessoal, lazer, receita, outros]
    - tipo: [individual, compartilhado]
    - responsavel: [Claudenir, Beatriz]
    - data: data no formato YYYY-MM-DD (use hoje se não especificado)
    
    Se não conseguir identificar claramente, retorne null para os campos.
    Retorne APENAS o JSON, sem nenhum texto adicional.`;

    // Verificar se a API key está configurada
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("Anthropic API key não configurada");
    }

    // CORREÇÃO: Usar Headers object em vez de objeto literal
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("x-api-key", apiKey);
    headers.append("anthropic-version", "2023-06-01");

    // Usar sua API existente do Claude
    const claudeResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: headers, // Usar o objeto Headers aqui
        body: JSON.stringify({
          model: "claude-3-sonnet-20240229",
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }],
        }),
      }
    );

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("Erro na API Anthropic:", claudeResponse.status, errorText);
      throw new Error(`Erro na API Anthropic: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    const resposta = claudeData.content[0].text;

    // Extrair JSON da resposta
    let dadosGasto;
    try {
      const jsonMatch = resposta.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        dadosGasto = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("JSON não encontrado na resposta");
      }
    } catch (error) {
      console.error("Erro ao parsear JSON:", error, "Resposta:", resposta);
      return NextResponse.json(
        { error: "Não foi possível interpretar a mensagem" },
        { status: 400 }
      );
    }

    // Validar e completar dados
    const dataGasto = dadosGasto.data ? new Date(dadosGasto.data) : new Date();

    const gastoCompleto = {
      descricao: dadosGasto.descricao || "Gasto não identificado",
      valor: dadosGasto.valor || 0,
      categoria: dadosGasto.categoria || "outros",
      tipo: dadosGasto.tipo || "individual",
      responsavel:
        dadosGasto.responsavel ||
        (from.includes("claudenir") ? "Claudenir" : "Beatriz"),
      data: dataGasto,
      pago: false,
      origem: "whatsapp",
      mensagemOriginal: message,
      usuarioId: usuarioId,
    };

    // Salvar no banco de dados usando o modelo correto
    await db.gasto.create({
      data: gastoCompleto,
    });

    // Preparar resposta para WhatsApp
    let respostaWhatsapp = "";
    if (gastoCompleto.valor > 0) {
      respostaWhatsapp = `✅ Gasto registrado!\n• ${gastoCompleto.descricao}\n• Valor: R$ ${gastoCompleto.valor.toFixed(2)}\n• Categoria: ${gastoCompleto.categoria}\n• Tipo: ${gastoCompleto.tipo}`;
    } else {
      respostaWhatsapp =
        "❌ Não consegui identificar um valor válido na mensagem. Por favor, tente novamente mencionando o valor.";
    }

    return NextResponse.json({
      success: true,
      data: gastoCompleto,
      resposta: respostaWhatsapp,
    });
  } catch (error) {
    console.error("Erro ao processar mensagem:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
