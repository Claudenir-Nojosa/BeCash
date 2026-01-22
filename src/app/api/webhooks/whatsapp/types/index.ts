export type DadosLancamento = {
  tipo: string;
  valor: string;
  descricao: string;
  metodoPagamento: string;
  data: string;
  ehCompartilhado?: boolean;
  nomeUsuarioCompartilhado?: string;
  usernameCompartilhado?: string;
  ehParcelado?: boolean;
  parcelas?: number;
  tipoParcelamento?: string;
  categoriaSugerida?: string;
  // NOVOS CAMPOS PARA DIVISÃO PERSONALIZADA
  porcentagemUsuario?: number; // Ex: 60 (usuário paga 60%)
  valorUsuario?: number; // Ex: 6 (usuário paga R$ 6,00)
  tipoDivisao?: "metade" | "porcentagem" | "valor_fixo"; // Tipo de divisão
  userId?: string;
};

export type ExtracaoSucesso = {
  sucesso: true;
  dados: DadosLancamento;
};

export type ExtracaoErro = {
  sucesso: false;
  erro: string;
};

export type ResultadoExtracao = ExtracaoSucesso | ExtracaoErro;

export interface LancamentoTemporario {
  dados: DadosLancamento;
  categoriaEscolhida: any;
  userId: string;
  userPhone: string;
  timestamp: number;
  descricaoLimpa: string;
  cartaoEncontrado?: any;
  mensagemOriginal: string;
  descricaoOriginal: string;
}

export interface UserSession {
  user: {
    id: string;
    name: string;
  };
  idiomaPreferido?: string;
}

export interface ComandoDetectado {
  tipo: string | null;
  idioma?: string;
}

export interface CompartilhamentoInfo {
  ehCompartilhado: boolean;
  nomeUsuario?: string;
  tipoCompartilhamento?: string;
  // NOVOS CAMPOS
  porcentagemUsuario?: number;
  valorUsuario?: number;
  tipoDivisao?: "metade" | "porcentagem" | "valor_fixo";
}

export interface ParcelamentoInfo {
  ehParcelado: boolean;
  parcelas?: number;
  tipoParcelamento?: string;
}

export interface UsuarioParaCompartilhamento {
  id: string;
  name: string;
  username?: string;
  email: string;
  image?: string;
}
