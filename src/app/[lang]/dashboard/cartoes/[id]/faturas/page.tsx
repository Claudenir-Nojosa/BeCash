"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  CreditCard,
  TrendingUp,
  TrendingDown,
  PieChart,
  ShoppingCart,
  Receipt,
  Sparkles,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading-barrinhas";

interface Fatura {
  id: string;
  mesReferencia: string;
  dataFechamento: string;
  dataVencimento: string;
  valorTotal: number;
  valorPago: number;
  status: string;
  lancamentos: Array<{
    id: string;
    descricao: string;
    valor: number;
    tipo: string;
    data: string;
    pago: boolean;
    categoria: { nome: string; cor: string };
    metodoPagamento: string;
    tipoParcelamento: string | null;
    parcelasTotal: number | null;
    parcelaAtual: number | null;
    lancamentoPaiId: string | null;
  }>;
  PagamentoFatura: Array<{
    id: string;
    valor: number;
    data: string;
    metodo: string;
    observacoes?: string;
  }>;
  ehPrevisao?: boolean;
}

interface Cartao {
  id: string;
  nome: string;
  bandeira: string;
  limite: number;
  cor: string;
}

export default function FaturasPage() {
  const params = useParams();
  const router = useRouter();
  const { t, i18n } = useTranslation("faturas");
  const cartaoId = params.id as string;

  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [cartao, setCartao] = useState<Cartao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [indiceAtual, setIndiceAtual] = useState(0);

  useEffect(() => {
    carregarDados();
  }, [cartaoId]);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const faturasResponse = await fetch(`/api/cartoes/${cartaoId}/faturas`);
      if (!faturasResponse.ok)
        throw new Error(t("mensagens.erroCarregarFaturas"));
      const faturasData = await faturasResponse.json();

      // Ordenar por mês decrescente (mês mais recente primeiro)
      faturasData.sort((a: Fatura, b: Fatura) =>
        b.mesReferencia.localeCompare(a.mesReferencia)
      );

      setFaturas(faturasData);

      // Encontrar a PRÓXIMA fatura
      const hoje = new Date();
      const hojeMes = hoje.toISOString().slice(0, 7);

      // Filtrar faturas futuras que NÃO são previsões
      const faturasReaisFuturas = faturasData.filter(
        (fatura: Fatura) =>
          fatura.mesReferencia >= hojeMes && !fatura.ehPrevisao
      );

      // Ordenar por mês crescente
      faturasReaisFuturas.sort((a: Fatura, b: Fatura) =>
        a.mesReferencia.localeCompare(b.mesReferencia)
      );

      let proximoIndice = -1;
      if (faturasReaisFuturas.length > 0) {
        const faturaMaisProxima = faturasReaisFuturas[0];
        proximoIndice = faturasData.findIndex(
          (f: Fatura) => f.mesReferencia === faturaMaisProxima.mesReferencia
        );
      }

      if (proximoIndice === -1) {
        const primeiraFaturaReal = faturasData.find(
          (fatura: Fatura) => !fatura.ehPrevisao
        );
        proximoIndice = primeiraFaturaReal
          ? faturasData.findIndex(
              (fatura: Fatura) =>
                fatura.mesReferencia === primeiraFaturaReal.mesReferencia
            )
          : 0;
      }

      setIndiceAtual(proximoIndice);

      const cartoesResponse = await fetch("/api/cartoes");
      if (cartoesResponse.ok) {
        const cartoesData = await cartoesResponse.json();
        setCartao(cartoesData.find((c: Cartao) => c.id === cartaoId));
      }
    } catch (e) {
      console.error(e);
      toast.error(t("mensagens.erroCarregar"));
    } finally {
      setCarregando(false);
    }
  };

  const formatarMoeda = (v: number) => {
    const locale = i18n.language === "pt" ? "pt-BR" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
    }).format(v);
  };

  const formatarData = (dataString: string) => {
    if (!dataString || dataString === "Invalid Date")
      return t("formatos.dataInvalida");

    const dataPart = dataString.substring(0, 10);
    const [ano, mes, dia] = dataPart.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const formatarMesReferencia = (mesReferencia: string) => {
    const [ano, mes] = mesReferencia.split("-");
    const meses =
      i18n.language === "pt"
        ? [
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
          ]
        : [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];
    return `${meses[parseInt(mes) - 1]} ${ano}`;
  };

  const getStatus = (f: Fatura) => {
    const hoje = new Date();
    const vencimento = new Date(f.dataVencimento);

    if (f.ehPrevisao)
      return {
        label: t("status.prevista"),
        cor: "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
        icone: Calendar,
      };
    if (f.status === "PAGA")
      return {
        label: t("status.paga"),
        cor: "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 dark:from-emerald-900/30 dark:to-green-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        icone: CheckCircle,
      };
    if (f.status === "FECHADA" && vencimento < hoje)
      return {
        label: t("status.atrasada"),
        cor: "bg-gradient-to-r from-rose-100 to-red-100 text-rose-800 dark:from-rose-900/30 dark:to-red-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800",
        icone: AlertTriangle,
      };
    if (f.status === "FECHADA")
      return {
        label: t("status.fechada"),
        cor: "bg-gradient-to-r from-sky-100 to-blue-100 text-sky-800 dark:from-sky-900/30 dark:to-blue-900/30 dark:text-sky-300 border border-sky-200 dark:border-sky-800",
        icone: FileText,
      };
    return {
      label: t("status.aberta"),
      cor: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 dark:from-amber-900/30 dark:to-yellow-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
      icone: Clock,
    };
  };

  const separarLancamentos = (lancamentos: Fatura["lancamentos"]) => {
    const comprasParceladas = lancamentos.filter(
      (l) =>
        l.tipoParcelamento === "PARCELADO" ||
        (l.parcelasTotal && l.parcelasTotal > 1)
    );

    const comprasNormais = lancamentos.filter(
      (l) =>
        !l.tipoParcelamento ||
        l.tipoParcelamento === "AVISTA" ||
        !l.parcelasTotal ||
        l.parcelasTotal === 1
    );

    return { comprasParceladas, comprasNormais };
  };

  const faturaAtual = faturas[indiceAtual];
  const { comprasParceladas, comprasNormais } = separarLancamentos(
    faturaAtual?.lancamentos || []
  );

  const mudarMes = (direcao: "anterior" | "proximo") => {
    if (direcao === "anterior" && indiceAtual < faturas.length - 1)
      setIndiceAtual((i) => i + 1);
    if (direcao === "proximo" && indiceAtual > 0) setIndiceAtual((i) => i - 1);
  };

  if (carregando) return <Loading />;

  if (!faturaAtual)
    return (
      <div className="min-h-screen p-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center h-72 text-center space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
              <FileText className="w-12 h-12 text-gray-400 dark:text-gray-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                {t("mensagens.nenhumaFatura")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t("mensagens.nenhumaFaturaDescricao")}
              </p>
            </div>
          </div>
        </div>
      </div>
    );

  const status = getStatus(faturaAtual);
  const Icone = status.icone;
  const pendente = faturaAtual.valorTotal - faturaAtual.valorPago;

  return (
    <div className="min-h-screen p-4 sm:p-6 ">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header com gradiente */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push(`/dashboard/cartoes/${cartaoId}`)}
              className="rounded-full border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 transition-all hover:scale-101"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {t("titulos.faturasCartao")}
              </h1>
              {cartao && (
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cartao.cor }}
                  />
                  <p className="text-gray-600 dark:text-gray-400">
                    {cartao.nome} • {t(`bandeiras.${cartao.bandeira}`)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {cartao && (
            <div className="px-4 py-2 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border border-gray-300 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("cartao.limite")}:{" "}
                <span className="font-bold">
                  {formatarMoeda(cartao.limite)}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Seletor de Mês Moderno */}
        <Card className="bg-white dark:bg-gray-800/50 border-0 shadow-xl rounded-2xl overflow-hidden backdrop-blur-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900/50">
          <div className="p-1 bg-gradient-to-r from-blue-500 via-blue-500 to-cyan-500"></div>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <Button
                variant="outline"
                size="lg"
                disabled={indiceAtual >= faturas.length - 1}
                onClick={() => mudarMes("anterior")}
                className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-white dark:hover:border-gray-600 transition-all hover:scale-101 group min-w-[140px]"
              >
                <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                {t("botoes.mesAnterior")}
              </Button>

              <div className="text-center flex-1 space-y-3">
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
                  <Calendar className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {formatarMesReferencia(faturaAtual.mesReferencia)}
                  </h2>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Badge
                    variant="secondary"
                    className={`rounded-full px-4 py-1.5 ${status.cor}`}
                  >
                    <Icone className="w-4 h-4 mr-2" />
                    {status.label}
                  </Badge>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {t("labels.vencimento")}{" "}
                    {formatarData(faturaAtual.dataVencimento)}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="lg"
                disabled={indiceAtual === 0}
                onClick={() => mudarMes("proximo")}
                className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-white dark:hover:border-gray-600 transition-all hover:scale-101 group min-w-[140px]"
              >
                {t("botoes.proximoMes")}
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resumo da Fatura com Cards Modernos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border-0 shadow-lg rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30">
                  <PieChart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {t("resumo.totalFatura")}
              </p>
              <p className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                {formatarMoeda(faturaAtual.valorTotal)}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {t("resumo.totalFaturaDescricao")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-emerald-50 dark:from-gray-800 dark:to-emerald-900/20 border-0 shadow-lg rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-800/30">
                  <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {t("resumo.valorPago")}
              </p>
              <p className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatarMoeda(faturaAtual.valorPago)}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {faturaAtual.PagamentoFatura.length > 0
                    ? t("resumo.pagamentosRealizados", {
                        count: faturaAtual.PagamentoFatura.length,
                      })
                    : t("resumo.semPagamentos")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`bg-gradient-to-br from-white to-${pendente > 0 ? "orange" : "emerald"}-50 dark:from-gray-800 dark:to-${pendente > 0 ? "orange" : "emerald"}-900/20 border-0 shadow-lg rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-3 rounded-xl bg-gradient-to-br from-${pendente > 0 ? "orange" : "emerald"}-100 to-${pendente > 0 ? "amber" : "green"}-100 dark:from-${pendente > 0 ? "orange" : "emerald"}-900/30 dark:to-${pendente > 0 ? "amber" : "green"}-800/30`}
                >
                  {pendente > 0 ? (
                    <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {t("resumo.pendente")}
              </p>
              <p
                className={`text-2xl md:text-3xl font-bold ${pendente > 0 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"}`}
              >
                {formatarMoeda(pendente)}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {pendente > 0
                    ? t("resumo.pendenteDescricao")
                    : t("resumo.quitadoDescricao")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lançamentos com Design Moderno */}
        <div className="space-y-8">
          {/* Compras Parceladas */}
          {comprasParceladas.length > 0 && (
            <Card className="bg-white dark:bg-gray-800/50 border-0 shadow-xl rounded-2xl overflow-hidden">
              <div className="p-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
                      <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-800 dark:text-white">
                        {t("secoes.comprasParceladas")}
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {t("secoes.comprasParceladasDescricao")}
                      </p>
                    </div>
                  </div>
                  <Badge className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                    {comprasParceladas.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {comprasParceladas.map((lancamento) => (
                    <div
                      key={lancamento.id}
                      className="group p-4 rounded-xl bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-900/10 dark:to-cyan-900/10 border border-blue-200 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-md"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                              <CreditCard className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 dark:text-white truncate">
                              {lancamento.descricao}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatarData(lancamento.data)}
                              </span>
                              <span>•</span>
                              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800">
                                {lancamento.categoria.nome}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-lg text-red-600 dark:text-red-400">
                            - {formatarMoeda(lancamento.valor)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {t("labels.parcela")} {lancamento.parcelaAtual}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compras Normais */}
          {comprasNormais.length > 0 && (
            <Card className="bg-white dark:bg-gray-800/50 border-0 shadow-xl rounded-2xl overflow-hidden">
              <div className="p-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
                      <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-800 dark:text-white">
                        {t("secoes.compras")}
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {t("secoes.comprasDescricao")}
                      </p>
                    </div>
                  </div>
                  <Badge className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                    {comprasNormais.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {comprasNormais.map((lancamento) => (
                    <div
                      key={lancamento.id}
                      className="group p-4 rounded-xl bg-gradient-to-r from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-md"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="relative">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{
                                backgroundColor: `${lancamento.categoria.cor}20`,
                              }}
                            >
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor: lancamento.categoria.cor,
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 dark:text-white truncate">
                              {lancamento.descricao}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatarData(lancamento.data)}
                              </span>
                              <span>•</span>
                              <span
                                className="px-2 py-0.5 rounded-full text-xs"
                                style={{
                                  backgroundColor: `${lancamento.categoria.cor}20`,
                                  color: lancamento.categoria.cor,
                                }}
                              >
                                {lancamento.categoria.nome}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-xs">
                                <Wallet className="w-3 h-3" />
                                {lancamento.metodoPagamento}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p
                            className={`font-bold text-lg ${
                              lancamento.tipo === "RECEITA"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {lancamento.tipo === "RECEITA" ? "+ " : "- "}
                            {formatarMoeda(lancamento.valor)}
                          </p>
                          <Badge
                            variant="outline"
                            className={`mt-1 text-xs rounded-full ${
                              lancamento.pago
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200"
                            }`}
                          >
                            {lancamento.pago
                              ? t("status.pago")
                              : t("status.pendenteBadge")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Botão de Pagamento – White mais sóbrio / Dark mais vibrante */}
        {!faturaAtual.ehPrevisao &&
          pendente > 0 &&
          faturaAtual.status !== "PAGA" && (
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={() =>
                  router.push(`/dashboard/faturas/${faturaAtual.id}/pagar`)
                }
                className="
  group
  rounded-xl
  px-8 py-6
  font-medium
  text-base
  text-white

  /* WHITE MODE */
  bg-blue-900
  hover:bg-blue-950

  /* DARK MODE */
  dark:bg-blue-900
  dark:hover:bg-blue-950

  shadow-sm
  hover:shadow-md

  transition-colors transition-shadow duration-200

  active:scale-[0.99]

  focus-visible:outline-none
  focus-visible:ring-2
  focus-visible:ring-blue-600
  focus-visible:ring-offset-2
  dark:focus-visible:ring-offset-zinc-900
"
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 opacity-90" />

                  <span className="tracking-wide">
                    {t("botoes.pagarFatura")}
                    <span className="ml-2 font-bold">
                      {formatarMoeda(pendente)}
                    </span>
                  </span>

                  <ChevronRight
                    className="
              w-4 h-4
              opacity-70
              group-hover:translate-x-1
              transition-transform
            "
                  />
                </div>
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}
