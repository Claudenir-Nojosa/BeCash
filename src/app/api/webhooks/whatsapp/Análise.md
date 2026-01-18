# Documentação Completa - Rota WhatsApp BeCash

## Visão Geral

Esta rota API processa mensagens do WhatsApp Business para criar lançamentos financeiros automaticamente usando IA (Claude e OpenAI Whisper).

---

## Estrutura de Arquivos

```
app/api/webhooks/whatsapp/
├── route.ts                    # Handlers HTTP (GET/POST)
├── types/
│   └── index.ts               # Tipos TypeScript
├── utils/
│   ├── detectors.ts           # Detecção (idioma, comandos, parcelamento)
│   ├── extractors.ts          # Extração de dados de mensagens
│   ├── formatters.ts          # Formatação (valores, datas, moeda)
│   └── validators.ts          # Validações e normalizações
├── services/
│   ├── whatsapp.service.ts    # Comunicação com WhatsApp API
│   ├── ai.service.ts          # Integração com Claude e OpenAI
│   ├── user.service.ts        # Operações de usuário/categorias
│   └── lancamento.service.ts  # Criação de lançamentos
└── handlers/
    ├── message.handler.ts     # Processamento de mensagens de texto
    └── audio.handler.ts       # Processamento de áudios
```

---

## Fluxo de Processamento

### 1. Recepção da Mensagem (route.ts)
- Webhook recebe POST do WhatsApp
- Identifica tipo de mensagem (texto/áudio)
- Delega para handler apropriado

### 2. Validação de Usuário (user.service.ts)
- Normaliza telefone (remove DDI, adiciona 9)
- Busca usuário no banco de dados
- Carrega idioma preferido

### 3. Detecção de Comando (ai.service.ts)
- IA identifica se é comando ou lançamento
- Comandos: `LISTAR_CATEGORIAS`, `AJUDA`, `VER_SALDO`
- Se for comando, executa e retorna

### 4. Verificação de Confirmação Pendente
- Verifica cache global `pendingLancamentos`
- Se existe pendente, valida resposta (SIM/NÃO)
- Cria lançamento ou cancela

### 5. Extração de Dados (ai.service.ts + extractors.ts)
- IA extrai: tipo, valor, descrição, método, data
- Detecta compartilhamento e parcelamento
- Fallback para regex se IA falhar

### 6. Seleção de Categoria (ai.service.ts)
- IA escolhe categoria mais adequada
- Considera sugestão explícita do usuário

### 7. Identificação de Cartão (lancamento.service.ts)
- Se for CREDITO, busca cartão por nome/bandeira
- Calcula limites disponíveis

### 8. Geração de Confirmação (message.handler.ts)
- Cria mensagem formatada com todos os detalhes
- Mostra limites de cartão e categoria
- Armazena em cache temporário (5min)

### 9. Criação do Lançamento (lancamento.service.ts)
- Cria lançamento no banco
- Se parcelado: cria todas as parcelas
- Se compartilhado: cria relacionamento
- Associa à fatura (se crédito)

### 10. Resposta Final
- Mensagem de sucesso formatada
- Detalhes do lançamento criado

---

## Componentes Principais

### Types (types/index.ts)

Define estruturas de dados:
- `DadosLancamento`: Dados extraídos da mensagem
- `LancamentoTemporario`: Lançamento aguardando confirmação
- `UserSession`: Sessão do usuário (ID + idioma)
- `ComandoDetectado`: Resultado da detecção de comando
- `CompartilhamentoInfo`: Informações de compartilhamento
- `ParcelamentoInfo`: Informações de parcelamento

**Responsabilidades:**
- Garantir type-safety em todo o código
- Documentar estruturas de dados
- Facilitar autocompletar no IDE

### Detectors (utils/detectors.ts)

Funções de detecção sem IA (fallback rápido):

**Funções principais:**
- `detectarIdioma(mensagem)`: Detecta pt-BR ou en-US baseado em palavras-chave
- `detectarComando(mensagem)`: Identifica comandos manualmente (fallback)
- `detectarCompartilhamento(mensagem)`: Extrai nome do usuário para compartilhar
- `detectarParcelamento(mensagem)`: Identifica número de parcelas

**Quando usar:**
- Quando API da IA não está disponível
- Para validações rápidas
- Como fallback de segurança

### Extractors (utils/extractors.ts)

Extração de dados de mensagens usando regex:

**Funções principais:**
- `extrairDadosLancamento(mensagem)`: Usa regex patterns para extrair dados
- `extrairMetodoPagamento(texto, ehParcelado)`: Identifica PIX, CREDITO, DEBITO...
- `extrairMetodoPagamentoInternacional(texto, ehParcelado, idioma)`: Versão multi-idioma
- `tentarFallbackExtracao(mensagem, idioma)`: Último recurso quando tudo falha

**Padrões regex suportados:**
- Português: "Gastei 50 no almoço", "Paguei 100 com PIX"
- Inglês: "I spent 20 on ice cream", "Paid 50 for lunch"

### Formatters (utils/formatters.ts)

Formatação de saída para usuário:

**Funções principais:**
- `formatarValorComMoeda(valor, idioma)`: R$ 50,00 ou $50.00
- `traduzirMetodoPagamento(metodo, idioma)`: "💳 Cartão de Crédito" ou "💳 Credit Card"
- `calcularDataBrasilia(dataReferencia)`: Ajusta timezone para UTC-3

**Por que timezone Brasília?**
- Evita lançamentos com data errada
- Usuário envia "hoje" às 23h → não vira "amanhã"
- Consistência com app mobile

### Validators (utils/validators.ts)

Validações e normalizações:

**Funções principais:**
- `normalizarTelefone(telefone)`: Remove DDI, adiciona 9, etc
- `validarCredenciaisWhatsApp()`: Checa env vars
- `validarCredenciaisOpenAI()`: Checa API key
- `validarCredenciaisAnthropic()`: Checa API key
- `validarLancamentoPendente(pendingLancamento, timestamp)`: Verifica expiração
- `isConfirmacao(resposta)`: Detecta "sim", "yes", "ok"
- `isCancelamento(resposta)`: Detecta "não", "no", "cancel"

**Normalização de telefone:**
```
5585991486998 → 85991486998
5585991486998 → 85991486998 (13 dígitos, remove DDI)
558591486998  → 85991486998 (12 dígitos, adiciona 9)
991486998     → 85991486998 (fixo para Fortaleza)
```

### UserService (services/user.service.ts)

Operações relacionadas a usuários:

**Funções principais:**
- `getUserByPhone(userPhone)`: Busca usuário + idioma preferido
- `getCategoriasUsuario(userId)`: Lista todas as categorias
- `encontrarUsuarioPorNome(nome, userIdAtual)`: Busca para compartilhamento
- `buscarLimiteCategoria(categoriaId, userId, mesReferencia)`: Limites mensais

**Lógica de busca de usuário:**
1. Normaliza telefone
2. Gera variações: +5585..., 5585..., 85..., 991...
3. Busca no banco com OR
4. Carrega configurações (idioma)
5. Retorna `UserSession`

**Lógica de compartilhamento:**
1. Busca todos os usuários (exceto atual)
2. Compara nome por partes
3. Verifica apelidos comuns (Bia → Beatriz)
4. Retorna usuário com maior pontuação

### WhatsAppService (services/whatsapp.service.ts)

Comunicação com WhatsApp Business API:

**Funções principais:**
- `sendMessage(to, message)`: Envia mensagem de texto
- `downloadAudio(audioId)`: Baixa áudio do WhatsApp

**Normalização de número para envio:**
```typescript
// Exemplo: 85991486998 → 5585991486998
// Sempre adiciona DDI 55 se necessário
```

**Erros comuns:**
- 403: Token inválido ou expirado
- 404: Phone Number ID não encontrado
- 500: Erro no servidor do WhatsApp

### AIService (services/ai.service.ts)

Integração com IA (Claude e OpenAI):

**Funções principais:**
- `extrairDadosComIA(mensagem, idioma)`: Claude extrai dados estruturados
- `transcreverAudio(audioId)`: OpenAI Whisper transcreve
- `detectarComandoComIA(mensagem)`: Identifica intenção do usuário
- `limparDescricaoComClaude(descricaoOriginal, idioma)`: Remove lixo da descrição
- `escolherMelhorCategoria(descricao, categorias, tipo, categoriaSugerida)`: IA seleciona categoria
- `gerarMensagemComIA(template, dados, idioma)`: Traduz mensagens

**Extração com Claude:**
```json
{
  "tipo": "DESPESA",
  "valor": "50.00",
  "descricao": "Almoço",
  "categoriaSugerida": null,
  "metodoPagamento": "PIX"
}
```

**Limpeza de descrição:**
```
"uber cartao credito nubank" → "Uber"
"mercado paguei 50 reais"    → "Mercado"
"almoço no restaurante"      → "Almoço"
```

**Fallbacks:**
- Claude falha → Regex
- Regex falha → Fallback manual
- Sempre tem uma saída

### LancamentoService (services/lancamento.service.ts)

Criação de lançamentos no banco:

**Funções principais:**
- `identificarCartao(texto, userId)`: Encontra cartão por nome/bandeira
- `createLancamento(userId, dados, categoria, userMessage, descricao, cartao)`: Cria no banco

**Identificação de cartão:**
- Sistema de pontuação:
  - Nome completo: +10 pontos
  - Palavra do nome: +5 pontos
  - Bandeira: +4 pontos
  - Keyword mapeada: +3 pontos
  - Padrão especial: +8 pontos
- Mínimo 3 pontos para aceitar
- Calcula limite disponível automaticamente

**Criação de lançamento:**
1. Normaliza dados (data, valor, etc)
2. Identifica cartão (se CREDITO)
3. Busca usuário alvo (se compartilhado)
4. Calcula valores (divisão se compartilhado)
5. Cria lançamento principal
6. Se parcelado: cria parcelas futuras (2..N)
7. Cria relacionamentos de compartilhamento
8. Associa à fatura (se crédito)
9. Retorna resultado completo

**Parcelamento:**
```
Compra de R$ 600 em 3x:
- Parcela 1/3: R$ 200 (hoje)
- Parcela 2/3: R$ 200 (daqui 1 mês)
- Parcela 3/3: R$ 200 (daqui 2 meses)
```

**Compartilhamento:**
```
Despesa de R$ 100 com Maria:
- Seu valor: R$ 50
- Valor de Maria: R$ 50
- Status: PENDENTE
```

### MessageHandler (handlers/message.handler.ts)

Lógica principal de processamento de mensagens de texto:

**Funções principais:**
- `processarMensagemTexto(message)`: Fluxo completo de processamento
- `processarConfirmacao(resposta, pendingLancamento, userPhone)`: Cria ou cancela
- `gerarMensagemConfirmacao(dados, descricao, categoria, cartao, userIdOuResultado, idioma)`: Monta mensagem
- `enviarMensagemAjuda(userPhone, idioma)`: Help PT/EN
- `processarComandoCategorias(userPhone, userId, idioma)`: Lista categorias
- `gerarMensagemCancelamento(idioma)`: Mensagem de cancelamento

**Fluxo do processarMensagemTexto:**
```
1. Busca usuário (getUserByPhone)
2. Detecta comando (detectarComandoComIA)
3. Se comando → executa e retorna
4. Verifica cache pendente
5. Se pendente → processarConfirmacao
6. Se novo → extrai dados
7. Busca categorias
8. Escolhe categoria
9. Limpa descrição
10. Identifica cartão
11. Gera confirmação
12. Salva em cache (5min)
13. Envia mensagem
```

**Cache de confirmações:**
```typescript
global.pendingLancamentos = Map<string, LancamentoTemporario>
// Key: telefone normalizado
// Value: dados + timestamp
// Expira: 5 minutos
```

### AudioHandler (handlers/audio.handler.ts)

Processamento de mensagens de áudio:

**Funções principais:**
- `processarAudio(audioMessage, userPhone)`: Transcreve e delega para texto

**Fluxo:**
```
1. Valida usuário
2. Extrai audio ID
3. Transcreve com Whisper
4. Cria mensagem de texto virtual
5. Delega para MessageHandler
```

**Exemplo:**
```
[Áudio] "Gastei vinte reais no sorvete"
     ↓ Whisper
"Gastei vinte reais no sorvete"
     ↓ MessageHandler
[Processamento normal]
```

---

## Variáveis de Ambiente Necessárias

```bash
# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id
WHATSAPP_ACCESS_TOKEN=seu_access_token_permanente
WHATSAPP_VERIFY_TOKEN=qualquer_string_secreta

# IA - Claude (Anthropic)
ANTHROPIC_API_KEY=sk-ant-api03-...

# IA - OpenAI (Whisper)
OPENAI_API_KEY=sk-proj-...

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
```

---

## Exemplos de Uso

### Criar Despesa Simples
```
👤 Usuário: "Gastei 50 no almoço"

🤖 Bot: 
📋 CONFIRMAÇÃO DE LANÇAMENTO
━━━━━━━━━━━━━━
📝 Descrição: Almoço
💰 Valor: R$ 50,00
🏷️ Categoria: Alimentação
📅 Data: 18/01/2026
📊 Tipo: Despesa
📱 Método: PIX

Por favor, confirme:
✅ SIM - Para confirmar este lançamento
❌ NÃO - Para cancelar

👤 Usuário: "sim"

🤖 Bot:
✅ LANÇAMENTO REGISTRADO
━━━━━━━━━━━━━━
📝 Descrição: Almoço
💰 Valor total: R$ 50,00
🏷️ Categoria: Alimentação
📅 Data: 18/01/2026
━━━━━━━━━━━━━━
✨ Obrigado por usar o BeCash!
```

### Parcelamento
```
👤 Usuário: "Comprei 600 parcelado em 3x no crédito"

🤖 Bot:
📋 CONFIRMAÇÃO DE LANÇAMENTO
━━━━━━━━━━━━━━
📝 Descrição: Compra
💰 Valor: R$ 600,00
🏷️ Categoria: Compras
🔢 Parcelamento: 3x de R$ 200,00
💳 Método: Cartão de Crédito
🔸 Cartão: Nubank
📊 Limite disponível: R$ 2.300,00
📈 Utilização: 20.7%

Por favor, confirme:
✅ SIM - Para confirmar este lançamento
❌ NÃO - Para cancelar

👤 Usuário: "sim"

🤖 Bot:
✅ LANÇAMENTO REGISTRADO
━━━━━━━━━━━━━━
📝 Descrição: Compra
💰 Valor total: R$ 600,00
🏷️ Categoria: Compras

💳 PARCELAMENTO
   • 3x de R$ 200,00

💳 Cartão: Nubank
📅 Data: 18/01/2026
━━━━━━━━━━━━━━
✨ Obrigado por usar o BeCash!
```

### Compartilhamento
```
👤 Usuário: "Gastei 100 no jantar compartilhada com Maria"

🤖 Bot:
📋 CONFIRMAÇÃO DE LANÇAMENTO
━━━━━━━━━━━━━━
📝 Descrição: Jantar
💰 Valor: R$ 100,00
🏷️ Categoria: Alimentação
👥 Compartilhado com: Maria
🤝 Sua parte: R$ 50,00
👤 Parte Maria: R$ 50,00

Por favor, confirme:
✅ SIM - Para confirmar este lançamento
❌ NÃO - Para cancelar

👤 Usuário: "sim"

🤖 Bot:
✅ LANÇAMENTO REGISTRADO
━━━━━━━━━━━━━━
📝 Descrição: Jantar
💰 Valor total: R$ 100,00
🏷️ Categoria: Alimentação

👥 COMPARTILHAMENTO
   • Sua parte: R$ 50,00
   • Maria: R$ 50,00

📅 Data: 18/01/2026
━━━━━━━━━━━━━━
✨ Obrigado por usar o BeCash!
```

### Mensagem de Áudio
```
👤 Usuário: [🎙️ Áudio] "Gastei vinte reais no sorvete"

🤖 Bot: 
📝 Áudio transcrito: "Gastei vinte reais no sorvete"

📋 CONFIRMAÇÃO DE LANÇAMENTO
━━━━━━━━━━━━━━
📝 Descrição: Sorvete
💰 Valor: R$ 20,00
🏷️ Categoria: Alimentação
...
```

### Comando - Listar Categorias
```
👤 Usuário: "Quais categorias tenho?"

🤖 Bot:
📋 SUAS CATEGORIAS
━━━━━━━━━━━━━━

💸 DESPESAS:
1. Alimentação
2. Transporte
3. Saúde
4. Lazer
5. Moradia

💰 RECEITAS:
1. Salário
2. Freelance

━━━━━━━━━━━━━━
✨ Total: 7 categoria(s)
```

### Comando - Ajuda
```
👤 Usuário: "ajuda"

🤖 Bot:
🤖 AJUDA - BeCash WhatsApp
━━━━━━━━━━━━━━

📝 COMO CRIAR LANÇAMENTOS:

Exemplos simples:
- "Gastei 50 no almoço"
- "Recebi 1000 salário"
- "Paguei 200 na farmácia"

Com método de pagamento:
- "Gastei 80 no Uber com PIX"
- "Comprei 150 no mercado no crédito"
- "Paguei 45 em dinheiro"

Parcelado:
- "Comprei 600 parcelado em 3 vezes"
- "Gastei 1200 em 6x no crédito"

Compartilhado:
- "Gastei 100 no jantar compartilhada com Maria"

📋 COMANDOS DISPONÍVEIS:
- "Quais categorias tenho?"
- "Ajuda"

━━━━━━━━━━━━━━
💡 Dúvidas? Digite "ajuda"
```

---

## Padrões de Design Utilizados

### 1. Service Layer Pattern
Lógica de negócio separada em services:
```
UserService      → Operações de usuário
WhatsAppService  → Comunicação com WhatsApp
AIService        → Integração com IA
LancamentoService → Criação de lançamentos
```

### 2. Handler Pattern
Processamento de eventos específicos:
```
MessageHandler → Processa mensagens de texto
AudioHandler   → Processa mensagens de áudio
```

### 3. Strategy Pattern
Múltiplas estratégias de extração:
```
Estratégia 1: IA (Claude)
Estratégia 2: Regex (Português)
Estratégia 3: Regex (Inglês)
Estratégia 4: Fallback manual
```

### 4. Factory Pattern
Criação de diferentes tipos de lançamentos:
```
createLancamento() {
  if (parcelado) → criar N parcelas
  if (compartilhado) → criar relacionamento
  if (credito) → associar fatura
  else → criar simples
}
```

### 5. Cache Pattern
Cache em memória para confirmações:
```typescript
global.pendingLancamentos = Map<string, LancamentoTemporario>
// Expira automaticamente em 5min
```

---

## Pontos de Atenção

### Cache Global

```typescript
global.pendingLancamentos = new Map<string, LancamentoTemporario>()
```

**Características:**
- Armazenado em memória (RAM)
- Expira em 5 minutos
- Limpo automaticamente
- Usa telefone normalizado como chave
- Persiste entre requisições (mesmo processo Node.js)

**Limitações:**
- Perdido ao reiniciar servidor
- Não funciona em ambiente serverless (Vercel, Lambda)
- Para produção: considerar Redis ou similar

### Normalização de Telefone

**Sempre** use `normalizarTelefone()` antes de buscar no cache:

```typescript
// ❌ ERRADO
const pending = global.pendingLancamentos?.get(userPhone);

// ✅ CORRETO
const telefoneBusca = normalizarTelefone(userPhone);
const pending = global.pendingLancamentos?.get(telefoneBusca);
```

**Por quê?**
- WhatsApp pode enviar: `5585991486998`
- Cache pode ter: `85991486998`
- Sem normalização → não encontra

### Timezone Brasília

**Sempre** use `calcularDataBrasilia()` para datas:

```typescript
// ❌ ERRADO
const data = new Date(); // UTC+0

// ✅ CORRETO
const data = calcularDataBrasilia("hoje"); // UTC-3
```

**Problema real:**
```
Usuário envia às 23h (horário de Brasília)
Servidor cria com UTC → vira 02h do dia seguinte
Lançamento fica com data errada ❌
```

### Fallbacks em Cadeia

**Sistema de fallbacks garante que sempre funciona:**

```
1. IA (Claude) → 🎯 Mais preciso
   ↓ falha
2. Regex PT/EN → 🔧 Médio
   ↓ falha
3. Fallback Manual → 🔨 Básico
   ↓ falha
4. Erro ao usuário → ❌
```

**Exemplo:**
```typescript
try {
  return await AIService.extrairDadosComIA(mensagem, idioma);
} catch {
  try {
    return extrairDadosLancamento(mensagem);
  } catch {
    return tentarFallbackExtracao(mensagem, idioma);
  }
}
```

### Identificação de Cartão

**Sistema de pontuação evita falsos positivos:**

```
"comprei no nubank" 
→ Nubank: 13 pontos ✅ (nome completo + keyword)

"comprei cartão" 
→ Nenhum cartão: 0 pontos ❌ (abaixo do mínimo)

"paguei com o roxinho" 
→ Nubank: 3 pontos ✅ (keyword "roxinho")
```

**Mapeamento de keywords:**
```typescript
{
  nubank: ["nu", "nubank", "roxinho", "roxo"],
  itau: ["itau", "uniclass", "itaú"],
  c6: ["c6", "c6 bank", "carbon"],
  // ...
}
```

---

## Troubleshooting

### Problema: "Usuário não encontrado"

**Sintoma:**
```
❌ Seu número não está vinculado a nenhuma conta.
```

**Causas possíveis:**
1. Telefone não cadastrado no banco
2. Normalização incorreta
3. Formato diferente no banco

**Solução:**
```sql
-- Verificar no banco
SELECT id, name, telefone FROM "User" 
WHERE telefone LIKE '%85991486998%';

-- Testar variações
const variacoes = [
  '5585991486998',
  '85991486998',
  '+5585991486998',
  '991486998'
];
```

**Fix permanente:**
- Cadastrar telefone com formato consistente
- Melhorar `normalizarTelefone()` se necessário

### Problema: "Confirmação expirou"

**Sintoma:**
```
❌ A confirmação expirou (5 minutos).
```

**Causa:**
- Usuário demorou mais de 5min para responder

**Solução:**
```typescript
// Aumentar timeout (se necessário)
setTimeout(() => {
  // ...
}, 10 * 60 * 1000); // 10 minutos
```

**Alternativa:**
- Usuário deve reenviar mensagem original

### Problema: "Cartão não identificado"

**Sintoma:**
```
❌ Cartão de crédito mencionado, mas não identificado.
```

**Causas:**
1. Nome do cartão muito diferente
2. Usuário não tem cartão cadastrado
3. Pontuação abaixo de 3

**Debug:**
```typescript
// Ver pontuação de cada cartão
const matches = await identificarCartao("comprei no nu", userId);
console.log(matches); 
// [{cartao: {...}, pontuacao: 13}, ...]
```

**Soluções:**
- Adicionar keywords no mapeamento
- Pedir nome completo do cartão
- Cadastrar cartão no app

### Problema: "Categoria não encontrada"

**Sintoma:**
```
❌ Nenhuma categoria do tipo DESPESA encontrada.
```

**Causa:**
- Usuário não tem categorias cadastradas
- Categoria errada (DESPESA vs RECEITA)

**Solução:**
```sql
-- Verificar categorias
SELECT tipo, nome FROM "Categoria" 
WHERE "userId" = 'user_id_aqui';
```

**Fix:**
- Criar categorias no app primeiro
- Garantir tipo correto (DESPESA/RECEITA)

### Problema: "IA não está respondendo"

**Sintomas:**
- Timeout
- Erro 500
- Fallback sempre ativa

**Causas:**
1. API key inválida/expirada
2. Rate limit atingido
3. Serviço da Anthropic fora

**Debug:**
```typescript
// Testar API key
const response = await fetch("https://api.anthropic.com/v1/messages", {
  headers: {
    "x-api-key": process.env.ANTHROPIC_API_KEY,
  },
  // ...
});
console.log(response.status); // 200 = OK, 401 = API key inválida
```

**Soluções:**
- Verificar API key em `.env`
- Verificar billing da Anthropic
- Aguardar se for rate limit (usa fallback)

### Problema: "Áudio não transcreve"

**Sintomas:**
```
❌ Não consegui entender o áudio.
```

**Causas:**
1. Áudio muito baixo/ruim
2. OpenAI API key inválida
3. Formato de áudio não suportado

**Debug:**
```typescript
// Verificar formato do áudio
console.log(audioMessage.audio);
// { id: "...", mime_type: "audio/ogg" }
```

**Soluções:**
- Pedir usuário falar mais alto/claro
- Verificar OpenAI API key
- Sugerir enviar texto

### Problema: "Lançamento duplicado"

**Sintomas:**
- Mesmo lançamento criado 2x
- Usuário confirmou várias vezes

**Causa:**
- Cache foi limpo antes da confirmação
- Usuário mandou "sim" múltiplas vezes

**Prevenção:**
```typescript
// Adicionar flag de processamento
if (pendingLancamento.processando) {
  return { status: "already_processing" };
}
pendingLancamento.processando = true;
```

**Fix manual:**
```sql
-- Deletar duplicata
DELETE FROM "Lancamento" 
WHERE id = 'lancamento_duplicado_id';
```

---