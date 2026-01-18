// app/api/webhooks/whatsapp/services/lancamento.service.ts
import db from "@/lib/db";
import { FaturaService } from "@/lib/faturaService";
import { DadosLancamento } from "../types";
import { calcularDataBrasilia } from "../utils/formatters";
import { UserService } from "./user.service";
import { AIService } from "./ai.service";

export class LancamentoService {
  static async identificarCartao(texto: string, userId: string) {
    const textoLower = texto.toLowerCase();

    const cartoes = await db.cartao.findMany({
      where: {
        OR: [
          { userId: userId },
          { ColaboradorCartao: { some: { userId: userId } } },
        ],
      },
      include: {
        user: { select: { id: true, name: true } },
        lancamentos: {
          where: {
            pago: false,
            metodoPagamento: "CREDITO",
          },
        },
      },
    });

    console.log(`🔍 Buscando cartão no texto: "${textoLower}"`);
    console.log(
      `📋 Cartões disponíveis:`,
      cartoes.map((c) => ({
        id: c.id,
        nome: c.nome,
        bandeira: c.bandeira,
        limite: c.limite,
        totalLancamentos: c.lancamentos.length,
      })),
    );

    if (cartoes.length === 0) {
      console.log(`❌ Nenhum cartão cadastrado para o usuário`);
      return null;
    }

    const cartoesComTotais = cartoes.map((cartao) => {
      const totalUtilizado = cartao.lancamentos.reduce((total, lancamento) => {
        return total + lancamento.valor;
      }, 0);

      const limite = cartao.limite || 0;
      const utilizacaoPercentual =
        limite > 0
          ? (totalUtilizado / limite) * 100
          : totalUtilizado > 0
            ? 100
            : 0;

      return {
        ...cartao,
        totalGasto: totalUtilizado,
        utilizacaoLimite: utilizacaoPercentual,
        limiteDisponivel: limite - totalUtilizado,
      };
    });

    console.log(
      `📊 Cartões com totais calculados:`,
      cartoesComTotais.map((c) => ({
        nome: c.nome,
        limite: c.limite,
        totalGasto: c.totalGasto,
        limiteDisponivel: c.limiteDisponivel,
        utilizacao: c.utilizacaoLimite,
      })),
    );

    const cartaoMatches = cartoesComTotais.map((cartao) => {
      const nomeCartaoLower = cartao.nome.toLowerCase();
      const bandeiraLower = cartao.bandeira.toLowerCase();

      let pontuacao = 0;
      const palavrasCartao = nomeCartaoLower.split(/[\s-]+/);

      console.log(`🎯 Analisando cartão: "${cartao.nome}"`);
      console.log(
        `   💰 Limite: R$ ${cartao.limite}, Utilizado: R$ ${cartao.totalGasto}, Disponível: R$ ${cartao.limiteDisponivel}`,
      );

      if (textoLower.includes(nomeCartaoLower)) {
        pontuacao += 10;
        console.log(`   ✅ Nome completo encontrado (+10)`);
      }

      palavrasCartao.forEach((palavra) => {
        if (palavra.length > 3 && textoLower.includes(palavra)) {
          pontuacao += 5;
          console.log(`   ✅ Palavra "${palavra}" encontrada (+5)`);
        }
      });

      if (textoLower.includes(bandeiraLower)) {
        pontuacao += 4;
        console.log(`   ✅ Bandeira "${cartao.bandeira}" encontrada (+4)`);
      }

      const mapeamentoCartoes: { [key: string]: string[] } = {
        nubank: ["nu", "nubank", "nu bank", "roxinho", "roxo"],
        itau: ["itau", "itau uniclass", "uniclass", "itaú"],
        personnalité: ["personnalité", "personalite", "personalité"],
        bradesco: ["bradesco", "brad", "bradesco mastercard"],
        "bradesco elo": ["bradesco elo", "elo nanquim", "nanquim"],
        santander: ["santander", "santa"],
        "santander free": ["santander free", "free"],
        "santander universe": ["universe", "santander universe"],
        c6: ["c6", "c6 bank", "c6bank", "carbon"],
        "c6 carbon": ["carbon", "c6 carbon"],
        inter: ["inter", "inter medium", "inter mastercard"],
        ourocard: ["ourocard", "ouro", "ouro card", "visa infinite"],
        "ourocard visa infinite": [
          "ourocard visa infinite",
          "visa infinite",
          "infinite",
        ],
        visa: ["visa"],
        mastercard: ["mastercard", "master"],
        elo: ["elo"],
        "american express": ["american express", "amex", "american"],
        hipercard: ["hipercard", "hiper"],
      };

      Object.entries(mapeamentoCartoes).forEach(([nomeMapeado, keywords]) => {
        if (nomeCartaoLower.includes(nomeMapeado)) {
          keywords.forEach((keyword) => {
            if (textoLower.includes(keyword)) {
              pontuacao += 3;
              console.log(
                `   ✅ Keyword "${keyword}" para "${nomeMapeado}" (+3)`,
              );
            }
          });
        }
      });

      const padroesEspeciais = [
        { regex: /(cart[aã]o.*)(nubank|nu\s*bank)/i, cartao: "nubank" },
        { regex: /(cart[aã]o.*)(itau|ita[uú])/i, cartao: "itau" },
        { regex: /(cart[aã]o.*)(bradesco)/i, cartao: "bradesco" },
        { regex: /(cart[aã]o.*)(santander)/i, cartao: "santander" },
        { regex: /(cart[aã]o.*)(c6|c6\s*bank)/i, cartao: "c6" },
        { regex: /(cart[aã]o.*)(inter)/i, cartao: "inter" },
        { regex: /(cart[aã]o.*)(ourocard|ouro\s*card)/i, cartao: "ourocard" },
        { regex: /(visa\s*infinite)/i, cartao: "visa infinite" },
      ];

      padroesEspeciais.forEach((padrao) => {
        if (
          padrao.regex.test(textoLower) &&
          nomeCartaoLower.includes(padrao.cartao)
        ) {
          pontuacao += 8;
          console.log(
            `   ✅ Padrão especial "${padrao.cartao}" encontrado (+8)`,
          );
        }
      });

      console.log(`   📊 Pontuação final: ${pontuacao}`);

      return {
        cartao,
        pontuacao,
        palavrasCartao,
      };
    });

    cartaoMatches.sort((a, b) => b.pontuacao - a.pontuacao);

    console.log(`🏆 Ranking de cartões:`);
    cartaoMatches.forEach((match, index) => {
      console.log(
        `   ${index + 1}. ${match.cartao.nome}: ${match.pontuacao} pontos`,
      );
    });

    const melhorMatch = cartaoMatches[0];

    if (melhorMatch && melhorMatch.pontuacao >= 3) {
      console.log(
        `✅ Cartão selecionado: ${melhorMatch.cartao.nome} (${melhorMatch.pontuacao} pontos)`,
      );
      return melhorMatch.cartao;
    }

    console.log(
      `❌ Nenhum cartão adequado encontrado (melhor pontuação: ${melhorMatch?.pontuacao || 0})`,
    );

    if (textoLower.includes("crédito") || textoLower.includes("credito")) {
      const cartaoCreditoFallback = cartoes.find(
        (c) =>
          c.bandeira &&
          ["VISA", "MASTERCARD", "ELO", "AMERICAN_EXPRESS"].includes(
            c.bandeira,
          ),
      );

      if (cartaoCreditoFallback) {
        console.log(
          `⚠️ Usando fallback de crédito: ${cartaoCreditoFallback.nome}`,
        );
        return cartaoCreditoFallback;
      }
    }

    return null;
  }

  static async createLancamento(
    userId: string,
    dados: DadosLancamento,
    categoriaEscolhida: any,
    userMessage: string,
    descricaoLimpa: string,
    cartaoEncontrado?: any,
  ) {
    try {
      console.log(`🔥🔥🔥 CRIAÇÃO DE LANÇAMENTO INICIADA 🔥🔥🔥`);
      console.log(`📨 Mensagem recebida: "${userMessage}"`);

      const msgLower = userMessage?.toLowerCase() || "";
      if (msgLower.includes("compartilhada") && msgLower.includes("beatriz")) {
        dados.ehCompartilhado = true;
        dados.nomeUsuarioCompartilhado = "beatriz";
      }

      const dataLancamento = calcularDataBrasilia(dados.data);

      console.log(
        `📅 Data do lançamento (Brasília): ${dataLancamento.toLocaleDateString("pt-BR")}`,
      );

      let cartaoId = null;
      let usuarioAlvo = null;

      const valorTotal = parseFloat(dados.valor);
      let valorUsuarioCriador = valorTotal;
      let valorCompartilhado = 0;

      console.log(
        `🛒 Dados: Compartilhado=${dados.ehCompartilhado}, Parcelado=${dados.ehParcelado}, Parcelas=${dados.parcelas}`,
      );

      if (dados.metodoPagamento === "CREDITO") {
        cartaoEncontrado = await this.identificarCartao(
          dados.descricao,
          userId,
        );
        if (!cartaoEncontrado && userMessage) {
          cartaoEncontrado = await this.identificarCartao(userMessage, userId);
        }
        if (cartaoEncontrado) {
          cartaoId = cartaoEncontrado.id;
        } else {
          throw new Error(
            "Cartão de crédito mencionado, mas não identificado.",
          );
        }
      }

      if (dados.ehCompartilhado && dados.nomeUsuarioCompartilhado) {
        console.log(
          `🔍 Buscando usuário para compartilhamento: "${dados.nomeUsuarioCompartilhado}"`,
        );

        usuarioAlvo = await UserService.encontrarUsuarioPorNome(
          dados.nomeUsuarioCompartilhado,
          userId,
        );

        if (usuarioAlvo) {
          console.log(
            `✅ Usuário encontrado para compartilhamento: ${usuarioAlvo.name} (${usuarioAlvo.id})`,
          );
          valorCompartilhado = valorTotal / 2;
          valorUsuarioCriador = valorTotal / 2;
          console.log(
            `💰 VALORES DIVIDIDOS: Total=${valorTotal}, Seu=${valorUsuarioCriador}, Compartilhado=${valorCompartilhado}`,
          );
        } else {
          console.log(
            `❌ Usuário para compartilhamento não encontrado: "${dados.nomeUsuarioCompartilhado}"`,
          );
          console.log(`⚠️ Continuando sem compartilhamento...`);
          dados.ehCompartilhado = false;
          dados.nomeUsuarioCompartilhado = undefined;
        }
      }
      // LÓGICA DE PARCELAMENTO
      if (dados.ehParcelado && dados.parcelas && dados.parcelas > 1) {
        console.log(`🔄 CRIANDO PARCELAMENTO: ${dados.parcelas} parcelas`);

        const valorParcela = valorUsuarioCriador / dados.parcelas;
        const valorParcelaCompartilhada = valorCompartilhado / dados.parcelas;

        console.log(
          `💰 VALOR POR PARCELA: Sua parte=${valorParcela}, Compartilhada=${valorParcelaCompartilhada}`,
        );

        // Criar primeira parcela (lançamento principal)
        const lancamentoPrincipalData: any = {
          descricao: `${descricaoLimpa} (1/${dados.parcelas})`,
          valor: valorParcela,
          tipo: dados.tipo.toUpperCase(),
          metodoPagamento: dados.metodoPagamento,
          data: dataLancamento,
          categoriaId: categoriaEscolhida.id,
          userId: userId,
          pago: false,
          tipoParcelamento: "PARCELADO",
          parcelasTotal: dados.parcelas,
          parcelaAtual: 1,
          recorrente: false,
          observacoes:
            `Criado via WhatsApp - Categoria: ${categoriaEscolhida.nome}` +
            (cartaoEncontrado ? ` - Cartão: ${cartaoEncontrado.nome}` : "") +
            (usuarioAlvo ? ` - Compartilhado com: ${usuarioAlvo.name}` : "") +
            ` - Parcelado em ${dados.parcelas}x`,
        };

        if (dados.metodoPagamento === "CREDITO" && cartaoId) {
          lancamentoPrincipalData.cartaoId = cartaoId;
        }

        const lancamentoPrincipal = await db.lancamento.create({
          data: lancamentoPrincipalData,
          include: { categoria: true, cartao: true },
        });

        // Criar compartilhamento para a primeira parcela se necessário
        if (
          dados.ehCompartilhado &&
          usuarioAlvo &&
          valorParcelaCompartilhada > 0
        ) {
          await db.lancamentoCompartilhado.create({
            data: {
              lancamentoId: lancamentoPrincipal.id,
              usuarioCriadorId: userId,
              usuarioAlvoId: usuarioAlvo.id,
              valorCompartilhado: valorParcelaCompartilhada,
              status: "PENDENTE",
            },
          });
        }

        // Associar primeira parcela à fatura
        if (dados.metodoPagamento === "CREDITO" && cartaoId) {
          await FaturaService.adicionarLancamentoAFatura(
            lancamentoPrincipal.id,
          );
        }

        // CRIAR PARCELAS FUTURAS
        const parcelasFuturas = [];
        for (let i = 2; i <= dados.parcelas; i++) {
          const dataParcela = new Date(dataLancamento);
          dataParcela.setMonth(dataParcela.getMonth() + (i - 1));

          const parcelaData = {
            descricao: `${descricaoLimpa} (${i}/${dados.parcelas})`,
            valor: valorParcela,
            tipo: dados.tipo.toUpperCase(),
            metodoPagamento: dados.metodoPagamento,
            data: dataParcela,
            categoriaId: categoriaEscolhida.id,
            cartaoId: dados.metodoPagamento === "CREDITO" ? cartaoId : null,
            userId: userId,
            pago: false,
            tipoParcelamento: "PARCELADO",
            parcelasTotal: dados.parcelas,
            parcelaAtual: i,
            recorrente: false,
            lancamentoPaiId: lancamentoPrincipal.id,
            observacoes: `Parcela ${i} de ${dados.parcelas} - Criado via WhatsApp`,
          };

          parcelasFuturas.push(parcelaData);
        }

        // Criar todas as parcelas futuras
        if (parcelasFuturas.length > 0) {
          const parcelasCriadas = await db.lancamento.createManyAndReturn({
            data: parcelasFuturas,
          });

          // Associar cada parcela futura à sua fatura e criar compartilhamentos
          for (const parcela of parcelasCriadas) {
            if (dados.metodoPagamento === "CREDITO" && cartaoId) {
              await FaturaService.adicionarLancamentoAFatura(parcela.id);
            }

            // Criar compartilhamento para cada parcela futura
            if (
              dados.ehCompartilhado &&
              usuarioAlvo &&
              valorParcelaCompartilhada > 0
            ) {
              await db.lancamentoCompartilhado.create({
                data: {
                  lancamentoId: parcela.id,
                  usuarioCriadorId: userId,
                  usuarioAlvoId: usuarioAlvo.id,
                  valorCompartilhado: valorParcelaCompartilhada,
                  status: "PENDENTE",
                },
              });
            }
          }
        }

        console.log(
          `✅ PARCELAMENTO CRIADO: ${dados.parcelas} parcelas de R$ ${valorParcela.toFixed(2)}`,
        );

        return {
          lancamento: lancamentoPrincipal,
          cartaoEncontrado,
          usuarioAlvo,
          valorCompartilhado,
          valorUsuarioCriador,
          ehParcelado: true,
          parcelasTotal: dados.parcelas,
          valorParcela: valorParcela,
        };
      }

      if (dados.ehParcelado && dados.metodoPagamento !== "CREDITO") {
        console.log(
          `🚨 CORREÇÃO AUTOMÁTICA: Parcelamento forçado para CRÉDITO`,
        );
        dados.metodoPagamento = "CREDITO";
      }

      // SE NÃO FOR PARCELADO, CRIAR LANÇAMENTO ÚNICO
      const lancamentoData: any = {
        descricao: descricaoLimpa,
        valor: valorUsuarioCriador,
        tipo: dados.tipo.toUpperCase(),
        metodoPagamento: dados.metodoPagamento,
        data: dataLancamento,
        categoriaId: categoriaEscolhida.id,
        userId: userId,
        pago: dados.metodoPagamento !== "CREDITO",
        observacoes:
          `Criado via WhatsApp - Categoria: ${categoriaEscolhida.nome}` +
          (cartaoEncontrado ? ` - Cartão: ${cartaoEncontrado.nome}` : "") +
          (usuarioAlvo ? ` - Compartilhado com: ${usuarioAlvo.name}` : ""),
      };

      if (dados.metodoPagamento === "CREDITO" && cartaoId) {
        lancamentoData.cartaoId = cartaoId;
      }

      const lancamento = await db.lancamento.create({
        data: lancamentoData,
        include: { categoria: true, cartao: true },
      });

      // Compartilhamento para lançamento único
      if (dados.ehCompartilhado && usuarioAlvo) {
        await db.lancamentoCompartilhado.create({
          data: {
            lancamentoId: lancamento.id,
            usuarioCriadorId: userId,
            usuarioAlvoId: usuarioAlvo.id,
            valorCompartilhado: valorCompartilhado,
            status: "PENDENTE",
          },
        });
      }

      // Associar à fatura se for crédito
      if (dados.metodoPagamento === "CREDITO" && cartaoId) {
        await FaturaService.adicionarLancamentoAFatura(lancamento.id);
      }

      return {
        lancamento,
        cartaoEncontrado,
        usuarioAlvo,
        valorCompartilhado,
        valorUsuarioCriador,
      };
    } catch (error) {
      console.error("Erro ao criar lançamento:", error);
      throw error;
    }
  }
}
