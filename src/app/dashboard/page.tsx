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

// Tipos para os lançamentos
interface Lancamento {
  id: string;
  descricao: string;
  valor: number;
  tipo: "receita" | "despesa" | "Receita" | "Despesa"; // Adicione os tipos com maiúscula
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

  useEffect(() => {
    carregarDados();
  }, [mesAtual, anoAtual]);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      // Carregar lançamentos
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
        // Agora é async
        lancamentosData.lancamentos,
        lancamentosData.totaisPorCategoria
      );

      toast.success(`Dados de ${meses[mesAtual]} carregados!`);
    } catch (error) {
      toast.error("Erro ao carregar dados");
      console.error(error);
    } finally {
      setCarregando(false);
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

  const prepararDadosGraficos = async (
    lancamentos: Lancamento[],
    totais: TotaisPorCategoria[]
  ) => {
    // Preparar dados para gráfico de pizza (despesas por categoria)
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

    // Buscar dados históricos dos últimos 6 meses
    const dadosBarras = await prepararDadosBarrasHistoricos();
    setDadosBarras(dadosBarras);
  };

  const prepararDadosBarrasHistoricos = async (): Promise<DadosBarra[]> => {
    try {
      const dadosMensais = [];

      // Buscar dados dos últimos 6 meses
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
          // Se não conseguir buscar dados, usar zeros
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

      // Fallback: retornar array vazio
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

  // Custom Tooltip para o gráfico de barras

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-md">
          <p className="font-semibold text-black">{label}</p>{" "}
          {/* Texto preto */}
          <p className="text-green-600 ">
            {" "}
            {/* Texto preto */}
            Receitas: {formatarMoeda(payload[0].value)}
          </p>
          <p className="text-red-600">
            {" "}
            {/* Texto preto */}
            Despesas: {formatarMoeda(payload[1].value)}
          </p>
          <p className="font-medium text-black">
            {" "}
            {/* Texto preto */}
            Saldo: {formatarMoeda(payload[0].value - payload[1].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip para o gráfico de pizza
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const total = dadosPizza.reduce((sum, item) => sum + item.value, 0);
      const porcentagem = total > 0 ? (payload[0].value / total) * 100 : 0;

      return (
        <div className="bg-white p-3 border rounded-lg shadow-md">
          <p className="font-semibold text-black">{payload[0].name}</p>{" "}
          {/* Texto preto */}
          <p className="text-black">{formatarMoeda(payload[0].value)}</p>{" "}
          {/* Texto preto */}
          <p className="text-black">{porcentagem.toFixed(1)}%</p>{" "}
          {/* Texto preto */}
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
    <div className="container mx-auto p-6 mt-20">
      {/* Header com Seletor de Mês à direita */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">
            Visão geral das suas finanças pessoais
          </p>
        </div>
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => mudarMes("anterior")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-center">
            <h3 className="text-xl font-semibold">{meses[mesAtual]}</h3>
            <p className="text-sm text-muted-foreground">{anoAtual}</p>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => mudarMes("proximo")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={carregarDados}
              disabled={carregando}
              className="w-32"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${carregando ? "animate-spin" : ""}`}
              />
              {carregando ? "Atualizando..." : "Atualizar"}
            </Button>
            <Button size="sm" onClick={handleNovoLancamento}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Lançamento
            </Button>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${resumoMensal.saldo >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatarMoeda(resumoMensal.saldo)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatarMoeda(resumoMensal.receitas)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatarMoeda(resumoMensal.despesas)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compartilhado</CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatarMoeda(resumoMensal.compartilhado)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Saldos Individuais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo Claudenir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-xl font-bold ${resumoMensal.individualEle >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatarMoeda(resumoMensal.individualEle)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo Beatriz</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-xl font-bold ${resumoMensal.individualEla >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatarMoeda(resumoMensal.individualEla)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Gráfico de Pizza */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição de Gastos
            </CardTitle>
            <CardDescription>Por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            {dadosPizza.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={dadosPizza}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosPizza.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Nenhuma despesa este mês
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Barras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Evolução Mensal
            </CardTitle>
            <CardDescription>Receitas vs Despesas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosBarras}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(value) => `R$ ${value / 1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="receitas" fill="#4CAF50" name="Receitas" />
                  <Bar dataKey="despesas" fill="#F44336" name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metas Financeiras */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Metas Financeiras
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleVerMetas}>
              Ver Todas
            </Button>
          </div>
          <CardDescription>Progresso das suas metas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {metas.length > 0 ? (
            metas.map((meta) => {
              const progresso = (meta.valorAtual / meta.valorAlvo) * 100;

              return (
                <div key={meta.id}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{meta.titulo}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatarMoeda(meta.valorAtual)} /{" "}
                      {formatarMoeda(meta.valorAlvo)}
                    </span>
                  </div>
                  <Progress value={progresso} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-1">
                    {progresso.toFixed(0)}% completo • Falta{" "}
                    {formatarMoeda(meta.valorAlvo - meta.valorAtual)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-muted-foreground py-4">
              Nenhuma meta ativa no momento
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
