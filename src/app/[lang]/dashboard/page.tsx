"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Wallet,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import DashboardTable from "@/components/dashboard/DashboardTable";
import MetasCard from "@/components/dashboard/MetasCard";
import {
  ResumoFinanceiro,
  MetaPessoal,
  LimiteCategoria,
} from "../../../../types/dashboard";
import { useSession } from "next-auth/react";
import NotificacoesSino from "@/components/dashboard/NotificacoesCompartilhamento";
import AuthGuard from "@/components/shared/AuthGuard";
import { motion } from "framer-motion";
import { getFallback } from "@/lib/i18nFallback";

// Array de meses para o seletor
const MESES = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

// Função para limpar frases antigas
const limparFrasesAntigas = () => {
  if (typeof window === "undefined") return;

  const hoje = new Date().toDateString();

  // Limpar todas as chaves antigas
  Object.keys(localStorage).forEach((key) => {
    if (
      key.startsWith("frase_motivacional_") ||
      key.startsWith("frase_saudacao_")
    ) {
      // Extrair a data da chave
      const partes = key.split("_");
      if (partes.length >= 4) {
        const dataKey = partes[2]; // A data está na posição 2
        if (dataKey !== hoje) {
          localStorage.removeItem(key);
        }
      }
    }
  });
};

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const { t, i18n } = useTranslation("dashboard");
  const [username, setUsername] = useState<string>("");
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
      // Título
      case "titulo":
        return getFallback(
          currentLang,
          "Dashboard Financeiro",
          "Financial Dashboard",
        );

      // Frases motivacionais (vamos usar a primeira como fallback)
      case "frasesMotivacionais":
        const frasesArray = t("frasesMotivacionais", { returnObjects: true });
        if (Array.isArray(frasesArray) && frasesArray.length > 0) {
          return frasesArray[0];
        }
        return getFallback(
          currentLang,
          "Toda jornada financeira começa com consciência.",
          "Every financial journey begins with awareness.",
        );

      // Meses completos
      case "Meses.jan":
        return getFallback(currentLang, "Janeiro", "January");
      case "Meses.fev":
        return getFallback(currentLang, "Fevereiro", "February");
      case "Meses.mar":
        return getFallback(currentLang, "Março", "March");
      case "Meses.abr":
        return getFallback(currentLang, "Abril", "April");
      case "Meses.mai":
        return getFallback(currentLang, "Maio", "May");
      case "Meses.jun":
        return getFallback(currentLang, "Junho", "June");
      case "Meses.jul":
        return getFallback(currentLang, "Julho", "July");
      case "Meses.ago":
        return getFallback(currentLang, "Agosto", "August");
      case "Meses.set":
        return getFallback(currentLang, "Setembro", "September");
      case "Meses.out":
        return getFallback(currentLang, "Outubro", "October");
      case "Meses.nov":
        return getFallback(currentLang, "Novembro", "November");
      case "Meses.dez":
        return getFallback(currentLang, "Dezembro", "December");

      // Meses abreviados
      case "MesesAbreviados.jan":
        return getFallback(currentLang, "Jan", "Jan");
      case "MesesAbreviados.fev":
        return getFallback(currentLang, "Fev", "Feb");
      case "MesesAbreviados.mar":
        return getFallback(currentLang, "Mar", "Mar");
      case "MesesAbreviados.abr":
        return getFallback(currentLang, "Abr", "Apr");
      case "MesesAbreviados.mai":
        return getFallback(currentLang, "Mai", "May");
      case "MesesAbreviados.jun":
        return getFallback(currentLang, "Jun", "Jun");
      case "MesesAbreviados.jul":
        return getFallback(currentLang, "Jul", "Jul");
      case "MesesAbreviados.ago":
        return getFallback(currentLang, "Ago", "Aug");
      case "MesesAbreviados.set":
        return getFallback(currentLang, "Set", "Sep");
      case "MesesAbreviados.out":
        return getFallback(currentLang, "Out", "Oct");
      case "MesesAbreviados.nov":
        return getFallback(currentLang, "Nov", "Nov");
      case "MesesAbreviados.dez":
        return getFallback(currentLang, "Dez", "Dec");

      // Cards
      case "cards.receita.titulo":
        return getFallback(currentLang, "Receita", "Income");
      case "cards.receita.subtitulo":
        return getFallback(currentLang, "Total do mês", "Month total");
      case "cards.despesa.titulo":
        return getFallback(currentLang, "Despesa", "Expense");
      case "cards.despesa.subtitulo":
        return getFallback(currentLang, "Total do mês", "Month total");
      case "cards.compartilhadas.titulo":
        return getFallback(currentLang, "Compartilhadas", "Shared");
      case "cards.compartilhadas.subtitulo":
        return getFallback(
          currentLang,
          "Total após divisão",
          "Total after split",
        );
      case "cards.saldo.titulo":
        return getFallback(currentLang, "Saldo", "Balance");
      case "cards.saldo.subtitulo":
        return getFallback(currentLang, "Disponível", "Available");

      // Limites
      case "limites.titulo":
        return getFallback(currentLang, "Limites do Mês", "Monthly Limits");
      case "limites.subtitulo":
        return getFallback(currentLang, "de", "of");
      case "limites.nenhumLimite":
        return getFallback(
          currentLang,
          "Nenhum limite definido",
          "No limits defined",
        );
      case "limites.configurarLimites":
        return getFallback(
          currentLang,
          "Configurar Limites",
          "Configure Limits",
        );
      case "limites.verTodos":
        return getFallback(
          currentLang,
          "Ver todos os limites",
          "See all limits",
        );
      case "limites.status.estourado":
        return getFallback(
          currentLang,
          "categoria(s) estourada(s)",
          "category(s) exceeded",
        );
      case "limites.status.proximo":
        return getFallback(
          currentLang,
          "categoria(s) próxima(s) do limite",
          "category(s) near limit",
        );
      case "limites.status.controle":
        return getFallback(
          currentLang,
          "Limites sob controle",
          "Limits under control",
        );

      // Saudações
      case "saudacoes.bomDia":
        return getFallback(currentLang, "Bom dia", "Good morning");
      case "saudacoes.boaTarde":
        return getFallback(currentLang, "Boa tarde", "Good afternoon");
      case "saudacoes.boaNoite":
        return getFallback(currentLang, "Boa noite", "Good evening");

      // Botões
      case "botoes.refresh":
        return getFallback(currentLang, "Atualizar dados", "Refresh data");
      case "botoes.atualizando":
        return getFallback(
          currentLang,
          "Atualizando dados...",
          "Updating data...",
        );
      case "botoes.carregando":
        return getFallback(
          currentLang,
          "Carregando dashboard...",
          "Loading dashboard...",
        );

      // Status
      case "status.verificando":
        return getFallback(
          currentLang,
          "Verificando autenticação...",
          "Checking authentication...",
        );
      case "status.dashboardCarregado":
        return getFallback(
          currentLang,
          "Dashboard carregado",
          "Dashboard loaded",
        );
      case "status.erroCarregar":
        return getFallback(
          currentLang,
          "Erro ao carregar dados do dashboard",
          "Error loading dashboard data",
        );

      default:
        return key;
    }
  };

  // Criar um objeto de traduções para fácil acesso
  const translations = {
    titulo: getTranslation("titulo"),
    // Frases motivacionais serão tratadas separadamente

    // Meses
    meses: {
      jan: getTranslation("Meses.jan"),
      fev: getTranslation("Meses.fev"),
      mar: getTranslation("Meses.mar"),
      abr: getTranslation("Meses.abr"),
      mai: getTranslation("Meses.mai"),
      jun: getTranslation("Meses.jun"),
      jul: getTranslation("Meses.jul"),
      ago: getTranslation("Meses.ago"),
      set: getTranslation("Meses.set"),
      out: getTranslation("Meses.out"),
      nov: getTranslation("Meses.nov"),
      dez: getTranslation("Meses.dez"),
    },

    // Meses abreviados
    mesesAbreviados: {
      jan: getTranslation("MesesAbreviados.jan"),
      fev: getTranslation("MesesAbreviados.fev"),
      mar: getTranslation("MesesAbreviados.mar"),
      abr: getTranslation("MesesAbreviados.abr"),
      mai: getTranslation("MesesAbreviados.mai"),
      jun: getTranslation("MesesAbreviados.jun"),
      jul: getTranslation("MesesAbreviados.jul"),
      ago: getTranslation("MesesAbreviados.ago"),
      set: getTranslation("MesesAbreviados.set"),
      out: getTranslation("MesesAbreviados.out"),
      nov: getTranslation("MesesAbreviados.nov"),
      dez: getTranslation("MesesAbreviados.dez"),
    },

    // Cards
    cards: {
      receita: {
        titulo: getTranslation("cards.receita.titulo"),
        subtitulo: getTranslation("cards.receita.subtitulo"),
      },
      despesa: {
        titulo: getTranslation("cards.despesa.titulo"),
        subtitulo: getTranslation("cards.despesa.subtitulo"),
      },
      compartilhadas: {
        titulo: getTranslation("cards.compartilhadas.titulo"),
        subtitulo: getTranslation("cards.compartilhadas.subtitulo"),
      },
      saldo: {
        titulo: getTranslation("cards.saldo.titulo"),
        subtitulo: getTranslation("cards.saldo.subtitulo"),
      },
    },

    // Limites
    limites: {
      titulo: getTranslation("limites.titulo"),
      subtitulo: getTranslation("limites.subtitulo"),
      nenhumLimite: getTranslation("limites.nenhumLimite"),
      configurarLimites: getTranslation("limites.configurarLimites"),
      verTodos: getTranslation("limites.verTodos"),
      status: {
        estourado: getTranslation("limites.status.estourado"),
        proximo: getTranslation("limites.status.proximo"),
        controle: getTranslation("limites.status.controle"),
      },
    },

    // Saudações
    saudacoes: {
      bomDia: getTranslation("saudacoes.bomDia"),
      boaTarde: getTranslation("saudacoes.boaTarde"),
      boaNoite: getTranslation("saudacoes.boaNoite"),
    },

    // Botões
    botoes: {
      refresh: getTranslation("botoes.refresh"),
      atualizando: getTranslation("botoes.atualizando"),
      carregando: getTranslation("botoes.carregando"),
    },

    // Status
    status: {
      verificando: getTranslation("status.verificando"),
      dashboardCarregado: getTranslation("status.dashboardCarregado"),
      erroCarregar: getTranslation("status.erroCarregar"),
    },
  };

  // ========== ESTADOS ==========
  const [resumo, setResumo] = useState<ResumoFinanceiro>({
    receita: 0,
    despesa: 0,
    despesasCompartilhadas: 0,
    saldo: 0,
    limites: 0,
  });
  const [metas, setMetas] = useState<MetaPessoal[]>([]);
  const [limites, setLimites] = useState<LimiteCategoria[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [fraseMotivacional, setFraseMotivacional] = useState("");
  const [mesSelecionado, setMesSelecionado] = useState<string>(
    (new Date().getMonth() + 1).toString(),
  );
  const [anoSelecionado, setAnoSelecionado] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const userName = session?.user?.name;

  // ========== REFS (DEPOIS DOS ESTADOS, ANTES DOS USEEFFECTS!) ==========
  const toastIdRef = useRef<string | number | undefined>(undefined);
  const hasLoadedRef = useRef(false);
  const hasLoadedUserRef = useRef(false);
  const prevMesRef = useRef(mesSelecionado);
  const prevAnoRef = useRef(anoSelecionado);
  const prevRefreshRef = useRef(refreshTrigger);

  // ========== USEEFFECTS ==========
  useEffect(() => {
    return () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      limparFrasesAntigas();
    }
  }, []);
  // Função para obter saudação baseada na hora - se quiser manter dinâmico
  const obterSaudacaoAtual = (userName: string) => {
    if (typeof window === "undefined") {
      return `${translations.saudacoes.bomDia}, ${userName || "..."}!`;
    }

    const hora = new Date().getHours();

    let saudacao = translations.saudacoes.bomDia;
    if (hora < 12) {
      saudacao = translations.saudacoes.bomDia;
    } else if (hora < 18) {
      saudacao = translations.saudacoes.boaTarde;
    } else {
      saudacao = translations.saudacoes.boaNoite;
    }

    // Usar frases motivacionais do i18n
    const frases = t("frasesMotivacionais", { returnObjects: true });
    const frasesArray = Array.isArray(frases) ? frases : [];

    const fraseEscolhida =
      frasesArray.length > 0
        ? frasesArray[Math.floor(Math.random() * frasesArray.length)]
        : getTranslation("frasesMotivacionais");

    return `${saudacao}, ${userName || "..."}! ${fraseEscolhida}`;
  };

  useEffect(() => {
    if (userName && typeof window !== "undefined") {
      const frase = obterSaudacaoAtual(userName);
      setFraseMotivacional(frase);
    }
  }, [userName, i18n.language, t]);

  useEffect(() => {
    if (!session || hasLoadedUserRef.current) return;

    const buscarUsuario = async () => {
      try {
        const response = await fetch("/api/usuarios/me");
        if (response.ok) {
          const usuarioData = await response.json();
          setNomeUsuario(usuarioData.name);
          hasLoadedUserRef.current = true;
        }
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
      }
    };

    buscarUsuario();
  }, [session]);

  // Adicione este useEffect para buscar o username do usuário
  useEffect(() => {
    if (!session) return;

    const buscarUsername = async () => {
      try {
        const response = await fetch("/api/usuarios/me");
        if (response.ok) {
          const usuarioData = await response.json();
          setUsername(usuarioData.username || ""); // Adicione esta linha
          setNomeUsuario(usuarioData.name);
          hasLoadedUserRef.current = true;
        }
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
      }
    };

    buscarUsername();
  }, [session]);

  // ✅ useEffect OTIMIZADO para evitar carregamentos duplicados
  useEffect(() => {
    if (!session) return;
    if (carregando) return;

    const mesChanged = prevMesRef.current !== mesSelecionado;
    const anoChanged = prevAnoRef.current !== anoSelecionado;
    const refreshChanged = prevRefreshRef.current !== refreshTrigger;

    // ✅ CORREÇÃO: Só executa se algo realmente mudou OU se é a primeira vez
    if (!hasLoadedRef.current || mesChanged || anoChanged || refreshChanged) {
      // ✅ Atualiza as refs ANTES de chamar a função
      prevMesRef.current = mesSelecionado;
      prevAnoRef.current = anoSelecionado;
      prevRefreshRef.current = refreshTrigger;

      carregarDashboard();
    }
  }, [mesSelecionado, anoSelecionado, refreshTrigger, session]); // ✅ REMOVA 'carregando' das dependências

  const carregarDashboard = async () => {
    if (carregando) return;

    try {
      setCarregando(true);

      const toastId = toast.loading(translations.botoes.carregando);
      toastIdRef.current = toastId;

      const [resumoRes, metasRes, limitesRes] = await Promise.all([
        fetch(
          `/api/dashboard/resumo?mes=${mesSelecionado}&ano=${anoSelecionado}`,
        ),
        fetch("/api/dashboard/metas"),
        fetch(
          `/api/dashboard/limites?mes=${mesSelecionado}&ano=${anoSelecionado}`,
        ),
      ]);

      console.log("Respostas recebidas:", {
        resumo: resumoRes.status,
        metas: metasRes.status,
        limites: limitesRes.status,
      });

      // Verificar cada resposta individualmente
      if (!resumoRes.ok) {
        const errorText = await resumoRes.text();
        console.error("Erro na API de resumo:", resumoRes.status, errorText);
        throw new Error(`Erro na API de resumo: ${resumoRes.status}`);
      }

      if (!metasRes.ok) {
        const errorText = await metasRes.text();
        console.error("Erro na API de metas:", metasRes.status, errorText);
        throw new Error(`Erro na API de metas: ${metasRes.status}`);
      }

      if (!limitesRes.ok) {
        const errorText = await limitesRes.text();
        console.error("Erro na API de limites:", limitesRes.status, errorText);
        throw new Error(`Erro na API de limites: ${limitesRes.status}`);
      }

      const [resumoData, metasData, limitesData] = await Promise.all([
        resumoRes.json(),
        metasRes.json(),
        limitesRes.json(),
      ]);

      console.log("Dados carregados:", {
        resumo: resumoData,
        metas: metasData.length,
        limites: limitesData.length,
      });

      setResumo(resumoData);
      setMetas(metasData);
      setLimites(limitesData);

      // ✅ Marcar que já carregou uma vez (APÓS carregar com sucesso!)
      hasLoadedRef.current = true;

      // ✅ Descartar toast de loading e mostrar sucesso
      toast.dismiss(toastId);
      toast.success(t("status.dashboardCarregado"));
    } catch (error) {
      console.error("Erro completo ao carregar dashboard:", error);

      // ✅ Descartar toast de loading antes de mostrar erro
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
    } finally {
      setCarregando(false);
      toastIdRef.current = undefined;
    }
  };

  const handleRefresh = () => {
    if (carregando) return;
    setRefreshTrigger((prev) => prev + 1);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center bg-white dark:bg-transparent">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="rounded-full h-12 w-12 border-b-2 border-gray-800 dark:border-white mx-auto mb-4"
          />
          <p className="text-gray-600 dark:text-gray-300">
            {t("status.verificando")}
          </p>
        </motion.div>
      </div>
    );
  }

  // Se não há sessão, não renderizar nada (já foi redirecionado)
  if (!session) {
    return null;
  }

  // ✅ Função para formatar moeda baseada no idioma
  const formatarMoeda = (valor: number) => {
    const locale = i18n.language === "pt" ? "pt-BR" : "en-US";
    const currency = i18n.language === "pt" ? "BRL" : "USD"; // ✅ Dinâmico
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(valor);
  };

  const obterStatusLimites = () => {
    const limitesEstourados = limites.filter(
      (limite) => limite.gastoAtual > limite.limiteMensal,
    );
    const limitesProximos = limites.filter(
      (limite) =>
        limite.gastoAtual > limite.limiteMensal * 0.8 &&
        limite.gastoAtual <= limite.limiteMensal,
    );

    if (limitesEstourados.length > 0) {
      return {
        texto: `${limitesEstourados.length} ${translations.limites.status.estourado}`,
        cor: "text-red-600 dark:text-red-400",
        corClaro: "text-red-600",
        corEscuro: "dark:text-red-400",
        icone: <AlertTriangle className="h-4 w-4" />,
      };
    }

    if (limitesProximos.length > 0) {
      return {
        texto: `${limitesProximos.length} ${translations.limites.status.proximo}`,
        cor: "text-amber-600 dark:text-yellow-400",
        corClaro: "text-amber-600",
        corEscuro: "dark:text-yellow-400",
        icone: <Clock className="h-4 w-4" />,
      };
    }

    return {
      texto: translations.limites.status.controle,
      cor: "text-emerald-600 dark:text-green-400",
      corClaro: "text-emerald-600",
      corEscuro: "dark:text-green-400",
      icone: <CheckCircle2 className="h-4 w-4" />,
    };
  };

  const statusLimites = obterStatusLimites();

  // ✅ Função para pegar nome do mês traduzido
  const obterNomeMes = (mes: string) => {
    const mesesMap = {
      "1": translations.meses.jan,
      "2": translations.meses.fev,
      "3": translations.meses.mar,
      "4": translations.meses.abr,
      "5": translations.meses.mai,
      "6": translations.meses.jun,
      "7": translations.meses.jul,
      "8": translations.meses.ago,
      "9": translations.meses.set,
      "10": translations.meses.out,
      "11": translations.meses.nov,
      "12": translations.meses.dez,
    };
    return mesesMap[mes as keyof typeof mesesMap] || "Mês";
  };

  const obterNomeMesAbreviado = (mes: string) => {
    const mesesMap = {
      "1": translations.mesesAbreviados.jan,
      "2": translations.mesesAbreviados.fev,
      "3": translations.mesesAbreviados.mar,
      "4": translations.mesesAbreviados.abr,
      "5": translations.mesesAbreviados.mai,
      "6": translations.mesesAbreviados.jun,
      "7": translations.mesesAbreviados.jul,
      "8": translations.mesesAbreviados.ago,
      "9": translations.mesesAbreviados.set,
      "10": translations.mesesAbreviados.out,
      "11": translations.mesesAbreviados.nov,
      "12": translations.mesesAbreviados.dez,
    };
    return mesesMap[mes as keyof typeof mesesMap] || "Mês";
  };

  // Gerar array de anos (últimos 5 anos + próximo ano)
  const anos = Array.from({ length: 6 }, (_, i) => {
    const ano = new Date().getFullYear() - 2 + i;
    return ano.toString();
  });

  return (
    <AuthGuard>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen p-4 sm:p-6 bg-white dark:bg-transparent"
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Cabeçalho */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          >
            <div className="flex flex-col">
              {/* Tag de usuário acima do título */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 0.25 }}
                className="flex justify-start"
              >
                {username ? (
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-normal tracking-tight mb-1">
                    @{username}
                  </span>
                ) : (
                  <div className="flex items-center mb-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-normal tracking-tight mr-1">
                      @
                    </span>
                    <Skeleton className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
                  </div>
                )}
              </motion.div>

              <motion.h1
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight"
              >
                {translations.titulo}
              </motion.h1>

              <motion.p
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1 sm:mt-2"
              >
                {fraseMotivacional}
              </motion.p>
            </div>
            {/* Controles do Header */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 sm:gap-3"
            >
              {/* Seletor de Mês */}
              <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shadow-sm hover:shadow-md transition-shadow">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      let novoMes = parseInt(mesSelecionado) - 1;
                      let novoAno = parseInt(anoSelecionado);
                      if (novoMes < 1) {
                        novoMes = 12;
                        novoAno = novoAno - 1;
                      }
                      setMesSelecionado(novoMes.toString());
                      setAnoSelecionado(novoAno.toString());
                    }}
                    className="h-7 w-7 sm:h-8 sm:w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </motion.div>

                <motion.div
                  className="text-center min-w-16 sm:min-w-20"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                    {obterNomeMesAbreviado(mesSelecionado)}/{anoSelecionado}
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      let novoMes = parseInt(mesSelecionado) + 1;
                      let novoAno = parseInt(anoSelecionado);
                      if (novoMes > 12) {
                        novoMes = 1;
                        novoAno = novoAno + 1;
                      }
                      setMesSelecionado(novoMes.toString());
                      setAnoSelecionado(novoAno.toString());
                    }}
                    className="h-7 w-7 sm:h-8 sm:w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </motion.div>
              </div>

              {/* Botão de Refresh */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={carregando}
                  className="h-8 w-8 sm:h-9 sm:w-9 border-gray-300 dark:border-gray-700 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 shadow-sm"
                  title={t("botoes.refresh")}
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${carregando ? "animate-spin" : ""}`}
                  />
                </Button>
              </motion.div>

              {/* Sino de Notificações */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <NotificacoesSino />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Cards de Resumo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
          >
            {/* Receita */}
            <motion.div
              whileHover={{ y: -1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-white">
                    <motion.div
                      className="p-1.5 sm:p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30"
                      whileHover={{ rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                    </motion.div>
                    {translations.cards.receita.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {carregando ? (
                    <div className="space-y-2">
                      <Skeleton className="h-7 sm:h-8 w-32 bg-gray-200 dark:bg-gray-800" />
                      <Skeleton className="h-3 w-20 bg-gray-200 dark:bg-gray-800" />
                    </div>
                  ) : (
                    <>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-emerald-400">
                        {formatarMoeda(resumo.receita)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {translations.cards.receita.subtitulo}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Despesa */}
            <motion.div
              whileHover={{ y: -1 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.05 }}
            >
              <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-white">
                    <motion.div
                      className="p-1.5 sm:p-2 rounded-lg bg-red-50 dark:bg-red-900/30"
                      whileHover={{ rotate: -5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                    </motion.div>
                    {translations.cards.despesa.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {carregando ? (
                    <div className="space-y-2">
                      <Skeleton className="h-7 sm:h-8 w-32 bg-gray-200 dark:bg-gray-800" />
                      <Skeleton className="h-3 w-20 bg-gray-200 dark:bg-gray-800" />
                    </div>
                  ) : (
                    <>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-red-400">
                        {formatarMoeda(resumo.despesa)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {translations.cards.despesa.subtitulo}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Despesas Compartilhadas */}
            <motion.div
              whileHover={{ y: -1 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-white">
                    <motion.div
                      className="p-1.5 sm:p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30"
                      whileHover={{ rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    </motion.div>
                    {translations.cards.compartilhadas.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {carregando ? (
                    <div className="space-y-2">
                      <Skeleton className="h-7 sm:h-8 w-32 bg-gray-200 dark:bg-gray-800" />
                      <Skeleton className="h-3 w-20 bg-gray-200 dark:bg-gray-800" />
                    </div>
                  ) : (
                    <>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-blue-400">
                        {formatarMoeda(resumo.despesasCompartilhadas)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {translations.cards.compartilhadas.subtitulo}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Saldo */}
            <motion.div
              whileHover={{ y: -1 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
            >
              <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-white">
                    <motion.div
                      className="p-1.5 sm:p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30"
                      whileHover={{ rotate: -5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                    </motion.div>
                    {translations.cards.saldo.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {carregando ? (
                    <div className="space-y-2">
                      <Skeleton className="h-7 sm:h-8 w-32 bg-gray-200 dark:bg-gray-800" />
                      <Skeleton className="h-3 w-20 bg-gray-200 dark:bg-gray-800" />
                    </div>
                  ) : (
                    <>
                      <p
                        className={`text-xl sm:text-2xl font-bold ${
                          resumo.saldo >= 0
                            ? "text-emerald-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {formatarMoeda(resumo.saldo)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {translations.cards.saldo.subtitulo}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Conteúdo Principal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Tabela de Lançamentos */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="lg:col-span-2"
            >
              <DashboardTable
                mes={mesSelecionado}
                ano={anoSelecionado}
                refreshTrigger={refreshTrigger}
              />
            </motion.div>

            {/* Sidebar - Metas e Limites */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-6"
            >
              <motion.div>
                <MetasCard metas={metas} carregando={carregando} />
              </motion.div>

              {/* Limites por Categoria */}
              <motion.div>
                <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg font-semibold">
                      <motion.div
                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800"
                        whileHover={{ rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Target className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                      </motion.div>
                      {translations.limites.titulo}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
                      {obterNomeMes(mesSelecionado)}{" "}
                      {translations.limites.subtitulo} {anoSelecionado}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {carregando ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                          >
                            <Skeleton className="h-16 w-full bg-gray-200 dark:bg-gray-800" />
                          </motion.div>
                        ))}
                      </div>
                    ) : limites.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-6"
                      >
                        <motion.div>
                          <Target className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                        </motion.div>
                        <p className="mb-3 text-gray-600 dark:text-gray-400">
                          {translations.limites.nenhumLimite}
                        </p>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/${currentLang}/dashboard/limites`)
                            }
                            className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            {translations.limites.configurarLimites}
                          </Button>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <div className="space-y-3">
                        {limites.slice(0, 3).map((limite, index) => {
                          const percentual =
                            (limite.gastoAtual / limite.limiteMensal) * 100;
                          const estaEstourado = percentual > 100;
                          const estaProximo = percentual > 80 && !estaEstourado;

                          return (
                            <motion.div
                              key={limite.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 * index }}
                              whileHover={{ scale: 1.02 }}
                              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-700 transition-colors bg-gray-50/50 dark:bg-gray-800/50"
                            >
                              <div className="flex items-center gap-3">
                                <motion.div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor: limite.categoria.cor,
                                  }}
                                  whileHover={{ scale: 1.5 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 300,
                                  }}
                                />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                                    {limite.categoria.nome}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatarMoeda(limite.gastoAtual)} /{" "}
                                    {formatarMoeda(limite.limiteMensal)}
                                  </p>
                                </div>
                              </div>
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Badge
                                  variant={
                                    estaEstourado
                                      ? "destructive"
                                      : estaProximo
                                        ? "secondary"
                                        : "outline"
                                  }
                                  className={`
                                    ${
                                      estaEstourado
                                        ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
                                        : estaProximo
                                          ? "bg-amber-100 dark:bg-yellow-900/50 text-amber-700 dark:text-yellow-300 border-amber-200 dark:border-yellow-700"
                                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                                    } font-medium
                                  `}
                                >
                                  {percentual.toFixed(0)}%
                                </Badge>
                              </motion.div>
                            </motion.div>
                          );
                        })}
                        {limites.length > 3 && (
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                              onClick={() =>
                                router.push(`/${currentLang}/dashboard/limites`)
                              }
                            >
                              {t("limites.verTodos")}
                              <ArrowRight className="ml-2 h-3.5 w-3.5" />
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </AuthGuard>
  );
}
