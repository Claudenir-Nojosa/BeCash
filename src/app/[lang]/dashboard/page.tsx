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

// Função para obter saudação baseada na hora - se quiser manter dinâmico
const obterSaudacaoDinamica = (t: any) => {
  const hora = new Date().getHours();

  if (hora < 12) {
    return t("saudacoes.bomDia");
  } else if (hora < 18) {
    return t("saudacoes.boaTarde");
  } else {
    return t("saudacoes.boaNoite");
  }
};

// Função CORRIGIDA que armazena frase por dia e por idioma
const obterFraseDiariaPorIdioma = (userName: string, t: any, i18n: any) => {
  if (typeof window === "undefined") {
    return `${t("saudacoes.bomDia")}, ${userName || "..."}!`;
  }

  const hoje = new Date().toDateString();
  const hora = new Date().getHours();
  const idiomaAtual = i18n.language;

  // ✅ Obter saudação baseada na hora
  let saudacao = t("saudacoes.bomDia");
  if (hora < 12) {
    saudacao = t("saudacoes.bomDia");
  } else if (hora < 18) {
    saudacao = t("saudacoes.boaTarde");
  } else {
    saudacao = t("saudacoes.boaNoite");
  }

  // ✅ Pegar frases motivacionais
  const frases = t("frasesMotivacionais", { returnObjects: true });

  // ✅ Chave única por dia + idioma
  const chaveFrase = `frase_motivacional_${hoje}_${idiomaAtual}`;
  const chaveSaudacao = `frase_saudacao_${hoje}_${idiomaAtual}`;

  // Verificar se já temos uma frase para hoje neste idioma
  const fraseArmazenada = localStorage.getItem(chaveFrase);
  const saudacaoArmazenada = localStorage.getItem(chaveSaudacao);

  if (fraseArmazenada && saudacaoArmazenada) {
    return fraseArmazenada;
  }

  // ✅ Escolher uma nova frase para hoje
  const frasesArray = Array.isArray(frases) ? frases : [];
  const fraseEscolhida =
    frasesArray.length > 0
      ? frasesArray[Math.floor(Math.random() * frasesArray.length)]
      : "";

  const fraseCompleta = `${saudacao}, ${userName || "..."}! ${fraseEscolhida}`;

  // ✅ Armazenar para usar durante o dia neste idioma
  localStorage.setItem(chaveFrase, fraseCompleta);
  localStorage.setItem(chaveSaudacao, saudacao);

  return fraseCompleta;
};

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

  const currentLang = (params?.lang as string) || "pt";

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
    (new Date().getMonth() + 1).toString()
  );
  const [anoSelecionado, setAnoSelecionado] = useState<string>(
    new Date().getFullYear().toString()
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

  useEffect(() => {
    if (userName && typeof window !== "undefined") {
      const frase = obterFraseDiariaPorIdioma(userName, t, i18n);
      setFraseMotivacional(frase);
    }
  }, [userName, i18n.language]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push(`/${currentLang}/login`);
    }
  }, [session, status, router, currentLang]);

  useEffect(() => {
    if (!session || hasLoadedUserRef.current) return;

    const buscarUsuario = async () => {
      try {
        const response = await fetch("/api/usuario");
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

  // ✅ useEffect OTIMIZADO para evitar carregamentos duplicados
  useEffect(() => {
    if (!session) return;
    if (carregando) return;

    const mesChanged = prevMesRef.current !== mesSelecionado;
    const anoChanged = prevAnoRef.current !== anoSelecionado;
    const refreshChanged = prevRefreshRef.current !== refreshTrigger;

    if (!hasLoadedRef.current || mesChanged || anoChanged || refreshChanged) {
      prevMesRef.current = mesSelecionado;
      prevAnoRef.current = anoSelecionado;
      prevRefreshRef.current = refreshTrigger;

      carregarDashboard();
    }
  }, [mesSelecionado, anoSelecionado, refreshTrigger, session]);

  const carregarDashboard = async () => {
    if (carregando) return;

    try {
      setCarregando(true);

      const toastId = toast.loading(t("botoes.carregando"));
      toastIdRef.current = toastId;

      const [resumoRes, metasRes, limitesRes] = await Promise.all([
        fetch(
          `/api/dashboard/resumo?mes=${mesSelecionado}&ano=${anoSelecionado}`
        ),
        fetch("/api/dashboard/metas"),
        fetch(
          `/api/dashboard/limites?mes=${mesSelecionado}&ano=${anoSelecionado}`
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
      toast.error(t("status.erroCarregar"));
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
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300">{t("status.verificando")}</p>
        </div>
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
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const obterStatusLimites = () => {
    const limitesEstourados = limites.filter(
      (limite) => limite.gastoAtual > limite.limiteMensal
    );
    const limitesProximos = limites.filter(
      (limite) =>
        limite.gastoAtual > limite.limiteMensal * 0.8 &&
        limite.gastoAtual <= limite.limiteMensal
    );

    if (limitesEstourados.length > 0) {
      return {
        texto: `${limitesEstourados.length} ${t("limites.status.estourado")}`,
        cor: "text-red-400",
        icone: <AlertTriangle className="h-4 w-4" />,
      };
    }

    if (limitesProximos.length > 0) {
      return {
        texto: `${limitesProximos.length} ${t("limites.status.proximo")}`,
        cor: "text-yellow-400",
        icone: <Clock className="h-4 w-4" />,
      };
    }

    return {
      texto: t("limites.status.controle"),
      cor: "text-green-400",
      icone: <CheckCircle2 className="h-4 w-4" />,
    };
  };

  const statusLimites = obterStatusLimites();

  // ✅ Função para pegar nome do mês traduzido
  const obterNomeMes = (mes: string) => {
    const mesesTraduzidos = {
      "1": t("Meses.jan"),
      "2": t("Meses.fev"),
      "3": t("Meses.mar"),
      "4": t("Meses.abr"),
      "5": t("Meses.mai"),
      "6": t("Meses.jun"),
      "7": t("Meses.jul"),
      "8": t("Meses.ago"),
      "9": t("Meses.set"),
      "10": t("Meses.out"),
      "11": t("Meses.nov"),
      "12": t("Meses.dez"),
    };
    return mesesTraduzidos[mes as keyof typeof mesesTraduzidos] || "Mês";
  };

  const obterNomeMesAbreviado = (mes: string) => {
    const mesesAbreviados = {
      "1": t("MesesAbreviados.jan"),
      "2": t("MesesAbreviados.fev"),
      "3": t("MesesAbreviados.mar"),
      "4": t("MesesAbreviados.abr"),
      "5": t("MesesAbreviados.mai"),
      "6": t("MesesAbreviados.jun"),
      "7": t("MesesAbreviados.jul"),
      "8": t("MesesAbreviados.ago"),
      "9": t("MesesAbreviados.set"),
      "10": t("MesesAbreviados.out"),
      "11": t("MesesAbreviados.nov"),
      "12": t("MesesAbreviados.dez"),
    };
    return mesesAbreviados[mes as keyof typeof mesesAbreviados] || "Mês";
  };

  // Gerar array de anos (últimos 5 anos + próximo ano)
  const anos = Array.from({ length: 6 }, (_, i) => {
    const ano = new Date().getFullYear() - 2 + i;
    return ano.toString();
  });

  return (
    <AuthGuard>
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Cabeçalho */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {t("titulo")} {/* ✅ Texto traduzido */}
              </h1>
              <p className="text-gray-300 mt-2">{fraseMotivacional}</p>
            </div>

            {/* Controles do Header */}
            <div className="flex items-center gap-3">
              {/* Seletor de Mês */}
              <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
                {/* Seta esquerda */}
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
                  className="h-7 w-7 text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </Button>

                {/* Mês atual */}
                <div className="text-center min-w-20">
                  <p className="text-sm font-medium text-white">
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
                    if (novoMes > 12) {
                      novoMes = 1;
                      novoAno = novoAno + 1;
                    }
                    setMesSelecionado(novoMes.toString());
                    setAnoSelecionado(novoAno.toString());
                  }}
                  className="h-7 w-7 text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Button>
              </div>

              {/* 👈 BOTÃO DE REFRESH */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={carregando}
                className="h-9 w-9 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50"
                title={t("botoes.refresh")}
              >
                <RefreshCw
                  className={`h-4 w-4 ${carregando ? "animate-spin" : ""}`}
                />
              </Button>

              {/* Sino de Notificações */}
              <NotificacoesSino />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Receita */}
            <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors h-32">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  {t("cards.receita.titulo")} {/* ✅ Texto traduzido */}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {carregando ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-32 bg-gray-800" />
                    <Skeleton className="h-4 w-20 bg-gray-800" />
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-green-400">
                      {formatarMoeda(resumo.receita)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t("cards.receita.subtitulo")} {/* ✅ Texto traduzido */}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Despesa */}
            <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors h-32">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <TrendingDown className="h-5 w-5 text-red-400" />
                  {t("cards.despesa.titulo")} {/* ✅ Texto traduzido */}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {carregando ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-32 bg-gray-800" />
                    <Skeleton className="h-4 w-20 bg-gray-800" />
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-red-400">
                      {formatarMoeda(resumo.despesa)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t("cards.despesa.subtitulo")} {/* ✅ Texto traduzido */}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Despesas Compartilhadas */}
            <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors h-32">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Users className="h-5 w-5 text-blue-400" />
                  {t("cards.compartilhadas.titulo")} {/* ✅ Texto traduzido */}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {carregando ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-32 bg-gray-800" />
                    <Skeleton className="h-4 w-20 bg-gray-800" />
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-blue-400">
                      {formatarMoeda(resumo.despesasCompartilhadas)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t("cards.compartilhadas.subtitulo")}{" "}
                      {/* ✅ Texto traduzido */}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Saldo */}
            <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors h-32">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Wallet className="h-5 w-5 text-purple-400" />
                  {t("cards.saldo.titulo")} {/* ✅ Texto traduzido */}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {carregando ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-32 bg-gray-800" />
                    <Skeleton className="h-4 w-20 bg-gray-800" />
                  </div>
                ) : (
                  <>
                    <p
                      className={`text-2xl font-bold ${
                        resumo.saldo >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {formatarMoeda(resumo.saldo)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t("cards.saldo.subtitulo")} {/* ✅ Texto traduzido */}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Conteúdo Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tabela de Lançamentos */}
            <div className="lg:col-span-2">
              <DashboardTable
                mes={mesSelecionado}
                ano={anoSelecionado}
                refreshTrigger={refreshTrigger}
              />
            </div>

            {/* Sidebar - Metas e Limites */}
            <div className="space-y-6">
              <MetasCard metas={metas} carregando={carregando} />
              {/* Limites por Categoria */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Target className="h-5 w-5" />
                    {t("limites.titulo")} {/* ✅ Texto traduzido */}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {obterNomeMes(mesSelecionado)} {t("limites.subtitulo")}{" "}
                    {anoSelecionado}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {carregando ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full bg-gray-800" />
                      ))}
                    </div>
                  ) : limites.length === 0 ? (
                    <div className="text-center py-6 text-gray-400">
                      <Target className="h-12 w-12 mx-auto mb-3 text-gray-700" />
                      <p className="mb-3">{t("limites.nenhumLimite")}</p>{" "}
                      {/* ✅ Texto traduzido */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/${currentLang}/dashboard/limites`)
                        }
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      >
                        {t("limites.configurarLimites")}{" "}
                        {/* ✅ Texto traduzido */}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {limites.slice(0, 3).map((limite) => {
                        const percentual =
                          (limite.gastoAtual / limite.limiteMensal) * 100;
                        const estaEstourado = percentual > 100;
                        const estaProximo = percentual > 80 && !estaEstourado;

                        return (
                          <div
                            key={limite.id}
                            className="flex items-center justify-between p-3 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor: limite.categoria.cor,
                                }}
                              />
                              <div>
                                <p className="font-medium text-white text-sm">
                                  {limite.categoria.nome}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {formatarMoeda(limite.gastoAtual)} /{" "}
                                  {formatarMoeda(limite.limiteMensal)}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={
                                estaEstourado
                                  ? "destructive"
                                  : estaProximo
                                    ? "secondary"
                                    : "outline"
                              }
                              className={
                                estaEstourado
                                  ? "bg-red-900/50 text-red-300 border-red-700"
                                  : estaProximo
                                    ? "bg-yellow-900/50 text-yellow-300 border-yellow-700"
                                    : "bg-gray-800 text-gray-300 border-gray-700"
                              }
                            >
                              {percentual.toFixed(0)}%
                            </Badge>
                          </div>
                        );
                      })}
                      {limites.length > 3 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-gray-400 hover:text-white hover:bg-gray-800"
                          onClick={() =>
                            router.push(`/${currentLang}/dashboard/limites`)
                          }
                        >
                          {t("limites.verTodos")} {/* ✅ Texto traduzido */}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
