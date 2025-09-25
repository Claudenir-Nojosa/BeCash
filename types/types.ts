// lib/types.ts

export type RegimeTributacao = 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL';

export interface Empresa {
  id: string;
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual: string | null;
  email: string | null;
  cidade: string | null;
  uf: string;
  regimeTributacao: RegimeTributacao;
  responsavel: string;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
  usuarioId: string;
}

export interface EntregaObrigacaoAcessoria {
  id: string;
  empresaObrigacaoId: string;
  mes: number;
  ano: number;
  entregue: boolean;
  dataEntrega: Date | null;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmpresaObrigacaoAcessoria {
  id: string;
  empresaId: string;
  obrigacaoAcessoriaId: string;
  diaVencimento: number;
  anteciparDiaNaoUtil: boolean;
  observacoes: string | null;
  entregas: EntregaObrigacaoAcessoria[];
}

export interface EmpresaComObrigacao extends Empresa {
  empresaObrigacaoAcessoria: EmpresaObrigacaoAcessoria;
}

