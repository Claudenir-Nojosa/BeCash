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
  Edit,
  Trash2,
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
import { Link } from "@radix-ui/react-navigation-menu";
import { Checkbox } from "@/components/ui/checkbox";

interface Categoria {
  id: string;
  nome: string;
  tipo: string;
  cor: string;
}

interface Cartao {
  id: string;
  nome: string;
  bandeira: string;
  cor: string;
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
}

export default function LancamentosPage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [mostrarPrevisoes, setMostrarPrevisoes] = useState(false);
  const [previsoesFuturas, setPrevisoesFuturas] = useState<any[]>([]);
  const [mesPrevisao, setMesPrevisao] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [date, setDate] = useState<Date>(new Date());
  const [dataVencimento, setDataVencimento] = useState<Date | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtros, setFiltros] = useState({
    tipo: "all",
    status: "all",
    metodo: "all",
    compartilhamento: "all",
  });
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
  const getBadgeVariantCompartilhamento = (status: string) => {
    switch (status) {
      case "ACEITO":
        return "default";
      case "PENDENTE":
        return "secondary";
      case "RECUSADO":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getIconCompartilhamento = (status: string) => {
    switch (status) {
      case "ACEITO":
        return <UserCheck className="w-3 h-3" />;
      case "PENDENTE":
        return <Clock className="w-3 h-3" />;
      case "RECUSADO":
        return <UserX className="w-3 h-3" />;
      default:
        return <Users className="w-3 h-3" />;
    }
  };

  const LancamentoCompartilhadoBadge = ({
    lancamento,
  }: {
    lancamento: Lancamento;
  }) => {
    const compartilhamento = getStatusCompartilhamento(lancamento);

    if (!compartilhamento) return null;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={getBadgeVariantCompartilhamento(compartilhamento.status)}
              className="gap-1 cursor-help"
            >
              {getIconCompartilhamento(compartilhamento.status)}
              {compartilhamento.isCriador
                ? "Compartilhado"
                : "Compartilhado comigo"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm space-y-1">
              <div className="font-medium">Lançamento Compartilhado</div>
              <div>Status: {compartilhamento.status}</div>
              <div>
                Valor compartilhado: R${" "}
                {compartilhamento.valorCompartilhado.toFixed(2)}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const AvatarUsuario = ({
    usuario,
    isCriador = false,
  }: {
    usuario?: Usuario;
    isCriador?: boolean;
  }) => {
    if (!usuario) return null;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={usuario.image} />
                <AvatarFallback className="text-xs">
                  {usuario.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isCriador && <Crown className="w-3 h-3 text-yellow-500" />}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{usuario.name}</p>
            <p className="text-muted-foreground text-xs">{usuario.email}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const CardCompartilhamento = ({ lancamento }: { lancamento: Lancamento }) => {
    const compartilhamento = getStatusCompartilhamento(lancamento);

    if (!compartilhamento) return null;

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        className="ml-16 mt-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Split className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">Compartilhado</span>
            </div>

            <div className="flex items-center gap-2">
              <AvatarUsuario
                usuario={compartilhamento.usuarioCriador}
                isCriador
              />
              <span className="text-sm text-muted-foreground">→</span>
              <AvatarUsuario usuario={compartilhamento.usuarioAlvo} />
            </div>

            <Badge
              variant={getBadgeVariantCompartilhamento(compartilhamento.status)}
            >
              {getIconCompartilhamento(compartilhamento.status)}
              {compartilhamento.status}
            </Badge>
          </div>

          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              Valor compartilhado
            </div>
            <div className="font-bold text-blue-700">
              R$ {compartilhamento.valorCompartilhado.toFixed(2)}
            </div>
          </div>
        </div>

        {compartilhamento.status === "PENDENTE" && compartilhamento.isAlvo && (
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="default" className="gap-1">
              <UserCheck className="w-3 h-3" />
              Aceitar
            </Button>
            <Button size="sm" variant="outline" className="gap-1">
              <UserX className="w-3 h-3" />
              Recusar
            </Button>
          </div>
        )}
      </motion.div>
    );
  };

  // Atualize a parte dos filtros no Sheet para incluir o filtro de compartilhamento
  const FiltrosSheet = () => (
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Filtrar Lançamentos</SheetTitle>
        <SheetDescription>
          Aplique filtros para encontrar lançamentos específicos
        </SheetDescription>
      </SheetHeader>
      <div className="space-y-4 mt-6">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            value={filtros.tipo}
            onValueChange={(value) => setFiltros({ ...filtros, tipo: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="RECEITA">Receita</SelectItem>
              <SelectItem value="DESPESA">Despesa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={filtros.status}
            onValueChange={(value) => setFiltros({ ...filtros, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Método de Pagamento</Label>
          <Select
            value={filtros.metodo}
            onValueChange={(value) => setFiltros({ ...filtros, metodo: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="PIX">PIX</SelectItem>
              <SelectItem value="CREDITO">Cartão de Crédito</SelectItem>
              <SelectItem value="DEBITO">Cartão de Débito</SelectItem>
              <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Novo Filtro para Compartilhamento */}
        <div className="space-y-2">
          <Label>Compartilhamento</Label>
          <Select
            value={filtros.compartilhamento}
            onValueChange={(value) =>
              setFiltros({ ...filtros, compartilhamento: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="compartilhados">Compartilhados</SelectItem>
              <SelectItem value="recebidos">Compartilhados comigo</SelectItem>
              <SelectItem value="enviados">Compartilhados por mim</SelectItem>
              <SelectItem value="individuais">Individuais</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </SheetContent>
  );

  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    tipo: "despesa", // mudar para lowercase
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
  useEffect(() => {
    const carregarUsuarios = async () => {
      try {
        const response = await fetch("/api/usuarios");
        if (response.ok) {
          const data = await response.json();
          // Filtrar usuário atual se necessário
          setUsuarios(data);
        }
      } catch (error) {
        console.error("Erro ao carregar usuários:", error);
      }
    };

    if (formData.tipoLancamento === "compartilhado") {
      carregarUsuarios();
    }
  }, [formData.tipoLancamento]);
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarPrevisoes = async () => {
    try {
      const res = await fetch(
        `/api/lancamentos/recorrencias-futuras?mes=${mesPrevisao}`
      );
      if (res.ok) {
        const data = await res.json();
        setPrevisoesFuturas(data);
      }
    } catch (error) {
      console.error("Erro ao carregar previsões:", error);
    }
  };

  useEffect(() => {
    if (mostrarPrevisoes) {
      carregarPrevisoes();
    }
  }, [mostrarPrevisoes, mesPrevisao]);

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
      setLancamentos([]);
      setCategorias([]);
      setCartoes([]);
    } finally {
      setLoading(false);
    }
  };

  const criarTodasRecorrencias = async (recorrenciaId: string) => {
    if (
      !confirm(
        "Deseja criar TODOS os lançamentos futuros desta recorrência de uma vez?"
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/lancamentos/criar-todas-recorrencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recorrenciaId }),
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(result.message);
        carregarDados();
        carregarPrevisoes();
      } else {
        const error = await res.json();
        toast.error(error.error);
      }
    } catch (error) {
      console.error("Erro ao criar recorrências:", error);
      toast.error("Erro ao criar recorrências");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Mapear os valores para o formato que a API espera
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

      // Determinar o tipoParcelamento
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
      };

      const res = await fetch("/api/lancamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Resetar para o estado inicial correto
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
          dataFimRecorrencia: "", // Mude null para string vazia
        });
        carregarDados();
        toast.success("Lançamento criado com sucesso!");
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Erro ao criar lançamento");
      }
    } catch (error) {
      console.error("Erro ao criar lançamento:", error);
      toast.error("Erro ao criar lançamento");
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
        toast.success("Status atualizado com sucesso!");
        carregarDados();
      } else {
        throw new Error("Erro ao atualizar status");
      }
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast.error("Erro ao alterar status");
    }
  };

  const getMetodoPagamentoIcon = (metodo: string) => {
    switch (metodo) {
      case "PIX":
        return <Sparkles className="w-4 h-4" />;
      case "CREDITO":
        return <CreditCard className="w-4 h-4" />;
      case "DEBITO":
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Wallet className="w-4 h-4" />;
    }
  };

  const lancamentosFiltrados = lancamentos.filter((lancamento) => {
    if (
      searchTerm &&
      !lancamento.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    if (filtros.tipo !== "all" && lancamento.tipo !== filtros.tipo)
      return false;
    if (filtros.status !== "all") {
      if (filtros.status === "pago" && !lancamento.pago) return false;
      if (filtros.status === "pendente" && lancamento.pago) return false;
    }
    if (
      filtros.metodo !== "all" &&
      lancamento.metodoPagamento !== filtros.metodo
    )
      return false;
    return true;
  });

  const totalReceitas = lancamentosFiltrados
    .filter((l) => l.tipo === "RECEITA")
    .reduce((sum, l) => sum + l.valor, 0);

  const totalDespesas = lancamentosFiltrados
    .filter((l) => l.tipo === "DESPESA")
    .reduce((sum, l) => sum + l.valor, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando lançamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
              Lançamentos
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie suas receitas e despesas
            </p>
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtrar Lançamentos</SheetTitle>
                  <SheetDescription>
                    Aplique filtros para encontrar lançamentos específicos
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={filtros.tipo}
                      onValueChange={(value) =>
                        setFiltros({ ...filtros, tipo: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="RECEITA">Receita</SelectItem>
                        <SelectItem value="DESPESA">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={filtros.status}
                      onValueChange={(value) =>
                        setFiltros({ ...filtros, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Método de Pagamento</Label>
                    <Select
                      value={filtros.metodo}
                      onValueChange={(value) =>
                        setFiltros({ ...filtros, metodo: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="CREDITO">
                          Cartão de Crédito
                        </SelectItem>
                        <SelectItem value="DEBITO">Cartão de Débito</SelectItem>
                        <SelectItem value="TRANSFERENCIA">
                          Transferência
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Novo Lançamento
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Novo Lançamento</SheetTitle>
                  <SheetDescription>
                    Adicione uma nova receita ou despesa ao seu controle
                    financeiro
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
                        onValueChange={(value) =>
                          handleChange("categoria", value)
                        }
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
                      onChange={(e) =>
                        handleChange("descricao", e.target.value)
                      }
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
                      <Label htmlFor="tipoLancamento">
                        Tipo de Lançamento *
                      </Label>
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
                          <Label htmlFor="usuarioAlvoId">
                            Compartilhar com *
                          </Label>
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
                        onValueChange={(value) =>
                          handleChange("cartaoId", value)
                        }
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
                      onValueChange={(value) =>
                        handleChange("responsavel", value)
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Claudenir">Claudenir</SelectItem>
                        <SelectItem value="Beatriz">Beatriz</SelectItem>
                        <SelectItem value="Compartilhado">
                          Compartilhado
                        </SelectItem>
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
                                handleChange(
                                  "dataFimRecorrencia",
                                  e.target.value
                                )
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
                      onChange={(e) =>
                        handleChange("observacoes", e.target.value)
                      }
                      placeholder="Observações adicionais..."
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Criar Lançamento
                  </Button>
                </form>
              </SheetContent>
            </Sheet>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Receitas
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {totalReceitas.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Despesas
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    R$ {totalDespesas.toFixed(2)}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Saldo
                  </p>
                  <p
                    className={`text-2xl font-bold ${totalReceitas - totalDespesas >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    R$ {(totalReceitas - totalDespesas).toFixed(2)}
                  </p>
                </div>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    totalReceitas - totalDespesas >= 0
                      ? "bg-green-100"
                      : "bg-red-100"
                  }`}
                >
                  {totalReceitas - totalDespesas >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Novo Card para Compartilhamentos */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Compartilhados
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {
                      lancamentos.filter((l) => getStatusCompartilhamento(l))
                        .length
                    }
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search e Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar lançamentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filtros
                  </Button>
                </SheetTrigger>
                <FiltrosSheet />
              </Sheet>

              <Button
                variant="outline"
                onClick={() => setMostrarPrevisoes(!mostrarPrevisoes)}
                className="gap-2"
              >
                <Repeat className="w-4 h-4" />
                Previsões
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Previsões */}
        <AnimatePresence>
          {mostrarPrevisoes && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Repeat className="w-5 h-5" />
                    Previsões de Recorrências
                  </CardTitle>
                  <CardDescription>
                    Lançamentos recorrentes previstos para o mês selecionado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-4">
                    <Input
                      type="month"
                      value={mesPrevisao}
                      onChange={(e) => setMesPrevisao(e.target.value)}
                      className="max-w-[200px]"
                    />
                  </div>

                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {previsoesFuturas.map((previsao) => (
                        <div
                          key={previsao.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-2 h-8 rounded-full ${
                                previsao.tipo === "RECEITA"
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                            />
                            <div>
                              <p className="font-medium">
                                {previsao.descricao}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                  {previsao.categoria.nome}
                                </Badge>
                                <span>{previsao.cartao?.nome || "-"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`font-medium ${
                                previsao.tipo === "RECEITA"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              R$ {previsao.valor.toFixed(2)}
                            </span>

                            <Badge
                              variant={
                                previsao.jaExiste ? "default" : "secondary"
                              }
                            >
                              {previsao.jaExiste ? "Criado" : "Pendente"}
                            </Badge>

                            {!previsao.jaExiste && previsao.ehOriginal && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  criarTodasRecorrencias(
                                    previsao.lancamentoPaiId
                                  )
                                }
                              >
                                Criar Todos
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lançamentos - Design Minimalista */}
        <Card>
          <CardHeader>
            <CardTitle>Lançamentos</CardTitle>
            <CardDescription>
              {lancamentosFiltrados.length} lançamentos
              {filtros.compartilhamento !== "all" && (
                <span className="ml-2 text-muted-foreground">
                  •{" "}
                  {
                    {
                      compartilhados: "Compartilhados",
                      recebidos: "Compartilhados comigo",
                      enviados: "Compartilhados por mim",
                      individuais: "Individuais",
                    }[filtros.compartilhamento]
                  }
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {lancamentosFiltrados.map((lancamento) => {
                  const compartilhamento =
                    getStatusCompartilhamento(lancamento);

                  return (
                    <motion.div
                      key={lancamento.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`group p-4 rounded-xl border transition-all duration-200 hover:shadow-sm ${
                        compartilhamento
                          ? "bg-gradient-to-r from-blue-50/30 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/30"
                          : "bg-background border-border"
                      }`}
                    >
                      {/* Layout Principal */}
                      <div className="flex items-start justify-between">
                        {/* Lado Esquerdo - Informações */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Ícone do Tipo */}
                          <div
                            className={`p-2 rounded-lg flex-shrink-0 ${
                              lancamento.tipo === "RECEITA"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                            }`}
                          >
                            {lancamento.tipo === "RECEITA" ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                          </div>

                          {/* Conteúdo Principal */}
                          <div className="flex-1 min-w-0 space-y-1">
                            {/* Linha 1: Descrição e Badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-foreground truncate">
                                {lancamento.descricao}
                              </p>

                              {/* Badges */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {compartilhamento && (
                                  <div
                                    className="w-2 h-2 rounded-full bg-blue-500"
                                    title="Compartilhado"
                                  />
                                )}
                                {lancamento.recorrente && (
                                  <Repeat
                                    className="w-3 h-3 text-muted-foreground"
                                    aria-label="Recorrente"
                                  />
                                )}
                                {lancamento.parcelasTotal &&
                                  lancamento.parcelasTotal > 1 && (
                                    <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                                      {lancamento.parcelaAtual}/
                                      {lancamento.parcelasTotal}
                                    </span>
                                  )}
                              </div>
                            </div>

                            {/* Linha 2: Metadados */}
                            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                              <span
                                className="px-2 py-0.5 rounded-full text-xs border"
                                style={{
                                  backgroundColor: `${lancamento.categoria.cor}15`,
                                  color: lancamento.categoria.cor,
                                  borderColor: `${lancamento.categoria.cor}30`,
                                }}
                              >
                                {lancamento.categoria.nome}
                              </span>

                              <span className="flex items-center gap-1">
                                {getMetodoPagamentoIcon(
                                  lancamento.metodoPagamento
                                )}
                                {lancamento.metodoPagamento}
                              </span>

                              {lancamento.cartao && (
                                <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                  {lancamento.cartao.nome}
                                </span>
                              )}

                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(lancamento.data).toLocaleDateString(
                                  "pt-BR"
                                )}
                              </span>
                            </div>

                            {/* Informação de Compartilhamento Minimalista */}
                            {compartilhamento && (
                              <div className="flex items-center gap-2 pt-1">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Users className="w-3 h-3" />
                                  <span>
                                    {compartilhamento.isCriador ? (
                                      <>
                                        Compartilhado com{" "}
                                        <strong className="text-foreground">
                                          {compartilhamento.usuarioAlvo?.name}
                                        </strong>
                                      </>
                                    ) : (
                                      <>
                                        Compartilhado por{" "}
                                        <strong className="text-foreground">
                                          {
                                            compartilhamento.usuarioCriador
                                              ?.name
                                          }
                                        </strong>
                                      </>
                                    )}
                                  </span>

                                  <div
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      compartilhamento.status === "ACEITO"
                                        ? "bg-green-500"
                                        : compartilhamento.status === "PENDENTE"
                                          ? "bg-yellow-500"
                                          : "bg-red-500"
                                    }`}
                                  />

                                  <span className="text-xs capitalize">
                                    {compartilhamento.status.toLowerCase()}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Lado Direito - Valor e Ações */}
                        <div className="flex items-center gap-3 pl-4 flex-shrink-0">
                          {/* Valor */}
                          <div className="text-right">
                            <div
                              className={`text-lg font-semibold ${
                                lancamento.tipo === "RECEITA"
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              R$ {lancamento.valor.toFixed(2)}
                            </div>
                            {compartilhamento && (
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                {compartilhamento.isCriador ? (
                                  <>
                                    Sua parte: R${" "}
                                    {(
                                      lancamento.valor -
                                      compartilhamento.valorCompartilhado
                                    ).toFixed(2)}
                                  </>
                                ) : (
                                  <>
                                    Compartilhado: R${" "}
                                    {compartilhamento.valorCompartilhado.toFixed(
                                      2
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Status */}
                          <Button
                            variant={lancamento.pago ? "default" : "outline"}
                            size="sm"
                            onClick={() =>
                              toggleStatus(lancamento.id, lancamento.pago)
                            }
                            className="h-8 px-3"
                          >
                            {lancamento.pago ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                          </Button>

                          {/* Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem className="flex items-center gap-2">
                                <Edit className="w-4 h-4" />
                                Editar
                              </DropdownMenuItem>
                              {!compartilhamento && (
                                <DropdownMenuItem className="flex items-center gap-2">
                                  <Share2 className="w-4 h-4" />
                                  Compartilhar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="flex items-center gap-2 text-destructive">
                                <Trash2 className="w-4 h-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Ações para Compartilhamento Pendente */}
                      {compartilhamento?.status === "PENDENTE" &&
                        compartilhamento.isAlvo && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-3 pt-3 border-t border-border flex justify-end gap-2"
                          >
                            <Button
                              size="sm"
                              variant="default"
                              className="gap-2 h-8"
                            >
                              <UserCheck className="w-3 h-3" />
                              Aceitar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 h-8"
                            >
                              <UserX className="w-3 h-3" />
                              Recusar
                            </Button>
                          </motion.div>
                        )}

                      {/* Parcelas Filhas */}
                      {lancamento.lancamentosFilhos?.map((parcela) => (
                        <motion.div
                          key={parcela.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="ml-12 mt-2 p-2 bg-muted/30 dark:bg-muted/50 rounded-lg border"
                        >
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-background px-1.5 py-0.5 rounded border">
                                {parcela.parcelaAtual}/{parcela.parcelasTotal}
                              </span>
                              <span className="text-muted-foreground">
                                {parcela.descricao}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                R$ {parcela.valor.toFixed(2)}
                              </span>
                              <Button
                                variant={parcela.pago ? "default" : "outline"}
                                size="sm"
                                onClick={() =>
                                  toggleStatus(parcela.id, parcela.pago)
                                }
                                className="h-6 px-2 text-xs"
                              >
                                {parcela.pago ? "✓" : "..."}
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
