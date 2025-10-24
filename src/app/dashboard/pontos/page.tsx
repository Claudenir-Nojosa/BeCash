// app/dashboard/pontos/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Coins,
  TrendingUp,
  Gift,
  Clock,
  Target,
  Edit3,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Ponto {
  id: string;
  programa: string;
  quantidade: number;
  descricao: string;
  data: Date;
  tipo: "GANHO" | "RESGATE" | "EXPIRACAO";
  valorResgate: number | null;
  usuarioId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ResumoPontos {
  totalPontos: number;
  pontosGanhos: number;
  pontosResgatados: number;
  pontosExpirados: number;
  valorTotalResgatado: number;
}

export default function PontosPage() {
  const router = useRouter();
  const [editandoPonto, setEditandoPonto] = useState<Ponto | null>(null);
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [todosPontos, setTodosPontos] = useState<Ponto[]>([]); // ← Adicionei isso
  const [resumo, setResumo] = useState<ResumoPontos>({
    totalPontos: 0,
    pontosGanhos: 0,
    pontosResgatados: 0,
    pontosExpirados: 0,
    valorTotalResgatado: 0,
  });
  const [carregando, setCarregando] = useState(true);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [dialogAberto, setDialogAberto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [filtros, setFiltros] = useState({
    programa: "todos",
    tipo: "todos",
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    busca: "",
  });

  const [formData, setFormData] = useState({
    programa: "LIVELO",
    quantidade: "",
    descricao: "",
    tipo: "GANHO",
    valorResgate: "",
    data: new Date(),
  });

  // Carrega todos os dados uma vez
  useEffect(() => {
    buscarTodosPontos();
  }, []); // ← Remove as dependências dos filtros

  const buscarTodosPontos = async () => {
    try {
      setCarregando(true);

      const response = await fetch(
        `/api/pontos?mes=${filtros.mes}&ano=${filtros.ano}&programa=todos&tipo=todos`
      );

      if (!response.ok) throw new Error("Erro ao buscar pontos");

      const data = await response.json();

      setTodosPontos(data.pontos); // ← Salva todos os pontos
      setPontos(data.pontos); // ← Pontos iniciais
      setResumo(data.resumo);
    } catch (error) {
      console.error("Erro ao buscar pontos:", error);
      toast.error("Erro ao carregar pontos");
    } finally {
      setCarregando(false);
    }
  };

  // Filtra localmente sem recarregar
  const aplicarFiltros = () => {
    let pontosFiltrados = todosPontos;

    // Filtro por tipo
    if (filtros.tipo !== "todos") {
      pontosFiltrados = pontosFiltrados.filter(
        (ponto) => ponto.tipo === filtros.tipo
      );
    }

    // Filtro por programa
    if (filtros.programa !== "todos") {
      pontosFiltrados = pontosFiltrados.filter(
        (ponto) => ponto.programa === filtros.programa
      );
    }

    // Filtro por busca
    if (filtros.busca) {
      pontosFiltrados = pontosFiltrados.filter((ponto) =>
        ponto.descricao.toLowerCase().includes(filtros.busca.toLowerCase())
      );
    }

    // Filtro por mês/ano (já vem do servidor)
    pontosFiltrados = pontosFiltrados.filter((ponto) => {
      const dataPonto = new Date(ponto.data);
      return (
        dataPonto.getMonth() + 1 === filtros.mes &&
        dataPonto.getFullYear() === filtros.ano
      );
    });

    setPontos(pontosFiltrados);
  };

  // Aplica filtros quando eles mudam
  useEffect(() => {
    if (todosPontos.length > 0) {
      aplicarFiltros();
    }
  }, [filtros, todosPontos]);

  // Função para iniciar edição
  const iniciarEdicao = (ponto: Ponto) => {
    setEditandoPonto(ponto);
    setFormData({
      programa: ponto.programa,
      quantidade: ponto.quantidade.toString(),
      descricao: ponto.descricao,
      tipo: ponto.tipo,
      valorResgate: ponto.valorResgate?.toString() || "",
      data: new Date(ponto.data),
    });
    setIsSheetOpen(true);
  };

  // Função para cancelar edição
  const cancelarEdicao = () => {
    setEditandoPonto(null);
    setFormData({
      programa: "LIVELO",
      quantidade: "",
      descricao: "",
      tipo: "GANHO",
      valorResgate: "",
      data: new Date(),
    });
    setIsSheetOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    try {
      const payload = {
        ...formData,
        quantidade: parseInt(formData.quantidade),
        valorResgate: formData.valorResgate
          ? parseFloat(formData.valorResgate)
          : null,
        data: formData.data.toISOString(),
      };

      const url = editandoPonto
        ? `/api/pontos/${editandoPonto.id}`
        : "/api/pontos";

      const method = editandoPonto ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar ponto");
      }

      const pontoSalvo = await response.json();

      if (editandoPonto) {
        // Atualização otimista
        setTodosPontos((prev) =>
          prev.map((ponto) =>
            ponto.id === editandoPonto.id ? pontoSalvo : ponto
          )
        );
        toast.success("Ponto atualizado com sucesso!");
      } else {
        // Criação otimista
        setTodosPontos((prev) => [...prev, pontoSalvo]);

        // Recalcular resumo localmente
        setResumo((prev) => ({
          ...prev,
          totalPontos:
            prev.totalPontos +
            (pontoSalvo.tipo === "GANHO"
              ? pontoSalvo.quantidade
              : -pontoSalvo.quantidade),
          pontosGanhos:
            prev.pontosGanhos +
            (pontoSalvo.tipo === "GANHO" ? pontoSalvo.quantidade : 0),
          pontosResgatados:
            prev.pontosResgatados +
            (pontoSalvo.tipo === "RESGATE" ? pontoSalvo.quantidade : 0),
          pontosExpirados:
            prev.pontosExpirados +
            (pontoSalvo.tipo === "EXPIRACAO" ? pontoSalvo.quantidade : 0),
          valorTotalResgatado:
            prev.valorTotalResgatado + (pontoSalvo.valorResgate || 0),
        }));

        toast.success("Ponto registrado com sucesso!");
      }

      cancelarEdicao();
    } catch (error: any) {
      console.error("Erro ao salvar ponto:", error);
      toast.error(error.message || "Erro ao salvar ponto");
      buscarTodosPontos(); // Recarrega em caso de erro
    } finally {
      setEnviando(false);
    }
  };

  const handleDelete = async (id: string) => {
    setExcluindo(id);

    const pontoParaExcluir = pontos.find((ponto) => ponto.id === id);

    try {
      // Exclusão otimista
      setTodosPontos((prev) => prev.filter((ponto) => ponto.id !== id));
      setDialogAberto(null);

      // Recalcular resumo localmente
      if (pontoParaExcluir) {
        setResumo((prev) => ({
          ...prev,
          totalPontos:
            prev.totalPontos -
            (pontoParaExcluir.tipo === "GANHO"
              ? pontoParaExcluir.quantidade
              : -pontoParaExcluir.quantidade),
          pontosGanhos:
            prev.pontosGanhos -
            (pontoParaExcluir.tipo === "GANHO"
              ? pontoParaExcluir.quantidade
              : 0),
          pontosResgatados:
            prev.pontosResgatados -
            (pontoParaExcluir.tipo === "RESGATE"
              ? pontoParaExcluir.quantidade
              : 0),
          pontosExpirados:
            prev.pontosExpirados -
            (pontoParaExcluir.tipo === "EXPIRACAO"
              ? pontoParaExcluir.quantidade
              : 0),
          valorTotalResgatado:
            prev.valorTotalResgatado - (pontoParaExcluir.valorResgate || 0),
        }));
      }

      // Chamada para a API de delete (você precisa criar essa rota)
      const res = await fetch(`/api/pontos/${id}`, { method: "DELETE" });

      if (!res.ok) {
        throw new Error("Erro ao deletar ponto");
      }

      toast.success("Ponto deletado com sucesso!");
    } catch (error) {
      console.error("Erro ao deletar ponto:", error);

      // Revert se der erro
      if (pontoParaExcluir) {
        setTodosPontos((prev) => [...prev, pontoParaExcluir]);
        buscarTodosPontos(); // Recarrega os dados corretos
      }

      toast.error("Erro ao deletar ponto.");
    } finally {
      setExcluindo(null);
    }
  };

  const formatarData = (data: Date): string => {
    return format(new Date(data), "dd/MM/yyyy", {
      locale: ptBR,
    });
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarPontos = (pontos: number) => {
    return new Intl.NumberFormat("pt-BR").format(pontos);
  };

  const obterCorTipo = (tipo: string) => {
    switch (tipo) {
      case "GANHO":
        return "bg-green-900/50 text-green-400 border-green-700";
      case "RESGATE":
        return "bg-blue-900/50 text-blue-400 border-blue-700";
      case "EXPIRACAO":
        return "bg-red-900/50 text-red-400 border-red-700";
      default:
        return "bg-gray-900/50 text-gray-400 border-gray-700";
    }
  };

  const obterIconeTipo = (tipo: string) => {
    switch (tipo) {
      case "GANHO":
        return <TrendingUp className="w-4 h-4" />;
      case "RESGATE":
        return <Gift className="w-4 h-4" />;
      case "EXPIRACAO":
        return <Clock className="w-4 h-4" />;
      default:
        return <Coins className="w-4 h-4" />;
    }
  };

  const obterLabelTipo = (tipo: string) => {
    switch (tipo) {
      case "GANHO":
        return "Ganho";
      case "RESGATE":
        return "Resgate";
      case "EXPIRACAO":
        return "Expiração";
      default:
        return tipo;
    }
  };

  const programas = [
    { value: "todos", label: "Todos os programas" },
    { value: "LIVELO", label: "LIVELO" },
    { value: "SMILES", label: "SMILES" },
    { value: "TUDOAZUL", label: "TudoAzul" },
    { value: "LATAMPASS", label: "LATAM Pass" },
    { value: "OUTRO", label: "Outro" },
  ];

  const tipos = [
    { value: "todos", label: "Todos os tipos" },
    { value: "GANHO", label: "Ganhos" },
    { value: "RESGATE", label: "Resgates" },
    { value: "EXPIRACAO", label: "Expirações" },
  ];

  const meses = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];

  const anos = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  const pontosFiltrados = pontos.filter((ponto) =>
    ponto.descricao.toLowerCase().includes(filtros.busca.toLowerCase())
  );

  if (carregando && pontos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400">Carregando pontos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-white">Meus Pontos</h1>
              <p className="text-gray-300">
                Controle seus pontos de fidelidade
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={"outline"}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              onClick={() => router.push("/dashboard/pontos/metas")}
            >
              <Target className="w-4 h-4" />
              Metas
            </Button>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant={"outline"}
                 className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  <Plus className="w-4 h-4" />
                  Novo Ponto
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-gray-900 border-gray-800 text-white">
                <SheetHeader>
                  <SheetTitle className="text-white">
                    {editandoPonto ? "Editar Ponto" : "Novo Ponto"}
                  </SheetTitle>
                  <SheetDescription className="text-gray-400">
                    Registre seus ganhos, resgates ou expirações de pontos
                  </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="programa" className="text-white">
                        Programa *
                      </Label>
                      <Select
                        value={formData.programa}
                        onValueChange={(value) =>
                          setFormData({ ...formData, programa: value })
                        }
                        required
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue placeholder="Selecione o programa" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 text-white">
                          {programas.slice(1).map((programa) => (
                            <SelectItem
                              key={programa.value}
                              value={programa.value}
                            >
                              {programa.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tipo" className="text-white">
                        Tipo *
                      </Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(
                          value: "GANHO" | "RESGATE" | "EXPIRACAO"
                        ) => setFormData({ ...formData, tipo: value })}
                        required
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 text-white">
                          <SelectItem value="GANHO">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-green-400" />
                              Ganho
                            </div>
                          </SelectItem>
                          <SelectItem value="RESGATE">
                            <div className="flex items-center gap-2">
                              <Gift className="w-4 h-4 text-blue-400" />
                              Resgate
                            </div>
                          </SelectItem>
                          <SelectItem value="EXPIRACAO">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-red-400" />
                              Expiração
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantidade" className="text-white">
                      Quantidade de Pontos *
                    </Label>
                    <Input
                      id="quantidade"
                      type="number"
                      min="1"
                      value={formData.quantidade}
                      onChange={(e) =>
                        setFormData({ ...formData, quantidade: e.target.value })
                      }
                      placeholder="Ex: 1000"
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao" className="text-white">
                      Descrição *
                    </Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData({ ...formData, descricao: e.target.value })
                      }
                      placeholder="Ex: Compra no Supermercado, Resgate de passagem, Expiração anual..."
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      required
                      rows={3}
                    />
                  </div>

                  {formData.tipo === "RESGATE" && (
                    <div className="space-y-2">
                      <Label htmlFor="valorResgate" className="text-white">
                        Valor do Resgate (R$)
                      </Label>
                      <Input
                        id="valorResgate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.valorResgate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            valorResgate: e.target.value,
                          })
                        }
                        placeholder="Ex: 150,00"
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      />
                      <p className="text-xs text-gray-400">
                        Valor em reais que você resgatou com os pontos
                        (opcional)
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-white">Data *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.data
                            ? format(formData.data, "PPP", { locale: ptBR })
                            : "Selecione a data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                        <Calendar
                          mode="single"
                          selected={formData.data}
                          onSelect={(date) =>
                            date && setFormData({ ...formData, data: date })
                          }
                          initialFocus
                          locale={ptBR}
                          className="bg-gray-800 text-white"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      className="flex-1 bg-white text-gray-900 hover:bg-gray-100"
                      disabled={enviando}
                    >
                      {enviando ? "Registrando..." : "Registrar Ponto"}
                    </Button>
                  </div>
                </form>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Total de Pontos
                  </p>
                  <p className="text-2xl font-bold text-blue-400">
                    {formatarPontos(resumo.totalPontos)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Coins className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Pontos Ganhos
                  </p>
                  <p className="text-2xl font-bold text-green-400">
                    +{formatarPontos(resumo.pontosGanhos)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Pontos Resgatados
                  </p>
                  <p className="text-2xl font-bold text-blue-400">
                    -{formatarPontos(resumo.pontosResgatados)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Gift className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Valor Resgatado
                  </p>
                  <p className="text-2xl font-bold text-red-400">
                    {formatarMoeda(resumo.valorTotalResgatado)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por descrição..."
                  value={filtros.busca}
                  onChange={(e) =>
                    setFiltros({ ...filtros, busca: e.target.value })
                  }
                  className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <Tabs
                value={filtros.tipo}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, tipo: value as any })
                }
                className="w-full sm:w-auto"
              >
                <TabsList className="bg-gray-800 border border-gray-700">
                  <TabsTrigger
                    value="todos"
                    className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                  >
                    Todos
                  </TabsTrigger>
                  <TabsTrigger
                    value="GANHO"
                    className="text-gray-300 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                  >
                    Ganhos
                  </TabsTrigger>
                  <TabsTrigger
                    value="RESGATE"
                    className="text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    Resgates
                  </TabsTrigger>
                  <TabsTrigger
                    value="EXPIRACAO"
                    className="text-gray-300 data-[state=active]:bg-red-600 data-[state=active]:text-white"
                  >
                    Expirações
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">Mês</Label>
                <Select
                  value={filtros.mes.toString()}
                  onValueChange={(value) =>
                    setFiltros({ ...filtros, mes: parseInt(value) })
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {meses.map((mes) => (
                      <SelectItem key={mes.value} value={mes.value.toString()}>
                        {mes.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">Ano</Label>
                <Select
                  value={filtros.ano.toString()}
                  onValueChange={(value) =>
                    setFiltros({ ...filtros, ano: parseInt(value) })
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {anos.map((ano) => (
                      <SelectItem key={ano} value={ano.toString()}>
                        {ano}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">Programa</Label>
                <Select
                  value={filtros.programa}
                  onValueChange={(value) =>
                    setFiltros({ ...filtros, programa: value })
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Todos os programas" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {programas.map((programa) => (
                      <SelectItem key={programa.value} value={programa.value}>
                        {programa.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Pontos */}
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {pontosFiltrados.map((ponto, index) => (
              <motion.div
                key={ponto.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gray-900 border-gray-800 group hover:border-gray-700 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            ponto.tipo === "GANHO"
                              ? "bg-green-600"
                              : ponto.tipo === "RESGATE"
                                ? "bg-blue-600"
                                : "bg-red-600"
                          }`}
                        >
                          {obterIconeTipo(ponto.tipo)}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg text-white">
                              {ponto.descricao}
                            </h3>
                            <Badge
                              variant="outline"
                              className="bg-gray-800 text-gray-300 border-gray-700"
                            >
                              {ponto.programa}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4">
                            <Badge
                              variant="outline"
                              className={obterCorTipo(ponto.tipo)}
                            >
                              <div className="flex items-center gap-1">
                                {obterIconeTipo(ponto.tipo)}
                                {obterLabelTipo(ponto.tipo)}
                              </div>
                            </Badge>

                            <span className="text-gray-400 text-sm">
                              {formatarData(ponto.data)}
                            </span>

                            <div
                              className={`text-lg font-bold ${
                                ponto.tipo === "GANHO"
                                  ? "text-green-400"
                                  : ponto.tipo === "RESGATE"
                                    ? "text-blue-400"
                                    : "text-red-400"
                              }`}
                            >
                              {ponto.tipo === "GANHO" ? "+" : "-"}
                              {formatarPontos(ponto.quantidade)} pontos
                            </div>

                            {ponto.valorResgate && (
                              <div className="text-green-400 font-medium">
                                {formatarMoeda(ponto.valorResgate)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => iniciarEdicao(ponto)}
                                className="text-gray-400 hover:text-white hover:bg-gray-800"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 text-white border-gray-700">
                              <p>Editar ponto</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Dialog
                                open={dialogAberto === ponto.id}
                                onOpenChange={(open) =>
                                  setDialogAberto(open ? ponto.id : null)
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
                                      Excluir Ponto
                                    </DialogTitle>
                                    <DialogDescription className="text-gray-400">
                                      Tem certeza que deseja excluir este ponto?
                                      Esta ação não pode ser desfeita.
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
                                      onClick={() => handleDelete(ponto.id)}
                                      disabled={excluindo === ponto.id}
                                    >
                                      {excluindo === ponto.id
                                        ? "Excluindo..."
                                        : "Confirmar"}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 text-white border-gray-700">
                              <p>Excluir ponto</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Estado Vazio */}
        {pontosFiltrados.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Nenhum ponto encontrado
            </h3>
            <p className="text-gray-400 mb-6">
              {filtros.busca ||
              filtros.tipo !== "todos" ||
              filtros.programa !== "todos"
                ? "Tente ajustar os filtros ou termos de busca"
                : "Comece registrando seu primeiro ponto"}
            </p>
            {!filtros.busca &&
              filtros.tipo === "todos" &&
              filtros.programa === "todos" && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button className="bg-white text-gray-900 hover:bg-gray-100 gap-2">
                      <Plus className="w-4 h-4" />
                      Registrar Primeiro Ponto
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="bg-gray-900 border-gray-800 text-white">
                    <SheetHeader>
                      <SheetTitle className="text-white">
                        {editandoPonto ? "Editar Ponto" : "Novo Ponto"}
                      </SheetTitle>
                      <SheetDescription className="text-gray-400">
                        Registre seus ganhos, resgates ou expirações de pontos
                      </SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="programa" className="text-white">
                            Programa *
                          </Label>
                          <Select
                            value={formData.programa}
                            onValueChange={(value) =>
                              setFormData({ ...formData, programa: value })
                            }
                            required
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                              <SelectValue placeholder="Selecione o programa" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 text-white">
                              {programas.slice(1).map((programa) => (
                                <SelectItem
                                  key={programa.value}
                                  value={programa.value}
                                >
                                  {programa.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tipo" className="text-white">
                            Tipo *
                          </Label>
                          <Select
                            value={formData.tipo}
                            onValueChange={(
                              value: "GANHO" | "RESGATE" | "EXPIRACAO"
                            ) => setFormData({ ...formData, tipo: value })}
                            required
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 text-white">
                              <SelectItem value="GANHO">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-green-400" />
                                  Ganho
                                </div>
                              </SelectItem>
                              <SelectItem value="RESGATE">
                                <div className="flex items-center gap-2">
                                  <Gift className="w-4 h-4 text-blue-400" />
                                  Resgate
                                </div>
                              </SelectItem>
                              <SelectItem value="EXPIRACAO">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-red-400" />
                                  Expiração
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="quantidade" className="text-white">
                          Quantidade de Pontos *
                        </Label>
                        <Input
                          id="quantidade"
                          type="number"
                          min="1"
                          value={formData.quantidade}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              quantidade: e.target.value,
                            })
                          }
                          placeholder="Ex: 1000"
                          className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="descricao" className="text-white">
                          Descrição *
                        </Label>
                        <Textarea
                          id="descricao"
                          value={formData.descricao}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              descricao: e.target.value,
                            })
                          }
                          placeholder="Ex: Compra no Supermercado, Resgate de passagem, Expiração anual..."
                          className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                          required
                          rows={3}
                        />
                      </div>

                      {formData.tipo === "RESGATE" && (
                        <div className="space-y-2">
                          <Label htmlFor="valorResgate" className="text-white">
                            Valor do Resgate (R$)
                          </Label>
                          <Input
                            id="valorResgate"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.valorResgate}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                valorResgate: e.target.value,
                              })
                            }
                            placeholder="Ex: 150,00"
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                          />
                          <p className="text-xs text-gray-400">
                            Valor em reais que você resgatou com os pontos
                            (opcional)
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-white">Data *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.data
                                ? format(formData.data, "PPP", { locale: ptBR })
                                : "Selecione a data"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                            <Calendar
                              mode="single"
                              selected={formData.data}
                              onSelect={(date) =>
                                date && setFormData({ ...formData, data: date })
                              }
                              initialFocus
                              locale={ptBR}
                              className="bg-gray-800 text-white"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="submit"
                          className="flex-1 bg-white text-gray-900 hover:bg-gray-100"
                          disabled={enviando}
                        >
                          {enviando ? "Registrando..." : "Registrar Ponto"}
                        </Button>
                      </div>
                    </form>
                  </SheetContent>
                </Sheet>
              )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
