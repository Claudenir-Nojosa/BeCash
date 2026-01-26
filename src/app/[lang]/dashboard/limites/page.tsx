// app/dashboard/limites/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  Plus,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  MoreVertical,
  Edit,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Crown,
  Lock,
} from "lucide-react";
import { LimiteCategoria } from "../../../../../types/dashboard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loading } from "@/components/ui/loading-barrinhas";

interface Categoria {
  id: string;
  nome: string;
  tipo: string;
  cor: string;
  icone: string;
}

type PlanoUsuario = "free" | "pro" | "family";

export default function LimitesPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation("limites");
  const [limites, setLimites] = useState<LimiteCategoria[]>([]);
  const [dropdownAberto, setDropdownAberto] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregandoDados, setCarregandoDados] = useState(true); // Renomeado para carregandoDados
  const [editando, setEditando] = useState<string | null>(null);
  const [novoLimite, setNovoLimite] = useState("");
  const [salvando, setSalvando] = useState<string | null>(null);
  const [excluindoLimite, setExcluindoLimite] = useState<string | null>(null);
  const [dialogExclusaoAberto, setDialogExclusaoAberto] = useState<
    string | null
  >(null);
  const [mesSelecionado, setMesSelecionado] = useState(
    new Date().getMonth().toString(),
  );
  const [anoSelecionado, setAnoSelecionado] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [planoUsuario, setPlanoUsuario] = useState<PlanoUsuario | null>(null); // Iniciar como null
  const [carregandoPlano, setCarregandoPlano] = useState(true);

  // Carregar o plano do usuário
  useEffect(() => {
    const carregarPlanoUsuario = async () => {
      try {
        setCarregandoPlano(true);
        const response = await fetch(
          "/api/usuarios/subscription/limite-combinado",
        );

        if (response.ok) {
          const data = await response.json();
          setPlanoUsuario(data.plano);
        } else {
          console.error("Erro ao carregar plano do usuário");
          setPlanoUsuario("free");
        }
      } catch (error) {
        console.error("Erro na requisição do plano:", error);
        setPlanoUsuario("free");
      } finally {
        setCarregandoPlano(false);
      }
    };

    carregarPlanoUsuario();
  }, []);

  // Carregar dados quando o plano for carregado e for diferente de free
  useEffect(() => {
    if (planoUsuario && planoUsuario !== "free") {
      carregarDados();
    } else if (planoUsuario === "free") {
      // Se for free, não precisa carregar dados, apenas mostrar mensagem educativa
      setCarregandoDados(false);
    }
  }, [planoUsuario]);

  // MESES localizados
  const MESES =
    i18n.language === "pt"
      ? [
          { value: "0", label: t("meses.janeiro") },
          { value: "1", label: t("meses.fevereiro") },
          { value: "2", label: t("meses.marco") },
          { value: "3", label: t("meses.abril") },
          { value: "4", label: t("meses.maio") },
          { value: "5", label: t("meses.junho") },
          { value: "6", label: t("meses.julho") },
          { value: "7", label: t("meses.agosto") },
          { value: "8", label: t("meses.setembro") },
          { value: "9", label: t("meses.outubro") },
          { value: "10", label: t("meses.novembro") },
          { value: "11", label: t("meses.dezembro") },
        ]
      : [
          { value: "0", label: t("meses.janeiro") },
          { value: "1", label: t("meses.fevereiro") },
          { value: "2", label: t("meses.marco") },
          { value: "3", label: t("meses.abril") },
          { value: "4", label: t("meses.maio") },
          { value: "5", label: t("meses.junho") },
          { value: "6", label: t("meses.julho") },
          { value: "7", label: t("meses.agosto") },
          { value: "8", label: t("meses.setembro") },
          { value: "9", label: t("meses.outubro") },
          { value: "10", label: t("meses.novembro") },
          { value: "11", label: t("meses.dezembro") },
        ];

  const carregarDados = async () => {
    try {
      setCarregandoDados(true);
      const [limitesRes, categoriasRes] = await Promise.all([
        fetch("/api/dashboard/limites"),
        fetch("/api/categorias?tipo=DESPESA"),
      ]);

      if (!limitesRes.ok || !categoriasRes.ok) {
        throw new Error(t("mensagens.erroCarregarDados"));
      }

      const [limitesData, categoriasData] = await Promise.all([
        limitesRes.json(),
        categoriasRes.json(),
      ]);

      setLimites(limitesData);
      setCategorias(categoriasData);
    } catch (error) {
      console.error(t("mensagens.erroCarregarDados"), error);
      toast.error(t("mensagens.erroCarregarLimites"));
    } finally {
      setCarregandoDados(false);
    }
  };

  // Funções restantes permanecem as mesmas...
  const salvarLimite = async (categoriaId: string) => {
    if (!novoLimite || parseFloat(novoLimite) <= 0) {
      toast.error(t("validacao.valorInvalido"));
      return;
    }

    setSalvando(categoriaId);

    try {
      const response = await fetch("/api/dashboard/limites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoriaId,
          limiteMensal: parseFloat(novoLimite),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t("mensagens.erroSalvarLimite"));
      }

      const limiteSalvo = await response.json();

      setLimites((prev) => [...prev, limiteSalvo]);

      toast.success(t("mensagens.limiteDefinidoSucesso"));
      setEditando(null);
      setNovoLimite("");
    } catch (error) {
      console.error(t("mensagens.erroSalvarLimite"), error);
      toast.error(t("mensagens.erroSalvarLimite"));
      carregarDados();
    } finally {
      setSalvando(null);
    }
  };

  const ajustarLimite = async (limiteId: string, novoValor: number) => {
    if (!novoValor || novoValor <= 0) {
      toast.error(t("validacao.valorInvalido"));
      return;
    }

    setSalvando(limiteId);

    try {
      const response = await fetch(`/api/dashboard/limites/${limiteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limiteMensal: novoValor,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t("mensagens.erroAjustarLimite"));
      }

      const limiteAtualizado = await response.json();

      setLimites((prev) =>
        prev.map((limite) =>
          limite.id === limiteId ? limiteAtualizado : limite,
        ),
      );

      toast.success(t("mensagens.limiteAjustadoSucesso"));
      setEditando(null);
      setNovoLimite("");
    } catch (error) {
      console.error(t("mensagens.erroAjustarLimite"), error);
      toast.error(t("mensagens.erroAjustarLimite"));
      carregarDados();
    } finally {
      setSalvando(null);
    }
  };

  const excluirLimite = async (limiteId: string) => {
    setExcluindoLimite(limiteId);

    const limiteParaExcluir = limites.find((limite) => limite.id === limiteId);

    try {
      setDialogExclusaoAberto(null);
      setLimites((prev) => prev.filter((limite) => limite.id !== limiteId));

      const response = await fetch(`/api/dashboard/limites/${limiteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t("mensagens.erroExcluirLimite"));
      }

      toast.success(t("mensagens.limiteExcluidoSucesso"));
    } catch (error) {
      console.error(t("mensagens.erroExcluirLimite"), error);
      toast.error(t("mensagens.erroExcluirLimite"));

      if (limiteParaExcluir) {
        setLimites((prev) => [...prev, limiteParaExcluir]);
      }
    } finally {
      setExcluindoLimite(null);
    }
  };

  const formatarMoeda = (valor: number) => {
    const locale = i18n.language === "pt" ? "pt-BR" : "en-US";
    const currency = i18n.language === "pt" ? "BRL" : "USD";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(valor);
  };

  const obterStatusLimite = (limite: LimiteCategoria) => {
    const percentual = (limite.gastoAtual / limite.limiteMensal) * 100;

    if (percentual > 100) {
      return {
        texto: t("status.estourado"),
        cor: "text-red-600 dark:text-red-400",
        bgCor: "bg-red-50 dark:bg-red-900/50",
        borderCor: "border-red-300 dark:border-red-700",
        icone: <AlertTriangle className="h-4 w-4" />,
      };
    }

    if (percentual > 80) {
      return {
        texto: t("status.proximoLimite"),
        cor: "text-amber-600 dark:text-yellow-400",
        bgCor: "bg-amber-50 dark:bg-yellow-900/50",
        borderCor: "border-amber-300 dark:border-yellow-700",
        icone: <Clock className="h-4 w-4" />,
      };
    }

    return {
      texto: t("status.dentroLimite"),
      cor: "text-emerald-600 dark:text-green-400",
      bgCor: "bg-emerald-50 dark:bg-green-900/50",
      borderCor: "border-emerald-300 dark:border-green-700",
      icone: <CheckCircle2 className="h-4 w-4" />,
    };
  };

  const categoriasSemLimite = categorias.filter(
    (cat) => !limites.some((limite) => limite.categoriaId === cat.id),
  );

  const obterNomeMesAbreviado = (mes: string) => {
    const mesesAbreviados =
      i18n.language === "pt"
        ? [
            t("mesesAbreviados.jan"),
            t("mesesAbreviados.fev"),
            t("mesesAbreviados.mar"),
            t("mesesAbreviados.abr"),
            t("mesesAbreviados.mai"),
            t("mesesAbreviados.jun"),
            t("mesesAbreviados.jul"),
            t("mesesAbreviados.ago"),
            t("mesesAbreviados.set"),
            t("mesesAbreviados.out"),
            t("mesesAbreviados.nov"),
            t("mesesAbreviados.dez"),
          ]
        : [
            t("mesesAbreviados.jan"),
            t("mesesAbreviados.fev"),
            t("mesesAbreviados.mar"),
            t("mesesAbreviados.abr"),
            t("mesesAbreviados.mai"),
            t("mesesAbreviados.jun"),
            t("mesesAbreviados.jul"),
            t("mesesAbreviados.ago"),
            t("mesesAbreviados.set"),
            t("mesesAbreviados.out"),
            t("mesesAbreviados.nov"),
            t("mesesAbreviados.dez"),
          ];
    return mesesAbreviados[Number(mes)] || t("mesesAbreviados.mes");
  };

  // Mostrar loading enquanto carrega o plano
  if (carregandoPlano || planoUsuario === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Se é plano free, mostrar mensagem educativa
  if (planoUsuario === "free") {
    return (
      <div className="h-full flex flex-col overflow-hidden p-4 sm:p-6">
        <div className="max-w-4xl mx-auto w-full h-full flex flex-col gap-4 sm:gap-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 flex-shrink-0"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-gray-500 dark:to-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">
                  {t("titulos.limites")}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 truncate">
                  {t("subtitulos.controleGastos")}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Mensagem de plano necessário */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex-1 min-h-0"
          >
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm flex flex-col h-full">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 md:p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center mb-4 sm:mb-6">
                    <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                    Controle de Limites de Gastos
                  </h2>

                  <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 max-w-md">
                    Defina limites mensais para suas categorias de despesas e
                    mantenha suas finanças sob controle. Receba alertas quando
                    estiver próximo de exceder seus orçamentos.
                  </p>

                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 max-w-lg w-full">
                    <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
                      <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-blue-800 dark:text-blue-300">
                        Seu plano atual: Grátis
                      </span>
                    </div>

                    <ul className="space-y-2 text-left text-sm sm:text-base">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          Defina limites mensais por categoria
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          Acompanhamento visual em tempo real
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          Alertas quando estiver próximo do limite
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          Histórico de gastos e limites
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button
                      onClick={() => router.push("/dashboard/perfil")}
                      className="bg-gradient-to-r from-[#00cfec] to-[#007cca] text-white hover:opacity-90"
                    >
                      <Crown className="mr-2 h-4 w-4" />
                      Fazer Upgrade para Pro
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Se é plano pro ou family, mostrar loading enquanto carrega os dados
  if (carregandoDados) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Se é plano pro ou family, mostrar a página normal
  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 bg-white dark:bg-transparent">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Cabeçalho */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4"
        >
          <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">
                {t("titulos.limites")}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base truncate">
                {t("subtitulos.controleGastos")}
              </p>
            </div>
          </div>

          {/* Seletor de Mês no Header */}
          <div className="w-full lg:w-auto">
            <div className="flex items-center justify-between lg:justify-end gap-2 sm:gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex items-center justify-center gap-1 sm:gap-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shadow-sm min-w-0 flex-1 lg:flex-none"
              >
                {/* Seta esquerda */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    let novoMes = parseInt(mesSelecionado) - 1;
                    let novoAno = parseInt(anoSelecionado);
                    if (novoMes < 0) {
                      novoMes = 11;
                      novoAno = novoAno - 1;
                    }
                    setMesSelecionado(novoMes.toString());
                    setAnoSelecionado(novoAno.toString());
                  }}
                  className="h-6 w-6 sm:h-7 sm:w-7 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
                >
                  <ChevronLeft className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </Button>

                {/* Mês atual */}
                <div className="flex justify-center items-center min-w-[70px] sm:min-w-20 mx-1 sm:mx-2">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate text-center w-full">
                    {obterNomeMesAbreviado(mesSelecionado)}/{anoSelecionado}
                  </p>
                </div>

                {/* Seta direita */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    let novoMes = parseInt(mesSelecionado) + 1;
                    let novoAno = parseInt(anoSelecionado);
                    if (novoMes > 11) {
                      novoMes = 0;
                      novoAno = novoAno + 1;
                    }
                    setMesSelecionado(novoMes.toString());
                    setAnoSelecionado(novoAno.toString());
                  }}
                  className="h-6 w-6 sm:h-7 sm:w-7 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
                >
                  <ChevronRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Cards de Limites Existentes */}
        <div className="space-y-3 sm:space-y-4">
          <AnimatePresence mode="wait">
            {limites.length === 0 ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl">
                  <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.2,
                        type: "spring",
                        stiffness: 200,
                      }}
                    >
                      <Target className="h-10 w-10 sm:h-14 sm:w-14 text-gray-300 dark:text-gray-600 mb-3" />
                    </motion.div>
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                    >
                      {t("mensagens.nenhumLimiteDefinido")}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-gray-600 dark:text-gray-400 text-sm mb-6 max-w-xs sm:max-w-md"
                    >
                      {t("mensagens.iniciarLimites")}
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Button
                        onClick={() => {
                          const primeiraCategoria = categoriasSemLimite[0];
                          if (primeiraCategoria) {
                            setEditando(primeiraCategoria.id);
                            setNovoLimite("");
                          }
                        }}
                        className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-5 py-2.5 text-sm"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {t("botoes.criarPrimeiroLimite")}
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              limites.map((limite, index) => {
                const percentual =
                  (limite.gastoAtual / limite.limiteMensal) * 100;
                const status = obterStatusLimite(limite);
                const valorSlider = Math.min(percentual, 100);

                return (
                  <motion.div
                    key={limite.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    layout
                  >
                    <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl overflow-hidden">
                      <CardContent className="p-4 sm:p-6">
                        {/* Cabeçalho com categoria e badge */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                delay: 0.1 + index * 0.05,
                                type: "spring",
                              }}
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: limite.categoria.cor }}
                            />
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">
                                {limite.categoria.nome}
                              </h3>
                            </div>
                          </div>

                          {/* Badge de status e menu mobile */}
                          <div className="flex items-center gap-2 ml-2">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.2 + index * 0.05 }}
                            >
                              <Badge
                                variant="outline"
                                className={`${status.bgCor} ${status.cor} ${status.borderCor} text-xs px-2 py-0.5 hidden xs:inline-flex`}
                              >
                                <div className="flex items-center gap-1">
                                  {status.icone}
                                  <span className="truncate max-w-[80px]">
                                    {status.texto}
                                  </span>
                                </div>
                              </Badge>
                            </motion.div>

                            {/* Menu mobile - sempre visível */}
                            <DropdownMenu
                              open={dropdownAberto === limite.id}
                              onOpenChange={(open) => {
                                if (!open) setDropdownAberto(null);
                              }}
                            >
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDropdownAberto(limite.id)}
                                  className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white shadow-lg w-44"
                                onInteractOutside={() =>
                                  setDropdownAberto(null)
                                }
                                onEscapeKeyDown={() => setDropdownAberto(null)}
                              >
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditando(limite.id);
                                    setNovoLimite(
                                      limite.limiteMensal.toString(),
                                    );
                                    setDropdownAberto(null);
                                  }}
                                  className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm px-3 py-2"
                                >
                                  <Edit className="h-4 w-4" />
                                  {t("menu.ajustarLimite")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setDialogExclusaoAberto(limite.id);
                                    setDropdownAberto(null);
                                  }}
                                  className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer text-sm px-3 py-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {t("menu.excluirLimite")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Badge de status mobile (abaixo do cabeçalho) */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          className="mb-4 xs:hidden"
                        >
                          <Badge
                            variant="outline"
                            className={`${status.bgCor} ${status.cor} ${status.borderCor} text-xs px-2 py-1 w-full justify-center`}
                          >
                            <div className="flex items-center gap-1">
                              {status.icone}
                              <span>{status.texto}</span>
                            </div>
                          </Badge>
                        </motion.div>

                        {/* Slider */}
                        <motion.div
                          initial={{ opacity: 0, scaleX: 0 }}
                          animate={{ opacity: 1, scaleX: 1 }}
                          transition={{
                            delay: 0.4 + index * 0.05,
                            duration: 0.5,
                          }}
                          className="space-y-2 mb-4"
                        >
                          <div className="relative w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${valorSlider}%` }}
                              transition={{
                                delay: 0.5 + index * 0.05,
                                duration: 0.8,
                                ease: "easeOut",
                              }}
                              className={`absolute top-0 left-0 h-full rounded-full ${
                                percentual > 100
                                  ? "bg-red-500"
                                  : percentual > 80
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                              }`}
                            />
                          </div>

                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400 font-medium truncate">
                              {formatarMoeda(limite.gastoAtual)}
                            </span>
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                delay: 0.6 + index * 0.05,
                                type: "spring",
                              }}
                              className="font-bold text-gray-900 dark:text-white mx-2 flex-shrink-0 px-2"
                            >
                              {percentual.toFixed(0)}%
                            </motion.span>
                            <span className="text-gray-600 dark:text-gray-400 font-medium truncate text-right">
                              {formatarMoeda(limite.limiteMensal)}
                            </span>
                          </div>
                        </motion.div>

                        {/* Informações financeiras */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + index * 0.05 }}
                          className="grid grid-cols-2 gap-3 text-sm mb-4"
                        >
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                            <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">
                              {t("limites.gasto")}
                            </div>
                            <div className="font-semibold text-gray-900 dark:text-white truncate">
                              {formatarMoeda(limite.gastoAtual)}
                            </div>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                            <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">
                              {t("limites.restante")}
                            </div>
                            <div className="font-semibold text-gray-900 dark:text-white truncate">
                              {formatarMoeda(
                                limite.limiteMensal - limite.gastoAtual,
                              )}
                            </div>
                          </div>
                        </motion.div>

                        {/* Modal de edição inline */}
                        <AnimatePresence>
                          {editando === limite.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 overflow-hidden"
                            >
                              <div className="space-y-4">
                                <div>
                                  <Label
                                    htmlFor="ajuste-limite"
                                    className="text-gray-700 dark:text-white text-sm mb-2 block"
                                  >
                                    {t("formularios.novoValorLimite")}
                                  </Label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                      {i18n.language === "pt" ? "R$" : "$"}
                                    </span>
                                    <Input
                                      id="ajuste-limite"
                                      type="number"
                                      step="0.01"
                                      min="0.01"
                                      placeholder="0,00"
                                      value={novoLimite}
                                      onChange={(e) =>
                                        setNovoLimite(e.target.value)
                                      }
                                      className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white h-11 text-base"
                                      autoFocus
                                    />
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => setEditando(null)}
                                    className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                  >
                                    {t("botoes.cancelar")}
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      ajustarLimite(
                                        limite.id,
                                        parseFloat(novoLimite),
                                      )
                                    }
                                    disabled={
                                      salvando === limite.id || !novoLimite
                                    }
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-green-600 dark:hover:bg-green-700 text-white"
                                  >
                                    {salvando === limite.id
                                      ? t("botoes.salvando")
                                      : t("botoes.salvar")}
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Seção para adicionar novos limites */}
        <AnimatePresence>
          {categoriasSemLimite.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-gray-900 dark:text-white text-lg sm:text-xl">
                    {t("titulos.adicionarNovoLimite")}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
                    {t("subtitulos.selecioneCategoria")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="space-y-2 sm:space-y-3">
                    {categoriasSemLimite.map((categoria, index) => (
                      <motion.div
                        key={categoria.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-700 transition-colors bg-gray-50/50 dark:bg-gray-800/50 gap-3"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              delay: 0.1 + index * 0.05,
                              type: "spring",
                            }}
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: categoria.cor }}
                          />
                          <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                            {categoria.nome}
                          </span>
                        </div>

                        <AnimatePresence mode="wait">
                          {editando === categoria.id ? (
                            <motion.div
                              key="editing"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto"
                            >
                              <div className="relative w-full sm:w-32">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                                  {i18n.language === "pt" ? "R$" : "$"}
                                </span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  placeholder="0,00"
                                  value={novoLimite}
                                  onChange={(e) =>
                                    setNovoLimite(e.target.value)
                                  }
                                  className="pl-8 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm sm:text-base h-9 w-full"
                                />
                              </div>
                              <div className="flex gap-2 w-full sm:w-auto">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => salvarLimite(categoria.id)}
                                  disabled={salvando === categoria.id}
                                  className="bg-emerald-600 hover:bg-emerald-700 dark:bg-green-600 dark:hover:bg-green-700 text-white border-emerald-600 dark:border-green-600 flex-1 sm:flex-none"
                                >
                                  {salvando === categoria.id
                                    ? t("botoes.salvando")
                                    : t("botoes.salvar")}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditando(null)}
                                  className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex-1 sm:flex-none"
                                >
                                  {t("botoes.cancelar")}
                                </Button>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="not-editing"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditando(categoria.id);
                                  setNovoLimite("");
                                }}
                                className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white w-full sm:w-auto"
                              >
                                <Plus className="mr-2 h-3 w-3" />
                                {t("botoes.definirLimite")}
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      <AnimatePresence>
        {dialogExclusaoAberto && (
          <Dialog
            open={!!dialogExclusaoAberto}
            onOpenChange={(open) => {
              if (!open) {
                setDialogExclusaoAberto(null);
              }
            }}
          >
            <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white max-w-[95vw] sm:max-w-md mx-2 sm:mx-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <DialogHeader>
                  <DialogTitle className="text-gray-900 dark:text-white text-lg sm:text-xl">
                    {t("dialogs.excluirLimiteTitulo")}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                    {t("dialogs.excluirLimiteDescricao")}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setDialogExclusaoAberto(null)}
                    className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 order-2 sm:order-1"
                  >
                    {t("botoes.cancelar")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => excluirLimite(dialogExclusaoAberto!)}
                    disabled={!!excluindoLimite}
                    className="order-1 sm:order-2"
                  >
                    {excluindoLimite
                      ? t("botoes.excluindo")
                      : t("botoes.confirmar")}
                  </Button>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
