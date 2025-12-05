// app/dashboard/pontos/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
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

interface AnaliseCPM {
  totalGasto: number;
  totalPontosGanhos: number;
  cpmGeral: number;
  cpmPorPrograma: {
    [programa: string]: {
      totalGasto: number;
      totalPontos: number;
      cpm: number;
    };
  };
  quantidadeRegistros: number;
}

interface ResumoPontos {
  totalPontos: number;
  pontosGanhos: number;
  pontosResgatados: number;
  pontosExpirados: number;
  valorTotalResgatado: number;
  analiseCPM: AnaliseCPM;
  // 🆕 Adicione estas propriedades
  saldosPorPrograma?: {
    [programa: string]: number;
  };
  cpmPorPrograma?: {
    [programa: string]: number;
  };
}

interface Ponto {
  id: string;
  programa: string;
  quantidade: number;
  descricao: string;
  data: Date;
  tipo: "GANHO" | "RESGATE" | "EXPIRACAO" | "TRANSFERENCIA"; // 🆕 Adicione TRANSFERENCIA
  valorResgate: number | null;
  usuarioId: string;
  createdAt: Date;
  updatedAt: Date;

  // Campos existentes
  valorGasto?: number | null;
  custoPorMilheiro?: number | null;
  tipoTransferencia?: string | null;
  bonusPercentual?: number | null;
  pontosOriginais?: number | null;
  pontosBonus?: number | null;

  // 🆕 Campos para transferência
  programaOrigem?: string | null;
  programaDestino?: string | null;
  pontosTransferidos?: number | null;
  custoPorMilheiroOriginal?: number | null;
}

export default function PontosPage() {
  const router = useRouter();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [modoTransferencia, setModoTransferencia] = useState(false);
  const [saldoProgramaOrigem, setSaldoProgramaOrigem] = useState(0);
  const [cpmProgramaOrigem, setCpmProgramaOrigem] = useState(0);
  const [mostrarAnalise, setMostrarAnalise] = useState(false);
  const [editandoPonto, setEditandoPonto] = useState<Ponto | null>(null);
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [isTransferenciaSheetOpen, setIsTransferenciaSheetOpen] =
    useState(false);
  const [todosPontos, setTodosPontos] = useState<Ponto[]>([]); // ← Adicionei isso
  const [resumo, setResumo] = useState<ResumoPontos>({
    totalPontos: 0,
    pontosGanhos: 0,
    pontosResgatados: 0,
    pontosExpirados: 0,
    valorTotalResgatado: 0,
    // 🆕 Adicione a análise CPM com valores padrão
    analiseCPM: {
      totalGasto: 0,
      totalPontosGanhos: 0,
      cpmGeral: 0,
      cpmPorPrograma: {},
      quantidadeRegistros: 0,
    },
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [dialogAberto, setDialogAberto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const CustomCalendar = ({
    selectedDate,
    onDateSelect,
    onClose,
  }: {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    onClose: () => void;
  }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const calendarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          calendarRef.current &&
          !calendarRef.current.contains(event.target as Node)
        ) {
          onClose();
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const goToPreviousMonth = () => {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
      );
    };

    const goToNextMonth = () => {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
      );
    };

    const getDaysInMonth = () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();

      const startingDay = firstDay.getDay();

      const days = [];

      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startingDay - 1; i >= 0; i--) {
        days.push({
          date: new Date(year, month - 1, prevMonthLastDay - i),
          isCurrentMonth: false,
          isToday: false,
        });
      }

      const today = new Date();
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        days.push({
          date,
          isCurrentMonth: true,
          isToday:
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear(),
        });
      }

      const totalCells = 42;
      const remainingDays = totalCells - days.length;
      for (let day = 1; day <= remainingDays; day++) {
        days.push({
          date: new Date(year, month + 1, day),
          isCurrentMonth: false,
          isToday: false,
        });
      }

      return days;
    };

    const days = getDaysInMonth();
    const monthNames = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];

    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    const isSameDay = (date1: Date, date2: Date) => {
      return (
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
      );
    };

    return (
      <div
        ref={calendarRef}
        className="absolute z-50 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 w-80"
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-700 rounded-lg text-white"
          >
            ‹
          </button>

          <h3 className="text-white font-semibold">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>

          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-700 rounded-lg text-white"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm text-gray-400 font-medium py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const isSelected = isSameDay(day.date, selectedDate);
            const isSelectable = day.isCurrentMonth;

            return (
              <button
                key={index}
                onClick={() => {
                  if (isSelectable) {
                    onDateSelect(day.date);
                    onClose();
                  }
                }}
                disabled={!isSelectable}
                className={`
                h-9 w-9 rounded-lg text-sm font-medium transition-colors
                ${
                  isSelected
                    ? "bg-gray-600 text-white"
                    : day.isToday
                      ? "bg-gray-700 text-white"
                      : day.isCurrentMonth
                        ? "text-white hover:bg-gray-700"
                        : "text-gray-600"
                }
                ${!isSelectable ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
              `}
              >
                {day.date.getDate()}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={() => {
              onDateSelect(new Date());
              onClose();
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
          >
            Hoje
          </button>
        </div>
      </div>
    );
  };
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
    // 🆕 Novos campos
    valorGasto: "",
    tipoTransferencia: "COMPRA",
    bonusPercentual: "",
    programaOrigem: "",
  });

  // Carrega todos os dados uma vez
  useEffect(() => {
    buscarTodosPontos();
  }, []); // ← Remove as dependências dos filtros

  // 🆕 Função para iniciar transferência
  const iniciarTransferencia = () => {
    setModoTransferencia(true);
    setFormData({
      programa: "LIVELO", // Programa destino padrão
      quantidade: "",
      descricao: "",
      tipo: "TRANSFERENCIA", // 🆕 Tipo específico para transferência
      valorResgate: "",
      data: new Date(),
      valorGasto: "",
      tipoTransferencia: "TRANSFERENCIA",
      bonusPercentual: "",
      // 🆕 Campos específicos da transferência
      programaOrigem: "LIVELO", // Programa origem padrão
    });
  };

  // 🆕 Função para cancelar transferência
  const cancelarTransferencia = () => {
    setModoTransferencia(false);
    setFormData({
      programa: "LIVELO",
      quantidade: "",
      descricao: "",
      tipo: "GANHO",
      valorResgate: "",
      data: new Date(),
      valorGasto: "",
      tipoTransferencia: "COMPRA",
      bonusPercentual: "",
      programaOrigem: "",
    });
  };
  const buscarTodosPontos = async () => {
    try {
      setCarregando(true);

      // Use o parâmetro "todos" para buscar todos os pontos sem filtro de data
      const response = await fetch(`/api/pontos?todos=true`);

      if (!response.ok) throw new Error("Erro ao buscar pontos");

      const data = await response.json();

      setTodosPontos(data.todosPontos || data.pontos);
      setPontos(data.pontos);
      setResumo(data.resumo);
    } catch (error) {
      console.error("Erro ao buscar pontos:", error);
      toast.error("Erro ao carregar pontos");
    } finally {
      setCarregando(false);
    }
  };
  // 🆕 Funções simplificadas - agora usam os dados que já vêm da API
  const calcularSaldoPorPrograma = (programa: string): number => {
    return resumo.saldosPorPrograma?.[programa] || 0;
  };

  const calcularCpmPorPrograma = (programa: string): number => {
    return resumo.cpmPorPrograma?.[programa] || 0;
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
      // 🆕 Novos campos
      valorGasto: ponto.valorGasto?.toString() || "",
      tipoTransferencia: ponto.tipoTransferencia || "COMPRA",
      bonusPercentual: ponto.bonusPercentual?.toString() || "",
      // 🆕 Campo para transferência
      programaOrigem: ponto.programaOrigem || "", // Adicione esta linha
    });
    setIsSheetOpen(true);
  };
  // Função para cancelar edição
  const cancelarEdicao = () => {
    setEditandoPonto(null);
    setModoTransferencia(false); // 🆕 Garantir que sai do modo transferência
    setFormData({
      programa: "LIVELO",
      quantidade: "",
      descricao: "",
      tipo: "GANHO",
      valorResgate: "",
      data: new Date(),
      // 🆕 Novos campos
      valorGasto: "",
      tipoTransferencia: "COMPRA",
      bonusPercentual: "",
      // 🆕 Campo para transferência
      programaOrigem: "", // Adicione esta linha
    });
    setIsSheetOpen(false);
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setEnviando(true);

  try {
    let payload: any = {
      ...formData,
      quantidade: parseInt(formData.quantidade),
      valorResgate: formData.valorResgate
        ? parseFloat(formData.valorResgate)
        : null,
      data: formData.data.toISOString(),
      valorGasto: formData.valorGasto
        ? parseFloat(formData.valorGasto)
        : null,
      tipoTransferencia: formData.tipoTransferencia,
      bonusPercentual: formData.bonusPercentual
        ? parseFloat(formData.bonusPercentual)
        : null,
    };

    if (modoTransferencia) {
      if (parseInt(formData.quantidade) > saldoProgramaOrigem) {
        throw new Error(`Saldo insuficiente em ${formData.programaOrigem}!`);
      }

      const pontosComBonus = Math.round(
        parseInt(formData.quantidade) *
          (1 + parseFloat(formData.bonusPercentual || "0") / 100)
      );

      payload = {
        ...payload,
        tipo: "TRANSFERENCIA",
        programa: formData.programa,
        programaOrigem: formData.programaOrigem,
        programaDestino: formData.programa,
        pontosTransferidos: parseInt(formData.quantidade),
        quantidade: pontosComBonus,
        custoPorMilheiroOriginal: cpmProgramaOrigem,
        descricao: `Transferência de ${parseInt(formData.quantidade).toLocaleString()} pontos de ${formData.programaOrigem} para ${formData.programa} com ${formData.bonusPercentual}% de bônus`,
        custoPorMilheiro:
          cpmProgramaOrigem > 0
            ? cpmProgramaOrigem /
              (1 + parseFloat(formData.bonusPercentual || "0") / 100)
            : null,
      };
    }

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

    // 🆕 FECHAR O SHEET ANTES DE QUALQUER OUTRA OPERAÇÃO
    setIsSheetOpen(false);

    if (editandoPonto) {
      setTodosPontos((prev) =>
        prev.map((ponto) =>
          ponto.id === editandoPonto.id ? pontoSalvo : ponto
        )
      );
      toast.success("Ponto atualizado com sucesso!");
    } else {
      setTodosPontos((prev) => [...prev, pontoSalvo]);

      if (modoTransferencia) {
        toast.success(
          `Transferência realizada com sucesso! ${pontoSalvo.quantidade.toLocaleString()} pontos creditados.`
        );
        cancelarTransferencia();
      } else {
        toast.success("Ponto registrado com sucesso!");
        cancelarEdicao();
      }
    }

  } catch (error: any) {
    console.error("Erro ao salvar ponto:", error);
    toast.error(error.message || "Erro ao salvar ponto");
    buscarTodosPontos();
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
              onClick={() => setMostrarAnalise(true)}
            >
              <TrendingUp className="w-4 h-4" />
              Análise CPM
            </Button>

            <Button
              variant={"outline"}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              onClick={() => router.push("/dashboard/pontos/metas")}
            >
              <Target className="w-4 h-4" />
              Metas
            </Button>

            {/* Sheet único para Transferência e Novo Ponto */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant={"outline"}
                  className="border-gray-700 text-gray-300 hover:bg-purple-800 hover:text-white"
                  onClick={iniciarTransferencia}
                >
                  <Gift className="w-4 h-4" />
                  Transferir Pontos
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-gray-900 border-gray-800 text-white sm:max-w-md">
                <SheetHeader>
                  <SheetTitle className="text-white">
                    {modoTransferencia ? "Transferir Pontos" : "Novo Ponto"}
                  </SheetTitle>
                  <SheetDescription className="text-gray-400">
                    {modoTransferencia
                      ? "Transfira pontos entre programas com bônus"
                      : "Registre seus ganhos, resgates ou expirações de pontos"}
                  </SheetDescription>
                </SheetHeader>

                {/* FORMULÁRIO DE TRANSFERÊNCIA */}
                {modoTransferencia ? (
                  <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    {/* SEÇÃO DE TRANSFERÊNCIA */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="programaOrigem"
                            className="text-white"
                          >
                            Programa de Origem *
                          </Label>
                          <Select
                            value={formData.programaOrigem}
                            onValueChange={(value) => {
                              setFormData({
                                ...formData,
                                programaOrigem: value,
                              });
                              // Atualizar saldo e CPM quando mudar o programa origem
                              const saldo = calcularSaldoPorPrograma(value);
                              const cpm = calcularCpmPorPrograma(value);
                              setSaldoProgramaOrigem(saldo);
                              setCpmProgramaOrigem(cpm);
                            }}
                            required
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                              <SelectValue placeholder="Selecione o programa origem" />
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

                          {formData.programaOrigem && (
                            <div className="text-sm text-gray-300">
                              <div>
                                Saldo disponível:{" "}
                                {formatarPontos(saldoProgramaOrigem)} pontos
                              </div>
                              <div>
                                CPM atual: R$ {cpmProgramaOrigem.toFixed(2)}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="programa" className="text-white">
                            Programa de Destino *
                          </Label>
                          <Select
                            value={formData.programa}
                            onValueChange={(value) =>
                              setFormData({ ...formData, programa: value })
                            }
                            required
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                              <SelectValue placeholder="Selecione o programa destino" />
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
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="quantidade" className="text-white">
                            Pontos a Transferir *
                          </Label>
                          <Input
                            id="quantidade"
                            type="number"
                            min="1"
                            max={saldoProgramaOrigem}
                            value={formData.quantidade}
                            onChange={(e) => {
                              const valor = e.target.value;
                              setFormData({ ...formData, quantidade: valor });

                              // Calcular pontos com bônus
                              if (valor && formData.bonusPercentual) {
                                const pontosComBonus = Math.round(
                                  parseInt(valor) *
                                    (1 +
                                      parseFloat(formData.bonusPercentual) /
                                        100)
                                );
                                // Atualizar a descrição automaticamente
                                setFormData((prev) => ({
                                  ...prev,
                                  descricao: `Transferência de ${parseInt(valor).toLocaleString()} pontos de ${formData.programaOrigem} para ${formData.programa} com ${formData.bonusPercentual}% de bônus`,
                                }));
                              }
                            }}
                            placeholder="Ex: 1000"
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                            required
                          />
                          {formData.quantidade &&
                            parseInt(formData.quantidade) >
                              saldoProgramaOrigem && (
                              <div className="text-red-400 text-sm">
                                ❌ Saldo insuficiente! Máximo:{" "}
                                {formatarPontos(saldoProgramaOrigem)} pontos
                              </div>
                            )}
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="bonusPercentual"
                            className="text-white"
                          >
                            Bônus na Transferência (%)
                          </Label>
                          <Input
                            id="bonusPercentual"
                            type="number"
                            step="1"
                            min="0"
                            max="100"
                            value={formData.bonusPercentual}
                            onChange={(e) => {
                              const bonus = e.target.value;
                              setFormData({
                                ...formData,
                                bonusPercentual: bonus,
                              });

                              // Recalcular quando o bônus mudar
                              if (formData.quantidade && bonus) {
                                setFormData((prev) => ({
                                  ...prev,
                                  descricao: `Transferência de ${parseInt(prev.quantidade).toLocaleString()} pontos de ${prev.programaOrigem} para ${prev.programa} com ${bonus}% de bônus`,
                                }));
                              }
                            }}
                            placeholder="Ex: 50"
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                          />
                        </div>
                      </div>

                      {/* Cálculo da transferência */}
                      {formData.quantidade &&
                        formData.bonusPercentual &&
                        formData.programaOrigem &&
                        formData.programa && (
                          <div className="p-4 bg-purple-900/30 border border-purple-700 rounded-lg">
                            <h5 className="font-medium text-white mb-2">
                              Resumo da Transferência
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-gray-300">
                                  De: {formData.programaOrigem}
                                </div>
                                <div className="text-red-400">
                                  -{" "}
                                  {parseInt(
                                    formData.quantidade
                                  ).toLocaleString()}{" "}
                                  pontos
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-300">
                                  Para: {formData.programa}
                                </div>
                                <div className="text-green-400">
                                  +{" "}
                                  {Math.round(
                                    parseInt(formData.quantidade) *
                                      (1 +
                                        parseFloat(formData.bonusPercentual) /
                                          100)
                                  ).toLocaleString()}{" "}
                                  pontos
                                </div>
                                <div className="text-purple-400 text-xs">
                                  (+{" "}
                                  {Math.round(
                                    parseInt(formData.quantidade) *
                                      (parseFloat(formData.bonusPercentual) /
                                        100)
                                  ).toLocaleString()}{" "}
                                  pontos de bônus)
                                </div>
                              </div>
                            </div>

                            {/* Cálculo do novo CPM */}
                            {cpmProgramaOrigem > 0 && (
                              <div className="mt-3 p-2 bg-gray-800 rounded">
                                <div className="text-xs text-gray-300">
                                  CPM original:{" "}
                                  <span className="text-yellow-400">
                                    R$ {cpmProgramaOrigem.toFixed(2)}
                                  </span>
                                </div>
                                <div className="text-xs text-green-400">
                                  CPM após transferência:{" "}
                                  <span className="font-bold">
                                    R${" "}
                                    {(
                                      cpmProgramaOrigem /
                                      (1 +
                                        parseFloat(formData.bonusPercentual) /
                                          100)
                                    ).toFixed(2)}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Redução de{" "}
                                  {(
                                    (parseFloat(formData.bonusPercentual) /
                                      (100 +
                                        parseFloat(formData.bonusPercentual))) *
                                    100
                                  ).toFixed(1)}
                                  % no CPM
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                      <div className="flex gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelarTransferencia}
                          className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 bg-purple-600 text-white hover:bg-purple-700"
                          disabled={
                            enviando ||
                            !formData.quantidade ||
                            !formData.programaOrigem ||
                            !formData.programa ||
                            parseInt(formData.quantidade) > saldoProgramaOrigem
                          }
                        >
                          {enviando
                            ? "Transferindo..."
                            : "Confirmar Transferência"}
                        </Button>
                      </div>
                    </div>
                  </form>
                ) : (
                  // FORMULÁRIO NORMAL DE PONTO
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-6 mt-6"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && showCalendar) {
                        e.preventDefault();
                      }
                    }}
                  >
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
                      <div className="relative">
                        <Button
                          type="button" // 🆕 IMPORTANTE: type="button" para não submitar o form
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                          onClick={() => setShowCalendar(!showCalendar)}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.data
                            ? format(formData.data, "PPP", { locale: ptBR })
                            : "Selecione a data"}
                        </Button>

                        {showCalendar && (
                          <CustomCalendar
                            selectedDate={formData.data}
                            onDateSelect={(date) => {
                              setFormData({ ...formData, data: date });
                              setShowCalendar(false); // Fecha o calendário após seleção
                            }}
                            onClose={() => setShowCalendar(false)}
                          />
                        )}
                      </div>
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
                )}
              </SheetContent>
            </Sheet>

            {/* Botão separado para Novo Ponto */}
            <Sheet>
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
                {/* Conteúdo do formulário de novo ponto */}
              </SheetContent>
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

                  {/* 🆕 SEÇÃO DE CUSTOS - AGORA APARECE IMEDIATAMENTE APÓS SELECIONAR GANHO */}
                  {formData.tipo === "GANHO" && (
                    <div className="space-y-4 p-4 border border-gray-700 rounded-lg">
                      <h4 className="font-medium text-white">
                        Informações de Custo
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="tipoTransferencia"
                            className="text-white"
                          >
                            Tipo de Aquisição
                          </Label>
                          <Select
                            value={formData.tipoTransferencia}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                tipoTransferencia: value,
                              })
                            }
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 text-white">
                              <SelectItem value="COMPRA">
                                Compra Direta
                              </SelectItem>
                              <SelectItem value="TRANSFERENCIA">
                                Transferência com Bônus
                              </SelectItem>
                              <SelectItem value="PROMOCAO">Promoção</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="valorGasto" className="text-white">
                            Valor Gasto (R$)
                          </Label>
                          <Input
                            id="valorGasto"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.valorGasto}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                valorGasto: e.target.value,
                              })
                            }
                            placeholder="Ex: 150,00"
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                          />
                        </div>
                      </div>

                      {formData.tipoTransferencia === "TRANSFERENCIA" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="bonusPercentual"
                              className="text-white"
                            >
                              Bônus (%)
                            </Label>
                            <Input
                              id="bonusPercentual"
                              type="number"
                              step="1"
                              min="0"
                              max="100"
                              value={formData.bonusPercentual}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  bonusPercentual: e.target.value,
                                })
                              }
                              placeholder="Ex: 35"
                              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                            />
                            <p className="text-xs text-gray-400">
                              Percentual de bônus na transferência
                            </p>
                          </div>

                          {formData.bonusPercentual && formData.quantidade && (
                            <div className="space-y-2">
                              <Label className="text-white">
                                Cálculo do Bônus
                              </Label>
                              <div className="p-3 bg-gray-800 rounded-md text-sm">
                                <div className="text-gray-300">
                                  Pontos originais:{" "}
                                  {Math.round(
                                    parseInt(formData.quantidade) /
                                      (1 +
                                        parseFloat(formData.bonusPercentual) /
                                          100)
                                  ).toLocaleString()}
                                </div>
                                <div className="text-green-400">
                                  +{" "}
                                  {Math.round(
                                    parseInt(formData.quantidade) *
                                      (parseFloat(formData.bonusPercentual) /
                                        100)
                                  ).toLocaleString()}{" "}
                                  pontos de bônus
                                </div>
                                <div className="text-white font-medium">
                                  Total:{" "}
                                  {parseInt(
                                    formData.quantidade
                                  ).toLocaleString()}{" "}
                                  pontos
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {formData.valorGasto && formData.quantidade && (
                        <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-md">
                          <div className="text-sm text-blue-300">
                            <strong>CPM Estimado:</strong> R${" "}
                            {(
                              parseFloat(formData.valorGasto) /
                              (parseInt(formData.quantidade) / 1000)
                            ).toFixed(2)}
                          </div>
                          <div className="text-xs text-blue-400 mt-1">
                            Custo por mil pontos: R${" "}
                            {(
                              parseFloat(formData.valorGasto) /
                              (parseInt(formData.quantidade) / 1000)
                            ).toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Campos de quantidade e descrição DEPOIS da seção de custos */}
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
                    <div className="relative">
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                        onClick={() => setShowCalendar(!showCalendar)}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.data
                          ? format(formData.data, "PPP", { locale: ptBR })
                          : "Selecione a data"}
                      </Button>

                      {showCalendar && (
                        <CustomCalendar
                          selectedDate={formData.data}
                          onDateSelect={(date) => {
                            setFormData({ ...formData, data: date });
                          }}
                          onClose={() => setShowCalendar(false)}
                        />
                      )}
                    </div>
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
                            )}{" "}
                            {ponto.valorGasto && ponto.custoPorMilheiro && (
                              <div className="text-xs bg-gray-800 px-2 py-1 rounded border border-gray-700">
                                <div className="text-purple-400 font-medium">
                                  CPM: R$ {ponto.custoPorMilheiro.toFixed(2)}
                                </div>
                                <div className="text-gray-400">
                                  Gasto: {formatarMoeda(ponto.valorGasto)}
                                </div>
                              </div>
                            )}
                            {ponto.tipoTransferencia === "TRANSFERENCIA" &&
                              ponto.bonusPercentual && (
                                <Badge
                                  variant="outline"
                                  className="bg-green-900/50 text-green-400 border-green-700"
                                >
                                  +{ponto.bonusPercentual}% bônus
                                </Badge>
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
                      {/* 🆕 SEÇÃO DE CUSTOS E TRANSFERÊNCIAS */}
                      {formData.tipo === "GANHO" && (
                        <div className="space-y-4 p-4 border border-gray-700 rounded-lg">
                          <h4 className="font-medium text-white">
                            Informações de Custo
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label
                                htmlFor="tipoTransferencia"
                                className="text-white"
                              >
                                Tipo de Aquisição
                              </Label>
                              <Select
                                value={formData.tipoTransferencia}
                                onValueChange={(value) =>
                                  setFormData({
                                    ...formData,
                                    tipoTransferencia: value,
                                  })
                                }
                              >
                                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                  <SelectItem value="COMPRA">
                                    Compra Direta
                                  </SelectItem>
                                  <SelectItem value="TRANSFERENCIA">
                                    Transferência com Bônus
                                  </SelectItem>
                                  <SelectItem value="PROMOCAO">
                                    Promoção
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label
                                htmlFor="valorGasto"
                                className="text-white"
                              >
                                Valor Gasto (R$)
                              </Label>
                              <Input
                                id="valorGasto"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.valorGasto}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    valorGasto: e.target.value,
                                  })
                                }
                                placeholder="Ex: 150,00"
                                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                              />
                            </div>
                          </div>

                          {formData.tipoTransferencia === "TRANSFERENCIA" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label
                                  htmlFor="bonusPercentual"
                                  className="text-white"
                                >
                                  Bônus (%)
                                </Label>
                                <Input
                                  id="bonusPercentual"
                                  type="number"
                                  step="1"
                                  min="0"
                                  max="100"
                                  value={formData.bonusPercentual}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      bonusPercentual: e.target.value,
                                    })
                                  }
                                  placeholder="Ex: 35"
                                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                                />
                                <p className="text-xs text-gray-400">
                                  Percentual de bônus na transferência
                                </p>
                              </div>

                              {formData.bonusPercentual &&
                                formData.quantidade && (
                                  <div className="space-y-2">
                                    <Label className="text-white">
                                      Cálculo do Bônus
                                    </Label>
                                    <div className="p-3 bg-gray-800 rounded-md text-sm">
                                      <div className="text-gray-300">
                                        Pontos originais:{" "}
                                        {Math.round(
                                          parseInt(formData.quantidade) /
                                            (1 +
                                              parseFloat(
                                                formData.bonusPercentual
                                              ) /
                                                100)
                                        ).toLocaleString()}
                                      </div>
                                      <div className="text-green-400">
                                        +{" "}
                                        {Math.round(
                                          parseInt(formData.quantidade) *
                                            (parseFloat(
                                              formData.bonusPercentual
                                            ) /
                                              100)
                                        ).toLocaleString()}{" "}
                                        pontos de bônus
                                      </div>
                                      <div className="text-white font-medium">
                                        Total:{" "}
                                        {parseInt(
                                          formData.quantidade
                                        ).toLocaleString()}{" "}
                                        pontos
                                      </div>
                                    </div>
                                  </div>
                                )}
                            </div>
                          )}

                          {formData.valorGasto && formData.quantidade && (
                            <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-md">
                              <div className="text-sm text-blue-300">
                                <strong>CPM Estimado:</strong> R${" "}
                                {(
                                  parseFloat(formData.valorGasto) /
                                  (parseInt(formData.quantidade) / 1000)
                                ).toFixed(2)}
                              </div>
                              <div className="text-xs text-blue-400 mt-1">
                                Custo por mil pontos: R${" "}
                                {(
                                  parseFloat(formData.valorGasto) /
                                  (parseInt(formData.quantidade) / 1000)
                                ).toFixed(2)}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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
                        <div className="relative">
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                            onClick={() => setShowCalendar(!showCalendar)}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.data
                              ? format(formData.data, "PPP", { locale: ptBR })
                              : "Selecione a data"}
                          </Button>

                          {showCalendar && (
                            <CustomCalendar
                              selectedDate={formData.data}
                              onDateSelect={(date) => {
                                setFormData({ ...formData, data: date });
                              }}
                              onClose={() => setShowCalendar(false)}
                            />
                          )}
                        </div>
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

      <Dialog open={mostrarAnalise} onOpenChange={setMostrarAnalise}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              Análise de Custo por Milheiro (CPM)
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Análise detalhada do custo dos seus pontos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Resumo Geral */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Resumo Geral
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {formatarMoeda(resumo.analiseCPM.totalGasto)}
                    </div>
                    <div className="text-sm text-gray-400">Total Gasto</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {formatarPontos(resumo.analiseCPM.totalPontosGanhos)}
                    </div>
                    <div className="text-sm text-gray-400">
                      Pontos com Custo
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      R$ {resumo.analiseCPM.cpmGeral.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-400">CPM Geral</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {resumo.analiseCPM.quantidadeRegistros}
                    </div>
                    <div className="text-sm text-gray-400">Registros</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CPM por Programa */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  CPM por Programa
                </h3>
                <div className="space-y-4">
                  {Object.entries(resumo.analiseCPM.cpmPorPrograma).map(
                    ([programa, dados]: [string, any]) => (
                      <div
                        key={programa}
                        className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-white">
                            {programa}
                          </div>
                          <div className="text-sm text-gray-400">
                            {formatarPontos(dados.totalPontos)} pontos •{" "}
                            {formatarMoeda(dados.totalGasto)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-lg font-bold ${
                              dados.cpm < 15
                                ? "text-green-400"
                                : dados.cpm < 30
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }`}
                          >
                            R$ {dados.cpm.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-400">CPM</div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Legenda de CPM */}
            <div className="p-4 bg-gray-800 rounded-lg">
              <h4 className="font-medium text-white mb-2">
                Interpretação do CPM
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-400">CPM ≤ R$ 15: Excelente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-yellow-400">R$ 15 - R$ 30: Bom</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-400">CPM ≥ R$ 30: Alto</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
