// app/dashboard/lancamentos/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Filter,
  Search,
  ArrowUpDown,
  CheckCircle,
  Edit,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatarDataParaExibição } from "@/lib/utils";

interface Lancamento {
  id: string;
  descricao: string;
  valor: number;
  tipo: "receita" | "despesa";
  categoria: string;
  tipoLancamento: string;
  responsavel: string;
  data: Date;
  dataVencimento: Date | null;
  pago: boolean;
  recorrente: boolean;
  frequencia: string | null;
  observacoes: string | null;
  origem: string;
  usuarioId: string;
  createdAt: Date;
  updatedAt: Date;
  usuario: {
    name: string | null;
    email: string;
  };
}

interface Resumo {
  receitas: number;
  despesas: number;
  saldo: number;
}

interface TotaisPorCategoria {
  categoria: string;
  tipo: string;
  _sum: {
    valor: number | null;
  };
}

export default function LancamentosPage() {
  const router = useRouter();
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [resumo, setResumo] = useState<Resumo>({
    receitas: 0,
    despesas: 0,
    saldo: 0,
  });
  const [totaisPorCategoria, setTotaisPorCategoria] = useState<
    TotaisPorCategoria[]
  >([]);
  const [carregando, setCarregando] = useState(true);
  const [filtros, setFiltros] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    categoria: "todas",
    tipo: "todos",
    busca: "",
  });
  const [atualizandoPagamento, setAtualizandoPagamento] = useState<
    string | null
  >(null);

  useEffect(() => {
    buscarLancamentos();
  }, [filtros.mes, filtros.ano, filtros.categoria, filtros.tipo]);

  const buscarLancamentos = async () => {
    try {
      setCarregando(true);

      // Toast de carregamento
      const toastId = toast.loading("Carregando lançamentos...");

      const params = new URLSearchParams({
        mes: filtros.mes.toString(),
        ano: filtros.ano.toString(),
        categoria: filtros.categoria,
        tipo: filtros.tipo,
      });

      const response = await fetch(`/api/lancamentos?${params}`);

      if (!response.ok) {
        throw new Error("Erro ao buscar lançamentos");
      }

      const data = await response.json();
      setLancamentos(data.lancamentos);
      setResumo(data.resumo);
      setTotaisPorCategoria(data.totaisPorCategoria);

      // Toast de sucesso
      toast.success("Lançamentos carregados", {
        id: toastId,
        description: `${data.lancamentos.length} lançamento(s) encontrado(s)`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Erro ao buscar lançamentos:", error);

      // Toast de erro
      toast.error("Erro ao carregar lançamentos", {
        description:
          "Não foi possível carregar os lançamentos. Tente novamente.",
        duration: 5000,
      });
    } finally {
      setCarregando(false);
    }
  };

  const atualizarStatusPagamento = async (id: string, pago: boolean) => {
    try {
      setAtualizandoPagamento(id);

      // Toast de carregamento
      const toastId = toast.loading(
        pago ? "Marcando como pago..." : "Marcando como pendente..."
      );

      const response = await fetch(`/api/lancamentos/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pago }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar status de pagamento");
      }

      // Atualizar a lista localmente
      setLancamentos((prev) =>
        prev.map((lancamento) =>
          lancamento.id === id ? { ...lancamento, pago } : lancamento
        )
      );

      // Recalcular resumo
      if (pago) {
        const lancamento = lancamentos.find((l) => l.id === id);
        if (lancamento) {
          if (lancamento.tipo === "receita") {
            setResumo((prev) => ({
              ...prev,
              receitas: prev.receitas + lancamento.valor,
              saldo: prev.saldo + lancamento.valor,
            }));
          } else {
            setResumo((prev) => ({
              ...prev,
              despesas: prev.despesas + lancamento.valor,
              saldo: prev.saldo - lancamento.valor,
            }));
          }
        }
      }

      // Toast de sucesso
      toast.success(`Lançamento ${pago ? "pago" : "marcado como pendente"}`, {
        id: toastId,
        description: `O status foi atualizado com sucesso`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error);

      // Toast de erro
      toast.error("Erro ao atualizar status", {
        description: "Não foi possível atualizar o status de pagamento",
        duration: 5000,
      });
    } finally {
      setAtualizandoPagamento(null);
    }
  };

  const excluirLancamento = async (id: string) => {
    // Toast personalizado para confirmar a exclusão
    toast.custom(
      (t) => (
        <div className="flex flex-col gap-4 w-full max-w-md bg-white rounded-lg shadow-lg border p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                Confirmar exclusão
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Tem certeza que deseja excluir este lançamento? Esta ação não
                pode ser desfeita.
              </p>
            </div>
            <button
              onClick={() => toast.dismiss(t)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => toast.dismiss(t)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t);
                await realizarExclusao(id);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      ),
      {
        duration: 10000, // 10 segundos
      }
    );
  };

  const realizarExclusao = async (id: string) => {
    try {
      // Mostrar toast de carregamento
      const toastId = toast.loading("Excluindo lançamento...");

      const response = await fetch(`/api/lancamentos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir lançamento");
      }

      // Remover da lista localmente
      setLancamentos((prev) =>
        prev.filter((lancamento) => lancamento.id !== id)
      );

      // Atualizar toast para sucesso
      toast.success("Lançamento excluído com sucesso", {
        id: toastId,
        description: "O lançamento foi removido do sistema",
        duration: 3000,
      });
    } catch (error) {
      console.error("Erro ao excluir lançamento:", error);

      // Toast de erro
      toast.error("Erro ao excluir lançamento", {
        description: "Não foi possível excluir o lançamento. Tente novamente.",
        duration: 5000,
      });
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarCategoria = (categoria: string) => {
    const categorias: Record<string, string> = {
      salario: "Salário",
      freela: "Freelance",
      investimentos: "Investimentos",
      alimentacao: "Alimentação",
      transporte: "Transporte",
      casa: "Casa",
      pessoal: "Pessoal",
      lazer: "Lazer",
      outros: "Outros",
    };
    return categorias[categoria] || categoria;
  };

  const lancamentosFiltrados = lancamentos.filter((lancamento) =>
    lancamento.descricao.toLowerCase().includes(filtros.busca.toLowerCase())
  );

  const meses = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];

  const anos = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  return (
    <div className="container mx-auto p-6 mt-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Lançamentos</h1>
        <Button onClick={() => router.push("/dashboard/lancamentos/novo")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Lançamento
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <Button variant="outline" size="sm" onClick={buscarLancamentos}>
              Aplicar Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mes">Mês</Label>
              <Select
                value={filtros.mes.toString()}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, mes: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value.toString()}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ano">Ano</Label>
              <Select
                value={filtros.ano.toString()}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, ano: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((ano) => (
                    <SelectItem key={ano} value={ano.toString()}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={filtros.categoria}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, categoria: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="salario">Salário</SelectItem>
                  <SelectItem value="freela">Freelance</SelectItem>
                  <SelectItem value="investimentos">Investimentos</SelectItem>
                  <SelectItem value="alimentacao">Alimentação</SelectItem>
                  <SelectItem value="transporte">Transporte</SelectItem>
                  <SelectItem value="casa">Casa</SelectItem>
                  <SelectItem value="pessoal">Pessoal</SelectItem>
                  <SelectItem value="lazer">Lazer</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={filtros.tipo}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, tipo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="busca">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="busca"
                placeholder="Buscar por descrição..."
                className="pl-8"
                value={filtros.busca}
                onChange={(e) =>
                  setFiltros({ ...filtros, busca: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-800">Receitas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-800">
              {formatarMoeda(resumo.receitas)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-red-800">Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-800">
              {formatarMoeda(resumo.despesas)}
            </p>
          </CardContent>
        </Card>

        <Card
          className={
            resumo.saldo >= 0
              ? "bg-blue-50 border-blue-200"
              : "bg-amber-50 border-amber-200"
          }
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-800">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${resumo.saldo >= 0 ? "text-blue-800" : "text-amber-800"}`}
            >
              {formatarMoeda(resumo.saldo)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Lançamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Lançamentos</CardTitle>
          <CardDescription>
            {lancamentosFiltrados.length} lançamento(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : lancamentosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum lançamento encontrado
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Data</TableHead>
                    <TableHead className="text-center">Descrição</TableHead>
                    <TableHead className="text-center">Categoria</TableHead>
                    <TableHead className="text-center">Responsável</TableHead>
                    <TableHead className="text-center">Valor</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lancamentosFiltrados.map((lancamento) => (
                    <TableRow key={lancamento.id}>
                      <TableCell className="text-center">
                        {formatarDataParaExibição(lancamento.data)}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {lancamento.descricao}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatarCategoria(lancamento.categoria)}
                      </TableCell>
                      <TableCell className="text-center">
                        {lancamento.responsavel}
                      </TableCell>
                      <TableCell
                        className={`text-center font-medium ${
                          lancamento.tipo === "receita"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {lancamento.tipo === "receita" ? "+ " : "- "}
                        {formatarMoeda(lancamento.valor)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={lancamento.pago ? "default" : "secondary"}
                          className={
                            lancamento.pago
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : lancamento.tipo === "receita"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                : "bg-yellow-300 text-yellow-800 hover:bg-yellow-200"
                          }
                        >
                          {lancamento.pago
                            ? lancamento.tipo === "receita"
                              ? "Recebido"
                              : "Pago"
                            : lancamento.tipo === "receita"
                              ? "A receber"
                              : "A pagar"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                          {!lancamento.pago && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                atualizarStatusPagamento(lancamento.id, true)
                              }
                              disabled={atualizandoPagamento === lancamento.id}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {atualizandoPagamento === lancamento.id
                                ? "Processando..."
                                : lancamento.tipo === "receita"
                                  ? "Receber"
                                  : "Pagar"}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              router.push(
                                `/dashboard/lancamentos/${lancamento.id}`
                              )
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => excluirLancamento(lancamento.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
