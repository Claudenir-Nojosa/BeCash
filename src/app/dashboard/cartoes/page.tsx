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
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    valor: number;
  }>;
  faturas: Array<{
    id: string;
    valorTotal: number;
    status: string;
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
      const response = await fetch("/api/cartoes");
      if (response.ok) {
        const data = await response.json();
        setCartoes(data);
      } else {
        throw new Error("Erro ao carregar cartões");
      }
    } catch (error) {
      console.error("Erro ao carregar cartões:", error);
      toast.error("Erro ao carregar cartões");
    } finally {
      setCarregando(false);
    }
  };

  const handleDeletarCartao = async (cartaoId: string) => {
    if (
      !confirm(
        "Tem certeza que deseja excluir este cartão? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    setDeletandoId(cartaoId);
    try {
      const response = await fetch(`/api/cartoes/${cartaoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao excluir cartão");
      }

      toast.success("Cartão excluído com sucesso!");
      carregarCartoes(); // Recarregar a lista
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir cartão");
      console.error(error);
    } finally {
      setDeletandoId(null);
    }
  };

  const getStatusCor = (utilizacao: number) => {
    if (utilizacao >= 90) return "text-red-500";
    if (utilizacao >= 70) return "text-orange-500";
    return "text-green-500";
  };

  const getStatusBg = (utilizacao: number) => {
    if (utilizacao >= 90) return "bg-red-500";
    if (utilizacao >= 70) return "bg-orange-500";
    return "bg-green-500";
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

  const getStatusFatura = (fatura: any) => {
    if (!fatura) return null;

    const statusConfig = {
      ABERTA: { label: "Aberta", variant: "secondary" as const },
      FECHADA: { label: "Fechada", variant: "outline" as const },
      PAGA: { label: "Paga", variant: "default" as const },
      VENCIDA: { label: "Vencida", variant: "destructive" as const },
    };

    return (
      statusConfig[fatura.status as keyof typeof statusConfig] ||
      statusConfig.ABERTA
    );
  };

  if (carregando) {
    return (
      <div className="container mx-auto p-6 mt-20">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Meus Cartões</h1>
            <p className="text-muted-foreground">
              Gerencie seus cartões de crédito
            </p>
          </div>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cartão
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-5/6"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 mt-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Meus Cartões</h1>
          <p className="text-muted-foreground">
            Gerencie seus cartões de crédito
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/cartoes/novo")}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cartão
        </Button>
      </div>

      {cartoes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhum cartão cadastrado
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Adicione seu primeiro cartão para começar a controlar suas faturas
            </p>
            <Button onClick={() => router.push("/dashboard/cartoes/novo")}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cartão
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cartoes.map((cartao) => {
            const utilizacao = cartao.utilizacaoLimite || 0;
            const faturaAtual = cartao.faturas[0];
            const statusFatura = getStatusFatura(faturaAtual);

            return (
              <Card key={cartao.id} className="relative overflow-hidden">
                <div
                  className="absolute top-0 left-0 w-full h-2"
                  style={{ backgroundColor: cartao.cor }}
                />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {getBandeiraIcon(cartao.bandeira)}
                        {cartao.nome}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span className="capitalize">
                          {cartao.bandeira.toLowerCase()}
                        </span>
                        {!cartao.ativo && (
                          <Badge variant="secondary" className="text-xs">
                            Inativo
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/dashboard/cartoes/${cartao.id}/editar`
                            )
                          }
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/dashboard/lancamentos/novo?cartaoId=${cartao.id}`
                            )
                          }
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Nova Compra
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeletarCartao(cartao.id)}
                          disabled={deletandoId === cartao.id}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deletandoId === cartao.id
                            ? "Excluindo..."
                            : "Excluir"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Limite e Utilização */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Limite:</span>
                      <span className="font-medium">
                        R${" "}
                        {cartao.limite.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Utilizado:</span>
                      <span
                        className={`font-medium ${getStatusCor(utilizacao)}`}
                      >
                        R${" "}
                        {(cartao.totalGasto || 0).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                        <span className="ml-1">({utilizacao.toFixed(1)}%)</span>
                      </span>
                    </div>
                    {faturaAtual && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Fatura atual:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            R${" "}
                            {faturaAtual.valorTotal.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                          {statusFatura && (
                            <Badge
                              variant={statusFatura.variant}
                              className="text-xs"
                            >
                              {statusFatura.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Barra de progresso */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getStatusBg(utilizacao)}`}
                      style={{ width: `${Math.min(utilizacao, 100)}%` }}
                    />
                  </div>

                  {/* Datas de fechamento e vencimento */}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Fechamento: dia {cartao.diaFechamento}</span>
                    <span>Vencimento: dia {cartao.diaVencimento}</span>
                  </div>

                  {/* Alertas */}
                  {utilizacao >= 70 && (
                    <div
                      className={`flex items-center gap-2 text-sm p-2 rounded ${
                        utilizacao >= 90
                          ? "bg-red-50 text-red-700"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">
                        {utilizacao >= 90
                          ? "Limite quase esgotado"
                          : "Limite elevado"}
                      </span>
                    </div>
                  )}

                  {/* Botões de ação */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        router.push(`/dashboard/cartoes/${cartao.id}`)
                      }
                    >
                      Detalhes
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/dashboard/lancamentos/novo?cartaoId=${cartao.id}`
                        )
                      }
                    >
                      Comprar
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
