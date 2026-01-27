"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
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
  Home,
  Crown,
  Lock,
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
import { Loading } from "@/components/ui/loading-barrinhas";
import { motion } from "framer-motion";
import { getFallback } from "@/lib/i18nFallback";

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

type PlanoUsuario = "free" | "pro" | "family";

export default function RelatoriosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation("relatorios");
  const cartaoId = searchParams.get("cartaoId");
  const currentLang = i18n.language || "pt";

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
      case "titulos.relatoriosFinanceiros":
        return getFallback(
          currentLang,
          "Relatórios Financeiros",
          "Financial Reports",
        );
      // Planos
case "planos.relatoriosAvancados":
  return getFallback(
    currentLang,
    "Relatórios Financeiros Avançados",
    "Advanced Financial Reports"
  );
case "planos.descricaoRelatorios":
  return getFallback(
    currentLang,
    "Acesse análises detalhadas, gráficos interativos e relatórios personalizados para tomar decisões financeiras mais inteligentes. Exporte seus dados em diversos formatos.",
    "Access detailed analysis, interactive charts, and personalized reports to make smarter financial decisions. Export your data in various formats."
  );
case "planos.seuPlanoAtual":
  return getFallback(currentLang, "Seu plano atual", "Your current plan");
case "planos.gratis":
  return getFallback(currentLang, "Grátis", "Free");
case "planos.beneficioRelatoriosPDF":
  return getFallback(
    currentLang,
    "Relatórios detalhados em PDF e JSON",
    "Detailed reports in PDF and JSON"
  );
case "planos.beneficioAnalises":
  return getFallback(
    currentLang,
    "Análises por categoria, cartão e período",
    "Analysis by category, card and period"
  );
case "planos.beneficioGraficos":
  return getFallback(
    currentLang,
    "Gráficos interativos e visualizações",
    "Interactive charts and visualizations"
  );
case "planos.beneficioComparativos":
  return getFallback(
    currentLang,
    "Comparativos e tendências históricas",
    "Comparatives and historical trends"
  );
case "planos.fazerUpgradePro":
  return getFallback(
    currentLang,
    "Fazer Upgrade para Pro",
    "Upgrade to Pro"
  );
      case "titulos.filtros":
        return getFallback(currentLang, "Filtros", "Filters");

      // Subtítulos
      case "subtitulos.analiseCompleta":
        return getFallback(
          currentLang,
          "Análise completa dos seus gastos e receitas",
          "Complete analysis of your expenses and income",
        );

      // Filtros
      case "filtros.cartao":
        return getFallback(currentLang, "Cartão", "Card");
      case "filtros.selecioneCartao":
        return getFallback(currentLang, "Selecione o cartão", "Select card");
      case "filtros.todosCartoes":
        return getFallback(currentLang, "Todos os cartões", "All cards");
      case "filtros.periodo":
        return getFallback(currentLang, "Período", "Period");
      case "filtros.selecionePeriodo":
        return getFallback(currentLang, "Selecione o período", "Select period");
      case "filtros.tipo":
        return getFallback(currentLang, "Tipo", "Type");
      case "filtros.selecioneTipo":
        return getFallback(currentLang, "Selecione o tipo", "Select type");
      case "filtros.todos":
        return getFallback(currentLang, "Todos", "All");
      case "filtros.dataCustomizada":
        return getFallback(currentLang, "Data Customizada", "Custom Date");

      // Períodos
      case "periodos.ultimos7Dias":
        return getFallback(currentLang, "Últimos 7 dias", "Last 7 days");
      case "periodos.ultimos30Dias":
        return getFallback(currentLang, "Últimos 30 dias", "Last 30 days");
      case "periodos.ultimos90Dias":
        return getFallback(currentLang, "Últimos 90 dias", "Last 90 days");
      case "periodos.ultimos12Meses":
        return getFallback(currentLang, "Últimos 12 meses", "Last 12 months");
      case "periodos.todos":
        return getFallback(currentLang, "Todo o período", "All period");
      case "periodos.ultimosNDias":
        return getFallback(
          currentLang,
          "Últimos {{dias}} dias",
          "Last {{dias}} days",
        );

      // Tipos
      case "tipos.despesa":
        return getFallback(currentLang, "Despesa", "Expense");
      case "tipos.receita":
        return getFallback(currentLang, "Receita", "Income");

      // Estatísticas
      case "estatisticas.totalDespesas":
        return getFallback(currentLang, "Total de Despesas", "Total Expenses");
      case "estatisticas.totalReceitas":
        return getFallback(currentLang, "Total de Receitas", "Total Income");
      case "estatisticas.saldo":
        return getFallback(currentLang, "Saldo", "Balance");
      case "estatisticas.superavit":
        return getFallback(currentLang, "Superávit", "Surplus");
      case "estatisticas.deficit":
        return getFallback(currentLang, "Déficit", "Deficit");
      case "estatisticas.lancamentosDespesa":
        return getFallback(
          currentLang,
          "{{count}} lançamentos",
          "{{count}} transactions",
        );
      case "estatisticas.lancamentosReceita":
        return getFallback(
          currentLang,
          "{{count}} lançamentos",
          "{{count}} transactions",
        );
      case "estatisticas.lancamentosCategoria":
        return getFallback(
          currentLang,
          "{{count}} lançamentos",
          "{{count}} transactions",
        );
      case "estatisticas.lancamentosCartao":
        return getFallback(
          currentLang,
          "{{count}} lançamentos",
          "{{count}} transactions",
        );

      // Seções
      case "secoes.despesasPorCategoria":
        return getFallback(
          currentLang,
          "Despesas por Categoria",
          "Expenses by Category",
        );
      case "secoes.distribuicaoGastos":
        return getFallback(
          currentLang,
          "Distribuição dos gastos por categoria",
          "Expense distribution by category",
        );
      case "secoes.despesasPorCartao":
        return getFallback(
          currentLang,
          "Despesas por Cartão",
          "Expenses by Card",
        );
      case "secoes.distribuicaoGastosCartao":
        return getFallback(
          currentLang,
          "Distribuição dos gastos por cartão",
          "Expense distribution by card",
        );
      case "secoes.ultimosLancamentos":
        return getFallback(
          currentLang,
          "Últimos Lançamentos",
          "Latest Transactions",
        );
      case "secoes.lancamentosEncontrados":
        return getFallback(
          currentLang,
          "{{count}} lançamentos encontrados",
          "{{count}} transactions found",
        );

      // Botões
      case "botoes.exportarPDF":
        return getFallback(currentLang, "Exportar PDF", "Export PDF");
      case "botoes.verTodosLancamentos":
        return getFallback(
          currentLang,
          "Ver todos os lançamentos",
          "View all transactions",
        );

      // Mensagens
      case "mensagens.erroCarregarDados":
        return getFallback(
          currentLang,
          "Erro ao carregar dados",
          "Error loading data",
        );
      case "mensagens.erroCarregarLancamentos":
        return getFallback(
          currentLang,
          "Erro ao carregar lançamentos",
          "Error loading transactions",
        );
      case "mensagens.semDadosCategorias":
        return getFallback(
          currentLang,
          "Sem dados de categorias",
          "No category data",
        );
      case "mensagens.adicionarDespesasCategorizadas":
        return getFallback(
          currentLang,
          "Adicione despesas categorizadas para ver a distribuição",
          "Add categorized expenses to see distribution",
        );
      case "mensagens.nenhumaDespesaEncontrada":
        return getFallback(
          currentLang,
          "Nenhuma despesa encontrada",
          "No expenses found",
        );
      case "mensagens.nenhumLancamentoEncontrado":
        return getFallback(
          currentLang,
          "Nenhum lançamento encontrado",
          "No transactions found",
        );
      case "mensagens.semDadosTitulo":
        return getFallback(
          currentLang,
          "Nenhum lançamento encontrado",
          "No transactions found",
        );
      case "mensagens.semDadosDescricao":
        return getFallback(
          currentLang,
          "Adicione lançamentos para visualizar os relatórios",
          "Add transactions to view reports",
        );

      // Categorias
      case "categorias.semCategoria":
        return getFallback(currentLang, "Sem Categoria", "No Category");

      // Cartões
      case "cartoes.semCartao":
        return getFallback(currentLang, "Sem Cartão", "No Card");

      // PDF
      case "pdf.titulo":
        return getFallback(
          currentLang,
          "Relatório Financeiro",
          "Financial Report",
        );
      case "pdf.geradoEm":
        return getFallback(currentLang, "Gerado em", "Generated on");
      case "pdf.filtrosAplicados":
        return getFallback(currentLang, "Filtros Aplicados", "Applied Filters");
      case "pdf.periodo":
        return getFallback(currentLang, "Período", "Period");
      case "pdf.cartao":
        return getFallback(currentLang, "Cartão", "Card");
      case "pdf.estatisticasGerais":
        return getFallback(
          currentLang,
          "ESTATÍSTICAS GERAIS",
          "GENERAL STATISTICS",
        );
      case "pdf.descricao":
        return getFallback(currentLang, "Descrição", "Description");
      case "pdf.valor":
        return getFallback(currentLang, "Valor", "Amount");
      case "pdf.topCategorias":
        return getFallback(currentLang, "TOP CATEGORIAS", "TOP CATEGORIES");
      case "pdf.categoria":
        return getFallback(currentLang, "Categoria", "Category");
      case "pdf.valorGasto":
        return getFallback(currentLang, "Valor Gasto", "Amount Spent");
      case "pdf.ultimosLancamentos":
        return getFallback(
          currentLang,
          "ÚLTIMOS LANÇAMENTOS",
          "LATEST TRANSACTIONS",
        );
      case "pdf.data":
        return getFallback(currentLang, "Data", "Date");
      case "pdf.tipo":
        return getFallback(currentLang, "Tipo", "Type");
      case "pdf.pagina":
        return getFallback(currentLang, "Página", "Page");
      case "pdf.de":
        return getFallback(currentLang, "de", "of");
      case "pdf.geradoPor":
        return getFallback(
          currentLang,
          "Gerado pelo Finanças Pessoais",
          "Generated by Personal Finance",
        );
      case "pdf.nomeArquivo":
        return getFallback(
          currentLang,
          "relatorio-financeiro",
          "financial-report",
        );

      default:
        return key;
    }
  };

  // Criar um objeto de traduções para fácil acesso
  const translations = {
    titulos: {
      relatoriosFinanceiros: getTranslation("titulos.relatoriosFinanceiros"),
      filtros: getTranslation("titulos.filtros"),
    },

    subtitulos: {
      analiseCompleta: getTranslation("subtitulos.analiseCompleta"),
    },

    filtros: {
      cartao: getTranslation("filtros.cartao"),
      selecioneCartao: getTranslation("filtros.selecioneCartao"),
      todosCartoes: getTranslation("filtros.todosCartoes"),
      periodo: getTranslation("filtros.periodo"),
      selecionePeriodo: getTranslation("filtros.selecionePeriodo"),
      tipo: getTranslation("filtros.tipo"),
      selecioneTipo: getTranslation("filtros.selecioneTipo"),
      todos: getTranslation("filtros.todos"),
      dataCustomizada: getTranslation("filtros.dataCustomizada"),
    },

    periodos: {
      ultimos7Dias: getTranslation("periodos.ultimos7Dias"),
      ultimos30Dias: getTranslation("periodos.ultimos30Dias"),
      ultimos90Dias: getTranslation("periodos.ultimos90Dias"),
      ultimos12Meses: getTranslation("periodos.ultimos12Meses"),
      todos: getTranslation("periodos.todos"),
      ultimosNDias: getTranslation("periodos.ultimosNDias"),
    },

    tipos: {
      despesa: getTranslation("tipos.despesa"),
      receita: getTranslation("tipos.receita"),
    },

    estatisticas: {
      totalDespesas: getTranslation("estatisticas.totalDespesas"),
      totalReceitas: getTranslation("estatisticas.totalReceitas"),
      saldo: getTranslation("estatisticas.saldo"),
      superavit: getTranslation("estatisticas.superavit"),
      deficit: getTranslation("estatisticas.deficit"),
      lancamentosDespesa: getTranslation("estatisticas.lancamentosDespesa"),
      lancamentosReceita: getTranslation("estatisticas.lancamentosReceita"),
      lancamentosCategoria: getTranslation("estatisticas.lancamentosCategoria"),
      lancamentosCartao: getTranslation("estatisticas.lancamentosCartao"),
    },

    secoes: {
      despesasPorCategoria: getTranslation("secoes.despesasPorCategoria"),
      distribuicaoGastos: getTranslation("secoes.distribuicaoGastos"),
      despesasPorCartao: getTranslation("secoes.despesasPorCartao"),
      distribuicaoGastosCartao: getTranslation(
        "secoes.distribuicaoGastosCartao",
      ),
      ultimosLancamentos: getTranslation("secoes.ultimosLancamentos"),
      lancamentosEncontrados: getTranslation("secoes.lancamentosEncontrados"),
    },

    botoes: {
      exportarPDF: getTranslation("botoes.exportarPDF"),
      verTodosLancamentos: getTranslation("botoes.verTodosLancamentos"),
    },

    mensagens: {
      erroCarregarDados: getTranslation("mensagens.erroCarregarDados"),
      erroCarregarLancamentos: getTranslation(
        "mensagens.erroCarregarLancamentos",
      ),
      semDadosCategorias: getTranslation("mensagens.semDadosCategorias"),
      adicionarDespesasCategorizadas: getTranslation(
        "mensagens.adicionarDespesasCategorizadas",
      ),
      nenhumaDespesaEncontrada: getTranslation(
        "mensagens.nenhumaDespesaEncontrada",
      ),
      nenhumLancamentoEncontrado: getTranslation(
        "mensagens.nenhumLancamentoEncontrado",
      ),
      semDadosTitulo: getTranslation("mensagens.semDadosTitulo"),
      semDadosDescricao: getTranslation("mensagens.semDadosDescricao"),
    },

    categorias: {
      semCategoria: getTranslation("categorias.semCategoria"),
    },

    cartoes: {
      semCartao: getTranslation("cartoes.semCartao"),
    },

    pdf: {
      titulo: getTranslation("pdf.titulo"),
      geradoEm: getTranslation("pdf.geradoEm"),
      filtrosAplicados: getTranslation("pdf.filtrosAplicados"),
      periodo: getTranslation("pdf.periodo"),
      cartao: getTranslation("pdf.cartao"),
      estatisticasGerais: getTranslation("pdf.estatisticasGerais"),
      descricao: getTranslation("pdf.descricao"),
      valor: getTranslation("pdf.valor"),
      topCategorias: getTranslation("pdf.topCategorias"),
      categoria: getTranslation("pdf.categoria"),
      valorGasto: getTranslation("pdf.valorGasto"),
      ultimosLancamentos: getTranslation("pdf.ultimosLancamentos"),
      data: getTranslation("pdf.data"),
      tipo: getTranslation("pdf.tipo"),
      pagina: getTranslation("pdf.pagina"),
      de: getTranslation("pdf.de"),
      geradoPor: getTranslation("pdf.geradoPor"),
      nomeArquivo: getTranslation("pdf.nomeArquivo"),
    },
  };

  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoPlano, setCarregandoPlano] = useState(true);
  const [planoUsuario, setPlanoUsuario] = useState<PlanoUsuario | null>(null);
  const [filtros, setFiltros] = useState({
    cartaoId: cartaoId || "todos",
    periodo: "30",
    tipo: "todos",
    categoriaId: "todas",
  });

  const getLocalizedPath = (path: string) => {
    return `/${i18n.language}${path}`;
  };

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

  useEffect(() => {
    if (planoUsuario && planoUsuario !== "free") {
      carregarDados();
    } else if (planoUsuario === "free") {
      // Se for free, não precisa carregar dados
      setCarregando(false);
    }
  }, [planoUsuario]);

  const carregarDados = async () => {
    try {
      setCarregando(true);

      // Carregar cartões
      const cartoesResponse = await fetch("/api/cartoes");
      if (cartoesResponse.ok) {
        const cartoesData = await cartoesResponse.json();
        setCartoes(cartoesData);

        // Após carregar cartões, carregar lançamentos
        await carregarLancamentos(cartoesData);
      }
    } catch (error) {
      console.error(translations.mensagens.erroCarregarDados, error);
    } finally {
      setCarregando(false);
    }
  };

  const carregarLancamentos = async (cartoesData: Cartao[]) => {
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
      console.error(translations.mensagens.erroCarregarLancamentos, error);
    }
  };

  useEffect(() => {
    // Atualizar lançamentos quando os filtros mudarem
    if (cartoes.length > 0 && planoUsuario !== "free") {
      carregarLancamentos(cartoes);
    }
  }, [filtros]);

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
              <BarChart3 className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">
                {translations.titulos.relatoriosFinanceiros}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 truncate">
                {translations.subtitulos.analiseCompleta}
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
                  {getTranslation("planos.relatoriosAvancados")}
                </h2>

                <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 max-w-md">
                  {getTranslation("planos.descricaoRelatorios")}
                </p>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 max-w-lg w-full">
                  <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
                    <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-blue-800 dark:text-blue-300">
                      {getTranslation("planos.seuPlanoAtual")}: {getTranslation("planos.gratis")}
                    </span>
                  </div>

                  <ul className="space-y-2 text-left text-sm sm:text-base">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        {getTranslation("planos.beneficioRelatoriosPDF")}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        {getTranslation("planos.beneficioAnalises")}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        {getTranslation("planos.beneficioGraficos")}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        {getTranslation("planos.beneficioComparativos")}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button
                    onClick={() => router.push(getLocalizedPath("/dashboard/perfil"))}
                    className="bg-gradient-to-r from-[#00cfec] to-[#007cca] text-white hover:opacity-90"
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    {getTranslation("planos.fazerUpgradePro")}
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

  const exportarPDF = () => {
    const doc = new jsPDF();
    const locale = i18n.language === "pt" ? "pt-BR" : "en-US";

    // Cabeçalho
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(translations.pdf.titulo, 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text(
      `${translations.pdf.geradoEm}: ${new Date().toLocaleDateString(locale)}`,
      105,
      30,
      {
        align: "center",
      },
    );

    // Informações do Filtro
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    let yPos = 50;

    doc.text(translations.pdf.filtrosAplicados, 14, yPos);
    yPos += 7;
    doc.text(
      `• ${translations.pdf.periodo}: ${filtros.periodo === "todos" ? translations.periodos.todos : t("periodos.ultimosNDias", { dias: filtros.periodo })}`,
      20,
      yPos,
    );
    yPos += 5;
    doc.text(
      `• ${translations.pdf.cartao}: ${filtros.cartaoId === "todos" ? translations.filtros.todosCartoes : cartoes.find((c) => c.id === filtros.cartaoId)?.nome}`,
      20,
      yPos,
    );

    // Estatísticas
    yPos += 15;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(translations.pdf.estatisticasGerais, 14, yPos);

    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    autoTable(doc, {
      startY: yPos,
      head: [[translations.pdf.descricao, translations.pdf.valor]],
      body: [
        [
          translations.estatisticas.totalDespesas,
          formatarMoeda(estatisticas.totalDespesas),
        ],
        [
          translations.estatisticas.totalReceitas,
          formatarMoeda(estatisticas.totalReceitas),
        ],
        [translations.estatisticas.saldo, formatarMoeda(estatisticas.saldo)],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [30, 41, 59] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Ranking por Categoria
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(translations.pdf.topCategorias, 14, yPos);

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
      head: [[translations.pdf.categoria, translations.pdf.valorGasto, "%"]],
      body: categoriaData,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [30, 41, 59] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Últimos Lançamentos
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(translations.pdf.ultimosLancamentos, 14, yPos);

    yPos += 10;
    const lancamentosData = lancamentos
      .slice(0, 10)
      .map((lanc) => [
        new Date(lanc.data).toLocaleDateString(locale),
        lanc.descricao.substring(0, 30),
        lanc.tipo === "DESPESA"
          ? translations.tipos.despesa
          : translations.tipos.receita,
        formatarMoeda(lanc.valor),
      ]);

    autoTable(doc, {
      startY: yPos,
      head: [
        [
          translations.pdf.data,
          translations.pdf.descricao,
          translations.pdf.tipo,
          translations.pdf.valor,
        ],
      ],
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
        `${translations.pdf.pagina} ${i} ${translations.pdf.de} ${pageCount} • ${translations.pdf.geradoPor}`,
        105,
        290,
        { align: "center" },
      );
    }

    doc.save(
      `${translations.pdf.nomeArquivo}-${new Date().toISOString().split("T")[0]}.pdf`,
    );
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
        const categoriaNome =
          lancamento.categoria?.nome || translations.categorias.semCategoria;
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
      >,
    );

  const rankingCategorias = Object.entries(despesasPorCategoria).sort(
    ([, a], [, b]) => b.total - a.total,
  );

  // Agrupar por cartão
  const despesasPorCartao = lancamentos
    .filter((l) => l.tipo === "DESPESA")
    .reduce(
      (acc, lancamento) => {
        const cartaoNome =
          lancamento.cartao?.nome || translations.cartoes.semCartao;
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
      {} as Record<string, { total: number; cor: string; quantidade: number }>,
    );

  const rankingCartoes = Object.entries(despesasPorCartao).sort(
    ([, a], [, b]) => b.total - a.total,
  );

  const formatarMoeda = (valor: number) => {
    const locale = i18n.language === "pt" ? "pt-BR" : "en-US";
    const currency = i18n.language === "pt" ? "BRL" : "USD";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
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
          ? translations.filtros.todosCartoes
          : cartoes.find((c) => c.id === filtros.cartaoId)?.nome,
      estatisticas,
      categorias: rankingCategorias,
      cartoes: rankingCartoes,
      lancamentos: lancamentos.slice(0, 100),
    };

    const blob = new Blob([JSON.stringify(dados, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${translations.pdf.nomeArquivo}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (carregandoPlano || planoUsuario === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Se não houver dados, mostrar mensagem
  if (!carregando && lancamentos.length === 0 && cartoes.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-transparent p-3 sm:p-4 md:p-6">
        {/* Mantém o cabeçalho igual ao da página com dados */}
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 md:py-32">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-md mx-auto"
            >
              <div className="mb-6 sm:mb-8">
                <motion.div
                  animate={{}}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                >
                  <BarChart3 className="h-20 w-20 sm:h-28 sm:w-28 md:h-32 md:w-32 text-gray-300 dark:text-gray-600 mx-auto" />
                </motion.div>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                {translations.mensagens.semDadosTitulo}
              </h2>

              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base md:text-lg mb-6 sm:mb-8">
                {translations.mensagens.semDadosDescricao}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen p-3 sm:p-4 md:p-6 bg-white dark:bg-transparent"
    >
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
        >
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.back()}
                className="h-9 w-9 sm:h-10 sm:w-10 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white flex-shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </motion.div>
            <div className="flex-1 min-w-0">
              <motion.h1
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate"
              >
                {translations.titulos.relatoriosFinanceiros}
              </motion.h1>
              <motion.p
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate"
              >
                {translations.subtitulos.analiseCompleta}
              </motion.p>
            </div>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex gap-2 w-full sm:w-auto mt-3 sm:mt-0"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant={"outline"}
                onClick={exportarPDF}
                className="flex-1 sm:flex-none border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500 text-xs sm:text-sm"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="truncate">
                  {translations.botoes.exportarPDF}
                </span>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-base sm:text-lg">
                <motion.div
                  className="p-1 sm:p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0"
                  whileHover={{ rotate: 15 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-700 dark:text-gray-300" />
                </motion.div>
                <span>{translations.titulos.filtros}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-1.5 sm:space-y-2"
                >
                  <Label
                    htmlFor="cartao"
                    className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                  >
                    {translations.filtros.cartao}
                  </Label>
                  <Select
                    value={filtros.cartaoId}
                    onValueChange={(value) =>
                      setFiltros((prev) => ({ ...prev, cartaoId: value }))
                    }
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm h-9 sm:h-10">
                      <SelectValue
                        placeholder={translations.filtros.selecioneCartao}
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm">
                      <SelectItem value="todos">
                        {translations.filtros.todosCartoes}
                      </SelectItem>
                      {cartoes.map((cartao) => (
                        <SelectItem key={cartao.id} value={cartao.id}>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div
                              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: cartao.cor }}
                            />
                            <span className="truncate">{cartao.nome}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="space-y-1.5 sm:space-y-2"
                >
                  <Label
                    htmlFor="periodo"
                    className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                  >
                    {translations.filtros.periodo}
                  </Label>
                  <Select
                    value={filtros.periodo}
                    onValueChange={(value) =>
                      setFiltros((prev) => ({ ...prev, periodo: value }))
                    }
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm h-9 sm:h-10">
                      <SelectValue
                        placeholder={translations.filtros.selecionePeriodo}
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm">
                      <SelectItem value="7">
                        {translations.periodos.ultimos7Dias}
                      </SelectItem>
                      <SelectItem value="30">
                        {translations.periodos.ultimos30Dias}
                      </SelectItem>
                      <SelectItem value="90">
                        {translations.periodos.ultimos90Dias}
                      </SelectItem>
                      <SelectItem value="365">
                        {translations.periodos.ultimos12Meses}
                      </SelectItem>
                      <SelectItem value="todos">
                        {translations.periodos.todos}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-1.5 sm:space-y-2"
                >
                  <Label
                    htmlFor="tipo"
                    className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                  >
                    {translations.filtros.tipo}
                  </Label>
                  <Select
                    value={filtros.tipo}
                    onValueChange={(value) =>
                      setFiltros((prev) => ({ ...prev, tipo: value }))
                    }
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm h-9 sm:h-10">
                      <SelectValue
                        placeholder={translations.filtros.selecioneTipo}
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm">
                      <SelectItem value="todos">
                        {translations.filtros.todos}
                      </SelectItem>
                      <SelectItem value="DESPESA">
                        {translations.tipos.despesa}
                      </SelectItem>
                      <SelectItem value="RECEITA">
                        {translations.tipos.receita}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="space-y-1.5 sm:space-y-2"
                >
                  <Label
                    htmlFor="data"
                    className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                  >
                    {translations.filtros.dataCustomizada}
                  </Label>
                  <Input
                    type="date"
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm h-9 sm:h-10"
                    onChange={(e) =>
                      console.log("Data customizada:", e.target.value)
                    }
                  />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Estatísticas Gerais */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          <motion.div
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-gray-900 dark:text-white text-sm sm:text-base md:text-lg">
                  {translations.estatisticas.totalDespesas}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">
                  {formatarMoeda(estatisticas.totalDespesas)}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1 sm:mt-2">
                  {t("estatisticas.lancamentosDespesa", {
                    count: lancamentos.filter((l) => l.tipo === "DESPESA")
                      .length,
                  })}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.05 }}
          >
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-gray-900 dark:text-white text-sm sm:text-base md:text-lg">
                  {translations.estatisticas.totalReceitas}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-600 dark:text-green-400">
                  {formatarMoeda(estatisticas.totalReceitas)}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1 sm:mt-2">
                  {t("estatisticas.lancamentosReceita", {
                    count: lancamentos.filter((l) => l.tipo === "RECEITA")
                      .length,
                  })}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          >
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-gray-900 dark:text-white text-sm sm:text-base md:text-lg">
                  {translations.estatisticas.saldo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={`text-xl sm:text-2xl md:text-3xl font-bold ${
                    estatisticas.saldo >= 0
                      ? "text-emerald-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatarMoeda(estatisticas.saldo)}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1 sm:mt-2">
                  {estatisticas.saldo >= 0
                    ? translations.estatisticas.superavit
                    : translations.estatisticas.deficit}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
        >
          {/* Ranking por Categoria */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-base sm:text-lg">
                  <motion.div
                    className="p-1 sm:p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex-shrink-0"
                    whileHover={{ rotate: -15 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <PieChart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
                  </motion.div>
                  <span className="truncate">
                    {translations.secoes.despesasPorCategoria}
                  </span>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                  {translations.secoes.distribuicaoGastos}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {rankingCategorias.map(
                    ([categoriaNome, categoriaData], index) => {
                      const porcentagem =
                        estatisticas.totalDespesas > 0
                          ? (categoriaData.total / estatisticas.totalDespesas) *
                            100
                          : 0;

                      return (
                        <motion.div
                          key={categoriaNome}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          whileHover={{ scale: 1.02 }}
                          className="flex justify-between items-center p-2.5 sm:p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/50"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <motion.div
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: categoriaData.cor }}
                              whileHover={{ rotate: 5 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              {getIcone(categoriaData.icone)}
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 dark:text-white text-xs sm:text-sm font-medium truncate">
                                {categoriaNome}
                              </p>
                              <p className="text-gray-500 dark:text-gray-400 text-xs">
                                {t("estatisticas.lancamentosCategoria", {
                                  count: categoriaData.quantidade,
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-1.5 sm:ml-2">
                            <p className="text-gray-900 dark:text-white font-medium text-xs sm:text-sm">
                              {formatarMoeda(categoriaData.total)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {porcentagem.toFixed(1)}%
                            </p>
                          </div>
                        </motion.div>
                      );
                    },
                  )}
                  {rankingCategorias.length === 0 && !carregando && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-center py-6 sm:py-8"
                    >
                      <motion.div
                        className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 20,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <PieChart className="h-5 sm:h-8 sm:w-8 text-gray-400 dark:text-gray-600" />
                      </motion.div>
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                        {translations.mensagens.semDadosCategorias}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm px-2">
                        {translations.mensagens.adicionarDespesasCategorizadas}
                      </p>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Ranking por Cartão */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.05 }}
          >
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-base sm:text-lg">
                  <motion.div
                    className="p-1 sm:p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0"
                    whileHover={{ rotate: 15 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                  </motion.div>
                  <span className="truncate">
                    {translations.secoes.despesasPorCartao}
                  </span>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                  {translations.secoes.distribuicaoGastosCartao}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {rankingCartoes.map(([cartaoNome, cartaoData], index) => {
                    const porcentagem =
                      estatisticas.totalDespesas > 0
                        ? (cartaoData.total / estatisticas.totalDespesas) * 100
                        : 0;

                    return (
                      <motion.div
                        key={cartaoNome}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ scale: 1.02 }}
                        className="flex justify-between items-center p-2.5 sm:p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/50"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <motion.div
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: cartaoData.cor }}
                            whileHover={{ rotate: -5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <CreditCard className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 dark:text-white text-xs sm:text-sm font-medium truncate">
                              {cartaoNome}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">
                              {t("estatisticas.lancamentosCartao", {
                                count: cartaoData.quantidade,
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-1.5 sm:ml-2">
                          <p className="text-gray-900 dark:text-white font-medium text-xs sm:text-sm">
                            {formatarMoeda(cartaoData.total)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {porcentagem.toFixed(1)}%
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}

                  {rankingCartoes.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-center py-6 sm:py-8"
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse",
                        }}
                      >
                        <CreditCard className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                      </motion.div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                        {translations.mensagens.nenhumaDespesaEncontrada}
                      </p>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Últimos Lançamentos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-base sm:text-lg">
                <motion.div
                  className="p-1 sm:p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex-shrink-0"
                  whileHover={{ rotate: -15 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
                </motion.div>
                <span className="truncate">
                  {translations.secoes.ultimosLancamentos}
                </span>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                {t("secoes.lancamentosEncontrados", {
                  count: lancamentos.length,
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                {lancamentos.slice(0, 10).map((lancamento, index) => (
                  <motion.div
                    key={lancamento.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    whileHover={{
                      x: 5,
                      backgroundColor: "rgba(0,0,0,0.02)",
                    }}
                    className="flex justify-between items-center p-3 sm:p-4 rounded-lg bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <motion.div
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor:
                            lancamento.categoria?.cor ||
                            lancamento.cartao?.cor ||
                            "#6B7280",
                        }}
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {lancamento.categoria ? (
                          getIcone(lancamento.categoria.icone)
                        ) : (
                          <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        )}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 dark:text-white text-xs sm:text-sm font-medium truncate">
                          {lancamento.descricao}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          {new Date(lancamento.data).toLocaleDateString(
                            i18n.language === "pt" ? "pt-BR" : "en-US",
                          )}
                          {lancamento.cartao && ` • ${lancamento.cartao.nome}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-1.5 sm:ml-2 min-w-[100px] sm:min-w-[120px]">
                      <p
                        className={`font-medium text-xs sm:text-sm ${
                          lancamento.tipo === "DESPESA"
                            ? "text-red-600 dark:text-red-400"
                            : "text-emerald-600 dark:text-green-400"
                        }`}
                      >
                        {formatarMoeda(lancamento.valor)}
                      </p>
                      <motion.div whileHover={{ scale: 1.05 }}>
                        <Badge
                          variant="outline"
                          className={`mt-1 text-xs ${
                            lancamento.tipo === "DESPESA"
                              ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
                              : "bg-emerald-100 dark:bg-green-900/50 text-emerald-700 dark:text-green-300 border-emerald-200 dark:border-green-700"
                          }`}
                        >
                          {lancamento.tipo === "DESPESA"
                            ? translations.tipos.despesa
                            : translations.tipos.receita}
                        </Badge>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}

                {lancamentos.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center py-6 sm:py-8"
                  >
                    <motion.div
                      animate={{
                        y: [0, -5, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse",
                      }}
                    >
                      <BarChart3 className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                    </motion.div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                      {translations.mensagens.nenhumLancamentoEncontrado}
                    </p>
                  </motion.div>
                )}
              </div>

              {lancamentos.length > 10 && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-3 sm:mt-4"
                >
                  <Button
                    variant="outline"
                    className="w-full border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white text-xs sm:text-sm py-2"
                    onClick={() =>
                      router.push(getLocalizedPath("/dashboard/lancamentos"))
                    }
                  >
                    {translations.botoes.verTodosLancamentos}
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
