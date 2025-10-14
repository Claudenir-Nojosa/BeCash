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
  ChevronLeft,
  ChevronRight,
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
  const [competencia, setCompetencia] = useState(
    new Date().toISOString().slice(0, 7) // Formato YYYY-MM
  );
  const [anoSelecionado, setAnoSelecionado] = useState(
    new Date().getFullYear()
  );
  const [mesSelecionado, setMesSelecionado] = useState(
    new Date().getMonth() + 1
  );
  const [mostrarSeletorMeses, setMostrarSeletorMeses] = useState(false);
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
  const gerarOpcoesAnos = () => {
    const anoAtual = new Date().getFullYear();
    const anos = [];

    // Últimos 2 anos, ano atual e próximos 2 anos
    for (let i = -2; i <= 2; i++) {
      anos.push(anoAtual + i);
    }

    return anos;
  };

  const gerarMesesDoAno = (ano: number) => {
    const meses = [
      { numero: 1, nome: "Janeiro", abreviacao: "Jan" },
      { numero: 2, nome: "Fevereiro", abreviacao: "Fev" },
      { numero: 3, nome: "Março", abreviacao: "Mar" },
      { numero: 4, nome: "Abril", abreviacao: "Abr" },
      { numero: 5, nome: "Maio", abreviacao: "Mai" },
      { numero: 6, nome: "Junho", abreviacao: "Jun" },
      { numero: 7, nome: "Julho", abreviacao: "Jul" },
      { numero: 8, nome: "Agosto", abreviacao: "Ago" },
      { numero: 9, nome: "Setembro", abreviacao: "Set" },
      { numero: 10, nome: "Outubro", abreviacao: "Out" },
      { numero: 11, nome: "Novembro", abreviacao: "Nov" },
      { numero: 12, nome: "Dezembro", abreviacao: "Dez" },
    ];

    return meses.map((mes) => ({
      ...mes,
      competencia: `${ano}-${mes.numero.toString().padStart(2, "0")}`,
    }));
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

  // Atualize o useEffect para usar a competência formatada
  /*   useEffect(() => {
    const competenciaFormatada = `${anoSelecionado}-${mesSelecionado.toString().padStart(2, "0")}`;
    carregarDados(competenciaFormatada);
  }, [anoSelecionado, mesSelecionado]); */

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

  const carregarDados = async (competencia?: string) => {
    try {
      setLoading(true);
      const url = competencia
        ? `/api/lancamentos?competencia=${competencia}`
        : "/api/lancamentos";

      const [lancamentosRes, categoriasRes, cartoesRes] = await Promise.all([
        fetch(url),
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

  useEffect(() => {
    carregarDados();
  }, []);

  // Função para selecionar mês
  const selecionarMes = (mes: number) => {
    setMesSelecionado(mes);
    setMostrarSeletorMeses(false);
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
    // tenta criar um objeto Date confiável a partir de 'data'
    const dataStr = lancamento.data.includes("T")
      ? lancamento.data
      : lancamento.data.replace(" ", "T"); // garante formato ISO compatível

    const dataLancamento = new Date(dataStr);
    const ano = dataLancamento.getFullYear();
    const mes = dataLancamento.getMonth() + 1;

    // 🔥 filtro principal por competência
    if (ano !== anoSelecionado || mes !== mesSelecionado) return false;

    // filtros adicionais
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
            {/* Seletor de Competência Minimalista */}
            <div className="flex items-center space-x-1 bg-background/50 border border-border/50 rounded-full px-3 py-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const novoMes =
                    mesSelecionado === 1 ? 12 : mesSelecionado - 1;
                  const novoAno =
                    mesSelecionado === 1 ? anoSelecionado - 1 : anoSelecionado;
                  if (gerarOpcoesAnos().includes(novoAno)) {
                    setMesSelecionado(novoMes);
                    setAnoSelecionado(novoAno);
                  }
                }}
                className="hover:bg-primary/10 rounded-full p-1 h-6 w-6"
                disabled={
                  !gerarOpcoesAnos().includes(
                    anoSelecionado - (mesSelecionado === 1 ? 1 : 0)
                  )
                }
              >
                <ChevronLeft className="h-3 w-3 text-muted-foreground" />
              </Button>

              <Button
                variant="ghost"
                onClick={() => setMostrarSeletorMeses(!mostrarSeletorMeses)}
                className="px-2 hover:bg-transparent font-medium text-sm"
              >
                <span className="min-w-[100px] text-center">
                  {new Date(anoSelecionado, mesSelecionado - 1)
                    .toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                    })
                    .replace(/^\w/, (c) => c.toUpperCase())}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const novoMes =
                    mesSelecionado === 12 ? 1 : mesSelecionado + 1;
                  const novoAno =
                    mesSelecionado === 12 ? anoSelecionado + 1 : anoSelecionado;
                  if (gerarOpcoesAnos().includes(novoAno)) {
                    setMesSelecionado(novoMes);
                    setAnoSelecionado(novoAno);
                  }
                }}
                className="hover:bg-primary/10 rounded-full p-1 h-6 w-6"
                disabled={
                  !gerarOpcoesAnos().includes(
                    anoSelecionado + (mesSelecionado === 12 ? 1 : 0)
                  )
                }
              >
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>

            {/* Dropdown de Seleção de Mês/Ano */}
            <AnimatePresence>
              {mostrarSeletorMeses && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  className="absolute top-12 left-0 z-50 bg-background/95 backdrop-blur-md border border-border/50 rounded-xl shadow-xl p-4 w-64"
                >
                  {/* Seletor de Ano Minimalista */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAnoSelecionado((ano) => ano - 1)}
                      disabled={!gerarOpcoesAnos().includes(anoSelecionado - 1)}
                      className="h-7 w-7 p-0 hover:bg-muted/50 rounded-full"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </Button>

                    <span className="text-sm font-medium text-foreground px-3 py-1 rounded-md bg-muted/30">
                      {anoSelecionado}
                    </span>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAnoSelecionado((ano) => ano + 1)}
                      disabled={!gerarOpcoesAnos().includes(anoSelecionado + 1)}
                      className="h-7 w-7 p-0 hover:bg-muted/50 rounded-full"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Grid de Meses Minimalista */}
                  <div className="grid grid-cols-3 gap-1">
                    {gerarMesesDoAno(anoSelecionado).map((mes) => {
                      const isMesAtual =
                        mes.numero === new Date().getMonth() + 1 &&
                        anoSelecionado === new Date().getFullYear();
                      const isSelecionado = mes.numero === mesSelecionado;

                      return (
                        <button
                          key={mes.numero}
                          onClick={() => selecionarMes(mes.numero)}
                          className={`
                    relative p-2 rounded-lg transition-all duration-200 text-center text-xs font-medium
                    ${
                      isSelecionado
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-muted/50 text-foreground"
                    }
                    ${isMesAtual && !isSelecionado ? "ring-1 ring-primary/30 bg-primary/5" : ""}
                  `}
                        >
                          {mes.abreviacao}

                          {/* Indicador sutil do mês atual */}
                          {isMesAtual && !isSelecionado && (
                            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary rounded-full opacity-80" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Botão para voltar ao mês atual */}
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <button
                      onClick={() => {
                        const agora = new Date();
                        setAnoSelecionado(agora.getFullYear());
                        setMesSelecionado(agora.getMonth() + 1);
                        setMostrarSeletorMeses(false);
                      }}
                      className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 rounded-md hover:bg-muted/30"
                    >
                      Voltar para atual
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Overlay para fechar */}
            {mostrarSeletorMeses && (
              <div
                className="fixed inset-0 z-40 bg-background/10 backdrop-blur-[1px]"
                onClick={() => setMostrarSeletorMeses(false)}
              />
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros
                </Button>
              </SheetTrigger>
              <FiltrosSheet />
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
                  {/* Conteúdo do formulário permanece igual */}
                </form>
              </SheetContent>
            </Sheet>
          </div>
        </motion.div>{" "}
        {/* Fechamento correto do motion.div */}
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
