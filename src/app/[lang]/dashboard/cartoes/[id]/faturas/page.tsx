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
     const currency = i18n.language === "pt" ? "BRL" : "USD"; 
    return new Intl.NumberFormat(locale, {
      style: "currency",
       currency: currency,
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

  const getLocalizedPath = (path: string) => {
    return `/${i18n.language}${path}`;
  };

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header com gradiente */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                router.push(getLocalizedPath(`/dashboard/cartoes/${cartaoId}`))
              }
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 transition-all hover:scale-101 flex-shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent truncate">
                {t("titulos.faturasCartao")}
              </h1>
              {cartao && (
                <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                  <div
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cartao.cor }}
                  />
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                    <span className="font-medium">{cartao.nome}</span>
                    <span className="mx-1">•</span>
                    <span>{t(`bandeiras.${cartao.bandeira}`)}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {cartao && (
            <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border border-gray-300 dark:border-gray-700 mt-2 sm:mt-0">
              <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {t("cartao.limite")}:{" "}
                <span className="font-bold">
                  {formatarMoeda(cartao.limite)}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Seletor de Mês Moderno - Versão Compacta */}
        <Card className="bg-white dark:bg-gray-800/50 border-0 shadow-xl rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900/50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6">
              {/* Navegação Simples */}
              <div className="flex items-center justify-between w-full">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={indiceAtual >= faturas.length - 1}
                  onClick={() => mudarMes("anterior")}
                  className="rounded-full w-10 h-10 sm:w-12 sm:h-12 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all hover:scale-105"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>

                {/* Mês Atual */}
                <div className="flex flex-col items-center space-y-2 flex-1 mx-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent truncate text-center">
                      {formatarMesReferencia(faturaAtual.mesReferencia)}
                    </h2>
                  </div>

                  {/* Linha com Status, Botão Pagar e Data */}
                  <div className="flex items-center justify-between w-full max-w-md gap-2">
                    {/* Status - Lado Esquerdo */}
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={`rounded-full px-3 py-1 sm:px-4 sm:py-1.5 ${status.cor} text-xs sm:text-sm`}
                      >
                        <Icone className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                        <span className="truncate">{status.label}</span>
                      </Badge>
                    </div>

                    {/* Botão Pagar - Estilo Badge com Glow */}
                    {!faturaAtual.ehPrevisao &&
                      pendente > 0 &&
                      faturaAtual.status !== "PAGA" && (
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/faturas/${faturaAtual.id}/pagar`
                            )
                          }
                          className="
        relative
        inline-flex
        items-center
        justify-center
        rounded-full
        px-3
        py-1
        sm:px-4
        sm:py-1.5
        text-xs
        sm:text-sm
        font-medium
        text-blue-700
        dark:text-blue-300
        bg-blue-50
        dark:bg-blue-900/30
        border
        border-blue-200
        dark:border-blue-800

        /* Glow */
        shadow-[0_0_0_0_rgba(59,130,246,0.0)]
        hover:shadow-[0_0_12px_2px_rgba(59,130,246,0.35)]
        dark:hover:shadow-[0_0_16px_3px_rgba(59,130,246,0.45)]

        /* Hover */
        hover:bg-blue-100
        dark:hover:bg-blue-900/50
        hover:text-blue-800
        dark:hover:text-blue-200

        /* Animação suave */
        transition-all
        duration-300
        ease-out

        active:scale-[0.96]
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-blue-500
        focus-visible:ring-offset-2
        dark:focus-visible:ring-blue-600
      "
                        >
                          {t("secoes.pagar")}
                        </button>
                      )}

                    {/* Data - Lado Direito */}
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatarData(faturaAtual.dataVencimento)}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  disabled={indiceAtual === 0}
                  onClick={() => mudarMes("proximo")}
                  className="rounded-full w-10 h-10 sm:w-12 sm:h-12 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all hover:scale-105"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo da Fatura com Cards Modernos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border-0 shadow-lg rounded-xl sm:rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 sm:hover:-translate-y-1">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30">
                  <PieChart className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 sm:mb-2">
                {t("resumo.totalFatura")}
              </p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                {formatarMoeda(faturaAtual.valorTotal)}
              </p>
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {t("resumo.totalFaturaDescricao")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-emerald-50 dark:from-gray-800 dark:to-emerald-900/20 border-0 shadow-lg rounded-xl sm:rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 sm:hover:-translate-y-1">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-800/30">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 sm:mb-2">
                {t("resumo.valorPago")}
              </p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatarMoeda(faturaAtual.valorPago)}
              </p>
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
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
            className={`
            bg-gradient-to-br from-white to-${pendente > 0 ? "orange" : "emerald"}-50 
            dark:from-gray-800 dark:to-${pendente > 0 ? "orange" : "emerald"}-900/20 
            border-0 shadow-lg rounded-xl sm:rounded-2xl overflow-hidden 
            group hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 sm:hover:-translate-y-1
          `}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div
                  className={`
                  p-2 sm:p-3 rounded-lg sm:rounded-xl 
                  bg-gradient-to-br from-${pendente > 0 ? "orange" : "emerald"}-100 to-${pendente > 0 ? "amber" : "green"}-100 
                  dark:from-${pendente > 0 ? "orange" : "emerald"}-900/30 dark:to-${pendente > 0 ? "amber" : "green"}-800/30
                `}
                >
                  {pendente > 0 ? (
                    <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
                  ) : (
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 sm:mb-2">
                {t("resumo.pendente")}
              </p>
              <p
                className={`
                text-xl sm:text-2xl md:text-3xl font-bold 
                ${pendente > 0 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"}
              `}
              >
                {formatarMoeda(pendente)}
              </p>
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
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
        <div className="space-y-4 sm:space-y-6">
          {/* Compras Parceladas */}
          {comprasParceladas.length > 0 && (
            <Card className="bg-white dark:bg-gray-800/50 border-0 shadow-lg sm:shadow-xl rounded-lg sm:rounded-xl overflow-hidden">
              <div className="p-0.5 sm:p-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
              <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 md:px-6">
                <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex-shrink-0">
                      <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-gray-800 dark:text-white text-sm sm:text-base truncate">
                        {t("secoes.comprasParceladas")}
                      </CardTitle>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">
                        {t("secoes.comprasParceladasDescricao")}
                      </p>
                    </div>
                  </div>
                  <Badge className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 text-xs mt-1 xs:mt-0">
                    {comprasParceladas.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 md:px-6 pt-0">
                <div className="space-y-2 sm:space-y-3">
                  {comprasParceladas.map((lancamento) => (
                    <div
                      key={lancamento.id}
                      className="group p-3 rounded-lg bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-900/10 dark:to-cyan-900/10 border border-blue-200 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Esquerda: Ícone + Texto */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                              <CreditCard className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">
                                  {lancamento.descricao}
                                </p>
                                <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                  <span className="flex items-center gap-1 whitespace-nowrap">
                                    <Calendar className="w-3 h-3 flex-shrink-0" />
                                    {formatarData(lancamento.data)}
                                  </span>
                                  <span className="hidden sm:inline text-gray-400">
                                    •
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 whitespace-nowrap hidden sm:inline">
                                    {lancamento.categoria.nome}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Direita: Valor + Detalhes */}
                        <div className="flex flex-col items-end text-right flex-shrink-0">
                          <p className="font-bold text-sm sm:text-base text-red-600 dark:text-red-400 whitespace-nowrap">
                            - {formatarMoeda(lancamento.valor)}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
                              {t("labels.parcela")} {lancamento.parcelaAtual}
                            </p>
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 whitespace-nowrap text-xs sm:hidden">
                              {lancamento.categoria.nome}
                            </span>
                          </div>
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
            <Card className="bg-white dark:bg-gray-800/50 border-0 shadow-lg sm:shadow-xl rounded-lg sm:rounded-xl overflow-hidden">
              <div className="p-0.5 sm:p-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
              <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 md:px-6">
                <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex-shrink-0">
                      <ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-gray-800 dark:text-white text-sm sm:text-base truncate">
                        {t("secoes.compras")}
                      </CardTitle>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">
                        {t("secoes.comprasDescricao")}
                      </p>
                    </div>
                  </div>
                  <Badge className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 text-xs mt-1 xs:mt-0">
                    {comprasNormais.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 md:px-6 pt-0">
                <div className="space-y-2 sm:space-y-3">
                  {comprasNormais.map((lancamento) => (
                    <div
                      key={lancamento.id}
                      className="group p-3 rounded-lg bg-gradient-to-r from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Esquerda: Ícone + Texto */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{
                                backgroundColor: `${lancamento.categoria.cor}20`,
                              }}
                            >
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{
                                  backgroundColor: lancamento.categoria.cor,
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">
                                  {lancamento.descricao}
                                </p>
                                <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                  <span className="flex items-center gap-1 whitespace-nowrap">
                                    <Calendar className="w-3 h-3 flex-shrink-0" />
                                    {formatarData(lancamento.data)}
                                  </span>
                                  <span className="hidden sm:inline text-gray-400">
                                    •
                                  </span>
                                  <span
                                    className="px-2 py-0.5 rounded-full text-xs whitespace-nowrap hidden sm:inline"
                                    style={{
                                      backgroundColor: `${lancamento.categoria.cor}20`,
                                      color: lancamento.categoria.cor,
                                    }}
                                  >
                                    {lancamento.categoria.nome}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Direita: Valor + Status */}
                        <div className="flex flex-col items-end text-right flex-shrink-0">
                          <div className="flex flex-col items-end gap-1">
                            <p
                              className={`font-bold text-sm sm:text-base ${
                                lancamento.tipo === "RECEITA"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400"
                              } whitespace-nowrap`}
                            >
                              {lancamento.tipo === "RECEITA" ? "+ " : "- "}
                              {formatarMoeda(lancamento.valor)}
                            </p>
                          </div>

                          {/* Categoria (mobile) e Status (desktop) */}
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className="px-2 py-0.5 rounded-full text-xs whitespace-nowrap sm:hidden"
                              style={{
                                backgroundColor: `${lancamento.categoria.cor}20`,
                                color: lancamento.categoria.cor,
                              }}
                            >
                              {lancamento.categoria.nome}
                            </span>

                            {/* Status - Desktop */}
                            <Badge
                              variant="outline"
                              className={`text-xs rounded-full ${
                                lancamento.pago
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200"
                              } hidden sm:inline-flex`}
                            >
                              {lancamento.pago
                                ? t("status.pago")
                                : t("status.pendenteBadge")}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
