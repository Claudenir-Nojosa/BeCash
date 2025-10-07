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
import { Link } from "@radix-ui/react-navigation-menu";

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
}

export default function LancamentosPage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [mostrarPrevisoes, setMostrarPrevisoes] = useState(false);
  const [previsoesFuturas, setPrevisoesFuturas] = useState<any[]>([]);
  const [mesPrevisao, setMesPrevisao] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtros, setFiltros] = useState({
    tipo: "all",
    status: "all",
    metodo: "all",
  });

  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    tipo: "DESPESA",
    metodoPagamento: "PIX",
    categoriaId: "",
    cartaoId: "",
    observacoes: "",
    tipoParcelamento: "AVISTA",
    parcelasTotal: "2",
    recorrente: false,
    dataFimRecorrencia: "",
  });

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
      const res = await fetch("/api/lancamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          valor: parseFloat(formData.valor),
          parcelasTotal: parseInt(formData.parcelasTotal),
        }),
      });

      if (res.ok) {
        setFormData({
          descricao: "",
          valor: "",
          tipo: "DESPESA",
          metodoPagamento: "PIX",
          categoriaId: "",
          cartaoId: "",
          observacoes: "",
          tipoParcelamento: "AVISTA",
          parcelasTotal: "2",
          recorrente: false,
          dataFimRecorrencia: "",
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

  const categoriasFiltradas = categorias.filter(
    (cat) => cat.tipo === formData.tipo
  );

  const handleMetodoPagamentoChange = (metodo: string) => {
    setFormData({
      ...formData,
      metodoPagamento: metodo,
      tipoParcelamento: metodo === "CREDITO" ? "AVISTA" : "AVISTA",
      parcelasTotal: "2",
      cartaoId: metodo === "CREDITO" ? formData.cartaoId : "",
    });
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

                <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData({ ...formData, descricao: e.target.value })
                      }
                      placeholder="Ex: Aluguel, Salário, Mercado..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      value={formData.valor}
                      onChange={(e) =>
                        setFormData({ ...formData, valor: e.target.value })
                      }
                      placeholder="0,00"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value) =>
                          setFormData({ ...formData, tipo: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DESPESA">Despesa</SelectItem>
                          <SelectItem value="RECEITA">Receita</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="metodoPagamento">Método</Label>
                      <Select
                        value={formData.metodoPagamento}
                        onValueChange={handleMetodoPagamentoChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PIX">PIX</SelectItem>
                          <SelectItem value="TRANSFERENCIA">
                            Transferência
                          </SelectItem>
                          <SelectItem value="DEBITO">Débito</SelectItem>
                          <SelectItem value="CREDITO">Crédito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select
                      value={formData.categoriaId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, categoriaId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriasFiltradas.map((cat) => (
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

                  {formData.metodoPagamento === "CREDITO" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="cartao">Cartão</Label>
                        <Select
                          value={formData.cartaoId}
                          onValueChange={(value) =>
                            setFormData({ ...formData, cartaoId: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um cartão" />
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

                      <div className="space-y-2">
                        <Label htmlFor="tipoParcelamento">
                          Tipo de Pagamento
                        </Label>
                        <Select
                          value={formData.tipoParcelamento}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              tipoParcelamento: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AVISTA">À Vista</SelectItem>
                            <SelectItem value="PARCELADO">Parcelado</SelectItem>
                            <SelectItem value="RECORRENTE">
                              Recorrente
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.tipoParcelamento === "PARCELADO" && (
                        <div className="space-y-2">
                          <Label htmlFor="parcelas">Parcelas</Label>
                          <Select
                            value={formData.parcelasTotal}
                            onValueChange={(value) =>
                              setFormData({ ...formData, parcelasTotal: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
                                (num) => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num}x
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {formData.tipoParcelamento === "RECORRENTE" && (
                        <div className="space-y-2">
                          <Label htmlFor="dataFim">Data Final</Label>
                          <Input
                            type="date"
                            value={formData.dataFimRecorrencia}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                dataFimRecorrencia: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      )}
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          observacoes: e.target.value,
                        })
                      }
                      placeholder="Observações adicionais..."
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Salvar Lançamento
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
        </div>

        {/* Search */}
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

        {/* Lançamentos */}
        <Card>
          <CardHeader>
            <CardTitle>Lançamentos Recentes</CardTitle>
            <CardDescription>
              {lancamentosFiltrados.length} lançamentos encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {lancamentosFiltrados.map((lancamento) => (
                  <motion.div
                    key={lancamento.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            lancamento.tipo === "RECEITA"
                              ? "bg-green-100"
                              : "bg-red-100"
                          }`}
                        >
                          {lancamento.tipo === "RECEITA" ? (
                            <TrendingUp className="w-6 h-6 text-green-600" />
                          ) : (
                            <TrendingDown className="w-6 h-6 text-red-600" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">
                              {lancamento.descricao}
                            </p>
                            {lancamento.recorrente && (
                              <Badge variant="secondary" className="gap-1">
                                <Repeat className="w-3 h-3" />
                                Recorrente
                              </Badge>
                            )}
                            {lancamento.parcelasTotal &&
                              lancamento.parcelasTotal > 1 && (
                                <Badge variant="outline">
                                  {lancamento.parcelaAtual}/
                                  {lancamento.parcelasTotal}
                                </Badge>
                              )}
                          </div>

                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1"
                              style={{
                                backgroundColor: `${lancamento.categoria.cor}20`,
                                color: lancamento.categoria.cor,
                                borderColor: lancamento.categoria.cor,
                              }}
                            >
                              {lancamento.categoria.nome}
                            </Badge>

                            <div className="flex items-center gap-1">
                              {getMetodoPagamentoIcon(
                                lancamento.metodoPagamento
                              )}
                              {lancamento.metodoPagamento}
                            </div>

                            {lancamento.cartao && (
                              <Badge variant="secondary">
                                {lancamento.cartao.nome}
                              </Badge>
                            )}

                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(lancamento.data).toLocaleDateString(
                                "pt-BR"
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span
                          className={`text-lg font-bold ${
                            lancamento.tipo === "RECEITA"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          R$ {lancamento.valor.toFixed(2)}
                        </span>

                        <Button
                          variant={lancamento.pago ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            toggleStatus(lancamento.id, lancamento.pago)
                          }
                          className="gap-2"
                        >
                          {lancamento.pago ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Pago
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4" />
                              Pendente
                            </>
                          )}
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {/* Parcelas Filhas */}
                    {lancamento.lancamentosFilhos?.map((parcela) => (
                      <motion.div
                        key={parcela.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="ml-16 mt-3 p-3 bg-muted/50 rounded-lg border"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">
                              Parcela {parcela.parcelaAtual}/
                              {parcela.parcelasTotal}
                            </Badge>
                            <span className="text-sm">{parcela.descricao}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">
                              R$ {parcela.valor.toFixed(2)}
                            </span>

                            <Button
                              variant={parcela.pago ? "default" : "outline"}
                              size="sm"
                              onClick={() =>
                                toggleStatus(parcela.id, parcela.pago)
                              }
                            >
                              {parcela.pago ? "Pago" : "Pendente"}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
