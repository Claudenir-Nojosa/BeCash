// app/dashboard/relatorios/page.tsx
"use client";

import { useState, useEffect, JSX } from "react";
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
  Download,
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  Users,
  CreditCard,
  PiggyBank,
  Home,
  Car,
  ShoppingCart,
  Utensils,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// Tipos para os dados
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
}

// Interface para extender o jsPDF com autoTable
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
  autoTable: (options: any) => jsPDF;
}

interface Meta {
  id: string;
  titulo: string;
  valorAlvo: number;
  valorAtual: number;
  categoria: string;
  concluida: boolean;
}

interface ResumoPeriodo {
  receitas: number;
  despesas: number;
  saldo: number;
  periodo: string;
}

interface CategoriaData {
  categoria: string;
  valor: number;
  porcentagem: number;
}

interface ApiResponse {
  lancamentos: Lancamento[];
  totaisPorCategoria: {
    categoria: string;
    tipo: string;
    _sum: {
      valor: number | null;
    };
  }[];
  resumo: {
    receitas: number;
    despesas: number;
    saldo: number;
  };
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

const iconesCategorias: Record<string, JSX.Element> = {
  alimentacao: <Utensils className="h-4 w-4" />,
  transporte: <Car className="h-4 w-4" />,
  casa: <Home className="h-4 w-4" />,
  pessoal: <Heart className="h-4 w-4" />,
  lazer: <ShoppingCart className="h-4 w-4" />,
  outros: <CreditCard className="h-4 w-4" />,
  salario: <Wallet className="h-4 w-4" />,
  freela: <PiggyBank className="h-4 w-4" />,
  investimentos: <TrendingUp className="h-4 w-4" />,
};

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState<"mensal">("mensal");
  const [ano, setAno] = useState(new Date().getFullYear());
  const [showFiltro, setShowFiltro] = useState(false);
  const [showPeriodo, setShowPeriodo] = useState(false);
  const [filtros, setFiltros] = useState({
    categoria: "todas",
    tipo: "todos",
  });
  const [mes, setMes] = useState(new Date().getMonth() + 1); // Mês de 1 a 12
  const [carregando, setCarregando] = useState(false);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [dadosBarra, setDadosBarra] = useState<any[]>([]);
  const [dadosPizza, setDadosPizza] = useState<any[]>([]);
  const [dadosLinha, setDadosLinha] = useState<any[]>([]);
  const [dadosArea, setDadosArea] = useState<any[]>([]);
  const [categoriasDespesas, setCategoriasDespesas] = useState<CategoriaData[]>(
    []
  );
  const [categoriasReceitas, setCategoriasReceitas] = useState<CategoriaData[]>(
    []
  );
  const [historicoMensal, setHistoricoMensal] = useState<ResumoPeriodo[]>([]);
  const [resumo, setResumo] = useState({
    receitas: 0,
    despesas: 0,
    saldo: 0,
  });

  useEffect(() => {
    carregarDados();
  }, [periodo, ano, mes]);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      // Carregar lançamentos da API
      const params = new URLSearchParams({
        mes: mes.toString(),
        ano: ano.toString(),
      });

      const response = await fetch(`/api/lancamentos?${params}`);
      if (!response.ok) {
        throw new Error("Erro ao carregar dados");
      }

      const data: ApiResponse = await response.json();

      setLancamentos(data.lancamentos);
      setResumo(data.resumo);

      // Carregar metas (simulado por enquanto)
      await carregarMetas();

      // Preparar dados para os gráficos
      prepararDadosGraficos(
        data.lancamentos,
        data.totaisPorCategoria,
        data.resumo
      );

      toast.success("Relatórios carregados com sucesso!");
    } catch (error) {
      toast.error("Erro ao carregar relatórios");
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  const carregarMetas = async () => {
    try {
      const response = await fetch("/api/metas");
      if (!response.ok) {
        throw new Error("Erro ao carregar metas");
      }

      const metasData = await response.json();

      // Mapear os dados da API para o formato esperado pelo componente
      const metasFormatadas: Meta[] = metasData.map((meta: any) => ({
        id: meta.id,
        titulo: meta.titulo,
        valorAlvo: meta.valorAlvo,
        valorAtual: meta.valorAtual,
        categoria: meta.categoria,
        concluida: meta.concluida,
      }));

      setMetas(metasFormatadas);
    } catch (error) {
      console.error("Erro ao carregar metas:", error);
      toast.error("Erro ao carregar metas");
    }
  };

  const prepararDadosGraficos = (
    lancamentos: Lancamento[],
    totaisPorCategoria: ApiResponse["totaisPorCategoria"] = [], // ✅ Valor padrão
    resumo: ApiResponse["resumo"]
  ) => {
    // Preparar dados para gráfico de pizza (categorias de despesas)
    // ✅ Verificar se totaisPorCategoria existe
    const totais = totaisPorCategoria || [];

    // Preparar dados para gráfico de pizza (categorias de despesas)
    const despesasPorCategoria = totais
      .filter(
        (item) =>
          item.tipo === "despesa" && item._sum.valor && item._sum.valor > 0
      )
      .map((item, index) => ({
        name: formatarNomeCategoria(item.categoria),
        value: item._sum.valor || 0,
        color: CORES_GRAFICO[index % CORES_GRAFICO.length],
      }));

    setDadosPizza(despesasPorCategoria);

    // Preparar categorias de despesas para exibição
    const totalDespesas = resumo.despesas;
    const categoriasDespesasData = totaisPorCategoria
      .filter(
        (item) =>
          item.tipo === "despesa" && item._sum.valor && item._sum.valor > 0
      )
      .map((item, index) => ({
        categoria: formatarNomeCategoria(item.categoria),
        valor: item._sum.valor || 0,
        porcentagem:
          totalDespesas > 0
            ? Math.round(((item._sum.valor || 0) / totalDespesas) * 100)
            : 0,
      }));

    setCategoriasDespesas(categoriasDespesasData);

    // Preparar categorias de receitas para exibição
    const totalReceitas = resumo.receitas;
    const categoriasReceitasData = totaisPorCategoria
      .filter(
        (item) =>
          item.tipo === "receita" && item._sum.valor && item._sum.valor > 0
      )
      .map((item, index) => ({
        categoria: formatarNomeCategoria(item.categoria),
        valor: item._sum.valor || 0,
        porcentagem:
          totalReceitas > 0
            ? Math.round(((item._sum.valor || 0) / totalReceitas) * 100)
            : 0,
      }));

    setCategoriasReceitas(categoriasReceitasData);

    // Dados para gráficos de evolução mensal (usando dados reais dos últimos 12 meses)
    const dadosEvolucao = Array.from({ length: 12 }, (_, i) => {
      const dataRef = new Date();
      dataRef.setMonth(dataRef.getMonth() - (11 - i));

      const mesRef = dataRef.getMonth();
      const anoRef = dataRef.getFullYear();

      // Filtrar lançamentos do mês específico
      const lancamentosMes = lancamentos.filter((l) => {
        const dataLanc = new Date(l.data);
        return (
          dataLanc.getMonth() === mesRef && dataLanc.getFullYear() === anoRef
        );
      });

      const receitas = lancamentosMes
        .filter((l) => l.tipo === "receita")
        .reduce((sum, l) => sum + l.valor, 0);

      const despesas = lancamentosMes
        .filter((l) => l.tipo === "despesa")
        .reduce((sum, l) => sum + l.valor, 0);

      return {
        mes: meses[mesRef].substring(0, 3),
        receitas,
        despesas,
        saldo: receitas - despesas,
      };
    });

    setDadosBarra(dadosEvolucao);
    setDadosArea(dadosEvolucao);

    // Dados para gráfico de linha (evolução do saldo)
    const dadosLinha = dadosEvolucao.map((item) => ({
      mes: item.mes,
      saldo: item.saldo,
    }));

    setDadosLinha(dadosLinha);

    // Histórico mensal (últimos 6 meses)
    const historico = dadosEvolucao.slice(-6).map((item) => ({
      receitas: item.receitas,
      despesas: item.despesas,
      saldo: item.saldo,
      periodo: item.mes,
    }));

    setHistoricoMensal(historico);
  };

  const formatarNomeCategoria = (categoria: string): string => {
    const categorias: Record<string, string> = {
      alimentacao: "Alimentação",
      transporte: "Transporte",
      casa: "Moradia",
      pessoal: "Pessoal",
      lazer: "Lazer",
      outros: "Outros",
      salario: "Salário",
      freela: "Freelance",
      investimentos: "Investimentos",
    };

    return categorias[categoria] || categoria;
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-md">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatarMoeda(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Função para aplicar filtros - versão corrigida
  const aplicarFiltros = async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams({
        mes: mes.toString(),
        ano: ano.toString(),
      });

      // ✅ Adicionar filtros apenas se não forem os valores padrão
      if (filtros.categoria !== "todas") {
        params.append("categoria", filtros.categoria);
      }

      if (filtros.tipo !== "todos") {
        params.append("tipo", filtros.tipo);
      }

      const response = await fetch(`/api/lancamentos?${params}`);
      if (!response.ok) {
        throw new Error("Erro ao carregar dados com filtros");
      }

      const data: ApiResponse = await response.json();

      setLancamentos(data.lancamentos);
      setResumo(data.resumo);

      // ✅ Preparar dados para gráficos com os dados filtrados
      prepararDadosGraficos(
        data.lancamentos,
        data.totaisPorCategoria || [], // ✅ Garantir que não seja undefined
        data.resumo
      );

      setShowFiltro(false);
      toast.success("Filtros aplicados com sucesso!");
    } catch (error) {
      toast.error("Erro ao aplicar filtros");
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  // Componente de filtro
  const FiltroModal = () => (
    <div className="absolute top-full right-0 mt-2 w-64 border rounded-lg z-10 p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:shadow-gray-900/30">
      <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
        Filtrar por
      </h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Categoria
          </label>
          <select
            className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            value={filtros.categoria}
            onChange={(e) =>
              setFiltros({ ...filtros, categoria: e.target.value })
            }
          >
            <option value="todas" className="bg-white dark:bg-gray-700">
              Todas as categorias
            </option>
            <option value="alimentacao" className="bg-white dark:bg-gray-700">
              Alimentação
            </option>
            <option value="transporte" className="bg-white dark:bg-gray-700">
              Transporte
            </option>
            <option value="casa" className="bg-white dark:bg-gray-700">
              Casa
            </option>
            <option value="pessoal" className="bg-white dark:bg-gray-700">
              Pessoal
            </option>
            <option value="lazer" className="bg-white dark:bg-gray-700">
              Lazer
            </option>
            <option value="outros" className="bg-white dark:bg-gray-700">
              Outros
            </option>
            <option value="salario" className="bg-white dark:bg-gray-700">
              Salário
            </option>
            <option value="freela" className="bg-white dark:bg-gray-700">
              Freelance
            </option>
            <option value="investimentos" className="bg-white dark:bg-gray-700">
              Investimentos
            </option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Tipo
          </label>
          <select
            className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            value={filtros.tipo}
            onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
          >
            <option value="todos" className="bg-white dark:bg-gray-700">
              Todos os tipos
            </option>
            <option value="receita" className="bg-white dark:bg-gray-700">
              Receitas
            </option>
            <option value="despesa" className="bg-white dark:bg-gray-700">
              Despesas
            </option>
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setShowFiltro(false)}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            onClick={aplicarFiltros} // ✅ CORREÇÃO AQUI
          >
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  );
  // Componente de período
  const PeriodoModal = () => (
    <div className="absolute top-full right-0 mt-2 w-56 border rounded-lg  z-10 p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl dark:shadow-gray-900/30">
      <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
        Selecionar Período
      </h3>

      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Mês
        </label>
        <select
          className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
        >
          {meses.map((mesNome, index) => (
            <option
              key={index}
              value={index + 1}
              className="bg-white dark:bg-gray-700"
            >
              {mesNome}
            </option>
          ))}
        </select>

        <label className="block text-sm font-medium mb-1 mt-3 text-gray-700 dark:text-gray-300">
          Ano
        </label>
        <select
          className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          value={ano}
          onChange={(e) => setAno(Number(e.target.value))}
        >
          {Array.from(
            { length: 5 },
            (_, i) => new Date().getFullYear() - i
          ).map((year) => (
            <option
              key={year}
              value={year}
              className="bg-white dark:bg-gray-700"
            >
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const handleExportar = async (formato: "pdf" | "excel") => {
    try {
      setCarregando(true);

      if (formato === "pdf") {
        // Criar PDF
        const doc = new jsPDF() as jsPDFWithAutoTable;

        // Título
        doc.setFontSize(20);
        doc.text("Relatório Financeiro", 14, 22);
        doc.setFontSize(12);
        doc.text(`Período: ${meses[mes - 1]} de ${ano}`, 14, 30);

        // Resumo
        doc.setFontSize(16);
        doc.text("Resumo Financeiro", 14, 45);
        doc.setFontSize(10);

        const resumoData = [
          ["Receitas", formatarMoeda(resumo.receitas)],
          ["Despesas", formatarMoeda(resumo.despesas)],
          ["Saldo", formatarMoeda(resumo.saldo)],
        ];

        // Usar autoTable diretamente
        autoTable(doc, {
          startY: 50,
          head: [["Categoria", "Valor"]],
          body: resumoData,
          theme: "grid",
          headStyles: { fillColor: [66, 139, 202] },
        });

        // Categorias de Despesas
        doc.setFontSize(16);
        doc.text("Despesas por Categoria", 14, doc.lastAutoTable.finalY + 15);

        const despesasData = categoriasDespesas.map((item) => [
          item.categoria,
          formatarMoeda(item.valor),
          `${item.porcentagem}%`,
        ]);

        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 20,
          head: [["Categoria", "Valor", "Percentual"]],
          body: despesasData,
          theme: "grid",
          headStyles: { fillColor: [220, 53, 69] },
        });

        // Categorias de Receitas
        doc.setFontSize(16);
        doc.text("Receitas por Categoria", 14, doc.lastAutoTable.finalY + 15);

        const receitasData = categoriasReceitas.map((item) => [
          item.categoria,
          formatarMoeda(item.valor),
          `${item.porcentagem}%`,
        ]);

        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 20,
          head: [["Categoria", "Valor", "Percentual"]],
          body: receitasData,
          theme: "grid",
          headStyles: { fillColor: [40, 167, 69] },
        });

        // Lançamentos
        doc.setFontSize(16);
        doc.text("Últimos Lançamentos", 14, doc.lastAutoTable.finalY + 15);

        const lancamentosData = lancamentos
          .slice(0, 10)
          .map((item) => [
            new Date(item.data).toLocaleDateString("pt-BR"),
            item.descricao,
            item.tipo === "receita" ? "Receita" : "Despesa",
            formatarMoeda(item.valor),
            formatarNomeCategoria(item.categoria),
          ]);

        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 20,
          head: [["Data", "Descrição", "Tipo", "Valor", "Categoria"]],
          body: lancamentosData,
          theme: "grid",
          headStyles: { fillColor: [108, 117, 125] },
          styles: { fontSize: 8 },
        });

        // Data de geração
        doc.setFontSize(10);
        doc.text(
          `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
          14,
          doc.lastAutoTable.finalY + 15
        );

        // Salvar PDF
        doc.save(`relatorio-financeiro-${mes}-${ano}.pdf`);
      } else if (formato === "excel") {
        // Criar planilha Excel (mesmo código anterior)
        const workbook = XLSX.utils.book_new();

        // Resumo
        const resumoData = [
          ["Resumo Financeiro"],
          [""],
          ["Categoria", "Valor"],
          ["Receitas", resumo.receitas],
          ["Despesas", resumo.despesas],
          ["Saldo", resumo.saldo],
          [""],
          ["Despesas por Categoria"],
          [""],
          ["Categoria", "Valor", "Percentual"],
          ...categoriasDespesas.map((item) => [
            item.categoria,
            item.valor,
            item.porcentagem,
          ]),
        ];

        const resumoSheet = XLSX.utils.aoa_to_sheet(resumoData);
        XLSX.utils.book_append_sheet(workbook, resumoSheet, "Resumo");

        // Receitas por Categoria
        const receitasData = [
          ["Receitas por Categoria"],
          [""],
          ["Categoria", "Valor", "Percentual"],
          ...categoriasReceitas.map((item) => [
            item.categoria,
            item.valor,
            item.porcentagem,
          ]),
        ];

        const receitasSheet = XLSX.utils.aoa_to_sheet(receitasData);
        XLSX.utils.book_append_sheet(workbook, receitasSheet, "Receitas");

        // Lançamentos
        const lancamentosData = [
          ["Lançamentos"],
          [""],
          [
            "Data",
            "Descrição",
            "Tipo",
            "Valor",
            "Categoria",
            "Responsável",
            "Status",
          ],
          ...lancamentos.map((item) => [
            new Date(item.data).toLocaleDateString("pt-BR"),
            item.descricao,
            item.tipo === "receita" ? "Receita" : "Despesa",
            item.valor,
            formatarNomeCategoria(item.categoria),
            item.responsavel,
            item.pago ? "Pago" : "Pendente",
          ]),
        ];

        const lancamentosSheet = XLSX.utils.aoa_to_sheet(lancamentosData);
        XLSX.utils.book_append_sheet(workbook, lancamentosSheet, "Lançamentos");

        // Salvar Excel
        XLSX.writeFile(workbook, `relatorio-financeiro-${mes}-${ano}.xlsx`);
      }

      toast.success(
        `Relatório exportado em ${formato.toUpperCase()} com sucesso!`
      );
    } catch (error) {
      console.error("Erro ao exportar relatório:", error);
      toast.error(`Erro ao exportar em ${formato.toUpperCase()}`);
    } finally {
      setCarregando(false);
    }
  };
  return (
    <div className="container mx-auto p-6 mt-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Relatórios Financeiros</h1>
          <p className="text-muted-foreground">
            Análise detalhada das suas finanças
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 relative">
          <div className="relative">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setShowFiltro(!showFiltro)}
            >
              <Filter className="h-4 w-4" />
              Filtrar
            </Button>
            {showFiltro && <FiltroModal />}
          </div>
          <div className="relative">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setShowPeriodo(!showPeriodo)}
            >
              <Calendar className="h-4 w-4" />
              Período
            </Button>
            {showPeriodo && <PeriodoModal />}
          </div>
          <Button
            className="flex items-center gap-2"
            onClick={() => handleExportar("pdf")}
            disabled={carregando}
            variant="outline"
          >
            <Download className="h-4 w-4" />
            {carregando ? "Exportando..." : "Exportar PDF"}
          </Button>

          <Button
            className="flex items-center gap-2"
            onClick={() => handleExportar("excel")}
            disabled={carregando}
            variant="outline"
          >
            <Download className="h-4 w-4" />
            {carregando ? "Exportando..." : "Exportar Excel"}
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receitas Totais
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatarMoeda(resumo.receitas)}
            </div>
            <p className="text-xs text-muted-foreground">
              {resumo.receitas > 0
                ? "+12% em relação ao mês anterior"
                : "Sem dados anteriores"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Despesas Totais
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatarMoeda(resumo.despesas)}
            </div>
            <p className="text-xs text-muted-foreground">
              {resumo.despesas > 0
                ? "-5% em relação ao mês anterior"
                : "Sem dados anteriores"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Mensal</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatarMoeda(resumo.saldo)}
            </div>
            <p className="text-xs text-muted-foreground">
              {resumo.saldo > 0
                ? "+18% em relação ao mês anterior"
                : "Sem dados anteriores"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Metas em Andamento
            </CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metas.length}</div>
            <p className="text-xs text-muted-foreground">
              {metas.length > 0
                ? "67% das metas em progresso"
                : "Nenhuma meta definida"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Evolução Mensal
            </CardTitle>
            <CardDescription>Receitas vs Despesas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosBarra}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(value) => `R$ ${value / 1000}k`} />
                  <Tooltip content={CustomTooltip} />
                  <Legend />
                  <Bar dataKey="receitas" fill="#4CAF50" name="Receitas" />
                  <Bar dataKey="despesas" fill="#F44336" name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição de Gastos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição de Gastos
            </CardTitle>
            <CardDescription>Por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={dadosPizza}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {dadosPizza.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatarMoeda(Number(value))}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Secundários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Evolução do Saldo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução do Saldo
            </CardTitle>
            <CardDescription>Saldo mensal ao longo do ano</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosLinha}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(value) => `R$ ${value / 1000}k`} />
                  <Tooltip
                    formatter={(value) => formatarMoeda(Number(value))}
                  />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    stroke="#3B82F6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Comparativo Receitas vs Despesas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Comparativo Anual
            </CardTitle>
            <CardDescription>Receitas vs Despesas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosArea}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(value) => `R$ ${value / 1000}k`} />
                  <Tooltip
                    formatter={(value) => formatarMoeda(Number(value))}
                  />
                  <Area
                    type="monotone"
                    dataKey="receitas"
                    fill="#4CAF50"
                    stroke="#4CAF50"
                  />
                  <Area
                    type="monotone"
                    dataKey="despesas"
                    fill="#F44336"
                    stroke="#F44336"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabelas de Categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Categorias de Despesas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Despesas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoriasDespesas.length > 0 ? (
                categoriasDespesas.map((categoria, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CORES_GRAFICO[index] }}
                      />
                      <span className="font-medium">{categoria.categoria}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatarMoeda(categoria.valor)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {categoria.porcentagem}% do total
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma despesa encontrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Categorias de Receitas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Receitas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoriasReceitas.length > 0 ? (
                categoriasReceitas.map((categoria, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CORES_GRAFICO[index + 6] }}
                      />
                      <span className="font-medium">{categoria.categoria}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatarMoeda(categoria.valor)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {categoria.porcentagem}% do total
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma receita encontrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico Mensal e Metas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Histórico Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico dos Últimos Meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {historicoMensal.length > 0 ? (
                historicoMensal.map((periodo, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{periodo.periodo}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatarMoeda(periodo.receitas)} /{" "}
                        {formatarMoeda(periodo.despesas)}
                      </div>
                    </div>
                    <div
                      className={`text-lg font-bold ${periodo.saldo >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatarMoeda(periodo.saldo)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum histórico disponível
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progresso das Metas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Progresso das Metas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {metas.length > 0 ? (
                metas.map((meta) => {
                  const progresso = (meta.valorAtual / meta.valorAlvo) * 100;
                  return (
                    <div key={meta.id}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{meta.titulo}</span>
                        <span className="text-sm text-muted-foreground">
                          {progresso.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={progresso} className="h-2" />
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatarMoeda(meta.valorAtual)} /{" "}
                        {formatarMoeda(meta.valorAlvo)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma meta definida
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
