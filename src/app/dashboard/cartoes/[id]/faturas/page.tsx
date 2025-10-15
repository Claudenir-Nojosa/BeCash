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
  ArrowRight,
  ArrowLeftCircle,
  ArrowRightCircle,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  CreditCard,
  TrendingUp,
  TrendingDown,
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

      // Ordenar por mês decrescente (mês mais recente primeiro)
      faturasData.sort((a: Fatura, b: Fatura) =>
        b.mesReferencia.localeCompare(a.mesReferencia)
      );

      setFaturas(faturasData);
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

  const formatarData = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

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
    return `${meses[parseInt(mes) - 1]} de ${ano}`;
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

  const getMetodoPagamentoIcon = (metodo: string) => {
    switch (metodo) {
      case "PIX":
        return <DollarSign className="w-3 h-3" />;
      case "CREDITO":
        return <CreditCard className="w-3 h-3" />;
      case "DEBITO":
        return <CreditCard className="w-3 h-3" />;
      default:
        return <DollarSign className="w-3 h-3" />;
    }
  };

  const faturaAtual = faturas[indiceAtual];
  const mudarMes = (direcao: "anterior" | "proximo") => {
    if (direcao === "anterior" && indiceAtual < faturas.length - 1)
      setIndiceAtual((i) => i + 1);
    if (direcao === "proximo" && indiceAtual > 0) setIndiceAtual((i) => i - 1);
  };

  // Agrupar lançamentos por categoria para melhor organização
  const lancamentosAgrupados =
    faturaAtual?.lancamentos.reduce(
      (acc, lancamento) => {
        const categoria = lancamento.categoria.nome;
        if (!acc[categoria]) {
          acc[categoria] = [];
        }
        acc[categoria].push(lancamento);
        return acc;
      },
      {} as Record<string, typeof faturaAtual.lancamentos>
    ) || {};

  if (carregando)
    return (
      <div className="flex justify-center items-center h-72 text-muted-foreground">
        Carregando fatura...
      </div>
    );

  if (!faturaAtual)
    return (
      <div className="flex flex-col items-center justify-center h-72 text-muted-foreground">
        Nenhuma fatura disponível.
      </div>
    );

  const status = getStatus(faturaAtual);
  const Icone = status.icone;
  const pendente = faturaAtual.valorTotal - faturaAtual.valorPago;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/cartoes")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="text-center flex-1">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="icon"
              disabled={indiceAtual >= faturas.length - 1}
              onClick={() => mudarMes("anterior")}
            >
              <ArrowLeftCircle className="w-5 h-5" />
            </Button>

            <h1 className="text-2xl font-bold text-foreground">
              {formatarMesReferencia(faturaAtual.mesReferencia)}
            </h1>

            <Button
              variant="ghost"
              size="icon"
              disabled={indiceAtual === 0}
              onClick={() => mudarMes("proximo")}
            >
              <ArrowRightCircle className="w-5 h-5" />
            </Button>
          </div>
          {cartao && (
            <p className="text-sm text-muted-foreground">
              {cartao.nome} • {cartao.bandeira}
            </p>
          )}
        </div>

        <div className="w-10" />
      </div>

      {/* Card da Fatura */}
      <Card className="border shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/50 dark:bg-muted/20 flex flex-row justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <Calendar className="w-4 h-4" />
            Vence em {formatarData(faturaAtual.dataVencimento)}
          </CardTitle>
          <Badge variant="secondary" className={status.cor}>
            <Icone className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6 py-6">
          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="space-y-2 p-4 rounded-lg bg-background border">
              <p className="text-sm text-muted-foreground">Total da Fatura</p>
              <p className="text-xl font-semibold text-foreground">
                {formatarMoeda(faturaAtual.valorTotal)}
              </p>
            </div>
            <div className="space-y-2 p-4 rounded-lg bg-background border">
              <p className="text-sm text-muted-foreground">Valor Pago</p>
              <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                {formatarMoeda(faturaAtual.valorPago)}
              </p>
            </div>
            <div className="space-y-2 p-4 rounded-lg bg-background border">
              <p className="text-sm text-muted-foreground">Pendente</p>
              <p
                className={`text-xl font-semibold ${
                  pendente > 0
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {formatarMoeda(pendente)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Lançamentos Agrupados por Categoria */}
          {Object.keys(lancamentosAgrupados).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                Lançamentos da Fatura
              </h3>
              <ScrollArea className="h-80">
                <div className="space-y-4 pr-4">
                  {Object.entries(lancamentosAgrupados).map(
                    ([categoria, lancamentos]) => (
                      <div key={categoria} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: lancamentos[0].categoria.cor,
                            }}
                          />
                          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                            {categoria}
                          </h4>
                        </div>

                        <div className="space-y-2 ml-5">
                          {lancamentos.map((lancamento) => (
                            <div
                              key={lancamento.id}
                              className="flex justify-between items-center p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-start gap-3 flex-1">
                                <div
                                  className={`p-2 rounded-lg ${
                                    lancamento.tipo === "RECEITA"
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                      : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {lancamento.tipo === "RECEITA" ? (
                                    <TrendingUp className="w-3 h-3" />
                                  ) : (
                                    <TrendingDown className="w-3 h-3" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground truncate">
                                    {lancamento.descricao}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                      {getMetodoPagamentoIcon(
                                        lancamento.metodoPagamento
                                      )}
                                      {lancamento.metodoPagamento}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      • {formatarData(lancamento.data)}
                                    </span>
                                    <Badge
                                      variant={
                                        lancamento.pago
                                          ? "default"
                                          : "secondary"
                                      }
                                      className="text-xs h-4"
                                    >
                                      {lancamento.pago ? "Pago" : "Pendente"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <p
                                className={`font-semibold text-right min-w-[100px] ${
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
                      </div>
                    )
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Pagamentos */}
          {faturaAtual.PagamentoFatura.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">
                Pagamentos Realizados
              </h3>
              <div className="space-y-2">
                {faturaAtual.PagamentoFatura.map((pagamento) => (
                  <div
                    key={pagamento.id}
                    className="flex justify-between items-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        Pagamento via {pagamento.metodo}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatarData(pagamento.data)}
                        {pagamento.observacoes && ` • ${pagamento.observacoes}`}
                      </p>
                    </div>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {formatarMoeda(pagamento.valor)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botão de Pagamento */}
          {!faturaAtual.ehPrevisao &&
            pendente > 0 &&
            faturaAtual.status !== "PAGA" && (
              <Button
                className="w-full mt-4"
                onClick={() =>
                  router.push(`/dashboard/faturas/${faturaAtual.id}/pagar`)
                }
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Pagar Fatura
              </Button>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
