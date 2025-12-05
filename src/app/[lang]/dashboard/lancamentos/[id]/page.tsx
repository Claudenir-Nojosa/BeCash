// app/dashboard/lancamentos/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

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
  const id = params.id as string;

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
      toast.error("Erro ao carregar lançamento");
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
        throw new Error(errorData.error || "Erro ao atualizar lançamento");
      }

      toast.success("Lançamento atualizado com sucesso!");
      router.push("/dashboard/lancamentos");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar lançamento");
      console.error(error);
    } finally {
      setSalvando(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const categoriasReceita = [
    { value: "salario", label: "Salário" },
    { value: "freela", label: "Freelance" },
    { value: "investimentos", label: "Investimentos" },
    { value: "outros", label: "Outros" },
  ];

  const categoriasDespesa = [
    { value: "alimentacao", label: "Alimentação" },
    { value: "transporte", label: "Transporte" },
    { value: "casa", label: "Casa" },
    { value: "pessoal", label: "Pessoal" },
    { value: "lazer", label: "Lazer" },
    { value: "outros", label: "Outros" },
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
        <h1 className="text-3xl font-bold">Editar Lançamento</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => handleChange("tipo", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria *</Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) => handleChange("categoria", value)}
              required
              disabled={!formData.tipo}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
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
            <Label htmlFor="tipoTransacao">Tipo de Transação *</Label>
            <Select
              value={formData.tipoTransacao}
              onValueChange={(value) => handleChange("tipoTransacao", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="CARTAO_DEBITO">Cartão Débito</SelectItem>
                <SelectItem value="CARTAO_CREDITO">Cartão Crédito</SelectItem>
                <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipoLancamento">Tipo de Lançamento *</Label>
            <Select
              value={formData.tipoLancamento}
              onValueChange={(value) => handleChange("tipoLancamento", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="compartilhado">Compartilhado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Seleção de Cartão (apenas para cartão de crédito) */}
        {formData.tipoTransacao === "CARTAO_CREDITO" && (
          <div className="space-y-2">
            <Label htmlFor="cartaoId">Cartão *</Label>
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
                      ? "Carregando cartões..."
                      : "Selecione o cartão"
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
          <Label htmlFor="descricao">Descrição *</Label>
          <Input
            id="descricao"
            value={formData.descricao}
            onChange={(e) => handleChange("descricao", e.target.value)}
            placeholder="Ex: Salário, Aluguel, Mercado..."
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor">Valor *</Label>
          <Input
            id="valor"
            type="number"
            step="0.01"
            min="0"
            value={formData.valor}
            onChange={(e) => handleChange("valor", e.target.value)}
            placeholder="0,00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsavel">Responsável *</Label>
          <Select
            value={formData.responsavel}
            onValueChange={(value) => handleChange("responsavel", value)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Claudenir">Claudenir</SelectItem>
              <SelectItem value="Beatriz">Beatriz</SelectItem>
              <SelectItem value="Compartilhado">Compartilhado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Data da Compra *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date
                    ? format(date, "PPP", { locale: ptBR })
                    : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Data de Vencimento (apenas para cartão de crédito) */}
          {formData.tipoTransacao === "CARTAO_CREDITO" && (
            <div className="space-y-2">
              <Label>Data de Vencimento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataVencimento
                      ? format(dataVencimento, "PPP", { locale: ptBR })
                      : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataVencimento || undefined}
                    onSelect={(date) => setDataVencimento(date || null)}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Data que a fatura vence
              </p>
            </div>
          )}
        </div>

        {/* Informações sobre cartão de crédito */}
        {formData.tipoTransacao === "CARTAO_CREDITO" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <CreditCard className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium">
                  Compra no Cartão de Crédito
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Esta compra será considerada na fatura de{" "}
                  {dataVencimento
                    ? format(dataVencimento, "MMMM 'de' yyyy", { locale: ptBR })
                    : "próximo mês"}
                  . O valor não afetará seu saldo atual até o vencimento da
                  fatura.
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
              Marcar como pago
              {formData.tipoTransacao === "CARTAO_CREDITO" && (
                <span className="block text-xs text-muted-foreground">
                  (Não disponível para cartão de crédito)
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
            <Label htmlFor="recorrente">Lançamento recorrente</Label>
          </div>
        </div>

        {formData.recorrente && (
          <div className="space-y-2">
            <Label htmlFor="frequencia">Frequência</Label>
            <Select
              value={formData.frequencia}
              onValueChange={(value) => handleChange("frequencia", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a frequência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            value={formData.observacoes}
            onChange={(e) => handleChange("observacoes", e.target.value)}
            placeholder="Observações adicionais..."
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
            Cancelar
          </Button>
          <Button type="submit" disabled={salvando} className="flex-1">
            {salvando ? (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
