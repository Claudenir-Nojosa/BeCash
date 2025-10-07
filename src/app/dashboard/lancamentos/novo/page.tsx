// app/dashboard/lancamentos/novo/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  CalendarIcon,
  ArrowLeft,
  CreditCard,
  Repeat,
  Divide,
} from "lucide-react";

// Components
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

// Types
interface Cartao {
  id: string;
  nome: string;
  bandeira: string;
  limite: number;
}

interface Usuario {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface FormData {
  descricao: string;
  valor: string;
  tipo: string;
  categoria: string;
  tipoLancamento: string;
  tipoTransacao: string;
  cartaoId: string;
  responsavel: string;
  pago: boolean;
  recorrente: boolean;
  tipoRecorrencia: string;
  frequencia: string;
  parcelas: string;
  observacoes: string;
  usuarioAlvoId: string;
  valorCompartilhado: string;
}

interface Categoria {
  id: string;
  nome: string;
  tipo: string;
  cor?: string;
}

// Constants
const TIPOS_TRANSACAO = [
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "PIX", label: "PIX" },
  { value: "CARTAO_DEBITO", label: "Cartão Débito" },
  { value: "CARTAO_CREDITO", label: "Cartão Crédito" },
  { value: "TRANSFERENCIA", label: "Transferência" },
];

const TIPOS_LANCAMENTO = [
  { value: "individual", label: "Individual" },
  { value: "compartilhado", label: "Compartilhado" },
];

const RESPONSAVEIS = [
  { value: "Claudenir", label: "Claudenir" },
  { value: "Beatriz", label: "Beatriz" },
  { value: "Compartilhado", label: "Compartilhado" },
];

const FREQUENCIAS = [
  { value: "mensal", label: "Mensal" },
  { value: "trimestral", label: "Trimestral" },
  { value: "anual", label: "Anual" },
];

export default function NovoLancamentoPage() {
  // Hooks
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();

  // State
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
  const [carregandoCartoes, setCarregandoCartoes] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [dataVencimento, setDataVencimento] = useState<Date | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregandoCategorias, setCarregandoCategorias] = useState(false);
  const cartaoIdFromUrl = searchParams.get("cartaoId");

  const [formData, setFormData] = useState<FormData>({
    descricao: "",
    valor: "",
    tipo: "",
    categoria: "",
    tipoLancamento: "individual",
    tipoTransacao: "DINHEIRO",
    cartaoId: cartaoIdFromUrl || "",
    responsavel: "",
    pago: false,
    recorrente: false,
    tipoRecorrencia: "RECORRENCIA",
    frequencia: "mensal",
    parcelas: "",
    observacoes: "",
    usuarioAlvoId: "",
    valorCompartilhado: "",
  });
  useEffect(() => {
    const forceSessionUpdate = async () => {
      if (status === "unauthenticated") {
        console.log("🔄 Forçando atualização da session...");
        try {
          await update();
        } catch (error) {
          console.error("Erro ao forçar update:", error);
        }
      }
    };

    forceSessionUpdate();
  }, [status, update]);
  // Derived state
  const cartaoSelecionado = cartoes.find(
    (cartao) => cartao.id === formData.cartaoId
  );
  const usuarioSelecionado = usuarios.find(
    (usuario) => usuario.id === formData.usuarioAlvoId
  );

  // API Functions
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
      toast.error("Erro ao carregar cartões");
    } finally {
      setCarregandoCartoes(false);
    }
  };

  const carregarUsuarios = async () => {
    console.log(
      "🚀 carregarUsuarios - Status:",
      status,
      "Session ID:",
      session?.user?.id
    );

    // Se ainda está carregando ou não tem session, espera
    if (status === "loading" || !session?.user?.id) {
      console.log("⏳ Aguardando session carregar...");
      return;
    }

    setCarregandoUsuarios(true);
    try {
      console.log("📡 Fazendo fetch para /api/usuarios...");
      const response = await fetch("/api/usuarios");
      console.log("📡 Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Usuários recebidos da API:", data);

        const outrosUsuarios = data.filter(
          (usuario: Usuario) => usuario.id !== session.user.id
        );
        console.log("👥 Usuários após filtro:", outrosUsuarios);

        setUsuarios(outrosUsuarios);
      } else {
        console.error("❌ Erro na resposta da API:", response.status);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar lista de usuários");
    } finally {
      setCarregandoUsuarios(false);
    }
  };
  const categoriasFiltradas = categorias.filter(
    (cat) => cat.tipo === (formData.tipo === "receita" ? "RECEITA" : "DESPESA")
  );
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    setCarregando(true);
    try {
      // CORREÇÃO: Mapear os valores do frontend para os valores que a API espera
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

      // CORREÇÃO: Determinar o tipoParcelamento baseado nas seleções do usuário
      const determinarTipoParcelamento = () => {
        if (formData.tipoTransacao !== "CARTAO_CREDITO") {
          return null;
        }

        if (formData.recorrente) {
          return formData.tipoRecorrencia === "RECORRENCIA"
            ? "RECORRENTE"
            : "PARCELADO";
        }

        // Se não é recorrente e é cartão crédito, assume à vista
        return "AVISTA";
      };

      const payload = {
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        tipo: formData.tipo.toUpperCase(), // "RECEITA" ou "DESPESA"
        metodoPagamento: mapearMetodoPagamento(formData.tipoTransacao),
        data: date.toISOString(),
        categoriaId: formData.categoria,
        cartaoId:
          formData.tipoTransacao === "CARTAO_CREDITO"
            ? formData.cartaoId
            : null,
        observacoes: formData.observacoes,
        // CORREÇÃO: Campos de recorrência/parcelamento para cartão crédito
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
        // Campos de compartilhamento
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
        // Campos específicos do cartão
        dataVencimento:
          formData.tipoTransacao === "CARTAO_CREDITO" && dataVencimento
            ? dataVencimento.toISOString()
            : null,
      };

      console.log("📤 Payload enviado:", payload);

      const response = await fetch("/api/lancamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Erro da API:", errorData);
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

  // Event Handlers
  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Função para carregar categorias
  const carregarCategorias = async () => {
    if (!session?.user?.id) return;

    setCarregandoCategorias(true);
    try {
      const response = await fetch("/api/categorias");
      if (response.ok) {
        const data = await response.json();
        setCategorias(data);
      }
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      toast.error("Erro ao carregar categorias");
    } finally {
      setCarregandoCategorias(false);
    }
  };

  // Atualize o useEffect para carregar categorias
  useEffect(() => {
    if (status === "authenticated") {
      carregarCategorias();
      carregarCartoes();
    }
  }, [status]);

  // CORREÇÃO: Só carregar usuários quando tiver session E for compartilhado
  useEffect(() => {
    console.log(
      "🔐 useEffect - Status:",
      status,
      "Session:",
      session?.user?.id
    );

    if (
      status === "authenticated" &&
      formData.tipoLancamento === "compartilhado"
    ) {
      console.log("✅ Carregando usuários para compartilhamento");
      carregarUsuarios();
    } else if (formData.tipoLancamento !== "compartilhado") {
      setFormData((prev) => ({
        ...prev,
        usuarioAlvoId: "",
        valorCompartilhado: "",
      }));
    }
  }, [formData.tipoLancamento, status, session]);

  useEffect(() => {
    if (formData.tipoLancamento === "compartilhado") {
      carregarUsuarios();
    } else {
      setFormData((prev) => ({
        ...prev,
        usuarioAlvoId: "",
        valorCompartilhado: "",
      }));
    }
  }, [formData.tipoLancamento]);

  useEffect(() => {
    if (formData.tipoTransacao === "CARTAO_CREDITO" && !dataVencimento) {
      const proximoMes = new Date(date);
      proximoMes.setMonth(proximoMes.getMonth() + 1);
      proximoMes.setDate(10);
      setDataVencimento(proximoMes);
    }
  }, [formData.tipoTransacao, date, dataVencimento]);

  useEffect(() => {
    if (formData.tipoRecorrencia === "RECORRENCIA") {
      setFormData((prev) => ({ ...prev, parcelas: "" }));
    }
  }, [formData.tipoRecorrencia]);

  useEffect(() => {
    if (
      formData.tipoLancamento === "compartilhado" &&
      formData.valor &&
      !formData.valorCompartilhado
    ) {
      const valorTotal = parseFloat(formData.valor);
      if (!isNaN(valorTotal)) {
        setFormData((prev) => ({
          ...prev,
          valorCompartilhado: (valorTotal / 2).toFixed(2),
        }));
      }
    }
  }, [formData.valor, formData.tipoLancamento]);

  // Render Conditions - SOLUÇÃO SIMPLES
  if (status === "loading") {
    return (
      <div className="container mx-auto p-6 mt-20 max-w-2xl">
        <div className="flex items-center justify-center">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 mt-20 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Novo Lançamento</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo e Categoria */}
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
              disabled={!formData.tipo || carregandoCategorias}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    carregandoCategorias
                      ? "Carregando categorias..."
                      : !formData.tipo
                        ? "Selecione o tipo primeiro"
                        : "Selecione a categoria"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {categoriasFiltradas.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.cor || "#3B82F6" }}
                      />
                      {cat.nome}
                    </div>
                  </SelectItem>
                ))}
                {categoriasFiltradas.length === 0 && !carregandoCategorias && (
                  <div className="p-2 text-sm text-muted-foreground">
                    Nenhuma categoria encontrada para{" "}
                    {formData.tipo === "receita" ? "receita" : "despesa"}
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Descrição e Valor */}
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

        {/* Tipo de Transação e Lançamento */}
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
                {TIPOS_TRANSACAO.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
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
                {TIPOS_LANCAMENTO.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Seção de Compartilhamento */}
        {formData.tipoLancamento === "compartilhado" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="usuarioAlvoId">Compartilhar com *</Label>
                <Select
                  value={formData.usuarioAlvoId}
                  onValueChange={(value) =>
                    handleChange("usuarioAlvoId", value)
                  }
                  required
                  disabled={carregandoUsuarios}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        carregandoUsuarios
                          ? "Carregando usuários..."
                          : "Selecione o usuário"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {usuarios.map((usuario) => (
                      <SelectItem key={usuario.id} value={usuario.id}>
                        <div className="flex items-center gap-2">
                          {usuario.image && (
                            <img
                              src={usuario.image}
                              alt={usuario.name}
                              className="w-4 h-4 rounded-full"
                            />
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium">{usuario.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {usuario.email}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Mostrar o usuário selecionado de forma separada */}
                {formData.usuarioAlvoId && usuarioSelecionado && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200 mt-2">
                    {usuarioSelecionado.image && (
                      <img
                        src={usuarioSelecionado.image}
                        alt={usuarioSelecionado.name}
                        className="w-4 h-4 rounded-full"
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-green-800">
                        {usuarioSelecionado.name}
                      </span>
                      <span className="text-xs text-green-600">
                        {usuarioSelecionado.email}
                      </span>
                    </div>
                  </div>
                )}

                {usuarios.length === 0 && !carregandoUsuarios && (
                  <p className="text-xs text-amber-600">
                    Nenhum outro usuário encontrado para compartilhamento.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="valorCompartilhado">
                  Valor a ser compartilhado (R$)
                </Label>
                <Input
                  id="valorCompartilhado"
                  type="number"
                  step="0.01"
                  min="0"
                  max={formData.valor}
                  value={formData.valorCompartilhado}
                  onChange={(e) =>
                    handleChange("valorCompartilhado", e.target.value)
                  }
                  placeholder="0,00"
                />
                <p className="text-xs text-muted-foreground">
                  Este valor será dividido entre você e{" "}
                  {usuarioSelecionado?.name || "o usuário selecionado"}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium">
                💡 Lançamento Compartilhado
              </p>
              <p className="text-xs text-blue-700 mt-1">
                <strong>
                  Você criará um lançamento de R$ {formData.valor || "0,00"}
                </strong>
                .
                <strong>
                  {" "}
                  {usuarioSelecionado?.name || "O usuário selecionado"}
                </strong>{" "}
                receberá uma solicitação para aceitar sua parte de{" "}
                <strong>R$ {formData.valorCompartilhado || "0,00"}</strong>.
                Quando aceito, um novo lançamento será criado na conta dele.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                <strong>Sua parte:</strong> R${" "}
                {(
                  parseFloat(formData.valor || "0") -
                  parseFloat(formData.valorCompartilhado || "0")
                ).toFixed(2)}
              </p>
            </div>
          </div>
        )}

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

        {/* Responsável e Data de Vencimento */}
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
                {RESPONSAVEIS.map((resp) => (
                  <SelectItem key={resp.value} value={resp.value}>
                    {resp.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

        {/* Data e Status de Pagamento */}
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

        {/* Recorrência/Parcelamento */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="recorrente"
              checked={formData.recorrente}
              onCheckedChange={(checked) =>
                handleChange("recorrente", checked === true)
              }
            />
            <Label htmlFor="recorrente" className="font-semibold">
              Lançamento recorrente/parcelado
            </Label>
          </div>

          {formData.recorrente && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor="tipoRecorrencia">Tipo *</Label>
                <Select
                  value={formData.tipoRecorrencia}
                  onValueChange={(value) =>
                    handleChange("tipoRecorrencia", value)
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECORRENCIA">
                      <div className="flex items-center gap-2">
                        <Repeat className="h-4 w-4" />
                        Recorrência
                      </div>
                    </SelectItem>
                    <SelectItem value="PARCELAMENTO">
                      <div className="flex items-center gap-2">
                        <Divide className="h-4 w-4" />
                        Parcelamento
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.tipoRecorrencia === "RECORRENCIA" && (
                <div className="space-y-2">
                  <Label htmlFor="frequencia">Frequência *</Label>
                  <Select
                    value={formData.frequencia}
                    onValueChange={(value) => handleChange("frequencia", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIAS.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.tipoRecorrencia === "PARCELAMENTO" && (
                <div className="space-y-2">
                  <Label htmlFor="parcelas">Número de Parcelas *</Label>
                  <Input
                    id="parcelas"
                    type="number"
                    min="2"
                    max="24"
                    value={formData.parcelas}
                    onChange={(e) => handleChange("parcelas", e.target.value)}
                    placeholder="Ex: 3, 6, 12"
                    required
                  />
                </div>
              )}

              <div className="col-span-full">
                {formData.tipoRecorrencia === "RECORRENCIA" && (
                  <p className="text-xs text-muted-foreground">
                    💡 <strong>Recorrência</strong>: Valor que se repete
                    periodicamente (ex: Spotify, Aluguel)
                  </p>
                )}
                {formData.tipoRecorrencia === "PARCELAMENTO" && (
                  <p className="text-xs text-muted-foreground">
                    💡 <strong>Parcelamento</strong>: Compra única dividida em X
                    meses (ex: TV em 12x)
                  </p>
                )}
              </div>
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

        {/* Observações */}
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

        {/* Actions */}
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
