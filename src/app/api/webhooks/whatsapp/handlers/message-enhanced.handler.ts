// app/api/webhooks/whatsapp/handlers/message-enhanced.handler.ts

import { UserService } from "../services/user.service";
import { WhatsAppService } from "../services/whatsapp.service";
import { LancamentoService } from "../services/lancamento.service";
import { ConversationRedisService } from "../services/conversation.service";
import { EnhancedAIService } from "../services/ai-enhanced.service";
import { normalizarTelefone } from "../utils/validators";

export class EnhancedMessageHandler {
  /**
   * FLUXO PRINCIPAL - Processa qualquer mensagem de texto
   */
  static async processarMensagem(message: any) {
    const userMessage = message.text?.body;
    const userPhone = message.from;
    const messageId = message.id;

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📨 NOVA MENSAGEM RECEBIDA");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("👤 De:", userPhone);
    console.log("💬 Texto:", userMessage);
    console.log("🆔 ID:", messageId);

    // 1. BUSCAR USUÁRIO
    const session = await UserService.getUserByPhone(userPhone);
    if (!session) {
      await WhatsAppService.sendMessage(
        userPhone,
        "❌ Seu número não está vinculado a nenhuma conta.\n\n💡 Acesse o app BeCash e vincule seu WhatsApp.",
      );
      return { status: "user_not_found" };
    }

    const userId = session.user.id;
    const idioma = session.idiomaPreferido || "pt-BR";
    const telefoneBusca = normalizarTelefone(userPhone);

    console.log("✅ Usuário:", session.user.name);
    console.log("🌐 Idioma:", idioma);

    // 2. GARANTIR CONTEXTO DA CONVERSA
    let context = await ConversationRedisService.getContext(telefoneBusca); // ADICIONE AWAIT
    if (!context) {
      context = await ConversationRedisService.createContext(
        userId,
        telefoneBusca,
      ); // ADICIONE AWAIT
      console.log("✨ Novo contexto criado");
    }

    // 3. ADICIONAR MENSAGEM DO USUÁRIO AO HISTÓRICO
    await ConversationRedisService.addMessage(
      telefoneBusca,
      "user",
      userMessage,
    ); // ADICIONE AWAIT

    // 4. ANALISAR INTENÇÃO COM IA (usando contexto completo)
    console.log("\n🤖 ANALISANDO INTENÇÃO COM IA...");
    const intencao = await EnhancedAIService.analisarIntencaoComContexto(
      userMessage,
      telefoneBusca,
      idioma,
    );

    console.log("🎯 Intenção detectada:", intencao.tipo);
    console.log("📊 Confiança:", intencao.confianca);
    console.log("💭 Explicação:", intencao.explicacao);

    // 5. EXECUTAR AÇÃO BASEADO NA INTENÇÃO
    let resultado;

    switch (intencao.tipo) {
      case "CONFIRMAR_LANCAMENTO":
        resultado = await this.confirmarLancamento(telefoneBusca, idioma);
        break;

      case "CANCELAR_LANCAMENTO":
        resultado = await this.cancelarLancamento(telefoneBusca, idioma);
        break;

      case "CRIAR_LANCAMENTO":
        resultado = await this.criarNovoLancamento(
          userMessage,
          userId,
          telefoneBusca,
          idioma,
        );
        break;

      case "COMANDO_CATEGORIAS":
        resultado = await this.listarCategorias(userId, telefoneBusca, idioma);
        break;

      case "COMANDO_AJUDA":
        resultado = await this.enviarAjuda(telefoneBusca, idioma);
        break;

      case "DUVIDA_GERAL":
        resultado = await this.responderDuvida(
          userMessage,
          telefoneBusca,
          idioma,
        );
        break;

      case "INDEFINIDO":
      default:
        resultado = await this.tratarIndefinido(
          userMessage,
          telefoneBusca,
          idioma,
        );
        break;
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ PROCESSAMENTO CONCLUÍDO");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    return resultado;
  }

  /**
   * CONFIRMAR LANÇAMENTO
   */
  private static async confirmarLancamento(userPhone: string, idioma: string) {
    console.log("✅ Confirmando lançamento...");

    const pendente =
      await ConversationRedisService.getPendingTransaction(userPhone); // ADICIONE AWAIT
    const context = await ConversationRedisService.getContext(userPhone); // ADICIONE AWAIT

    console.log("🔍 Dados do pendente:", {
      temPendente: !!pendente,
      dados: pendente?.dados,
      categoria: pendente?.categoriaEscolhida?.nome,
      descricao: pendente?.descricaoLimpa,
      cartao: pendente?.cartaoEncontrado
        ? {
            nome: pendente.cartaoEncontrado.nome,
            id: pendente.cartaoEncontrado.id,
          }
        : "Nenhum cartão encontrado",
    });

    if (!pendente) {
      const msg =
        idioma === "en-US"
          ? "❌ No transaction pending to confirm.\n\n💡 Send a new transaction."
          : "❌ Nenhuma transação pendente para confirmar.\n\n💡 Envie uma nova transação.";

      await WhatsAppService.sendMessage(userPhone, msg);
      await ConversationRedisService.addMessage(userPhone, "assistant", msg); // ADICIONE AWAIT
      return { status: "no_pending" };
    }

    try {
      // Pegar userId do contexto - isso é mais seguro
      const userIdParaLancamento = context?.userId;

      if (!userIdParaLancamento) {
        throw new Error("User ID not found in context");
      }

      console.log("📤 Passando para createLancamento:", {
        userId: userIdParaLancamento,
        dados: pendente.dados,
        categoria: pendente.categoriaEscolhida.nome,
        descricaoLimpa: pendente.descricaoLimpa,
        cartao: pendente.cartaoEncontrado?.nome || "null",
      });

      // Criar lançamento no banco
      const resultado = await LancamentoService.createLancamento(
        userIdParaLancamento,
        pendente.dados,
        pendente.categoriaEscolhida,
        "", // mensagem original
        pendente.descricaoLimpa,
        pendente.cartaoEncontrado,
      );

      // Mensagem de sucesso
      const msgSucesso = await this.gerarMensagemSucesso(
        pendente,
        resultado,
        idioma,
      );

      await WhatsAppService.sendMessage(userPhone, msgSucesso);
      await ConversationRedisService.addMessage(
        userPhone,
        "assistant",
        msgSucesso,
      ); // ADICIONE AWAIT

      // Limpar transação pendente
      await ConversationRedisService.clearPendingTransaction(userPhone); // ADICIONE AWAIT

      return { status: "confirmed", lancamento: resultado };
    } catch (error: any) {
      console.error("❌ Erro ao criar lançamento:", error);

      const msgErro =
        idioma === "en-US"
          ? `❌ Error creating transaction: ${error.message}`
          : `❌ Erro ao criar lançamento: ${error.message}`;

      await WhatsAppService.sendMessage(userPhone, msgErro);
      await ConversationRedisService.addMessage(
        userPhone,
        "assistant",
        msgErro,
      ); // ADICIONE AWAIT

      return { status: "error", erro: error.message };
    }
  }

  /**
   * CANCELAR LANÇAMENTO
   */
  private static async cancelarLancamento(userPhone: string, idioma: string) {
    console.log("❌ Cancelando lançamento...");

    const pendente =
      await ConversationRedisService.getPendingTransaction(userPhone); // ADICIONE AWAIT

    if (!pendente) {
      const msg =
        idioma === "en-US"
          ? "❌ No transaction pending to cancel."
          : "❌ Nenhuma transação pendente para cancelar.";

      await WhatsAppService.sendMessage(userPhone, msg);
      await ConversationRedisService.addMessage(userPhone, "assistant", msg); // ADICIONE AWAIT
      return { status: "no_pending" };
    }

    const msg =
      idioma === "en-US"
        ? "❌ Transaction canceled.\n\n💡 Send a new message to create another transaction."
        : "❌ Lançamento cancelado.\n\n💡 Envie uma nova mensagem para criar outro lançamento.";

    await WhatsAppService.sendMessage(userPhone, msg);
    await ConversationRedisService.addMessage(userPhone, "assistant", msg); // ADICIONE AWAIT

    // Limpar pendente
    await ConversationRedisService.clearPendingTransaction(userPhone); // ADICIONE AWAIT

    return { status: "cancelled" };
  }

  /**
   * CRIAR NOVO LANÇAMENTO
   */
  private static async criarNovoLancamento(
    mensagem: string,
    userId: string,
    userPhone: string,
    idioma: string,
  ) {
    console.log("✨ Criando novo lançamento...");

    // Buscar categorias
    const categorias = await UserService.getCategoriasUsuario(userId);

    if (categorias.length === 0) {
      const msg =
        idioma === "en-US"
          ? "❌ No categories found. Create categories first in the app."
          : "❌ Nenhuma categoria encontrada. Crie categorias primeiro no app.";

      await WhatsAppService.sendMessage(userPhone, msg);
      await ConversationRedisService.addMessage(userPhone, "assistant", msg); // ADICIONE AWAIT
      return { status: "no_categories" };
    }

    // Extrair dados com IA
    const resultado = await EnhancedAIService.extrairDadosCompleto(
      mensagem,
      categorias,
      idioma,
    );

    if (!resultado.sucesso) {
      const msg = `❌ ${resultado.erro}\n\n💡 Exemplo: "Gastei 50 no almoço"`;
      await WhatsAppService.sendMessage(userPhone, msg);
      await ConversationRedisService.addMessage(userPhone, "assistant", msg); // ADICIONE AWAIT
      return { status: "extraction_failed" };
    }

    // Encontrar categoria
    const categoria =
      categorias.find(
        (c) =>
          c.nome.toLowerCase() ===
          resultado.dados.categoriaSugerida?.toLowerCase(),
      ) || categorias.find((c) => c.tipo === resultado.dados.tipo);

    if (!categoria) {
      const msg = `❌ Categoria não encontrada.`;
      await WhatsAppService.sendMessage(userPhone, msg);
      return { status: "no_category" };
    }

    // Limpar descrição
    const descricaoLimpa = await EnhancedAIService.limparDescricao(
      resultado.dados.descricao,
      idioma,
    );

    // Identificar cartão (se crédito)
    let cartao = null;
    if (resultado.dados.metodoPagamento === "CREDITO") {
      cartao = await LancamentoService.identificarCartao(mensagem, userId);
    }

    // Gerar mensagem de confirmação
    const msgConfirmacao = await this.gerarMensagemConfirmacao(
      {
        dados: resultado.dados,
        categoriaEscolhida: categoria,
        descricaoLimpa,
        cartaoEncontrado: cartao,
      },
      idioma,
    );

    // Salvar pendente
    await ConversationRedisService.setPendingTransaction(
      // ADICIONE AWAIT
      userPhone,
      {
        ...resultado.dados,
        userId: userId,
      },
      categoria,
      descricaoLimpa,
      cartao,
    );

    await WhatsAppService.sendMessage(userPhone, msgConfirmacao);
    await ConversationRedisService.addMessage(
      userPhone,
      "assistant",
      msgConfirmacao,
    ); // ADICIONE AWAIT

    return { status: "waiting_confirmation" };
  }

  /**
   * LISTAR CATEGORIAS
   */
  private static async listarCategorias(
    userId: string,
    userPhone: string,
    idioma: string,
  ) {
    const categorias = await UserService.getCategoriasUsuario(userId);

    if (categorias.length === 0) {
      const msg = "❌ Você ainda não tem categorias cadastradas.";
      await WhatsAppService.sendMessage(userPhone, msg);
      await ConversationRedisService.addMessage(userPhone, "assistant", msg); // ADICIONE AWAIT
      return { status: "no_categories" };
    }

    const despesas = categorias.filter((c) => c.tipo === "DESPESA");
    const receitas = categorias.filter((c) => c.tipo === "RECEITA");

    let msg = "*📋 SUAS CATEGORIAS*\n━━━━━━━━━━━━━━\n\n";

    if (despesas.length > 0) {
      msg += "*💸 DESPESAS:*\n";
      despesas.forEach((c, i) => (msg += `${i + 1}. ${c.nome}\n`));
      msg += "\n";
    }

    if (receitas.length > 0) {
      msg += "*💰 RECEITAS:*\n";
      receitas.forEach((c, i) => (msg += `${i + 1}. ${c.nome}\n`));
    }

    msg += `\n━━━━━━━━━━━━━━\n✨ Total: ${categorias.length} categoria(s)`;

    await WhatsAppService.sendMessage(userPhone, msg);
    await ConversationRedisService.addMessage(userPhone, "assistant", msg); // ADICIONE AWAIT

    return { status: "categories_sent" };
  }

  /**
   * ENVIAR AJUDA
   */
  private static async enviarAjuda(userPhone: string, idioma: string) {
    const msg =
      idioma === "en-US"
        ? `*🤖 HELP - BeCash*\n\nJust send messages like:\n- "I spent 50 on lunch"\n- "Bought 200 in 3x"\n\nI'll understand and help you!`
        : `*🤖 AJUDA - BeCash*\n\nApenas envie mensagens como:\n- "Gastei 50 no almoço"\n- "Comprei 200 em 3x"\n\nEu vou entender e te ajudar!`;

    await WhatsAppService.sendMessage(userPhone, msg);
    await ConversationRedisService.addMessage(userPhone, "assistant", msg); // ADICIONE AWAIT

    return { status: "help_sent" };
  }

  /**
   * RESPONDER DÚVIDA
   */
  private static async responderDuvida(
    mensagem: string,
    userPhone: string,
    idioma: string,
  ) {
    const msg =
      idioma === "en-US"
        ? "💡 I'm your financial assistant. Send transactions and I'll help you organize them!"
        : "💡 Sou seu assistente financeiro. Envie transações e te ajudo a organizar!";

    await WhatsAppService.sendMessage(userPhone, msg);
    await ConversationRedisService.addMessage(userPhone, "assistant", msg); // ADICIONE AWAIT

    return { status: "doubt_answered" };
  }

  /**
   * TRATAR INDEFINIDO
   */
  private static async tratarIndefinido(
    mensagem: string,
    userPhone: string,
    idioma: string,
  ) {
    const msg =
      idioma === "en-US"
        ? '❓ I didn\'t understand. Send: "I spent 50 on lunch" or "Help"'
        : '❓ Não entendi. Envie: "Gastei 50 no almoço" ou "Ajuda"';

    await WhatsAppService.sendMessage(userPhone, msg);
    await ConversationRedisService.addMessage(userPhone, "assistant", msg); // ADICIONE AWAIT

    return { status: "undefined" };
  }

  /**
   * GERAR MENSAGEM DE CONFIRMAÇÃO
   */
  private static async gerarMensagemConfirmacao(
    pendente: any,
    idioma: string,
  ): Promise<string> {
    const { dados, categoriaEscolhida, descricaoLimpa, cartaoEncontrado } =
      pendente;

    // Mensagem em português ou inglês baseado no idioma
    if (idioma === "en-US") {
      let msg = `*📋 CONFIRMATION*\n━━━━━━━━━━━━━━\n\n`;
      msg += `*📝* ${descricaoLimpa}\n`;
      msg += `*💰* R$ ${parseFloat(dados.valor).toFixed(2)}\n`;
      msg += `*🏷️* ${categoriaEscolhida.nome}\n`;
      msg += `*📱* ${dados.metodoPagamento}\n`;

      if (cartaoEncontrado) {
        msg += `*💳* ${cartaoEncontrado.nome}\n`;
      }

      if (dados.ehParcelado) {
        msg += `*🔢* ${dados.parcelas}x\n`;
      }

      if (dados.ehCompartilhado) {
        msg += `*👥* With ${dados.usernameCompartilhado}\n`;
      }

      msg += `\n━━━━━━━━━━━━━━\n`;
      msg += `✅ *YES* - Confirm\n`;
      msg += `❌ *NO* - Cancel`;

      return msg;
    } else {
      // Português (padrão)
      let msg = `*📋 CONFIRMAÇÃO*\n━━━━━━━━━━━━━━\n\n`;
      msg += `*📝* ${descricaoLimpa}\n`;
      msg += `*💰* R$ ${parseFloat(dados.valor).toFixed(2)}\n`;
      msg += `*🏷️* ${categoriaEscolhida.nome}\n`;
      msg += `*📱* ${dados.metodoPagamento}\n`;

      if (cartaoEncontrado) {
        msg += `*💳* ${cartaoEncontrado.nome}\n`;
      }

      if (dados.ehParcelado) {
        msg += `*🔢* ${dados.parcelas}x\n`;
      }

      if (dados.ehCompartilhado) {
        msg += `*👥* Com ${dados.usernameCompartilhado}\n`;
      }

      msg += `\n━━━━━━━━━━━━━━\n`;
      msg += `✅ *SIM* - Confirmar\n`;
      msg += `❌ *NÃO* - Cancelar`;

      return msg;
    }
  }

  /**
   * GERAR MENSAGEM DE SUCESSO
   */
  private static async gerarMensagemSucesso(
    pendente: any,
    resultado: any,
    idioma: string,
  ): Promise<string> {
    if (idioma === "en-US") {
      let msg = `✅ *TRANSACTION CREATED*\n━━━━━━━━━━━━━━\n\n`;
      msg += `*📝* ${pendente.descricaoLimpa}\n`;
      msg += `*💰* R$ ${parseFloat(pendente.dados.valor).toFixed(2)}\n`;
      msg += `*🏷️* ${pendente.categoriaEscolhida.nome}\n`;
      msg += `\n━━━━━━━━━━━━━━\n`;
      msg += `✨ Saved successfully!`;
      return msg;
    } else {
      let msg = `✅ *LANÇAMENTO CRIADO*\n━━━━━━━━━━━━━━\n\n`;
      msg += `*📝* ${pendente.descricaoLimpa}\n`;
      msg += `*💰* R$ ${parseFloat(pendente.dados.valor).toFixed(2)}\n`;
      msg += `*🏷️* ${pendente.categoriaEscolhida.nome}\n`;
      msg += `\n━━━━━━━━━━━━━━\n`;
      msg += `✨ Salvo com sucesso!`;
      return msg;
    }
  }
}
