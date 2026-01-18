// app/api/webhooks/whatsapp/handlers/message.handler.ts
import { LancamentoTemporario } from "../types";
import { UserService } from "../services/user.service";
import { AIService } from "../services/ai.service";
import { WhatsAppService } from "../services/whatsapp.service";
import { LancamentoService } from "../services/lancamento.service";
import {
  normalizarTelefone,
  validarLancamentoPendente,
  isConfirmacao,
  isCancelamento,
} from "../utils/validators";
import {
  formatarValorComMoeda,
  traduzirMetodoPagamento,
  calcularDataBrasilia,
} from "../utils/formatters";

// Cache global
declare global {
  var pendingLancamentos: Map<string, LancamentoTemporario> | undefined;
}

export class MessageHandler {
  // Mensagens auxiliares
  static async enviarMensagemAjuda(
    userPhone: string,
    idioma: string = "pt-BR",
  ) {
    if (idioma === "en-US") {
      const templateEN = `*🤖 HELP - BeCash WhatsApp*
━━━━━━━━━━━━━━

*📝 HOW TO CREATE TRANSACTIONS:*

*Simple examples:*
- "I spent 50 on lunch"
- "I received 1000 salary"
- "I paid 200 at the pharmacy"

*With payment method:*
- "I spent 80 on Uber with PIX"
- "I bought 150 at the supermarket on credit"
- "I paid 45 in cash"

*Installments:*
- "I bought 600 in 3 installments"
- "I spent 1200 in 6x on credit"

*Shared with personalized division:*
- "I spent 100 on dinner shared with Mary, my part is 60" → You pay 60, Mary pays 40
- "I paid 50, my part is 60%" → You pay 60% (R$30), other person pays 40% (R$20)
- "Expense of 80 shared with John, I take 45" → You pay 45, John pays 35

*📋 AVAILABLE COMMANDS:*
- "Which categories do I have?"
- "Help"

━━━━━━━━━━━━━━
💡 Questions? Type "help"`;

      await WhatsAppService.sendMessage(userPhone, templateEN);
      return;
    }

    const templatePT = `*🤖 AJUDA - BeCash WhatsApp*
━━━━━━━━━━━━━━

*📝 COMO CRIAR LANÇAMENTOS:*

*Exemplos simples:*
- "Gastei 50 no almoço"
- "Recebi 1000 salário"
- "Paguei 200 na farmácia"

*Com método de pagamento:*
- "Gastei 80 no Uber com PIX"
- "Comprei 150 no mercado no crédito"
- "Paguei 45 em dinheiro"

*Parcelado:*
- "Comprei 600 parcelado em 3 vezes"
- "Gastei 1200 em 6x no crédito"

*Compartilhado com divisão personalizada:*
- "Gastei 100 no jantar compartilhada com Maria, minha parte é 60" → Você paga 60, Maria paga 40
- "Paguei 50, minha parte é 60%" → Você paga 60% (R$30), outra pessoa paga 40% (R$20)
- "Despesa de 80 compartilhada com João, eu fico com 45" → Você paga 45, João paga 35

*📋 COMANDOS DISPONÍVEIS:*
- "Quais categorias tenho?"
- "Ajuda"

━━━━━━━━━━━━━━
💡 Dúvidas? Digite "ajuda"`;

    await WhatsAppService.sendMessage(userPhone, templatePT);
  }

  static async processarComandoCategorias(
    userPhone: string,
    userId: string,
    idioma: string = "pt-BR",
  ) {
    try {
      const categorias = await UserService.getCategoriasUsuario(userId);

      if (categorias.length === 0) {
        const template =
          "❌ Você ainda não tem categorias cadastradas.\n\n💡 Acesse o app BeCash para criar suas categorias.";
        const mensagem = await AIService.gerarMensagemComIA(
          template,
          {},
          idioma,
        );
        await WhatsAppService.sendMessage(userPhone, mensagem);
        return;
      }

      const categoriasPorTipo = {
        RECEITA: categorias.filter((c) => c.tipo === "RECEITA"),
        DESPESA: categorias.filter((c) => c.tipo === "DESPESA"),
      };

      let templatePT = "*📋 SUAS CATEGORIAS*\n";
      templatePT += "━━━━━━━━━━━━━━\n\n";

      if (categoriasPorTipo.DESPESA.length > 0) {
        templatePT += "*💸 DESPESAS:*\n";
        categoriasPorTipo.DESPESA.forEach((cat, i) => {
          templatePT += `${i + 1}. ${cat.nome}\n`;
        });
        templatePT += "\n";
      }

      if (categoriasPorTipo.RECEITA.length > 0) {
        templatePT += "*💰 RECEITAS:*\n";
        categoriasPorTipo.RECEITA.forEach((cat, i) => {
          templatePT += `${i + 1}. ${cat.nome}\n`;
        });
      }

      templatePT += "\n━━━━━━━━━━━━━━\n";
      templatePT += `✨ Total: ${categorias.length} categoria(s)`;

      const mensagemFinal =
        idioma === "pt-BR"
          ? templatePT
          : await AIService.gerarMensagemComIA(
              templatePT,
              { categorias: categoriasPorTipo },
              idioma,
            );

      await WhatsAppService.sendMessage(userPhone, mensagemFinal);
    } catch (error) {
      console.error("Erro ao listar categorias:", error);
      const template = "❌ Erro ao buscar suas categorias. Tente novamente.";
      const mensagem = await AIService.gerarMensagemComIA(template, {}, idioma);
      await WhatsAppService.sendMessage(userPhone, mensagem);
    }
  }

  static async gerarMensagemCancelamento(
    idioma: string = "pt-BR",
  ): Promise<string> {
    if (idioma === "en-US") {
      return `❌ Transaction Canceled

The transaction was canceled and not registered in your statement.

💡 Send a new message to create another transaction.`;
    } else {
      return `❌ Lançamento Cancelado

A transação foi cancelada e não foi registrada em seu extrato.

💡 Envie uma nova mensagem para criar outro lançamento.`;
    }
  }

  static async gerarMensagemConfirmacao(
    dados: any,
    descricaoLimpa: string,
    categoriaEscolhida: any,
    cartaoEncontrado: any,
    userIdOuResultado: string | any,
    idioma: string = "pt-BR",
  ): Promise<string> {
    const isConfirmacao = typeof userIdOuResultado === "string";
    const userId = isConfirmacao ? userIdOuResultado : null;
    const resultadoCriacao = !isConfirmacao ? userIdOuResultado : null;

    const dataLancamento = calcularDataBrasilia(dados.data);
    const valorNumero = parseFloat(dados.valor);
    const valorFormatado = formatarValorComMoeda(valorNumero, idioma);

    const dataFormatada = dataLancamento.toLocaleDateString(
      idioma === "en-US" ? "en-US" : "pt-BR",
    );

    // SE FOR SUCESSO (após criação)
    if (resultadoCriacao) {
      if (idioma === "en-US") {
        let templateEN = `✅ *TRANSACTION REGISTERED*\n`;
        templateEN += `━━━━━━━━━━━━━━\n\n`;

        templateEN += `📝 *Description:* ${descricaoLimpa}\n`;
        templateEN += `💰 *Total amount:* ${valorFormatado}\n`;
        templateEN += `🏷️ *Category:* ${categoriaEscolhida.nome}\n`;

        // NOVO: Tratamento de divisão personalizada após criação
        if (
          resultadoCriacao?.usuarioAlvo &&
          resultadoCriacao.valorCompartilhado > 0
        ) {
          const valorUsuario = formatarValorComMoeda(
            resultadoCriacao.valorUsuarioCriador,
            idioma,
          );
          const valorCompartilhado = formatarValorComMoeda(
            resultadoCriacao.valorCompartilhado,
            idioma,
          );

          templateEN += `\n👥 *SHARED EXPENSE*\n`;
          templateEN += `   • Your part: ${valorUsuario}\n`;
          templateEN += `   • ${resultadoCriacao.usuarioAlvo.name}: ${valorCompartilhado}\n`;

          // Adicionar tipo de divisão
          if (resultadoCriacao.tipoDivisao) {
            templateEN += `   • Division type: ${resultadoCriacao.tipoDivisao}\n`;
          }
        }

        if (resultadoCriacao?.ehParcelado && resultadoCriacao.parcelasTotal) {
          templateEN += `\n💳 *INSTALLMENTS*\n`;
          templateEN += `   • ${resultadoCriacao.parcelasTotal}x of ${formatarValorComMoeda(resultadoCriacao.valorParcela, idioma)}\n`;
        }

        if (cartaoEncontrado) {
          templateEN += `\n💳 *Card:* ${cartaoEncontrado.nome}\n`;
        }

        templateEN += `\n📅 *Date:* ${dataFormatada}\n`;
        templateEN += `\n━━━━━━━━━━━━━━\n`;
        templateEN += `✨ *Thank you for using BeCash!*\n`;

        return templateEN;
      } else {
        let templatePT = `✅ *LANÇAMENTO REGISTRADO*\n`;
        templatePT += `━━━━━━━━━━━━━━\n\n`;

        templatePT += `📝 *Descrição:* ${descricaoLimpa}\n`;
        templatePT += `💰 *Valor total:* ${valorFormatado}\n`;
        templatePT += `🏷️ *Categoria:* ${categoriaEscolhida.nome}\n`;

        // NOVO: Tratamento de divisão personalizada após criação
        if (
          resultadoCriacao?.usuarioAlvo &&
          resultadoCriacao.valorCompartilhado > 0
        ) {
          const valorUsuario = formatarValorComMoeda(
            resultadoCriacao.valorUsuarioCriador,
            idioma,
          );
          const valorCompartilhado = formatarValorComMoeda(
            resultadoCriacao.valorCompartilhado,
            idioma,
          );

          templatePT += `\n👥 *COMPARTILHAMENTO*\n`;
          templatePT += `   • Sua parte: ${valorUsuario}\n`;
          templatePT += `   • ${resultadoCriacao.usuarioAlvo.name}: ${valorCompartilhado}\n`;

          // Adicionar tipo de divisão
          if (resultadoCriacao.tipoDivisao) {
            const tiposDivisao: Record<string, string> = {
              metade: "Metade (50/50)",
              porcentagem: `Porcentagem (${resultadoCriacao.porcentagemUsuario}%)`,
              valor_fixo: "Valor fixo",
            };

            const tipoDivisaoTraduzido =
              tiposDivisao[resultadoCriacao.tipoDivisao] ||
              resultadoCriacao.tipoDivisao;
            templatePT += `   • Tipo de divisão: ${tipoDivisaoTraduzido}\n`;
          }
        }

        if (resultadoCriacao?.ehParcelado && resultadoCriacao.parcelasTotal) {
          templatePT += `\n💳 *PARCELAMENTO*\n`;
          templatePT += `   • ${resultadoCriacao.parcelasTotal}x de ${formatarValorComMoeda(resultadoCriacao.valorParcela, idioma)}\n`;
        }

        if (cartaoEncontrado) {
          templatePT += `\n💳 *Cartão:* ${cartaoEncontrado.nome}\n`;
        }

        templatePT += `\n📅 *Data:* ${dataFormatada}\n`;
        templatePT += `\n━━━━━━━━━━━━━━\n`;
        templatePT += `✨ *Obrigado por usar o BeCash!*\n`;

        return templatePT;
      }
    }
    // Continuação do gerarMensagemConfirmacao - CONFIRMAÇÃO (antes de criar)

    if (idioma === "en-US") {
      let templateEN = `*📋 TRANSACTION CONFIRMATION*\n`;
      templateEN += `━━━━━━━━━━━━━━\n\n`;

      templateEN += `*📝 Description:* ${descricaoLimpa}\n`;
      templateEN += `*💰 Amount:* ${valorFormatado}\n`;
      templateEN += `*🏷️ Category:* ${categoriaEscolhida.nome}\n`;
      templateEN += `*📅 Date:* ${dataFormatada}\n`;

      templateEN += `*📊 Type:* ${dados.tipo === "DESPESA" ? "Expense" : "Income"}\n`;

      const metodoPagamentoText = traduzirMetodoPagamento(
        dados.metodoPagamento,
        idioma,
      );
      const emojiMetodo = metodoPagamentoText.split(" ")[0];

      templateEN += `*${emojiMetodo} Method:* ${metodoPagamentoText.replace(/💳|📱|💵|🔄/g, "").trim()}\n`;

      if (cartaoEncontrado) {
        templateEN += `*🔸 Card:* ${cartaoEncontrado.nome}\n`;

        if (cartaoEncontrado.limiteDisponivel !== undefined) {
          const limiteDisponivel = formatarValorComMoeda(
            cartaoEncontrado.limiteDisponivel,
            idioma,
          );
          const utilizacaoPercentual = cartaoEncontrado.utilizacaoLimite || 0;

          templateEN += `*📊 Available limit:* ${limiteDisponivel}\n`;
          templateEN += `*📈 Utilization:* ${utilizacaoPercentual.toFixed(1)}%\n`;
        } else if (
          cartaoEncontrado.limite &&
          cartaoEncontrado.totalGasto !== undefined
        ) {
          const limiteDisponivel =
            cartaoEncontrado.limite - cartaoEncontrado.totalGasto;
          const limiteDisponivelFormatado = formatarValorComMoeda(
            limiteDisponivel,
            idioma,
          );
          const utilizacaoPercentual =
            cartaoEncontrado.limite > 0
              ? (cartaoEncontrado.totalGasto / cartaoEncontrado.limite) * 100
              : 0;

          templateEN += `*📊 Available limit:* ${limiteDisponivelFormatado}\n`;
          templateEN += `*📈 Utilization:* ${utilizacaoPercentual.toFixed(1)}%\n`;
        }
      }

      // Limite da categoria
      if (userId) {
        const hoje = new Date();
        const mesReferencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
        const limiteCategoria = await UserService.buscarLimiteCategoria(
          categoriaEscolhida.id,
          userId,
          mesReferencia,
        );

        if (limiteCategoria) {
          const gastoAtual = limiteCategoria.gastoAtual || 0;
          const novoGasto = gastoAtual + parseFloat(dados.valor);
          const limite = limiteCategoria.limiteMensal;
          const percentualAtual = (gastoAtual / limite) * 100;
          const percentualNovo = (novoGasto / limite) * 100;

          const gastoAtualFormatado = formatarValorComMoeda(gastoAtual, idioma);
          const novoGastoFormatado = formatarValorComMoeda(novoGasto, idioma);
          const limiteFormatado = formatarValorComMoeda(limite, idioma);

          templateEN += `*📊 CATEGORY LIMIT:*\n`;
          templateEN += `   • Before: ${gastoAtualFormatado} / ${limiteFormatado} (${percentualAtual.toFixed(1)}%)\n`;
          templateEN += `   • After: ${novoGastoFormatado} / ${limiteFormatado} (${percentualNovo.toFixed(1)}%)\n`;

          if (novoGasto > limite) {
            templateEN += `   ⚠️ *WARNING: Limit exceeded!*\n`;
          }
        }
      }

      // NOVO: Tratamento de divisão personalizada na confirmação
      if (dados.ehCompartilhado && dados.nomeUsuarioCompartilhado) {
        const valorTotal = parseFloat(dados.valor);

        // Calcular valores baseados no tipo de divisão
        let valorUsuario = 0;
        let valorCompartilhado = 0;
        let infoDivisao = "";

        if (dados.tipoDivisao === "porcentagem" && dados.porcentagemUsuario) {
          const porcentagem = dados.porcentagemUsuario / 100;
          valorUsuario = valorTotal * porcentagem;
          valorCompartilhado = valorTotal - valorUsuario;
          infoDivisao = `📊 Division: ${dados.porcentagemUsuario}% / ${100 - dados.porcentagemUsuario}%`;
        } else if (dados.tipoDivisao === "valor_fixo" && dados.valorUsuario) {
          valorUsuario = dados.valorUsuario;
          valorCompartilhado = valorTotal - valorUsuario;
          infoDivisao = `💰 Division: Fixed amount`;
        } else {
          // Divisão padrão (metade)
          valorUsuario = valorTotal / 2;
          valorCompartilhado = valorTotal / 2;
          infoDivisao = `📊 Division: Half (50/50)`;
        }

        const valorUsuarioFormatado = formatarValorComMoeda(
          valorUsuario,
          idioma,
        );
        const valorCompartilhadoFormatado = formatarValorComMoeda(
          valorCompartilhado,
          idioma,
        );

        templateEN += `*👥 Shared with:* ${dados.nomeUsuarioCompartilhado}\n`;
        templateEN += `*${infoDivisao}*\n`;
        templateEN += `*🤝 Your part:* ${valorUsuarioFormatado}\n`;
        templateEN += `*👤 ${dados.nomeUsuarioCompartilhado}'s part:* ${valorCompartilhadoFormatado}\n`;
      }

      if (dados.ehParcelado && dados.parcelas) {
        const valorParcela = parseFloat(dados.valor) / dados.parcelas;
        const valorParcelaFormatado = formatarValorComMoeda(
          valorParcela,
          idioma,
        );
        templateEN += `*🔢 Installments:* ${dados.parcelas}x of ${valorParcelaFormatado}\n`;
      }

      templateEN += `\n━━━━━━━━━━━━━━\n\n`;
      templateEN += `*Please confirm:*\n\n`;
      templateEN += `✅ *YES* - To confirm this transaction\n`;
      templateEN += `❌ *NO* - To cancel\n\n`;
      templateEN += `_⏰ This confirmation expires in 5 minutes_`;

      return templateEN;
    } else {
      // PORTUGUÊS
      let templatePT = `*📋 CONFIRMAÇÃO DE LANÇAMENTO*\n`;
      templatePT += `━━━━━━━━━━━━━━\n\n`;

      templatePT += `*📝 Descrição:* ${descricaoLimpa}\n`;
      templatePT += `*💰 Valor:* ${valorFormatado}\n`;
      templatePT += `*🏷️ Categoria:* ${categoriaEscolhida.nome}\n`;
      templatePT += `*📅 Data:* ${dataFormatada}\n`;

      templatePT += `*📊 Tipo:* ${dados.tipo === "DESPESA" ? "Despesa" : "Receita"}\n`;

      const metodosPagamento: Record<string, string> = {
        CREDITO: "💳 Cartão de Crédito",
        DEBITO: "💳 Cartão de Débito",
        PIX: "📱 PIX",
        DINHEIRO: "💵 Dinheiro",
        TRANSFERENCIA: "🔄 Transferência",
      };

      const metodoPagamentoText =
        metodosPagamento[dados.metodoPagamento as string] ||
        "💳 " + dados.metodoPagamento;

      templatePT += `*${metodoPagamentoText.split(" ")[0]} Método:* ${metodoPagamentoText.replace(/💳|📱|💵|🔄/g, "").trim()}\n`;

      if (cartaoEncontrado) {
        templatePT += `*🔸 Cartão:* ${cartaoEncontrado.nome}\n`;

        if (cartaoEncontrado.limiteDisponivel !== undefined) {
          const limiteDisponivel = cartaoEncontrado.limiteDisponivel;
          const utilizacaoPercentual = cartaoEncontrado.utilizacaoLimite || 0;

          templatePT += `*📊 Limite disponível:* ${limiteDisponivel.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n`;
          templatePT += `*📈 Utilização:* ${utilizacaoPercentual.toFixed(1)}%\n`;
        } else if (
          cartaoEncontrado.limite &&
          cartaoEncontrado.totalGasto !== undefined
        ) {
          const limiteDisponivel =
            cartaoEncontrado.limite - cartaoEncontrado.totalGasto;
          const utilizacaoPercentual =
            cartaoEncontrado.limite > 0
              ? (cartaoEncontrado.totalGasto / cartaoEncontrado.limite) * 100
              : 0;

          templatePT += `*📊 Limite disponível:* ${limiteDisponivel.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n`;
          templatePT += `*📈 Utilização:* ${utilizacaoPercentual.toFixed(1)}%\n`;
        }
      }

      if (userId) {
        const hoje = new Date();
        const mesReferencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
        const limiteCategoria = await UserService.buscarLimiteCategoria(
          categoriaEscolhida.id,
          userId,
          mesReferencia,
        );

        if (limiteCategoria) {
          const gastoAtual = limiteCategoria.gastoAtual || 0;
          const novoGasto = gastoAtual + parseFloat(dados.valor);
          const limite = limiteCategoria.limiteMensal;
          const percentualAtual = (gastoAtual / limite) * 100;
          const percentualNovo = (novoGasto / limite) * 100;

          templatePT += `*📊 LIMITE DA CATEGORIA:*\n`;
          templatePT += `   • Antes: ${gastoAtual.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} / ${limite.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} (${percentualAtual.toFixed(1)}%)\n`;
          templatePT += `   • Depois: ${novoGasto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} / ${limite.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} (${percentualNovo.toFixed(1)}%)\n`;

          if (novoGasto > limite) {
            templatePT += `   ⚠️ *ATENÇÃO: Limite ultrapassado!*\n`;
          }
        }
      }

      // NOVO: Tratamento de divisão personalizada na confirmação
      if (dados.ehCompartilhado && dados.nomeUsuarioCompartilhado) {
        const valorTotal = parseFloat(dados.valor);

        // Calcular valores baseados no tipo de divisão
        let valorUsuario = 0;
        let valorCompartilhado = 0;
        let infoDivisao = "";

        if (dados.tipoDivisao === "porcentagem" && dados.porcentagemUsuario) {
          const porcentagem = dados.porcentagemUsuario / 100;
          valorUsuario = valorTotal * porcentagem;
          valorCompartilhado = valorTotal - valorUsuario;
          infoDivisao = `📊 Divisão: ${dados.porcentagemUsuario}% / ${100 - dados.porcentagemUsuario}%`;
        } else if (dados.tipoDivisao === "valor_fixo" && dados.valorUsuario) {
          valorUsuario = dados.valorUsuario;
          valorCompartilhado = valorTotal - valorUsuario;
          infoDivisao = `💰 Divisão: Valor específico`;
        } else {
          // Divisão padrão (metade)
          valorUsuario = valorTotal / 2;
          valorCompartilhado = valorTotal / 2;
          infoDivisao = `📊 Divisão: Metade (50/50)`;
        }

        templatePT += `*👥 Compartilhado com:* ${dados.nomeUsuarioCompartilhado}\n`;
        templatePT += `*${infoDivisao}*\n`;
        templatePT += `*🤝 Sua parte:* ${valorUsuario.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n`;
        templatePT += `*👤 Parte ${dados.nomeUsuarioCompartilhado}:* ${valorCompartilhado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n`;
      }

      if (dados.ehParcelado && dados.parcelas) {
        const valorParcela = parseFloat(dados.valor) / dados.parcelas;
        templatePT += `*🔢 Parcelamento:* ${dados.parcelas}x de ${valorParcela.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n`;
      }

      templatePT += `\n━━━━━━━━━━━━━━\n\n`;
      templatePT += `*Por favor, confirme:*\n\n`;
      templatePT += `✅ *SIM* - Para confirmar este lançamento\n`;
      templatePT += `❌ *NÃO* - Para cancelar\n\n`;
      templatePT += `_⏰ Esta confirmação expira em 5 minutos_`;

      return templatePT;
    }
  }

  // Processamento principal de mensagem de texto
  static async processarMensagemTexto(message: any) {
    const userMessage = message.text?.body;
    const userPhone = message.from;
    const messageId = message.id;

    console.log("👤 Mensagem de:", userPhone);
    console.log("💬 Texto:", userMessage);
    console.log("🆔 Message ID:", messageId);

    // Buscar usuário com suas configurações
    const session = await UserService.getUserByPhone(userPhone);
    if (!session) {
      await WhatsAppService.sendMessage(
        userPhone,
        "❌ Seu número não está vinculado a nenhuma conta.\n\n💡 Acesse o app BeCash e vincule seu WhatsApp em Configurações.",
      );
      return { status: "user_not_found" };
    }

    const userId = session.user.id;
    const idiomaPreferido = session.idiomaPreferido || "pt-BR";
    console.log(`🌐 IDIOMA PREFERIDO DO USUÁRIO: ${idiomaPreferido}`);

    // Inicializar cache ANTES de verificar pendências
    if (!global.pendingLancamentos) {
      console.log("🔄 Criando novo cache de pendingLancamentos");
      global.pendingLancamentos = new Map();
    }

    const telefoneBusca = normalizarTelefone(userPhone);
    console.log(`🔍 Verificando lançamentos pendentes...`);
    console.log(`📞 Telefone normalizado: ${telefoneBusca}`);

    // PRIMEIRO: verificar se há lançamento pendente para este usuário
    const pendingLancamento = global.pendingLancamentos?.get(telefoneBusca);

    if (pendingLancamento) {
      console.log(`✅ LANÇAMENTO PENDENTE ENCONTRADO`);

      const validacao = validarLancamentoPendente(
        pendingLancamento,
        Date.now(),
      );

      if (!validacao.valido) {
        if (validacao.motivo === "expired") {
          console.log(`⏰ Lançamento expirado`);
          global.pendingLancamentos.delete(telefoneBusca);

          let mensagemExpirado = "";
          if (idiomaPreferido === "en-US") {
            mensagemExpirado =
              "❌ Confirmation expired (5 minutes).\n\n💡 Send the transaction again.";
          } else {
            mensagemExpirado =
              "❌ A confirmação expirou (5 minutos).\n\n💡 Envie novamente o lançamento.";
          }

          await WhatsAppService.sendMessage(userPhone, mensagemExpirado);
          return { status: "expired" };
        }
      }

      // USUÁRIO TEM LANÇAMENTO PENDENTE - tratar como resposta à confirmação
      const resposta = userMessage.toLowerCase().trim();

      if (isConfirmacao(resposta)) {
        console.log(`✅ USUÁRIO CONFIRMOU`);
        return await this.processarConfirmacao(
          "sim",
          pendingLancamento,
          telefoneBusca,
        );
      }

      if (isCancelamento(resposta)) {
        console.log(`❌ USUÁRIO CANCELOU`);
        return await this.processarConfirmacao(
          "não",
          pendingLancamento,
          telefoneBusca,
        );
      }

      // Resposta não reconhecida - mas usuário ainda tem pendente
      let mensagemInvalida = "";
      if (idiomaPreferido === "en-US") {
        mensagemInvalida =
          `❌ I didn't understand your response: "${userMessage}"\n\n` +
          `Reply with:\n` +
          `✅ *YES* - To confirm the transaction\n` +
          `❌ *NO* - To cancel\n\n` +
          `Or send a new message to create another transaction.`;
      } else {
        mensagemInvalida =
          `❌ Não entendi sua resposta: "${userMessage}"\n\n` +
          `Responda com:\n` +
          `✅ *SIM* - Para confirmar o lançamento\n` +
          `❌ *NÃO* - Para cancelar\n\n` +
          `Ou envie uma nova mensagem para criar outro lançamento.`;
      }

      await WhatsAppService.sendMessage(userPhone, mensagemInvalida);
      return { status: "invalid_confirmation_response" };
    }

    // SE NÃO HÁ LANÇAMENTO PENDENTE, então processar como nova mensagem/comando

    // Detectar comando com IA
    const comandoIA = await AIService.detectarComandoComIA(userMessage);

    console.log(
      `🤖 Comando detectado pela IA: ${comandoIA.tipo} (idioma: ${comandoIA.idioma})`,
    );

    if (comandoIA.tipo && comandoIA.tipo !== "NENHUM") {
      if (comandoIA.tipo === "LISTAR_CATEGORIAS") {
        await this.processarComandoCategorias(
          userPhone,
          userId,
          idiomaPreferido,
        );
        return { status: "command_processed" };
      }

      if (comandoIA.tipo === "AJUDA") {
        await this.enviarMensagemAjuda(userPhone, idiomaPreferido);
        return { status: "command_processed" };
      }
    }

    // Se não é comando e não tem pendência, tratar como novo lançamento
    if (userMessage && userPhone) {
      // Extrair dados
      const dadosExtracao = await AIService.extrairDadosComIA(
        userMessage,
        idiomaPreferido,
      );
      console.log("📊 Dados extraídos:", dadosExtracao);

      if (!dadosExtracao.sucesso) {
        let erroMsg = "";
        if (idiomaPreferido === "en-US") {
          erroMsg = `❌ ${dadosExtracao.erro}\n\n💡 Example: "I spent 50 on lunch"`;
        } else {
          erroMsg = `❌ ${dadosExtracao.erro}\n\n💡 Exemplo: "Gastei 50 no almoço"`;
        }

        await WhatsAppService.sendMessage(userPhone, erroMsg);
        return { status: "extraction_failed" };
      }

      // Buscar categorias
      const categoriasUsuario = await UserService.getCategoriasUsuario(userId);
      console.log("🏷️ Categorias do usuário:", categoriasUsuario);

      if (categoriasUsuario.length === 0) {
        let mensagemErro = "";
        if (idiomaPreferido === "en-US") {
          mensagemErro =
            "❌ No categories found. Create categories first in the app.";
        } else {
          mensagemErro =
            "❌ Nenhuma categoria encontrada. Crie categorias primeiro no app.";
        }
        await WhatsAppService.sendMessage(userPhone, mensagemErro);
        return { status: "no_categories" };
      }

      const categoriaEscolhida = await AIService.escolherMelhorCategoria(
        dadosExtracao.dados.descricao,
        categoriasUsuario,
        dadosExtracao.dados.tipo,
        dadosExtracao.dados.categoriaSugerida,
      );

      if (!categoriaEscolhida) {
        let mensagemErro = "";
        if (idiomaPreferido === "en-US") {
          mensagemErro = `❌ No ${dadosExtracao.dados.tipo === "DESPESA" ? "expense" : "income"} category found.`;
        } else {
          mensagemErro = `❌ Nenhuma categoria do tipo ${dadosExtracao.dados.tipo} encontrada.`;
        }
        await WhatsAppService.sendMessage(userPhone, mensagemErro);
        return { status: "no_matching_category" };
      }

      // Limpar descrição
      const descricaoLimpa = await AIService.limparDescricaoComClaude(
        dadosExtracao.dados.descricao,
        idiomaPreferido,
      );

      // Identificar cartão
      let cartaoEncontrado = null;
      if (dadosExtracao.dados.metodoPagamento === "CREDITO") {
        cartaoEncontrado = await LancamentoService.identificarCartao(
          userMessage,
          userId,
        );
      }

      // Gerar mensagem de confirmação
      const mensagemConfirmacao = await this.gerarMensagemConfirmacao(
        dadosExtracao.dados,
        descricaoLimpa,
        categoriaEscolhida,
        cartaoEncontrado,
        userId,
        idiomaPreferido,
      );

      // Salvar no cache
      const lancamentoTemporario: LancamentoTemporario = {
        dados: dadosExtracao.dados,
        categoriaEscolhida,
        userId,
        userPhone,
        timestamp: Date.now(),
        descricaoLimpa,
        cartaoEncontrado,
        mensagemOriginal: userMessage,
        descricaoOriginal: dadosExtracao.dados.descricao,
      };

      global.pendingLancamentos.set(telefoneBusca, lancamentoTemporario);

      // Limpar após 5 minutos
      setTimeout(
        () => {
          if (global.pendingLancamentos?.has(telefoneBusca)) {
            global.pendingLancamentos.delete(telefoneBusca);
          }
        },
        5 * 60 * 1000,
      );

      await WhatsAppService.sendMessage(userPhone, mensagemConfirmacao);

      return { status: "waiting_confirmation" };
    }

    return { status: "processed" };
  }

  // Processar confirmação
  static async processarConfirmacao(
    resposta: string,
    pendingLancamento: LancamentoTemporario,
    userPhone: string,
  ) {
    console.log(`🎯 PROCESSANDO CONFIRMAÇÃO: ${resposta} para ${userPhone}`);

    const session = await UserService.getUserByPhone(userPhone);
    if (!session) {
      const mensagemErro =
        "❌ Your account was not found. The transaction has been canceled.";
      await WhatsAppService.sendMessage(userPhone, mensagemErro);
      global.pendingLancamentos?.delete(userPhone);
      return { status: "user_not_found" };
    }

    const idiomaPreferido = session.idiomaPreferido;

    // Remover do cache de pendentes
    global.pendingLancamentos?.delete(userPhone);
    console.log(`🗑️ Removido lançamento pendente para: ${userPhone}`);

    const respostaLower = resposta.toLowerCase().trim();

    if (isCancelamento(respostaLower)) {
      console.log(`❌ Usuário cancelou o lançamento`);
      const mensagemCancelamento =
        await this.gerarMensagemCancelamento(idiomaPreferido);
      await WhatsAppService.sendMessage(userPhone, mensagemCancelamento);
      return { status: "cancelled" };
    }

    if (isConfirmacao(respostaLower)) {
      console.log(`✅ Usuário confirmou - criando lançamento...`);
      try {
        // Criar o lançamento no banco de dados
        const resultadoCriacao = await LancamentoService.createLancamento(
          pendingLancamento.userId,
          pendingLancamento.dados,
          pendingLancamento.categoriaEscolhida,
          pendingLancamento.mensagemOriginal,
          pendingLancamento.descricaoLimpa,
          pendingLancamento.cartaoEncontrado,
        );

        // Gerar mensagem de confirmação final
        const mensagemFinal = await this.gerarMensagemConfirmacao(
          pendingLancamento.dados,
          pendingLancamento.descricaoLimpa,
          pendingLancamento.categoriaEscolhida,
          pendingLancamento.cartaoEncontrado,
          resultadoCriacao,
          idiomaPreferido,
        );

        await WhatsAppService.sendMessage(userPhone, mensagemFinal);
        console.log("✅ Lançamento confirmado e criado no banco de dados");

        return { status: "confirmed" };
      } catch (error: any) {
        console.error("❌ Erro ao criar lançamento:", error);

        let mensagemErro = "";
        if (idiomaPreferido === "en-US") {
          mensagemErro = `❌ Error creating transaction: ${error.message}\n\nTry again.`;
        } else {
          mensagemErro = `❌ Erro ao criar lançamento: ${error.message}\n\nTente novamente.`;
        }

        await WhatsAppService.sendMessage(userPhone, mensagemErro);
        return { status: "creation_error" };
      }
    }

    console.log(`⚠️ Resposta inválida na confirmação: ${resposta}`);

    let mensagemInvalida = "";
    if (idiomaPreferido === "en-US") {
      mensagemInvalida =
        `❌ I didn't understand your response: "${resposta}"\n\n` +
        `Reply with:\n` +
        `✅ *YES* - To confirm the transaction\n` +
        `❌ *NO* - To cancel\n\n` +
        `Or send a new message to create another transaction.`;
    } else {
      mensagemInvalida =
        `❌ Não entendi sua resposta: "${resposta}"\n\n` +
        `Responda com:\n` +
        `✅ *SIM* - Para confirmar o lançamento\n` +
        `❌ *NÃO* - Para cancelar\n\n` +
        `Ou envie uma nova mensagem para criar outro lançamento.`;
    }

    await WhatsAppService.sendMessage(userPhone, mensagemInvalida);
    return { status: "invalid_confirmation_response" };
  }
}
