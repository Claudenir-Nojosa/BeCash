// types/dashboard.ts
export interface ResumoFinanceiro {
  receita: number;
  despesa: number;
  despesasCompartilhadas: number;
  saldo: number;
  limites: number;
}

export interface MetaPessoal {
  id: string;
  titulo: string;
  descricao?: string;
  valorAlvo: number;
  valorAtual: number;
  dataAlvo: Date;
  categoria: string;
  cor: string;
  icone: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LimiteCategoria {
  id: string;
  categoriaId: string;
  limiteMensal: number;
  gastoAtual: number;
  mesReferencia: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  categoria: {
    id: string;
    nome: string;
    cor: string;
    icone: string;
  };
}
