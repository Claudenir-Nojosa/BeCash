"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Filter,
  ChevronDown,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Search,
  MoreHorizontal,
  Share2,
  Users,
  UserCheck,
  UserX,
  Crown,
  Split,
  ArrowRight,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Tag,
  X,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Loading } from "@/components/ui/loading-barrinhas";
import { useTranslation } from "react-i18next";
import { useRouter, useParams } from "next/navigation";
import { getFallback } from "@/lib/i18nFallback";

interface Categoria {
  id: string;
  nome: string;
  tipo: string;
  cor: string;
  icone: string;
}

interface Cartao {
  id: string;
  nome: string;
  bandeira: string;
  cor: string;
  diaFechamento?: number;
  diaVencimento?: number;
  limite?: number;
}

interface Usuario {
  id: string;
  name: string;
  email: string;
  image?: string;
  username?: string;
}

interface LancamentoCompartilhado {
  id: string;
  status: string;
  valorCompartilhado: number;
  usuarioAlvo?: Usuario;
  usuarioCriador?: Usuario;
}

interface Lancamento {
  id: string;
  descricao: string;
  valor: number;
  tipo: string;
  metodoPagamento: string;
  data: string;
  pago: boolean;
  tipoParcelamento?: string;
  parcelasTotal?: number;
  parcelaAtual?: number;
  recorrente?: boolean;
  dataFimRecorrencia?: string;
  categoria: Categoria;
  cartao?: Cartao;
  lancamentosFilhos?: Lancamento[];
  LancamentoCompartilhado?: LancamentoCompartilhado[];
  userId: string;
  user?: Usuario;
  observacoes?: string;
}

export default function LancamentosPage() {
  const { t, i18n } = useTranslation("lancamentos");
  const params = useParams();
  const currentLang = (params?.lang as string) || "pt";

  // Função auxiliar para obter tradução com fallback
  const getTranslation = (key: string) => {
    // Primeiro tenta usar o i18n
    const translation = t(key);
    if (translation && translation !== key) {
      return translation;
    }

    // Fallback manual baseado nas chaves que você tem nos arquivos JSON
    switch (key) {
      // Título e subtítulo
      case "titulo":
        return getFallback(currentLang, "Lançamentos", "Transactions");
      case "subtitulo":
        return getFallback(
          currentLang,
          "Gerencie suas receitas e despesas",
          "Manage your income and expenses",
        );

      // Filtros
      case "categorias.filtros.titulo":
        return getFallback(currentLang, "Filtros", "Filters");
      case "categorias.filtros.categoria":
        return getFallback(currentLang, "Categoria", "Category");
      case "categorias.filtros.todos":
        return getFallback(
          currentLang,
          "Todas as categorias",
          "All categories",
        );
      case "categorias.filtros.tipoLancamento":
        return getFallback(
          currentLang,
          "Tipo de lançamento",
          "Transaction type",
        );
      case "categorias.filtros.individual":
        return getFallback(currentLang, "Individual", "Individual");
      case "categorias.filtros.compartilhado":
        return getFallback(currentLang, "Compartilhado", "Shared");
      case "categorias.filtros.tipo":
        return getFallback(currentLang, "Tipo", "Type");
      case "categorias.filtros.receita":
        return getFallback(currentLang, "Receita", "Income");
      case "categorias.filtros.despesa":
        return getFallback(currentLang, "Despesa", "Expense");
      case "categorias.filtros.status":
        return getFallback(currentLang, "Status", "Status");
      case "categorias.filtros.pago":
        return getFallback(currentLang, "Pago", "Paid");
      case "categorias.filtros.pendente":
        return getFallback(currentLang, "Pendente", "Pending");
      case "categorias.filtros.metodoPagamento":
        return getFallback(
          currentLang,
          "Método de pagamento",
          "Payment method",
        );

      // Estatísticas
      case "categorias.estatisticas.receitas":
        return getFallback(currentLang, "Receitas", "Income");
      case "categorias.estatisticas.despesas":
        return getFallback(currentLang, "Despesas", "Expenses");
      case "categorias.estatisticas.saldo":
        return getFallback(currentLang, "Saldo", "Balance");
      case "categorias.estatisticas.receitasPagas":
        return getFallback(currentLang, "Receitas pagas", "Paid income");
      case "categorias.estatisticas.despesasPagas":
        return getFallback(currentLang, "Despesas pagas", "Paid expenses");
      case "categorias.estatisticas.faltaReceber":
        return getFallback(currentLang, "Falta receber", "Income to receive");
      case "categorias.estatisticas.faltaPagar":
        return getFallback(currentLang, "Falta pagar", "Expenses to pay");

      // Ações
      case "categorias.acoes.novoLancamento":
        return getFallback(currentLang, "Novo Lançamento", "New Transaction");
      case "categorias.acoes.editar":
        return getFallback(currentLang, "Editar", "Edit");
      case "categorias.acoes.excluir":
        return getFallback(currentLang, "Excluir", "Delete");
      case "categorias.acoes.visualizar":
        return getFallback(currentLang, "Visualizar detalhes", "View details");
      case "categorias.acoes.compartilhar":
        return getFallback(currentLang, "Compartilhar", "Share");
      case "categorias.acoes.alterarStatus":
        return getFallback(currentLang, "Alterar status", "Change status");
      case "categorias.acoes.cancelar":
        return getFallback(currentLang, "Cancelar", "Cancel");
      case "categorias.acoes.confirmar":
        return getFallback(currentLang, "Confirmar", "Confirm");
      case "categorias.acoes.salvar":
        return getFallback(currentLang, "Salvar", "Save");
      case "categorias.acoes.fechar":
        return getFallback(currentLang, "Fechar", "Close");
      case "categorias.acoes.limpar":
        return getFallback(currentLang, "Limpar", "Clear");

      // Formulário
      case "categorias.formulario.tituloNovo":
        return getFallback(currentLang, "Novo Lançamento", "New Transaction");
      case "categorias.formulario.tituloEditar":
        return getFallback(
          currentLang,
          "Editar Lançamento",
          "Edit Transaction",
        );
      case "categorias.formulario.descricao":
        return getFallback(currentLang, "Descrição", "Description");
      case "categorias.formulario.valor":
        return getFallback(currentLang, "Valor", "Amount");
      case "categorias.formulario.tipo":
        return getFallback(currentLang, "Tipo", "Type");
      case "categorias.formulario.categoria":
        return getFallback(currentLang, "Categoria", "Category");
      case "categorias.formulario.tipoLancamento":
        return getFallback(
          currentLang,
          "Tipo de lançamento",
          "Transaction type",
        );
      case "categorias.formulario.metodoPagamento":
        return getFallback(
          currentLang,
          "Método de pagamento",
          "Payment method",
        );
      case "categorias.formulario.cartao":
        return getFallback(currentLang, "Cartão de Crédito", "Credit Card");
      case "categorias.formulario.data":
        return getFallback(currentLang, "Data", "Date");
      case "categorias.formulario.observacoes":
        return getFallback(currentLang, "Observações", "Notes");
      case "categorias.formulario.recorrente":
        return getFallback(currentLang, "Recorrente", "Recurring");
      case "categorias.formulario.tipoRecorrencia":
        return getFallback(
          currentLang,
          "Tipo de recorrência",
          "Recurrence type",
        );
      case "categorias.formulario.parcelamento":
        return getFallback(currentLang, "Parcelamento", "Installment");
      case "categorias.formulario.parcelas":
        return getFallback(
          currentLang,
          "Número de parcelas",
          "Number of installments",
        );
      case "categorias.formulario.compartilhamento":
        return getFallback(currentLang, "Compartilhamento", "Sharing");
      case "categorias.formulario.usuarioAlvo":
        return getFallback(
          currentLang,
          "Usuário para compartilhar",
          "User to share with",
        );
      case "categorias.formulario.valorCompartilhado":
        return getFallback(currentLang, "Valor compartilhado", "Shared amount");
      case "categorias.formulario.dataFimRecorrencia":
        return getFallback(
          currentLang,
          "Data de fim da recorrência",
          "Recurrence end date",
        );
      case "categorias.formulario.selecione":
        return getFallback(currentLang, "Selecione...", "Select...");
      case "categorias.formulario.selecioneCartao":
        return getFallback(
          currentLang,
          "Selecione um cartão...",
          "Select card...",
        );
      case "categorias.formulario.selecioneUsuario":
        return getFallback(
          currentLang,
          "Selecione um usuário...",
          "Select user...",
        );
      case "categorias.formulario.usuariosRecentes":
        return getFallback(currentLang, "Usuários Recentes", "Recent Users");
      case "categorias.formulario.buscarUsername":
        return getFallback(currentLang, "Buscar Username", "Search Username");
      case "categorias.formulario.digitarUsername":
        return getFallback(currentLang, "Digite o username", "Enter username");
      case "categorias.formulario.frequencia":
        return getFallback(currentLang, "Frequência", "Frequency");
      case "categorias.formulario.placeholderDescricao":
        return getFallback(
          currentLang,
          "Descrição do lançamento",
          "Transaction description",
        );
      case "categorias.formulario.placeholderValor":
        return getFallback(currentLang, "0,00", "0.00");
      case "categorias.formulario.placeholderObservacoes":
        return getFallback(
          currentLang,
          "Observações adicionais...",
          "Additional notes...",
        );

      // Opções de método de pagamento
      case "categorias.formulario.opcoesMetodoPagamento.dinheiro":
        return getFallback(currentLang, "Dinheiro", "Cash");
      case "categorias.formulario.opcoesMetodoPagamento.pix":
        return getFallback(currentLang, "PIX", "PIX");
      case "categorias.formulario.opcoesMetodoPagamento.debito":
        return getFallback(currentLang, "Cartão de Débito", "Debit Card");
      case "categorias.formulario.opcoesMetodoPagamento.credito":
        return getFallback(currentLang, "Cartão de Crédito", "Credit Card");
      case "categorias.formulario.opcoesMetodoPagamento.transferencia":
        return getFallback(
          currentLang,
          "Transferência Bancária",
          "Bank Transfer",
        );

      // Opções de tipo de recorrência
      case "categorias.formulario.opcoesTipoRecorrencia.recorrencia":
        return getFallback(currentLang, "Recorrência", "Recurring");
      case "categorias.formulario.opcoesTipoRecorrencia.parcelamento":
        return getFallback(currentLang, "Parcelamento", "Installments");

      // Opções de frequência
      case "categorias.formulario.opcoesFrequencia.mensal":
        return getFallback(currentLang, "Mensal", "Monthly");

      // Tabela
      case "categorias.tabela.descricao":
        return getFallback(currentLang, "Descrição", "Description");
      case "categorias.tabela.valor":
        return getFallback(currentLang, "Valor", "Amount");
      case "categorias.tabela.tipo":
        return getFallback(currentLang, "Tipo", "Type");
      case "categorias.tabela.categoria":
        return getFallback(currentLang, "Categoria", "Category");
      case "categorias.tabela.data":
        return getFallback(currentLang, "Data", "Date");
      case "categorias.tabela.status":
        return getFallback(currentLang, "Status", "Status");
      case "categorias.tabela.metodo":
        return getFallback(currentLang, "Método", "Method");
      case "categorias.tabela.acoes":
        return getFallback(currentLang, "Ações", "Actions");
      case "categorias.tabela.nenhumLancamento":
        return getFallback(
          currentLang,
          "Nenhum lançamento encontrado",
          "No transactions found",
        );
      case "categorias.tabela.pesquisar":
        return getFallback(
          currentLang,
          "Pesquisar lançamentos...",
          "Search transactions...",
        );
      case "categorias.tabela.mesAno":
        return getFallback(currentLang, "Mês/Ano", "Month/Year");

      // Status
      case "categorias.status.pago":
        return getFallback(currentLang, "Pago", "Paid");
      case "categorias.status.pendente":
        return getFallback(currentLang, "Pendente", "Pending");
      case "categorias.status.compartilhado":
        return getFallback(currentLang, "Compartilhado", "Shared");
      case "categorias.status.individual":
        return getFallback(currentLang, "Individual", "Individual");

      // Mensagens
      case "categorias.mensagens.confirmacaoExclusao":
        return getFallback(
          currentLang,
          "Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.",
          "Are you sure you want to delete this transaction? This action cannot be undone.",
        );
      case "categorias.mensagens.sucessoCriacao":
        return getFallback(
          currentLang,
          "Lançamento criado com sucesso!",
          "Transaction created successfully!",
        );
      case "categorias.mensagens.sucessoEdicao":
        return getFallback(
          currentLang,
          "Lançamento atualizado com sucesso!",
          "Transaction updated successfully!",
        );
      case "categorias.mensagens.sucessoExclusao":
        return getFallback(
          currentLang,
          "Lançamento excluído com sucesso!",
          "Transaction deleted successfully!",
        );
      case "categorias.mensagens.erroCriacao":
        return getFallback(
          currentLang,
          "Erro ao criar lançamento",
          "Error creating transaction",
        );
      case "categorias.mensagens.erroEdicao":
        return getFallback(
          currentLang,
          "Erro ao atualizar lançamento",
          "Error updating transaction",
        );
      case "categorias.mensagens.erroExclusao":
        return getFallback(
          currentLang,
          "Erro ao excluir lançamento",
          "Error deleting transaction",
        );
      case "categorias.mensagens.erroCarregar":
        return getFallback(
          currentLang,
          "Erro ao carregar dados",
          "Error loading data",
        );
      case "categorias.mensagens.carregando":
        return getFallback(currentLang, "Carregando...", "Loading...");
      case "categorias.mensagens.semDados":
        return getFallback(
          currentLang,
          "Nenhum lançamento para exibir",
          "No transactions to display",
        );
      case "categorias.mensagens.sucessoStatus":
        return getFallback(
          currentLang,
          "Status atualizado com sucesso!",
          "Status updated successfully!",
        );
      case "categorias.mensagens.digitarUsername":
        return getFallback(
          currentLang,
          "Digite um username para buscar",
          "Enter a username to search",
        );
      case "categorias.mensagens.usuarioEncontrado":
        return getFallback(currentLang, "Usuário encontrado!", "User found!");
      case "categorias.mensagens.usuarioNaoEncontrado":
        return getFallback(
          currentLang,
          "Usuário não encontrado",
          "User not found",
        );
      case "categorias.mensagens.erroBusca":
        return getFallback(
          currentLang,
          "Erro ao buscar usuário",
          "Error searching for user",
        );
      case "categorias.mensagens.nenhumUsuarioRecente":
        return getFallback(
          currentLang,
          "Nenhum usuário recente. Use a busca por username.",
          "No recent users. Use username search.",
        );

      // Meses
      case "categorias.meses.1":
        return getFallback(currentLang, "Janeiro", "January");
      case "categorias.meses.2":
        return getFallback(currentLang, "Fevereiro", "February");
      case "categorias.meses.3":
        return getFallback(currentLang, "Março", "March");
      case "categorias.meses.4":
        return getFallback(currentLang, "Abril", "April");
      case "categorias.meses.5":
        return getFallback(currentLang, "Maio", "May");
      case "categorias.meses.6":
        return getFallback(currentLang, "Junho", "June");
      case "categorias.meses.7":
        return getFallback(currentLang, "Julho", "July");
      case "categorias.meses.8":
        return getFallback(currentLang, "Agosto", "August");
      case "categorias.meses.9":
        return getFallback(currentLang, "Setembro", "September");
      case "categorias.meses.10":
        return getFallback(currentLang, "Outubro", "October");
      case "categorias.meses.11":
        return getFallback(currentLang, "Novembro", "November");
      case "categorias.meses.12":
        return getFallback(currentLang, "Dezembro", "December");

      // Detalhes
      case "categorias.detalhes.titulo":
        return getFallback(
          currentLang,
          "Detalhes do Lançamento",
          "Transaction Details",
        );
      case "categorias.detalhes.descricao":
        return getFallback(currentLang, "Descrição", "Description");
      case "categorias.detalhes.valorTotal":
        return getFallback(currentLang, "Valor total", "Total amount");
      case "categorias.detalhes.valorCompartilhado":
        return getFallback(currentLang, "Valor compartilhado", "Shared amount");
      case "categorias.detalhes.tipo":
        return getFallback(currentLang, "Tipo", "Type");
      case "categorias.detalhes.categoria":
        return getFallback(currentLang, "Categoria", "Category");
      case "categorias.detalhes.metodoPagamento":
        return getFallback(
          currentLang,
          "Método de pagamento",
          "Payment method",
        );
      case "categorias.detalhes.cartao":
        return getFallback(currentLang, "Cartão", "Card");
      case "categorias.detalhes.data":
        return getFallback(currentLang, "Data", "Date");
      case "categorias.detalhes.status":
        return getFallback(currentLang, "Status", "Status");
      case "categorias.detalhes.observacoes":
        return getFallback(currentLang, "Observações", "Notes");
      case "categorias.detalhes.recorrente":
        return getFallback(currentLang, "Recorrente", "Recurring");
      case "categorias.detalhes.parcelamento":
        return getFallback(currentLang, "Parcelamento", "Installment plan");
      case "categorias.detalhes.parcelaAtual":
        return getFallback(currentLang, "Parcela atual", "Current installment");
      case "categorias.detalhes.parcelasTotal":
        return getFallback(
          currentLang,
          "Total de parcelas",
          "Total installments",
        );
      case "categorias.detalhes.dataFimRecorrencia":
        return getFallback(
          currentLang,
          "Data de fim da recorrência",
          "Recurrence end date",
        );
      case "categorias.detalhes.compartilhamento":
        return getFallback(
          currentLang,
          "Informações de compartilhamento",
          "Sharing information",
        );
      case "categorias.detalhes.criador":
        return getFallback(currentLang, "Criado por", "Created by");
      case "categorias.detalhes.destinatario":
        return getFallback(currentLang, "Compartilhado com", "Shared with");

      // Ícones
      case "categorias.icones.filtro":
        return getFallback(currentLang, "Filtro", "Filter");
      case "categorias.icones.busca":
        return getFallback(currentLang, "Buscar", "Search");
      case "categorias.icones.adicionar":
        return getFallback(currentLang, "Adicionar", "Add");
      case "categorias.icones.editar":
        return getFallback(currentLang, "Editar", "Edit");
      case "categorias.icones.excluir":
        return getFallback(currentLang, "Excluir", "Delete");
      case "categorias.icones.visualizar":
        return getFallback(currentLang, "Visualizar", "View");
      case "categorias.icones.compartilhar":
        return getFallback(currentLang, "Compartilhar", "Share");
      case "categorias.icones.confirmar":
        return getFallback(currentLang, "Confirmar", "Confirm");
      case "categorias.icones.cancelar":
        return getFallback(currentLang, "Cancelar", "Cancel");
      case "categorias.icones.setaEsquerda":
        return getFallback(currentLang, "Mês anterior", "Previous month");
      case "categorias.icones.setaDireita":
        return getFallback(currentLang, "Próximo mês", "Next month");
      case "categorias.icones.olho":
        return getFallback(currentLang, "Visualizar", "View");
      case "categorias.icones.etiqueta":
        return getFallback(currentLang, "Categoria", "Category");
      case "categorias.icones.mais":
        return getFallback(currentLang, "Mais opções", "More options");

      default:
        return key;
    }
  };

  // Criar um objeto de traduções para fácil acesso
  const translations = {
    titulo: getTranslation("titulo"),
    subtitulo: getTranslation("subtitulo"),

    categorias: {
      filtros: {
        titulo: getTranslation("categorias.filtros.titulo"),
        categoria: getTranslation("categorias.filtros.categoria"),
        todos: getTranslation("categorias.filtros.todos"),
        tipoLancamento: getTranslation("categorias.filtros.tipoLancamento"),
        individual: getTranslation("categorias.filtros.individual"),
        compartilhado: getTranslation("categorias.filtros.compartilhado"),
        tipo: getTranslation("categorias.filtros.tipo"),
        receita: getTranslation("categorias.filtros.receita"),
        despesa: getTranslation("categorias.filtros.despesa"),
        status: getTranslation("categorias.filtros.status"),
        pago: getTranslation("categorias.filtros.pago"),
        pendente: getTranslation("categorias.filtros.pendente"),
        metodoPagamento: getTranslation("categorias.filtros.metodoPagamento"),
      },
      estatisticas: {
        receitas: getTranslation("categorias.estatisticas.receitas"),
        despesas: getTranslation("categorias.estatisticas.despesas"),
        saldo: getTranslation("categorias.estatisticas.saldo"),
        receitasPagas: getTranslation("categorias.estatisticas.receitasPagas"),
        despesasPagas: getTranslation("categorias.estatisticas.despesasPagas"),
        faltaReceber: getTranslation("categorias.estatisticas.faltaReceber"),
        faltaPagar: getTranslation("categorias.estatisticas.faltaPagar"),
      },
      acoes: {
        novoLancamento: getTranslation("categorias.acoes.novoLancamento"),
        editar: getTranslation("categorias.acoes.editar"),
        excluir: getTranslation("categorias.acoes.excluir"),
        visualizar: getTranslation("categorias.acoes.visualizar"),
        compartilhar: getTranslation("categorias.acoes.compartilhar"),
        alterarStatus: getTranslation("categorias.acoes.alterarStatus"),
        cancelar: getTranslation("categorias.acoes.cancelar"),
        confirmar: getTranslation("categorias.acoes.confirmar"),
        salvar: getTranslation("categorias.acoes.salvar"),
        fechar: getTranslation("categorias.acoes.fechar"),
        limpar: getTranslation("categorias.acoes.limpar"),
      },
      formulario: {
        tituloNovo: getTranslation("categorias.formulario.tituloNovo"),
        tituloEditar: getTranslation("categorias.formulario.tituloEditar"),
        descricao: getTranslation("categorias.formulario.descricao"),
        valor: getTranslation("categorias.formulario.valor"),
        tipo: getTranslation("categorias.formulario.tipo"),
        categoria: getTranslation("categorias.formulario.categoria"),
        tipoLancamento: getTranslation("categorias.formulario.tipoLancamento"),
        metodoPagamento: getTranslation(
          "categorias.formulario.metodoPagamento",
        ),
        cartao: getTranslation("categorias.formulario.cartao"),
        data: getTranslation("categorias.formulario.data"),
        observacoes: getTranslation("categorias.formulario.observacoes"),
        recorrente: getTranslation("categorias.formulario.recorrente"),
        tipoRecorrencia: getTranslation(
          "categorias.formulario.tipoRecorrencia",
        ),
        parcelamento: getTranslation("categorias.formulario.parcelamento"),
        parcelas: getTranslation("categorias.formulario.parcelas"),
        compartilhamento: getTranslation(
          "categorias.formulario.compartilhamento",
        ),
        usuarioAlvo: getTranslation("categorias.formulario.usuarioAlvo"),
        valorCompartilhado: getTranslation(
          "categorias.formulario.valorCompartilhado",
        ),
        dataFimRecorrencia: getTranslation(
          "categorias.formulario.dataFimRecorrencia",
        ),
        selecione: getTranslation("categorias.formulario.selecione"),
        selecioneCartao: getTranslation(
          "categorias.formulario.selecioneCartao",
        ),
        selecioneUsuario: getTranslation(
          "categorias.formulario.selecioneUsuario",
        ),
        usuariosRecentes: getTranslation(
          "categorias.formulario.usuariosRecentes",
        ),
        buscarUsername: getTranslation("categorias.formulario.buscarUsername"),
        digitarUsername: getTranslation(
          "categorias.formulario.digitarUsername",
        ),
        frequencia: getTranslation("categorias.formulario.frequencia"),
        placeholderDescricao: getTranslation(
          "categorias.formulario.placeholderDescricao",
        ),
        placeholderValor: getTranslation(
          "categorias.formulario.placeholderValor",
        ),
        placeholderObservacoes: getTranslation(
          "categorias.formulario.placeholderObservacoes",
        ),
        opcoesMetodoPagamento: {
          dinheiro: getTranslation(
            "categorias.formulario.opcoesMetodoPagamento.dinheiro",
          ),
          pix: getTranslation(
            "categorias.formulario.opcoesMetodoPagamento.pix",
          ),
          debito: getTranslation(
            "categorias.formulario.opcoesMetodoPagamento.debito",
          ),
          credito: getTranslation(
            "categorias.formulario.opcoesMetodoPagamento.credito",
          ),
          transferencia: getTranslation(
            "categorias.formulario.opcoesMetodoPagamento.transferencia",
          ),
        },
        opcoesTipoRecorrencia: {
          recorrencia: getTranslation(
            "categorias.formulario.opcoesTipoRecorrencia.recorrencia",
          ),
          parcelamento: getTranslation(
            "categorias.formulario.opcoesTipoRecorrencia.parcelamento",
          ),
        },
        opcoesFrequencia: {
          mensal: getTranslation(
            "categorias.formulario.opcoesFrequencia.mensal",
          ),
        },
      },
      tabela: {
        descricao: getTranslation("categorias.tabela.descricao"),
        valor: getTranslation("categorias.tabela.valor"),
        tipo: getTranslation("categorias.tabela.tipo"),
        categoria: getTranslation("categorias.tabela.categoria"),
        data: getTranslation("categorias.tabela.data"),
        status: getTranslation("categorias.tabela.status"),
        metodo: getTranslation("categorias.tabela.metodo"),
        acoes: getTranslation("categorias.tabela.acoes"),
        nenhumLancamento: getTranslation("categorias.tabela.nenhumLancamento"),
        pesquisar: getTranslation("categorias.tabela.pesquisar"),
        mesAno: getTranslation("categorias.tabela.mesAno"),
      },
      status: {
        pago: getTranslation("categorias.status.pago"),
        pendente: getTranslation("categorias.status.pendente"),
        compartilhado: getTranslation("categorias.status.compartilhado"),
        individual: getTranslation("categorias.status.individual"),
      },
      mensagens: {
        confirmacaoExclusao: getTranslation(
          "categorias.mensagens.confirmacaoExclusao",
        ),
        sucessoCriacao: getTranslation("categorias.mensagens.sucessoCriacao"),
        sucessoEdicao: getTranslation("categorias.mensagens.sucessoEdicao"),
        sucessoExclusao: getTranslation("categorias.mensagens.sucessoExclusao"),
        erroCriacao: getTranslation("categorias.mensagens.erroCriacao"),
        erroEdicao: getTranslation("categorias.mensagens.erroEdicao"),
        erroExclusao: getTranslation("categorias.mensagens.erroExclusao"),
        erroCarregar: getTranslation("categorias.mensagens.erroCarregar"),
        carregando: getTranslation("categorias.mensagens.carregando"),
        semDados: getTranslation("categorias.mensagens.semDados"),
        sucessoStatus: getTranslation("categorias.mensagens.sucessoStatus"),
        digitarUsername: getTranslation("categorias.mensagens.digitarUsername"),
        usuarioEncontrado: getTranslation(
          "categorias.mensagens.usuarioEncontrado",
        ),
        usuarioNaoEncontrado: getTranslation(
          "categorias.mensagens.usuarioNaoEncontrado",
        ),
        erroBusca: getTranslation("categorias.mensagens.erroBusca"),
        nenhumUsuarioRecente: getTranslation(
          "categorias.mensagens.nenhumUsuarioRecente",
        ),
      },
      meses: {
        "1": getTranslation("categorias.meses.1"),
        "2": getTranslation("categorias.meses.2"),
        "3": getTranslation("categorias.meses.3"),
        "4": getTranslation("categorias.meses.4"),
        "5": getTranslation("categorias.meses.5"),
        "6": getTranslation("categorias.meses.6"),
        "7": getTranslation("categorias.meses.7"),
        "8": getTranslation("categorias.meses.8"),
        "9": getTranslation("categorias.meses.9"),
        "10": getTranslation("categorias.meses.10"),
        "11": getTranslation("categorias.meses.11"),
        "12": getTranslation("categorias.meses.12"),
      },
      detalhes: {
        titulo: getTranslation("categorias.detalhes.titulo"),
        descricao: getTranslation("categorias.detalhes.descricao"),
        valorTotal: getTranslation("categorias.detalhes.valorTotal"),
        valorCompartilhado: getTranslation(
          "categorias.detalhes.valorCompartilhado",
        ),
        tipo: getTranslation("categorias.detalhes.tipo"),
        categoria: getTranslation("categorias.detalhes.categoria"),
        metodoPagamento: getTranslation("categorias.detalhes.metodoPagamento"),
        cartao: getTranslation("categorias.detalhes.cartao"),
        data: getTranslation("categorias.detalhes.data"),
        status: getTranslation("categorias.detalhes.status"),
        observacoes: getTranslation("categorias.detalhes.observacoes"),
        recorrente: getTranslation("categorias.detalhes.recorrente"),
        parcelamento: getTranslation("categorias.detalhes.parcelamento"),
        parcelaAtual: getTranslation("categorias.detalhes.parcelaAtual"),
        parcelasTotal: getTranslation("categorias.detalhes.parcelasTotal"),
        dataFimRecorrencia: getTranslation(
          "categorias.detalhes.dataFimRecorrencia",
        ),
        compartilhamento: getTranslation(
          "categorias.detalhes.compartilhamento",
        ),
        criador: getTranslation("categorias.detalhes.criador"),
        destinatario: getTranslation("categorias.detalhes.destinatario"),
      },
      icones: {
        filtro: getTranslation("categorias.icones.filtro"),
        busca: getTranslation("categorias.icones.busca"),
        adicionar: getTranslation("categorias.icones.adicionar"),
        editar: getTranslation("categorias.icones.editar"),
        excluir: getTranslation("categorias.icones.excluir"),
        visualizar: getTranslation("categorias.icones.visualizar"),
        compartilhar: getTranslation("categorias.icones.compartilhar"),
        confirmar: getTranslation("categorias.icones.confirmar"),
        cancelar: getTranslation("categorias.icones.cancelar"),
        setaEsquerda: getTranslation("categorias.icones.setaEsquerda"),
        setaDireita: getTranslation("categorias.icones.setaDireita"),
        olho: getTranslation("categorias.icones.olho"),
        etiqueta: getTranslation("categorias.icones.etiqueta"),
        mais: getTranslation("categorias.icones.mais"),
      },
    },
  };

  type PlanoUsuario = "free" | "pro" | "family";
  const [planoUsuario, setPlanoUsuario] = useState<PlanoUsuario | null>(null);
  const [carregandoPlano, setCarregandoPlano] = useState(true);
  const currencySymbol = currentLang === "en" ? "$" : "R$";
  const [carregandoVisualizacao, setCarregandoVisualizacao] = useState<
    string | null
  >(null);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(true);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [lancamentoSelecionado, setLancamentoSelecionado] =
    useState<Lancamento | null>(null);
  const [mostrarDialogVisualizar, setMostrarDialogVisualizar] = useState(false);
  const [mostrarDialogEditar, setMostrarDialogEditar] = useState(false);
  const [editando, setEditando] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [dialogAberto, setDialogAberto] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [buscaUsername, setBuscaUsername] = useState("");
  const [usuarioBuscado, setUsuarioBuscado] = useState<Usuario | null>(null);
  const [buscandoUsuario, setBuscandoUsuario] = useState(false);
  const [erroUsuario, setErroUsuario] = useState("");
  const [usuariosRecentes, setUsuariosRecentes] = useState<Usuario[]>([]);
  const [modoSelecao, setModoSelecao] = useState<"recentes" | "busca">(
    "recentes",
  );
  const router = useRouter();

  // Filtros
  const [filtros, setFiltros] = useState({
    categoria: "all",
    tipoLancamento: "all",
    tipo: "all",
    status: "all",
    metodoPagamento: "all",
    cartao: "all",
  });
  const [limiteFree, setLimiteFree] = useState<{
    atingido: boolean;
    total: number;
    usado: number;
  } | null>(null);
  const [anoSelecionado, setAnoSelecionado] = useState(
    new Date().getFullYear(),
  );
  const [mesSelecionado, setMesSelecionado] = useState(
    new Date().getMonth() + 1,
  );

  const carregarUsuarios = async () => {
    setCarregandoUsuarios(true);
    try {
      const response = await fetch("/api/usuarios");
      if (response.ok) {
        const data = await response.json();
        setUsuariosRecentes(data);
        console.log("Usuários recentes carregados:", data);
      } else {
        console.error("Erro ao carregar usuários:", response.status);
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    } finally {
      setCarregandoUsuarios(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    tipo: "despesa",
    categoria: "",
    tipoLancamento: "individual",
    tipoTransacao: "DINHEIRO",
    cartaoId: "",
    responsavel: "",
    pago: false,
    recorrente: false,
    tipoRecorrencia: "RECORRENCIA",
    frequencia: "mensal",
    parcelas: "",
    observacoes: "",
    usuarioAlvoId: "",
    valorCompartilhado: "",
    data: new Date().toISOString().split("T")[0],
    dataFimRecorrencia: "",
  });

  // Carregar dados
  useEffect(() => {
    carregarDados();
  }, []);

  // Carregar o plano e os limites
  useEffect(() => {
    const carregarPlanoUsuario = async () => {
      try {
        setCarregandoPlano(true);
        const response = await fetch(
          "/api/usuarios/subscription/limite-combinado",
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Dados do plano carregados:", data); // Para depuração
          setPlanoUsuario(data.plano);
          // Também defina o limiteFree com os dados da API combinada
          setLimiteFree({
            atingido: data.atingido || data.lancamentosAtingido,
            total: data.limiteLancamentos || 0,
            usado: data.usadoLancamentos || 0,
          });
        } else {
          console.error("Erro ao carregar plano do usuário");
          setPlanoUsuario("free");
          setLimiteFree(null);
        }
      } catch (error) {
        console.error("Erro na requisição do plano:", error);
        setPlanoUsuario("free");
        setLimiteFree(null);
      } finally {
        setCarregandoPlano(false);
      }
    };

    carregarPlanoUsuario();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [lancamentosRes, categoriasRes, cartoesRes] = await Promise.all([
        fetch("/api/lancamentos"),
        fetch("/api/categorias"),
        fetch("/api/cartoes"),
      ]);

      if (lancamentosRes.ok) {
        const lancamentosData = await lancamentosRes.json();
        setLancamentos(Array.isArray(lancamentosData) ? lancamentosData : []);
      }

      if (categoriasRes.ok) {
        const categoriasData = await categoriasRes.json();
        setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
      }

      if (cartoesRes.ok) {
        const cartoesData = await cartoesRes.json();
        setCartoes(Array.isArray(cartoesData) ? cartoesData : []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error(translations.categorias.mensagens.erroCarregar);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCompartilhamento = (lancamento: Lancamento) => {
    if (!lancamento.LancamentoCompartilhado?.length) return null;
    const compartilhamento = lancamento.LancamentoCompartilhado[0];
    return {
      ...compartilhamento,
      isCriador: compartilhamento.usuarioCriador?.id === lancamento.userId,
      isAlvo: compartilhamento.usuarioAlvo?.id === lancamento.userId,
    };
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calcularMesReferenciaLancamento = (
    lancamento: Lancamento,
  ): { ano: number; mes: number } => {
    // Para lançamentos que não são de cartão de crédito, usa a data do lançamento
    if (lancamento.metodoPagamento !== "CREDITO" || !lancamento.cartao) {
      const data = new Date(lancamento.data);
      return {
        ano: data.getFullYear(),
        mes: data.getMonth() + 1,
      };
    }

    // Para cartão de crédito, calcula o mês de PAGAMENTO da fatura
    const dataLancamento = new Date(lancamento.data);
    const diaLancamento = dataLancamento.getDate();
    const diaFechamento = lancamento.cartao.diaFechamento || 1;

    let ano = dataLancamento.getFullYear();
    let mes = dataLancamento.getMonth() + 1;

    // Se a compra foi depois do fechamento, vai para a próxima fatura
    if (diaLancamento > diaFechamento) {
      mes += 1;
      if (mes > 12) {
        mes = 1;
        ano += 1;
      }
    }

    // Adiciona +1 mês porque o pagamento é no mês seguinte ao fechamento
    mes += 1;
    if (mes > 12) {
      mes = 1;
      ano += 1;
    }

    return { ano, mes };
  };

  // Função para redirecionar para a página de perfil
  const handleRedirectToProfile = () => {
    router.push(`/${currentLang}/dashboard/perfil`);
  };

  const lancamentosFiltrados = lancamentos.filter((lancamento) => {
    const { ano, mes } = calcularMesReferenciaLancamento(lancamento);

    if (ano !== anoSelecionado || mes !== mesSelecionado) return false;

    if (
      searchTerm &&
      !lancamento.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;

    if (
      filtros.categoria !== "all" &&
      lancamento.categoria.id !== filtros.categoria
    )
      return false;

    if (filtros.tipoLancamento !== "all") {
      const compartilhamento = getStatusCompartilhamento(lancamento);
      const temObservacaoCompartilhada =
        lancamento.observacoes?.includes("Compartilhado por:");

      // Se filtro é "individual", exclui compartilhados via tabela E via observação
      if (
        filtros.tipoLancamento === "individual" &&
        (compartilhamento || temObservacaoCompartilhada)
      )
        return false;

      // Se filtro é "compartilhado", inclui compartilhados via tabela OU via observação
      if (
        filtros.tipoLancamento === "compartilhado" &&
        !compartilhamento &&
        !temObservacaoCompartilhada
      )
        return false;
    }

    if (filtros.tipo !== "all" && lancamento.tipo !== filtros.tipo)
      return false;

    if (filtros.status !== "all") {
      if (filtros.status === "pago" && !lancamento.pago) return false;
      if (filtros.status === "pendente" && lancamento.pago) return false;
    }

    if (
      filtros.metodoPagamento !== "all" &&
      lancamento.metodoPagamento !== filtros.metodoPagamento
    )
      return false;

    // ✅ ADICIONAR ESTE BLOCO
    if (filtros.cartao !== "all" && lancamento.cartao?.id !== filtros.cartao)
      return false;

    return true;
  });

  const receitas = lancamentosFiltrados.filter((l) => l.tipo === "RECEITA");
  const despesas = lancamentosFiltrados.filter((l) => l.tipo === "DESPESA");

  const totalReceitas = receitas.reduce((sum, l) => sum + l.valor, 0);
  const totalDespesas = despesas.reduce((sum, l) => sum + l.valor, 0);

  const receitasPagas = receitas
    .filter((l) => l.pago)
    .reduce((sum, l) => sum + l.valor, 0);
  const despesasPagas = despesas
    .filter((l) => l.pago)
    .reduce((sum, l) => sum + l.valor, 0);

  const saldo = totalReceitas - totalDespesas;

  const formatarDataSemTimezone = (dataString: string): string => {
    try {
      if (dataString.includes(" ")) {
        const [datePart, timePart] = dataString.split(" ");
        const [year, month, day] = datePart.split("-").map(Number);
        const data = new Date(Date.UTC(year, month - 1, day));
        return data.toLocaleDateString("pt-BR");
      }
      const data = new Date(dataString);
      return data.toLocaleDateString("pt-BR");
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return new Date(dataString).toLocaleDateString("pt-BR");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    try {
      const mapearMetodoPagamento = (valor: string) => {
        const mapeamento: { [key: string]: string } = {
          DINHEIRO: "PIX",
          PIX: "PIX",
          CARTAO_DEBITO: "DEBITO",
          CARTAO_CREDITO: "CREDITO",
          TRANSFERENCIA: "TRANSFERENCIA",
        };
        return mapeamento[valor] || valor;
      };

      const determinarTipoParcelamento = () => {
        if (formData.tipoTransacao !== "CARTAO_CREDITO") return null;
        if (formData.recorrente) {
          return formData.tipoRecorrencia === "RECORRENCIA"
            ? "RECORRENTE"
            : "PARCELADO";
        }
        return "AVISTA";
      };

      const payload = {
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        tipo: formData.tipo.toUpperCase(),
        metodoPagamento: mapearMetodoPagamento(formData.tipoTransacao),
        data: new Date(formData.data).toISOString(),
        categoriaId: formData.categoria,
        cartaoId:
          formData.tipoTransacao === "CARTAO_CREDITO"
            ? formData.cartaoId
            : null,
        observacoes: formData.observacoes,
        tipoParcelamento:
          formData.tipoTransacao === "CARTAO_CREDITO"
            ? determinarTipoParcelamento()
            : null,
        parcelasTotal:
          formData.tipoTransacao === "CARTAO_CREDITO" && formData.parcelas
            ? parseInt(formData.parcelas)
            : null,
        recorrente:
          formData.tipoTransacao === "CARTAO_CREDITO"
            ? formData.recorrente
            : false,
        tipoLancamento: formData.tipoLancamento,
        usuarioAlvoId:
          formData.tipoLancamento === "compartilhado"
            ? formData.usuarioAlvoId
            : null,
        valorCompartilhado:
          formData.tipoLancamento === "compartilhado" &&
          formData.valorCompartilhado
            ? parseFloat(formData.valorCompartilhado)
            : null,
        dataFimRecorrencia: formData.dataFimRecorrencia || null,
      };

      const res = await fetch("/api/lancamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const lancamentoSalvo = await res.json();
        setLancamentos((prev) => [...prev, lancamentoSalvo]);
        toast.success(translations.categorias.mensagens.sucessoCriacao);
        setIsSheetOpen(false);
        setFormData({
          descricao: "",
          valor: "",
          tipo: "despesa",
          categoria: "",
          tipoLancamento: "individual",
          tipoTransacao: "DINHEIRO",
          cartaoId: "",
          responsavel: "",
          pago: false,
          recorrente: false,
          tipoRecorrencia: "RECORRENCIA",
          frequencia: "mensal",
          parcelas: "",
          observacoes: "",
          usuarioAlvoId: "",
          valorCompartilhado: "",
          data: new Date().toISOString().split("T")[0],
          dataFimRecorrencia: "",
        });
      } else {
        const errorData = await res.json();
        toast.error(
          errorData.error || translations.categorias.mensagens.erroCriacao,
        );
      }
    } catch (error) {
      console.error("Erro ao criar lançamento:", error);
      toast.error(translations.categorias.mensagens.erroCriacao);
    } finally {
      setEnviando(false);
    }
  };

  const buscarUsuarioPorUsername = async () => {
    if (!buscaUsername.trim()) {
      setErroUsuario(translations.categorias.mensagens.digitarUsername);
      return;
    }

    setBuscandoUsuario(true);
    setErroUsuario("");
    setUsuarioBuscado(null);

    try {
      const response = await fetch(
        `/api/usuarios?username=${encodeURIComponent(buscaUsername.trim())}`,
      );

      if (response.ok) {
        const usuario = await response.json();
        setUsuarioBuscado(usuario);
        setModoSelecao("busca");
        handleChange("usuarioAlvoId", usuario.id);
        toast.success(translations.categorias.mensagens.usuarioEncontrado);
      } else {
        const errorData = await response.json();
        setErroUsuario(
          errorData.error ||
            translations.categorias.mensagens.usuarioNaoEncontrado,
        );
        toast.error(
          errorData.error ||
            translations.categorias.mensagens.usuarioNaoEncontrado,
        );
      }
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      setErroUsuario(translations.categorias.mensagens.erroBusca);
      toast.error(translations.categorias.mensagens.erroBusca);
    } finally {
      setBuscandoUsuario(false);
    }
  };

  const handleDelete = async (id: string) => {
    setExcluindo(id);
    const lancamentoParaExcluir = lancamentos.find((lanc) => lanc.id === id);

    try {
      setLancamentos((prev) => prev.filter((lanc) => lanc.id !== id));
      setDialogAberto(null);

      const res = await fetch(`/api/lancamentos/${id}`, { method: "DELETE" });
      if (!res.ok)
        throw new Error(translations.categorias.mensagens.erroExclusao);

      toast.success(translations.categorias.mensagens.sucessoExclusao);
    } catch (error) {
      console.error("Erro ao deletar lançamento:", error);
      if (lancamentoParaExcluir) {
        setLancamentos((prev) => [...prev, lancamentoParaExcluir]);
      }
      toast.error(translations.categorias.mensagens.erroExclusao);
    } finally {
      setExcluindo(null);
    }
  };

  const handleVisualizar = async (lancamentoId: string) => {
    try {
      setCarregandoVisualizacao(lancamentoId);
      console.log("Buscando lançamento:", lancamentoId);

      const response = await fetch(
        `/api/lancamentos/${lancamentoId}/visualizar`,
      );

      console.log("Resposta da API:", {
        status: response.status,
        ok: response.ok,
      });

      if (response.ok) {
        const lancamento = await response.json();
        console.log("Lançamento encontrado:", lancamento);
        setLancamentoSelecionado(lancamento);
        setMostrarDialogVisualizar(true);
      } else {
        const errorData = await response.json();
        console.error("Erro na resposta:", errorData);
        toast.error(
          errorData.error || translations.categorias.mensagens.erroCarregar,
        );
      }
    } catch (error) {
      console.error("Erro ao visualizar lançamento:", error);
      toast.error(translations.categorias.mensagens.erroCarregar);
    } finally {
      setCarregandoVisualizacao(null);
    }
  };

  useEffect(() => {
    if (!mostrarDialogVisualizar) {
      setLancamentoSelecionado(null);
      setCarregandoVisualizacao(null);
    }
  }, [mostrarDialogVisualizar]);

  const handleEditar = async (lancamento: Lancamento) => {
    // Buscar dados completos do lançamento incluindo usuário compartilhado
    try {
      const response = await fetch(
        `/api/lancamentos/${lancamento.id}/visualizar`,
      );
      if (response.ok) {
        const lancamentoCompleto = await response.json();

        // Mapear de volta do formato do banco para o formato do formulário
        const mapearMetodoPagamentoParaFormulario = (valor: string) => {
          const mapeamento: { [key: string]: string } = {
            PIX: "PIX",
            DEBITO: "CARTAO_DEBITO",
            CREDITO: "CARTAO_CREDITO",
            TRANSFERENCIA: "TRANSFERENCIA",
            DINHEIRO: "DINHEIRO",
          };
          return mapeamento[valor] || valor;
        };

        setLancamentoSelecionado(lancamentoCompleto);
        setFormData({
          descricao: lancamentoCompleto.descricao,
          valor: lancamentoCompleto.valor.toString(),
          tipo: lancamentoCompleto.tipo.toLowerCase(),
          categoria: lancamentoCompleto.categoria.id,
          tipoLancamento: lancamentoCompleto.LancamentoCompartilhado?.length
            ? "compartilhado"
            : "individual",
          tipoTransacao: mapearMetodoPagamentoParaFormulario(
            lancamentoCompleto.metodoPagamento,
          ),
          cartaoId: lancamentoCompleto.cartao?.id || "",
          responsavel: "Claudenir",
          pago: lancamentoCompleto.pago,
          recorrente: lancamentoCompleto.recorrente || false,
          tipoRecorrencia:
            lancamentoCompleto.tipoParcelamento === "RECORRENTE"
              ? "RECORRENCIA"
              : "PARCELAMENTO",
          frequencia: "mensal",
          parcelas: lancamentoCompleto.parcelasTotal?.toString() || "",
          observacoes: lancamentoCompleto.observacoes || "",
          usuarioAlvoId:
            lancamentoCompleto.LancamentoCompartilhado?.[0]?.usuarioAlvo?.id ||
            "",
          valorCompartilhado:
            lancamentoCompleto.LancamentoCompartilhado?.[0]?.valorCompartilhado?.toString() ||
            "",
          data: new Date(lancamentoCompleto.data).toISOString().split("T")[0],
          dataFimRecorrencia: lancamentoCompleto.dataFimRecorrencia
            ? new Date(lancamentoCompleto.dataFimRecorrencia)
                .toISOString()
                .split("T")[0]
            : "",
        });
        setMostrarDialogEditar(true);
      } else {
        toast.error(translations.categorias.mensagens.erroCarregar);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do lançamento:", error);
      toast.error(translations.categorias.mensagens.erroCarregar);
    }
  };

  const handleAtualizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditando(true);

    try {
      if (!lancamentoSelecionado) return;

      const mapearMetodoPagamento = (valor: string) => {
        const mapeamento: { [key: string]: string } = {
          DINHEIRO: "PIX",
          PIX: "PIX",
          CARTAO_DEBITO: "DEBITO",
          CARTAO_CREDITO: "CREDITO",
          TRANSFERENCIA: "TRANSFERENCIA",
        };
        return mapeamento[valor] || valor;
      };

      const determinarTipoParcelamento = () => {
        if (formData.tipoTransacao !== "CARTAO_CREDITO") {
          return null;
        }
        if (formData.recorrente) {
          return formData.tipoRecorrencia === "RECORRENCIA"
            ? "RECORRENTE"
            : "PARCELADO";
        }
        return "AVISTA";
      };

      const payload = {
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        tipo: formData.tipo.toUpperCase(),
        metodoPagamento: mapearMetodoPagamento(formData.tipoTransacao),
        data: new Date(formData.data).toISOString(),
        categoriaId: formData.categoria,
        cartaoId:
          formData.tipoTransacao === "CARTAO_CREDITO"
            ? formData.cartaoId
            : null,
        observacoes: formData.observacoes,
        tipoParcelamento:
          formData.tipoTransacao === "CARTAO_CREDITO"
            ? determinarTipoParcelamento()
            : null,
        parcelasTotal:
          formData.tipoTransacao === "CARTAO_CREDITO" && formData.parcelas
            ? parseInt(formData.parcelas)
            : null,
        recorrente:
          formData.tipoTransacao === "CARTAO_CREDITO"
            ? formData.recorrente
            : false,
        tipoLancamento: formData.tipoLancamento,
        usuarioAlvoId:
          formData.tipoLancamento === "compartilhado"
            ? formData.usuarioAlvoId
            : null,
        valorCompartilhado:
          formData.tipoLancamento === "compartilhado" &&
          formData.valorCompartilhado
            ? parseFloat(formData.valorCompartilhado)
            : null,
        dataFimRecorrencia: formData.dataFimRecorrencia || null,
        pago: formData.pago,
      };

      const res = await fetch(`/api/lancamentos/${lancamentoSelecionado.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const lancamentoAtualizado = await res.json();
        setLancamentos((prev) =>
          prev.map((lanc) =>
            lanc.id === lancamentoSelecionado.id ? lancamentoAtualizado : lanc,
          ),
        );
        toast.success(translations.categorias.mensagens.sucessoEdicao);
        setMostrarDialogEditar(false);
        setLancamentoSelecionado(null);
      } else {
        const errorData = await res.json();
        toast.error(
          errorData.error || translations.categorias.mensagens.erroEdicao,
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar lançamento:", error);
      toast.error(translations.categorias.mensagens.erroEdicao);
    } finally {
      setEditando(false);
    }
  };

  const toggleStatus = async (lancamentoId: string, atualStatus: boolean) => {
    try {
      const response = await fetch(`/api/lancamentos/${lancamentoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pago: !atualStatus }),
      });

      if (response.ok) {
        setLancamentos((prev) =>
          prev.map((lanc) =>
            lanc.id === lancamentoId ? { ...lanc, pago: !atualStatus } : lanc,
          ),
        );
        toast.success(translations.categorias.mensagens.sucessoStatus);
      } else {
        throw new Error(translations.categorias.mensagens.erroEdicao);
      }
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast.error(translations.categorias.mensagens.erroEdicao);
      carregarDados();
    }
  };

  // Função para verificar limite
  const verificarLimiteFree = async () => {
    try {
      const response = await fetch("/api/usuarios/subscription/limite");
      if (response.ok) {
        const data = await response.json();
        setLimiteFree(data);

        // Mostrar toast se limite atingido
        if (data.atingido) {
          toast.warning(
            currentLang === "pt"
              ? `Plano free atingiu limite de lançamentos. Faça upgrade para criar mais.`
              : `Free plan has reached transaction limit. Upgrade to create more.`,
          );
        }
      }
    } catch (error) {
      console.error("Erro ao verificar limite:", error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12,
      },
    },
  } as const;

  const cardHoverVariants = {
    rest: {
      scale: 1,
      transition: { duration: 0.2 },
    },
    hover: {
      scale: 1.02,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25,
      },
    },
  } as const;

  const buttonTapVariants = {
    tap: { scale: 0.95 },
  } as const;

  const formatarDataBonita = (dataString: string): string => {
    if (dataString.includes("T")) {
      const [datePart] = dataString.split("T");
      const [year, month, day] = datePart.split("-");
      return `${day}/${month}/${year}`;
    }

    if (dataString.includes(" ")) {
      const [datePart] = dataString.split(" ");
      const [year, month, day] = datePart.split("-");
      return `${day}/${month}/${year}`;
    }

    return dataString;
  };

  if (loading && lancamentos.length === 0) {
    return <Loading />;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen p-3 sm:p-4 md:p-6 bg-white dark:bg-transparent"
    >
      <motion.div
        variants={itemVariants}
        className="max-w-7xl mx-auto space-y-4 sm:space-y-6"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
        >
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {translations.titulo}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5">
              {translations.subtitulo}
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <Button
              variant="outline"
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="flex-1 sm:flex-none border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-600 gap-1.5 sm:gap-2 text-xs sm:text-sm"
            >
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="truncate">
                {translations.categorias.icones.filtro}
              </span>
            </Button>

            <Button
              variant={"outline"}
              onClick={() => setIsSheetOpen(true)}
              className="flex-1 sm:flex-none border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500 text-xs sm:text-sm"
              disabled={planoUsuario === "free" && limiteFree?.atingido}
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              {planoUsuario === "free" && limiteFree?.atingido && (
                <Crown className="h-4 w-4 text-yellow-600 mr-1" />
              )}
              <span className="truncate">
                {translations.categorias.acoes.novoLancamento}
              </span>
            </Button>
          </div>
        </motion.div>

        {/* Filtros Expandidos */}
        <AnimatePresence>
          {mostrarFiltros && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {/* Pesquisar */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                        {translations.categorias.icones.busca}
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                        <Input
                          placeholder={translations.categorias.tabela.pesquisar}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 sm:pl-9 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 w-full text-sm"
                        />
                      </div>
                    </div>

                    {/* Demais filtros em grid abaixo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                      {/* Categoria */}
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                          {translations.categorias.filtros.categoria}
                        </Label>
                        <Select
                          value={filtros.categoria}
                          onValueChange={(value) =>
                            setFiltros({ ...filtros, categoria: value })
                          }
                        >
                          <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs sm:text-sm h-9 sm:h-10">
                            <SelectValue
                              placeholder={
                                translations.categorias.filtros.todos
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm">
                            <SelectItem value="all">
                              {translations.categorias.filtros.todos}
                            </SelectItem>
                            {categorias.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <div
                                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: cat.cor }}
                                  />
                                  <span className="truncate">{cat.nome}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Individual ou Compartilhado */}
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                          {translations.categorias.filtros.tipoLancamento}
                        </Label>
                        <Select
                          value={filtros.tipoLancamento}
                          onValueChange={(value) =>
                            setFiltros({ ...filtros, tipoLancamento: value })
                          }
                        >
                          <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs sm:text-sm h-9 sm:h-10">
                            <SelectValue
                              placeholder={
                                translations.categorias.filtros.todos
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm">
                            <SelectItem value="all">
                              {translations.categorias.filtros.todos}
                            </SelectItem>
                            <SelectItem value="individual">
                              {translations.categorias.filtros.individual}
                            </SelectItem>
                            <SelectItem value="compartilhado">
                              {translations.categorias.filtros.compartilhado}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Receita ou Despesa */}
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                          {translations.categorias.filtros.tipo}
                        </Label>
                        <Select
                          value={filtros.tipo}
                          onValueChange={(value) =>
                            setFiltros({ ...filtros, tipo: value })
                          }
                        >
                          <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs sm:text-sm h-9 sm:h-10">
                            <SelectValue
                              placeholder={
                                translations.categorias.filtros.todos
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm">
                            <SelectItem value="all">
                              {translations.categorias.filtros.todos}
                            </SelectItem>
                            <SelectItem value="RECEITA">
                              {translations.categorias.filtros.receita}
                            </SelectItem>
                            <SelectItem value="DESPESA">
                              {translations.categorias.filtros.despesa}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status */}
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                          {translations.categorias.filtros.status}
                        </Label>
                        <Select
                          value={filtros.status}
                          onValueChange={(value) =>
                            setFiltros({ ...filtros, status: value })
                          }
                        >
                          <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs sm:text-sm h-9 sm:h-10">
                            <SelectValue
                              placeholder={
                                translations.categorias.filtros.todos
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm">
                            <SelectItem value="all">
                              {translations.categorias.filtros.todos}
                            </SelectItem>
                            <SelectItem value="pago">
                              {translations.categorias.filtros.pago}
                            </SelectItem>
                            <SelectItem value="pendente">
                              {translations.categorias.filtros.pendente}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Método de Pagamento */}
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                          {translations.categorias.filtros.metodoPagamento}
                        </Label>
                        <Select
                          value={filtros.metodoPagamento}
                          onValueChange={(value) => {
                            setFiltros({
                              ...filtros,
                              metodoPagamento: value,
                              // Resetar o filtro de cartão se mudar para um método que não usa cartão
                              cartao:
                                value === "CREDITO" || value === "DEBITO"
                                  ? filtros.cartao
                                  : "all",
                            });
                          }}
                        >
                          <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs sm:text-sm h-9 sm:h-10">
                            <SelectValue
                              placeholder={
                                translations.categorias.filtros.todos
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm">
                            <SelectItem value="all">
                              {translations.categorias.filtros.todos}
                            </SelectItem>
                            <SelectItem value="PIX">
                              {
                                translations.categorias.formulario
                                  .opcoesMetodoPagamento.pix
                              }
                            </SelectItem>
                            <SelectItem value="CREDITO">
                              {
                                translations.categorias.formulario
                                  .opcoesMetodoPagamento.credito
                              }
                            </SelectItem>
                            <SelectItem value="DEBITO">
                              {
                                translations.categorias.formulario
                                  .opcoesMetodoPagamento.debito
                              }
                            </SelectItem>
                            <SelectItem value="TRANSFERENCIA">
                              {
                                translations.categorias.formulario
                                  .opcoesMetodoPagamento.transferencia
                              }
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* ✅ NOVO: Filtro de Cartão (condicional) */}
                      {(filtros.metodoPagamento === "CREDITO" ||
                        filtros.metodoPagamento === "DEBITO") && (
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                            {translations.categorias.formulario.cartao}
                          </Label>
                          <Select
                            value={filtros.cartao}
                            onValueChange={(value) =>
                              setFiltros({ ...filtros, cartao: value })
                            }
                          >
                            <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs sm:text-sm h-9 sm:h-10">
                              <SelectValue
                                placeholder={
                                  translations.categorias.filtros.todos
                                }
                              />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm">
                              <SelectItem value="all">
                                {translations.categorias.filtros.todos}
                              </SelectItem>
                              {cartoes.map((cartao) => (
                                <SelectItem key={cartao.id} value={cartao.id}>
                                  <div className="flex items-center gap-1.5 sm:gap-2">
                                    <div
                                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: cartao.cor }}
                                    />
                                    <span className="truncate">
                                      {cartao.nome}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cards de Resumo */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          {/* Seletor de Mês */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-2 sm:space-y-3">
                <Label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                  {translations.categorias.tabela.mesAno}
                </Label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const novoMes =
                        mesSelecionado === 1 ? 12 : mesSelecionado - 1;
                      const novoAno =
                        mesSelecionado === 1
                          ? anoSelecionado - 1
                          : anoSelecionado;
                      setMesSelecionado(novoMes);
                      setAnoSelecionado(novoAno);
                    }}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>

                  <div className="flex-1 text-center">
                    <p className="text-gray-900 dark:text-white font-medium text-xs sm:text-sm md:text-base truncate px-1">
                      {
                        translations.categorias.meses[
                          mesSelecionado.toString() as keyof typeof translations.categorias.meses
                        ]
                      }{" "}
                      {anoSelecionado}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const novoMes =
                        mesSelecionado === 12 ? 1 : mesSelecionado + 1;
                      const novoAno =
                        mesSelecionado === 12
                          ? anoSelecionado + 1
                          : anoSelecionado;
                      setMesSelecionado(novoMes);
                      setAnoSelecionado(novoAno);
                    }}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receita */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                    {translations.categorias.estatisticas.receitas}
                  </p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 dark:text-green-400">
                    {currencySymbol} {totalReceitas.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {translations.categorias.estatisticas.faltaReceber}{" "}
                    {currencySymbol}{" "}
                    {(totalReceitas - receitasPagas).toFixed(2)}
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 dark:bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Despesa */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                    {translations.categorias.estatisticas.despesas}
                  </p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">
                    {currencySymbol} {totalDespesas.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {translations.categorias.estatisticas.faltaPagar}{" "}
                    {currencySymbol}{" "}
                    {(totalDespesas - despesasPagas).toFixed(2)}
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 dark:bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Saldo */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                    {translations.categorias.estatisticas.saldo}
                  </p>
                  <p
                    className={`text-lg sm:text-xl md:text-2xl font-bold ${saldo >= 0 ? "text-emerald-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {currencySymbol} {saldo.toFixed(2)}
                  </p>
                </div>
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 ${saldo >= 0 ? "bg-emerald-100 dark:bg-green-600" : "bg-red-100 dark:bg-red-600"}`}
                >
                  {saldo >= 0 ? (
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-white" />
                  ) : (
                    <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-white" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        {/* Aviso de Limite para plano Free */}
        {planoUsuario === "free" && limiteFree?.atingido && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-4 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
              <div className="flex items-center justify-between">
                {/* Lado esquerdo: Círculo e Informações */}
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10">
                    <svg className="h-full w-full" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#fbbf24"
                        strokeWidth="4"
                        strokeOpacity="0.2"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${
                          Math.min(
                            (limiteFree.usado / limiteFree.total) * 100,
                            100,
                          ) * 2.51
                        } 251`}
                        strokeDashoffset="0"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        {Math.min(
                          (limiteFree.usado / limiteFree.total) * 100,
                          100,
                        ).toFixed(0)}
                        %
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        {currentLang === "pt"
                          ? "Lançamentos Free"
                          : "Free Transactions"}
                      </span>
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {limiteFree.usado}/{limiteFree.total}{" "}
                      {currentLang === "pt" ? "lançamentos" : "transactions"}
                    </p>
                  </div>
                </div>

                {/* Botão de Upgrade no lado direito */}
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-[#00cfec] to-[#007cca] text-white hover:opacity-90 text-xs"
                  onClick={() => {
                    router.push(`/${currentLang}/dashboard/perfil`);
                  }}
                >
                  <Crown className="h-3 w-3 mr-1" />
                  {currentLang === "pt" ? "Fazer Upgrade" : "Upgrade"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabela de Lançamentos */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          {" "}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 dark:text-white text-base sm:text-lg">
                {translations.titulo}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                {lancamentosFiltrados.length}{" "}
                {translations.categorias.tabela.nenhumLancamento.replace(
                  "nenhum ",
                  "",
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Tabela para desktop */}
                <div className="hidden md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm">
                          {translations.categorias.tabela.tipo}
                        </th>
                        <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm">
                          {translations.categorias.tabela.categoria}
                        </th>
                        <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm">
                          {translations.categorias.tabela.descricao}
                        </th>
                        <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm">
                          {translations.categorias.tabela.valor}
                        </th>
                        <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm">
                          {translations.categorias.tabela.status}
                        </th>
                        <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm">
                          {translations.categorias.tabela.acoes}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lancamentosFiltrados.map((lancamento, index) => {
                        const compartilhamento =
                          getStatusCompartilhamento(lancamento);

                        return (
                          <motion.tr
                            key={lancamento.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: index * 0.05,
                              type: "spring",
                              stiffness: 100,
                              damping: 15,
                            }}
                            className="border-b border-gray-100 dark:border-gray-800 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            {/* Tipo */}
                            <td className="py-3 px-4">
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 17,
                                }}
                              >
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    lancamento.tipo === "RECEITA"
                                      ? "bg-emerald-100 dark:bg-green-900/50 text-emerald-700 dark:text-green-400 border-emerald-200 dark:border-green-700"
                                      : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700"
                                  }`}
                                >
                                  {lancamento.tipo === "RECEITA"
                                    ? translations.categorias.filtros.receita
                                    : translations.categorias.filtros.despesa}
                                </Badge>
                              </motion.div>
                            </td>

                            {/* Categoria */}
                            <td className="py-3 px-4">
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center gap-1.5 sm:gap-2"
                              >
                                <div
                                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{
                                    backgroundColor: lancamento.categoria.cor,
                                  }}
                                >
                                  {(() => {
                                    try {
                                      const IconComponent =
                                        require("lucide-react")[
                                          lancamento.categoria.icone || "Tag"
                                        ];
                                      return (
                                        <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                                      );
                                    } catch {
                                      return (
                                        <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                                      );
                                    }
                                  })()}
                                </div>
                                <span className="text-gray-900 dark:text-white text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">
                                  {lancamento.categoria.nome}
                                </span>
                              </motion.div>
                            </td>

                            {/* Descrição */}
                            <td className="py-3 px-4">
                              <div>
                                <motion.p
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: index * 0.05 + 0.1 }}
                                  className="text-gray-900 dark:text-white font-medium text-xs sm:text-sm truncate max-w-[200px]"
                                >
                                  {lancamento.descricao}
                                </motion.p>
                                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatarDataBonita(lancamento.data)}
                                  </span>
                                  {compartilhamento && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 15,
                                      }}
                                      className="group relative"
                                    >
                                      <Users className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                                      <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        whileHover={{ opacity: 1, y: 0 }}
                                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap"
                                      >
                                        {
                                          translations.categorias.status
                                            .compartilhado
                                        }
                                      </motion.div>
                                    </motion.div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Valor */}
                            <td className="py-3 px-4">
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.05 + 0.15 }}
                                className={`font-semibold text-xs sm:text-sm ${
                                  lancamento.tipo === "RECEITA"
                                    ? "text-emerald-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {currencySymbol} {lancamento.valor.toFixed(2)}
                              </motion.span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 17,
                                }}
                              >
                                <Button
                                  variant={
                                    lancamento.pago ? "default" : "outline"
                                  }
                                  size="sm"
                                  onClick={() =>
                                    toggleStatus(lancamento.id, lancamento.pago)
                                  }
                                  className={`text-xs ${
                                    lancamento.pago
                                      ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-green-600 dark:hover:bg-green-700"
                                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                  }`}
                                >
                                  {lancamento.pago ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                      <span className="hidden sm:inline">
                                        {lancamento.tipo === "RECEITA"
                                          ? translations.categorias.status.pago
                                          : translations.categorias.status.pago}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                      <span className="hidden sm:inline">
                                        {lancamento.tipo === "RECEITA"
                                          ? translations.categorias.status
                                              .pendente
                                          : translations.categorias.status
                                              .pendente}
                                      </span>
                                    </>
                                  )}
                                </Button>
                              </motion.div>
                            </td>

                            {/* Ações */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        transition={{
                                          type: "spring",
                                          stiffness: 400,
                                          damping: 17,
                                        }}
                                      >
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            handleVisualizar(lancamento.id)
                                          }
                                          disabled={
                                            carregandoVisualizacao ===
                                            lancamento.id
                                          }
                                          className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 h-7 w-7 sm:h-8 sm:w-8"
                                        >
                                          {carregandoVisualizacao ===
                                          lancamento.id ? (
                                            <motion.div
                                              animate={{ rotate: 360 }}
                                              transition={{
                                                duration: 1,
                                                repeat: Infinity,
                                                ease: "linear",
                                              }}
                                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full"
                                            />
                                          ) : (
                                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                          )}
                                        </Button>
                                      </motion.div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-gray-800 dark:bg-gray-700 text-white border-gray-700 dark:border-gray-600 text-xs">
                                      <p>
                                        {
                                          translations.categorias.icones
                                            .visualizar
                                        }
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        transition={{
                                          type: "spring",
                                          stiffness: 400,
                                          damping: 17,
                                        }}
                                      >
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            handleEditar(lancamento)
                                          }
                                          className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-yellow-400 hover:bg-amber-50 dark:hover:bg-yellow-900/30 h-7 w-7 sm:h-8 sm:w-8"
                                        >
                                          <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </Button>
                                      </motion.div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-gray-800 dark:bg-gray-700 text-white border-gray-700 dark:border-gray-600 text-xs">
                                      <p>
                                        {translations.categorias.icones.editar}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        transition={{
                                          type: "spring",
                                          stiffness: 400,
                                          damping: 17,
                                        }}
                                      >
                                        <Dialog
                                          open={dialogAberto === lancamento.id}
                                          onOpenChange={(open) =>
                                            setDialogAberto(
                                              open ? lancamento.id : null,
                                            )
                                          }
                                        >
                                          <DialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 h-7 w-7 sm:h-8 sm:w-8"
                                            >
                                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white w-[90vw] sm:max-w-md">
                                            <motion.div
                                              initial={{ opacity: 0, y: -10 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              transition={{ duration: 0.3 }}
                                            >
                                              <DialogHeader>
                                                <DialogTitle className="text-gray-900 dark:text-white text-lg">
                                                  {
                                                    translations.categorias
                                                      .acoes.excluir
                                                  }{" "}
                                                  {translations.titulo.slice(
                                                    0,
                                                    -1,
                                                  )}
                                                </DialogTitle>
                                                <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
                                                  {
                                                    translations.categorias
                                                      .mensagens
                                                      .confirmacaoExclusao
                                                  }
                                                </DialogDescription>
                                              </DialogHeader>
                                              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
                                                <motion.div
                                                  whileHover={{ scale: 1.05 }}
                                                  whileTap={{ scale: 0.95 }}
                                                >
                                                  <Button
                                                    variant="outline"
                                                    onClick={() =>
                                                      setDialogAberto(null)
                                                    }
                                                    className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                                                  >
                                                    {
                                                      translations.categorias
                                                        .acoes.cancelar
                                                    }
                                                  </Button>
                                                </motion.div>
                                                <motion.div
                                                  whileHover={{ scale: 1.05 }}
                                                  whileTap={{ scale: 0.95 }}
                                                >
                                                  <Button
                                                    variant="destructive"
                                                    onClick={() =>
                                                      handleDelete(
                                                        lancamento.id,
                                                      )
                                                    }
                                                    disabled={
                                                      excluindo ===
                                                      lancamento.id
                                                    }
                                                    className="text-sm"
                                                  >
                                                    {excluindo === lancamento.id
                                                      ? translations.categorias
                                                          .mensagens.carregando
                                                      : translations.categorias
                                                          .acoes.confirmar}
                                                  </Button>
                                                </motion.div>
                                              </div>
                                            </motion.div>
                                          </DialogContent>
                                        </Dialog>
                                      </motion.div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-gray-800 dark:bg-gray-700 text-white border-gray-700 dark:border-gray-600 text-xs">
                                      <p>
                                        {translations.categorias.icones.excluir}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Lista para mobile */}
                <div className="md:hidden">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {lancamentosFiltrados.map((lancamento) => {
                      const compartilhamento =
                        getStatusCompartilhamento(lancamento);

                      return (
                        <div
                          key={lancamento.id}
                          className="p-3 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    lancamento.tipo === "RECEITA"
                                      ? "bg-emerald-100 dark:bg-green-900/50 text-emerald-700 dark:text-green-400 border-emerald-200 dark:border-green-700"
                                      : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700"
                                  }`}
                                >
                                  {lancamento.tipo === "RECEITA"
                                    ? translations.categorias.filtros.receita
                                    : translations.categorias.filtros.despesa}
                                </Badge>
                                {compartilhamento && (
                                  <Users className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                                )}
                              </div>
                              <p className="text-gray-900 dark:text-white font-medium text-sm truncate">
                                {lancamento.descricao}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{
                                      backgroundColor: lancamento.categoria.cor,
                                    }}
                                  />
                                  <span className="text-gray-600 dark:text-gray-400 text-xs">
                                    {lancamento.categoria.nome}
                                  </span>
                                </div>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-500 dark:text-gray-400 text-xs">
                                  {formatarDataBonita(lancamento.data)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-2 min-w-[80px]">
                              <span
                                className={`font-semibold text-sm ${
                                  lancamento.tipo === "RECEITA"
                                    ? "text-emerald-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                R$ {lancamento.valor.toFixed(2)}
                              </span>
                              <div className="mt-1">
                                <Button
                                  variant={
                                    lancamento.pago ? "default" : "outline"
                                  }
                                  size="sm"
                                  onClick={() =>
                                    toggleStatus(lancamento.id, lancamento.pago)
                                  }
                                  className={`text-xs h-6 px-2 ${
                                    lancamento.pago
                                      ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-green-600 dark:hover:bg-green-700"
                                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                  }`}
                                >
                                  {lancamento.pago ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      {lancamento.tipo === "RECEITA"
                                        ? translations.categorias.status.pago
                                        : translations.categorias.status.pago}
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3 mr-1" />
                                      {lancamento.tipo === "RECEITA"
                                        ? translations.categorias.status
                                            .pendente
                                        : translations.categorias.status
                                            .pendente}
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleVisualizar(lancamento.id)
                                      }
                                      disabled={
                                        carregandoVisualizacao === lancamento.id
                                      }
                                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 h-6 w-6"
                                    >
                                      {carregandoVisualizacao ===
                                      lancamento.id ? (
                                        <div className="w-3 h-3 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <Eye className="w-3 h-3" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-gray-800 dark:bg-gray-700 text-white border-gray-700 dark:border-gray-600 text-xs">
                                    <p>
                                      {
                                        translations.categorias.icones
                                          .visualizar
                                      }
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditar(lancamento)}
                                      className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-yellow-400 hover:bg-amber-50 dark:hover:bg-yellow-900/30 h-6 w-6"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-gray-800 dark:bg-gray-700 text-white border-gray-700 dark:border-gray-600 text-xs">
                                    <p>
                                      {translations.categorias.icones.editar}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>

                            <Dialog
                              open={dialogAberto === lancamento.id}
                              onOpenChange={(open) =>
                                setDialogAberto(open ? lancamento.id : null)
                              }
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 text-xs h-6"
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  {translations.categorias.icones.excluir}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white w-[90vw] sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle className="text-gray-900 dark:text-white text-lg">
                                    {translations.categorias.acoes.excluir}{" "}
                                    {translations.titulo.slice(0, -1)}
                                  </DialogTitle>
                                  <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
                                    {
                                      translations.categorias.mensagens
                                        .confirmacaoExclusao
                                    }
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
                                  <Button
                                    variant="outline"
                                    onClick={() => setDialogAberto(null)}
                                    className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                                  >
                                    {translations.categorias.acoes.cancelar}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleDelete(lancamento.id)}
                                    disabled={excluindo === lancamento.id}
                                    className="text-sm"
                                  >
                                    {excluindo === lancamento.id
                                      ? translations.categorias.mensagens
                                          .carregando
                                      : translations.categorias.acoes.confirmar}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {lancamentosFiltrados.length === 0 && (
                  <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">
                      {translations.categorias.tabela.nenhumLancamento}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Sheet para Novo Lançamento */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4 sm:mb-6">
            <SheetTitle className="text-gray-900 dark:text-white text-lg sm:text-xl">
              {translations.categorias.formulario.tituloNovo}
            </SheetTitle>
            <SheetDescription className="text-gray-600 dark:text-gray-400 text-sm">
              {translations.subtitulo}
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 mt-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-1 sm:pr-2 pb-4"
          >
            {/* Tipo e Categoria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="tipo"
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  {translations.categorias.formulario.tipo} *
                </Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => handleChange("tipo", value)}
                  required
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue
                      placeholder={translations.categorias.formulario.selecione}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                    <SelectItem value="receita">
                      {translations.categorias.filtros.receita}
                    </SelectItem>
                    <SelectItem value="despesa">
                      {translations.categorias.filtros.despesa}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="categoria"
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  {translations.categorias.formulario.categoria} *
                </Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => handleChange("categoria", value)}
                  required
                  disabled={!formData.tipo}
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue
                      placeholder={
                        !formData.tipo
                          ? translations.categorias.formulario.selecione
                          : translations.categorias.formulario.selecione
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                    {categorias
                      .filter(
                        (cat) =>
                          cat.tipo ===
                          (formData.tipo === "receita" ? "RECEITA" : "DESPESA"),
                      )
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div
                              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: cat.cor }}
                            />
                            <span className="truncate">{cat.nome}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Descrição e Valor */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label
                htmlFor="descricao"
                className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
              >
                {translations.categorias.formulario.descricao} *
              </Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
                placeholder={
                  translations.categorias.formulario.placeholderDescricao
                }
                required
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-sm"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label
                htmlFor="valor"
                className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
              >
                {translations.categorias.formulario.valor} *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                  {currencySymbol}
                </span>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={(e) => handleChange("valor", e.target.value)}
                  placeholder={
                    translations.categorias.formulario.placeholderValor
                  }
                  required
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-sm pl-9"
                />
              </div>
            </div>

            {/* Tipo de Transação e Lançamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="tipoTransacao"
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  {translations.categorias.formulario.metodoPagamento} *
                </Label>
                <Select
                  value={formData.tipoTransacao}
                  onValueChange={(value) =>
                    handleChange("tipoTransacao", value)
                  }
                  required
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue
                      placeholder={translations.categorias.formulario.selecione}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                    <SelectItem value="DINHEIRO">
                      {
                        translations.categorias.formulario.opcoesMetodoPagamento
                          .dinheiro
                      }
                    </SelectItem>
                    <SelectItem value="PIX">
                      {
                        translations.categorias.formulario.opcoesMetodoPagamento
                          .pix
                      }
                    </SelectItem>
                    <SelectItem value="CARTAO_DEBITO">
                      {
                        translations.categorias.formulario.opcoesMetodoPagamento
                          .debito
                      }
                    </SelectItem>
                    <SelectItem value="CARTAO_CREDITO">
                      {
                        translations.categorias.formulario.opcoesMetodoPagamento
                          .credito
                      }
                    </SelectItem>
                    <SelectItem value="TRANSFERENCIA">
                      {
                        translations.categorias.formulario.opcoesMetodoPagamento
                          .transferencia
                      }
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="tipoLancamento"
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  {translations.categorias.formulario.tipoLancamento} *
                </Label>
                <Select
                  value={formData.tipoLancamento}
                  onValueChange={(value) =>
                    handleChange("tipoLancamento", value)
                  }
                  required
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue
                      placeholder={translations.categorias.formulario.selecione}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                    <SelectItem value="individual">
                      {translations.categorias.filtros.individual}
                    </SelectItem>
                    <SelectItem value="compartilhado">
                      {translations.categorias.filtros.compartilhado}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Seção de Compartilhamento */}
            {formData.tipoLancamento === "compartilhado" && (
              <div className="space-y-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                <Tabs
                  value={modoSelecao}
                  onValueChange={(v) =>
                    setModoSelecao(v as "recentes" | "busca")
                  }
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="recentes">
                      {translations.categorias.formulario.usuariosRecentes}
                    </TabsTrigger>
                    <TabsTrigger value="busca">
                      {translations.categorias.formulario.buscarUsername}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="recentes" className="space-y-3">
                    {usuariosRecentes.length > 0 ? (
                      <div className="space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                          {translations.categorias.formulario.selecioneUsuario}
                        </Label>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                          {usuariosRecentes.map((usuario) => (
                            <button
                              key={usuario.id}
                              type="button"
                              onClick={() => {
                                handleChange("usuarioAlvoId", usuario.id);
                                setUsuarioBuscado(usuario);
                              }}
                              className={`flex items-center gap-2 p-2 rounded-md border transition-colors ${
                                formData.usuarioAlvoId === usuario.id
                                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                              }`}
                            >
                              {usuario.image && (
                                <img
                                  src={usuario.image}
                                  alt={usuario.name}
                                  className="w-8 h-8 rounded-full"
                                />
                              )}
                              <div className="flex-1 text-left">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {usuario.name}
                                </p>
                                {usuario.username && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    @{usuario.username}
                                  </p>
                                )}
                              </div>
                              {formData.usuarioAlvoId === usuario.id && (
                                <CheckCircle className="w-5 h-5 text-blue-500" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        {translations.categorias.mensagens.nenhumUsuarioRecente}
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="busca" className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                        {translations.categorias.formulario.digitarUsername}
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                            @
                          </span>
                          <Input
                            value={buscaUsername}
                            onChange={(e) => {
                              setBuscaUsername(e.target.value);
                              setErroUsuario("");
                            }}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                buscarUsuarioPorUsername();
                              }
                            }}
                            placeholder="username"
                            className="pl-8 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={buscarUsuarioPorUsername}
                          disabled={buscandoUsuario || !buscaUsername.trim()}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {buscandoUsuario ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      {erroUsuario && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {erroUsuario}
                        </p>
                      )}
                    </div>

                    {usuarioBuscado && (
                      <div className="p-3 border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 rounded-md">
                        <div className="flex items-center gap-2">
                          {usuarioBuscado.image && (
                            <img
                              src={usuarioBuscado.image}
                              alt={usuarioBuscado.name}
                              className="w-10 h-10 rounded-full"
                            />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {usuarioBuscado.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              @{usuarioBuscado.username}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setUsuarioBuscado(null);
                              setBuscaUsername("");
                              handleChange("usuarioAlvoId", "");
                            }}
                            className="text-gray-500 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {formData.usuarioAlvoId && (
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                      {translations.categorias.formulario.valorCompartilhado} (
                      {currencySymbol})
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                        {currencySymbol}
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max={formData.valor}
                        value={formData.valorCompartilhado}
                        onChange={(e) =>
                          handleChange("valorCompartilhado", e.target.value)
                        }
                        placeholder={
                          translations.categorias.formulario.placeholderValor
                        }
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-sm pl-9"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cartão de Crédito */}
            {formData.tipoTransacao === "CARTAO_CREDITO" && (
              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="cartaoId"
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  {translations.categorias.formulario.cartao} *
                </Label>
                <Select
                  value={formData.cartaoId}
                  onValueChange={(value) => handleChange("cartaoId", value)}
                  required
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue
                      placeholder={
                        translations.categorias.formulario.selecioneCartao
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                    {cartoes.map((cartao) => (
                      <SelectItem key={cartao.id} value={cartao.id}>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cartao.cor }}
                          />
                          <span className="truncate">{cartao.nome}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Data */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label
                htmlFor="data"
                className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
              >
                {translations.categorias.formulario.data} *
              </Label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => handleChange("data", e.target.value)}
                required
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-sm"
              />
            </div>

            {/* Recorrência */}
            <div className="space-y-2 sm:space-y-3 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50/50 dark:bg-gray-800/30">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recorrente"
                  checked={formData.recorrente}
                  onCheckedChange={(checked) =>
                    handleChange("recorrente", checked === true)
                  }
                  className="h-4 w-4"
                />
                <Label
                  htmlFor="recorrente"
                  className="font-medium text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  {translations.categorias.formulario.recorrente}
                </Label>
              </div>

              {formData.recorrente && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pl-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label
                      htmlFor="tipoRecorrencia"
                      className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                    >
                      {translations.categorias.formulario.tipoRecorrencia}
                    </Label>
                    <Select
                      value={formData.tipoRecorrencia}
                      onValueChange={(value) =>
                        handleChange("tipoRecorrencia", value)
                      }
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs sm:text-sm h-9 sm:h-10">
                        <SelectValue
                          placeholder={
                            translations.categorias.formulario.selecione
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                        <SelectItem value="RECORRENCIA">
                          {
                            translations.categorias.formulario
                              .opcoesTipoRecorrencia.recorrencia
                          }
                        </SelectItem>
                        <SelectItem value="PARCELAMENTO">
                          {
                            translations.categorias.formulario
                              .opcoesTipoRecorrencia.parcelamento
                          }
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.tipoRecorrencia === "RECORRENCIA" && (
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label
                        htmlFor="frequencia"
                        className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                      >
                        {translations.categorias.formulario.frequencia}
                      </Label>
                      <Select
                        value={formData.frequencia}
                        onValueChange={(value) =>
                          handleChange("frequencia", value)
                        }
                      >
                        <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs sm:text-sm h-9 sm:h-10">
                          <SelectValue
                            placeholder={
                              translations.categorias.formulario.selecione
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                          <SelectItem value="mensal">
                            {
                              translations.categorias.formulario
                                .opcoesFrequencia.mensal
                            }
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.tipoRecorrencia === "PARCELAMENTO" && (
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label
                        htmlFor="parcelas"
                        className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                      >
                        {translations.categorias.formulario.parcelas}
                      </Label>
                      <Input
                        id="parcelas"
                        type="number"
                        min="2"
                        max="24"
                        value={formData.parcelas}
                        onChange={(e) =>
                          handleChange("parcelas", e.target.value)
                        }
                        placeholder="Ex: 3, 6, 12"
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-sm"
                      />
                    </div>
                  )}

                  {formData.tipoRecorrencia === "RECORRENCIA" && (
                    <div className="space-y-1.5 sm:space-y-2 col-span-1 sm:col-span-2">
                      <Label
                        htmlFor="dataFimRecorrencia"
                        className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                      >
                        {translations.categorias.formulario.dataFimRecorrencia}{" "}
                        *
                      </Label>
                      <Input
                        id="dataFimRecorrencia"
                        type="date"
                        value={formData.dataFimRecorrencia}
                        onChange={(e) =>
                          handleChange("dataFimRecorrencia", e.target.value)
                        }
                        required
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-sm"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {translations.categorias.detalhes.dataFimRecorrencia}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Observações */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label
                htmlFor="observacoes"
                className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
              >
                {translations.categorias.formulario.observacoes}
              </Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange("observacoes", e.target.value)}
                placeholder={
                  translations.categorias.formulario.placeholderObservacoes
                }
                rows={3}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-sm resize-none"
              />
            </div>

            <Button
              variant={"outline"}
              type="submit"
              className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500 text-sm sm:text-base py-2"
              disabled={enviando}
            >
              {enviando
                ? translations.categorias.mensagens.carregando
                : translations.categorias.acoes.salvar}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Dialog para Visualizar Lançamento */}
      <Dialog
        open={mostrarDialogVisualizar}
        onOpenChange={setMostrarDialogVisualizar}
      >
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white w-[90vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white text-lg">
              {translations.categorias.detalhes.titulo}
            </DialogTitle>
          </DialogHeader>
          {lancamentoSelecionado && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    {translations.categorias.detalhes.descricao}
                  </Label>
                  <p className="text-gray-900 dark:text-white font-medium mt-1 text-sm sm:text-base">
                    {lancamentoSelecionado.descricao}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    {translations.categorias.detalhes.valorTotal}
                  </Label>
                  <p
                    className={`font-bold mt-1 text-sm sm:text-base ${
                      lancamentoSelecionado.tipo === "RECEITA"
                        ? "text-emerald-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    R$ {lancamentoSelecionado.valor.toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    {translations.categorias.detalhes.tipo}
                  </Label>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        lancamentoSelecionado.tipo === "RECEITA"
                          ? "bg-emerald-100 dark:bg-green-900/50 text-emerald-700 dark:text-green-400 border-emerald-200 dark:border-green-700"
                          : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700"
                      }`}
                    >
                      {lancamentoSelecionado.tipo === "RECEITA"
                        ? translations.categorias.filtros.receita
                        : translations.categorias.filtros.despesa}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    {translations.categorias.detalhes.status}
                  </Label>
                  <p
                    className={`mt-1 text-sm ${
                      lancamentoSelecionado.pago
                        ? "text-emerald-600 dark:text-green-400"
                        : "text-amber-600 dark:text-yellow-400"
                    }`}
                  >
                    {lancamentoSelecionado.pago
                      ? translations.categorias.status.pago
                      : translations.categorias.status.pendente}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    {translations.categorias.detalhes.data}
                  </Label>
                  <p className="text-gray-900 dark:text-white mt-1 text-sm">
                    {new Date(lancamentoSelecionado.data).toLocaleDateString(
                      currentLang === "pt" ? "pt-BR" : "en-US",
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    {translations.categorias.detalhes.metodoPagamento}
                  </Label>
                  <p className="text-gray-900 dark:text-white mt-1 text-sm">
                    {lancamentoSelecionado.metodoPagamento}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    {translations.categorias.detalhes.categoria}
                  </Label>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                    <div
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                      style={{
                        backgroundColor: lancamentoSelecionado.categoria.cor,
                      }}
                    />
                    <p className="text-gray-900 dark:text-white text-sm">
                      {lancamentoSelecionado.categoria.nome}
                    </p>
                  </div>
                </div>
                {lancamentoSelecionado.cartao && (
                  <div>
                    <Label className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                      {translations.categorias.detalhes.cartao}
                    </Label>
                    <p className="text-gray-900 dark:text-white mt-1 text-sm">
                      {lancamentoSelecionado.cartao.nome}
                    </p>
                  </div>
                )}
              </div>

              {lancamentoSelecionado.observacoes && (
                <div>
                  <Label className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    {translations.categorias.detalhes.observacoes}
                  </Label>
                  <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-md mt-1 text-sm">
                    {lancamentoSelecionado.observacoes}
                  </p>
                </div>
              )}

              {lancamentoSelecionado.recorrente && (
                <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/30">
                  <Label className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    {translations.categorias.detalhes.recorrente}
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-2">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                        {translations.categorias.detalhes.parcelamento}
                      </p>
                      <p className="text-gray-900 dark:text-white mt-1 text-sm">
                        {lancamentoSelecionado.tipoParcelamento}
                      </p>
                    </div>
                    {lancamentoSelecionado.parcelasTotal && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                          {translations.categorias.detalhes.parcelasTotal}
                        </p>
                        <p className="text-gray-900 dark:text-white mt-1 text-sm">
                          {lancamentoSelecionado.parcelaAtual}/
                          {lancamentoSelecionado.parcelasTotal}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar Lançamento */}
      <Dialog open={mostrarDialogEditar} onOpenChange={setMostrarDialogEditar}>
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white w-[90vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white text-lg">
              {translations.categorias.formulario.tituloEditar}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAtualizar} className="space-y-4">
            {/* Tipo e Categoria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="tipo"
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  {translations.categorias.formulario.tipo} *
                </Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => handleChange("tipo", value)}
                  required
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue
                      placeholder={translations.categorias.formulario.selecione}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                    <SelectItem value="receita">
                      {translations.categorias.filtros.receita}
                    </SelectItem>
                    <SelectItem value="despesa">
                      {translations.categorias.filtros.despesa}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="categoria"
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  {translations.categorias.formulario.categoria} *
                </Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => handleChange("categoria", value)}
                  required
                  disabled={!formData.tipo}
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue
                      placeholder={
                        !formData.tipo
                          ? translations.categorias.formulario.selecione
                          : translations.categorias.formulario.selecione
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                    {categorias
                      .filter(
                        (cat) =>
                          cat.tipo ===
                          (formData.tipo === "receita" ? "RECEITA" : "DESPESA"),
                      )
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div
                              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                              style={{ backgroundColor: cat.cor }}
                            />
                            <span className="truncate">{cat.nome}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Descrição e Valor */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label
                htmlFor="descricao"
                className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
              >
                {translations.categorias.formulario.descricao} *
              </Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
                placeholder={
                  translations.categorias.formulario.placeholderDescricao
                }
                required
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-sm"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label
                htmlFor="valor"
                className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
              >
                {translations.categorias.formulario.valor} *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                  {currencySymbol}
                </span>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={(e) => handleChange("valor", e.target.value)}
                  placeholder={
                    translations.categorias.formulario.placeholderValor
                  }
                  required
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-sm pl-9"
                />
              </div>
            </div>

            {/* Tipo de Transação e Lançamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="tipoTransacao"
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  {translations.categorias.formulario.metodoPagamento} *
                </Label>
                <Select
                  value={formData.tipoTransacao}
                  onValueChange={(value) =>
                    handleChange("tipoTransacao", value)
                  }
                  required
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue
                      placeholder={translations.categorias.formulario.selecione}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                    <SelectItem value="DINHEIRO">
                      {
                        translations.categorias.formulario.opcoesMetodoPagamento
                          .dinheiro
                      }
                    </SelectItem>
                    <SelectItem value="PIX">
                      {
                        translations.categorias.formulario.opcoesMetodoPagamento
                          .pix
                      }
                    </SelectItem>
                    <SelectItem value="CARTAO_DEBITO">
                      {
                        translations.categorias.formulario.opcoesMetodoPagamento
                          .debito
                      }
                    </SelectItem>
                    <SelectItem value="CARTAO_CREDITO">
                      {
                        translations.categorias.formulario.opcoesMetodoPagamento
                          .credito
                      }
                    </SelectItem>
                    <SelectItem value="TRANSFERENCIA">
                      {
                        translations.categorias.formulario.opcoesMetodoPagamento
                          .transferencia
                      }
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="tipoLancamento"
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  {translations.categorias.formulario.tipoLancamento} *
                </Label>
                <Select
                  value={formData.tipoLancamento}
                  onValueChange={(value) =>
                    handleChange("tipoLancamento", value)
                  }
                  required
                  disabled={true}
                >
                  <SelectTrigger className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs sm:text-sm h-9 sm:h-10 cursor-not-allowed">
                    <SelectValue
                      placeholder={translations.categorias.formulario.selecione}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                    <SelectItem value="individual">
                      {translations.categorias.filtros.individual}
                    </SelectItem>
                    <SelectItem value="compartilhado">
                      {translations.categorias.filtros.compartilhado}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Seção de Compartilhamento - SOMENTE LEITURA */}
            {formData.tipoLancamento === "compartilhado" &&
              lancamentoSelecionado?.LancamentoCompartilhado?.[0] && (
                <div className="space-y-3 p-3 rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <Label className="text-blue-900 dark:text-blue-300 text-sm font-semibold">
                      {translations.categorias.detalhes.compartilhamento}
                    </Label>
                  </div>

                  {/* Usuário Compartilhado */}
                  <div className="p-3 border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 rounded-md">
                    <Label className="text-gray-600 dark:text-gray-400 text-xs mb-2 block">
                      {translations.categorias.formulario.usuarioAlvo}
                    </Label>
                    <div className="flex items-center gap-2">
                      {lancamentoSelecionado.LancamentoCompartilhado[0]
                        .usuarioAlvo?.image && (
                        <img
                          src={
                            lancamentoSelecionado.LancamentoCompartilhado[0]
                              .usuarioAlvo.image
                          }
                          alt={
                            lancamentoSelecionado.LancamentoCompartilhado[0]
                              .usuarioAlvo.name
                          }
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {
                            lancamentoSelecionado.LancamentoCompartilhado[0]
                              .usuarioAlvo?.name
                          }
                        </p>
                        {lancamentoSelecionado.LancamentoCompartilhado[0]
                          .usuarioAlvo?.username && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            @
                            {
                              lancamentoSelecionado.LancamentoCompartilhado[0]
                                .usuarioAlvo.username
                            }
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600"
                      >
                        {translations.categorias.status.compartilhado}
                      </Badge>
                    </div>
                  </div>

                  {/* Valor Compartilhado - SOMENTE LEITURA */}
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                      {translations.categorias.formulario.valorCompartilhado} (
                      {currencySymbol})
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                        {currencySymbol}
                      </span>
                      <Input
                        type="text"
                        value={lancamentoSelecionado.LancamentoCompartilhado[0].valorCompartilhado.toFixed(
                          2,
                        )}
                        disabled
                        className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-sm pl-9 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <p className="text-xs text-yellow-800 dark:text-yellow-300 flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {currentLang === "pt"
                        ? "As informações de compartilhamento não podem ser editadas"
                        : "Sharing information cannot be edited"}
                    </p>
                  </div>
                </div>
              )}

            {/* Cartão de Crédito */}
            {formData.tipoTransacao === "CARTAO_CREDITO" && (
              <div className="space-y-2">
                <Label
                  htmlFor="cartaoId"
                  className="text-gray-700 dark:text-gray-300 text-sm sm:text-base"
                >
                  {translations.categorias.formulario.cartao} *
                </Label>
                <Select
                  value={formData.cartaoId}
                  onValueChange={(value) => handleChange("cartaoId", value)}
                  required
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 w-full">
                    <SelectValue
                      placeholder={
                        translations.categorias.formulario.selecioneCartao
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 max-h-60">
                    {cartoes.map((cartao) => (
                      <SelectItem
                        key={cartao.id}
                        value={cartao.id}
                        className="truncate"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cartao.cor }}
                          />
                          <span className="truncate">{cartao.nome}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Data */}
            <div className="space-y-2">
              <Label
                htmlFor="data"
                className="text-gray-700 dark:text-gray-300 text-sm sm:text-base"
              >
                {translations.categorias.formulario.data} *
              </Label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => handleChange("data", e.target.value)}
                required
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 w-full"
              />
            </div>

            {/* Recorrência */}
            <div className="space-y-3 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50/50 dark:bg-gray-800/30">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recorrente"
                  checked={formData.recorrente}
                  onCheckedChange={(checked) =>
                    handleChange("recorrente", checked === true)
                  }
                  className="flex-shrink-0"
                />
                <Label
                  htmlFor="recorrente"
                  className="font-medium text-gray-700 dark:text-gray-300 text-sm sm:text-base"
                >
                  {translations.categorias.formulario.recorrente}
                </Label>
              </div>

              {formData.recorrente && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-0 sm:pl-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="tipoRecorrencia"
                      className="text-gray-700 dark:text-gray-300 text-sm sm:text-base"
                    >
                      {translations.categorias.formulario.tipoRecorrencia}
                    </Label>
                    <Select
                      value={formData.tipoRecorrencia}
                      onValueChange={(value) =>
                        handleChange("tipoRecorrencia", value)
                      }
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 w-full">
                        <SelectValue
                          placeholder={
                            translations.categorias.formulario.selecione
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectItem value="RECORRENCIA">
                          {
                            translations.categorias.formulario
                              .opcoesTipoRecorrencia.recorrencia
                          }
                        </SelectItem>
                        <SelectItem value="PARCELAMENTO">
                          {
                            translations.categorias.formulario
                              .opcoesTipoRecorrencia.parcelamento
                          }
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.tipoRecorrencia === "RECORRENCIA" && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="frequencia"
                        className="text-gray-700 dark:text-gray-300 text-sm sm:text-base"
                      >
                        {translations.categorias.formulario.frequencia}
                      </Label>
                      <Select
                        value={formData.frequencia}
                        onValueChange={(value) =>
                          handleChange("frequencia", value)
                        }
                      >
                        <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 w-full">
                          <SelectValue
                            placeholder={
                              translations.categorias.formulario.selecione
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          <SelectItem value="mensal">
                            {
                              translations.categorias.formulario
                                .opcoesFrequencia.mensal
                            }
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.tipoRecorrencia === "PARCELAMENTO" && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="parcelas"
                        className="text-gray-700 dark:text-gray-300 text-sm sm:text-base"
                      >
                        {translations.categorias.formulario.parcelas}
                      </Label>
                      <Input
                        id="parcelas"
                        type="number"
                        min="2"
                        max="24"
                        value={formData.parcelas}
                        onChange={(e) =>
                          handleChange("parcelas", e.target.value)
                        }
                        placeholder="Ex: 3, 6, 12"
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 w-full"
                      />
                    </div>
                  )}

                  {formData.tipoRecorrencia === "RECORRENCIA" && (
                    <div className="space-y-2 col-span-1 sm:col-span-2">
                      <Label
                        htmlFor="dataFimRecorrencia"
                        className="text-gray-700 dark:text-gray-300 text-sm sm:text-base"
                      >
                        {translations.categorias.formulario.dataFimRecorrencia}{" "}
                        *
                      </Label>
                      <Input
                        id="dataFimRecorrencia"
                        type="date"
                        value={formData.dataFimRecorrencia}
                        onChange={(e) =>
                          handleChange("dataFimRecorrencia", e.target.value)
                        }
                        required
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {translations.categorias.detalhes.dataFimRecorrencia}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label
                htmlFor="observacoes"
                className="text-gray-700 dark:text-gray-300 text-sm sm:text-base"
              >
                {translations.categorias.formulario.observacoes}
              </Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange("observacoes", e.target.value)}
                placeholder={
                  translations.categorias.formulario.placeholderObservacoes
                }
                rows={3}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 w-full resize-y min-h-[80px]"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMostrarDialogEditar(false)}
                className="flex-1 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 w-full sm:w-auto"
              >
                {translations.categorias.acoes.cancelar}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white w-full sm:w-auto"
                disabled={editando}
              >
                {editando
                  ? translations.categorias.mensagens.carregando
                  : translations.categorias.acoes.salvar}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
