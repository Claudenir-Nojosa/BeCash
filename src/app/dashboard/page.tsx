// app/dashboard/lancamentos/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Handshake,
  PieChart,
  BarChart3,
  Target,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

// Tipos para os lançamentos
interface Lancamento {
  id: string;
  descricao: string;
  valor: number;
  tipo: "receita" | "despesa" | "Receita" | "Despesa";
  categoria: string;
  tipoLancamento: "individual" | "compartilhado";
  responsavel: string;
  data: Date;
  pago: boolean;
  origem?: string;
  mensagemOriginal?: string;
  recorrente: boolean;
  frequencia?: string;
  observacoes?: string;
}

interface ResumoMensal {
  receitas: number;
  despesas: number;
  saldo: number;
  compartilhado: number;
  individualEle: number;
  individualEla: number;
}

interface Meta {
  id: string;
  titulo: string;
  descricao: string | null;
  valorAlvo: number;
  valorAtual: number;
  dataLimite: Date | null;
  tipo: string;
  responsavel: string;
  categoria: string;
  concluida: boolean;
}

interface TotaisPorCategoria {
  categoria: string;
  tipo: string;
  _sum: {
    valor: number | null;
  };
}

interface DadosPizza {
  name: string;
  value: number;
  color: string;
}

interface DadosBarra {
  mes: string;
  receitas: number;
  despesas: number;
}

const meses = [
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

// Cores para os gráficos
const CORES_GRAFICO = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#F9C80E",
  "#FF8E53",
  "#96CEB4",
  "#FD3A4A",
  "#C5E1A5",
  "#81D4FA",
  "#FFCC80",
  "#CE93D8",
  "#80CBC4",
];

export default function DashboardLancamentosPage() {
  const router = useRouter();
  const [carregandoGraficos, setCarregandoGraficos] = useState(false);
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [carregando, setCarregando] = useState(false);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [totaisPorCategoria, setTotaisPorCategoria] = useState<
    TotaisPorCategoria[]
  >([]);
  const [resumoMensal, setResumoMensal] = useState<ResumoMensal>({
    receitas: 0,
    despesas: 0,
    saldo: 0,
    compartilhado: 0,
    individualEle: 0,
    individualEla: 0,
  });
  const [dadosPizza, setDadosPizza] = useState<DadosPizza[]>([]);
  const [dadosBarras, setDadosBarras] = useState<DadosBarra[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    carregarDados();
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [mesAtual, anoAtual]);

  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  const carregarDados = async () => {
    setCarregando(true);
    setCarregandoGraficos(true); // Iniciar carregamento dos gráficos
    try {
      const params = new URLSearchParams({
        mes: (mesAtual + 1).toString(),
        ano: anoAtual.toString(),
      });

      const [lancamentosResponse, metasResponse] = await Promise.all([
        fetch(`/api/lancamentos?${params}`),
        fetch("/api/metas"),
      ]);

      if (!lancamentosResponse.ok || !metasResponse.ok) {
        throw new Error("Erro ao carregar dados");
      }

      const lancamentosData = await lancamentosResponse.json();
      const metasData = await metasResponse.json();

      setLancamentos(lancamentosData.lancamentos);
      setTotaisPorCategoria(lancamentosData.totaisPorCategoria);
      setMetas(metasData.filter((meta: Meta) => !meta.concluida).slice(0, 3));

      calcularResumo(lancamentosData.lancamentos);
      await prepararDadosGraficos(
        lancamentosData.lancamentos,
        lancamentosData.totaisPorCategoria
      );

      toast.success(`Dados de ${meses[mesAtual]} carregados!`);
    } catch (error) {
      toast.error("Erro ao carregar dados");
      console.error(error);
    } finally {
      setCarregando(false);
      setCarregandoGraficos(false); // Finalizar carregamento dos gráficos
    }
  };

  const calcularResumo = (lancamentos: Lancamento[]) => {
    const receitas = lancamentos
      .filter((l) => normalizarTipo(l.tipo) === "receita")
      .reduce((sum, l) => sum + l.valor, 0);

    const despesas = lancamentos
      .filter((l) => normalizarTipo(l.tipo) === "despesa")
      .reduce((sum, l) => sum + l.valor, 0);

    const despesasCompartilhadas = lancamentos
      .filter(
        (l) =>
          l.tipoLancamento === "compartilhado" &&
          normalizarTipo(l.tipo) === "despesa"
      )
      .reduce((sum, l) => sum + l.valor, 0);

    const individualEle = lancamentos
      .filter((l) => l.responsavel === "Claudenir")
      .reduce(
        (sum, l) =>
          sum + (normalizarTipo(l.tipo) === "receita" ? l.valor : -l.valor),
        0
      );

    const individualEla = lancamentos
      .filter((l) => l.responsavel === "Beatriz")
      .reduce(
        (sum, l) =>
          sum + (normalizarTipo(l.tipo) === "receita" ? l.valor : -l.valor),
        0
      );

    setResumoMensal({
      receitas,
      despesas,
      saldo: receitas - despesas,
      compartilhado: despesasCompartilhadas,
      individualEle,
      individualEla,
    });
  };

  // Componente de Skeleton para o gráfico de pizza - Spinner
  const PieChartSkeleton = () => (
    <div className="h-48 md:h-64 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-3">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500">Carregando gráfico...</p>
      </div>
    </div>
  );

  // Componente de Skeleton para o gráfico de barras - Spinner
  const BarChartSkeleton = () => (
    <div className="h-48 md:h-64 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-3">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500">Carregando dados...</p>
      </div>
    </div>
  );

  // Componente de Skeleton para cards - Spinner
  const CardSkeleton = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
        <div className="h-4 w-16 bg-gray-100 rounded"></div>
        <div className="w-4 h-4 flex items-center justify-center">
          <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="h-6 w-20 bg-gray-100 rounded"></div>
      </CardContent>
    </Card>
  );

  const prepararDadosGraficos = async (
    lancamentos: Lancamento[],
    totais: TotaisPorCategoria[]
  ) => {
    const dadosPizza = totais
      .filter((item) => {
        const tipoNormalizado = normalizarTipo(item.tipo);
        return (
          tipoNormalizado === "despesa" &&
          item._sum.valor &&
          item._sum.valor > 0
        );
      })
      .map((item, index) => ({
        name: formatarCategoria(item.categoria),
        value: item._sum.valor || 0,
        color: CORES_GRAFICO[index % CORES_GRAFICO.length],
      }));

    setDadosPizza(dadosPizza);
    const dadosBarras = await prepararDadosBarrasHistoricos();
    setDadosBarras(dadosBarras);
  };

  const prepararDadosBarrasHistoricos = async (): Promise<DadosBarra[]> => {
    try {
      const dadosMensais = [];

      for (let i = 5; i >= 0; i--) {
        const data = new Date(anoAtual, mesAtual - i, 1);
        const mes = data.getMonth();
        const ano = data.getFullYear();

        const params = new URLSearchParams({
          mes: (mes + 1).toString(),
          ano: ano.toString(),
        });

        const response = await fetch(`/api/lancamentos?${params}`);

        if (response.ok) {
          const data = await response.json();
          const lancamentosMes = data.lancamentos || [];

          const receitas = lancamentosMes
            .filter((l: Lancamento) => normalizarTipo(l.tipo) === "receita")
            .reduce((sum: number, l: Lancamento) => sum + l.valor, 0);

          const despesas = lancamentosMes
            .filter((l: Lancamento) => normalizarTipo(l.tipo) === "despesa")
            .reduce((sum: number, l: Lancamento) => sum + l.valor, 0);

          dadosMensais.push({
            mes: meses[mes].substring(0, 3) + "/" + ano.toString().slice(-2),
            receitas,
            despesas,
          });
        } else {
          dadosMensais.push({
            mes: meses[mes].substring(0, 3) + "/" + ano.toString().slice(-2),
            receitas: 0,
            despesas: 0,
          });
        }
      }

      return dadosMensais;
    } catch (error) {
      console.error("Erro ao buscar dados históricos:", error);
      return Array.from({ length: 6 }, (_, i) => {
        const mesIndex = (mesAtual - i + 12) % 12;
        const ano = anoAtual - Math.floor((mesAtual - i) / 12);
        return {
          mes: meses[mesIndex].substring(0, 3) + "/" + ano.toString().slice(-2),
          receitas: 0,
          despesas: 0,
        };
      }).reverse();
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarMoedaMobile = (valor: number) => {
    if (Math.abs(valor) >= 1000) {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(valor);
    }
    return formatarMoeda(valor);
  };

  const formatarCategoria = (categoria: string) => {
    const categorias: Record<string, string> = {
      salario: "Salário",
      freela: "Freelance",
      investimentos: "Investimentos",
      alimentacao: "Alimentação",
      transporte: "Transporte",
      casa: "Casa",
      pessoal: "Pessoal",
      lazer: "Lazer",
      outros: "Outros",
    };
    return categorias[categoria] || categoria;
  };

  const mudarMes = (direcao: "anterior" | "proximo") => {
    if (direcao === "anterior") {
      if (mesAtual === 0) {
        setMesAtual(11);
        setAnoAtual(anoAtual - 1);
      } else {
        setMesAtual(mesAtual - 1);
      }
    } else {
      if (mesAtual === 11) {
        setMesAtual(0);
        setAnoAtual(anoAtual + 1);
      } else {
        setMesAtual(mesAtual + 1);
      }
    }
  };

  const handleNovoLancamento = () => {
    router.push("/dashboard/lancamentos/novo");
  };

  const handleVerMetas = () => {
    router.push("/dashboard/metas");
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-md">
          <p className="font-semibold text-black">{label}</p>
          <p className="text-green-600">
            Receitas: {formatarMoeda(payload[0].value)}
          </p>
          <p className="text-red-600">
            Despesas: {formatarMoeda(payload[1].value)}
          </p>
          <p className="font-medium text-black">
            Saldo: {formatarMoeda(payload[0].value - payload[1].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const total = dadosPizza.reduce((sum, item) => sum + item.value, 0);
      const porcentagem = total > 0 ? (payload[0].value / total) * 100 : 0;

      return (
        <div className="bg-white p-3 border rounded-lg shadow-md">
          <p className="font-semibold text-black">{payload[0].name}</p>
          <p className="text-black">{formatarMoeda(payload[0].value)}</p>
          <p className="text-black">{porcentagem.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  const normalizarTipo = (tipo: string): "receita" | "despesa" => {
    const tipoLower = tipo.toLowerCase();
    if (tipoLower === "receita" || tipoLower === "despesa") {
      return tipoLower as "receita" | "despesa";
    }
    return tipoLower as "receita" | "despesa";
  };

  return (
    <div className="container mx-auto p-4 md:p-6 mt-16 md:mt-20">
      {/* Header Mobile Otimizado */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Visão geral das finanças
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={carregarDados}
              disabled={carregando}
              className="h-9 w-9"
            >
              <RefreshCw
                className={`h-3 w-3 md:h-4 md:w-4 ${carregando ? "animate-spin" : ""}`}
              />
            </Button>
            <Button size="sm" onClick={handleNovoLancamento} className="h-9">
              <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Novo</span>
            </Button>
          </div>
        </div>

        {/* Seletor de Mês Mobile */}
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => mudarMes("anterior")}
              className="h-8 w-8 p-0"
              disabled={carregando}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center flex-1">
              {carregando ? (
                <Skeleton className="h-6 w-32 mx-auto" />
              ) : (
                <>
                  <h3 className="text-lg md:text-xl font-semibold">
                    {meses[mesAtual]}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {anoAtual}
                  </p>
                </>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => mudarMes("proximo")}
              className="h-8 w-8 p-0"
              disabled={carregando}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      {/* Cards de Resumo - Layout Mobile Otimizado */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {carregando ? (
          // Skeletons durante o carregamento
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          // Cards reais quando carregados
          <>
            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">
                  Saldo
                </CardTitle>
                <Wallet className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div
                  className={`text-lg md:text-2xl font-bold ${resumoMensal.saldo >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {isMobile
                    ? formatarMoedaMobile(resumoMensal.saldo)
                    : formatarMoeda(resumoMensal.saldo)}
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">
                  Receitas
                </CardTitle>
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-lg md:text-2xl font-bold text-green-600">
                  {isMobile
                    ? formatarMoedaMobile(resumoMensal.receitas)
                    : formatarMoeda(resumoMensal.receitas)}
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">
                  Despesas
                </CardTitle>
                <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-lg md:text-2xl font-bold text-red-600">
                  {isMobile
                    ? formatarMoedaMobile(resumoMensal.despesas)
                    : formatarMoeda(resumoMensal.despesas)}
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">
                  Compart.
                </CardTitle>
                <Handshake className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-lg md:text-2xl font-bold text-blue-600">
                  {isMobile
                    ? formatarMoedaMobile(resumoMensal.compartilhado)
                    : formatarMoeda(resumoMensal.compartilhado)}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Gráficos - Stack vertical no mobile */}
      <div className="grid grid-cols-1 gap-4 md:gap-6 mb-6">
        {/* Gráfico de Pizza */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <PieChart className="h-4 w-4 md:h-5 md:w-5" />
              Gastos por Categoria
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Distribuição dos seus gastos
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {carregandoGraficos ? (
              <PieChartSkeleton />
            ) : dadosPizza.length > 0 ? (
              <div className="h-48 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={dadosPizza}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        isMobile
                          ? `${(percent * 100).toFixed(0)}%`
                          : `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={isMobile ? 60 : 80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosPizza.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    {!isMobile && <Legend />}
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 md:h-64 flex flex-col items-center justify-center text-muted-foreground">
                <PieChart className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm">Nenhuma despesa este mês</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Barras */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
              Evolução Mensal
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Receitas vs Despesas
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {carregandoGraficos ? (
              <BarChartSkeleton />
            ) : (
              <div className="h-48 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dadosBarras}
                    margin={
                      isMobile
                        ? { top: 10, right: 10, left: 0, bottom: 10 }
                        : { top: 20, right: 30, left: 20, bottom: 5 }
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="mes"
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? "end" : "middle"}
                      fontSize={isMobile ? 10 : 12}
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        isMobile ? `R$${value / 1000}k` : `R$ ${value / 1000}k`
                      }
                      fontSize={isMobile ? 10 : 12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {!isMobile && <Legend />}
                    <Bar
                      dataKey="receitas"
                      fill="#4CAF50"
                      name="Receitas"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="despesas"
                      fill="#F44336"
                      name="Despesas"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Metas Financeiras */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Target className="h-4 w-4 md:h-5 md:w-5" />
              Metas Financeiras
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleVerMetas}>
              <span className="hidden sm:inline">Ver Todas</span>
              <span className="sm:hidden">Todas</span>
            </Button>
          </div>
          <CardDescription className="text-xs md:text-sm">
            Progresso das suas metas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 space-y-4 md:space-y-6">
          {metas.length > 0 ? (
            metas.map((meta) => {
              const progresso = (meta.valorAtual / meta.valorAlvo) * 100;

              return (
                <div key={meta.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm md:text-base line-clamp-1">
                      {meta.titulo}
                    </span>
                    <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap ml-2">
                      {isMobile
                        ? formatarMoedaMobile(meta.valorAtual)
                        : formatarMoeda(meta.valorAtual)}{" "}
                      /{" "}
                      {isMobile
                        ? formatarMoedaMobile(meta.valorAlvo)
                        : formatarMoeda(meta.valorAlvo)}
                    </span>
                  </div>
                  <Progress value={progresso} className="h-2" />
                  <div className="text-xs text-muted-foreground flex justify-between">
                    <span>{progresso.toFixed(0)}% completo</span>
                    <span>
                      Falta{" "}
                      {isMobile
                        ? formatarMoedaMobile(meta.valorAlvo - meta.valorAtual)
                        : formatarMoeda(meta.valorAlvo - meta.valorAtual)}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-muted-foreground py-6 md:py-8">
              <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma meta ativa no momento</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
