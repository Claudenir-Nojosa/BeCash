// app/api/webhooks/whatsapp/services/conversation.service.ts

import { DadosLancamento } from "../types";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ConversationContext {
  userId: string;
  userPhone: string;
  messages: ConversationMessage[];
  pendingTransaction?: {
    dados: DadosLancamento;
    categoriaEscolhida: any;
    descricaoLimpa: string;
    cartaoEncontrado?: any;
    timestamp: number;
  };
  lastInteraction: number;
}

// Cache de conversas por telefone
declare global {
  var conversationContexts: Map<string, ConversationContext> | undefined;
}

export class ConversationService {
  // Inicializar cache global
  private static initCache() {
    if (!global.conversationContexts) {
      global.conversationContexts = new Map();
      console.log("🔄 Cache de conversas inicializado");
    }
  }

  // Obter contexto da conversa
  static getContext(userPhone: string): ConversationContext | null {
    this.initCache();
    console.log(`🔍 Buscando contexto para: ${userPhone}`);
    console.log(
      `🔍 Total de contextos no cache: ${global.conversationContexts!.size}`,
    );
    console.log(
      `🔍 Chaves no cache:`,
      Array.from(global.conversationContexts!.keys()),
    );
    const context = global.conversationContexts!.get(userPhone);

    if (!context) {
      console.log(`📭 Nenhum contexto encontrado para ${userPhone}`);
      return null;
    }

    // Verificar se o contexto expirou (30 minutos de inatividade)
    const TIMEOUT = 30 * 60 * 1000;
    if (Date.now() - context.lastInteraction > TIMEOUT) {
      console.log(`⏰ Contexto expirado para ${userPhone}`);
      this.clearContext(userPhone);
      return null;
    }

    console.log(`✅ Contexto recuperado: ${context.messages.length} mensagens`);
    return context;
  }

  // Criar novo contexto
  static createContext(userId: string, userPhone: string): ConversationContext {
    this.initCache();

    const context: ConversationContext = {
      userId,
      userPhone,
      messages: [],
      lastInteraction: Date.now(),
    };

    global.conversationContexts!.set(userPhone, context);
    console.log(`✨ Novo contexto criado para ${userPhone}`);

    return context;
  }

  // Adicionar mensagem ao contexto
  static addMessage(
    userPhone: string,
    role: "user" | "assistant",
    content: string,
  ) {
    this.initCache();

    let context = this.getContext(userPhone);

    if (!context) {
      console.log(`⚠️ Contexto não existe, mas adicionando mensagem isolada`);
      return;
    }

    context.messages.push({
      role,
      content,
      timestamp: Date.now(),
    });

    context.lastInteraction = Date.now();

    // Limitar histórico a últimas 20 mensagens para economizar tokens
    if (context.messages.length > 20) {
      context.messages = context.messages.slice(-20);
    }

    global.conversationContexts!.set(userPhone, context);
    console.log(
      `💬 Mensagem adicionada: ${role} - "${content.substring(0, 50)}..."`,
    );
  }

  // Salvar transação pendente no contexto
  static setPendingTransaction(
    userPhone: string,
    dados: DadosLancamento,
    categoriaEscolhida: any,
    descricaoLimpa: string,
    cartaoEncontrado?: any,
  ) {
    this.initCache();

    let context = this.getContext(userPhone);
    if (!context) {
      console.log(`⚠️ Contexto não existe para salvar transação pendente`);
      return;
    }

    context.pendingTransaction = {
      dados,
      categoriaEscolhida,
      descricaoLimpa,
      cartaoEncontrado,
      timestamp: Date.now(),
    };

    context.lastInteraction = Date.now();
    global.conversationContexts!.set(userPhone, context);

    console.log(`💾 Transação pendente salva no contexto`);
  }

  // Obter transação pendente
  static getPendingTransaction(userPhone: string) {
    const context = this.getContext(userPhone);

    if (!context || !context.pendingTransaction) {
      return null;
    }

    // Verificar expiração (5 minutos)
    const TIMEOUT = 5 * 60 * 1000;
    if (Date.now() - context.pendingTransaction.timestamp > TIMEOUT) {
      console.log(`⏰ Transação pendente expirada`);
      context.pendingTransaction = undefined;
      global.conversationContexts!.set(userPhone, context);
      return null;
    }

    return context.pendingTransaction;
  }

  // Limpar transação pendente
  static clearPendingTransaction(userPhone: string) {
    this.initCache();

    const context = this.getContext(userPhone);
    if (context) {
      context.pendingTransaction = undefined;
      global.conversationContexts!.set(userPhone, context);
      console.log(`🗑️ Transação pendente removida do contexto`);
    }
  }

  // Limpar contexto completamente
  static clearContext(userPhone: string) {
    this.initCache();
    global.conversationContexts!.delete(userPhone);
    console.log(`🗑️ Contexto completamente limpo para ${userPhone}`);
  }

  // Obter histórico formatado para IA
  static getFormattedHistory(userPhone: string): string {
    const context = this.getContext(userPhone);

    if (!context || context.messages.length === 0) {
      return "Nenhum histórico de conversa.";
    }

    return context.messages
      .map((msg) => {
        const role = msg.role === "user" ? "Usuário" : "Assistente";
        return `${role}: ${msg.content}`;
      })
      .join("\n");
  }

  // Estatísticas do contexto
  static getStats(userPhone: string) {
    const context = this.getContext(userPhone);

    if (!context) {
      return null;
    }

    return {
      totalMessages: context.messages.length,
      hasPending: !!context.pendingTransaction,
      lastInteraction: new Date(context.lastInteraction).toLocaleString(
        "pt-BR",
      ),
      userId: context.userId,
    };
  }
}
