// app/dashboard/lancamentos/novo/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { CalendarIcon, ArrowLeft, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Cartao {
  id: string;
  nome: string;
  bandeira: string;
  limite: number;
}

export default function NovoLancamentoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [carregando, setCarregando] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [dataVencimento, setDataVencimento] = useState<Date | null>(null);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [carregandoCartoes, setCarregandoCartoes] = useState(false);

  const cartaoIdFromUrl = searchParams.get("cartaoId");

  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    tipo: "",
    categoria: "",
    tipoLancamento: "",
    tipoTransacao: "DINHEIRO",
    cartaoId: cartaoIdFromUrl || "",
    responsavel: "",
    pago: false,
    recorrente: false,
    frequencia: "",
    observacoes: "",
  });

  // Carregar cartões disponíveis
  useEffect(() => {
    carregarCartoes();
  }, []);

  // Calcular data de vencimento automática para cartão de crédito
  useEffect(() => {
    if (formData.tipoTransacao === "CARTAO_CREDITO" && !dataVencimento) {
      const proximoMes = new Date(date);
      proximoMes.setMonth(proximoMes.getMonth() + 1);
      proximoMes.setDate(10); // Dia 10 do próximo mês
      setDataVencimento(proximoMes);
    }
  }, [formData.tipoTransacao, date, dataVencimento]);

  const carregarCartoes = async () => {
    setCarregandoCartoes(true);
    try {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);

    try {
      const payload = {
        ...formData,
        valor: parseFloat(formData.valor),
        data: date.toISOString(),
        dataVencimento:
          formData.tipoTransacao === "CARTAO_CREDITO" && dataVencimento
            ? dataVencimento.toISOString()
            : null,
        // Para cartão de crédito, força pago como false
        pago:
          formData.tipoTransacao === "CARTAO_CREDITO" ? false : formData.pago,
      };

      const response = await fetch("/api/lancamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar lançamento");
      }

      toast.success("Lançamento criado com sucesso!");
      router.push("/dashboard/lancamentos");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar lançamento");
      console.error(error);
    } finally {
      setCarregando(false);
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

  return (
    <div className="container mx-auto p-6 mt-20 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Novo Lançamento</h1>
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
                      {cartao.nome} - Limite: R$ {cartao.limite.toFixed(2)}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    onSelect={(date) => date && setDataVencimento(date)}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Data da Compra/Transação *</Label>
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

          <div className="flex items-center space-x-2 pt-8">
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
          <Button type="submit" disabled={carregando} className="flex-1">
            {carregando ? "Criando..." : "Criar Lançamento"}
          </Button>
        </div>
      </form>
    </div>
  );
}
