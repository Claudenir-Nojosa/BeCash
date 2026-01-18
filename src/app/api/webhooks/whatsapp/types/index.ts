// app/api/webhooks/whatsapp/types/index.ts

export type DadosLancamento = {
  tipo: string;
  valor: string;
  descricao: string;
  metodoPagamento: string;
  data: string;
  ehCompartilhado?: boolean;
  nomeUsuarioCompartilhado?: string;
  ehParcelado?: boolean;
  parcelas?: number;
  tipoParcelamento?: string;
  categoriaSugerida?: string;
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
}

export interface ParcelamentoInfo {
  ehParcelado: boolean;
  parcelas?: number;
  tipoParcelamento?: string;
}