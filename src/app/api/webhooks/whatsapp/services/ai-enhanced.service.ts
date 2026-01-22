// app/api/webhooks/whatsapp/services/ai-enhanced.service.ts

import { ResultadoExtracao, DadosLancamento } from "../types";
import { validarCredenciaisAnthropic } from "../utils/validators";
import { ConversationRedisService } from "./conversation.service";

export interface IntencaoUsuario {
  tipo:
    | "CRIAR_LANCAMENTO" // Novo lançamento
    | "CONFIRMAR_LANCAMENTO" // Confirmando lançamento pendente
    | "CANCELAR_LANCAMENTO" // Cancelando lançamento pendente
    | "COMANDO_CATEGORIAS" // Listar categorias
    | "COMANDO_AJUDA" // Pedir ajuda
    | "DUVIDA_GERAL" // Dúvida/pergunta
    | "INDEFINIDO"; // Não conseguiu identificar

  confianca: number; // 0.0 a 1.0
  explicacao: string;

  // Se for confirmação/cancelamento
  ehConfirmacao?: boolean;
  ehCancelamento?: boolean;

  // Se for correção
  campoParaCorrigir?: "valor" | "descricao" | "categoria" | "metodo" | "data";
  novoValor?: string;
}

export class EnhancedAIService {
  /**
   * FUNÇÃO PRINCIPAL: Analisa intenção do usuário usando contexto completo
   */
  static async analisarIntencaoComContexto(
    mensagemAtual: string,
    userPhone: string,
    idioma: string = "pt-BR",
  ): Promise<IntencaoUsuario> {
    if (!validarCredenciaisAnthropic()) {
      console.log("⚠️ API Anthropic não disponível, usando fallback");
      return this.fallbackIntencao(mensagemAtual, userPhone);
    }

    const historico =
      await ConversationRedisService.getFormattedHistory(userPhone);
    const pendente =
      await ConversationRedisService.getPendingTransaction(userPhone);

    const temPendente = !!pendente;

    const prompt = this.construirPromptIntencao(
      mensagemAtual,
      historico,
      temPendente,
      idioma,
      pendente,
    );

    try {
      console.log("🤖 Analisando intenção com Claude...");

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API: ${response.status}`);
      }

      const data = await response.json();
      const resultado = data.content[0].text.trim();
      const jsonLimpo = resultado.replace(/```json|```/g, "").trim();
      const intencao: IntencaoUsuario = JSON.parse(jsonLimpo);

      console.log("✅ Intenção detectada:", intencao);
      return intencao;
    } catch (error) {
      console.error("❌ Erro ao analisar intenção:", error);
      return this.fallbackIntencao(mensagemAtual, userPhone);
    }
  }

  /**
   * Constrói prompt para análise de intenção
   */
  private static construirPromptIntencao(
    mensagemAtual: string,
    historico: string,
    temPendente: boolean,
    idioma: string,
    dadosPendente?: any,
  ): string {
    const promptBase = `Você é o assistente financeiro BeCash. Analise a INTENÇÃO do usuário nesta conversa.

MENSAGEM ATUAL DO USUÁRIO:
"${mensagemAtual}"

HISTÓRICO DA CONVERSA:
${historico}

STATUS ATUAL:
${
  temPendente
    ? `⚠️ EXISTE UM LANÇAMENTO AGUARDANDO CONFIRMAÇÃO:
- Descrição: ${dadosPendente?.descricaoLimpa || "N/A"}
- Valor: R$ ${dadosPendente?.dados?.valor || "N/A"}
- Categoria: ${dadosPendente?.categoriaEscolhida?.nome || "N/A"}
- Método: ${dadosPendente?.dados?.metodoPagamento || "N/A"}
`
    : "✅ Nenhum lançamento pendente"
}

IDIOMA PREFERIDO: ${idioma}

SUA TAREFA:
Identifique a INTENÇÃO EXATA do usuário. Seja INTELIGENTE e use o CONTEXTO.

TIPOS DE INTENÇÃO POSSÍVEIS:

1. **CONFIRMAR_LANCAMENTO** - Usuário está confirmando o lançamento pendente
   - Exemplos: "sim", "confirma", "ok", "pode ser", "isso mesmo", "correto", "yes", "confirm"
   - ⚠️ IMPORTANTE: Só use se REALMENTE houver lançamento pendente

2. **CANCELAR_LANCAMENTO** - Usuário está cancelando o lançamento pendente
   - Exemplos: "não", "cancela", "esquece", "deixa pra lá", "no", "cancel"
   - ⚠️ IMPORTANTE: Só use se REALMENTE houver lançamento pendente

3. **CORRIGIR_LANCAMENTO** - Usuário quer corrigir algo no lançamento pendente
   - Exemplos: "na verdade o valor é 100", "não, foi no cartão", "a categoria tá errada"
   - ⚠️ IMPORTANTE: Identifique qual campo ele quer corrigir

4. **CRIAR_LANCAMENTO** - Usuário quer criar um NOVO lançamento
   - Exemplos: "gastei 50 no almoço", "comprei 200 de roupa", "recebi 1000 de salário"
   - ⚠️ IMPORTANTE: Mensagens com valores monetários geralmente são novos lançamentos

5. **COMANDO_CATEGORIAS** - Usuário quer ver suas categorias
   - Exemplos: "quais categorias tenho?", "mostra minhas categorias", "list categories"

6. **COMANDO_AJUDA** - Usuário pede ajuda
   - Exemplos: "ajuda", "help", "como funciona?", "não entendi"

7. **DUVIDA_GERAL** - Pergunta/dúvida sobre o sistema
   - Exemplos: "como faço para...", "posso fazer...?", "o que acontece se..."

8. **INDEFINIDO** - Não conseguiu identificar claramente

REGRAS CRÍTICAS:
- Se há lançamento pendente E a mensagem é curta (1-3 palavras), provavelmente é confirmação/cancelamento
- Se há lançamento pendente MAS a mensagem tem VALOR MONETÁRIO novo, é NOVO LANÇAMENTO
- Use o HISTÓRICO para entender o contexto
- Considere variações de idioma (pt-BR, en-US)
- Se há lançamento pendente e usuário diz algo como "não, o valor é X", é CORREÇÃO

RESPONDA APENAS JSON:
{
  "tipo": "CONFIRMAR_LANCAMENTO" | "CANCELAR_LANCAMENTO" | "CORRIGIR_LANCAMENTO" | "CRIAR_LANCAMENTO" | "COMANDO_CATEGORIAS" | "COMANDO_AJUDA" | "DUVIDA_GERAL" | "INDEFINIDO",
  "confianca": 0.0 a 1.0,
  "explicacao": "breve explicação da sua decisão",
  "ehConfirmacao": true | false | null,
  "ehCancelamento": true | false | null,
  "campoParaCorrigir": "valor" | "descricao" | "categoria" | "metodo" | "data" | null,
  "novoValor": "novo valor se for correção" | null
}`;

    return promptBase;
  }

  /**
   * Fallback quando IA não está disponível
   */
  private static fallbackIntencao(
    mensagem: string,
    userPhone: string,
  ): IntencaoUsuario {
    const msgLower = mensagem.toLowerCase().trim();
    const pendente = ConversationRedisService.getPendingTransaction(userPhone);
    const temPendente = !!pendente;

    // Se tem pendente e mensagem é curta
    if (temPendente && mensagem.split(" ").length <= 3) {
      const confirmacoes = ["sim", "s", "yes", "ok", "confirma", "pode", "✅"];
      const cancelamentos = ["não", "nao", "no", "n", "cancela", "❌"];

      if (confirmacoes.some((c) => msgLower.includes(c))) {
        return {
          tipo: "CONFIRMAR_LANCAMENTO",
          confianca: 0.8,
          explicacao: "Mensagem curta de confirmação detectada",
          ehConfirmacao: true,
        };
      }

      if (cancelamentos.some((c) => msgLower.includes(c))) {
        return {
          tipo: "CANCELAR_LANCAMENTO",
          confianca: 0.8,
          explicacao: "Mensagem curta de cancelamento detectada",
          ehCancelamento: true,
        };
      }
    }

    // Detectar novos lançamentos
    if (
      /\d+/.test(mensagem) &&
      (msgLower.includes("gastei") ||
        msgLower.includes("spent") ||
        msgLower.includes("paguei"))
    ) {
      return {
        tipo: "CRIAR_LANCAMENTO",
        confianca: 0.7,
        explicacao: "Mensagem com valor monetário detectada",
      };
    }

    // Comandos
    if (msgLower.includes("categoria") || msgLower.includes("categories")) {
      return {
        tipo: "COMANDO_CATEGORIAS",
        confianca: 0.9,
        explicacao: "Comando de listar categorias detectado",
      };
    }

    if (msgLower.includes("ajuda") || msgLower.includes("help")) {
      return {
        tipo: "COMANDO_AJUDA",
        confianca: 0.9,
        explicacao: "Comando de ajuda detectado",
      };
    }

    return {
      tipo: "INDEFINIDO",
      confianca: 0.3,
      explicacao: "Não foi possível identificar intenção claramente",
    };
  }

  /**
   * Extração completa com contexto e análise profunda
   */
  static async extrairDadosCompleto(
    mensagem: string,
    categorias: any[],
    idioma: string = "pt-BR",
  ): Promise<ResultadoExtracao> {
    if (!validarCredenciaisAnthropic()) {
      console.log("⚠️ Usando fallback de extração");
      return { sucesso: false, erro: "IA não disponível" };
    }

    const prompt = `Você é um extrator de dados financeiros ULTRA PRECISO. Analise esta mensagem e extraia TODOS os dados.

MENSAGEM: "${mensagem}"

CATEGORIAS DISPONÍVEIS DO USUÁRIO:
${categorias.map((c) => `- ${c.nome} (${c.tipo})`).join("\n")}

IDIOMA: ${idioma}

SUAS TAREFAS:

1. **TIPO**: DESPESA ou RECEITA
   - Analise o contexto da mensagem
   - "gastei", "paguei", "comprei" → DESPESA
   - "recebi", "ganhei", "salário" → RECEITA

2. **VALOR**: Extraia o valor monetário
   - "50 reais" → "50.00"
   - "R$ 104,20" → "104.20"
   - "twenty dollars" → "20.00"

3. **DESCRIÇÃO**: O QUE foi comprado/recebido (2-4 palavras)
   - "almoço no restaurante" → "Almoço"
   - "uber para casa" → "Uber"
   - "conta de internet" → "Internet"
   - NUNCA use "Transação" - seja específico

4. **CATEGORIA**: Escolha a MELHOR categoria da lista
   - Compare a descrição com as categorias disponíveis
   - Use a categoria mais específica
   - Se usuário mencionar categoria explicitamente, USE ELA

5. **MÉTODO DE PAGAMENTO**:
   - CREDITO: cartão de crédito, parcelado, fatura
   - DEBITO: cartão de débito
   - PIX: pix, transferência instantânea
   - DINHEIRO: dinheiro, cash, efetivo
   - TRANSFERENCIA: transferência bancária
   - Default: PIX

6. **PARCELAMENTO**:
   - Detecte: "parcelado em 3x", "3 vezes", "6x"
   - Se detectado, método DEVE ser CREDITO

7. **COMPARTILHAMENTO**:
   - Detecte: "compartilhado com Maria", "dividir com João"
   - Extraia nome do usuário
   - Detecte divisão personalizada:
     * "minha parte é 60%" → porcentagem
     * "eu pago 30 reais" → valor fixo
     * "meio a meio" → metade (50/50)

8. **DATA**: 
   - Default: "hoje"
   - Se mencionar "ontem", "amanhã", etc, extraia

RESPONDA APENAS JSON:
{
  "tipo": "DESPESA" | "RECEITA",
  "valor": "número como string",
  "descricao": "texto curto",
  "categoriaId": "id da categoria escolhida",
  "categoriaNome": "nome da categoria escolhida",
  "metodoPagamento": "CREDITO" | "DEBITO" | "PIX" | "DINHEIRO" | "TRANSFERENCIA",
  "data": "hoje" | "ontem" | "DD/MM/YYYY",
  "ehParcelado": boolean,
  "parcelas": number | null,
  "ehCompartilhado": boolean,
  "nomeUsuarioCompartilhado": string | null,
  "tipoDivisao": "metade" | "porcentagem" | "valor_fixo" | null,
  "porcentagemUsuario": number | null,
  "valorUsuario": number | null,
  "confianca": 0.0 a 1.0,
  "observacoes": "qualquer observação relevante"
}`;

    try {
      console.log("🤖 Extraindo dados com Claude Sonnet 4");

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
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

      console.log("✅ Dados extraídos com sucesso:", dadosExtraidos);

      if (dadosExtraidos.confianca < 0.6) {
        return {
          sucesso: false,
          erro: `Confiança baixa (${dadosExtraidos.confianca}): ${dadosExtraidos.observacoes}`,
        };
      }

      // Montar DadosLancamento
      const dados: DadosLancamento = {
        tipo: dadosExtraidos.tipo,
        valor: dadosExtraidos.valor,
        descricao: dadosExtraidos.descricao,
        metodoPagamento: dadosExtraidos.metodoPagamento,
        data: dadosExtraidos.data,
        categoriaSugerida: dadosExtraidos.categoriaNome,
        ehParcelado: dadosExtraidos.ehParcelado,
        parcelas: dadosExtraidos.parcelas,
        ehCompartilhado: dadosExtraidos.ehCompartilhado,
        nomeUsuarioCompartilhado: dadosExtraidos.nomeUsuarioCompartilhado,
        tipoDivisao: dadosExtraidos.tipoDivisao,
        porcentagemUsuario: dadosExtraidos.porcentagemUsuario,
        valorUsuario: dadosExtraidos.valorUsuario,
      };

      return {
        sucesso: true,
        dados,
      };
    } catch (error) {
      console.error("❌ Erro na extração:", error);
      return {
        sucesso: false,
        erro: `Erro ao processar: ${error}`,
      };
    }
  }

  /**
   * Limpar e melhorar descrição
   */
  static async limparDescricao(
    descricao: string,
    idioma: string = "pt-BR",
  ): Promise<string> {
    if (!validarCredenciaisAnthropic()) {
      return descricao.trim();
    }

    const prompt = `Limpe esta descrição financeira, removendo informações desnecessárias:

DESCRIÇÃO ORIGINAL: "${descricao}"

REGRAS:
- REMOVA: métodos de pagamento, bancos, cartões, valores, datas
- MANTENHA: apenas o essencial (nome do produto/serviço/estabelecimento)
- MÁXIMO: 2-3 palavras
- CAPITALIZE: primeira letra

EXEMPLOS:
"uber cartão nubank credito" → "Uber"
"mercado paguei 50 reais pix" → "Mercado"
"almoço no restaurante italiano" → "Almoço"

RESPONDA APENAS A DESCRIÇÃO LIMPA (sem explicações):`;

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
          max_tokens: 50,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) throw new Error("Claude API falhou");

      const data = await response.json();
      const limpa = data.content[0].text.trim();

      console.log(`🧹 Descrição limpa: "${descricao}" → "${limpa}"`);
      return limpa;
    } catch (error) {
      console.error("❌ Erro ao limpar descrição:", error);
      return descricao.trim();
    }
  }
}
