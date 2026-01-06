// app/dashboard/relatorios/page.tsx
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
  const { t, i18n } = useTranslation("relatorios");
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

  const getLocalizedPath = (path: string) => {
    return `/${i18n.language}${path}`;
  };

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
    const locale = i18n.language === "pt" ? "pt-BR" : "en-US";

    // Cabeçalho
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(t("pdf.titulo"), 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text(
      `${t("pdf.geradoEm")}: ${new Date().toLocaleDateString(locale)}`,
      105,
      30,
      {
        align: "center",
      }
    );

    // Informações do Filtro
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    let yPos = 50;

    doc.text(t("pdf.filtrosAplicados"), 14, yPos);
    yPos += 7;
    doc.text(
      `• ${t("pdf.periodo")}: ${filtros.periodo === "todos" ? t("periodos.todos") : t("periodos.ultimosNDias", { dias: filtros.periodo })}`,
      20,
      yPos
    );
    yPos += 5;
    doc.text(
      `• ${t("pdf.cartao")}: ${filtros.cartaoId === "todos" ? t("filtros.todosCartoes") : cartoes.find((c) => c.id === filtros.cartaoId)?.nome}`,
      20,
      yPos
    );

    // Estatísticas
    yPos += 15;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(t("pdf.estatisticasGerais"), 14, yPos);

    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    autoTable(doc, {
      startY: yPos,
      head: [[t("pdf.descricao"), t("pdf.valor")]],
      body: [
        [
          t("estatisticas.totalDespesas"),
          formatarMoeda(estatisticas.totalDespesas),
        ],
        [
          t("estatisticas.totalReceitas"),
          formatarMoeda(estatisticas.totalReceitas),
        ],
        [t("estatisticas.saldo"), formatarMoeda(estatisticas.saldo)],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [30, 41, 59] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Ranking por Categoria
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(t("pdf.topCategorias"), 14, yPos);

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
      head: [[t("pdf.categoria"), t("pdf.valorGasto"), "%"]],
      body: categoriaData,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [30, 41, 59] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Últimos Lançamentos
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(t("pdf.ultimosLancamentos"), 14, yPos);

    yPos += 10;
    const lancamentosData = lancamentos
      .slice(0, 10)
      .map((lanc) => [
        new Date(lanc.data).toLocaleDateString(locale),
        lanc.descricao.substring(0, 30),
        lanc.tipo === "DESPESA" ? t("tipos.despesa") : t("tipos.receita"),
        formatarMoeda(lanc.valor),
      ]);

    autoTable(doc, {
      startY: yPos,
      head: [
        [t("pdf.data"), t("pdf.descricao"), t("pdf.tipo"), t("pdf.valor")],
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
        `${t("pdf.pagina")} ${i} ${t("pdf.de")} ${pageCount} • ${t("pdf.geradoPor")}`,
        105,
        290,
        { align: "center" }
      );
    }

    doc.save(
      `${t("pdf.nomeArquivo")}-${new Date().toISOString().split("T")[0]}.pdf`
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
      console.error(t("mensagens.erroCarregarDados"), error);
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
      console.error(t("mensagens.erroCarregarLancamentos"), error);
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
        const categoriaNome =
          lancamento.categoria?.nome || t("categorias.semCategoria");
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

  // Agrupar por cartão
  const despesasPorCartao = lancamentos
    .filter((l) => l.tipo === "DESPESA")
    .reduce(
      (acc, lancamento) => {
        const cartaoNome = lancamento.cartao?.nome || t("cartoes.semCartao");
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
    const locale = i18n.language === "pt" ? "pt-BR" : "en-US";
    return new Intl.NumberFormat(locale, {
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
          ? t("filtros.todosCartoes")
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
    a.download = `${t("pdf.nomeArquivo")}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 bg-white dark:bg-transparent">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="h-9 w-9 sm:h-10 sm:w-10 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white flex-shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">
                {t("titulos.relatoriosFinanceiros")}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                {t("subtitulos.analiseCompleta")}
              </p>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto mt-3 sm:mt-0">
            <Button
              variant={"outline"}
              onClick={exportarPDF}
              className="flex-1 sm:flex-none border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500 text-xs sm:text-sm"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="truncate">{t("botoes.exportarPDF")}</span>
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-base sm:text-lg">
              <div className="p-1 sm:p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-700 dark:text-gray-300" />
              </div>
              <span>{t("titulos.filtros")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="cartao"
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  {t("filtros.cartao")}
                </Label>
                <Select
                  value={filtros.cartaoId}
                  onValueChange={(value) =>
                    setFiltros((prev) => ({ ...prev, cartaoId: value }))
                  }
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue placeholder={t("filtros.selecioneCartao")} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm">
                    <SelectItem value="todos">
                      {t("filtros.todosCartoes")}
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
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="periodo"
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  {t("filtros.periodo")}
                </Label>
                <Select
                  value={filtros.periodo}
                  onValueChange={(value) =>
                    setFiltros((prev) => ({ ...prev, periodo: value }))
                  }
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue placeholder={t("filtros.selecionePeriodo")} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm">
                    <SelectItem value="7">
                      {t("periodos.ultimos7Dias")}
                    </SelectItem>
                    <SelectItem value="30">
                      {t("periodos.ultimos30Dias")}
                    </SelectItem>
                    <SelectItem value="90">
                      {t("periodos.ultimos90Dias")}
                    </SelectItem>
                    <SelectItem value="365">
                      {t("periodos.ultimos12Meses")}
                    </SelectItem>
                    <SelectItem value="todos">{t("periodos.todos")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="tipo"
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  {t("filtros.tipo")}
                </Label>
                <Select
                  value={filtros.tipo}
                  onValueChange={(value) =>
                    setFiltros((prev) => ({ ...prev, tipo: value }))
                  }
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue placeholder={t("filtros.selecioneTipo")} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm">
                    <SelectItem value="todos">{t("filtros.todos")}</SelectItem>
                    <SelectItem value="DESPESA">
                      {t("tipos.despesa")}
                    </SelectItem>
                    <SelectItem value="RECEITA">
                      {t("tipos.receita")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="data"
                  className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                >
                  {t("filtros.dataCustomizada")}
                </Label>
                <Input
                  type="date"
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm h-9 sm:h-10"
                  onChange={(e) =>
                    console.log("Data customizada:", e.target.value)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-gray-900 dark:text-white text-sm sm:text-base md:text-lg">
                {t("estatisticas.totalDespesas")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">
                {formatarMoeda(estatisticas.totalDespesas)}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1 sm:mt-2">
                {t("estatisticas.lancamentosDespesa", {
                  count: lancamentos.filter((l) => l.tipo === "DESPESA").length,
                })}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-gray-900 dark:text-white text-sm sm:text-base md:text-lg">
                {t("estatisticas.totalReceitas")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-600 dark:text-green-400">
                {formatarMoeda(estatisticas.totalReceitas)}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1 sm:mt-2">
                {t("estatisticas.lancamentosReceita", {
                  count: lancamentos.filter((l) => l.tipo === "RECEITA").length,
                })}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-gray-900 dark:text-white text-sm sm:text-base md:text-lg">
                {t("estatisticas.saldo")}
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
                  ? t("estatisticas.superavit")
                  : t("estatisticas.deficit")}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Ranking por Categoria */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-base sm:text-lg">
                <div className="p-1 sm:p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
                  <PieChart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="truncate">
                  {t("secoes.despesasPorCategoria")}
                </span>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                {t("secoes.distribuicaoGastos")}
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
                      <div
                        key={categoriaNome}
                        className="flex justify-between items-center p-2.5 sm:p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/50"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: categoriaData.cor }}
                          >
                            {getIcone(categoriaData.icone)}
                          </div>
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
                      </div>
                    );
                  }
                )}
                {rankingCategorias.length === 0 && !carregando && (
                  <div className="text-center py-6 sm:py-8">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <PieChart className="h-5 w-5 sm:h-8 sm:w-8 text-gray-400 dark:text-gray-600" />
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                      {t("mensagens.semDadosCategorias")}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm px-2">
                      {t("mensagens.adicionarDespesasCategorizadas")}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ranking por Cartão */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-base sm:text-lg">
                <div className="p-1 sm:p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                  <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="truncate">
                  {t("secoes.despesasPorCartao")}
                </span>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                {t("secoes.distribuicaoGastosCartao")}
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
                    <div
                      key={cartaoNome}
                      className="flex justify-between items-center p-2.5 sm:p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/50"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: cartaoData.cor }}
                        >
                          <CreditCard className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                        </div>
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
                    </div>
                  );
                })}

                {rankingCartoes.length === 0 && (
                  <div className="text-center py-6 sm:py-8">
                    <CreditCard className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                      {t("mensagens.nenhumaDespesaEncontrada")}
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
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-base sm:text-lg">
              <div className="p-1 sm:p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex-shrink-0">
                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="truncate">{t("secoes.ultimosLancamentos")}</span>
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
              {t("secoes.lancamentosEncontrados", {
                count: lancamentos.length,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:space-y-3">
              {lancamentos.slice(0, 10).map((lancamento) => (
                <div
                  key={lancamento.id}
                  className="flex justify-between items-center p-3 sm:p-4 rounded-lg bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
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
                        <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-white text-xs sm:text-sm font-medium truncate">
                        {lancamento.descricao}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(lancamento.data).toLocaleDateString(
                          i18n.language === "pt" ? "pt-BR" : "en-US"
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
                    <Badge
                      variant="outline"
                      className={`mt-1 text-xs ${
                        lancamento.tipo === "DESPESA"
                          ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
                          : "bg-emerald-100 dark:bg-green-900/50 text-emerald-700 dark:text-green-300 border-emerald-200 dark:border-green-700"
                      }`}
                    >
                      {lancamento.tipo === "DESPESA"
                        ? t("tipos.despesa")
                        : t("tipos.receita")}
                    </Badge>
                  </div>
                </div>
              ))}

              {lancamentos.length === 0 && (
                <div className="text-center py-6 sm:py-8">
                  <BarChart3 className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                    {t("mensagens.nenhumLancamentoEncontrado")}
                  </p>
                </div>
              )}
            </div>

            {lancamentos.length > 10 && (
              <Button
                variant="outline"
                className="w-full mt-3 sm:mt-4 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white text-xs sm:text-sm py-2"
                onClick={() =>
                  router.push(getLocalizedPath("/dashboard/lancamentos"))
                }
              >
                {t("botoes.verTodosLancamentos")}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
