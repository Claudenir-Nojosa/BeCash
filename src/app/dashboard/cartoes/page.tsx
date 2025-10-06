// app/dashboard/cartoes/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Plus,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Cartao {
  faturaAtual: any;
  id: string;
  nome: string;
  bandeira: string;
  limite: number;
  diaFechamento: number;
  diaVencimento: number;
  cor: string;
  observacoes?: string;
  lancamentos: Array<{
    id: string;
    valor: number;
    descricao: string;
    data: string;
  }>;
  _count?: {
    lancamentos: number;
  };
  totalGasto?: number;
  utilizacaoLimite?: number;
}

export default function CartoesPage() {
  const router = useRouter();
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);

  useEffect(() => {
    carregarCartoes();
  }, []);

  const carregarCartoes = async () => {
    try {
      setCarregando(true);
      const response = await fetch("/api/cartoes");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao carregar cartões");
      }

      const data = await response.json();

      // Para cada cartão, carregar o limite real (opcional)
      const cartoesComLimiteReal = await Promise.all(
        data.map(async (cartao: Cartao) => {
          try {
            const limiteResponse = await fetch(
              `/api/cartoes/${cartao.id}/limite`
            );
            if (limiteResponse.ok) {
              const limiteData = await limiteResponse.json();
              return {
                ...cartao,
                totalGasto: limiteData.totalUtilizado,
                utilizacaoLimite: limiteData.utilizacaoPercentual,
              };
            }
            return cartao;
          } catch (error) {
            console.error(
              `Erro ao carregar limite do cartão ${cartao.id}:`,
              error
            );
            return cartao;
          }
        })
      );

      setCartoes(cartoesComLimiteReal);
    } catch (error) {
      console.error("Erro ao carregar cartões:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao carregar cartões"
      );
    } finally {
      setCarregando(false);
    }
  };

  const handleDeletarCartao = async (cartaoId: string) => {
    if (!confirm("Tem certeza que deseja excluir este cartão?")) {
      return;
    }

    try {
      setDeletandoId(cartaoId);
      const response = await fetch(`/api/cartoes/${cartaoId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Cartão excluído com sucesso");
        carregarCartoes();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao excluir cartão");
      }
    } catch (error) {
      console.error("Erro ao excluir cartão:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao excluir cartão"
      );
    } finally {
      setDeletandoId(null);
    }
  };

  const getStatusUtilizacao = (utilizacaoLimite: number) => {
    if (utilizacaoLimite >= 90) return "critico";
    if (utilizacaoLimite >= 70) return "alerta";
    return "normal";
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  if (carregando) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Carregando cartões...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cartões</h1>
          <p className="text-gray-600 mt-2">
            Gerencie seus cartões de crédito e débito
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/cartoes/novo")}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cartão
        </Button>
      </div>

      {cartoes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum cartão cadastrado
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Comece cadastrando seu primeiro cartão para acompanhar seus
              gastos.
            </p>
            <Button onClick={() => router.push("/dashboard/cartoes/novo")}>
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeiro Cartão
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cartoes.map((cartao) => {
            const status = getStatusUtilizacao(cartao.utilizacaoLimite || 0);

            return (
              <Card
                key={cartao.id}
                className="relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/dashboard/cartoes/${cartao.id}`)}
              >
                <div
                  className="absolute top-0 left-0 w-full h-2"
                  style={{ backgroundColor: cartao.cor }}
                />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        {cartao.nome}
                      </CardTitle>
                      <CardDescription>{cartao.bandeira}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/cartoes/${cartao.id}`);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/dashboard/cartoes/${cartao.id}/faturas`
                            );
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Ver Faturas
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/dashboard/cartoes/${cartao.id}/editar`
                            );
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/dashboard/faturas/${cartao.faturaAtual?.id}/pagar`
                            );
                          }}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pagar Fatura
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletarCartao(cartao.id);
                          }}
                          disabled={deletandoId === cartao.id}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {deletandoId === cartao.id
                            ? "Excluindo..."
                            : "Excluir"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Limite:</span>
                      <span className="font-medium">
                        {formatarMoeda(cartao.limite)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Utilizado:</span>
                      <span className="font-medium">
                        {formatarMoeda(cartao.totalGasto || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Disponível:</span>
                      <span className="font-medium">
                        {formatarMoeda(
                          cartao.limite - (cartao.totalGasto || 0)
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Utilização:</span>
                      <span className="font-medium">
                        {Math.round(cartao.utilizacaoLimite || 0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          status === "critico"
                            ? "bg-red-500"
                            : status === "alerta"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min(cartao.utilizacaoLimite || 0, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      {status === "critico" ? (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      ) : status === "alerta" ? (
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      <span
                        className={
                          status === "critico"
                            ? "text-red-600"
                            : status === "alerta"
                              ? "text-yellow-600"
                              : "text-green-600"
                        }
                      >
                        {status === "critico"
                          ? "Limite crítico"
                          : status === "alerta"
                            ? "Atenção"
                            : "Dentro do limite"}
                      </span>
                    </div>
                    <Badge variant="outline">
                      {cartao._count?.lancamentos || 0} lançamentos
                    </Badge>
                  </div>

                  <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
                    <span>Fechamento: dia {cartao.diaFechamento}</span>
                    <span>Vencimento: dia {cartao.diaVencimento}</span>
                  </div>

                  {/* Botões de ação rápida */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/cartoes/${cartao.id}`);
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Detalhes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/cartoes/${cartao.id}/faturas`);
                      }}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Faturas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
