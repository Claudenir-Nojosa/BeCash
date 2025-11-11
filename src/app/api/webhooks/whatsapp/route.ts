// app/api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { FaturaService } from "@/lib/faturaService";

type DadosLancamento = {
  tipo: string;
  valor: string;
  descricao: string;
  metodoPagamento: string;
  data: string;
  ehCompartilhado?: boolean;
  nomeUsuarioCompartilhado?: string;
};

type ExtracaoSucesso = {
  sucesso: true;
  dados: DadosLancamento;
};

type ExtracaoErro = {
  sucesso: false;
  erro: string;
};

type ResultadoExtracao = ExtracaoSucesso | ExtracaoErro;

// Função para autenticar via API
async function getApiAuth() {
  const user = await db.user.findFirst();
  return user ? { user: { id: user.id } } : null;
}

// Função para buscar categorias do usuário
async function getCategoriasUsuario(userId: string) {
  try {
    const categorias = await db.categoria.findMany({
      where: { userId },
      orderBy: { nome: "asc" },
    });
    return categorias;
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return [];
  }
}
// Função para detectar se é lançamento compartilhado
function detectarCompartilhamento(mensagem: string): { 
  ehCompartilhado: boolean; 
  nomeUsuario?: string;
  tipoCompartilhamento?: string;
} {
  const texto = mensagem.toLowerCase();
  
  const padroesCompartilhamento = [
    /compartilhado com (.+)/i,
    /compartilhar com (.+)/i,
    /dividir com (.+)/i,
    /meio a meio com (.+)/i,
    /despesa compartilhada com (.+)/i,
    /receita compartilhada com (.+)/i,
  ];
  
  for (const padrao of padroesCompartilhamento) {
    const match = texto.match(padrao);
    if (match && match[1]) {
      return {
        ehCompartilhado: true,
        nomeUsuario: match[1].trim(),
        tipoCompartilhamento: texto.includes('despesa') ? 'DESPESA' : 
                             texto.includes('receita') ? 'RECEITA' : undefined
      };
    }
  }
  
  return { ehCompartilhado: false };
}

// Função para encontrar usuário pelo nome
async function encontrarUsuarioPorNome(nome: string, userIdAtual: string) {
  try {
    // Buscar todos os usuários (exceto o atual)
    const usuarios = await db.user.findMany({
      where: {
        NOT: { id: userIdAtual }
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    });
    
    // Procurar por nome similar
    const nomeBusca = nome.toLowerCase().trim();
    
    for (const usuario of usuarios) {
      const nomeUsuario = usuario.name.toLowerCase();
      
      // Verificação exata ou parcial
      if (nomeUsuario === nomeBusca || 
          nomeUsuario.includes(nomeBusca) || 
          nomeBusca.includes(nomeUsuario)) {
        return usuario;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
}
// Adicione esta função para limpar a descrição
function limparDescricao(descricao: string): string {
  const texto = descricao.toLowerCase();
  
  // Padrões para remover (partes após certas preposições)
  const padroesRemover = [
    /(?:\s+no\s+cartão\s+.+)$/i,
    /(?:\s+no\s+cartão\s+.+)$/i, // com acento
    /(?:\s+com\s+cartão\s+.+)$/i,
    /(?:\s+no\s+de\s+.+)$/i,
    /(?:\s+no\s+crédito\s+.+)$/i,
    /(?:\s+no\s+credito\s+.+)$/i,
    /(?:\s+no\s+débito\s+.+)$/i,
    /(?:\s+no\s+debito\s+.+)$/i,
    /(?:\s+via\s+pix.*)$/i,
    /(?:\s+com\s+pix.*)$/i,
  ];
  
  let descricaoLimpa = descricao;
  
  // Aplicar padrões de remoção
  padroesRemover.forEach(padrao => {
    descricaoLimpa = descricaoLimpa.replace(padrao, '');
  });
  
  // Remover palavras soltas de métodos de pagamento
  const palavrasRemover = [
    'cartão', 'cartao', 'débito', 'debito', 'crédito', 'credito', 
    'pix', 'transferencia', 'transferência', 'dinheiro', 'no', 'de',
    'nubank', 'itau', 'bradesco', 'santander', 'inter', 'c6', 'bb'
  ];
  
  palavrasRemover.forEach(palavra => {
    const regex = new RegExp(`\\s*\\b${palavra}\\b\\s*`, 'gi');
    descricaoLimpa = descricaoLimpa.replace(regex, ' ');
  });
  
  // Limpar espaços extras, pontuação estranha e capitalizar
  descricaoLimpa = descricaoLimpa
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .replace(/,\s*$/, '') // Remove vírgula no final
    .replace(/\.\s*$/, '') // Remove ponto no final
    .trim();
  
  // Capitalizar primeira letra
  if (descricaoLimpa.length > 0) {
    descricaoLimpa = descricaoLimpa.charAt(0).toUpperCase() + descricaoLimpa.slice(1);
  }
  
  return descricaoLimpa || 'Transação'; // Fallback se ficar vazia
}

// Função para a IA escolher a melhor categoria
async function escolherMelhorCategoria(
  descricao: string,
  categorias: any[],
  tipo: string
) {
  if (!process.env.ANTHROPIC_API_KEY) {
    // Fallback simples se não tiver API key
    const categoriasFiltradas = categorias.filter((c) => c.tipo === tipo);
    return categoriasFiltradas.length > 0 ? categoriasFiltradas[0] : null;
  }

  const categoriasFiltradas = categorias.filter((c) => c.tipo === tipo);

  if (categoriasFiltradas.length === 0) {
    return null;
  }

  const prompt = `Analise a descrição "${descricao}" e escolha a categoria mais adequada entre estas opções:

CATEGORIAS DISPONÍVEIS:
${categoriasFiltradas.map((c, i) => `${i + 1}. ${c.nome}`).join("\n")}

INSTRUÇÕES:
- Escolha APENAS o nome da categoria mais adequada
- Não explique, não dê justificativas
- Retorne apenas o nome exato da categoria escolhida
- Se não houver uma boa correspondência, escolha a primeira categoria

RESPOSTA (apenas o nome da categoria):`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
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

    // Encontrar a categoria correspondente
    return (
      categoriasFiltradas.find(
        (c) => c.nome.toLowerCase() === categoriaEscolhida.toLowerCase()
      ) || categoriasFiltradas[0]
    );
  } catch (error) {
    console.error("Erro ao escolher categoria com IA:", error);
    return categoriasFiltradas[0];
  }
}

// Adicione estas funções ANTES da função extrairDadosLancamento

function extrairMetodoPagamento(texto: string): string {
  const textoLower = texto.toLowerCase();

  if (textoLower.includes("débito") || textoLower.includes("debito")) {
    return "DEBITO";
  } else if (textoLower.includes("crédito") || textoLower.includes("credito")) {
    return "CREDITO";
  } else if (textoLower.includes("pix")) {
    return "PIX";
  } else if (
    textoLower.includes("transferência") ||
    textoLower.includes("transferencia")
  ) {
    return "TRANSFERENCIA";
  }

  // Default para débito se não especificado mas mencionar cartão
  if (textoLower.includes("cartão") || textoLower.includes("cartao")) {
    return "DEBITO";
  }

  return "PIX"; // fallback
}

// Função para identificar cartão específico
async function identificarCartao(texto: string, userId: string) {
  const textoLower = texto.toLowerCase();

  // Buscar cartões do usuário
  const cartoes = await db.cartao.findMany({
    where: {
      OR: [
        { userId: userId },
        { ColaboradorCartao: { some: { userId: userId } } },
      ],
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  // Procurar por menções específicas de cartões
  for (const cartao of cartoes) {
    const nomeCartaoLower = cartao.nome.toLowerCase();

    // Verificar se o texto menciona o nome do cartão
    if (textoLower.includes(nomeCartaoLower)) {
      return cartao;
    }

    // Verificar por bandeiras comuns
    const bandeiras = [
      "nubank",
      "itau",
      "bradesco",
      "santander",
      "inter",
      "c6",
      "bb",
    ];
    for (const bandeira of bandeiras) {
      if (
        textoLower.includes(bandeira) &&
        cartao.bandeira.toLowerCase().includes(bandeira)
      ) {
        return cartao;
      }
    }
  }

  return null;
}

// Função para analisar mensagens e extrair dados de lançamentos
function extrairDadosLancamento(mensagem: string): ResultadoExtracao {
  const texto = mensagem.toLowerCase().trim();
  
  // Primeiro detectar se é compartilhado
  const compartilhamento = detectarCompartilhamento(mensagem);
  
  // Padrão principal: [ação] [valor] [descrição] [método opcional] [data opcional]
  const padraoPrincipal = texto.match(
    /(gastei|paguei|recebi|ganhei)\s+(\d+[.,]?\d*)\s+(?:em|para|com|no)\s+(.+?)(?:\s+(?:no|com)\s+(cartão|pix|débito|dinheiro|crédito))?(?:\s+(hoje|ontem|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?))?/i
  );

  if (padraoPrincipal) {
    const [, acao, valor, descricao, metodo, data] = padraoPrincipal;

    // Usar a nova função para determinar método de pagamento
    const metodoPagamentoCorrigido = extrairMetodoPagamento(mensagem);
    
    // Determinar tipo baseado na ação e no compartilhamento
    let tipo = acao.includes("recebi") || acao.includes("ganhei") ? "RECEITA" : "DESPESA";
    
    // Se o compartilhamento especificou tipo, usar esse
    if (compartilhamento.tipoCompartilhamento) {
      tipo = compartilhamento.tipoCompartilhamento;
    }

    return {
      sucesso: true,
      dados: {
        tipo,
        valor: valor.replace(",", "."),
        descricao: descricao.trim(),
        metodoPagamento: metodoPagamentoCorrigido,
        data: data || "hoje",
        ehCompartilhado: compartilhamento.ehCompartilhado,
        nomeUsuarioCompartilhado: compartilhamento.nomeUsuario
      },
    };
  }

  // Padrão alternativo: [valor] [descrição] [implícito despesa]
  const padraoAlternativo = texto.match(
    /(\d+[.,]?\d*)\s+(?:em|para|com|no)\s+(.+)/i
  );

  if (padraoAlternativo) {
    const [, valor, descricao] = padraoAlternativo;

    // Usar a nova função para determinar método de pagamento
    const metodoPagamentoCorrigido = extrairMetodoPagamento(mensagem);

    return {
      sucesso: true,
      dados: {
        tipo: "DESPESA",
        valor: valor.replace(",", "."),
        descricao: descricao.trim(),
        metodoPagamento: metodoPagamentoCorrigido,
        data: "hoje",
        ehCompartilhado: compartilhamento.ehCompartilhado,
        nomeUsuarioCompartilhado: compartilhamento.nomeUsuario
      },
    };
  }

  return {
    sucesso: false,
    erro: "Não entendi o formato. Use: 'Gastei 50 no almoço' ou 'Recebi 1000 salário'",
  };
}

// Função para criar um lançamento via WhatsApp
async function createLancamento(
  userId: string,
  dados: any,
  categoriaEscolhida: any
) {
  try {
    // Processar data
    let dataLancamento = new Date();
    if (dados.data === "ontem") {
      dataLancamento.setDate(dataLancamento.getDate() - 1);
    } else if (dados.data.includes("/")) {
      const [dia, mes, ano] = dados.data.split("/").map(Number);
      dataLancamento = new Date(
        ano || new Date().getFullYear(),
        mes - 1 || new Date().getMonth(),
        dia || new Date().getDate()
      );
    }

    // Limpar e capitalizar a descrição
    const descricaoLimpa = limparDescricao(dados.descricao);

    let cartaoId = null;
    let cartaoEncontrado = null;
    let usuarioAlvo = null;

    // ✅ LÓGICA: Se for crédito, identificar cartão específico
    if (dados.metodoPagamento === "CREDITO") {
      cartaoEncontrado = await identificarCartao(dados.descricao, userId);

      if (cartaoEncontrado) {
        cartaoId = cartaoEncontrado.id;
      } else {
        throw new Error(
          "Cartão de crédito mencionado, mas não identificado. Especifique qual cartão (ex: Nubank, Itaú, etc.)"
        );
      }
    }

    // ✅ NOVA LÓGICA: Se for compartilhado, encontrar usuário
    if (dados.ehCompartilhado && dados.nomeUsuarioCompartilhado) {
      usuarioAlvo = await encontrarUsuarioPorNome(dados.nomeUsuarioCompartilhado, userId);
      
      if (!usuarioAlvo) {
        throw new Error(
          `Usuário "${dados.nomeUsuarioCompartilhado}" não encontrado. Verifique o nome.`
        );
      }
    }

    const lancamentoData: any = {
      descricao: descricaoLimpa,
      valor: parseFloat(dados.valor),
      tipo: dados.tipo.toUpperCase(),
      metodoPagamento: dados.metodoPagamento,
      data: dataLancamento,
      categoriaId: categoriaEscolhida.id,
      userId: userId,
      pago: dados.metodoPagamento !== "CREDITO",
      observacoes:
        `Criado via WhatsApp - Categoria: ${categoriaEscolhida.nome}` +
        (cartaoEncontrado ? ` - Cartão: ${cartaoEncontrado.nome}` : '') +
        (usuarioAlvo ? ` - Compartilhado com: ${usuarioAlvo.name}` : ''),
    };

    // ✅ ADICIONAR cartaoId apenas se for crédito e encontrou cartão
    if (dados.metodoPagamento === "CREDITO" && cartaoId) {
      lancamentoData.cartaoId = cartaoId;
    }

    const lancamento = await db.lancamento.create({
      data: lancamentoData,
      include: {
        categoria: true,
        cartao: true,
      },
    });

    // ✅ ✅ ✅ ADICIONE ESTA PARTE: Criar compartilhamento se necessário
    if (dados.ehCompartilhado && usuarioAlvo) {
      const valorTotal = parseFloat(dados.valor);
      const valorCompartilhado = valorTotal / 2; // Meio a meio
      
      await db.lancamentoCompartilhado.create({
        data: {
          lancamentoId: lancamento.id,
          usuarioCriadorId: userId,
          usuarioAlvoId: usuarioAlvo.id,
          valorCompartilhado: valorCompartilhado,
          status: "PENDENTE",
        },
      });
      
      console.log(`✅ Lançamento compartilhado criado com ${usuarioAlvo.name}`);
    }

    // ✅ Associar à fatura se for crédito
    if (dados.metodoPagamento === "CREDITO" && cartaoId) {
      try {
        await FaturaService.adicionarLancamentoAFatura(lancamento.id);
        console.log(`✅ Lançamento ${lancamento.id} associado à fatura`);
      } catch (faturaError) {
        console.error("❌ Erro ao associar à fatura:", faturaError);
      }
    }

    return {
      lancamento,
      cartaoEncontrado,
      usuarioAlvo, // ✅ Retornar info do usuário compartilhado
    };
  } catch (error) {
    console.error("Erro ao criar lançamento:", error);
    throw error;
  }
}

// Função principal do Claude API para criação de lançamentos
async function callClaudeAPICriacao(
  userMessage: string,
  dadosExtracao: any,
  categoriasUsuario: any[],
  categoriaEscolhida: any,
  resultadoCriacao?: any
) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY não configurada");
  }

  let prompt = `Você é o BeCash, um assistente financeiro profissional via WhatsApp. 

MENSAGEM DO CLIENTE: "${userMessage}"

`;

  if (dadosExtracao.sucesso) {
    // Formatar data para DD/MM/AAAA
    let dataFormatada;
    const hoje = new Date();

    if (dadosExtracao.dados.data === "hoje") {
      dataFormatada = hoje.toLocaleDateString("pt-BR");
    } else if (dadosExtracao.dados.data === "ontem") {
      const ontem = new Date(hoje);
      ontem.setDate(hoje.getDate() - 1);
      dataFormatada = ontem.toLocaleDateString("pt-BR");
    } else if (dadosExtracao.dados.data.includes("/")) {
      dataFormatada = dadosExtracao.dados.data;
    } else {
      dataFormatada = hoje.toLocaleDateString("pt-BR");
    }

    // Usar a descrição limpa
    const descricao = resultadoCriacao?.sucesso
      ? resultadoCriacao.lancamento.descricao
      : limparDescricao(dadosExtracao.dados.descricao);

    const valorFormatado = parseFloat(dadosExtracao.dados.valor).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );

  const metodosMap: { [key: string]: string } = {
  'PIX': 'PIX',
  'DEBITO': 'Cartão de Débito', 
  'CREDITO': 'Cartão de Crédito',
  'TRANSFERENCIA': 'Transferência'
};

const metodoText = metodosMap[dadosExtracao.dados.metodoPagamento] || 'PIX';

prompt += `
DADOS DO LANÇAMENTO:
• Valor: ${valorFormatado}
• Descrição: ${descricao}
• Categoria: ${categoriaEscolhida?.nome}
• Tipo: ${dadosExtracao.dados.tipo === "DESPESA" ? "Despesa" : "Receita"}
• Método: ${metodoText}
• Data: ${dataFormatada}
`;

// ✅ ✅ ✅ COLOQUE AQUI:
if (resultadoCriacao?.usuarioAlvo) {
  prompt += `• Compartilhado com: ${resultadoCriacao.usuarioAlvo.name}\n`;
  prompt += `• Valor compartilhado: R$ ${(parseFloat(dadosExtracao.dados.valor) / 2).toLocaleString('pt-BR')}\n`;
}

// E depois continua com:
if (resultadoCriacao?.cartaoEncontrado) {
  prompt += `• Cartão: ${resultadoCriacao.cartaoEncontrado.nome}\n`;
}

    if (resultadoCriacao) {
      if (resultadoCriacao.erro) {
        prompt += `

ERRO: ${resultadoCriacao.erro}

FORNEÇA UMA MENSAGEM PROFISSIONAL EXPLICANDO O ERRO:`;
      } else {
        prompt += `

✅ LANÇAMENTO REGISTRADO COM SUCESSO!

FORNEÇA UMA CONFIRMAÇÃO NO FORMATO FIXO ABAIXO:`;
      }
    } else {
      prompt += `

CONFIRME OS DADOS NO FORMATO FIXO ABAIXO:`;
    }
  } else {
    prompt += `

NÃO FOI POSSÍVEL IDENTIFICAR UM LANÇAMENTO.

ERRO: ${dadosExtracao.erro}

EXPLIQUE DE FORMA PROFISSIONAL COMO CRIAR UM LANÇAMENTO:`;
  }

  // 🔥 FORMATO FIXO ESTRITO - O Claude DEVE SEGUIR ISSO
  prompt += `

📌 Lançamento Confirmado
━━━━━━━━━━━━━━━

[APENAS OS DETALHES DO LANÇAMENTO AQUI - máximo 5-6 linhas]

━━━━━━━━━━━━━━━  
✨ Obrigado por organizar suas finanças!

🚫 **PROIBIDO:**
- Não adicione "Olá [nome]"
- Não use emojis diferentes 
- Não altere a estrutura
- Não adicione agradecimentos extras
- Não explique nada além dos detalhes

📝 **DETALHES PERMITIDOS (escolha os mais relevantes):**
- Descrição: [descrição limpa]
- Valor: R$ [valor]
- Categoria: [categoria]
- Método: [método pagamento] 
- Cartão: [nome cartão] (apenas se for crédito)
- Data: [data]
- Status: [status] (apenas se for crédito)

**RESPONDA APENAS NO FORMATO ACIMA SEM ALTERAÇÕES:**`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error("Erro ao chamar Claude API:", error);
    throw error;
  }
}

// Função REAL para enviar mensagem pelo WhatsApp Business API
async function sendWhatsAppMessage(to: string, message: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  console.log("🔑 Enviando mensagem REAL pelo WhatsApp...");
  console.log("📱 Phone Number ID:", phoneNumberId);
  console.log("👤 Para:", to);

  if (!phoneNumberId || !accessToken) {
    throw new Error("Credenciais do WhatsApp não configuradas");
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to,
          text: { body: message },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Erro ao enviar mensagem WhatsApp:", errorData);
      throw new Error(`Erro WhatsApp: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Mensagem enviada com sucesso:", data);
    return data;
  } catch (error) {
    console.error("💥 Erro no envio WhatsApp:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message && message.type === "text") {
      const userMessage = message.text?.body;
      const userPhone = message.from;

      console.log("👤 Mensagem de:", userPhone);
      console.log("💬 Texto:", userMessage);

      if (userMessage && userPhone) {
        // 1. Autenticar usuário
        const session = await getApiAuth();
        if (!session) {
          await sendWhatsAppMessage(
            userPhone,
            "🔐 Sistema em configuração. Em breve poderei criar seus lançamentos!"
          );
          return NextResponse.json({ status: "received" });
        }

        const userId = session.user.id;

        // 2. Extrair dados do lançamento
        const dadosExtracao = extrairDadosLancamento(userMessage);
        console.log("📊 Dados extraídos:", dadosExtracao);

        // 3. Buscar categorias do usuário e escolher a melhor
        let categoriaEscolhida = null;
        let categoriasUsuario: any[] = [];
        let resultadoCriacao = null;

        if (dadosExtracao.sucesso) {
          try {
            // Buscar categorias reais do usuário
            categoriasUsuario = await getCategoriasUsuario(userId);
            console.log("🏷️ Categorias do usuário:", categoriasUsuario);

            if (categoriasUsuario.length === 0) {
              throw new Error(
                "Nenhuma categoria encontrada. Crie categorias primeiro."
              );
            }

            // Escolher a melhor categoria com IA
            categoriaEscolhida = await escolherMelhorCategoria(
              dadosExtracao.dados.descricao,
              categoriasUsuario,
              dadosExtracao.dados.tipo
            );

            console.log("🎯 Categoria escolhida:", categoriaEscolhida?.nome);

            if (!categoriaEscolhida) {
              throw new Error(
                `Nenhuma categoria do tipo ${dadosExtracao.dados.tipo} encontrada.`
              );
            }

            const resultadoCreate = await createLancamento(
              userId,
              dadosExtracao.dados,
              categoriaEscolhida
            );
            resultadoCriacao = {
              sucesso: true,
              lancamento: resultadoCreate.lancamento,
              cartaoEncontrado: resultadoCreate.cartaoEncontrado, // ✅ AGORA INCLUI O CARTÃO
            };
            console.log("✅ Lançamento criado:", resultadoCreate.lancamento);
          } catch (error: any) {
            resultadoCriacao = { sucesso: false, erro: error.message };
            console.error("❌ Erro ao criar lançamento:", error);
          }
        }

        // 4. Processar com Claude
        let claudeResponse;
        try {
          claudeResponse = await callClaudeAPICriacao(
            userMessage,
            dadosExtracao,
            categoriasUsuario,
            categoriaEscolhida,
            resultadoCriacao
          );
          console.log("🤖 Resposta do Claude:", claudeResponse);
        } catch (error) {
          console.error("❌ Erro no Claude:", error);
          // Resposta fallback
          if (dadosExtracao.sucesso && resultadoCriacao?.sucesso) {
            claudeResponse = `✅ Lançamento criado! ${dadosExtracao.dados.descricao} - R$ ${dadosExtracao.dados.valor} (Categoria: ${categoriaEscolhida?.nome})`;
          } else if (dadosExtracao.sucesso) {
            claudeResponse = `⚠️ Erro: ${resultadoCriacao?.erro || "Não foi possível criar o lançamento"}`;
          } else {
            claudeResponse = `❌ ${dadosExtracao.erro}\n\n💡 Exemplo: "Gastei 50 no almoço"`;
          }
        }

        // 5. Enviar resposta
        try {
          console.log("📤 Enviando resposta...");
          await sendWhatsAppMessage(userPhone, claudeResponse);
          console.log("🎉 Resposta enviada!");
        } catch (whatsappError) {
          console.error("💥 Falha no envio:", whatsappError);
        }
      }
    }

    return NextResponse.json({ status: "received" });
  } catch (error) {
    console.error("💥 Erro geral no webhook:", error);
    return NextResponse.json({ status: "received" });
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const hubMode = url.searchParams.get("hub.mode");
  const hubToken = url.searchParams.get("hub.verify_token");
  const hubChallenge = url.searchParams.get("hub.challenge");

  console.log("🔐 Verificação do webhook:");
  console.log("   Mode:", hubMode);
  console.log("   Token recebido:", hubToken);
  console.log("   Token esperado:", process.env.WHATSAPP_VERIFY_TOKEN);

  if (
    hubMode === "subscribe" &&
    hubToken === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    console.log("✅ Webhook verificado com sucesso!");
    return new Response(hubChallenge, { status: 200 });
  }

  console.log("❌ Falha na verificação");
  return new Response("Verification failed", { status: 403 });
}
