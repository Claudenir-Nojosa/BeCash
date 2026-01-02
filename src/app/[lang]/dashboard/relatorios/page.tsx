// app/dashboard/relatorios/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  Filter,
  Calendar,
  CreditCard,
  Tag,
  BarChart3,
  PieChart,
  Plus,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Categoria {
  id: string;
  nome: string;
  cor: string;
  icone: string;
}

interface Lancamento {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  tipo: string;
  pago: boolean;
  categoria?: Categoria;
  cartao?: {
    id: string;
    nome: string;
    cor: string;
  };
}

interface Cartao {
  id: string;
  nome: string;
  cor: string;
  bandeira: string;
}

export default function RelatoriosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cartaoId = searchParams.get("cartaoId");

  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtros, setFiltros] = useState({
    cartaoId: cartaoId || "todos",
    periodo: "30",
    tipo: "todos",
    categoriaId: "todas",
  });

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (cartoes.length > 0) {
      carregarLancamentos();
    }
  }, [filtros, cartoes]);

  const exportarPDF = () => {
    const doc = new jsPDF();

    // Cabeçalho
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("Relatório Financeiro", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 105, 30, {
      align: "center",
    });

    // Informações do Filtro
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    let yPos = 50;

    doc.text("Filtros Aplicados:", 14, yPos);
    yPos += 7;
    doc.text(
      `• Período: ${filtros.periodo === "todos" ? "Todo período" : `Últimos ${filtros.periodo} dias`}`,
      20,
      yPos
    );
    yPos += 5;
    doc.text(
      `• Cartão: ${filtros.cartaoId === "todos" ? "Todos" : cartoes.find((c) => c.id === filtros.cartaoId)?.nome}`,
      20,
      yPos
    );

    // Estatísticas
    yPos += 15;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0); // Preto puro
    doc.setFont("helvetica", "bold");
    doc.text("ESTATÍSTICAS GERAIS", 14, yPos);

    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    autoTable(doc, {
      startY: yPos,
      head: [["Descrição", "Valor"]],
      body: [
        ["Total de Despesas", formatarMoeda(estatisticas.totalDespesas)],
        ["Total de Receitas", formatarMoeda(estatisticas.totalReceitas)],
        ["Saldo", formatarMoeda(estatisticas.saldo)],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [30, 41, 59] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Ranking por Categoria
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0); // Preto puro
    doc.setFont("helvetica", "bold");
    doc.text("TOP CATEGORIAS", 14, yPos);

    yPos += 10;
    const categoriaData = rankingCategorias
      .slice(0, 5)
      .map(([nome, data]) => [
        nome,
        formatarMoeda(data.total),
        `${((data.total / estatisticas.totalDespesas) * 100).toFixed(1)}%`,
      ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Categoria", "Valor Gasto", "%"]],
      body: categoriaData,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [30, 41, 59] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Últimos Lançamentos
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0); // Preto puro
    doc.setFont("helvetica", "bold");
    doc.text("ÚLTIMOS LANÇAMENTOS", 14, yPos);

    yPos += 10;
    const lancamentosData = lancamentos
      .slice(0, 10)
      .map((lanc) => [
        new Date(lanc.data).toLocaleDateString("pt-BR"),
        lanc.descricao.substring(0, 30),
        lanc.tipo === "DESPESA" ? "Despesa" : "Receita",
        formatarMoeda(lanc.valor),
      ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Data", "Descrição", "Tipo", "Valor"]],
      body: lancamentosData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 41, 59] },
    });

    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Página ${i} de ${pageCount} • Gerado pelo Finanças Pessoais`,
        105,
        290,
        { align: "center" }
      );
    }

    doc.save(
      `relatorio-financeiro-${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  const carregarDados = async () => {
    try {
      setCarregando(true);

      // Carregar cartões
      const cartoesResponse = await fetch("/api/cartoes");
      if (cartoesResponse.ok) {
        const cartoesData = await cartoesResponse.json();
        setCartoes(cartoesData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setCarregando(false);
    }
  };

  const carregarLancamentos = async () => {
    try {
      let url = "/api/lancamentos?";
      const params = new URLSearchParams();

      if (filtros.cartaoId !== "todos") {
        params.append("cartaoId", filtros.cartaoId);
      }

      if (filtros.periodo !== "todos") {
        const dataFim = new Date();
        const dataInicio = new Date();
        dataInicio.setDate(dataInicio.getDate() - parseInt(filtros.periodo));
        params.append("dataInicio", dataInicio.toISOString());
        params.append("dataFim", dataFim.toISOString());
      }

      const response = await fetch(url + params.toString());
      if (response.ok) {
        const data = await response.json();
        setLancamentos(data);
      }
    } catch (error) {
      console.error("Erro ao carregar lançamentos:", error);
    }
  };

  // Calcular estatísticas
  const estatisticas = {
    totalDespesas: lancamentos
      .filter((l) => l.tipo === "DESPESA")
      .reduce((sum, l) => sum + l.valor, 0),
    totalReceitas: lancamentos
      .filter((l) => l.tipo === "RECEITA")
      .reduce((sum, l) => sum + l.valor, 0),
    saldo:
      lancamentos
        .filter((l) => l.tipo === "RECEITA")
        .reduce((sum, l) => sum + l.valor, 0) -
      lancamentos
        .filter((l) => l.tipo === "DESPESA")
        .reduce((sum, l) => sum + l.valor, 0),
  };

  // Agrupar por categoria
  const despesasPorCategoria = lancamentos
    .filter((l) => l.tipo === "DESPESA")
    .reduce(
      (acc, lancamento) => {
        const categoriaNome = lancamento.categoria?.nome || "Sem Categoria";
        if (!acc[categoriaNome]) {
          acc[categoriaNome] = {
            total: 0,
            cor: lancamento.categoria?.cor || "#6B7280",
            icone: lancamento.categoria?.icone || "Tag",
            quantidade: 0,
          };
        }
        acc[categoriaNome].total += lancamento.valor;
        acc[categoriaNome].quantidade += 1;
        return acc;
      },
      {} as Record<
        string,
        { total: number; cor: string; icone: string; quantidade: number }
      >
    );

  const rankingCategorias = Object.entries(despesasPorCategoria).sort(
    ([, a], [, b]) => b.total - a.total
  );
  // Componente Skeleton para cards
  const SkeletonCard = () => (
    <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-700/50 rounded-lg"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
          <div className="h-3 bg-gray-700/50 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30"
          >
            <div className="w-8 h-8 bg-gray-700/50 rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-700/50 rounded w-2/3"></div>
              <div className="h-2 bg-gray-700/50 rounded w-1/2"></div>
            </div>
            <div className="text-right space-y-1">
              <div className="h-4 bg-gray-700/50 rounded w-16"></div>
              <div className="h-3 bg-gray-700/50 rounded w-12"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Skeleton para estatísticas
  const SkeletonStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6 animate-pulse"
        >
          <div className="h-5 bg-gray-700/50 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-700/50 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-700/50 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );

  // Skeleton para filtros
  const SkeletonFilters = () => (
    <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6 animate-pulse">
      <div className="h-6 bg-gray-700/50 rounded w-1/4 mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-700/50 rounded w-20"></div>
            <div className="h-10 bg-gray-700/50 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
  // Agrupar por cartão
  const despesasPorCartao = lancamentos
    .filter((l) => l.tipo === "DESPESA")
    .reduce(
      (acc, lancamento) => {
        const cartaoNome = lancamento.cartao?.nome || "Sem Cartão";
        if (!acc[cartaoNome]) {
          acc[cartaoNome] = {
            total: 0,
            cor: lancamento.cartao?.cor || "#6B7280",
            quantidade: 0,
          };
        }
        acc[cartaoNome].total += lancamento.valor;
        acc[cartaoNome].quantidade += 1;
        return acc;
      },
      {} as Record<string, { total: number; cor: string; quantidade: number }>
    );

  const rankingCartoes = Object.entries(despesasPorCartao).sort(
    ([, a], [, b]) => b.total - a.total
  );

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const getIcone = (icone: string) => {
    try {
      const IconComponent = require("lucide-react")[icone];
      return <IconComponent className="w-4 h-4 text-white" />;
    } catch {
      return <Tag className="w-4 h-4 text-white" />;
    }
  };

  const exportarRelatorio = () => {
    const dados = {
      periodo: filtros.periodo,
      cartao:
        filtros.cartaoId === "todos"
          ? "Todos os cartões"
          : cartoes.find((c) => c.id === filtros.cartaoId)?.nome,
      estatisticas,
      categorias: rankingCategorias,
      cartoes: rankingCartoes,
      lancamentos: lancamentos.slice(0, 100), // Limitar para não ficar muito grande
    };

    const blob = new Blob([JSON.stringify(dados, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-financeiro-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (carregando) {
    return (
      <div className="min-h-screen ">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-lg animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded w-96 animate-pulse"></div>
            </div>
          </div>

          {/* Filtros Skeleton */}
          <SkeletonFilters />

          {/* Stats Skeleton */}
          <SkeletonStats />

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>

          {/* Lançamentos Skeleton */}
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-700/50 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30"
                >
                  <div className="w-12 h-12 bg-gray-700/50 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700/50 rounded w-1/2"></div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="h-5 bg-gray-700/50 rounded w-20"></div>
                    <div className="h-4 bg-gray-700/50 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-white dark:bg-transparent">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/dashboard/cartoes")}
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Relatórios Financeiros
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Análise completa dos seus gastos e receitas
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={"outline"}
              onClick={exportarPDF}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Filter className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              </div>
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="cartao"
                  className="text-gray-700 dark:text-gray-300"
                >
                  Cartão
                </Label>
                <Select
                  value={filtros.cartaoId}
                  onValueChange={(value) =>
                    setFiltros((prev) => ({ ...prev, cartaoId: value }))
                  }
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                    <SelectValue placeholder="Selecione o cartão" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                    <SelectItem value="todos">Todos os cartões</SelectItem>
                    {cartoes.map((cartao) => (
                      <SelectItem key={cartao.id} value={cartao.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cartao.cor }}
                          />
                          {cartao.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="periodo"
                  className="text-gray-700 dark:text-gray-300"
                >
                  Período
                </Label>
                <Select
                  value={filtros.periodo}
                  onValueChange={(value) =>
                    setFiltros((prev) => ({ ...prev, periodo: value }))
                  }
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                    <SelectItem value="365">Últimos 12 meses</SelectItem>
                    <SelectItem value="todos">Todo o período</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="tipo"
                  className="text-gray-700 dark:text-gray-300"
                >
                  Tipo
                </Label>
                <Select
                  value={filtros.tipo}
                  onValueChange={(value) =>
                    setFiltros((prev) => ({ ...prev, tipo: value }))
                  }
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="DESPESA">Despesas</SelectItem>
                    <SelectItem value="RECEITA">Receitas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="data"
                  className="text-gray-700 dark:text-gray-300"
                >
                  Data Customizada
                </Label>
                <Input
                  type="date"
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                  onChange={(e) =>
                    console.log("Data customizada:", e.target.value)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 dark:text-white text-lg">
                Total de Despesas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">
                {formatarMoeda(estatisticas.totalDespesas)}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                {lancamentos.filter((l) => l.tipo === "DESPESA").length}{" "}
                lançamentos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 dark:text-white text-lg">
                Total de Receitas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-green-400">
                {formatarMoeda(estatisticas.totalReceitas)}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                {lancamentos.filter((l) => l.tipo === "RECEITA").length}{" "}
                lançamentos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 dark:text-white text-lg">
                Saldo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl sm:text-3xl font-bold ${
                  estatisticas.saldo >= 0
                    ? "text-emerald-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatarMoeda(estatisticas.saldo)}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                {estatisticas.saldo >= 0 ? "Superávit" : "Déficit"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ranking por Categoria */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <PieChart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                Despesas por Categoria
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Distribuição dos gastos por categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rankingCategorias.map(
                  ([categoriaNome, categoriaData], index) => {
                    const porcentagem =
                      estatisticas.totalDespesas > 0
                        ? (categoriaData.total / estatisticas.totalDespesas) *
                          100
                        : 0;

                    return (
                      <div
                        key={categoriaNome}
                        className="flex justify-between items-center p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/50"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: categoriaData.cor }}
                          >
                            {getIcone(categoriaData.icone)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 dark:text-white text-sm font-medium truncate">
                              {categoriaNome}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">
                              {categoriaData.quantidade} lançamentos
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-gray-900 dark:text-white font-medium">
                            {formatarMoeda(categoriaData.total)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {porcentagem.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
                {rankingCategorias.length === 0 && !carregando && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <PieChart className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Sem dados de categorias
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Adicione despesas categorizadas para ver a distribuição
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ranking por Cartão */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                Despesas por Cartão
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Distribuição dos gastos por cartão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rankingCartoes.map(([cartaoNome, cartaoData], index) => {
                  const porcentagem =
                    estatisticas.totalDespesas > 0
                      ? (cartaoData.total / estatisticas.totalDespesas) * 100
                      : 0;

                  return (
                    <div
                      key={cartaoNome}
                      className="flex justify-between items-center p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: cartaoData.cor }}
                        >
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 dark:text-white text-sm font-medium truncate">
                            {cartaoNome}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">
                            {cartaoData.quantidade} lançamentos
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-gray-900 dark:text-white font-medium">
                          {formatarMoeda(cartaoData.total)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {porcentagem.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  );
                })}

                {rankingCartoes.length === 0 && (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Nenhuma despesa encontrada
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Últimos Lançamentos */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <BarChart3 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              Últimos Lançamentos
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {lancamentos.length} lançamentos encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lancamentos.slice(0, 10).map((lancamento) => (
                <div
                  key={lancamento.id}
                  className="flex justify-between items-center p-4 rounded-lg bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor:
                          lancamento.categoria?.cor ||
                          lancamento.cartao?.cor ||
                          "#6B7280",
                      }}
                    >
                      {lancamento.categoria ? (
                        getIcone(lancamento.categoria.icone)
                      ) : (
                        <CreditCard className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-white font-medium truncate">
                        {lancamento.descricao}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {new Date(lancamento.data).toLocaleDateString("pt-BR")}
                        {lancamento.cartao && ` • ${lancamento.cartao.nome}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p
                      className={`font-medium ${
                        lancamento.tipo === "DESPESA"
                          ? "text-red-600 dark:text-red-400"
                          : "text-emerald-600 dark:text-green-400"
                      }`}
                    >
                      {formatarMoeda(lancamento.valor)}
                    </p>
                    <Badge
                      variant="outline"
                      className={
                        lancamento.tipo === "DESPESA"
                          ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
                          : "bg-emerald-100 dark:bg-green-900/50 text-emerald-700 dark:text-green-300 border-emerald-200 dark:border-green-700"
                      }
                    >
                      {lancamento.tipo === "DESPESA" ? "Despesa" : "Receita"}
                    </Badge>
                  </div>
                </div>
              ))}

              {lancamentos.length === 0 && (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhum lançamento encontrado
                  </p>
                </div>
              )}
            </div>

            {lancamentos.length > 10 && (
              <Button
                variant="outline"
                className="w-full mt-4 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                onClick={() => router.push("/dashboard/lancamentos")}
              >
                Ver todos os lançamentos
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
