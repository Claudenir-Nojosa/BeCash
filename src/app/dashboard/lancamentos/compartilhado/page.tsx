// app/compartilhado/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  RefreshCw,
  TrendingUp,
  Users,
  ArrowLeftRight,
  Calculator,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Defina as interfaces
interface UsuarioSaldo {
  id: string;
  name: string;
  email: string;
}

interface Saldo {
  id: string;
  deUsuarioId: string;
  paraUsuarioId: string;
  valor: number;
  descricao?: string;
  pago: boolean;
  createdAt: string;
  updatedAt: string;
  deUsuario: UsuarioSaldo;
  paraUsuario: UsuarioSaldo;
}

interface Divisao {
  id: string;
  usuarioId: string;
  valorDivisao: number;
  valorPago: number;
  pago: boolean;
  usuario: UsuarioSaldo;
}

interface LancamentoCompartilhado {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  divisao: Divisao[];
}

interface ResumoCompartilhado {
  totalDividido: number;
  totalPago: number;
  totalPendente: number;
  saldoClaudenir: number;
  saldoBeatriz: number;
}

// Funções auxiliares
const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
};

const formatarCategoria = (categoria: string) => {
  const categorias: Record<string, string> = {
    alimentacao: "Alimentação",
    transporte: "Transporte",
    casa: "Casa",
    pessoal: "Pessoal",
    lazer: "Lazer",
    outros: "Outros",
  };
  return categorias[categoria] || categoria;
};

const CORES_GRAFICO = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#F9C80E",
  "#FF8E53",
  "#96CEB4",
  "#FD3A4A",
  "#C5E1A5",
  "#81D4FA",
  "#FFCC80",
  "#CE93D8",
  "#80CBC4",
];

export default function ControleCompartilhado() {
  const { data: session } = useSession();
  const [lancamentos, setLancamentos] = useState<LancamentoCompartilhado[]>([]);
  const [saldos, setSaldos] = useState<Saldo[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioSaldo[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pagamentoPersonalizado, setPagamentoPersonalizado] = useState<{
    [divisaoId: string]: number;
  }>({});

  // Estado para o novo lançamento
  const [novoLancamento, setNovoLancamento] = useState({
    descricao: "",
    valor: 0,
    categoria: "alimentacao",
    data: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    carregarDados();
  }, []);

  // Adicione esta função para lidar com pagamento personalizado
  const registrarPagamentoPersonalizado = async (divisaoId: string) => {
    try {
      const valor = pagamentoPersonalizado[divisaoId] || 0;

      if (valor <= 0) {
        toast.error("Digite um valor válido");
        return;
      }

      // Encontrar a divisão para validar o valor máximo
      const divisao = lancamentos
        .flatMap((l) => l.divisao)
        .find((d) => d.id === divisaoId);

      if (!divisao) {
        toast.error("Divisão não encontrada");
        return;
      }

      const valorMaximo = divisao.valorDivisao - divisao.valorPago;
      if (valor > valorMaximo) {
        toast.error(`Valor máximo permitido: ${formatarMoeda(valorMaximo)}`);
        return;
      }

      const response = await fetch("/api/lancamentos/compartilhado/pagamento", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          divisaoId,
          valorPago: valor,
        }),
      });

      if (response.ok) {
        toast.success("Pagamento registrado com sucesso!");
        // Limpar o valor do input
        setPagamentoPersonalizado((prev) => ({
          ...prev,
          [divisaoId]: 0,
        }));
        carregarDados();
      }
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      toast.error("Erro ao registrar pagamento");
    }
  };

  const carregarDados = async () => {
    try {
      const [lancamentosRes, usuariosRes] = await Promise.all([
        fetch("/api/lancamentos/compartilhado"),
        fetch("/api/usuarios"),
      ]);

      if (!lancamentosRes.ok) {
        throw new Error("Erro ao carregar dados");
      }

      const lancamentosData = await lancamentosRes.json();
      const usuariosData = usuariosRes.ok
        ? await usuariosRes.json()
        : { usuarios: [] };

      setLancamentos(lancamentosData.lancamentos || []);
      setUsuarios(usuariosData.usuarios || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  // Calcular resumo
  const calcularResumo = (): ResumoCompartilhado => {
    const totalDividido = lancamentos.reduce((sum, l) => sum + l.valor, 0);
    const totalPago = lancamentos.reduce(
      (sum, l) =>
        sum + l.divisao.reduce((divSum, d) => divSum + d.valorPago, 0),
      0
    );

    let saldoClaudenir = 0;
    let saldoBeatriz = 0;

    lancamentos.forEach((lancamento) => {
      lancamento.divisao.forEach((divisao) => {
        const diferenca = divisao.valorPago - divisao.valorDivisao;
        if (divisao.usuario.name.includes("Claudenir")) {
          saldoClaudenir += diferenca;
        } else if (divisao.usuario.name.includes("Beatriz")) {
          saldoBeatriz += diferenca;
        }
      });
    });

    return {
      totalDividido,
      totalPago,
      totalPendente: totalDividido - totalPago,
      saldoClaudenir,
      saldoBeatriz,
    };
  };

  const resumo = calcularResumo();

  // Preparar dados para gráficos
  const prepararDadosGraficos = () => {
    // Dados para gráfico de pizza - Distribuição por categoria
    const dadosPorCategoria = lancamentos.reduce((acc: any[], lancamento) => {
      const existing = acc.find((item) => item.name === lancamento.categoria);
      if (existing) {
        existing.value += lancamento.valor;
      } else {
        acc.push({
          name: formatarCategoria(lancamento.categoria),
          value: lancamento.valor,
        });
      }
      return acc;
    }, []);

    // Dados para gráfico de barras - Pagamentos vs Pendentes por pessoa
    const dadosPagamentos = usuarios.map((usuario) => {
      const totalDividido = lancamentos.reduce(
        (sum, l) =>
          sum +
          (l.divisao.find((d) => d.usuarioId === usuario.id)?.valorDivisao ||
            0),
        0
      );
      const totalPago = lancamentos.reduce(
        (sum, l) =>
          sum +
          (l.divisao.find((d) => d.usuarioId === usuario.id)?.valorPago || 0),
        0
      );

      return {
        nome: usuario.name,
        pago: totalPago,
        pendente: totalDividido - totalPago,
      };
    });

    return { dadosPorCategoria, dadosPagamentos };
  };

  const { dadosPorCategoria, dadosPagamentos } = prepararDadosGraficos();

  const criarLancamentoCompartilhado = async () => {
    try {
      // Dividir automaticamente entre os dois usuários
      const valorPorPessoa = novoLancamento.valor / 2;

      const response = await fetch("/api/lancamentos/compartilhado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...novoLancamento,
          divisao: usuarios.map((usuario) => ({
            usuarioId: usuario.id,
            valorDivisao: valorPorPessoa,
          })),
        }),
      });

      if (response.ok) {
        const novoLancamentoCriado = await response.json();
        setLancamentos([novoLancamentoCriado, ...lancamentos]);
        setNovoLancamento({
          descricao: "",
          valor: 0,
          categoria: "alimentacao",
          data: new Date().toISOString().split("T")[0],
        });
        setMostrarFormulario(false);
        toast.success("Despesa compartilhada criada com sucesso!");
        setTimeout(() => carregarDados(), 1000);
      }
    } catch (error) {
      console.error("Erro ao criar lançamento:", error);
      toast.error("Erro ao criar despesa compartilhada");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        Carregando...
      </div>
    );

  return (
    <div className="container mx-auto p-6 mt-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Controle Compartilhado</h1>
          <p className="text-muted-foreground">
            Acompanhe e gerencie as despesas divididas
          </p>
        </div>
        <div className="flex gap-2">
          {/* Botão para abrir o Dialog */}
          <Dialog open={mostrarFormulario} onOpenChange={setMostrarFormulario}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Despesa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Nova Despesa Compartilhada</DialogTitle>
                <DialogDescription>
                  A despesa será automaticamente dividida igualmente entre{" "}
                  {usuarios.length} pessoas
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={novoLancamento.descricao}
                    onChange={(e) =>
                      setNovoLancamento({
                        ...novoLancamento,
                        descricao: e.target.value,
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="Ex: Aluguel, Mercado, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Valor Total
                  </label>
                  <input
                    type="number"
                    value={novoLancamento.valor || ""}
                    onChange={(e) =>
                      setNovoLancamento({
                        ...novoLancamento,
                        valor: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="0,00"
                  />
                  {novoLancamento.valor > 0 && usuarios.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Cada um pagará:{" "}
                      {formatarMoeda(novoLancamento.valor / usuarios.length)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Categoria
                  </label>
                  <select
                    value={novoLancamento.categoria}
                    onChange={(e) =>
                      setNovoLancamento({
                        ...novoLancamento,
                        categoria: e.target.value,
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="alimentacao">Alimentação</option>
                    <option value="transporte">Transporte</option>
                    <option value="casa">Casa</option>
                    <option value="pessoal">Pessoal</option>
                    <option value="lazer">Lazer</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Data</label>
                  <input
                    type="date"
                    value={novoLancamento.data}
                    onChange={(e) =>
                      setNovoLancamento({
                        ...novoLancamento,
                        data: e.target.value,
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={criarLancamentoCompartilhado}
                  disabled={
                    !novoLancamento.descricao || novoLancamento.valor <= 0
                  }
                  className="flex-1"
                >
                  Criar Despesa Compartilhada
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setMostrarFormulario(false)}
                >
                  Cancelar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Dividido
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatarMoeda(resumo.totalDividido)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatarMoeda(resumo.totalPago)}
            </div>
            <Progress
              value={(resumo.totalPago / resumo.totalDividido) * 100}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo Claudenir
            </CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${resumo.saldoClaudenir >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatarMoeda(resumo.saldoClaudenir)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Beatriz</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${resumo.saldoBeatriz >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatarMoeda(resumo.saldoBeatriz)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Gráfico de Pizza - Distribuição por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={dadosPorCategoria}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dadosPorCategoria.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CORES_GRAFICO[index % CORES_GRAFICO.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatarMoeda(Number(value))}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Pagamentos por Pessoa */}
        <Card>
          <CardHeader>
            <CardTitle>Pagamentos por Pessoa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosPagamentos}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis tickFormatter={(value) => `R$ ${value}`} />
                  <Tooltip
                    formatter={(value) => formatarMoeda(Number(value))}
                  />
                  <Legend />
                  <Bar dataKey="pago" fill="#4CAF50" name="Pago" />
                  <Bar dataKey="pendente" fill="#FF9800" name="Pendente" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Lista de Despesas Compartilhadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Despesas Compartilhadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lancamentos.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma despesa compartilhada
            </p>
          ) : (
            <div className="space-y-6">
              {lancamentos.map((lancamento) => (
                <div key={lancamento.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {lancamento.descricao}
                      </h3>
                      <p className="text-muted-foreground">
                        {new Date(lancamento.data).toLocaleDateString()} •
                        {formatarMoeda(lancamento.valor)} •{" "}
                        {formatarCategoria(lancamento.categoria)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Total</div>
                      <div className="font-bold">
                        {formatarMoeda(lancamento.valor)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatarMoeda(lancamento.valor / 2)} cada
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lancamento.divisao.map((divisao) => (
                      <div key={divisao.id} className="border rounded p-4">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-medium text-lg">
                            {divisao.usuario.name}
                          </span>
                          <span
                            className={
                              divisao.valorPago >= divisao.valorDivisao
                                ? "text-green-600 font-bold"
                                : "text-yellow-600 font-bold"
                            }
                          >
                            {formatarMoeda(divisao.valorPago)} /{" "}
                            {formatarMoeda(divisao.valorDivisao)}
                          </span>
                        </div>

                        <Progress
                          value={
                            (divisao.valorPago / divisao.valorDivisao) * 100
                          }
                          className="mb-3"
                        />

                        {/* Nova seção de pagamento personalizado */}
                        <div className="space-y-3">
                          {/* Input para pagamento personalizado */}
                          {/* Input para pagamento personalizado */}
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <input
                                type="number"
                                value={pagamentoPersonalizado[divisao.id] || ""}
                                onChange={(e) =>
                                  setPagamentoPersonalizado((prev) => ({
                                    ...prev,
                                    [divisao.id]:
                                      parseFloat(e.target.value) || 0,
                                  }))
                                }
                                placeholder="Digite o valor"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <Button
                              onClick={() =>
                                registrarPagamentoPersonalizado(divisao.id)
                              }
                              disabled={
                                divisao.valorPago >= divisao.valorDivisao ||
                                !pagamentoPersonalizado[divisao.id] ||
                                pagamentoPersonalizado[divisao.id] <= 0
                              }
                              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                              size="sm"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Pagar
                            </Button>
                          </div>

                          {/* Botão para quitar o valor pendente */}
                          <Button
                            onClick={() => {
                              const valorPendente =
                                divisao.valorDivisao - divisao.valorPago;
                              setPagamentoPersonalizado((prev) => ({
                                ...prev,
                                [divisao.id]: valorPendente,
                              }));
                            }}
                            disabled={divisao.valorPago >= divisao.valorDivisao}
                            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
                            size="sm"
                          >
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Quitar (
                            {formatarMoeda(
                              divisao.valorDivisao - divisao.valorPago
                            )}
                            )
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
