// app/api/webhooks/whatsapp/services/ai.service.ts
import { ResultadoExtracao, DadosLancamento, ComandoDetectado } from "../types";
import { extrairDadosLancamento } from "../utils/extractors";
import {
  detectarIdioma,
  detectarCompartilhamento,
  detectarParcelamento,
  detectarComando,
} from "../utils/detectors";
import {
  validarCredenciaisAnthropic,
  validarCredenciaisOpenAI,
} from "../utils/validators";

export class AIService {
  // Extração de dados com IA
  static async extrairDadosComIA(
    mensagem: string,
    idioma: string,
  ): Promise<ResultadoExtracao> {
    if (!validarCredenciaisAnthropic()) {
      console.log("⚠️ Sem API key, usando fallback regex");
      return extrairDadosLancamento(mensagem);
    }

    const promptPT = `Você é um assistente financeiro. Extraia os dados desta mensagem financeira:

MENSAGEM: "${mensagem}"

REGRAS DE EXTRAÇÃO:
1. TIPO: Identifique se é DESPESA ou RECEITA
   - Despesas: gastei, paguei, comprei, conta, fatura, etc
   - Receitas: recebi, ganhei, salário, etc

2. VALOR: Extraia o valor monetário (apenas números)
   - Exemplos: "99,90" → "99.90", "104,20" → "104.20", "1 real" → "1"

3. DESCRIÇÃO: Extraia O QUE foi pago/recebido (máximo 3-4 palavras)
   - "internet" → "Internet"
   - "conta da luz" → "Conta de luz"
   - "papagaia" ou "pet" → "Pet"
   - "almoço" → "Almoço"
   - SE o usuário mencionar explicitamente uma categoria, USE como descrição
   - NUNCA use "Transação" como descrição - sempre extraia o que foi comprado

4. CATEGORIA_SUGERIDA: Se o usuário mencionar uma categoria explicitamente
   - "use a categoria pet" → "pet"
   - "categoria é casa" → "casa"
   - "categoria alimentação" → "alimentação"
   - Se não mencionar, deixe null

5. MÉTODO DE PAGAMENTO: Identifique como foi pago
   - PIX, CREDITO, DEBITO, DINHEIRO, TRANSFERENCIA
   - Default: PIX

IMPORTANTE:
- Seja inteligente: "papagaia" é um pet, "internet" é conta de casa, "luz" é conta de casa
- A descrição deve ser curta e clara
- NUNCA retorne "Transação" como descrição - isso é muito genérico
- Use o contexto para entender: "minha papagaia, que é minha pet" → descrição: "Pet"

RESPONDA APENAS JSON (sem markdown):
{
  "tipo": "DESPESA" | "RECEITA",
  "valor": "número",
  "descricao": "texto curto",
  "categoriaSugerida": "nome da categoria" | null,
  "metodoPagamento": "PIX" | "CREDITO" | "DEBITO" | "DINHEIRO" | "TRANSFERENCIA"
}`;

    const promptEN = `You are a financial assistant. Extract data from this financial message:

MESSAGE: "${mensagem}"

EXTRACTION RULES:
1. TYPE: Identify if it's EXPENSE (DESPESA) or INCOME (RECEITA)
   - Expenses: spent, paid, bought, bill, etc
   - Income: received, earned, salary, etc

2. AMOUNT: Extract monetary value (numbers only)
   - Examples: "20 reais" → "20", "50.50" → "50.50"

3. DESCRIPTION: Extract WHAT was paid/received (max 3-4 words)
   - "ice cream" → "Ice cream"
   - "lunch" → "Lunch"
   - IF user explicitly mentions a category, USE it as description

4. SUGGESTED_CATEGORY: If user explicitly mentions a category
   - "use pet category" → "pet"
   - "category is food" → "food"
   - If not mentioned, leave null

5. PAYMENT METHOD: Identify how it was paid
   - PIX, CREDITO, DEBITO, DINHEIRO, TRANSFERENCIA
   - Default: PIX

IMPORTANT:
- Be smart: understand context
- Description should be short and clear

RESPOND ONLY JSON (no markdown):
{
  "tipo": "DESPESA" | "RECEITA",
  "valor": "number",
  "descricao": "short text",
  "categoriaSugerida": "category name" | null,
  "metodoPagamento": "PIX" | "CREDITO" | "DEBITO" | "DINHEIRO" | "TRANSFERENCIA"
}`;

    const prompt = idioma === "en-US" ? promptEN : promptPT;

    try {
      console.log(`🤖 Extraindo dados com IA (${idioma})...`);

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 300,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API: ${response.status}`);
      }

      const data = await response.json();
      const resultado = data.content[0].text.trim();
      const jsonLimpo = resultado.replace(/```json|```/g, "").trim();
      const dadosExtraidos = JSON.parse(jsonLimpo);

      console.log(`✅ Dados extraídos pela IA:`, dadosExtraidos);

      const compartilhamento = detectarCompartilhamento(mensagem);
      const parcelamento = detectarParcelamento(mensagem);

      return {
        sucesso: true,
        dados: {
          tipo: dadosExtraidos.tipo,
          valor: dadosExtraidos.valor.toString().replace(",", "."),
          descricao: dadosExtraidos.descricao,
          metodoPagamento: dadosExtraidos.metodoPagamento,
          data: "hoje",
          ehCompartilhado: compartilhamento.ehCompartilhado,
          nomeUsuarioCompartilhado: compartilhamento.nomeUsuario,
          ehParcelado: parcelamento.ehParcelado,
          parcelas: parcelamento.parcelas,
          tipoParcelamento: parcelamento.tipoParcelamento,
          categoriaSugerida: dadosExtraidos.categoriaSugerida,
        },
      };
    } catch (error) {
      console.error("❌ Erro na extração com IA:", error);
      console.log("⚠️ Fallback para extração regex");
      return extrairDadosLancamento(mensagem);
    }
  }

  // Transcrição de áudio
  static async transcreverAudio(audioId: string): Promise<string> {
    console.log(`🎙️ Iniciando transcrição do áudio ID: ${audioId}`);

    if (!validarCredenciaisOpenAI()) {
      throw new Error("OPENAI_API_KEY não configurada");
    }

    try {
      const { WhatsAppService } = await import("./whatsapp.service");
      const audioBuffer = await WhatsAppService.downloadAudio(audioId);

      const audioBlob = new Blob([audioBuffer], { type: "audio/ogg" });
      console.log(`📁 Áudio preparado: audio/ogg, ${audioBlob.size} bytes`);

      const formData = new FormData();
      formData.append("file", audioBlob, "audio.ogg");
      formData.append("model", "whisper-1");
      formData.append("language", "pt");
      formData.append("response_format", "json");

      const transcriptionResponse = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: formData,
        },
      );

      if (!transcriptionResponse.ok) {
        const errorText = await transcriptionResponse.text();
        console.error("❌ Erro na transcrição OpenAI:", errorText);
        throw new Error(`OpenAI API: ${transcriptionResponse.status}`);
      }

      const transcriptionData = await transcriptionResponse.json();
      const textoTranscrito = transcriptionData.text?.trim();

      console.log(`✅ Transcrição bem-sucedida: "${textoTranscrito}"`);

      if (!textoTranscrito) {
        throw new Error("Áudio não pôde ser transcrito ou está vazio");
      }

      return textoTranscrito;
    } catch (error) {
      console.error("💥 Erro completo na transcrição:", error);
      throw error;
    }
  }

  // Detectar comando com IA
  static async detectarComandoComIA(
    mensagem: string,
  ): Promise<ComandoDetectado> {
    if (!validarCredenciaisAnthropic()) {
      const idioma = detectarIdioma(mensagem);
      const comandoManual = detectarComando(mensagem);
      return {
        tipo: comandoManual.tipo,
        idioma,
      };
    }

    const prompt = `Analise esta mensagem e identifique se é um comando específico do sistema financeiro BeCash.

MENSAGEM: "${mensagem}"

COMANDOS SUPORTADOS:
1. LISTAR_CATEGORIAS - Quando o usuário quer ver suas categorias cadastradas
2. VER_SALDO - Quando quer ver seu saldo atual
3. EXTRATO - Quando quer ver extrato/histórico de lançamentos
4. AJUDA - Quando pede ajuda ou não sabe usar
5. NENHUM - Quando não é nenhum comando, mas sim um lançamento financeiro normal

INSTRUÇÕES:
- Identifique a INTENÇÃO do usuário, independente do idioma
- Detecte também o idioma da mensagem (pt-BR, en-US, es-ES, etc)
- Se for um lançamento financeiro, retorne NENHUM
- IMPORTANTE: Se a mensagem contém valores monetários e descrições de compras, é um lançamento (NENHUM)

EXEMPLOS DE LANÇAMENTOS (deve retornar NENHUM):
- "I spent 20 reais on ice cream"
- "Gastei 50 no almoço"
- "I received 1000 salary"
- "Recebi 1000 salário"

EXEMPLOS DE COMANDOS (não deve retornar NENHUM):
- "Which categories do I have?" → LISTAR_CATEGORIAS
- "Help" → AJUDA
- "Show my balance" → VER_SALDO

RESPONDA APENAS NO FORMATO JSON:
{
  "tipo": "LISTAR_CATEGORIAS" | "VER_SALDO" | "EXTRATO" | "AJUDA" | "NENHUM",
  "idioma": "pt-BR" | "en-US" | "es-ES" | "fr-FR" | "de-DE" | etc,
  "confianca": 0.0 a 1.0
}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 150,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API: ${response.status}`);
      }

      const data = await response.json();
      const resultado = data.content[0].text.trim();

      console.log(`🤖 Resposta da IA para comando:`, resultado);

      const jsonLimpo = resultado.replace(/```json|```/g, "").trim();
      const comandoDetectado = JSON.parse(jsonLimpo);

      console.log(`🎯 Comando detectado:`, comandoDetectado);

      if (
        comandoDetectado.confianca < 0.7 ||
        comandoDetectado.tipo === "NENHUM"
      ) {
        return {
          tipo: null,
          idioma: comandoDetectado.idioma || detectarIdioma(mensagem),
        };
      }

      return {
        tipo: comandoDetectado.tipo,
        idioma: comandoDetectado.idioma,
      };
    } catch (error) {
      console.error("Erro ao detectar comando com IA:", error);
      const idioma = detectarIdioma(mensagem);
      const comandoManual = detectarComando(mensagem);
      return {
        tipo: comandoManual.tipo,
        idioma,
      };
    }
  }

  // Limpar descrição com Claude
  static async limparDescricaoComClaude(
    descricaoOriginal: string,
    idioma: string = "pt-BR",
  ): Promise<string> {
    if (!validarCredenciaisAnthropic()) {
      return descricaoOriginal.trim();
    }

    let prompt = "";

    if (idioma === "en-US") {
      prompt = `Analyze this financial transaction description and extract ONLY the name of the establishment, product or service:

ORIGINAL DESCRIPTION: "${descricaoOriginal}"

STRICT RULES:
1. Extract ONLY the name of establishment/product/service
2. COMPLETELY REMOVE:
   - Payment methods (card, credit, debit, cash, nubank, etc.)
   - Monetary values
   - Dates
   - Verbs like "spent", "paid", "received", "bought"
   - Words like "reais", "real", "R$", "dollars", "$"
3. KEEP ONLY 1-2 words that identify WHAT was bought/WHERE it was spent
4. BE CONCISE: maximum 2 words
5. DO NOT INCLUDE payment information, banks or cards

EXAMPLES:
- "uber credit card nubank" → "Uber"
- "supermarket paid 50 reais" → "Supermarket" 
- "lunch at restaurant card" → "Lunch"
- "bought nike shoes installments" → "Nike Shoes"
- "pharmacy drugstore" → "Pharmacy"

CLEANED DESCRIPTION:`;
    } else {
      prompt = `Analise esta descrição de transação financeira e extraia APENAS o nome do estabelecimento, produto ou serviço:

DESCRIÇÃO ORIGINAL: "${descricaoOriginal}"

REGRAS ESTRITAS:
1. EXTRAIA APENAS o nome do estabelecimento/produto/serviço
2. REMOVA COMPLETAMENTE: 
   - Métodos de pagamento (cartão, crédito, débito, pix, nubank, etc.)
   - Valores monetários 
   - Datas
   - Verbos como "gastei", "paguei", "recebi", "comprei"
   - Palavras como "reais", "real", "R$"
3. MANTENHA APENAS 1-2 palavras que identificam O QUE foi comprado/ONDE foi gasto
4. SEJA CONCISO: máximo 2 palavras
5. NÃO INCLUA informações de pagamento, bancos ou cartões

EXEMPLOS:
- "uber cartao credito nubank" → "Uber"
- "mercado paguei 50 reais" → "Mercado" 
- "almoço no restaurante cartao" → "Almoço"
- "comprei tenis nike parcelado" → "Tênis Nike"
- "farmacia drogaria pix" → "Farmácia"

DESCRIÇÃO LIMPA:`;
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 100,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API: ${response.status}`);
      }

      const data = await response.json();
      const descricaoLimpa = data.content[0].text.trim();

      console.log(
        `🧹 Descrição limpa com Claude: "${descricaoOriginal}" → "${descricaoLimpa}"`,
      );

      const termosProibidos = [
        "nubank",
        "credito",
        "debito",
        "cartao",
        "cartão",
        "pix",
        "bb",
        "itau",
        "bradesco",
        "santander",
      ];

      let descricaoValidada = descricaoLimpa;

      termosProibidos.forEach((termo) => {
        const regex = new RegExp(`\\s*${termo}\\s*`, "gi");
        descricaoValidada = descricaoValidada.replace(regex, " ");
      });

      descricaoValidada = descricaoValidada.replace(/\s+/g, " ").trim();

      if (!descricaoValidada || descricaoValidada.length > 30) {
        const palavras = descricaoOriginal.split(/\s+/);
        const palavraSubstantiva = palavras.find(
          (palavra) =>
            palavra.length > 2 &&
            !termosProibidos.some((termo) =>
              palavra.toLowerCase().includes(termo),
            ),
        );

        descricaoValidada = palavraSubstantiva || "Transação";
        console.log(`🔄 Fallback para descrição: "${descricaoValidada}"`);
      }

      if (descricaoValidada.length > 0) {
        descricaoValidada =
          descricaoValidada.charAt(0).toUpperCase() +
          descricaoValidada.slice(1);
      }

      console.log(`✅ Descrição final: "${descricaoValidada}"`);
      return descricaoValidada;
    } catch (error) {
      console.error("Erro ao limpar descrição com Claude:", error);

      const termosProibidos = [
        "nubank",
        "credito",
        "debito",
        "cartao",
        "cartão",
        "pix",
      ];
      const palavras = descricaoOriginal.split(/\s+/);
      const palavraSubstantiva = palavras.find(
        (palavra) =>
          palavra.length > 2 &&
          !termosProibidos.some((termo) =>
            palavra.toLowerCase().includes(termo),
          ),
      );

      return palavraSubstantiva
        ? palavraSubstantiva.charAt(0).toUpperCase() +
            palavraSubstantiva.slice(1)
        : "Transação";
    }
  }

  // Escolher melhor categoria
  static async escolherMelhorCategoria(
    descricao: string,
    categorias: any[],
    tipo: string,
    categoriaSugerida?: string,
  ) {
    if (!validarCredenciaisAnthropic()) {
      if (categoriaSugerida) {
        console.log(`🎯 Usuário sugeriu categoria: "${categoriaSugerida}"`);

        const categoriaExata = categorias.find(
          (c) =>
            c.tipo === tipo &&
            c.nome.toLowerCase() === categoriaSugerida.toLowerCase(),
        );

        if (categoriaExata) {
          console.log(
            `✅ Usando categoria sugerida pelo usuário: ${categoriaExata.nome}`,
          );
          return categoriaExata;
        }

        const categoriaSimilar = categorias.find(
          (c) =>
            c.tipo === tipo &&
            c.nome.toLowerCase().includes(categoriaSugerida.toLowerCase()),
        );

        if (categoriaSimilar) {
          console.log(
            `✅ Usando categoria similar à sugerida: ${categoriaSimilar.nome}`,
          );
          return categoriaSimilar;
        }
      }

      const categoriasFiltradas = categorias.filter((c) => c.tipo === tipo);
      return categoriasFiltradas.length > 0 ? categoriasFiltradas[0] : null;
    }

    const categoriasFiltradas = categorias.filter((c) => c.tipo === tipo);

    if (categoriasFiltradas.length === 0) {
      return null;
    }

    let prompt = `Analise a descrição "${descricao}" e escolha a categoria mais adequada entre estas opções:`;

    if (categoriaSugerida) {
      prompt += `\n\nIMPORTANTE: O usuário sugeriu a categoria "${categoriaSugerida}". PRIORIZE esta categoria se estiver disponível.`;
    }

    prompt += `\n\nCATEGORIAS DISPONÍVEIS:\n${categoriasFiltradas.map((c, i) => `${i + 1}. ${c.nome}`).join("\n")}`;

    prompt += `\n\nINSTRUÇÕES:\n- Escolha APENAS o nome da categoria mais adequada\n- Não explique, não dê justificativas\n- Retorne apenas o nome exato da categoria escolhida\n- Se o usuário sugeriu uma categoria e ela estiver disponível, USE-A`;

    prompt += `\n\nRESPOSTA (apenas o nome da categoria):`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 100,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API: ${response.status}`);
      }

      const data = await response.json();
      const categoriaEscolhida = data.content[0].text.trim();

      return (
        categoriasFiltradas.find(
          (c) => c.nome.toLowerCase() === categoriaEscolhida.toLowerCase(),
        ) || categoriasFiltradas[0]
      );
    } catch (error) {
      console.error("Erro ao escolher categoria com IA:", error);

      if (categoriaSugerida) {
        const categoriaFallback = categoriasFiltradas.find((c) =>
          c.nome.toLowerCase().includes(categoriaSugerida.toLowerCase()),
        );
        if (categoriaFallback) {
          console.log(
            `🔄 Fallback para categoria sugerida: ${categoriaFallback.nome}`,
          );
          return categoriaFallback;
        }
      }

      return categoriasFiltradas[0];
    }
  }

  // Gerar mensagem com IA
  static async gerarMensagemComIA(
    template: string,
    dados: any,
    idioma: string,
  ): Promise<string> {
    if (!validarCredenciaisAnthropic()) {
      return template;
    }

    const prompt = `Você é o assistente financeiro BeCash. Gere uma mensagem profissional no idioma ${idioma}.

TEMPLATE BASE (em português):
${template}

DADOS PARA PREENCHER:
${JSON.stringify(dados, null, 2)}

INSTRUÇÕES:
1. Traduza TODA a mensagem para ${idioma}
2. Mantenha a estrutura e formatação (emojis, negrito, separadores)
3. Adapte culturalmente (formato de moeda, datas)
4. Seja profissional e conciso
5. Use formato WhatsApp (markdown simples)

RESPONDA APENAS COM A MENSAGEM TRADUZIDA:`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API: ${response.status}`);
      }

      const data = await response.json();
      return data.content[0].text.trim();
    } catch (error) {
      console.error("Erro ao gerar mensagem com IA:", error);
      return template;
    }
  }
}
