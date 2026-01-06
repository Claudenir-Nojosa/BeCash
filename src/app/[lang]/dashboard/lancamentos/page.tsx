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
import { Loading } from "@/components/ui/loading-barrinhas";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("lancamentos");
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
      toast.error(t("categorias.mensagens.erroCarregar"));
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
    lancamento: Lancamento
  ): { ano: number; mes: number } => {
    if (lancamento.metodoPagamento !== "CREDITO" || !lancamento.cartao) {
      const data = new Date(lancamento.data);
      return {
        ano: data.getFullYear(),
        mes: data.getMonth() + 1,
      };
    }

    const dataLancamento = new Date(lancamento.data);
    const diaLancamento = dataLancamento.getDate();
    const diaFechamento = lancamento.cartao.diaFechamento || 1;

    let ano = dataLancamento.getFullYear();
    let mes = dataLancamento.getMonth() + 1;

    if (diaLancamento > diaFechamento) {
      mes += 1;
      if (mes > 12) {
        mes = 1;
        ano += 1;
      }
    }

    return { ano, mes };
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
      if (filtros.tipoLancamento === "individual" && compartilhamento)
        return false;
      if (filtros.tipoLancamento === "compartilhado" && !compartilhamento)
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
        toast.success(t("categorias.mensagens.sucessoCriacao"));
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
        toast.error(errorData.error || t("categorias.mensagens.erroCriacao"));
      }
    } catch (error) {
      console.error("Erro ao criar lançamento:", error);
      toast.error(t("categorias.mensagens.erroCriacao"));
    } finally {
      setEnviando(false);
    }
  };

  const formatarDataSupabase = (dataString: string): string => {
    if (dataString.includes(" ")) {
      const [datePart] = dataString.split(" ");
      const [year, month, day] = datePart.split("-");
      return `${day}/${month}/${year}`;
    }
    return dataString;
  };

  const handleDelete = async (id: string) => {
    setExcluindo(id);
    const lancamentoParaExcluir = lancamentos.find((lanc) => lanc.id === id);

    try {
      setLancamentos((prev) => prev.filter((lanc) => lanc.id !== id));
      setDialogAberto(null);

      const res = await fetch(`/api/lancamentos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(t("categorias.mensagens.erroExclusao"));

      toast.success(t("categorias.mensagens.sucessoExclusao"));
    } catch (error) {
      console.error("Erro ao deletar lançamento:", error);
      if (lancamentoParaExcluir) {
        setLancamentos((prev) => [...prev, lancamentoParaExcluir]);
      }
      toast.error(t("categorias.mensagens.erroExclusao"));
    } finally {
      setExcluindo(null);
    }
  };

  const handleVisualizar = async (lancamentoId: string) => {
    try {
      setCarregandoVisualizacao(lancamentoId);
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
        toast.error(errorData.error || t("categorias.mensagens.erroCarregar"));
      }
    } catch (error) {
      console.error("Erro ao visualizar lançamento:", error);
      toast.error(t("categorias.mensagens.erroCarregar"));
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

  const handleEditar = (lancamento: Lancamento) => {
    setLancamentoSelecionado(lancamento);
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
      responsavel: "Claudenir",
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
            lanc.id === lancamentoSelecionado.id ? lancamentoAtualizado : lanc
          )
        );
        toast.success(t("categorias.mensagens.sucessoEdicao"));
        setMostrarDialogEditar(false);
        setLancamentoSelecionado(null);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || t("categorias.mensagens.erroEdicao"));
      }
    } catch (error) {
      console.error("Erro ao atualizar lançamento:", error);
      toast.error(t("categorias.mensagens.erroEdicao"));
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
            lanc.id === lancamentoId ? { ...lanc, pago: !atualStatus } : lanc
          )
        );
        toast.success(t("categorias.mensagens.sucessoStatus"));
      } else {
        throw new Error(t("categorias.mensagens.erroEdicao"));
      }
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast.error(t("categorias.mensagens.erroEdicao"));
      carregarDados();
    }
  };

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
    <div className="min-h-screen p-3 sm:p-4 md:p-6 bg-white dark:bg-transparent">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {t("titulo")}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5">
              {t("subtitulo")}
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <Button
              variant="outline"
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="flex-1 sm:flex-none border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-600 gap-1.5 sm:gap-2 text-xs sm:text-sm"
            >
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="truncate">{t("categorias.icones.filtro")}</span>
            </Button>

            <Button
              variant={"outline"}
              onClick={() => setIsSheetOpen(true)}
              className="flex-1 sm:flex-none border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500 text-xs sm:text-sm"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="truncate">
                {t("categorias.acoes.novoLancamento")}
              </span>
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
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {/* Pesquisar */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                        {t("categorias.icones.busca")}
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                        <Input
                          placeholder={t("categorias.tabela.pesquisar")}
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
                          {t("categorias.filtros.categoria")}
                        </Label>
                        <Select
                          value={filtros.categoria}
                          onValueChange={(value) =>
                            setFiltros({ ...filtros, categoria: value })
                          }
                        >
                          <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm h-9 sm:h-10">
                            <SelectValue
                              placeholder={t("categorias.filtros.todos")}
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm">
                            <SelectItem value="all">
                              {t("categorias.filtros.todos")}
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
                          {t("categorias.filtros.tipoLancamento")}
                        </Label>
                        <Select
                          value={filtros.tipoLancamento}
                          onValueChange={(value) =>
                            setFiltros({ ...filtros, tipoLancamento: value })
                          }
                        >
                          <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm h-9 sm:h-10">
                            <SelectValue
                              placeholder={t("categorias.filtros.todos")}
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm">
                            <SelectItem value="all">
                              {t("categorias.filtros.todos")}
                            </SelectItem>
                            <SelectItem value="individual">
                              {t("categorias.filtros.individual")}
                            </SelectItem>
                            <SelectItem value="compartilhado">
                              {t("categorias.filtros.compartilhado")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Receita ou Despesa */}
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                          {t("categorias.filtros.tipo")}
                        </Label>
                        <Select
                          value={filtros.tipo}
                          onValueChange={(value) =>
                            setFiltros({ ...filtros, tipo: value })
                          }
                        >
                          <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm h-9 sm:h-10">
                            <SelectValue
                              placeholder={t("categorias.filtros.todos")}
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm">
                            <SelectItem value="all">
                              {t("categorias.filtros.todos")}
                            </SelectItem>
                            <SelectItem value="RECEITA">
                              {t("categorias.filtros.receita")}
                            </SelectItem>
                            <SelectItem value="DESPESA">
                              {t("categorias.filtros.despesa")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status */}
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                          {t("categorias.filtros.status")}
                        </Label>
                        <Select
                          value={filtros.status}
                          onValueChange={(value) =>
                            setFiltros({ ...filtros, status: value })
                          }
                        >
                          <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm h-9 sm:h-10">
                            <SelectValue
                              placeholder={t("categorias.filtros.todos")}
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm">
                            <SelectItem value="all">
                              {t("categorias.filtros.todos")}
                            </SelectItem>
                            <SelectItem value="pago">
                              {t("categorias.filtros.pago")}
                            </SelectItem>
                            <SelectItem value="pendente">
                              {t("categorias.filtros.pendente")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Método de Pagamento */}
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                          {t("categorias.filtros.metodoPagamento")}
                        </Label>
                        <Select
                          value={filtros.metodoPagamento}
                          onValueChange={(value) =>
                            setFiltros({ ...filtros, metodoPagamento: value })
                          }
                        >
                          <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm h-9 sm:h-10">
                            <SelectValue
                              placeholder={t("categorias.filtros.todos")}
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm">
                            <SelectItem value="all">
                              {t("categorias.filtros.todos")}
                            </SelectItem>
                            <SelectItem value="PIX">
                              {t(
                                "categorias.formulario.opcoesMetodoPagamento.pix"
                              )}
                            </SelectItem>
                            <SelectItem value="CREDITO">
                              {t(
                                "categorias.formulario.opcoesMetodoPagamento.credito"
                              )}
                            </SelectItem>
                            <SelectItem value="DEBITO">
                              {t(
                                "categorias.formulario.opcoesMetodoPagamento.debito"
                              )}
                            </SelectItem>
                            <SelectItem value="TRANSFERENCIA">
                              {t(
                                "categorias.formulario.opcoesMetodoPagamento.transferencia"
                              )}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Seletor de Mês */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-2 sm:space-y-3">
                <Label className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                  {t("categorias.tabela.mesAno")}
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
                      {t(`categorias.meses.${mesSelecionado}` as any)}{" "}
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
                    {t("categorias.estatisticas.receitas")}
                  </p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 dark:text-green-400">
                    R$ {totalReceitas.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Falta receber: R${" "}
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
                    {t("categorias.estatisticas.despesas")}
                  </p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">
                    R$ {totalDespesas.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Falta pagar: R$ {(totalDespesas - despesasPagas).toFixed(2)}
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
                    {t("categorias.estatisticas.saldo")}
                  </p>
                  <p
                    className={`text-lg sm:text-xl md:text-2xl font-bold ${saldo >= 0 ? "text-emerald-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    R$ {saldo.toFixed(2)}
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
        </div>

        {/* Tabela de Lançamentos */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900 dark:text-white text-base sm:text-lg">
              {t("titulo")}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
              {lancamentosFiltrados.length}{" "}
              {t("categorias.tabela.nenhumLancamento").replace("nenhum ", "")}
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
                        {t("categorias.tabela.tipo")}
                      </th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm">
                        {t("categorias.tabela.categoria")}
                      </th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm">
                        {t("categorias.tabela.descricao")}
                      </th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm">
                        {t("categorias.tabela.valor")}
                      </th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm">
                        {t("categorias.tabela.status")}
                      </th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm">
                        {t("categorias.tabela.acoes")}
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
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          {/* Tipo */}
                          <td className="py-3 px-4">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                lancamento.tipo === "RECEITA"
                                  ? "bg-emerald-100 dark:bg-green-900/50 text-emerald-700 dark:text-green-400 border-emerald-200 dark:border-green-700"
                                  : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700"
                              }`}
                            >
                              {lancamento.tipo === "RECEITA"
                                ? t("categorias.filtros.receita")
                                : t("categorias.filtros.despesa")}
                            </Badge>
                          </td>

                          {/* Categoria */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 sm:gap-2">
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
                            </div>
                          </td>

                          {/* Descrição */}
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-gray-900 dark:text-white font-medium text-xs sm:text-sm truncate max-w-[200px]">
                                {lancamento.descricao}
                              </p>
                              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatarDataBonita(lancamento.data)}
                                </span>
                                {compartilhamento && (
                                  <div className="group relative">
                                    <Users className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                      {t("categorias.status.compartilhado")}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          {/* Valor */}
                          <td className="py-3 px-4">
                            <span
                              className={`font-semibold text-xs sm:text-sm ${
                                lancamento.tipo === "RECEITA"
                                  ? "text-emerald-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
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
                                      ? t("categorias.status.pago")
                                      : t("categorias.status.pago")}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                  <span className="hidden sm:inline">
                                    {lancamento.tipo === "RECEITA"
                                      ? t("categorias.status.pendente")
                                      : t("categorias.status.pendente")}
                                  </span>
                                </>
                              )}
                            </Button>
                          </td>

                          {/* Ações */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 sm:gap-2">
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
                                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 h-7 w-7 sm:h-8 sm:w-8"
                                    >
                                      {carregandoVisualizacao ===
                                      lancamento.id ? (
                                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-gray-800 dark:bg-gray-700 text-white border-gray-700 dark:border-gray-600 text-xs">
                                    <p>{t("categorias.icones.visualizar")}</p>
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
                                      className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-yellow-400 hover:bg-amber-50 dark:hover:bg-yellow-900/30 h-7 w-7 sm:h-8 sm:w-8"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-gray-800 dark:bg-gray-700 text-white border-gray-700 dark:border-gray-600 text-xs">
                                    <p>{t("categorias.icones.editar")}</p>
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
                                          className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 h-7 w-7 sm:h-8 sm:w-8"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white w-[90vw] sm:max-w-md">
                                        <DialogHeader>
                                          <DialogTitle className="text-gray-900 dark:text-white text-lg">
                                            {t("categorias.acoes.excluir")}{" "}
                                            {t("titulo").slice(0, -1)}
                                          </DialogTitle>
                                          <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
                                            {t(
                                              "categorias.mensagens.confirmacaoExclusao"
                                            )}
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
                                          <Button
                                            variant="outline"
                                            onClick={() =>
                                              setDialogAberto(null)
                                            }
                                            className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                                          >
                                            {t("categorias.acoes.cancelar")}
                                          </Button>
                                          <Button
                                            variant="destructive"
                                            onClick={() =>
                                              handleDelete(lancamento.id)
                                            }
                                            disabled={
                                              excluindo === lancamento.id
                                            }
                                            className="text-sm"
                                          >
                                            {excluindo === lancamento.id
                                              ? t(
                                                  "categorias.mensagens.carregando"
                                                )
                                              : t("categorias.acoes.confirmar")}
                                          </Button>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-gray-800 dark:bg-gray-700 text-white border-gray-700 dark:border-gray-600 text-xs">
                                    <p>{t("categorias.icones.excluir")}</p>
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
                        className="p-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
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
                                  ? t("categorias.filtros.receita")
                                  : t("categorias.filtros.despesa")}
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
                                      ? t("categorias.status.pago")
                                      : t("categorias.status.pago")}
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 mr-1" />
                                    {lancamento.tipo === "RECEITA"
                                      ? t("categorias.status.pendente")
                                      : t("categorias.status.pendente")}
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
                                  <p>{t("categorias.icones.visualizar")}</p>
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
                                  <p>{t("categorias.icones.editar")}</p>
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
                                {t("categorias.icones.excluir")}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white w-[90vw] sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle className="text-gray-900 dark:text-white text-lg">
                                  {t("categorias.acoes.excluir")}{" "}
                                  {t("titulo").slice(0, -1)}
                                </DialogTitle>
                                <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
                                  {t(
                                    "categorias.mensagens.confirmacaoExclusao"
                                  )}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => setDialogAberto(null)}
                                  className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                                >
                                  {t("categorias.acoes.cancelar")}
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDelete(lancamento.id)}
                                  disabled={excluindo === lancamento.id}
                                  className="text-sm"
                                >
                                  {excluindo === lancamento.id
                                    ? t("categorias.mensagens.carregando")
                                    : t("categorias.acoes.confirmar")}
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
                    {t("categorias.tabela.nenhumLancamento")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sheet para Novo Lançamento */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4 sm:mb-6">
            <SheetTitle className="text-gray-900 dark:text-white text-lg sm:text-xl">
              {t("categorias.formulario.tituloNovo")}
            </SheetTitle>
            <SheetDescription className="text-gray-600 dark:text-gray-400 text-sm">
              {t("subtitulo")}
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
                  {t("categorias.formulario.tipo")} *
                </Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => handleChange("tipo", value)}
                  required
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue
                      placeholder={t("categorias.formulario.selecione")}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                    <SelectItem value="receita">
                      {t("categorias.filtros.receita")}
                    </SelectItem>
                    <SelectItem value="despesa">
                      {t("categorias.filtros.despesa")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="categoria"
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  {t("categorias.formulario.categoria")} *
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
                          ? t("categorias.formulario.selecione")
                          : t("categorias.formulario.selecione")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                    {categorias
                      .filter(
                        (cat) =>
                          cat.tipo ===
                          (formData.tipo === "receita" ? "RECEITA" : "DESPESA")
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
                {t("categorias.formulario.descricao")} *
              </Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
                placeholder={t("categorias.formulario.placeholderDescricao")}
                required
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-sm"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label
                htmlFor="valor"
                className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
              >
                {t("categorias.formulario.valor")} *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                  R$
                </span>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={(e) => handleChange("valor", e.target.value)}
                  placeholder={t("categorias.formulario.placeholderValor")}
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
                  {t("categorias.formulario.metodoPagamento")} *
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
                      placeholder={t("categorias.formulario.selecione")}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                    <SelectItem value="DINHEIRO">
                      {t(
                        "categorias.formulario.opcoesMetodoPagamento.dinheiro"
                      )}
                    </SelectItem>
                    <SelectItem value="PIX">
                      {t("categorias.formulario.opcoesMetodoPagamento.pix")}
                    </SelectItem>
                    <SelectItem value="CARTAO_DEBITO">
                      {t("categorias.formulario.opcoesMetodoPagamento.debito")}
                    </SelectItem>
                    <SelectItem value="CARTAO_CREDITO">
                      {t("categorias.formulario.opcoesMetodoPagamento.credito")}
                    </SelectItem>
                    <SelectItem value="TRANSFERENCIA">
                      {t(
                        "categorias.formulario.opcoesMetodoPagamento.transferencia"
                      )}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="tipoLancamento"
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  {t("categorias.formulario.tipoLancamento")} *
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
                      placeholder={t("categorias.formulario.selecione")}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                    <SelectItem value="individual">
                      {t("categorias.filtros.individual")}
                    </SelectItem>
                    <SelectItem value="compartilhado">
                      {t("categorias.filtros.compartilhado")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Seção de Compartilhamento */}
            {formData.tipoLancamento === "compartilhado" && (
              <div className="space-y-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label
                      htmlFor="usuarioAlvoId"
                      className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                    >
                      {t("categorias.formulario.usuarioAlvo")} *
                    </Label>
                    <Select
                      value={formData.usuarioAlvoId}
                      onValueChange={(value) =>
                        handleChange("usuarioAlvoId", value)
                      }
                      required
                      disabled={carregandoUsuarios}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs sm:text-sm h-9 sm:h-10">
                        <SelectValue
                          placeholder={
                            carregandoUsuarios
                              ? t("categorias.mensagens.carregando")
                              : t("categorias.formulario.selecioneUsuario")
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                        {carregandoUsuarios ? (
                          <SelectItem value="loading" disabled>
                            {t("categorias.mensagens.carregando")}
                          </SelectItem>
                        ) : usuarios && usuarios.length > 0 ? (
                          usuarios.map((usuario) => (
                            <SelectItem key={usuario.id} value={usuario.id}>
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                {usuario.image && (
                                  <img
                                    src={usuario.image}
                                    alt={usuario.name}
                                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full"
                                  />
                                )}
                                <span className="truncate">{usuario.name}</span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-users" disabled>
                            {t("categorias.mensagens.semDados")}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label
                      htmlFor="valorCompartilhado"
                      className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                    >
                      {t("categorias.formulario.valorCompartilhado")} (R$)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                        R$
                      </span>
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
                        placeholder={t(
                          "categorias.formulario.placeholderValor"
                        )}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-sm pl-9"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cartão de Crédito */}
            {formData.tipoTransacao === "CARTAO_CREDITO" && (
              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="cartaoId"
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  {t("categorias.formulario.cartao")} *
                </Label>
                <Select
                  value={formData.cartaoId}
                  onValueChange={(value) => handleChange("cartaoId", value)}
                  required
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue
                      placeholder={t("categorias.formulario.selecioneCartao")}
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
                {t("categorias.formulario.data")} *
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
                  {t("categorias.formulario.recorrente")}
                </Label>
              </div>

              {formData.recorrente && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pl-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label
                      htmlFor="tipoRecorrencia"
                      className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                    >
                      {t("categorias.formulario.tipoRecorrencia")}
                    </Label>
                    <Select
                      value={formData.tipoRecorrencia}
                      onValueChange={(value) =>
                        handleChange("tipoRecorrencia", value)
                      }
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs sm:text-sm h-9 sm:h-10">
                        <SelectValue
                          placeholder={t("categorias.formulario.selecione")}
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                        <SelectItem value="RECORRENCIA">
                          {t(
                            "categorias.formulario.opcoesTipoRecorrencia.recorrencia"
                          )}
                        </SelectItem>
                        <SelectItem value="PARCELAMENTO">
                          {t(
                            "categorias.formulario.opcoesTipoRecorrencia.parcelamento"
                          )}
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
                        {t("categorias.formulario.frequencia")}
                      </Label>
                      <Select
                        value={formData.frequencia}
                        onValueChange={(value) =>
                          handleChange("frequencia", value)
                        }
                      >
                        <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs sm:text-sm h-9 sm:h-10">
                          <SelectValue
                            placeholder={t("categorias.formulario.selecione")}
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                          <SelectItem value="mensal">
                            {t("categorias.formulario.opcoesFrequencia.mensal")}
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
                        {t("categorias.formulario.parcelas")}
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
                        {t("categorias.formulario.dataFimRecorrencia")} *
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
                        {t("categorias.detalhes.dataFimRecorrencia")}
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
                {t("categorias.formulario.observacoes")}
              </Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange("observacoes", e.target.value)}
                placeholder={t("categorias.formulario.placeholderObservacoes")}
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
                ? t("categorias.mensagens.carregando")
                : t("categorias.acoes.salvar")}
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
              {t("categorias.detalhes.titulo")}
            </DialogTitle>
          </DialogHeader>
          {lancamentoSelecionado && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    {t("categorias.detalhes.descricao")}
                  </Label>
                  <p className="text-gray-900 dark:text-white font-medium mt-1 text-sm sm:text-base">
                    {lancamentoSelecionado.descricao}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    {t("categorias.detalhes.valorTotal")}
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
                    {t("categorias.detalhes.tipo")}
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
                        ? t("categorias.filtros.receita")
                        : t("categorias.filtros.despesa")}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    {t("categorias.detalhes.status")}
                  </Label>
                  <p
                    className={`mt-1 text-sm ${
                      lancamentoSelecionado.pago
                        ? "text-emerald-600 dark:text-green-400"
                        : "text-amber-600 dark:text-yellow-400"
                    }`}
                  >
                    {lancamentoSelecionado.pago
                      ? t("categorias.status.pago")
                      : t("categorias.status.pendente")}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    {t("categorias.detalhes.data")}
                  </Label>
                  <p className="text-gray-900 dark:text-white mt-1 text-sm">
                    {new Date(lancamentoSelecionado.data).toLocaleDateString(
                      "pt-BR"
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    {t("categorias.detalhes.metodoPagamento")}
                  </Label>
                  <p className="text-gray-900 dark:text-white mt-1 text-sm">
                    {lancamentoSelecionado.metodoPagamento}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    {t("categorias.detalhes.categoria")}
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
                      {t("categorias.detalhes.cartao")}
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
                    {t("categorias.detalhes.observacoes")}
                  </Label>
                  <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-md mt-1 text-sm">
                    {lancamentoSelecionado.observacoes}
                  </p>
                </div>
              )}

              {lancamentoSelecionado.recorrente && (
                <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/30">
                  <Label className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    {t("categorias.detalhes.recorrente")}
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-2">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                        {t("categorias.detalhes.parcelamento")}
                      </p>
                      <p className="text-gray-900 dark:text-white mt-1 text-sm">
                        {lancamentoSelecionado.tipoParcelamento}
                      </p>
                    </div>
                    {lancamentoSelecionado.parcelasTotal && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                          {t("categorias.detalhes.parcelasTotal")}
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
              {t("categorias.formulario.tituloEditar")}
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
                  {t("categorias.formulario.tipo")} *
                </Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => handleChange("tipo", value)}
                  required
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue
                      placeholder={t("categorias.formulario.selecione")}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                    <SelectItem value="receita">
                      {t("categorias.filtros.receita")}
                    </SelectItem>
                    <SelectItem value="despesa">
                      {t("categorias.filtros.despesa")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="categoria"
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  {t("categorias.formulario.categoria")} *
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
                          ? t("categorias.formulario.selecione")
                          : t("categorias.formulario.selecione")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                    {categorias
                      .filter(
                        (cat) =>
                          cat.tipo ===
                          (formData.tipo === "receita" ? "RECEITA" : "DESPESA")
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
                {t("categorias.formulario.descricao")} *
              </Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
                placeholder={t("categorias.formulario.placeholderDescricao")}
                required
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-sm"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label
                htmlFor="valor"
                className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
              >
                {t("categorias.formulario.valor")} *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                  R$
                </span>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={(e) => handleChange("valor", e.target.value)}
                  placeholder={t("categorias.formulario.placeholderValor")}
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
                  {t("categorias.formulario.metodoPagamento")} *
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
                      placeholder={t("categorias.formulario.selecione")}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                    <SelectItem value="DINHEIRO">
                      {t(
                        "categorias.formulario.opcoesMetodoPagamento.dinheiro"
                      )}
                    </SelectItem>
                    <SelectItem value="PIX">
                      {t("categorias.formulario.opcoesMetodoPagamento.pix")}
                    </SelectItem>
                    <SelectItem value="CARTAO_DEBITO">
                      {t("categorias.formulario.opcoesMetodoPagamento.debito")}
                    </SelectItem>
                    <SelectItem value="CARTAO_CREDITO">
                      {t("categorias.formulario.opcoesMetodoPagamento.credito")}
                    </SelectItem>
                    <SelectItem value="TRANSFERENCIA">
                      {t(
                        "categorias.formulario.opcoesMetodoPagamento.transferencia"
                      )}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="tipoLancamento"
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  {t("categorias.formulario.tipoLancamento")} *
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
                      placeholder={t("categorias.formulario.selecione")}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                    <SelectItem value="individual">
                      {t("categorias.filtros.individual")}
                    </SelectItem>
                    <SelectItem value="compartilhado">
                      {t("categorias.filtros.compartilhado")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Seção de Compartilhamento */}
            {formData.tipoLancamento === "compartilhado" && (
              <div className="space-y-4 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="usuarioAlvoId"
                      className="text-gray-700 dark:text-gray-300 text-sm sm:text-base"
                    >
                      {t("categorias.formulario.usuarioAlvo")} *
                    </Label>
                    <Select
                      value={formData.usuarioAlvoId}
                      onValueChange={(value) =>
                        handleChange("usuarioAlvoId", value)
                      }
                      required
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 w-full">
                        <SelectValue
                          placeholder={t(
                            "categorias.formulario.selecioneUsuario"
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 max-h-60">
                        {usuarios.map((usuario) => (
                          <SelectItem
                            key={usuario.id}
                            value={usuario.id}
                            className="truncate"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {usuario.image && (
                                <img
                                  src={usuario.image}
                                  alt={usuario.name}
                                  className="w-4 h-4 rounded-full flex-shrink-0"
                                />
                              )}
                              <span className="truncate">{usuario.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="valorCompartilhado"
                      className="text-gray-700 dark:text-gray-300 text-sm sm:text-base"
                    >
                      {t("categorias.formulario.valorCompartilhado")} (R$)
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
                      placeholder={t("categorias.formulario.placeholderValor")}
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 w-full"
                    />
                  </div>
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
                  {t("categorias.formulario.cartao")} *
                </Label>
                <Select
                  value={formData.cartaoId}
                  onValueChange={(value) => handleChange("cartaoId", value)}
                  required
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 w-full">
                    <SelectValue
                      placeholder={t("categorias.formulario.selecioneCartao")}
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
                {t("categorias.formulario.data")} *
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
                  {t("categorias.formulario.recorrente")}
                </Label>
              </div>

              {formData.recorrente && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-0 sm:pl-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="tipoRecorrencia"
                      className="text-gray-700 dark:text-gray-300 text-sm sm:text-base"
                    >
                      {t("categorias.formulario.tipoRecorrencia")}
                    </Label>
                    <Select
                      value={formData.tipoRecorrencia}
                      onValueChange={(value) =>
                        handleChange("tipoRecorrencia", value)
                      }
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 w-full">
                        <SelectValue
                          placeholder={t("categorias.formulario.selecione")}
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectItem value="RECORRENCIA">
                          {t(
                            "categorias.formulario.opcoesTipoRecorrencia.recorrencia"
                          )}
                        </SelectItem>
                        <SelectItem value="PARCELAMENTO">
                          {t(
                            "categorias.formulario.opcoesTipoRecorrencia.parcelamento"
                          )}
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
                        {t("categorias.formulario.frequencia")}
                      </Label>
                      <Select
                        value={formData.frequencia}
                        onValueChange={(value) =>
                          handleChange("frequencia", value)
                        }
                      >
                        <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 w-full">
                          <SelectValue
                            placeholder={t("categorias.formulario.selecione")}
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          <SelectItem value="mensal">
                            {t("categorias.formulario.opcoesFrequencia.mensal")}
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
                        {t("categorias.formulario.parcelas")}
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
                        {t("categorias.formulario.dataFimRecorrencia")} *
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
                        {t("categorias.detalhes.dataFimRecorrencia")}
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
                {t("categorias.formulario.observacoes")}
              </Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange("observacoes", e.target.value)}
                placeholder={t("categorias.formulario.placeholderObservacoes")}
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
                {t("categorias.acoes.cancelar")}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white w-full sm:w-auto"
                disabled={editando}
              >
                {editando
                  ? t("categorias.mensagens.carregando")
                  : t("categorias.acoes.salvar")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
