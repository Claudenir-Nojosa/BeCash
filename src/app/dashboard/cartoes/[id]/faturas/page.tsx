"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";
import { toast } from "sonner";

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
      if (!faturasResponse.ok) throw new Error("Erro ao carregar faturas");
      const faturasData = await faturasResponse.json();
      console.log("=== DEBUG FATURAS ===");
      console.log("Hoje:", new Date().toISOString().slice(0, 7));
      console.log(
        "Todas as faturas carregadas:",
        faturasData.map((f: Fatura) => ({
          mes: f.mesReferencia,
          status: f.status,
          ehPrevisao: f.ehPrevisao,
        }))
      );
      // Ordenar por mês decrescente (mês mais recente primeiro)
      faturasData.sort((a: Fatura, b: Fatura) =>
        b.mesReferencia.localeCompare(a.mesReferencia)
      );

      setFaturas(faturasData);

      // 🔥 CORREÇÃO: Encontrar a PRÓXIMA fatura (a que está aberta e é a mais próxima)
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
      toast.error("Erro ao carregar faturas");
    } finally {
      setCarregando(false);
    }
  };

  const formatarMoeda = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v);

  const formatarData = (dataString: string) => {
    if (!dataString || dataString === "Invalid Date") return "Data inválida";

    // Extrair ANO, MÊS, DIA diretamente da string SEM conversão de timezone
    const dataPart = dataString.substring(0, 10); // "2025-11-04"
    const [ano, mes, dia] = dataPart.split("-");

    // Retornar NO MESMO FORMATO que está no banco
    return `${dia}/${mes}/${ano}`;
  };

  const formatarMesReferencia = (mesReferencia: string) => {
    const [ano, mes] = mesReferencia.split("-");
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
    return `${meses[parseInt(mes) - 1]} ${ano}`;
  };

  const getStatus = (f: Fatura) => {
    const hoje = new Date();
    const vencimento = new Date(f.dataVencimento);
    if (f.ehPrevisao)
      return {
        label: "Prevista",
        cor: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
        icone: Calendar,
      };
    if (f.status === "PAGA")
      return {
        label: "Paga",
        cor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        icone: CheckCircle,
      };
    if (f.status === "FECHADA" && vencimento < hoje)
      return {
        label: "Atrasada",
        cor: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        icone: AlertTriangle,
      };
    if (f.status === "FECHADA")
      return {
        label: "Fechada",
        cor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        icone: FileText,
      };
    return {
      label: "Aberta",
      cor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
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

  if (carregando)
    return (
      <div className="min-h-screen p-6 ">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-72 text-muted-foreground">
            Carregando faturas...
          </div>
        </div>
      </div>
    );

  if (!faturaAtual)
    return (
      <div className="min-h-screen p-6 ">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center h-72 text-muted-foreground">
            Nenhuma fatura disponível.
          </div>
        </div>
      </div>
    );

  const status = getStatus(faturaAtual);
  const Icone = status.icone;
  const pendente = faturaAtual.valorTotal - faturaAtual.valorPago;

  return (
    <div className="min-h-screen p-6 ">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/dashboard/cartoes/${cartaoId}`)}
            className="border-gray-300 dark:border-gray-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Faturas do Cartão
            </h1>
            {cartao && (
              <p className="text-gray-600 dark:text-gray-400">
                {cartao.nome} • {cartao.bandeira}
              </p>
            )}
          </div>
        </div>

        {/* Seletor de Mês */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={indiceAtual >= faturas.length - 1}
                onClick={() => mudarMes("anterior")}
                className="border-gray-600 text-gray-300 hover:bg-gray-900 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Mês Anterior
              </Button>

              <div className="text-center flex-1 mx-4">
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatarMesReferencia(faturaAtual.mesReferencia)}
                  </h2>
                  <Badge variant="secondary" className={status.cor}>
                    <Icone className="w-3 h-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Vence em {formatarData(faturaAtual.dataVencimento)}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={indiceAtual === 0}
                onClick={() => mudarMes("proximo")}
                className="border-gray-600 text-gray-300 hover:bg-gray-900 hover:text-white"
              >
                Próximo Mês
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resumo da Fatura */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6 text-center">
              <PieChart className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total da Fatura
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatarMoeda(faturaAtual.valorTotal)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Valor Pago
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatarMoeda(faturaAtual.valorPago)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pendente
              </p>
              <p
                className={`text-2xl font-bold ${
                  pendente > 0
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {formatarMoeda(pendente)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lançamentos */}
        <div className="space-y-6">
          {/* Compras Parceladas */}
          {comprasParceladas.length > 0 && (
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Receipt className="w-5 h-5 text-purple-600" />
                  Compras Parceladas
                  <Badge
                    variant="outline"
                    className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                  >
                    {comprasParceladas.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {comprasParceladas.map((lancamento) => (
                    <div
                      key={lancamento.id}
                      className="flex justify-between items-center p-4 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-400">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {lancamento.descricao}
                            </p>
                            <Badge
                              variant="outline"
                              className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 text-xs"
                            >
                              {lancamento.parcelaAtual}/
                              {lancamento.parcelasTotal}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <span>{formatarData(lancamento.data)}</span>
                            <span>•</span>
                            <span>{lancamento.categoria.nome}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600 dark:text-red-400">
                          - {formatarMoeda(lancamento.valor)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Parcela {lancamento.parcelaAtual}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compras Normais */}
          {comprasNormais.length > 0 && (
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  Compras
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                  >
                    {comprasNormais.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {comprasNormais.map((lancamento) => (
                    <div
                      key={lancamento.id}
                      className="flex justify-between items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className="w-3 h-3 rounded-full mt-2 flex-shrink-0"
                          style={{ backgroundColor: lancamento.categoria.cor }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {lancamento.descricao}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <span>{formatarData(lancamento.data)}</span>
                            <span>•</span>
                            <span>{lancamento.categoria.nome}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              {lancamento.metodoPagamento}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p
                        className={`font-semibold ${
                          lancamento.tipo === "RECEITA"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {lancamento.tipo === "RECEITA" ? "+ " : "- "}
                        {formatarMoeda(lancamento.valor)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Botão de Pagamento */}
        {!faturaAtual.ehPrevisao &&
          pendente > 0 &&
          faturaAtual.status !== "PAGA" && (
            <div className="flex justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-br from-gray-600 to-gray-900 hover:from-gray-700 hover:to-black text-white px-8 border-0 shadow-md hover:shadow-lg transition-all duration-200"
                onClick={() =>
                  router.push(`/dashboard/faturas/${faturaAtual.id}/pagar`)
                }
              >
                <DollarSign className="w-5 h-5 mr-3" />
                Pagar Fatura de {formatarMoeda(pendente)}
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}
