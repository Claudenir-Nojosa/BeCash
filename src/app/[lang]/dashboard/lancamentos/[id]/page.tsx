// app/dashboard/lancamentos/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  ArrowLeft,
  Save,
  CheckCircle,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { getFallback } from "@/lib/i18nFallback";

interface Lancamento {
  id: string;
  descricao: string;
  valor: number;
  tipo: "receita" | "despesa";
  categoria: string;
  tipoLancamento: string;
  tipoTransacao: string;
  responsavel: string;
  data: Date;
  dataVencimento: Date | null;
  pago: boolean;
  recorrente: boolean;
  frequencia: string | null;
  observacoes: string | null;
  origem: string;
  usuarioId: string;
  cartaoId: string | null;
  cartao?: {
    id: string;
    nome: string;
    bandeira: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Cartao {
  id: string;
  nome: string;
  bandeira: string;
  limite: number;
}

export default function EditarLancamentoPage() {
  const router = useRouter();
  const params = useParams();
  const { t, i18n } = useTranslation("dashboard");
  const id = params.id as string;
  const currentLang = params?.lang as string || "pt";
  
  // Função auxiliar para obter tradução com fallback
  const getTranslation = (key: string) => {
    // Primeiro tenta usar o i18n
    const translation = t(key);
    if (translation && translation !== key) {
      return translation;
    }

    // Fallback manual baseado nas chaves
    switch (key) {
      // Título
      case "editarLancamento.titulo":
        return getFallback(
          currentLang,
          "Editar Lançamento",
          "Edit Transaction"
        );

      // Campos do formulário
      case "formulario.tipo":
        return getFallback(currentLang, "Tipo *", "Type *");
      case "formulario.tipoPlaceholder":
        return getFallback(
          currentLang,
          "Selecione o tipo",
          "Select type"
        );
      case "formulario.tipoReceita":
        return getFallback(currentLang, "Receita", "Income");
      case "formulario.tipoDespesa":
        return getFallback(currentLang, "Despesa", "Expense");
      
      case "formulario.categoria":
        return getFallback(currentLang, "Categoria *", "Category *");
      case "formulario.categoriaPlaceholder":
        return getFallback(
          currentLang,
          "Selecione a categoria",
          "Select category"
        );

      case "formulario.tipoTransacao":
        return getFallback(currentLang, "Tipo de Transação *", "Transaction Type *");
      case "formulario.tipoTransacaoPlaceholder":
        return getFallback(
          currentLang,
          "Selecione o tipo",
          "Select type"
        );

      case "formulario.tipoLancamento":
        return getFallback(currentLang, "Tipo de Lançamento *", "Entry Type *");
      case "formulario.tipoLancamentoPlaceholder":
        return getFallback(
          currentLang,
          "Selecione o tipo",
          "Select type"
        );
      case "formulario.lancamentoIndividual":
        return getFallback(currentLang, "Individual", "Individual");
      case "formulario.lancamentoCompartilhado":
        return getFallback(currentLang, "Compartilhado", "Shared");

      case "formulario.cartao":
        return getFallback(currentLang, "Cartão *", "Card *");
      case "formulario.cartaoPlaceholder":
        return getFallback(
          currentLang,
          "Selecione o cartão",
          "Select card"
        );
      case "formulario.carregandoCartoes":
        return getFallback(
          currentLang,
          "Carregando cartões...",
          "Loading cards..."
        );

      case "formulario.descricao":
        return getFallback(currentLang, "Descrição *", "Description *");
      case "formulario.descricaoPlaceholder":
        return getFallback(
          currentLang,
          "Ex: Salário, Aluguel, Mercado...",
          "Ex: Salary, Rent, Groceries..."
        );

      case "formulario.valor":
        return getFallback(currentLang, "Valor *", "Amount *");
      case "formulario.valorPlaceholder":
        return getFallback(currentLang, "0,00", "0.00");

      case "formulario.responsavel":
        return getFallback(currentLang, "Responsável *", "Responsible *");
      case "formulario.responsavelPlaceholder":
        return getFallback(
          currentLang,
          "Selecione o responsável",
          "Select responsible"
        );

      case "formulario.dataCompra":
        return getFallback(currentLang, "Data da Compra *", "Purchase Date *");
      case "formulario.selecioneData":
        return getFallback(
          currentLang,
          "Selecione a data",
          "Select date"
        );

      case "formulario.dataVencimento":
        return getFallback(currentLang, "Data de Vencimento *", "Due Date *");
      case "formulario.dataVencimentoDescricao":
        return getFallback(
          currentLang,
          "Data que a fatura vence",
          "Date the invoice is due"
        );

      case "formulario.marcarComoPago":
        return getFallback(currentLang, "Marcar como pago", "Mark as paid");
      case "formulario.naoDisponivelCredito":
        return getFallback(
          currentLang,
          "(Não disponível para cartão de crédito)",
          "(Not available for credit card)"
        );

      case "formulario.lancamentoRecorrente":
        return getFallback(
          currentLang,
          "Lançamento recorrente",
          "Recurring entry"
        );

      case "formulario.frequencia":
        return getFallback(currentLang, "Frequência", "Frequency");
      case "formulario.frequenciaPlaceholder":
        return getFallback(
          currentLang,
          "Selecione a frequência",
          "Select frequency"
        );

      case "formulario.observacoes":
        return getFallback(currentLang, "Observações", "Notes");
      case "formulario.observacoesPlaceholder":
        return getFallback(
          currentLang,
          "Observações adicionais...",
          "Additional notes..."
        );

      // Tipos de transação
      case "transacoes.dinheiro":
        return getFallback(currentLang, "Dinheiro", "Cash");
      case "transacoes.pix":
        return getFallback(currentLang, "PIX", "PIX");
      case "transacoes.cartaoDebito":
        return getFallback(currentLang, "Cartão Débito", "Debit Card");
      case "transacoes.cartaoCredito":
        return getFallback(currentLang, "Cartão Crédito", "Credit Card");
      case "transacoes.transferencia":
        return getFallback(currentLang, "Transferência", "Transfer");

      // Categorias de receita
      case "categoriasReceita.salario":
        return getFallback(currentLang, "Salário", "Salary");
      case "categoriasReceita.freela":
        return getFallback(currentLang, "Freelance", "Freelance");
      case "categoriasReceita.investimentos":
        return getFallback(currentLang, "Investimentos", "Investments");
      case "categoriasReceita.outros":
        return getFallback(currentLang, "Outros", "Others");

      // Categorias de despesa
      case "categoriasDespesa.alimentacao":
        return getFallback(currentLang, "Alimentação", "Food");
      case "categoriasDespesa.transporte":
        return getFallback(currentLang, "Transporte", "Transportation");
      case "categoriasDespesa.casa":
        return getFallback(currentLang, "Casa", "Home");
      case "categoriasDespesa.pessoal":
        return getFallback(currentLang, "Pessoal", "Personal");
      case "categoriasDespesa.lazer":
        return getFallback(currentLang, "Lazer", "Leisure");
      case "categoriasDespesa.outros":
        return getFallback(currentLang, "Outros", "Others");

      // Responsáveis
      case "responsaveis.claudenir":
        return getFallback(currentLang, "Claudenir", "Claudenir");
      case "responsaveis.beatriz":
        return getFallback(currentLang, "Beatriz", "Beatriz");
      case "responsaveis.compartilhado":
        return getFallback(currentLang, "Compartilhado", "Shared");

      // Frequências
      case "frequencias.mensal":
        return getFallback(currentLang, "Mensal", "Monthly");
      case "frequencias.trimestral":
        return getFallback(currentLang, "Trimestral", "Quarterly");
      case "frequencias.anual":
        return getFallback(currentLang, "Anual", "Yearly");

      // Mensagens de cartão de crédito
      case "cartaoCredito.titulo":
        return getFallback(
          currentLang,
          "Compra no Cartão de Crédito",
          "Credit Card Purchase"
        );
      case "cartaoCredito.descricao":
        return getFallback(
          currentLang,
          "Esta compra será considerada na fatura de {mes}. O valor não afetará seu saldo atual até o vencimento da fatura.",
          "This purchase will be included in the {mes} invoice. The amount will not affect your current balance until the invoice due date."
        );

      // Botões
      case "botoes.cancelar":
        return getFallback(currentLang, "Cancelar", "Cancel");
      case "botoes.salvarAlteracoes":
        return getFallback(currentLang, "Salvar Alterações", "Save Changes");
      case "botoes.salvando":
        return getFallback(currentLang, "Salvando...", "Saving...");

      // Mensagens de sucesso/erro
      case "mensagens.sucessoAtualizar":
        return getFallback(
          currentLang,
          "Lançamento atualizado com sucesso!",
          "Transaction updated successfully!"
        );
      case "mensagens.erroAtualizar":
        return getFallback(
          currentLang,
          "Erro ao atualizar lançamento",
          "Error updating transaction"
        );
      case "mensagens.erroCarregar":
        return getFallback(
          currentLang,
          "Erro ao carregar lançamento",
          "Error loading transaction"
        );

      default:
        return key;
    }
  };

  // Criar objeto de traduções para fácil acesso
  const translations = {
    titulo: getTranslation("editarLancamento.titulo"),
    
    formulario: {
      tipo: getTranslation("formulario.tipo"),
      tipoPlaceholder: getTranslation("formulario.tipoPlaceholder"),
      tipoReceita: getTranslation("formulario.tipoReceita"),
      tipoDespesa: getTranslation("formulario.tipoDespesa"),
      
      categoria: getTranslation("formulario.categoria"),
      categoriaPlaceholder: getTranslation("formulario.categoriaPlaceholder"),
      
      tipoTransacao: getTranslation("formulario.tipoTransacao"),
      tipoTransacaoPlaceholder: getTranslation("formulario.tipoTransacaoPlaceholder"),
      
      tipoLancamento: getTranslation("formulario.tipoLancamento"),
      tipoLancamentoPlaceholder: getTranslation("formulario.tipoLancamentoPlaceholder"),
      lancamentoIndividual: getTranslation("formulario.lancamentoIndividual"),
      lancamentoCompartilhado: getTranslation("formulario.lancamentoCompartilhado"),
      
      cartao: getTranslation("formulario.cartao"),
      cartaoPlaceholder: getTranslation("formulario.cartaoPlaceholder"),
      carregandoCartoes: getTranslation("formulario.carregandoCartoes"),
      
      descricao: getTranslation("formulario.descricao"),
      descricaoPlaceholder: getTranslation("formulario.descricaoPlaceholder"),
      
      valor: getTranslation("formulario.valor"),
      valorPlaceholder: getTranslation("formulario.valorPlaceholder"),
      
      responsavel: getTranslation("formulario.responsavel"),
      responsavelPlaceholder: getTranslation("formulario.responsavelPlaceholder"),
      
      dataCompra: getTranslation("formulario.dataCompra"),
      selecioneData: getTranslation("formulario.selecioneData"),
      
      dataVencimento: getTranslation("formulario.dataVencimento"),
      dataVencimentoDescricao: getTranslation("formulario.dataVencimentoDescricao"),
      
      marcarComoPago: getTranslation("formulario.marcarComoPago"),
      naoDisponivelCredito: getTranslation("formulario.naoDisponivelCredito"),
      
      lancamentoRecorrente: getTranslation("formulario.lancamentoRecorrente"),
      
      frequencia: getTranslation("formulario.frequencia"),
      frequenciaPlaceholder: getTranslation("formulario.frequenciaPlaceholder"),
      
      observacoes: getTranslation("formulario.observacoes"),
      observacoesPlaceholder: getTranslation("formulario.observacoesPlaceholder"),
    },

    transacoes: {
      dinheiro: getTranslation("transacoes.dinheiro"),
      pix: getTranslation("transacoes.pix"),
      cartaoDebito: getTranslation("transacoes.cartaoDebito"),
      cartaoCredito: getTranslation("transacoes.cartaoCredito"),
      transferencia: getTranslation("transacoes.transferencia"),
    },

    categoriasReceita: {
      salario: getTranslation("categoriasReceita.salario"),
      freela: getTranslation("categoriasReceita.freela"),
      investimentos: getTranslation("categoriasReceita.investimentos"),
      outros: getTranslation("categoriasReceita.outros"),
    },

    categoriasDespesa: {
      alimentacao: getTranslation("categoriasDespesa.alimentacao"),
      transporte: getTranslation("categoriasDespesa.transporte"),
      casa: getTranslation("categoriasDespesa.casa"),
      pessoal: getTranslation("categoriasDespesa.pessoal"),
      lazer: getTranslation("categoriasDespesa.lazer"),
      outros: getTranslation("categoriasDespesa.outros"),
    },

    responsaveis: {
      claudenir: getTranslation("responsaveis.claudenir"),
      beatriz: getTranslation("responsaveis.beatriz"),
      compartilhado: getTranslation("responsaveis.compartilhado"),
    },

    frequencias: {
      mensal: getTranslation("frequencias.mensal"),
      trimestral: getTranslation("frequencias.trimestral"),
      anual: getTranslation("frequencias.anual"),
    },

    cartaoCredito: {
      titulo: getTranslation("cartaoCredito.titulo"),
      descricao: getTranslation("cartaoCredito.descricao"),
    },

    botoes: {
      cancelar: getTranslation("botoes.cancelar"),
      salvarAlteracoes: getTranslation("botoes.salvarAlteracoes"),
      salvando: getTranslation("botoes.salvando"),
    },

    mensagens: {
      sucessoAtualizar: getTranslation("mensagens.sucessoAtualizar"),
      erroAtualizar: getTranslation("mensagens.erroAtualizar"),
      erroCarregar: getTranslation("mensagens.erroCarregar"),
    },
  };

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [dataVencimento, setDataVencimento] = useState<Date | null>(null);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [carregandoCartoes, setCarregandoCartoes] = useState(false);

  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    tipo: "",
    categoria: "",
    tipoLancamento: "",
    tipoTransacao: "DINHEIRO",
    responsavel: "",
    pago: false,
    recorrente: false,
    frequencia: "",
    observacoes: "",
    cartaoId: "",
  });

  // Obter locale baseado no idioma
  const getLocale = () => {
    return currentLang === "en" ? enUS : ptBR;
  };

  // Formatar data baseada no idioma
  const formatDate = (date: Date) => {
    return format(date, "PPP", { locale: getLocale() });
  };

  // Formatar mês baseado no idioma
  const formatMonth = (date: Date) => {
    return format(date, "MMMM 'de' yyyy", { locale: getLocale() });
  };

  useEffect(() => {
    if (id) {
      carregarLancamento();
      carregarCartoes();
    }
  }, [id]);

  // Calcular automaticamente a data de vencimento para cartão de crédito
  useEffect(() => {
    if (formData.tipoTransacao === "CARTAO_CREDITO" && !dataVencimento) {
      const proximoMes = new Date(date);
      proximoMes.setMonth(proximoMes.getMonth() + 1);
      proximoMes.setDate(10); // Dia 10 do próximo mês
      setDataVencimento(proximoMes);
    }
  }, [formData.tipoTransacao, date, dataVencimento]);

  const carregarCartoes = async () => {
    try {
      setCarregandoCartoes(true);
      const response = await fetch("/api/cartoes");
      if (response.ok) {
        const data = await response.json();
        setCartoes(data);
      }
    } catch (error) {
      console.error("Erro ao carregar cartões:", error);
    } finally {
      setCarregandoCartoes(false);
    }
  };

  const carregarLancamento = async () => {
    try {
      setCarregando(true);
      const response = await fetch(`/api/lancamentos/${id}`);

      if (!response.ok) {
        throw new Error("Erro ao carregar lançamento");
      }

      const lancamento: Lancamento = await response.json();

      setFormData({
        descricao: lancamento.descricao,
        valor: lancamento.valor.toString(),
        tipo: lancamento.tipo,
        categoria: lancamento.categoria,
        tipoLancamento: lancamento.tipoLancamento,
        tipoTransacao: lancamento.tipoTransacao || "DINHEIRO",
        responsavel: lancamento.responsavel,
        pago: lancamento.pago,
        recorrente: lancamento.recorrente || false,
        frequencia: lancamento.frequencia || "",
        observacoes: lancamento.observacoes || "",
        cartaoId: lancamento.cartaoId || "",
      });

      setDate(new Date(lancamento.data));
      setDataVencimento(
        lancamento.dataVencimento ? new Date(lancamento.dataVencimento) : null
      );
    } catch (error) {
      console.error("Erro ao carregar lançamento:", error);
      toast.error(translations.mensagens.erroCarregar);
    } finally {
      setCarregando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    try {
      const payload = {
        ...formData,
        valor: parseFloat(formData.valor),
        data: date.toISOString(),
        dataVencimento: dataVencimento ? dataVencimento.toISOString() : null,
        // Para cartão de crédito, força pago como false
        pago:
          formData.tipoTransacao === "CARTAO_CREDITO" ? false : formData.pago,
      };

      const response = await fetch(`/api/lancamentos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || translations.mensagens.erroAtualizar);
      }

      toast.success(translations.mensagens.sucessoAtualizar);
      router.push(`/${currentLang}/dashboard/lancamentos`);
    } catch (error: any) {
      toast.error(error.message || translations.mensagens.erroAtualizar);
      console.error(error);
    } finally {
      setSalvando(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Categorias traduzidas
  const categoriasReceita = [
    { value: "salario", label: translations.categoriasReceita.salario },
    { value: "freela", label: translations.categoriasReceita.freela },
    { value: "investimentos", label: translations.categoriasReceita.investimentos },
    { value: "outros", label: translations.categoriasReceita.outros },
  ];

  const categoriasDespesa = [
    { value: "alimentacao", label: translations.categoriasDespesa.alimentacao },
    { value: "transporte", label: translations.categoriasDespesa.transporte },
    { value: "casa", label: translations.categoriasDespesa.casa },
    { value: "pessoal", label: translations.categoriasDespesa.pessoal },
    { value: "lazer", label: translations.categoriasDespesa.lazer },
    { value: "outros", label: translations.categoriasDespesa.outros },
  ];

  // Responsáveis traduzidos
  const responsaveis = [
    { value: "Claudenir", label: translations.responsaveis.claudenir },
    { value: "Beatriz", label: translations.responsaveis.beatriz },
    { value: "Compartilhado", label: translations.responsaveis.compartilhado },
  ];

  // Frequências traduzidas
  const frequencias = [
    { value: "mensal", label: translations.frequencias.mensal },
    { value: "trimestral", label: translations.frequencias.trimestral },
    { value: "anual", label: translations.frequencias.anual },
  ];

  const cartaoSelecionado = cartoes.find(
    (cartao) => cartao.id === formData.cartaoId
  );

  if (carregando) {
    return (
      <div className="container mx-auto p-6 mt-20 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 mt-20 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{translations.titulo}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="tipo">{translations.formulario.tipo}</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => handleChange("tipo", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={translations.formulario.tipoPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receita">{translations.formulario.tipoReceita}</SelectItem>
                <SelectItem value="despesa">{translations.formulario.tipoDespesa}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">{translations.formulario.categoria}</Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) => handleChange("categoria", value)}
              required
              disabled={!formData.tipo}
            >
              <SelectTrigger>
                <SelectValue placeholder={translations.formulario.categoriaPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {formData.tipo === "receita"
                  ? categoriasReceita.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))
                  : formData.tipo === "despesa"
                    ? categoriasDespesa.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))
                    : null}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="tipoTransacao">{translations.formulario.tipoTransacao}</Label>
            <Select
              value={formData.tipoTransacao}
              onValueChange={(value) => handleChange("tipoTransacao", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={translations.formulario.tipoTransacaoPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DINHEIRO">{translations.transacoes.dinheiro}</SelectItem>
                <SelectItem value="PIX">{translations.transacoes.pix}</SelectItem>
                <SelectItem value="CARTAO_DEBITO">{translations.transacoes.cartaoDebito}</SelectItem>
                <SelectItem value="CARTAO_CREDITO">{translations.transacoes.cartaoCredito}</SelectItem>
                <SelectItem value="TRANSFERENCIA">{translations.transacoes.transferencia}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipoLancamento">{translations.formulario.tipoLancamento}</Label>
            <Select
              value={formData.tipoLancamento}
              onValueChange={(value) => handleChange("tipoLancamento", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={translations.formulario.tipoLancamentoPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">{translations.formulario.lancamentoIndividual}</SelectItem>
                <SelectItem value="compartilhado">{translations.formulario.lancamentoCompartilhado}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Seleção de Cartão (apenas para cartão de crédito) */}
        {formData.tipoTransacao === "CARTAO_CREDITO" && (
          <div className="space-y-2">
            <Label htmlFor="cartaoId">{translations.formulario.cartao}</Label>
            <Select
              value={formData.cartaoId}
              onValueChange={(value) => handleChange("cartaoId", value)}
              required
              disabled={carregandoCartoes}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    carregandoCartoes
                      ? translations.formulario.carregandoCartoes
                      : translations.formulario.cartaoPlaceholder
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {cartoes.map((cartao) => (
                  <SelectItem key={cartao.id} value={cartao.id}>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {cartao.nome} - {cartao.bandeira}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {cartaoSelecionado && (
              <p className="text-xs text-muted-foreground">
                Cartão selecionado: {cartaoSelecionado.nome} (
                {cartaoSelecionado.bandeira})
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="descricao">{translations.formulario.descricao}</Label>
          <Input
            id="descricao"
            value={formData.descricao}
            onChange={(e) => handleChange("descricao", e.target.value)}
            placeholder={translations.formulario.descricaoPlaceholder}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor">{translations.formulario.valor}</Label>
          <Input
            id="valor"
            type="number"
            step="0.01"
            min="0"
            value={formData.valor}
            onChange={(e) => handleChange("valor", e.target.value)}
            placeholder={translations.formulario.valorPlaceholder}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsavel">{translations.formulario.responsavel}</Label>
          <Select
            value={formData.responsavel}
            onValueChange={(value) => handleChange("responsavel", value)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder={translations.formulario.responsavelPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {responsaveis.map((resp) => (
                <SelectItem key={resp.value} value={resp.value}>
                  {resp.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>{translations.formulario.dataCompra}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date
                    ? formatDate(date)
                    : translations.formulario.selecioneData}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                  locale={getLocale()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Data de Vencimento (apenas para cartão de crédito) */}
          {formData.tipoTransacao === "CARTAO_CREDITO" && (
            <div className="space-y-2">
              <Label>{translations.formulario.dataVencimento}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataVencimento
                      ? formatDate(dataVencimento)
                      : translations.formulario.selecioneData}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataVencimento || undefined}
                    onSelect={(date) => setDataVencimento(date || null)}
                    initialFocus
                    locale={getLocale()}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                {translations.formulario.dataVencimentoDescricao}
              </p>
            </div>
          )}
        </div>

        {/* Informações sobre cartão de crédito */}
        {formData.tipoTransacao === "CARTAO_CREDITO" && dataVencimento && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <CreditCard className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium">
                  {translations.cartaoCredito.titulo}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {translations.cartaoCredito.descricao.replace(
                    "{mes}",
                    formatMonth(dataVencimento)
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pago"
              checked={formData.pago}
              onCheckedChange={(checked) =>
                handleChange("pago", checked === true)
              }
              disabled={formData.tipoTransacao === "CARTAO_CREDITO"}
            />
            <Label
              htmlFor="pago"
              className={
                formData.tipoTransacao === "CARTAO_CREDITO"
                  ? "text-muted-foreground"
                  : ""
              }
            >
              {translations.formulario.marcarComoPago}
              {formData.tipoTransacao === "CARTAO_CREDITO" && (
                <span className="block text-xs text-muted-foreground">
                  {translations.formulario.naoDisponivelCredito}
                </span>
              )}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="recorrente"
              checked={formData.recorrente}
              onCheckedChange={(checked) =>
                handleChange("recorrente", checked === true)
              }
            />
            <Label htmlFor="recorrente">
              {translations.formulario.lancamentoRecorrente}
            </Label>
          </div>
        </div>

        {formData.recorrente && (
          <div className="space-y-2">
            <Label htmlFor="frequencia">{translations.formulario.frequencia}</Label>
            <Select
              value={formData.frequencia}
              onValueChange={(value) => handleChange("frequencia", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={translations.formulario.frequenciaPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {frequencias.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="observacoes">{translations.formulario.observacoes}</Label>
          <Textarea
            id="observacoes"
            value={formData.observacoes}
            onChange={(e) => handleChange("observacoes", e.target.value)}
            placeholder={translations.formulario.observacoesPlaceholder}
            rows={3}
          />
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            {translations.botoes.cancelar}
          </Button>
          <Button type="submit" disabled={salvando} className="flex-1">
            {salvando ? (
              <>
                <Save className="mr-2 h-4 w-4" />
                {translations.botoes.salvando}
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                {translations.botoes.salvarAlteracoes}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}