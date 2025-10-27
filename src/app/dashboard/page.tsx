// app/dashboard/page.tsx (completo)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Wallet,
  Target,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  ArrowRight,
  Calendar,
  RefreshCw,
} from "lucide-react";
import DashboardTable from "@/components/dashboard/DashboardTable";
import MetasCard from "@/components/dashboard/MetasCard";
import {
  ResumoFinanceiro,
  MetaPessoal,
  LimiteCategoria,
} from "../../../types/dashboard";
import { useSession } from "next-auth/react";
import NotificacoesCompartilhamento from "@/components/dashboard/NotificacoesCompartilhamento";
import NotificacoesSino from "@/components/dashboard/NotificacoesCompartilhamento";

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

export default function DashboardPage() {
  const router = useRouter();
  const [resumo, setResumo] = useState<ResumoFinanceiro>({
    receita: 0,
    despesa: 0,
    despesasCompartilhadas: 0,
    saldo: 0,
    limites: 0,
  });
  const [metas, setMetas] = useState<MetaPessoal[]>([]);
  const [limites, setLimites] = useState<LimiteCategoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const session = useSession();
  const userName = session.data?.user.name;
  // Estado para o mês selecionado
  const [mesSelecionado, setMesSelecionado] = useState<string>(
    (new Date().getMonth() + 1).toString()
  );
  const [anoSelecionado, setAnoSelecionado] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // Gerar array de anos (últimos 5 anos + próximo ano)
  const anos = Array.from({ length: 6 }, (_, i) => {
    const ano = new Date().getFullYear() - 2 + i;
    return ano.toString();
  });

  const carregarDashboard = async () => {
    let toastId: string | number | undefined;

    try {
      setCarregando(true);
      toastId = toast.loading("Carregando dashboard...");

      console.log("Iniciando carregamento do dashboard...");

      // Carregar dados em paralelo
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

      toast.success("Dashboard carregado", { id: toastId });
    } catch (error) {
      console.error("Erro completo ao carregar dashboard:", error);
      toast.error("Erro ao carregar dados do dashboard", { id: toastId });
    } finally {
      setCarregando(false);
      console.log("Carregamento finalizado");
    }
  };

  // Buscar nome do usuário separadamente
  useEffect(() => {
    const buscarUsuario = async () => {
      try {
        const response = await fetch("/api/usuario");
        if (response.ok) {
          const usuarioData = await response.json();
          setNomeUsuario(usuarioData.name);
        }
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
      }
    };

    buscarUsuario();
  }, []);

  // Recarregar dashboard quando mês/ano mudar
  useEffect(() => {
    carregarDashboard();
  }, [mesSelecionado, anoSelecionado, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
    toast.info("Atualizando dados...");
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const obterFraseMotivacional = () => {
    const hora = new Date().getHours();
    const saudacao =
      hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

    const frases = [
      "Continue assim! Seu controle financeiro está excelente.",
      "Pequenas economias hoje geram grandes resultados amanhã.",
      "Foco nas metas! Cada passo conta.",
      "Seu planejamento financeiro está fazendo a diferença.",
      "Momento de revisar e ajustar as estratégias.",
    ];

    return `${saudacao}, ${userName || "..."}! ${frases[Math.floor(Math.random() * frases.length)]}`;
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
        texto: `${limitesEstourados.length} categoria(s) estourada(s)`,
        cor: "text-red-400",
        icone: <AlertTriangle className="h-4 w-4" />,
      };
    }

    if (limitesProximos.length > 0) {
      return {
        texto: `${limitesProximos.length} categoria(s) próxima(s) do limite`,
        cor: "text-yellow-400",
        icone: <Clock className="h-4 w-4" />,
      };
    }

    return {
      texto: "Limites sob controle",
      cor: "text-green-400",
      icone: <CheckCircle2 className="h-4 w-4" />,
    };
  };

  const statusLimites = obterStatusLimites();

  const obterNomeMes = (mes: string) => {
    const mesObj = MESES.find((m) => m.value === mes);
    return mesObj ? mesObj.label : "Mês";
  };

  const obterNomeMesAbreviado = (mes: string) => {
    const mesesAbreviados = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    return mesesAbreviados[Number(mes) - 1] || "Mês";
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Dashboard Financeiro
            </h1>
            <p className="text-gray-300 mt-2">{obterFraseMotivacional()}</p>
          </div>

          {/* 👈 ATUALIZE ESTA SEÇÃO - Controles do Header */}
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
              title="Atualizar dados"
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
                Receita
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
                  <p className="text-xs text-gray-400 mt-1">Total do mês</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Despesa */}
          <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors h-32">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <TrendingDown className="h-5 w-5 text-red-400" />
                Despesa
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
                  <p className="text-xs text-gray-400 mt-1">Total do mês</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Despesas Compartilhadas */}
          <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors h-32">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Users className="h-5 w-5 text-blue-400" />
                Compartilhadas
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
                  <p className="text-xs text-gray-400 mt-1">Aguardando</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Saldo */}
          <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors h-32">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Wallet className="h-5 w-5 text-purple-400" />
                Saldo
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
                  <p className="text-xs text-gray-400 mt-1">Disponível</p>
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
                  Limites do Mês
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {obterNomeMes(mesSelecionado)} de {anoSelecionado}
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
                    <p className="mb-3">Nenhum limite definido</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/dashboard/limites")}
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      Configurar Limites
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
                              style={{ backgroundColor: limite.categoria.cor }}
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
                        onClick={() => router.push("/dashboard/limites")}
                      >
                        Ver todos os limites
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
  );
}
