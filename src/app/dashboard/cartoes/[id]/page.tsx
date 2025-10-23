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
  Plus,
  MoreVertical,
  Tag,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormEditarCartao } from "@/components/shared/FormEditarCartao";

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
    tipo: string; // 👈 ADICIONAR
    categoria?: {
      // 👈 ADICIONAR (opcional porque pode ser null)
      id: string;
      nome: string;
      cor: string;
      icone: string;
    };
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
  const [sheetEditarAberto, setSheetEditarAberto] = useState(false);
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

  const getStatusColor = (status: string) => {
    const colors = {
      ABERTA: "bg-blue-900/50 text-blue-300 border-blue-700",
      FECHADA: "bg-orange-900/50 text-orange-300 border-orange-700",
      PAGA: "bg-green-900/50 text-green-300 border-green-700",
      VENCIDA: "bg-red-900/50 text-red-300 border-red-700",
    };
    return (
      colors[status as keyof typeof colors] ||
      "bg-gray-900/50 text-gray-300 border-gray-700"
    );
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

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarData = (dataString: string) => {
    if (!dataString || dataString === "Invalid Date") return "Data inválida";

    // Extrair ANO, MÊS, DIA diretamente da string SEM conversão de timezone
    const dataPart = dataString.substring(0, 10); // "2025-11-07"
    const [ano, mes, dia] = dataPart.split("-");

    // Retornar NO MESMO FORMATO que está no banco
    return `${dia}/${mes}/${ano}`;
  };

  if (carregando) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-8 bg-gray-800 rounded w-64 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-40 bg-gray-800 rounded-lg animate-pulse" />
              <div className="h-96 bg-gray-800 rounded-lg animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="h-48 bg-gray-800 rounded-lg animate-pulse" />
              <div className="h-32 bg-gray-800 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cartao) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Cartão não encontrado
          </h1>
          <Button
            onClick={() => router.push("/dashboard/cartoes")}
            className="bg-white text-gray-900 hover:bg-gray-100"
          >
            Voltar para Cartões
          </Button>
        </div>
      </div>
    );
  }

  const utilizacao = calcularUtilizacao();
  const totalFaturaAtual = calcularTotalFaturaAtual();
  const faturaAberta = cartao.Fatura.find((f) => f.status === "ABERTA");
  const lancamentosRecentes = cartao.lancamentos.slice(0, 10);
  const hoje = new Date();

  // Encontrar a próxima fatura que ainda não venceu
  const proximaFatura = cartao.Fatura.filter(
    (fatura) => new Date(fatura.dataVencimento) >= hoje
  ) // Só faturas futuras
    .sort(
      (a, b) =>
        new Date(a.dataVencimento).getTime() -
        new Date(b.dataVencimento).getTime()
    )[0]; // Ordenar por vencimento

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/dashboard/cartoes")}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-8 rounded"
                style={{ backgroundColor: cartao.cor }}
              />
              <div>
                <h1 className="text-3xl font-bold text-white">{cartao.nome}</h1>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/dashboard/cartoes/${cartaoId}/faturas`)
              }
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Faturas
            </Button>
            <Button
              variant="outline"
              onClick={() => setSheetEditarAberto(true)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Cartão
            </Button>
          </div>
        </div>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Informações do Cartão */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CreditCard className="h-5 w-5" />
                Informações do Cartão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Bandeira</p>
                  <p className="text-white capitalize">
                    {cartao.bandeira.toLowerCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Limite Total</p>
                  <p className="text-xl font-bold text-white">
                    {formatarMoeda(cartao.limite)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Fechamento</p>
                    <p className="text-white flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Dia {cartao.diaFechamento}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Vencimento</p>
                    <p className="text-white flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Dia {cartao.diaVencimento}
                    </p>
                  </div>
                </div>
                {cartao.observacoes && (
                  <div>
                    <p className="text-sm text-gray-400">Observações</p>
                    <p className="text-sm text-gray-300">
                      {cartao.observacoes}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-800">
                <Button
                  className="w-full bg-white text-gray-900 hover:bg-gray-100"
                  onClick={() => router.push("/dashboard/lancamentos/")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Lançamento
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Status do Limite */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5" />
                Status do Limite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-400">Utilizado</p>
                  <p className="text-2xl font-bold text-white">
                    {formatarMoeda(totalFaturaAtual)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-400">Disponível</p>
                  <p className="text-2xl font-bold text-white">
                    {formatarMoeda(cartao.limite - totalFaturaAtual)}
                  </p>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Utilização do limite</span>
                  <span
                    className={`font-medium ${
                      utilizacao >= 90
                        ? "text-red-400"
                        : utilizacao >= 70
                          ? "text-orange-400"
                          : "text-green-400"
                    }`}
                  >
                    {utilizacao.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3">
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
                      ? "bg-red-900/50 text-red-300 border border-red-800"
                      : "bg-orange-900/50 text-orange-300 border border-orange-800"
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

              {/* Fatura Atual */}
              {proximaFatura && (
                <div className="pt-4 border-t border-gray-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Próxima fatura:</span>
                    <span className="text-lg font-bold text-white">
                      {formatarMoeda(proximaFatura.valorTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Vencimento:</span>
                    <span className="text-white">
                      {formatarData(proximaFatura.dataVencimento)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Status:</span>
                    <Badge className={getStatusColor(proximaFatura.status)}>
                      {proximaFatura.status === "ABERTA"
                        ? "Em aberto"
                        : proximaFatura.status === "FECHADA"
                          ? "Fechada"
                          : proximaFatura.status === "PAGA"
                            ? "Paga"
                            : "Vencida"}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Card 3: Ranking de Despesas por Categoria */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">
                Despesas por Categoria
              </CardTitle>
              <CardDescription className="text-gray-400">
                Distribuição dos gastos por categoria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                // Calcular despesas por categoria
                const despesasPorCategoria = cartao.lancamentos
                  .filter((lancamento) => lancamento.tipo === "DESPESA") // Apenas despesas
                  .reduce(
                    (acc, lancamento) => {
                      const categoriaNome =
                        lancamento.categoria?.nome || "Sem Categoria";
                      if (!acc[categoriaNome]) {
                        acc[categoriaNome] = {
                          total: 0,
                          cor: lancamento.categoria?.cor || "#6B7280",
                          icone: lancamento.categoria?.icone || "Tag",
                        };
                      }
                      acc[categoriaNome].total += lancamento.valor;
                      return acc;
                    },
                    {} as Record<
                      string,
                      { total: number; cor: string; icone: string }
                    >
                  );

                // Converter para array e ordenar do maior para o menor
                const rankingCategorias = Object.entries(despesasPorCategoria)
                  .sort(([, a], [, b]) => b.total - a.total)
                  .slice(0, 5); // Top 5 categorias

                const totalDespesas = rankingCategorias.reduce(
                  (sum, [, categoria]) => sum + categoria.total,
                  0
                );

                if (rankingCategorias.length === 0) {
                  return (
                    <div className="text-center py-4">
                      <p className="text-gray-400">
                        Nenhuma despesa encontrada
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {rankingCategorias.map(
                      ([categoriaNome, categoriaData], index) => {
                        const porcentagem =
                          totalDespesas > 0
                            ? (categoriaData.total / totalDespesas) * 100
                            : 0;

                        // Função para obter o ícone da categoria
                        const getIcone = (icone: string) => {
                          try {
                            const IconComponent =
                              require("lucide-react")[icone];
                            return (
                              <IconComponent className="w-3 h-3 text-white" />
                            );
                          } catch {
                            return <Tag className="w-3 h-3 text-white" />;
                          }
                        };

                        return (
                          <div
                            key={categoriaNome}
                            className="flex justify-between items-center p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: categoriaData.cor }}
                              >
                                {getIcone(categoriaData.icone)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">
                                  {categoriaNome}
                                </p>
                                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                                  <div
                                    className="h-1.5 rounded-full"
                                    style={{
                                      backgroundColor: categoriaData.cor,
                                      width: `${porcentagem}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <p className="text-white font-medium">
                                {formatarMoeda(categoriaData.total)}
                              </p>
                              <p className="text-xs text-gray-400">
                                {porcentagem.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        );
                      }
                    )}

                    {/* Total geral */}
                    <div className="pt-3 border-t border-gray-800">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Total:</span>
                        <span className="text-white font-bold">
                          {formatarMoeda(totalDespesas)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-3 border-t border-gray-800">
                <Button
                  variant="outline"
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                  onClick={() =>
                    router.push(`/dashboard/relatorios?cartaoId=${cartaoId}`)
                  }
                >
                  Ver Relatório Completo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card 4: Lançamentos Recentes */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Lançamentos Recentes</CardTitle>
            <CardDescription className="text-gray-400">
              {cartao.lancamentos.length} lançamentos realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cartao.lancamentos.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Nenhum lançamento encontrado</p>
                <Button
                  className="mt-4 bg-white text-gray-900 hover:bg-gray-100"
                  onClick={() =>
                    router.push(
                      `/dashboard/lancamentos/novo?cartaoId=${cartaoId}`
                    )
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Lançamento
                </Button>
              </div>
            ) : (
              <div className="border border-gray-800 rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-gray-800/50">
                      <TableHead className="text-gray-300">Descrição</TableHead>
                      <TableHead className="text-gray-300">Data</TableHead>
                      <TableHead className="text-gray-300">Valor</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Fatura</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lancamentosRecentes.map((lancamento) => (
                      <TableRow
                        key={lancamento.id}
                        className="border-gray-800 hover:bg-gray-800/50"
                      >
                        <TableCell className="font-medium text-white">
                          {lancamento.descricao}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {formatarData(lancamento.data)}
                        </TableCell>
                        <TableCell className="text-white">
                          {formatarMoeda(lancamento.valor)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={lancamento.pago ? "default" : "secondary"}
                            className={
                              lancamento.pago
                                ? "bg-green-900/50 text-green-300 border-green-700"
                                : "bg-yellow-900/50 text-yellow-300 border-yellow-700"
                            }
                          >
                            {lancamento.pago ? "Pago" : "Pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {lancamento.Fatura ? (
                            <Badge
                              className={getStatusColor(
                                lancamento.Fatura.status
                              )}
                            >
                              {lancamento.Fatura.mesReferencia}
                            </Badge>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {cartao.lancamentos.length > 10 && (
              <Button
                variant="outline"
                className="w-full mt-4 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                onClick={() =>
                  router.push(`/dashboard/lancamentos?cartaoId=${cartaoId}`)
                }
              >
                Ver todos os lançamentos
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
      <Sheet open={sheetEditarAberto} onOpenChange={setSheetEditarAberto}>
        <SheetContent className="bg-gray-900 border-gray-800 text-white overflow-y-auto w-full sm:max-w-2xl">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white">Editar Cartão</SheetTitle>
            <SheetDescription className="text-gray-400">
              Atualize as informações do seu cartão
            </SheetDescription>
          </SheetHeader>

          <FormEditarCartao
            cartao={cartao}
            onSalvo={() => {
              setSheetEditarAberto(false);
              carregarCartao(); // Recarrega os dados
            }}
            onCancelar={() => setSheetEditarAberto(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
