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
  CreditCard,
  Wallet,
  Repeat,
  Calendar,
  X,
  Sparkles,
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
import { LoadingBarrinhas } from "@/components/ui/loading-barrinhas";

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
  diaFechamento?: number; // ✅ ADICIONAR ESTA PROPRIEDADE
  diaVencimento?: number; // ✅ ADICIONAR TAMBÉM SE PRECISAR
  limite?: number; // ✅ ADICIONAR SE PRECISAR
}

interface Usuario {
  id: string;
  name: string;
  email: string;
  image?: string;
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

  // Filtros
  const [filtros, setFiltros] = useState({
    categoria: "all",
    tipoLancamento: "all",
    tipo: "all",
    status: "all",
    metodoPagamento: "all",
  });

  const [anoSelecionado, setAnoSelecionado] = useState(
    new Date().getFullYear()
  );
  const [mesSelecionado, setMesSelecionado] = useState(
    new Date().getMonth() + 1
  );
  const carregarUsuarios = async () => {
    setCarregandoUsuarios(true);
    try {
      const response = await fetch("/api/usuarios");
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
        console.log("Usuários carregados:", data);
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
      toast.error("Erro ao carregar dados");
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
  // Adicione esta função no seu componente, antes do filtro de lançamentos
  const calcularMesReferenciaLancamento = (
    lancamento: Lancamento
  ): { ano: number; mes: number } => {
    // Se não for cartão de crédito, usar a data normal do lançamento
    if (lancamento.metodoPagamento !== "CREDITO" || !lancamento.cartao) {
      const data = new Date(lancamento.data);
      return {
        ano: data.getFullYear(),
        mes: data.getMonth() + 1,
      };
    }

    // Para cartão de crédito, calcular baseado no dia de fechamento
    const dataLancamento = new Date(lancamento.data);
    const diaLancamento = dataLancamento.getDate();
    const diaFechamento = lancamento.cartao.diaFechamento || 1;

    let ano = dataLancamento.getFullYear();
    let mes = dataLancamento.getMonth() + 1;

    // Se a data do lançamento for depois do dia de fechamento, vai para o próximo mês
    if (diaLancamento > diaFechamento) {
      mes += 1;
      if (mes > 12) {
        mes = 1;
        ano += 1;
      }
    }

    return { ano, mes };
  };
  // Filtrar lançamentos
  const lancamentosFiltrados = lancamentos.filter((lancamento) => {
    // ✅ CORREÇÃO: Usar a lógica do cartão de crédito para determinar o mês
    const { ano, mes } = calcularMesReferenciaLancamento(lancamento);

    // Filtro por mês/ano baseado na lógica do cartão
    if (ano !== anoSelecionado || mes !== mesSelecionado) return false;

    // Filtro por busca
    if (
      searchTerm &&
      !lancamento.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;

    // Filtro por categoria
    if (
      filtros.categoria !== "all" &&
      lancamento.categoria.id !== filtros.categoria
    )
      return false;

    // Filtro por tipo de lançamento (individual/compartilhado)
    if (filtros.tipoLancamento !== "all") {
      const compartilhamento = getStatusCompartilhamento(lancamento);
      if (filtros.tipoLancamento === "individual" && compartilhamento)
        return false;
      if (filtros.tipoLancamento === "compartilhado" && !compartilhamento)
        return false;
    }

    // Filtro por tipo (receita/despesa)
    if (filtros.tipo !== "all" && lancamento.tipo !== filtros.tipo)
      return false;

    // Filtro por status
    if (filtros.status !== "all") {
      if (filtros.status === "pago" && !lancamento.pago) return false;
      if (filtros.status === "pendente" && lancamento.pago) return false;
    }

    // Filtro por método de pagamento
    if (
      filtros.metodoPagamento !== "all" &&
      lancamento.metodoPagamento !== filtros.metodoPagamento
    )
      return false;

    return true;
  });

  // Calcular totais
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
  // Função para corrigir a exibição da data (remover problema de timezone)
  const formatarDataSemTimezone = (dataString: string): string => {
    try {
      // Para datas no formato "YYYY-MM-DD HH:MM:SS" do Supabase
      if (dataString.includes(" ")) {
        const [datePart, timePart] = dataString.split(" ");
        const [year, month, day] = datePart.split("-").map(Number);

        // Criar data sem considerar timezone (usar UTC)
        const data = new Date(Date.UTC(year, month - 1, day));
        return data.toLocaleDateString("pt-BR");
      }

      // Para datas ISO (fallback)
      const data = new Date(dataString);
      return data.toLocaleDateString("pt-BR");
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return new Date(dataString).toLocaleDateString("pt-BR");
    }
  };
  // Função para criar lançamento
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
        toast.success("Lançamento criado com sucesso!");
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
        toast.error(errorData.error || "Erro ao criar lançamento");
      }
    } catch (error) {
      console.error("Erro ao criar lançamento:", error);
      toast.error("Erro ao criar lançamento");
    } finally {
      setEnviando(false);
    }
  };

  // Função para extrair e formatar a data diretamente da string do Supabase
  const formatarDataSupabase = (dataString: string): string => {
    // Formato do Supabase: "2025-11-07 00:00:00"
    if (dataString.includes(" ")) {
      const [datePart] = dataString.split(" ");
      const [year, month, day] = datePart.split("-");
      return `${day}/${month}/${year}`;
    }

    // Se não for o formato esperado, fallback
    return dataString;
  };
  // Função para excluir lançamento
  const handleDelete = async (id: string) => {
    setExcluindo(id);
    const lancamentoParaExcluir = lancamentos.find((lanc) => lanc.id === id);

    try {
      setLancamentos((prev) => prev.filter((lanc) => lanc.id !== id));
      setDialogAberto(null);

      const res = await fetch(`/api/lancamentos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao deletar lançamento");

      toast.success("Lançamento deletado com sucesso!");
    } catch (error) {
      console.error("Erro ao deletar lançamento:", error);
      if (lancamentoParaExcluir) {
        setLancamentos((prev) => [...prev, lancamentoParaExcluir]);
      }
      toast.error("Erro ao deletar lançamento.");
    } finally {
      setExcluindo(null);
    }
  };
  // Função para visualizar lançamento
  const handleVisualizar = async (lancamentoId: string) => {
    try {
      setCarregandoVisualizacao(lancamentoId); // Define qual lançamento está carregando
      console.log("Buscando lançamento:", lancamentoId);

      const response = await fetch(
        `/api/lancamentos/${lancamentoId}/visualizar`
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
        toast.error(errorData.error || "Erro ao carregar dados do lançamento");
      }
    } catch (error) {
      console.error("Erro ao visualizar lançamento:", error);
      toast.error("Erro ao carregar dados do lançamento");
    } finally {
      setCarregandoVisualizacao(null); // Limpa o estado de loading
    }
  };

  // E atualize o useEffect de limpeza:
  useEffect(() => {
    if (!mostrarDialogVisualizar) {
      setLancamentoSelecionado(null);
      setCarregandoVisualizacao(null); // Limpa também aqui
    }
  }, [mostrarDialogVisualizar]);

  // Função para editar lançamento
  const handleEditar = (lancamento: Lancamento) => {
    setLancamentoSelecionado(lancamento);
    // Preencher o formulário com os dados existentes
    setFormData({
      descricao: lancamento.descricao,
      valor: lancamento.valor.toString(),
      tipo: lancamento.tipo.toLowerCase(),
      categoria: lancamento.categoria.id,
      tipoLancamento: lancamento.LancamentoCompartilhado?.length
        ? "compartilhado"
        : "individual",
      tipoTransacao: lancamento.metodoPagamento,
      cartaoId: lancamento.cartao?.id || "",
      responsavel: "Claudenir", // Você precisará ajustar isso conforme seu modelo
      pago: lancamento.pago,
      recorrente: lancamento.recorrente || false,
      tipoRecorrencia:
        lancamento.tipoParcelamento === "RECORRENTE"
          ? "RECORRENCIA"
          : "PARCELAMENTO",
      frequencia: "mensal",
      parcelas: lancamento.parcelasTotal?.toString() || "",
      observacoes: lancamento.observacoes || "",
      usuarioAlvoId:
        lancamento.LancamentoCompartilhado?.[0]?.usuarioAlvo?.id || "",
      valorCompartilhado:
        lancamento.LancamentoCompartilhado?.[0]?.valorCompartilhado?.toString() ||
        "",
      data: new Date(lancamento.data).toISOString().split("T")[0],
      dataFimRecorrencia: lancamento.dataFimRecorrencia
        ? new Date(lancamento.dataFimRecorrencia).toISOString().split("T")[0]
        : "",
    });
    setMostrarDialogEditar(true);
  };

  // Função para atualizar lançamento
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
        // Atualizar a lista de lançamentos
        setLancamentos((prev) =>
          prev.map((lanc) =>
            lanc.id === lancamentoSelecionado.id ? lancamentoAtualizado : lanc
          )
        );
        toast.success("Lançamento atualizado com sucesso!");
        setMostrarDialogEditar(false);
        setLancamentoSelecionado(null);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Erro ao atualizar lançamento");
      }
    } catch (error) {
      console.error("Erro ao atualizar lançamento:", error);
      toast.error("Erro ao atualizar lançamento");
    } finally {
      setEditando(false);
    }
  };
  // Função para alternar status
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
            lanc.id === lancamentoId ? { ...lanc, pago: !atualStatus } : lanc
          )
        );
        toast.success("Status atualizado com sucesso!");
      } else {
        throw new Error("Erro ao atualizar status");
      }
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast.error("Erro ao alterar status");
      carregarDados();
    }
  };
  // Função para formatar data ISO bonitinha
  const formatarDataBonita = (dataString: string): string => {
    // Se for formato ISO: "2025-11-07T00:00:00.000Z"
    if (dataString.includes("T")) {
      const [datePart] = dataString.split("T");
      const [year, month, day] = datePart.split("-");
      return `${day}/${month}/${year}`;
    }

    // Se for formato Supabase antigo: "2025-11-07 00:00:00"
    if (dataString.includes(" ")) {
      const [datePart] = dataString.split(" ");
      const [year, month, day] = datePart.split("-");
      return `${day}/${month}/${year}`;
    }

    // Fallback
    return dataString;
  };

  const LoadingBarrinhasOnda = () => {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center space-y-8">
          {/* Container das barrinhas com efeito de onda */}
          <div className="relative">
            <div className="flex space-x-1 justify-center">
              <div className="w-3 h-12 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full animate-wave [animation-delay:0.0s]" />
              <div className="w-3 h-12 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full animate-wave [animation-delay:0.1s]" />
              <div className="w-3 h-12 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full animate-wave [animation-delay:0.2s]" />
            </div>

            {/* Sombra */}
            <div className="flex space-x-4 justify-center mt-2 opacity-50">
              <div className="w-1 h-1 bg-white rounded-full animate-pulse [animation-delay:0.0s]" />
              <div className="w-1 h-1 bg-white rounded-full animate-pulse [animation-delay:0.1s]" />
              <div className="w-1 h-1 bg-white rounded-full animate-pulse [animation-delay:0.2s]" />
            </div>
          </div>

          {/* Texto */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">FinanceApp</h2>
            <p className="text-gray-400 text-sm">
              Organizando suas finanças...
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading && lancamentos.length === 0) {
    return <LoadingBarrinhas  />;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Lançamentos</h1>
            <p className="text-gray-300">Gerencie suas receitas e despesas</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </Button>

            <Button
              variant={"outline"}
              onClick={() => setIsSheetOpen(true)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <Plus className="w-4 h-4" />
              Novo Lançamento
            </Button>
          </div>
        </div>

        {/* Filtros Expandidos */}
        <AnimatePresence>
          {mostrarFiltros && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Pesquisar - Ocupa toda a largura */}
                    <div className="space-y-2">
                      <Label className="text-gray-300 text-sm">Pesquisar</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Buscar lançamentos por descrição..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 w-full"
                        />
                      </div>
                    </div>

                    {/* Demais filtros em grid abaixo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* Categoria */}
                      <div className="space-y-2">
                        <Label className="text-gray-300 text-sm">
                          Categoria
                        </Label>
                        <Select
                          value={filtros.categoria}
                          onValueChange={(value) =>
                            setFiltros({ ...filtros, categoria: value })
                          }
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Todas" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                            <SelectItem value="all">Todas</SelectItem>
                            {categorias.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: cat.cor }}
                                  />
                                  {cat.nome}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Individual ou Compartilhado */}
                      <div className="space-y-2">
                        <Label className="text-gray-300 text-sm">Tipo</Label>
                        <Select
                          value={filtros.tipoLancamento}
                          onValueChange={(value) =>
                            setFiltros({ ...filtros, tipoLancamento: value })
                          }
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="individual">
                              Individual
                            </SelectItem>
                            <SelectItem value="compartilhado">
                              Compartilhado
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Receita ou Despesa */}
                      <div className="space-y-2">
                        <Label className="text-gray-300 text-sm">
                          Receita/Despesa
                        </Label>
                        <Select
                          value={filtros.tipo}
                          onValueChange={(value) =>
                            setFiltros({ ...filtros, tipo: value })
                          }
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="RECEITA">Receita</SelectItem>
                            <SelectItem value="DESPESA">Despesa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status */}
                      <div className="space-y-2">
                        <Label className="text-gray-300 text-sm">Status</Label>
                        <Select
                          value={filtros.status}
                          onValueChange={(value) =>
                            setFiltros({ ...filtros, status: value })
                          }
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="pago">Pago/Recebido</SelectItem>
                            <SelectItem value="pendente">Pendente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Método de Pagamento */}
                      <div className="space-y-2">
                        <Label className="text-gray-300 text-sm">
                          Pagamento
                        </Label>
                        <Select
                          value={filtros.metodoPagamento}
                          onValueChange={(value) =>
                            setFiltros({ ...filtros, metodoPagamento: value })
                          }
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="PIX">PIX</SelectItem>
                            <SelectItem value="CREDITO">
                              Cartão Crédito
                            </SelectItem>
                            <SelectItem value="DEBITO">
                              Cartão Débito
                            </SelectItem>
                            <SelectItem value="TRANSFERENCIA">
                              Transferência
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Seletor de Mês */}
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="space-y-3">
                <Label className="text-gray-300 text-sm">Período</Label>
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
                    className="hover:bg-gray-800 text-gray-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex-1 text-center">
                    <p className="text-white font-medium">
                      {new Date(anoSelecionado, mesSelecionado - 1)
                        .toLocaleDateString("pt-BR", {
                          month: "long",
                          year: "numeric",
                        })
                        .replace(/^\w/, (c) => c.toUpperCase())}
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
                    className="hover:bg-gray-800 text-gray-300"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receita */}
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Receita</p>
                  <p className="text-2xl font-bold text-green-400">
                    R$ {totalReceitas.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Falta receber: R${" "}
                    {(totalReceitas - receitasPagas).toFixed(2)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Despesa */}
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Despesa</p>
                  <p className="text-2xl font-bold text-red-400">
                    R$ {totalDespesas.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Falta pagar: R$ {(totalDespesas - despesasPagas).toFixed(2)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Saldo */}
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Saldo</p>
                  <p
                    className={`text-2xl font-bold ${saldo >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    R$ {saldo.toFixed(2)}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${saldo >= 0 ? "bg-green-600" : "bg-red-600"}`}
                >
                  {saldo >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-white" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Lançamentos */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Lançamentos</CardTitle>
            <CardDescription className="text-gray-400">
              {lancamentosFiltrados.length} lançamentos encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800 border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">
                      Tipo
                    </th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">
                      Categoria
                    </th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">
                      Descrição
                    </th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">
                      Valor
                    </th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lancamentosFiltrados.map((lancamento) => {
                    const compartilhamento =
                      getStatusCompartilhamento(lancamento);

                    return (
                      <tr
                        key={lancamento.id}
                        className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                      >
                        {/* Tipo */}
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={
                              lancamento.tipo === "RECEITA"
                                ? "bg-green-900/50 text-green-400 border-green-700"
                                : "bg-red-900/50 text-red-400 border-red-700"
                            }
                          >
                            {lancamento.tipo === "RECEITA"
                              ? "Receita"
                              : "Despesa"}
                          </Badge>
                        </td>

                        {/* Categoria */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{
                                backgroundColor: lancamento.categoria.cor,
                              }}
                            >
                              {(() => {
                                // Tenta carregar o ícone da categoria
                                try {
                                  const IconComponent =
                                    require("lucide-react")[
                                      lancamento.categoria.icone || "Tag"
                                    ];
                                  return (
                                    <IconComponent className="w-4 h-4 text-white" />
                                  );
                                } catch {
                                  // Fallback para um ícone padrão se o ícone não existir
                                  return <Tag className="w-4 h-4 text-white" />;
                                }
                              })()}
                            </div>
                            <span className="text-white">
                              {lancamento.categoria.nome}
                            </span>
                          </div>
                        </td>

                        {/* Descrição */}
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-white font-medium">
                              {lancamento.descricao}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400">
                                {formatarDataBonita(lancamento.data)}
                              </span>
                              {compartilhamento && (
                                <div className="group relative">
                                  <Users className="h-3 w-3 text-blue-400" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    Lançamento compartilhado
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* Valor */}
                        <td className="py-3 px-4">
                          <span
                            className={`font-semibold ${
                              lancamento.tipo === "RECEITA"
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            R$ {lancamento.valor.toFixed(2)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <Button
                            variant={lancamento.pago ? "default" : "outline"}
                            size="sm"
                            onClick={() =>
                              toggleStatus(lancamento.id, lancamento.pago)
                            }
                            className={
                              lancamento.pago
                                ? "bg-green-600 hover:bg-green-700"
                                : "border-gray-600 text-gray-300 hover:bg-gray-800"
                            }
                          >
                            {lancamento.pago ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                {lancamento.tipo === "RECEITA"
                                  ? "Recebido"
                                  : "Pago"}
                              </>
                            ) : (
                              <>
                                <Clock className="w-4 h-4 mr-1" />
                                {lancamento.tipo === "RECEITA"
                                  ? "A receber"
                                  : "A pagar"}
                              </>
                            )}
                          </Button>
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
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
                                    } // Desabilita apenas este
                                    className="text-gray-400 hover:text-blue-400 hover:bg-gray-800"
                                  >
                                    {carregandoVisualizacao ===
                                    lancamento.id ? (
                                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-800 text-white border-gray-700">
                                  <p>Visualizar dados</p>
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
                                    className="text-gray-400 hover:text-yellow-400 hover:bg-gray-800"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-800 text-white border-gray-700">
                                  <p>Editar</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Dialog
                                    open={dialogAberto === lancamento.id}
                                    onOpenChange={(open) =>
                                      setDialogAberto(
                                        open ? lancamento.id : null
                                      )
                                    }
                                  >
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-400 hover:text-red-400 hover:bg-gray-800"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-gray-900 border-gray-800 text-white">
                                      <DialogHeader>
                                        <DialogTitle className="text-white">
                                          Excluir Lançamento
                                        </DialogTitle>
                                        <DialogDescription className="text-gray-400">
                                          Tem certeza que deseja excluir este
                                          lançamento? Esta ação não pode ser
                                          desfeita.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="flex gap-3 justify-end">
                                        <Button
                                          variant="outline"
                                          onClick={() => setDialogAberto(null)}
                                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                                        >
                                          Cancelar
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          onClick={() =>
                                            handleDelete(lancamento.id)
                                          }
                                          disabled={excluindo === lancamento.id}
                                        >
                                          {excluindo === lancamento.id
                                            ? "Excluindo..."
                                            : "Confirmar"}
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-800 text-white border-gray-700">
                                  <p>Excluir</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {lancamentosFiltrados.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>Nenhum lançamento encontrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sheet para Novo Lançamento */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="bg-gray-900 border-gray-800 text-white sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="text-white">Novo Lançamento</SheetTitle>
              <SheetDescription className="text-gray-400">
                Adicione uma nova receita ou despesa
              </SheetDescription>
            </SheetHeader>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 mt-6 max-h-[80vh] overflow-y-auto"
            >
              {/* Tipo e Categoria */}
              <div className="grid grid-cols-2 gap-4">
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
                      <SelectValue
                        placeholder={
                          !formData.tipo
                            ? "Selecione o tipo primeiro"
                            : "Selecione a categoria"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias
                        .filter(
                          (cat) =>
                            cat.tipo ===
                            (formData.tipo === "receita"
                              ? "RECEITA"
                              : "DESPESA")
                        )
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: cat.cor }}
                              />
                              {cat.nome}
                            </div>
                          </SelectItem>
                        ))}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipoTransacao">Tipo de Transação *</Label>
                  <Select
                    value={formData.tipoTransacao}
                    onValueChange={(value) =>
                      handleChange("tipoTransacao", value)
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="CARTAO_DEBITO">
                        Cartão Débito
                      </SelectItem>
                      <SelectItem value="CARTAO_CREDITO">
                        Cartão Crédito
                      </SelectItem>
                      <SelectItem value="TRANSFERENCIA">
                        Transferência
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipoLancamento">Tipo de Lançamento *</Label>
                  <Select
                    value={formData.tipoLancamento}
                    onValueChange={(value) =>
                      handleChange("tipoLancamento", value)
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="compartilhado">
                        Compartilhado
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Seção de Compartilhamento */}
              {formData.tipoLancamento === "compartilhado" && (
                <div className="space-y-4 p-3 rounded-lg border">
                  <div className="grid grid-cols-2 gap-4">
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
                          {carregandoUsuarios ? (
                            <SelectItem value="loading" disabled>
                              Carregando usuários...
                            </SelectItem>
                          ) : usuarios && usuarios.length > 0 ? (
                            usuarios.map((usuario) => (
                              <SelectItem key={usuario.id} value={usuario.id}>
                                <div className="flex items-center gap-2">
                                  {usuario.image && (
                                    <img
                                      src={usuario.image}
                                      alt={usuario.name}
                                      className="w-4 h-4 rounded-full"
                                    />
                                  )}
                                  {usuario.name}
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-users" disabled>
                              Nenhum usuário disponível
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="valorCompartilhado">
                        Valor compartilhado (R$)
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
                    </div>
                  </div>
                </div>
              )}

              {/* Cartão de Crédito */}
              {formData.tipoTransacao === "CARTAO_CREDITO" && (
                <div className="space-y-2">
                  <Label htmlFor="cartaoId">Cartão *</Label>
                  <Select
                    value={formData.cartaoId}
                    onValueChange={(value) => handleChange("cartaoId", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cartão" />
                    </SelectTrigger>
                    <SelectContent>
                      {cartoes.map((cartao) => (
                        <SelectItem key={cartao.id} value={cartao.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cartao.cor }}
                            />
                            {cartao.nome}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Responsável */}
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

              {/* Data */}
              <div className="space-y-2">
                <Label htmlFor="data">Data *</Label>
                <Input
                  type="date"
                  value={formData.data}
                  onChange={(e) => handleChange("data", e.target.value)}
                  required
                />
              </div>

              {/* Recorrência */}
              <div className="space-y-3 border rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recorrente"
                    checked={formData.recorrente}
                    onCheckedChange={(checked) =>
                      handleChange("recorrente", checked === true)
                    }
                  />
                  <Label htmlFor="recorrente" className="font-medium">
                    Lançamento recorrente/parcelado
                  </Label>
                </div>

                {formData.recorrente && (
                  <div className="grid grid-cols-2 gap-4 pl-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipoRecorrencia">Tipo</Label>
                      <Select
                        value={formData.tipoRecorrencia}
                        onValueChange={(value) =>
                          handleChange("tipoRecorrencia", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RECORRENCIA">
                            Recorrência
                          </SelectItem>
                          <SelectItem value="PARCELAMENTO">
                            Parcelamento
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.tipoRecorrencia === "RECORRENCIA" && (
                      <div className="space-y-2">
                        <Label htmlFor="frequencia">Frequência</Label>
                        <Select
                          value={formData.frequencia}
                          onValueChange={(value) =>
                            handleChange("frequencia", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a frequência" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mensal">Mensal</SelectItem>
                            <SelectItem value="trimestral">
                              Trimestral
                            </SelectItem>
                            <SelectItem value="anual">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {formData.tipoRecorrencia === "PARCELAMENTO" && (
                      <div className="space-y-2">
                        <Label htmlFor="parcelas">Número de Parcelas</Label>
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
                        />
                      </div>
                    )}

                    {/* ADICIONE ESTE CAMPO AQUI */}
                    {formData.tipoRecorrencia === "RECORRENCIA" && (
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="dataFimRecorrencia">
                          Data Final da Recorrência *
                        </Label>
                        <Input
                          id="dataFimRecorrencia"
                          type="date"
                          value={formData.dataFimRecorrencia}
                          onChange={(e) =>
                            handleChange("dataFimRecorrencia", e.target.value)
                          }
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Até quando este lançamento se repetirá
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

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

              <Button
                variant={"outline"}
                type="submit"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                disabled={enviando}
              >
                {enviando ? "Criando..." : "Criar Lançamento"}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>
      {/* Dialog para Visualizar Lançamento */}
      <Dialog
        open={mostrarDialogVisualizar}
        onOpenChange={setMostrarDialogVisualizar}
      >
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              Detalhes do Lançamento
            </DialogTitle>
          </DialogHeader>
          {lancamentoSelecionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400 text-sm">Descrição</Label>
                  <p className="text-white font-medium mt-1">
                    {lancamentoSelecionado.descricao}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Valor</Label>
                  <p
                    className={`text-lg font-bold mt-1 ${lancamentoSelecionado.tipo === "RECEITA" ? "text-green-400" : "text-red-400"}`}
                  >
                    R$ {lancamentoSelecionado.valor.toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Tipo</Label>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={
                        lancamentoSelecionado.tipo === "RECEITA"
                          ? "bg-green-900/50 text-green-400 border-green-700"
                          : "bg-red-900/50 text-red-400 border-red-700"
                      }
                    >
                      {lancamentoSelecionado.tipo === "RECEITA"
                        ? "Receita"
                        : "Despesa"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Status</Label>
                  <p
                    className={`mt-1 ${lancamentoSelecionado.pago ? "text-green-400" : "text-yellow-400"}`}
                  >
                    {lancamentoSelecionado.pago ? "Pago/Recebido" : "Pendente"}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Data</Label>
                  <p className="text-white mt-1">
                    {new Date(lancamentoSelecionado.data).toLocaleDateString(
                      "pt-BR"
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">
                    Método de Pagamento
                  </Label>
                  <p className="text-white mt-1">
                    {lancamentoSelecionado.metodoPagamento}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Categoria</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: lancamentoSelecionado.categoria.cor,
                      }}
                    />
                    <p className="text-white">
                      {lancamentoSelecionado.categoria.nome}
                    </p>
                  </div>
                </div>
                {lancamentoSelecionado.cartao && (
                  <div>
                    <Label className="text-gray-400 text-sm">Cartão</Label>
                    <p className="text-white mt-1">
                      {lancamentoSelecionado.cartao.nome}
                    </p>
                  </div>
                )}
              </div>

              {lancamentoSelecionado.observacoes && (
                <div>
                  <Label className="text-gray-400 text-sm">Observações</Label>
                  <p className="text-white bg-gray-800 p-3 rounded-md mt-1">
                    {lancamentoSelecionado.observacoes}
                  </p>
                </div>
              )}

              {lancamentoSelecionado.recorrente && (
                <div className="p-3 border border-gray-700 rounded-lg">
                  <Label className="text-gray-400 text-sm">
                    Informações de Recorrência
                  </Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-gray-400 text-sm">Tipo</p>
                      <p className="text-white mt-1">
                        {lancamentoSelecionado.tipoParcelamento}
                      </p>
                    </div>
                    {lancamentoSelecionado.parcelasTotal && (
                      <div>
                        <p className="text-gray-400 text-sm">Parcelas</p>
                        <p className="text-white mt-1">
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
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Lançamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAtualizar} className="space-y-4">
            {/* Tipo e Categoria */}
            <div className="grid grid-cols-2 gap-4">
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
                    <SelectValue
                      placeholder={
                        !formData.tipo
                          ? "Selecione o tipo primeiro"
                          : "Selecione a categoria"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias
                      .filter(
                        (cat) =>
                          cat.tipo ===
                          (formData.tipo === "receita" ? "RECEITA" : "DESPESA")
                      )
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cat.cor }}
                            />
                            {cat.nome}
                          </div>
                        </SelectItem>
                      ))}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoTransacao">Tipo de Transação *</Label>
                <Select
                  value={formData.tipoTransacao}
                  onValueChange={(value) =>
                    handleChange("tipoTransacao", value)
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="CARTAO_DEBITO">Cartão Débito</SelectItem>
                    <SelectItem value="CARTAO_CREDITO">
                      Cartão Crédito
                    </SelectItem>
                    <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoLancamento">Tipo de Lançamento *</Label>
                <Select
                  value={formData.tipoLancamento}
                  onValueChange={(value) =>
                    handleChange("tipoLancamento", value)
                  }
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

            {/* Seção de Compartilhamento */}
            {formData.tipoLancamento === "compartilhado" && (
              <div className="space-y-4 p-3 rounded-lg border">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="usuarioAlvoId">Compartilhar com *</Label>
                    <Select
                      value={formData.usuarioAlvoId}
                      onValueChange={(value) =>
                        handleChange("usuarioAlvoId", value)
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o usuário" />
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
                              {usuario.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valorCompartilhado">
                      Valor compartilhado (R$)
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
                  </div>
                </div>
              </div>
            )}

            {/* Cartão de Crédito */}
            {formData.tipoTransacao === "CARTAO_CREDITO" && (
              <div className="space-y-2">
                <Label htmlFor="cartaoId">Cartão *</Label>
                <Select
                  value={formData.cartaoId}
                  onValueChange={(value) => handleChange("cartaoId", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cartão" />
                  </SelectTrigger>
                  <SelectContent>
                    {cartoes.map((cartao) => (
                      <SelectItem key={cartao.id} value={cartao.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cartao.cor }}
                          />
                          {cartao.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Responsável */}
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

            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => handleChange("data", e.target.value)}
                required
              />
            </div>

            {/* Recorrência */}
            <div className="space-y-3 border rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recorrente"
                  checked={formData.recorrente}
                  onCheckedChange={(checked) =>
                    handleChange("recorrente", checked === true)
                  }
                />
                <Label htmlFor="recorrente" className="font-medium">
                  Lançamento recorrente/parcelado
                </Label>
              </div>

              {formData.recorrente && (
                <div className="grid grid-cols-2 gap-4 pl-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipoRecorrencia">Tipo</Label>
                    <Select
                      value={formData.tipoRecorrencia}
                      onValueChange={(value) =>
                        handleChange("tipoRecorrencia", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RECORRENCIA">Recorrência</SelectItem>
                        <SelectItem value="PARCELAMENTO">
                          Parcelamento
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.tipoRecorrencia === "RECORRENCIA" && (
                    <div className="space-y-2">
                      <Label htmlFor="frequencia">Frequência</Label>
                      <Select
                        value={formData.frequencia}
                        onValueChange={(value) =>
                          handleChange("frequencia", value)
                        }
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

                  {formData.tipoRecorrencia === "PARCELAMENTO" && (
                    <div className="space-y-2">
                      <Label htmlFor="parcelas">Número de Parcelas</Label>
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
                      />
                    </div>
                  )}

                  {/* ADICIONE ESTE CAMPO AQUI */}
                  {formData.tipoRecorrencia === "RECORRENCIA" && (
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="dataFimRecorrencia">
                        Data Final da Recorrência *
                      </Label>
                      <Input
                        id="dataFimRecorrencia"
                        type="date"
                        value={formData.dataFimRecorrencia}
                        onChange={(e) =>
                          handleChange("dataFimRecorrencia", e.target.value)
                        }
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Até quando este lançamento se repetirá
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

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

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMostrarDialogEditar(false)}
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-white text-gray-900 hover:bg-gray-100"
                disabled={editando}
              >
                {editando ? "Atualizando..." : "Atualizar Lançamento"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
