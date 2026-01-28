// app/api/webhooks/whatsapp/handlers/message-enhanced.handler.ts

import { UserService } from "../services/user.service";
import { WhatsAppService } from "../services/whatsapp.service";
import { LancamentoService } from "../services/lancamento.service";
import { ConversationRedisService } from "../services/conversation.service";
import { EnhancedAIService } from "../services/ai-enhanced.service";
import { normalizarTelefone } from "../utils/validators";
import { getUserSubscription } from "@/lib/subscription";
import db from "@/lib/db";

const LIMITE_WHATSAPP_FREE = 3;
const LIMITE_COMPARTILHADOS_PRO = 3;

export class EnhancedMessageHandler {
  private static async verificarLimiteCompartilhados(
    userId: string,
    userPhone: string,
    idioma: string,
  ): Promise<{
    permitido: boolean;
    plano?: string;
    mensagensUsadas?: number;
    limite?: number;
  }> {
    try {
      // Buscar subscription do usuário
      const subscription = await getUserSubscription(userId);

      // ❌ FREE não pode criar compartilhados
      if (!subscription.isActive || subscription.plano === "free") {
        const msgLimite =
          idioma === "en-US"
            ? `⚠️ *SHARED EXPENSES - PREMIUM FEATURE*\n\n❌ Shared expenses are available only for PRO and FAMILY plans.\n\n✨ Upgrade now:\n• *PRO*: 3 shared expenses/month\n• *FAMILY*: Unlimited shared expenses\n\n🔗 Access the app to upgrade.`
            : `⚠️ *DESPESAS COMPARTILHADAS - RECURSO PREMIUM*\n\n❌ Despesas compartilhadas estão disponíveis apenas nos planos PRO e FAMÍLIA.\n\n✨ Faça upgrade agora:\n• *PRO*: 3 compartilhamentos/mês\n• *FAMÍLIA*: Compartilhamentos ilimitados\n\n🔗 Acesse o app para fazer upgrade.`;

        await WhatsAppService.sendMessage(userPhone, msgLimite);
        await ConversationRedisService.addMessage(
          userPhone,
          "assistant",
          msgLimite,
        );

        return { permitido: false, plano: "free" };
      }

      // ✅ FAMILY tem ilimitado
      if (subscription.plano === "family") {
        console.log("✅ Plano FAMILY: compartilhamentos ilimitados");
        return { permitido: true, plano: "family" };
      }

      // 📊 PRO tem limite de 3 por mês
      if (subscription.plano === "pro") {
        const inicioMes = new Date();
        inicioMes.setDate(1);
        inicioMes.setHours(0, 0, 0, 0);

        // Contar compartilhamentos criados neste mês
        const compartilhadosMes = await db.lancamentoCompartilhado.count({
          where: {
            usuarioCriadorId: userId,
            createdAt: {
              gte: inicioMes,
            },
          },
        });

        console.log(
          `📊 Compartilhamentos PRO no mês: ${compartilhadosMes}/${LIMITE_COMPARTILHADOS_PRO}`,
        );

        // Se atingiu o limite
        if (compartilhadosMes >= LIMITE_COMPARTILHADOS_PRO) {
          const msgLimite =
            idioma === "en-US"
              ? `⚠️ *PRO PLAN LIMIT REACHED*\n\nYou've used ${compartilhadosMes}/${LIMITE_COMPARTILHADOS_PRO} shared expenses this month.\n\n✨ Upgrade to *FAMILY* for unlimited shared expenses!\n\n🔗 Access the app to upgrade.`
              : `⚠️ *LIMITE DO PLANO PRO ATINGIDO*\n\nVocê já usou ${compartilhadosMes}/${LIMITE_COMPARTILHADOS_PRO} compartilhamentos este mês.\n\n✨ Faça upgrade para *FAMÍLIA* e tenha compartilhamentos ilimitados!\n\n🔗 Acesse o app para fazer upgrade.`;

          await WhatsAppService.sendMessage(userPhone, msgLimite);
          await ConversationRedisService.addMessage(
            userPhone,
            "assistant",
            msgLimite,
          );

          return {
            permitido: false,
            plano: "pro",
            mensagensUsadas: compartilhadosMes,
            limite: LIMITE_COMPARTILHADOS_PRO,
          };
        }

        const restantes = LIMITE_COMPARTILHADOS_PRO - compartilhadosMes;
        console.log(
          `✅ Limite PRO OK: ${restantes} compartilhamento(s) restante(s)`,
        );

        // Avisar quando estiver no último
        if (compartilhadosMes === LIMITE_COMPARTILHADOS_PRO - 1) {
          const msgAviso =
            idioma === "en-US"
              ? `⚠️ This is your last shared expense this month!\n\n✨ Upgrade to FAMILY for unlimited.`
              : `⚠️ Este é seu último compartilhamento este mês!\n\n✨ Faça upgrade para FAMÍLIA e tenha ilimitado.`;

          await WhatsAppService.sendMessage(userPhone, msgAviso);
        }

        return {
          permitido: true,
          plano: "pro",
          mensagensUsadas: compartilhadosMes,
          limite: LIMITE_COMPARTILHADOS_PRO,
        };
      }

      // Fallback (não deveria chegar aqui)
      return { permitido: false, plano: "unknown" };
    } catch (error) {
      console.error("❌ Erro ao verificar limite de compartilhados:", error);
      // Em caso de erro, bloquear por segurança
      return { permitido: false };
    }
  }

  private static async verificarLimiteWhatsApp(
    userId: string,
    userPhone: string,
    idioma: string,
  ): Promise<{
    permitido: boolean;
    mensagensUsadas?: number;
    limite?: number;
  }> {
    try {
      // Buscar subscription do usuário
      const subscription = await getUserSubscription(userId);

      // Se for plano pago (pro ou family), permitir ilimitado
      if (subscription.isActive && subscription.plano !== "free") {
        console.log("✅ Usuário premium, sem limite de WhatsApp");
        return { permitido: true };
      }

      // Se for free, contar mensagens do mês atual via WhatsApp
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      // ✅ Buscar lançamentos que têm "Criado via WhatsApp" nas observações
      const mensagensWhatsAppMes = await db.lancamento.count({
        where: {
          userId,
          observacoes: {
            contains: "Criado via WhatsApp",
          },
          createdAt: {
            gte: inicioMes,
          },
        },
      });

      console.log(
        `📊 Mensagens WhatsApp no mês: ${mensagensWhatsAppMes}/${LIMITE_WHATSAPP_FREE}`,
      );

      // Se já atingiu o limite
      if (mensagensWhatsAppMes >= LIMITE_WHATSAPP_FREE) {
        const msgLimite =
          idioma === "en-US"
            ? `⚠️ *FREE PLAN LIMIT REACHED*\n\nYou've used ${mensagensWhatsAppMes}/${LIMITE_WHATSAPP_FREE} WhatsApp messages this month.\n\n✨ Upgrade to *PRO* or *FAMILY* for unlimited WhatsApp messages!\n\n🔗 Access the app to upgrade your plan.`
            : `⚠️ *LIMITE DO PLANO GRATUITO ATINGIDO*\n\nVocê já usou ${mensagensWhatsAppMes}/${LIMITE_WHATSAPP_FREE} mensagens do WhatsApp este mês.\n\n✨ Faça upgrade para *PRO* ou *FAMÍLIA* e tenha mensagens ilimitadas no WhatsApp!\n\n🔗 Acesse o app para fazer upgrade do seu plano.`;

        await WhatsAppService.sendMessage(userPhone, msgLimite);
        await ConversationRedisService.addMessage(
          userPhone,
          "assistant",
          msgLimite,
        );

        return {
          permitido: false,
          mensagensUsadas: mensagensWhatsAppMes,
          limite: LIMITE_WHATSAPP_FREE,
        };
      }

      // Se ainda tem mensagens disponíveis
      const restantes = LIMITE_WHATSAPP_FREE - mensagensWhatsAppMes;
      console.log(
        `✅ Limite WhatsApp OK: ${restantes} mensagem(ns) restante(s)`,
      );

      // ✅ OPCIONAL: Avisar quando estiver perto do limite
      if (mensagensWhatsAppMes === LIMITE_WHATSAPP_FREE - 1) {
        const msgAviso =
          idioma === "en-US"
            ? `⚠️ This is your last free WhatsApp message this month!\n\n✨ Upgrade to PRO or FAMILY for unlimited messages.`
            : `⚠️ Esta é sua última mensagem grátis do WhatsApp este mês!\n\n✨ Faça upgrade para PRO ou FAMÍLIA e tenha mensagens ilimitadas.`;

        // Não bloqueia, apenas avisa
        await WhatsAppService.sendMessage(userPhone, msgAviso);
      }

      return {
        permitido: true,
        mensagensUsadas: mensagensWhatsAppMes,
        limite: LIMITE_WHATSAPP_FREE,
      };
    } catch (error) {
      console.error("❌ Erro ao verificar limite WhatsApp:", error);
      // Em caso de erro, permitir para não bloquear o usuário
      return { permitido: true };
    }
  }

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

    // ✅ VERIFICAR LIMITE DE WHATSAPP ANTES DE PROCESSAR
    const limiteCheck = await this.verificarLimiteWhatsApp(
      userId,
      userPhone,
      idioma,
    );

    if (!limiteCheck.permitido) {
      console.log(`🚫 Limite WhatsApp atingido para usuário ${userId}`);
      return {
        status: "limit_reached",
        mensagensUsadas: limiteCheck.mensagensUsadas,
        limite: limiteCheck.limite,
      };
    }

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

    // ✅ VERIFICAR SE É COMPARTILHADO E VALIDAR LIMITE
    if (
      resultado.dados.ehCompartilhado &&
      resultado.dados.usernameCompartilhado
    ) {
      console.log(
        "🔍 Lançamento compartilhado detectado, verificando limites...",
      );

      const limiteCompartilhados = await this.verificarLimiteCompartilhados(
        userId,
        userPhone,
        idioma,
      );

      if (!limiteCompartilhados.permitido) {
        console.log(
          `🚫 Limite de compartilhados atingido para usuário ${userId} (plano: ${limiteCompartilhados.plano})`,
        );
        return {
          status: "shared_limit_reached",
          plano: limiteCompartilhados.plano,
          mensagensUsadas: limiteCompartilhados.mensagensUsadas,
          limite: limiteCompartilhados.limite,
        };
      }

      console.log(
        `✅ Limite de compartilhados OK (plano: ${limiteCompartilhados.plano})`,
      );
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
    const resultadoConfirmacao = await this.gerarMensagemConfirmacao(
      {
        dados: resultado.dados,
        categoriaEscolhida: categoria,
        descricaoLimpa,
        cartaoEncontrado: cartao,
      },
      idioma,
      userId, // ADICIONAR userId como terceiro parâmetro
      userPhone, // ADICIONAR userPhone como quarto parâmetro
    );

    // Se houve erro (username não encontrado), retornar o erro
    if (!resultadoConfirmacao.sucesso) {
      console.log(`❌ Fluxo cancelado: ${resultadoConfirmacao.erro}`);

      // Limpar qualquer pendente que possa existir
      await ConversationRedisService.clearPendingTransaction(userPhone);

      return {
        status: "username_not_found",
        erro: resultadoConfirmacao.erro,
        username: resultado.dados.usernameCompartilhado,
      };
    }

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

    await WhatsAppService.sendMessage(
      userPhone,
      resultadoConfirmacao.mensagem!,
    );
    await ConversationRedisService.addMessage(
      userPhone,
      "assistant",
      resultadoConfirmacao.mensagem!,
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
  userId: string,
  userPhone: string,
): Promise<{ sucesso: boolean; mensagem?: string; erro?: string }> {
  try {
    const { dados, categoriaEscolhida, descricaoLimpa, cartaoEncontrado } =
      pendente;

    console.log(`🔍 Validando username antes de gerar confirmação...`);

    // VALIDAR USERNAME SE FOR COMPARTILHAMENTO
    if (dados.ehCompartilhado && dados.usernameCompartilhado) {
      console.log(`🎯 Verificando username: @${dados.usernameCompartilhado}`);

      const usuarioAlvo = await UserService.encontrarUsuarioPorUsername(
        dados.usernameCompartilhado,
        userId,
      );

      if (!usuarioAlvo) {
        const erroMsg =
          idioma === "en-US"
            ? `❌ User "@${dados.usernameCompartilhado}" not found.\n\n💡 Please check the username and try again.`
            : `❌ Usuário "@${dados.usernameCompartilhado}" não encontrado.\n\n💡 Verifique o username e tente novamente.`;

        console.log(`❌ Username não encontrado, cancelando fluxo`);

        await WhatsAppService.sendMessage(userPhone, erroMsg);
        await ConversationRedisService.addMessage(
          userPhone,
          "assistant",
          erroMsg,
        );

        await ConversationRedisService.clearPendingTransaction(userPhone);

        return {
          sucesso: false,
          erro: erroMsg,
        };
      }

      console.log(
        `✅ Username validado: @${usuarioAlvo.username} (${usuarioAlvo.name})`,
      );
    }

    console.log(`✅ Gerando mensagem de confirmação...`);

    // Mensagem em português ou inglês baseado no idioma
    if (idioma === "en-US") {
      let msg = `📋 *TRANSACTION DETAILS*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      msg += `📝 *Description:* ${descricaoLimpa}\n`;
      msg += `💰 *Amount:* R$ ${parseFloat(dados.valor).toFixed(2)}\n`;
      msg += `🏷️ *Category:* ${categoriaEscolhida.nome}\n`;
      
      // Método de pagamento formatado
      const metodoPagamento = dados.metodoPagamento === "CREDITO" 
        ? "Credit Card" 
        : dados.metodoPagamento === "DEBITO" 
          ? "Debit Card" 
          : dados.metodoPagamento;
      msg += `💳 *Payment Method:* ${metodoPagamento}\n`;

      // Informações do cartão
      if (cartaoEncontrado) {
        msg += `💳 *Card:* ${cartaoEncontrado.nome}\n`;
      }

      // Parcelamento
      if (dados.ehParcelado) {
        const valorParcela = parseFloat(dados.valor) / dados.parcelas;
        msg += `🔢 *Installments:* ${dados.parcelas}x of R$ ${valorParcela.toFixed(2)}\n`;
      }

      // Compartilhamento
      if (dados.ehCompartilhado && dados.usernameCompartilhado) {
        msg += `👥 *Shared with:* @${dados.usernameCompartilhado}\n`;

        // Adicionar informações de divisão
        if (dados.tipoDivisao && dados.tipoDivisao !== "metade") {
          if (dados.tipoDivisao === "porcentagem" && dados.porcentagemUsuario) {
            msg += `⚖️ *Your share:* ${dados.porcentagemUsuario}%\n`;
          } else if (dados.tipoDivisao === "valor_fixo" && dados.valorUsuario) {
            msg += `⚖️ *Your share:* R$ ${dados.valorUsuario.toFixed(2)}\n`;
          }
        } else {
          msg += `⚖️ *Split:* 50/50\n`;
        }
      }

      msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `✅ *YES* – Confirm transaction\n`;
      msg += `❌ *NO* – Cancel`;

      return { sucesso: true, mensagem: msg };
    } else {
      // Português (padrão)
      let msg = `📋 *DETALHES DA TRANSAÇÃO*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      msg += `📝 *Descrição:* ${descricaoLimpa}\n`;
      msg += `💰 *Valor:* R$ ${parseFloat(dados.valor).toFixed(2)}\n`;
      msg += `🏷️ *Categoria:* ${categoriaEscolhida.nome}\n`;
      
      // Método de pagamento formatado
      const metodoPagamento = dados.metodoPagamento === "CREDITO" 
        ? "Cartão de Crédito" 
        : dados.metodoPagamento === "DEBITO" 
          ? "Cartão de Débito" 
          : dados.metodoPagamento;
      msg += `💳 *Método de Pagamento:* ${metodoPagamento}\n`;

      // Informações do cartão
      if (cartaoEncontrado) {
        msg += `💳 *Cartão:* ${cartaoEncontrado.nome}\n`;
      }

      // Parcelamento
      if (dados.ehParcelado) {
        const valorParcela = parseFloat(dados.valor) / dados.parcelas;
        msg += `🔢 *Parcelamento:* ${dados.parcelas}x de R$ ${valorParcela.toFixed(2)}\n`;
      }

      // Compartilhamento
      if (dados.ehCompartilhado && dados.usernameCompartilhado) {
        msg += `👥 *Compartilhamento:* @${dados.usernameCompartilhado}\n`;

        // Adicionar informações de divisão
        if (dados.tipoDivisao && dados.tipoDivisao !== "metade") {
          if (dados.tipoDivisao === "porcentagem" && dados.porcentagemUsuario) {
            msg += `⚖️ *Sua parte:* ${dados.porcentagemUsuario}%\n`;
          } else if (dados.tipoDivisao === "valor_fixo" && dados.valorUsuario) {
            msg += `⚖️ *Sua parte:* R$ ${dados.valorUsuario.toFixed(2)}\n`;
          }
        } else {
          msg += `⚖️ *Divisão:* 50/50\n`;
        }
      }

      msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `✅ *SIM* – Confirmar transação\n`;
      msg += `❌ *NÃO* – Cancelar`;

      return { sucesso: true, mensagem: msg };
    }
  } catch (error) {
    console.error("❌ Erro ao gerar mensagem de confirmação:", error);

    const erroMsg =
      idioma === "en-US"
        ? "❌ Error processing your request. Please try again."
        : "❌ Erro ao processar sua solicitação. Por favor, tente novamente.";

    return {
      sucesso: false,
      erro: erroMsg,
    };
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
    let msg = `✅ *TRANSACTION CREATED*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    msg += `📝 *Description:* ${pendente.descricaoLimpa}\n`;
    msg += `💰 *Amount:* R$ ${parseFloat(pendente.dados.valor).toFixed(2)}\n`;
    msg += `🏷️ *Category:* ${pendente.categoriaEscolhida.nome}\n`;
    
    // Adicionar informações extras se existirem
    if (pendente.dados.ehParcelado) {
      const valorParcela = parseFloat(pendente.dados.valor) / pendente.dados.parcelas;
      msg += `🔢 *Installments:* ${pendente.dados.parcelas}x of R$ ${valorParcela.toFixed(2)}\n`;
    }
    
    if (pendente.dados.ehCompartilhado && pendente.dados.usernameCompartilhado) {
      msg += `👥 *Shared with:* @${pendente.dados.usernameCompartilhado}\n`;
    }
    
    msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `✨ Saved successfully!`;
    return msg;
  } else {
    let msg = `✅ *LANÇAMENTO CRIADO*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    msg += `📝 *Descrição:* ${pendente.descricaoLimpa}\n`;
    msg += `💰 *Valor:* R$ ${parseFloat(pendente.dados.valor).toFixed(2)}\n`;
    msg += `🏷️ *Categoria:* ${pendente.categoriaEscolhida.nome}\n`;
    
    // Adicionar informações extras se existirem
    if (pendente.dados.ehParcelado) {
      const valorParcela = parseFloat(pendente.dados.valor) / pendente.dados.parcelas;
      msg += `🔢 *Parcelamento:* ${pendente.dados.parcelas}x de R$ ${valorParcela.toFixed(2)}\n`;
    }
    
    if (pendente.dados.ehCompartilhado && pendente.dados.usernameCompartilhado) {
      msg += `👥 *Compartilhado com:* @${pendente.dados.usernameCompartilhado}\n`;
    }
    
    msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `✨ Salvo com sucesso!`;
    return msg;
  }
}
}
