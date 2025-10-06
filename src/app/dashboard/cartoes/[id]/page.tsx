// app/dashboard/cartoes/[id]/page.tsx
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
  Edit,
  CreditCard,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface Cartao {
  id: string;
  nome: string;
  bandeira: string;
  limite: number;
  diaFechamento: number;
  diaVencimento: number;
  cor: string;
  ativo: boolean;
  observacoes?: string;
  lancamentos: Array<{
    id: string;
    descricao: string;
    valor: number;
    data: string;
    pago: boolean;
    Fatura: {
      status: string;
      mesReferencia: string;
    } | null;
  }>;
  Fatura: Array<{
    id: string;
    valorTotal: number;
    valorPago: number;
    status: string;
    mesReferencia: string;
    dataFechamento: string;
    dataVencimento: string;
  }>;
}

export default function DetalhesCartaoPage() {
  const params = useParams();
  const router = useRouter();
  const [cartao, setCartao] = useState<Cartao | null>(null);
  const [carregando, setCarregando] = useState(true);

  const cartaoId = params.id as string;

  useEffect(() => {
    if (cartaoId) {
      carregarCartao();
    }
  }, [cartaoId]);

  const carregarCartao = async () => {
    try {
      const response = await fetch(`/api/cartoes/${cartaoId}`);
      if (response.ok) {
        const data = await response.json();
        setCartao(data);
      } else {
        throw new Error("Erro ao carregar cartão");
      }
    } catch (error) {
      console.error("Erro ao carregar cartão:", error);
      toast.error("Erro ao carregar cartão");
    } finally {
      setCarregando(false);
    }
  };

  const getBandeiraIcon = (bandeira: string) => {
    const icons = {
      VISA: "💳",
      MASTERCARD: "🔴",
      ELO: "🟡",
      AMERICAN_EXPRESS: "🔵",
      HIPERCARD: "🟣",
      OUTROS: "💳",
    };
    return icons[bandeira as keyof typeof icons] || "💳";
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ABERTA: "bg-blue-100 text-blue-800",
      FECHADA: "bg-orange-100 text-orange-800",
      PAGA: "bg-green-100 text-green-800",
      VENCIDA: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const calcularUtilizacao = () => {
    if (!cartao) return 0;
    const lancamentosAtivos = cartao.lancamentos.filter(
      (l) => !l.pago && l.Fatura?.status !== "PAGA"
    );
    const total = lancamentosAtivos.reduce((sum, l) => sum + l.valor, 0);
    return (total / cartao.limite) * 100;
  };

  const calcularTotalFaturaAtual = () => {
    if (!cartao) return 0;
    const faturaAberta = cartao.Fatura.find((f) => f.status === "ABERTA");
    return faturaAberta ? faturaAberta.valorTotal : 0;
  };

  if (carregando) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-40 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cartao) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Cartão não encontrado</h1>
          <Button onClick={() => router.push("/dashboard/cartoes")}>
            Voltar para Cartões
          </Button>
        </div>
      </div>
    );
  }

  const utilizacao = calcularUtilizacao();
  const totalFaturaAtual = calcularTotalFaturaAtual();
  const faturaAberta = cartao.Fatura.find((f) => f.status === "ABERTA");
  const proximasFaturas = cartao.Fatura.filter((f) => f.status === "FECHADA");

  return (
    <div className="container mx-auto p-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/dashboard/cartoes")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-8 rounded"
              style={{ backgroundColor: cartao.cor }}
            />
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                {getBandeiraIcon(cartao.bandeira)}
                {cartao.nome}
              </h1>
              <p className="text-muted-foreground capitalize">
                {cartao.bandeira.toLowerCase()} •{" "}
                {cartao.ativo ? "Ativo" : "Inativo"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/cartoes/${cartaoId}/faturas`)
            }
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Faturas
          </Button>
          <Button
            onClick={() => router.push(`/dashboard/cartoes/${cartaoId}/editar`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card de Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Resumo do Cartão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Limite Total</p>
                  <p className="text-2xl font-bold">
                    {cartao.limite.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Utilizado</p>
                  <p className="text-2xl font-bold">
                    {totalFaturaAtual.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Utilização do limite</span>
                  <span
                    className={`font-medium ${
                      utilizacao >= 90
                        ? "text-red-500"
                        : utilizacao >= 70
                          ? "text-orange-500"
                          : "text-green-500"
                    }`}
                  >
                    {utilizacao.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      utilizacao >= 90
                        ? "bg-red-500"
                        : utilizacao >= 70
                          ? "bg-orange-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(utilizacao, 100)}%` }}
                  />
                </div>
              </div>

              {utilizacao >= 70 && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    utilizacao >= 90
                      ? "bg-red-50 text-red-700"
                      : "bg-orange-50 text-orange-700"
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {utilizacao >= 90
                      ? "Limite quase esgotado - considere reduzir gastos"
                      : "Limite elevado - atenção aos próximos gastos"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fatura Atual */}
          {faturaAberta && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Fatura Atual
                </CardTitle>
                <CardDescription>
                  Próximo fechamento:{" "}
                  {new Date(faturaAberta.dataFechamento).toLocaleDateString(
                    "pt-BR"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Valor atual:</span>
                    <span className="text-lg font-bold">
                      {faturaAberta.valorTotal.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Status:</span>
                    <Badge className={getStatusColor(faturaAberta.status)}>
                      {faturaAberta.status === "ABERTA"
                        ? "Em aberto"
                        : faturaAberta.status === "FECHADA"
                          ? "Fechada"
                          : faturaAberta.status === "PAGA"
                            ? "Paga"
                            : "Vencida"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Vencimento:</span>
                    <span>
                      {new Date(faturaAberta.dataVencimento).toLocaleDateString(
                        "pt-BR"
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Últimas Compras */}
          <Card>
            <CardHeader>
              <CardTitle>Últimas Compras</CardTitle>
              <CardDescription>
                {cartao.lancamentos.length} compras realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cartao.lancamentos.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma compra encontrada
                </p>
              ) : (
                <div className="space-y-3">
                  {cartao.lancamentos.slice(0, 5).map((lancamento) => (
                    <div
                      key={lancamento.id}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{lancamento.descricao}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(lancamento.data).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {lancamento.valor.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                        <Badge
                          variant={lancamento.pago ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {lancamento.pago ? "Pago" : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {cartao.lancamentos.length > 5 && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() =>
                    router.push(`/dashboard/lancamentos?cartaoId=${cartaoId}`)
                  }
                >
                  Ver todas as compras
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informações do Cartão */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Bandeira</p>
                <p className="capitalize">{cartao.bandeira.toLowerCase()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Dia de Fechamento
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Dia {cartao.diaFechamento}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Dia de Vencimento
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Dia {cartao.diaVencimento}
                </p>
              </div>
              {cartao.observacoes && (
                <div>
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="text-sm">{cartao.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={() =>
                  router.push(
                    `/dashboard/lancamentos/novo?cartaoId=${cartaoId}`
                  )
                }
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Nova Compra
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  router.push(`/dashboard/cartoes/${cartaoId}/faturas`)
                }
              >
                <FileText className="h-4 w-4 mr-2" />
                Ver Todas as Faturas
              </Button>
            </CardContent>
          </Card>

          {/* Próximas Faturas */}
          {proximasFaturas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Próximas Faturas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {proximasFaturas.slice(0, 3).map((fatura) => (
                    <div key={fatura.id} className="p-2 border rounded">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {new Date(
                            fatura.mesReferencia + "-01"
                          ).toLocaleDateString("pt-BR", {
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                        <Badge className={getStatusColor(fatura.status)}>
                          {fatura.status === "FECHADA"
                            ? "Fechada"
                            : fatura.status.toLowerCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {fatura.valorTotal.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
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
