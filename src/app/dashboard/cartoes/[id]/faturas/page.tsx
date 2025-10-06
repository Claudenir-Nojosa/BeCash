"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
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
    data: string;
    categoria: {
      nome: string;
      cor: string;
    };
  }>;
  PagamentoFatura: Array<{
    id: string;
    valor: number;
    data: string;
    metodo: string;
  }>;
  ehPrevisao?: boolean; // Nova propriedade para identificar previsões
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

  useEffect(() => {
    carregarDados();
  }, [cartaoId]);

  const carregarDados = async () => {
    try {
      setCarregando(true);

      // Carregar faturas
      const faturasResponse = await fetch(`/api/cartoes/${cartaoId}/faturas`);
      if (!faturasResponse.ok) {
        throw new Error("Erro ao carregar faturas");
      }
      const faturasData = await faturasResponse.json();
      setFaturas(faturasData);

      // Carregar informações do cartão
      const cartoesResponse = await fetch("/api/cartoes");
      if (cartoesResponse.ok) {
        const cartoesData = await cartoesResponse.json();
        const cartaoEncontrado = cartoesData.find(
          (c: Cartao) => c.id === cartaoId
        );
        setCartao(cartaoEncontrado);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar faturas");
    } finally {
      setCarregando(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR");
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
    return `${meses[parseInt(mes) - 1]} de ${ano}`;
  };

  const getStatusFatura = (fatura: Fatura) => {
    const hoje = new Date();
    const vencimento = new Date(fatura.dataVencimento);

    // Fatura prevista (futura)
    if (fatura.ehPrevisao) {
      return {
        label: "Prevista",
        cor: "bg-purple-100 text-purple-800",
        icone: Calendar,
      };
    }

    if (fatura.status === "PAGA") {
      return {
        label: "Paga",
        cor: "bg-green-100 text-green-800",
        icone: CheckCircle,
      };
    }

    if (fatura.status === "FECHADA" && vencimento < hoje) {
      return {
        label: "Atrasada",
        cor: "bg-red-100 text-red-800",
        icone: AlertTriangle,
      };
    }

    if (fatura.status === "FECHADA") {
      return {
        label: "Fechada",
        cor: "bg-blue-100 text-blue-800",
        icone: FileText,
      };
    }

    return {
      label: "Aberta",
      cor: "bg-yellow-100 text-yellow-800",
      icone: Clock,
    };
  };

  const calcularValorPendente = (fatura: Fatura) => {
    return fatura.valorTotal - fatura.valorPago;
  };

  if (carregando) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Carregando faturas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/dashboard/cartoes")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Faturas do Cartão
          </h1>
          {cartao && (
            <div className="flex items-center gap-2 mt-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: cartao.cor }}
              />
              <p className="text-gray-600">
                {cartao.nome} • {cartao.bandeira}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Faturas */}
      <div className="space-y-4">
        {faturas.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma fatura encontrada
              </h3>
              <p className="text-gray-600 text-center">
                Este cartão ainda não possui faturas.
              </p>
            </CardContent>
          </Card>
        ) : (
          faturas.map((fatura) => {
            const status = getStatusFatura(fatura);
            const IconeStatus = status.icone;
            const valorPendente = calcularValorPendente(fatura);

            return (
              <Card key={fatura.id} className="overflow-hidden">
                <CardHeader className="pb-3 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        {formatarMesReferencia(fatura.mesReferencia)}
                      </CardTitle>
                      <CardDescription>
                        Fechamento: {formatarData(fatura.dataFechamento)} •
                        Vencimento: {formatarData(fatura.dataVencimento)}
                      </CardDescription>
                    </div>
                    <Badge className={status.cor}>
                      <IconeStatus className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  {/* Resumo da Fatura */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <DollarSign className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                      <div className="text-sm text-gray-600">Valor Total</div>
                      <div className="text-lg font-semibold">
                        {formatarMoeda(fatura.valorTotal)}
                      </div>
                    </div>

                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                      <div className="text-sm text-gray-600">Valor Pago</div>
                      <div className="text-lg font-semibold text-green-600">
                        {formatarMoeda(fatura.valorPago)}
                      </div>
                    </div>

                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                      <div className="text-sm text-gray-600">
                        Valor Pendente
                      </div>
                      <div className="text-lg font-semibold text-orange-600">
                        {formatarMoeda(valorPendente)}
                      </div>
                    </div>
                  </div>

                  {/* Lançamentos da Fatura */}
                  {fatura.lancamentos && fatura.lancamentos.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Lançamentos ({fatura.lancamentos.length})
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {fatura.lancamentos.map((lancamento) => (
                          <div
                            key={lancamento.id}
                            className="flex justify-between items-center p-3 border rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="font-medium">
                                {lancamento.descricao}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span
                                  className="inline-block w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor: lancamento.categoria.cor,
                                  }}
                                />
                                {lancamento.categoria.nome}
                                <span>•</span>
                                {formatarData(lancamento.data)}
                              </div>
                            </div>
                            <div className="font-semibold text-red-600">
                              {formatarMoeda(lancamento.valor)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pagamentos */}
                  {fatura.PagamentoFatura &&
                    fatura.PagamentoFatura.length > 0 && ( // CORREÇÃO: PagamentoFatura
                      <div className="mt-4">
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Pagamentos ({fatura.PagamentoFatura.length}){" "}
                          {/* CORREÇÃO: PagamentoFatura */}
                        </h4>
                        <div className="space-y-2">
                          {fatura.PagamentoFatura.map(
                            (
                              pagamento // CORREÇÃO: PagamentoFatura
                            ) => (
                              <div
                                key={pagamento.id}
                                className="flex justify-between items-center p-3 bg-green-50 rounded-lg"
                              >
                                <div>
                                  <div className="font-medium">
                                    Pagamento via {pagamento.metodo}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {formatarData(pagamento.data)}
                                  </div>
                                </div>
                                <div className="font-semibold text-green-600">
                                  {formatarMoeda(pagamento.valor)}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Ações */}
                  {!fatura.ehPrevisao &&
                    valorPendente > 0 &&
                    fatura.status !== "PAGA" && (
                      <div className="mt-4 pt-4 border-t">
                        <Button
                          onClick={() =>
                            router.push(`/dashboard/faturas/${fatura.id}/pagar`)
                          }
                          className="w-full"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Pagar Fatura
                        </Button>
                      </div>
                    )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
