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

// Tipos para os lançamentos
interface Lancamento {
  id: string;
  descricao: string;
  valor: number;
  tipo: "receita" | "despesa";
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

interface Objetivo {
  id: number;
  nome: string;
  meta: number;
  atual: number;
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

// Dados dummy para demonstração
const dummyLancamentos: Lancamento[] = [
  {
    id: "1",
    descricao: "Salário",
    valor: 5000,
    tipo: "receita",
    categoria: "salario",
    tipoLancamento: "individual",
    responsavel: "Claudenir",
    data: new Date(),
    pago: true,
    origem: "manual",
    recorrente: true,
    frequencia: "mensal",
  },
  {
    id: "2",
    descricao: "Freelance",
    valor: 1500,
    tipo: "receita",
    categoria: "freela",
    tipoLancamento: "individual",
    responsavel: "Claudenir",
    data: new Date(),
    pago: true,
    origem: "manual",
    recorrente: false,
  },
  {
    id: "3",
    descricao: "Mercado",
    valor: 850,
    tipo: "despesa",
    categoria: "alimentacao",
    tipoLancamento: "compartilhado",
    responsavel: "Compartilhado",
    data: new Date(),
    pago: true,
    origem: "manual",
    recorrente: false,
  },
  {
    id: "4",
    descricao: "Transporte",
    valor: 420,
    tipo: "despesa",
    categoria: "transporte",
    tipoLancamento: "individual",
    responsavel: "Claudenir",
    data: new Date(),
    pago: true,
    origem: "manual",
    recorrente: false,
  },
  {
    id: "5",
    descricao: "Aluguel",
    valor: 1200,
    tipo: "despesa",
    categoria: "casa",
    tipoLancamento: "compartilhado",
    responsavel: "Compartilhado",
    data: new Date(),
    pago: true,
    origem: "manual",
    recorrente: true,
    frequencia: "mensal",
  },
  {
    id: "6",
    descricao: "Salário Beatriz",
    valor: 3500,
    tipo: "receita",
    categoria: "salario",
    tipoLancamento: "individual",
    responsavel: "Beatriz",
    data: new Date(),
    pago: true,
    origem: "manual",
    recorrente: true,
    frequencia: "mensal",
  },
];

const dummyObjetivos: Objetivo[] = [
  { id: 1, nome: "Viagem de Férias", meta: 5000, atual: 3200 },
  { id: 2, nome: "Notebook Novo", meta: 3000, atual: 1500 },
  { id: 3, nome: "Reserva de Emergência", meta: 10000, atual: 7500 },
];

export default function DashboardLancamentosPage() {
  const router = useRouter();
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [carregando, setCarregando] = useState(false);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [resumoMensal, setResumoMensal] = useState<ResumoMensal>({
    receitas: 0,
    despesas: 0,
    saldo: 0,
    compartilhado: 0,
    individualEle: 0,
    individualEla: 0,
  });

  useEffect(() => {
    carregarDados();
  }, [mesAtual, anoAtual]);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      // Simulação de carregamento de dados da API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Em produção, substituir por:
      // const response = await fetch(`/api/lancamentos?mes=${mesAtual + 1}&ano=${anoAtual}`);
      // const data = await response.json();
      // setLancamentos(data.lancamentos);

      setLancamentos(dummyLancamentos);
      calcularResumo(dummyLancamentos);

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
      .filter((l) => l.tipo === "receita")
      .reduce((sum, l) => sum + l.valor, 0);

    const despesas = lancamentos
      .filter((l) => l.tipo === "despesa")
      .reduce((sum, l) => sum + l.valor, 0);

    const compartilhado = lancamentos
      .filter(
        (l) => l.tipoLancamento === "compartilhado" && l.tipo === "despesa"
      )
      .reduce((sum, l) => sum + l.valor, 0);

    const individualEle = lancamentos
      .filter((l) => l.responsavel === "Claudenir")
      .reduce((sum, l) => sum + (l.tipo === "receita" ? l.valor : -l.valor), 0);

    const individualEla = lancamentos
      .filter((l) => l.responsavel === "Beatriz")
      .reduce((sum, l) => sum + (l.tipo === "receita" ? l.valor : -l.valor), 0);

    setResumoMensal({
      receitas,
      despesas,
      saldo: receitas - despesas,
      compartilhado,
      individualEle,
      individualEla,
    });
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
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

  // Dados para gráficos baseados nos lançamentos reais
  const categoriasDespesas = lancamentos
    .filter((l) => l.tipo === "despesa")
    .reduce(
      (acc, l) => {
        acc[l.categoria] = (acc[l.categoria] || 0) + l.valor;
        return acc;
      },
      {} as Record<string, number>
    );

  const dadosPizza = Object.entries(categoriasDespesas).map(
    ([name, value], index) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#F9C80E", "#FF8E53", "#96CEB4"][
        index % 6
      ],
    })
  );

  const dadosBarras = [
    { mes: "Jan", receitas: 8000, despesas: 6000 },
    { mes: "Fev", receitas: 7500, despesas: 5500 },
    { mes: "Mar", receitas: 8500, despesas: 6500 },
    { mes: "Abr", receitas: 9000, despesas: 7000 },
    { mes: "Mai", receitas: 9500, despesas: 7200 },
    { mes: "Jun", receitas: 10000, despesas: 7800 },
  ];

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
            <div className="h-64 flex items-center justify-center">
              {dadosPizza.length > 0 ? (
                <div className="relative w-48 h-48">
                  {dadosPizza.map((item, index) => {
                    const total = dadosPizza.reduce(
                      (sum, d) => sum + d.value,
                      0
                    );
                    const percentage = (item.value / total) * 100;
                    const startAngle =
                      index === 0
                        ? 0
                        : dadosPizza
                            .slice(0, index)
                            .reduce(
                              (sum, d) => sum + (d.value / total) * 360,
                              0
                            );

                    return (
                      <div
                        key={item.name}
                        className="absolute w-full h-full"
                        style={{
                          clipPath: `conic-gradient(from ${startAngle}deg, ${item.color} 0deg ${startAngle + percentage * 3.6}deg, transparent ${startAngle + percentage * 3.6}deg)`,
                        }}
                      />
                    );
                  })}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-white rounded-full"></div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  Nenhuma despesa este mês
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {dadosPizza.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
              ))}
            </div>
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
            <div className="h-64 flex items-end justify-between gap-2">
              {dadosBarras.map((item, index) => {
                const maxValor = Math.max(
                  ...dadosBarras.map((d) => Math.max(d.receitas, d.despesas))
                );
                const alturaReceitas = (item.receitas / maxValor) * 100;
                const alturaDespesas = (item.despesas / maxValor) * 100;

                return (
                  <div key={index} className="flex flex-col items-center gap-1">
                    <div className="flex items-end gap-1">
                      <div
                        className="w-4 bg-green-500 rounded-t"
                        style={{ height: `${alturaReceitas}%` }}
                      />
                      <div
                        className="w-4 bg-red-500 rounded-t"
                        style={{ height: `${alturaDespesas}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.mes}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 justify-center mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-sm">Receitas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span className="text-sm">Despesas</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Objetivos Financeiros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Objetivos Financeiros
          </CardTitle>
          <CardDescription>Progresso das suas metas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {dummyObjetivos.map((objetivo) => {
            const progresso = (objetivo.atual / objetivo.meta) * 100;

            return (
              <div key={objetivo.id}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{objetivo.nome}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatarMoeda(objetivo.atual)} /{" "}
                    {formatarMoeda(objetivo.meta)}
                  </span>
                </div>
                <Progress value={progresso} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {progresso.toFixed(0)}% completo • Falta{" "}
                  {formatarMoeda(objetivo.meta - objetivo.atual)}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
