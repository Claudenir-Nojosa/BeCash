// app/api/webhooks/whatsapp/services/conversation-redis.service.ts
import { 
  redisGet, 
  redisSet, 
  redisDel, 
  redisExists 
} from '@/lib/redis';
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
  idioma?: string;
  lastIntent?: string;
}

export class ConversationRedisService {
  private static readonly PREFIX = 'conv:';
  private static readonly TTL = 1800; // 30 minutos em segundos

  // Obter contexto da conversa
  static async getContext(userPhone: string): Promise<ConversationContext | null> {
    const key = `${this.PREFIX}${userPhone}`;
    
    try {
      const context = await redisGet(key);
      
      if (!context) {
        console.log(`📭 Nenhum contexto encontrado para ${userPhone}`);
        return null;
      }

      // Verificar se o contexto expirou (redundante com TTL do Redis, mas seguro)
      const TIMEOUT = 30 * 60 * 1000; // 30 minutos
      if (Date.now() - context.lastInteraction > TIMEOUT) {
        console.log(`⏰ Contexto expirado para ${userPhone}`);
        await this.clearContext(userPhone);
        return null;
      }

      console.log(`✅ Contexto recuperado: ${context.messages?.length || 0} mensagens`);
      return context;
    } catch (error) {
      console.error(`❌ Erro ao buscar contexto para ${userPhone}:`, error);
      return null;
    }
  }

  // Criar novo contexto
  static async createContext(
    userId: string,
    userPhone: string
  ): Promise<ConversationContext> {
    const key = `${this.PREFIX}${userPhone}`;
    
    const context: ConversationContext = {
      userId,
      userPhone,
      messages: [],
      lastInteraction: Date.now(),
    };

    await redisSet(key, context, this.TTL);
    console.log(`✨ Novo contexto criado para ${userPhone}`);

    return context;
  }

  // Adicionar mensagem ao contexto
  static async addMessage(
    userPhone: string,
    role: "user" | "assistant",
    content: string
  ) {
    const key = `${this.PREFIX}${userPhone}`;
    
    try {
      let context = await this.getContext(userPhone);
      
      if (!context) {
        console.log(`⚠️ Contexto não existe, mas adicionando mensagem isolada`);
        return;
      }

      // Adicionar mensagem
      context.messages.push({
        role,
        content,
        timestamp: Date.now(),
      });

      // Atualizar última interação
      context.lastInteraction = Date.now();

      // Limitar histórico a últimas 20 mensagens para economizar espaço
      if (context.messages.length > 20) {
        context.messages = context.messages.slice(-20);
      }

      // Salvar de volta no Redis
      await redisSet(key, context, this.TTL);
      
      console.log(`💬 Mensagem adicionada: ${role} - "${content.substring(0, 50)}..."`);
    } catch (error) {
      console.error(`❌ Erro ao adicionar mensagem para ${userPhone}:`, error);
    }
  }

  // Salvar transação pendente no contexto
  static async setPendingTransaction(
    userPhone: string,
    dados: DadosLancamento,
    categoriaEscolhida: any,
    descricaoLimpa: string,
    cartaoEncontrado?: any
  ) {
    const key = `${this.PREFIX}${userPhone}`;
    
    try {
      let context = await this.getContext(userPhone);
      if (!context) {
        console.log(`⚠️ Contexto não existe para salvar transação pendente`);
        return;
      }

      // Atualizar transação pendente
      context.pendingTransaction = {
        dados,
        categoriaEscolhida,
        descricaoLimpa,
        cartaoEncontrado,
        timestamp: Date.now(),
      };

      context.lastInteraction = Date.now();
      
      // Salvar de volta
      await redisSet(key, context, this.TTL);
      
      console.log(`💾 Transação pendente salva no contexto`);
    } catch (error) {
      console.error(`❌ Erro ao salvar transação pendente para ${userPhone}:`, error);
    }
  }

  // Obter transação pendente
  static async getPendingTransaction(userPhone: string) {
    const context = await this.getContext(userPhone);
    
    if (!context || !context.pendingTransaction) {
      return null;
    }

    // Verificar expiração (5 minutos)
    const TIMEOUT = 5 * 60 * 1000;
    if (Date.now() - context.pendingTransaction.timestamp > TIMEOUT) {
      console.log(`⏰ Transação pendente expirada para ${userPhone}`);
      await this.clearPendingTransaction(userPhone);
      return null;
    }

    return context.pendingTransaction;
  }

  // Limpar transação pendente
  static async clearPendingTransaction(userPhone: string) {
    const key = `${this.PREFIX}${userPhone}`;
    
    try {
      const context = await this.getContext(userPhone);
      if (context) {
        context.pendingTransaction = undefined;
        await redisSet(key, context, this.TTL);
        console.log(`🗑️ Transação pendente removida do contexto`);
      }
    } catch (error) {
      console.error(`❌ Erro ao limpar transação pendente para ${userPhone}:`, error);
    }
  }

  // Limpar contexto completamente
  static async clearContext(userPhone: string) {
    const key = `${this.PREFIX}${userPhone}`;
    
    try {
      await redisDel(key);
      console.log(`🗑️ Contexto completamente limpo para ${userPhone}`);
    } catch (error) {
      console.error(`❌ Erro ao limpar contexto para ${userPhone}:`, error);
    }
  }

  // Obter histórico formatado para IA
  static async getFormattedHistory(userPhone: string): Promise<string> {
    const context = await this.getContext(userPhone);
    
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

  // Salvar idioma preferido
  static async setIdioma(userPhone: string, idioma: string) {
    const key = `${this.PREFIX}${userPhone}`;
    
    try {
      const context = await this.getContext(userPhone);
      if (context) {
        context.idioma = idioma;
        await redisSet(key, context, this.TTL);
      }
    } catch (error) {
      console.error(`❌ Erro ao salvar idioma para ${userPhone}:`, error);
    }
  }

  // Salvar última intenção detectada
  static async setLastIntent(userPhone: string, intent: string) {
    const key = `${this.PREFIX}${userPhone}`;
    
    try {
      const context = await this.getContext(userPhone);
      if (context) {
        context.lastIntent = intent;
        await redisSet(key, context, this.TTL);
      }
    } catch (error) {
      console.error(`❌ Erro ao salvar intenção para ${userPhone}:`, error);
    }
  }

  // Estatísticas do contexto
  static async getStats(userPhone: string) {
    const context = await this.getContext(userPhone);
    
    if (!context) {
      return null;
    }

    return {
      totalMessages: context.messages.length,
      hasPending: !!context.pendingTransaction,
      lastInteraction: new Date(context.lastInteraction).toLocaleString("pt-BR"),
      userId: context.userId,
      idioma: context.idioma,
      lastIntent: context.lastIntent,
    };
  }

  // Verificar se contexto existe
  static async exists(userPhone: string): Promise<boolean> {
    const key = `${this.PREFIX}${userPhone}`;
    return await redisExists(key);
  }
}