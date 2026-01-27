// app/dashboard/limites/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { getFallback } from "@/lib/i18nFallback";

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
  const params = useParams();
  const { t, i18n } = useTranslation("limites");
  const currentLang = (params?.lang as string) || "pt";

  // Função auxiliar para obter tradução com fallback
  const getTranslation = (key: string) => {
    // Primeiro tenta usar o i18n
    const translation = t(key);
    if (translation && translation !== key) {
      return translation;
    }

    // Fallback manual baseado nas chaves que você tem nos arquivos JSON
    switch (key) {
      // Títulos
      case "titulos.limites":
        return getFallback(currentLang, "Limites", "Limits");
      case "titulos.adicionarNovoLimite":
        return getFallback(
          currentLang,
          "Adicionar Novo Limite",
          "Add New Limit",
        );

      // Subtítulos
      case "subtitulos.controleGastos":
        return getFallback(
          currentLang,
          "Controle seus gastos por categoria",
          "Control your spending by category",
        );
      case "subtitulos.selecioneCategoria":
        return getFallback(
          currentLang,
          "Selecione uma categoria para definir um limite mensal",
          "Select a category to set a monthly limit",
        );

      // Mensagens
      case "mensagens.erroCarregarDados":
        return getFallback(
          currentLang,
          "Erro ao carregar dados",
          "Error loading data",
        );
      case "mensagens.erroCarregarLimites":
        return getFallback(
          currentLang,
          "Erro ao carregar limites e categorias",
          "Error loading limits and categories",
        );
      case "mensagens.erroSalvarLimite":
        return getFallback(
          currentLang,
          "Erro ao salvar limite",
          "Error saving limit",
        );
      case "mensagens.erroAjustarLimite":
        return getFallback(
          currentLang,
          "Erro ao ajustar limite",
          "Error adjusting limit",
        );
      case "mensagens.erroExcluirLimite":
        return getFallback(
          currentLang,
          "Erro ao excluir limite",
          "Error deleting limit",
        );
      case "mensagens.limiteDefinidoSucesso":
        return getFallback(
          currentLang,
          "Limite definido com sucesso",
          "Limit set successfully",
        );
      case "mensagens.limiteAjustadoSucesso":
        return getFallback(
          currentLang,
          "Limite ajustado com sucesso",
          "Limit adjusted successfully",
        );
      case "mensagens.limiteExcluidoSucesso":
        return getFallback(
          currentLang,
          "Limite excluído com sucesso",
          "Limit deleted successfully",
        );
      case "mensagens.nenhumLimiteDefinido":
        return getFallback(
          currentLang,
          "Nenhum limite definido",
          "No limits defined",
        );
      case "mensagens.iniciarLimites":
        return getFallback(
          currentLang,
          "Comece definindo limites para suas categorias de despesas",
          "Start by setting limits for your expense categories",
        );

      // Validação
      case "validacao.valorInvalido":
        return getFallback(
          currentLang,
          "Digite um valor válido",
          "Enter a valid value",
        );

      // Status
      case "status.estourado":
        return getFallback(currentLang, "Estourado", "Exceeded");
      case "status.proximoLimite":
        return getFallback(currentLang, "Próximo do limite", "Near limit");
      case "status.dentroLimite":
        return getFallback(currentLang, "Dentro do limite", "Within limit");

      // Limites
      case "limites.gasto":
        return getFallback(currentLang, "Gasto", "Spent");
      case "limites.limite":
        return getFallback(currentLang, "Limite", "Limit");
      case "limites.restante":
        return getFallback(currentLang, "Restante", "Remaining");

      // Botões
      case "botoes.criarPrimeiroLimite":
        return getFallback(
          currentLang,
          "Criar Primeiro Limite",
          "Create First Limit",
        );
      case "botoes.salvar":
        return getFallback(currentLang, "Salvar", "Save");
      case "botoes.salvando":
        return getFallback(currentLang, "Salvando...", "Saving...");
      case "botoes.cancelar":
        return getFallback(currentLang, "Cancelar", "Cancel");
      case "botoes.excluindo":
        return getFallback(currentLang, "Excluindo...", "Deleting...");
      case "botoes.confirmar":
        return getFallback(currentLang, "Confirmar", "Confirm");
      case "botoes.definirLimite":
        return getFallback(currentLang, "Definir Limite", "Set Limit");

      // Menu
      case "menu.ajustarLimite":
        return getFallback(currentLang, "Ajustar Limite", "Adjust Limit");
      case "menu.excluirLimite":
        return getFallback(currentLang, "Excluir Limite", "Delete Limit");

      // Formulários
      case "formularios.novoValorLimite":
        return getFallback(
          currentLang,
          "Novo valor do limite",
          "New limit value",
        );

      // Dialogs
      case "dialogs.excluirLimiteTitulo":
        return getFallback(currentLang, "Excluir Limite", "Delete Limit");
      case "dialogs.excluirLimiteDescricao":
        return getFallback(
          currentLang,
          "Tem certeza que deseja excluir o limite desta categoria? Esta ação não pode ser desfeita.",
          "Are you sure you want to delete the limit for this category? This action cannot be undone.",
        );

      // Meses completos
      case "meses.janeiro":
        return getFallback(currentLang, "Janeiro", "January");
      case "meses.fevereiro":
        return getFallback(currentLang, "Fevereiro", "February");
      case "meses.marco":
        return getFallback(currentLang, "Março", "March");
      case "meses.abril":
        return getFallback(currentLang, "Abril", "April");
      case "meses.maio":
        return getFallback(currentLang, "Maio", "May");
      case "meses.junho":
        return getFallback(currentLang, "Junho", "June");
      case "meses.julho":
        return getFallback(currentLang, "Julho", "July");
      case "meses.agosto":
        return getFallback(currentLang, "Agosto", "August");
      case "meses.setembro":
        return getFallback(currentLang, "Setembro", "September");
      case "meses.outubro":
        return getFallback(currentLang, "Outubro", "October");
      case "meses.novembro":
        return getFallback(currentLang, "Novembro", "November");
      case "meses.dezembro":
        return getFallback(currentLang, "Dezembro", "December");

      // Meses abreviados
      case "mesesAbreviados.jan":
        return getFallback(currentLang, "Jan", "Jan");
      case "mesesAbreviados.fev":
        return getFallback(currentLang, "Fev", "Feb");
      case "mesesAbreviados.mar":
        return getFallback(currentLang, "Mar", "Mar");
      case "mesesAbreviados.abr":
        return getFallback(currentLang, "Abr", "Apr");
      case "mesesAbreviados.mai":
        return getFallback(currentLang, "Mai", "May");
      case "mesesAbreviados.jun":
        return getFallback(currentLang, "Jun", "Jun");
      case "mesesAbreviados.jul":
        return getFallback(currentLang, "Jul", "Jul");
      case "mesesAbreviados.ago":
        return getFallback(currentLang, "Ago", "Aug");
      case "mesesAbreviados.set":
        return getFallback(currentLang, "Set", "Sep");
      case "mesesAbreviados.out":
        return getFallback(currentLang, "Out", "Oct");
      case "mesesAbreviados.nov":
        return getFallback(currentLang, "Nov", "Nov");
      case "mesesAbreviados.dez":
        return getFallback(currentLang, "Dez", "Dec");
      case "mesesAbreviados.mes":
        return getFallback(currentLang, "Mês", "Month");

      default:
        return key;
    }
  };

  // Criar um objeto de traduções para fácil acesso
  const translations = {
    titulos: {
      limites: getTranslation("titulos.limites"),
      adicionarNovoLimite: getTranslation("titulos.adicionarNovoLimite"),
    },
    subtitulos: {
      controleGastos: getTranslation("subtitulos.controleGastos"),
      selecioneCategoria: getTranslation("subtitulos.selecioneCategoria"),
    },
    mensagens: {
      erroCarregarDados: getTranslation("mensagens.erroCarregarDados"),
      erroCarregarLimites: getTranslation("mensagens.erroCarregarLimites"),
      erroSalvarLimite: getTranslation("mensagens.erroSalvarLimite"),
      erroAjustarLimite: getTranslation("mensagens.erroAjustarLimite"),
      erroExcluirLimite: getTranslation("mensagens.erroExcluirLimite"),
      limiteDefinidoSucesso: getTranslation("mensagens.limiteDefinidoSucesso"),
      limiteAjustadoSucesso: getTranslation("mensagens.limiteAjustadoSucesso"),
      limiteExcluidoSucesso: getTranslation("mensagens.limiteExcluidoSucesso"),
      nenhumLimiteDefinido: getTranslation("mensagens.nenhumLimiteDefinido"),
      iniciarLimites: getTranslation("mensagens.iniciarLimites"),
    },
    validacao: {
      valorInvalido: getTranslation("validacao.valorInvalido"),
    },
    status: {
      estourado: getTranslation("status.estourado"),
      proximoLimite: getTranslation("status.proximoLimite"),
      dentroLimite: getTranslation("status.dentroLimite"),
    },
    limites: {
      gasto: getTranslation("limites.gasto"),
      limite: getTranslation("limites.limite"),
      restante: getTranslation("limites.restante"),
    },
    botoes: {
      criarPrimeiroLimite: getTranslation("botoes.criarPrimeiroLimite"),
      salvar: getTranslation("botoes.salvar"),
      salvando: getTranslation("botoes.salvando"),
      cancelar: getTranslation("botoes.cancelar"),
      excluindo: getTranslation("botoes.excluindo"),
      confirmar: getTranslation("botoes.confirmar"),
      definirLimite: getTranslation("botoes.definirLimite"),
    },
    menu: {
      ajustarLimite: getTranslation("menu.ajustarLimite"),
      excluirLimite: getTranslation("menu.excluirLimite"),
    },
    formularios: {
      novoValorLimite: getTranslation("formularios.novoValorLimite"),
    },
    dialogs: {
      excluirLimiteTitulo: getTranslation("dialogs.excluirLimiteTitulo"),
      excluirLimiteDescricao: getTranslation("dialogs.excluirLimiteDescricao"),
    },
    meses: {
      janeiro: getTranslation("meses.janeiro"),
      fevereiro: getTranslation("meses.fevereiro"),
      marco: getTranslation("meses.marco"),
      abril: getTranslation("meses.abril"),
      maio: getTranslation("meses.maio"),
      junho: getTranslation("meses.junho"),
      julho: getTranslation("meses.julho"),
      agosto: getTranslation("meses.agosto"),
      setembro: getTranslation("meses.setembro"),
      outubro: getTranslation("meses.outubro"),
      novembro: getTranslation("meses.novembro"),
      dezembro: getTranslation("meses.dezembro"),
    },
    mesesAbreviados: {
      jan: getTranslation("mesesAbreviados.jan"),
      fev: getTranslation("mesesAbreviados.fev"),
      mar: getTranslation("mesesAbreviados.mar"),
      abr: getTranslation("mesesAbreviados.abr"),
      mai: getTranslation("mesesAbreviados.mai"),
      jun: getTranslation("mesesAbreviados.jun"),
      jul: getTranslation("mesesAbreviados.jul"),
      ago: getTranslation("mesesAbreviados.ago"),
      set: getTranslation("mesesAbreviados.set"),
      out: getTranslation("mesesAbreviados.out"),
      nov: getTranslation("mesesAbreviados.nov"),
      dez: getTranslation("mesesAbreviados.dez"),
      mes: getTranslation("mesesAbreviados.mes"),
    },
  };

  const [limites, setLimites] = useState<LimiteCategoria[]>([]);
  const [dropdownAberto, setDropdownAberto] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
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
  const [planoUsuario, setPlanoUsuario] = useState<PlanoUsuario | null>(null);
  const [carregandoPlano, setCarregandoPlano] = useState(true);

  // MESES localizados usando as traduções
  const MESES = [
    { value: "0", label: translations.meses.janeiro },
    { value: "1", label: translations.meses.fevereiro },
    { value: "2", label: translations.meses.marco },
    { value: "3", label: translations.meses.abril },
    { value: "4", label: translations.meses.maio },
    { value: "5", label: translations.meses.junho },
    { value: "6", label: translations.meses.julho },
    { value: "7", label: translations.meses.agosto },
    { value: "8", label: translations.meses.setembro },
    { value: "9", label: translations.meses.outubro },
    { value: "10", label: translations.meses.novembro },
    { value: "11", label: translations.meses.dezembro },
  ];

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
      setCarregandoDados(false);
    }
  }, [planoUsuario]);

  const carregarDados = async () => {
    try {
      setCarregandoDados(true);
      const [limitesRes, categoriasRes] = await Promise.all([
        fetch("/api/dashboard/limites"),
        fetch("/api/categorias?tipo=DESPESA"),
      ]);

      if (!limitesRes.ok || !categoriasRes.ok) {
        throw new Error(translations.mensagens.erroCarregarDados);
      }

      const [limitesData, categoriasData] = await Promise.all([
        limitesRes.json(),
        categoriasRes.json(),
      ]);

      setLimites(limitesData);
      setCategorias(categoriasData);
    } catch (error) {
      console.error(translations.mensagens.erroCarregarDados, error);
      toast.error(translations.mensagens.erroCarregarLimites);
    } finally {
      setCarregandoDados(false);
    }
  };

  const salvarLimite = async (categoriaId: string) => {
    if (!novoLimite || parseFloat(novoLimite) <= 0) {
      toast.error(translations.validacao.valorInvalido);
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
        throw new Error(error.error || translations.mensagens.erroSalvarLimite);
      }

      const limiteSalvo = await response.json();

      setLimites((prev) => [...prev, limiteSalvo]);

      toast.success(translations.mensagens.limiteDefinidoSucesso);
      setEditando(null);
      setNovoLimite("");
    } catch (error) {
      console.error(translations.mensagens.erroSalvarLimite, error);
      toast.error(translations.mensagens.erroSalvarLimite);
      carregarDados();
    } finally {
      setSalvando(null);
    }
  };

  const ajustarLimite = async (limiteId: string, novoValor: number) => {
    if (!novoValor || novoValor <= 0) {
      toast.error(translations.validacao.valorInvalido);
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
        throw new Error(
          error.error || translations.mensagens.erroAjustarLimite,
        );
      }

      const limiteAtualizado = await response.json();

      setLimites((prev) =>
        prev.map((limite) =>
          limite.id === limiteId ? limiteAtualizado : limite,
        ),
      );

      toast.success(translations.mensagens.limiteAjustadoSucesso);
      setEditando(null);
      setNovoLimite("");
    } catch (error) {
      console.error(translations.mensagens.erroAjustarLimite, error);
      toast.error(translations.mensagens.erroAjustarLimite);
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
        throw new Error(
          error.error || translations.mensagens.erroExcluirLimite,
        );
      }

      toast.success(translations.mensagens.limiteExcluidoSucesso);
    } catch (error) {
      console.error(translations.mensagens.erroExcluirLimite, error);
      toast.error(translations.mensagens.erroExcluirLimite);

      if (limiteParaExcluir) {
        setLimites((prev) => [...prev, limiteParaExcluir]);
      }
    } finally {
      setExcluindoLimite(null);
    }
  };

  const formatarMoeda = (valor: number) => {
    const locale = currentLang === "pt" ? "pt-BR" : "en-US";
    const currency = currentLang === "pt" ? "BRL" : "USD";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(valor);
  };

  const obterStatusLimite = (limite: LimiteCategoria) => {
    const percentual = (limite.gastoAtual / limite.limiteMensal) * 100;

    if (percentual > 100) {
      return {
        texto: translations.status.estourado,
        cor: "text-red-600 dark:text-red-400",
        bgCor: "bg-red-50 dark:bg-red-900/50",
        borderCor: "border-red-300 dark:border-red-700",
        icone: <AlertTriangle className="h-4 w-4" />,
      };
    }

    if (percentual > 80) {
      return {
        texto: translations.status.proximoLimite,
        cor: "text-amber-600 dark:text-yellow-400",
        bgCor: "bg-amber-50 dark:bg-yellow-900/50",
        borderCor: "border-amber-300 dark:border-yellow-700",
        icone: <Clock className="h-4 w-4" />,
      };
    }

    return {
      texto: translations.status.dentroLimite,
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
    const mesesAbreviados = [
      translations.mesesAbreviados.jan,
      translations.mesesAbreviados.fev,
      translations.mesesAbreviados.mar,
      translations.mesesAbreviados.abr,
      translations.mesesAbreviados.mai,
      translations.mesesAbreviados.jun,
      translations.mesesAbreviados.jul,
      translations.mesesAbreviados.ago,
      translations.mesesAbreviados.set,
      translations.mesesAbreviados.out,
      translations.mesesAbreviados.nov,
      translations.mesesAbreviados.dez,
    ];
    return mesesAbreviados[Number(mes)] || translations.mesesAbreviados.mes;
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
                  {translations.titulos.limites}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 truncate">
                  {translations.subtitulos.controleGastos}
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
                    {currentLang === "pt"
                      ? "Controle de Limites de Gastos"
                      : "Spending Limits Control"}
                  </h2>

                  <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 max-w-md">
                    {currentLang === "pt"
                      ? "Defina limites mensais para suas categorias de despesas e mantenha suas finanças sob controle. Receba alertas quando estiver próximo de exceder seus orçamentos."
                      : "Set monthly limits for your expense categories and keep your finances under control. Receive alerts when you're close to exceeding your budgets."}
                  </p>

                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 max-w-lg w-full">
                    <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
                      <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-blue-800 dark:text-blue-300">
                        {currentLang === "pt"
                          ? "Seu plano atual: Grátis"
                          : "Your current plan: Free"}
                      </span>
                    </div>

                    <ul className="space-y-2 text-left text-sm sm:text-base">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          {currentLang === "pt"
                            ? "Defina limites mensais por categoria"
                            : "Set monthly limits by category"}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          {currentLang === "pt"
                            ? "Acompanhamento visual em tempo real"
                            : "Real-time visual tracking"}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          {currentLang === "pt"
                            ? "Alertas quando estiver próximo do limite"
                            : "Alerts when close to the limit"}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt=1.5"></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          {currentLang === "pt"
                            ? "Histórico de gastos e limites"
                            : "Spending and limits history"}
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
                      {currentLang === "pt"
                        ? "Fazer Upgrade para Pro"
                        : "Upgrade to Pro"}
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
                {translations.titulos.limites}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base truncate">
                {translations.subtitulos.controleGastos}
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
                      {translations.mensagens.nenhumLimiteDefinido}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-gray-600 dark:text-gray-400 text-sm mb-6 max-w-xs sm:max-w-md"
                    >
                      {translations.mensagens.iniciarLimites}
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
                        {translations.botoes.criarPrimeiroLimite}
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
                                  {translations.menu.ajustarLimite}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setDialogExclusaoAberto(limite.id);
                                    setDropdownAberto(null);
                                  }}
                                  className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer text-sm px-3 py-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {translations.menu.excluirLimite}
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
                              {translations.limites.gasto}
                            </div>
                            <div className="font-semibold text-gray-900 dark:text-white truncate">
                              {formatarMoeda(limite.gastoAtual)}
                            </div>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                            <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">
                              {translations.limites.restante}
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
                                    {translations.formularios.novoValorLimite}
                                  </Label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                      {currentLang === "pt" ? "R$" : "$"}
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
                                    {translations.botoes.cancelar}
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
                                      ? translations.botoes.salvando
                                      : translations.botoes.salvar}
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
                    {translations.titulos.adicionarNovoLimite}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
                    {translations.subtitulos.selecioneCategoria}
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
                                  {currentLang === "pt" ? "R$" : "$"}
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
                                    ? translations.botoes.salvando
                                    : translations.botoes.salvar}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditando(null)}
                                  className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex-1 sm:flex-none"
                                >
                                  {translations.botoes.cancelar}
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
                                {translations.botoes.definirLimite}
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
                    {translations.dialogs.excluirLimiteTitulo}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                    {translations.dialogs.excluirLimiteDescricao}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setDialogExclusaoAberto(null)}
                    className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 order-2 sm:order-1"
                  >
                    {translations.botoes.cancelar}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => excluirLimite(dialogExclusaoAberto!)}
                    disabled={!!excluindoLimite}
                    className="order-1 sm:order-2"
                  >
                    {excluindoLimite
                      ? translations.botoes.excluindo
                      : translations.botoes.confirmar}
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
