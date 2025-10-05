// app/dashboard/lancamentos/receitas/page.tsx
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
  TrendingUp,
  ArrowDownCircle,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Lancamento {
  id: string;
  descricao: string;
  valor: number;
  tipo: string; // Mudado para string para lidar com "Receita"/"Despesa"
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

export default function ReceitasPage() {
  const router = useRouter();
  const [carregandoStatus, setCarregandoStatus] = useState<boolean>(true);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [resumo, setResumo] = useState<Resumo>({
    receitas: 0,
    despesas: 0,
    saldo: 0,
  });
  const [totaisPorCategoria, setTotaisPorCategoria] = useState<
    TotaisPorCategoria[]
  >([]);
  const [statusPagamento, setStatusPagamento] = useState<{
    [key: string]: boolean;
  }>({});
  const [carregando, setCarregando] = useState(true);
  const [filtros, setFiltros] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    categoria: "todas",
    busca: "",
    tipo: "todos",
  });
  const [atualizandoPagamento, setAtualizandoPagamento] = useState<
    string | null
  >(null);

  const getDataReferencia = (lancamento: Lancamento): Date => {
  // Se for cartão de crédito e tiver data de vencimento, usa a data de vencimento
  // Caso contrário, usa a data normal da compra/transação
  if (lancamento.dataVencimento) {
    return new Date(lancamento.dataVencimento);
  }
  return new Date(lancamento.data);
};

useEffect(() => {
  buscarLancamentosClaudenir();
}, [filtros.mes, filtros.ano, filtros.categoria, filtros.tipo]);

  // Função para normalizar o tipo (lidar com "Receita"/"Despesa" do banco)
  const normalizarTipo = (tipo: string): "receita" | "despesa" => {
    const tipoLower = tipo.toLowerCase();
    if (tipoLower === "receita" || tipoLower === "despesa") {
      return tipoLower as "receita" | "despesa";
    }
    return tipoLower as "receita" | "despesa";
  };

  // Função para obter o tipo normalizado para exibição
  const obterTipoNormalizado = (
    lancamento: Lancamento
  ): "receita" | "despesa" => {
    return normalizarTipo(lancamento.tipo);
  };

  // Função para corrigir o fuso horário da data
  const corrigirDataFusoHorario = (data: Date): Date => {
    const dataCorrigida = new Date(data);
    dataCorrigida.setHours(dataCorrigida.getHours() + 3); // Adiciona 3 horas para corrigir fuso horário
    return dataCorrigida;
  };

  // Função para formatar data corrigindo o fuso horário
  const formatarDataCorrigida = (data: Date): string => {
    const dataCorrigida = corrigirDataFusoHorario(data);
    return format(dataCorrigida, "dd/MM/yyyy", {
      locale: ptBR,
    });
  };

  useEffect(() => {
    const carregarStatusPagamento = async () => {
      setCarregandoStatus(true); // Iniciar carregamento
      const novosStatus: { [key: string]: boolean } = {};

      for (const lancamento of lancamentos) {
        if (
          lancamento.tipoLancamento === "compartilhado" ||
          lancamento.responsavel === "Compartilhado"
        ) {
          novosStatus[lancamento.id] = await verificarSeEstaPago(lancamento);
        } else {
          novosStatus[lancamento.id] = lancamento.pago;
        }
      }

      setStatusPagamento(novosStatus);
      setCarregandoStatus(false); // Finalizar carregamento
    };

    if (lancamentos.length > 0) {
      carregarStatusPagamento();
    } else {
      setCarregandoStatus(false);
    }
  }, [lancamentos]);

  const LoadingSpinner = ({ size = "sm" }: { size?: "sm" | "md" | "lg" }) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    };

    return (
      <div className="flex items-center justify-center">
        <div
          className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}
        ></div>
      </div>
    );
  };

const buscarLancamentosClaudenir = async () => {
  try {
    setCarregando(true);
    const toastId = toast.loading("Carregando lançamentos do Claudenir...");

    const params = new URLSearchParams({
      mes: filtros.mes.toString(),
      ano: filtros.ano.toString(),
      categoria: filtros.categoria,
      tipo: filtros.tipo,
    });

    const response = await fetch(`/api/lancamentos/claudenir?${params}`);

    if (!response.ok) throw new Error("Erro ao buscar lançamentos");

    const data = await response.json();
    
    // Filtrar os lançamentos pela data de referência (dataVencimento quando existir)
    const lancamentosFiltradosPorData = data.lancamentos.filter((lancamento: Lancamento) => {
      const dataReferencia = getDataReferencia(lancamento);
      return (
        dataReferencia.getMonth() + 1 === filtros.mes &&
        dataReferencia.getFullYear() === filtros.ano
      );
    });

    setLancamentos(lancamentosFiltradosPorData);

    // Usar o resumo calculado localmente considerando compartilhados
    const resumoCompartilhado = calcularResumoCompartilhado(lancamentosFiltradosPorData);
    setResumo(resumoCompartilhado);

    setTotaisPorCategoria(data.totaisPorCategoria);

    toast.success("Lançamentos carregados", { id: toastId });
  } catch (error) {
    console.error("Erro ao buscar lançamentos:", error);
    toast.error("Erro ao carregar lançamentos");
  } finally {
    setCarregando(false);
  }
};

// Adicione uma função para exibir a data correta na tabela
const getDataExibicao = (lancamento: Lancamento): string => {
  if (lancamento.dataVencimento) {
    return `Compra: ${formatarDataCorrigida(new Date(lancamento.data))}\nVence: ${formatarDataCorrigida(new Date(lancamento.dataVencimento))}`;
  }
  return formatarDataCorrigida(new Date(lancamento.data));
};

// Adicione um badge para identificar lançamentos de cartão de crédito
const getTipoTransacaoBadge = (lancamento: Lancamento) => {
  if (lancamento.dataVencimento) {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        💳 Cartão
      </Badge>
    );
  }
  return null;
};

  // Função para calcular totais por categoria considerando compartilhados
  const calcularTotaisPorCategoria = (lancamentos: Lancamento[]) => {
    const totais: { [key: string]: { receita: number; despesa: number } } = {};

    lancamentos.forEach((lancamento) => {
      const valorClaudenir = calcularValorParaClaudenir(lancamento);
      const tipoNormalizado = obterTipoNormalizado(lancamento);
      const categoria = lancamento.categoria;

      // Inicializar a categoria se não existir
      if (!totais[categoria]) {
        totais[categoria] = { receita: 0, despesa: 0 };
      }

      // Adicionar ao total correspondente
      if (tipoNormalizado === "receita") {
        totais[categoria].receita += valorClaudenir;
      } else {
        totais[categoria].despesa += valorClaudenir;
      }
    });

    // Converter para o formato do array
    const resultado: Array<{
      categoria: string;
      tipo: string;
      _sum: { valor: number | null };
    }> = [];

    Object.entries(totais).forEach(([categoria, valores]) => {
      if (valores.receita > 0) {
        resultado.push({
          categoria,
          tipo: "receita",
          _sum: { valor: valores.receita },
        });
      }
      if (valores.despesa > 0) {
        resultado.push({
          categoria,
          tipo: "despesa",
          _sum: { valor: valores.despesa },
        });
      }
    });

    return resultado;
  };

  // Função para calcular o valor considerando se é compartilhado
  const calcularValorParaClaudenir = (lancamento: Lancamento): number => {
    if (lancamento.tipoLancamento === "compartilhado") {
      return lancamento.valor / 2;
    }
    return lancamento.valor;
  };

  // Função para recalcular o resumo considerando valores compartilhados
  const calcularResumoCompartilhado = (lancamentos: Lancamento[]): Resumo => {
    let receitas = 0;
    let despesas = 0;

    lancamentos.forEach((lancamento) => {
      const valorClaudenir = calcularValorParaClaudenir(lancamento);
      const tipoNormalizado = obterTipoNormalizado(lancamento);

      if (tipoNormalizado === "receita") {
        receitas += valorClaudenir;
      } else {
        despesas += valorClaudenir;
      }
    });

    return {
      receitas,
      despesas,
      saldo: receitas - despesas,
    };
  };

  const atualizarStatusPagamento = async (id: string, pago: boolean) => {
    try {
      setAtualizandoPagamento(id);

      const toastId = toast.loading(
        pago ? "Marcando como recebido/pago..." : "Marcando como pendente..."
      );

      // Buscar o lançamento completo com divisões
      const lancamentoCompleto = lancamentos.find((l) => l.id === id);

      if (!lancamentoCompleto) {
        throw new Error("Lançamento não encontrado");
      }

      const tipoNormalizado = obterTipoNormalizado(lancamentoCompleto);

      // Se for compartilhado, usar a API de pagamento compartilhado
      if (lancamentoCompleto.tipoLancamento === "compartilhado") {
        // Buscar a divisão específica do Claudenir
        const responseDivisoes = await fetch(
          `/api/lancamentos/compartilhado/${id}`
        );
        if (!responseDivisoes.ok) throw new Error("Erro ao buscar divisões");

        const dataDivisoes = await responseDivisoes.json();
        const divisaoClaudenir = dataDivisoes.divisoes.find((d: any) =>
          d.usuario.name.includes("Claudenir")
        );

        if (!divisaoClaudenir) {
          throw new Error("Divisão do Claudenir não encontrada");
        }

        if (pago) {
          // Pagar o valor pendente
          const valorPendente =
            divisaoClaudenir.valorDivisao - divisaoClaudenir.valorPago;
          await fetch("/api/lancamentos/compartilhado/pagamento", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              divisaoId: divisaoClaudenir.id,
              valorPago: valorPendente,
            }),
          });
        } else {
          // Reverter para pendente (zerar o pagamento)
          await fetch("/api/lancamentos/compartilhado/pagamento", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              divisaoId: divisaoClaudenir.id,
              valorPago: -divisaoClaudenir.valorPago, // Valor negativo para reverter
            }),
          });
        }
      } else {
        // Para lançamentos individuais, usar a API normal
        const response = await fetch(`/api/lancamentos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pago }),
        });

        if (!response.ok) {
          throw new Error("Erro ao atualizar status de pagamento");
        }
      }

      // Recarregar os dados para refletir as mudanças
      await buscarLancamentosClaudenir();

      toast.success(
        `Lançamento ${pago ? "confirmado" : "marcado como pendente"}`,
        {
          id: toastId,
          description: `O status foi atualizado com sucesso`,
          duration: 3000,
        }
      );
    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error);
      toast.error("Erro ao atualizar status", {
        description: "Não foi possível atualizar o status",
        duration: 5000,
      });
    } finally {
      setAtualizandoPagamento(null);
    }
  };

  // Adicione esta função para buscar as divisões de um lançamento compartilhado
  const buscarDivisoesLancamento = async (lancamentoId: string) => {
    try {
      const response = await fetch(
        `/api/lancamentos/compartilhado/${lancamentoId}`
      );
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error("Erro ao buscar divisões:", error);
      return null;
    }
  };

  // Função para verificar se o lançamento está pago considerando compartilhamento
  const verificarSeEstaPago = async (
    lancamento: Lancamento
  ): Promise<boolean> => {
    if (lancamento.tipoLancamento !== "compartilhado") {
      return lancamento.pago;
    }

    try {
      const dataDivisoes = await buscarDivisoesLancamento(lancamento.id);
      if (dataDivisoes && dataDivisoes.divisoes) {
        const divisaoClaudenir = dataDivisoes.divisoes.find((d: any) =>
          d.usuario.name.includes("Claudenir")
        );

        return divisaoClaudenir ? divisaoClaudenir.pago : lancamento.pago;
      }
    } catch (error) {
      console.error("Erro ao verificar status de pagamento:", error);
    }

    return lancamento.pago;
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
      const lancamentosAtualizados = lancamentos.filter(
        (lancamento) => lancamento.id !== id
      );
      setLancamentos(lancamentosAtualizados);

      // Recalcular resumo
      const novoResumo = calcularResumoCompartilhado(lancamentosAtualizados);
      setResumo(novoResumo);

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
      outros: "Outros",
      alimentacao: "Alimentação",
      transporte: "Transporte",
      moradia: "Moradia",
      saude: "Saúde",
      educacao: "Educação",
      lazer: "Lazer",
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
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold">Lançamentos - Claudenir</h1>
            <p className="text-muted-foreground">
              Gerencie todos os lançamentos do Claudenir em um só lugar
            </p>
          </div>
        </div>
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
            <Button
              variant="outline"
              size="sm"
              onClick={buscarLancamentosClaudenir}
            >
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
                  <SelectItem value="receita">Receitas</SelectItem>
                  <SelectItem value="despesa">Despesas</SelectItem>
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
                  <SelectItem value="moradia">Moradia</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
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
            <CardTitle className="text-lg text-green-800">
              Total Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-800">
              {formatarMoeda(resumo.receitas)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-red-800">
              Total Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-800">
              {formatarMoeda(resumo.despesas)}
            </p>
          </CardContent>
        </Card>
        <Card
          className={`bg-blue-50 border-blue-200 ${
            resumo.saldo >= 0 ? "text-blue-800" : "text-red-800"
          }`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Saldo Final</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatarMoeda(resumo.saldo)}</p>
            <p className="text-xs text-blue-600 mt-1">
              *Considerando valores compartilhados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Lançamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Lançamentos do Claudenir</CardTitle>
          <CardDescription>
            {lancamentosFiltrados.length} lançamento(s) encontrado(s)
            {lancamentosFiltrados.some(
              (l) => l.tipoLancamento === "compartilhado"
            ) && " • Valores compartilhados divididos por 2"}
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
              Nenhum lançamento encontrado para o Claudenir
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Data</TableHead>
                    <TableHead className="text-center">Tipo</TableHead>
                    <TableHead className="text-center">Descrição</TableHead>
                    <TableHead className="text-center">Categoria</TableHead>
                    <TableHead className="text-center">
                      Tipo Lançamento
                    </TableHead>
                    <TableHead className="text-center">
                      Valor (Claudenir)
                    </TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lancamentosFiltrados.map((lancamento) => {
                    const valorClaudenir =
                      calcularValorParaClaudenir(lancamento);
                    const ehCompartilhado =
                      lancamento.tipoLancamento === "compartilhado";
                    const tipoNormalizado = obterTipoNormalizado(lancamento);

                    return (
                      <TableRow key={lancamento.id}>
                        <TableCell className="text-center">
                          {formatarDataCorrigida(lancamento.data)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              tipoNormalizado === "receita"
                                ? "default"
                                : "destructive"
                            }
                            className={
                              tipoNormalizado === "receita"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : "bg-red-100 text-red-800 hover:bg-red-100"
                            }
                          >
                            {tipoNormalizado === "receita"
                              ? "Receita"
                              : "Despesa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {lancamento.descricao}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatarCategoria(lancamento.categoria)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {ehCompartilhado ? "Compartilhado" : "Individual"}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div
                            className={`font-medium ${
                              tipoNormalizado === "receita"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            <div>
                              {tipoNormalizado === "receita" ? "+ " : "- "}
                              {formatarMoeda(valorClaudenir)}
                            </div>
                            {ehCompartilhado && (
                              <div className="text-xs text-gray-500">
                                Total: {formatarMoeda(lancamento.valor)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {carregandoStatus ? (
                            <LoadingSpinner size="md" />
                          ) : (
                            <Badge
                              variant={
                                statusPagamento[lancamento.id]
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                statusPagamento[lancamento.id]
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                              }
                            >
                              {statusPagamento[lancamento.id]
                                ? tipoNormalizado === "receita"
                                  ? "Recebido"
                                  : "Pago"
                                : "Pendente"}
                            </Badge>
                          )}
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
                                disabled={
                                  atualizandoPagamento === lancamento.id
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {atualizandoPagamento === lancamento.id
                                  ? "Processando..."
                                  : tipoNormalizado === "receita"
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
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo por Categoria */}
      {(() => {
        const totaisCalculados =
          calcularTotaisPorCategoria(lancamentosFiltrados);

        return (
          totaisCalculados.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Resumo por Categoria</CardTitle>
                <CardDescription>
                  Distribuição dos lançamentos por categoria (valores já
                  consideram divisão de compartilhados)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {totaisCalculados.map((item, index) => {
                    const valorTotal = item._sum.valor || 0;
                    const tipoNormalizado = normalizarTipo(item.tipo);

                    return (
                      <div
                        key={`${item.categoria}-${item.tipo}-${index}`}
                        className={`p-4 rounded-lg text-center ${
                          tipoNormalizado === "receita"
                            ? "bg-green-50"
                            : "bg-red-50"
                        }`}
                      >
                        <p className="text-sm text-muted-foreground">
                          {formatarCategoria(item.categoria)} (
                          {tipoNormalizado === "receita"
                            ? "Receita"
                            : "Despesa"}
                          )
                        </p>
                        <p
                          className={`text-lg font-bold ${
                            tipoNormalizado === "receita"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatarMoeda(valorTotal)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )
        );
      })()}
    </div>
  );
}
