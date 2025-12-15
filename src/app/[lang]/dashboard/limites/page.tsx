// app/dashboard/limites/page.tsx
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  Plus,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import { LimiteCategoria } from "../../../../../types/dashboard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loading } from "@/components/ui/loading-barrinhas";

interface Categoria {
  id: string;
  nome: string;
  tipo: string;
  cor: string;
  icone: string;
}

export default function LimitesPage() {
  const router = useRouter();
  const [limites, setLimites] = useState<LimiteCategoria[]>([]);
  const [dropdownAberto, setDropdownAberto] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<string | null>(null);
  const [novoLimite, setNovoLimite] = useState("");
  const [salvando, setSalvando] = useState<string | null>(null);
  const [excluindoLimite, setExcluindoLimite] = useState<string | null>(null);
  const [dialogExclusaoAberto, setDialogExclusaoAberto] = useState<
    string | null
  >(null);
  const [mesSelecionado, setMesSelecionado] = useState(
    new Date().getMonth().toString()
  );
  const [anoSelecionado, setAnoSelecionado] = useState<string>(
    new Date().getFullYear().toString()
  );
  const MESES = [
    { value: "1", label: "Janeiro" },
    { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Maio" },
    { value: "6", label: "Junho" },
    { value: "7", label: "Julho" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [limitesRes, categoriasRes] = await Promise.all([
        fetch("/api/dashboard/limites"),
        fetch("/api/categorias?tipo=DESPESA"),
      ]);

      if (!limitesRes.ok || !categoriasRes.ok) {
        throw new Error("Erro ao carregar dados");
      }

      const [limitesData, categoriasData] = await Promise.all([
        limitesRes.json(),
        categoriasRes.json(),
      ]);

      setLimites(limitesData);
      setCategorias(categoriasData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar limites e categorias");
    } finally {
      setCarregando(false);
    }
  };

  const salvarLimite = async (categoriaId: string) => {
    if (!novoLimite || parseFloat(novoLimite) <= 0) {
      toast.error("Digite um valor válido");
      return;
    }

    setSalvando(categoriaId);

    try {
      const response = await fetch("/api/dashboard/limites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoriaId,
          limiteMensal: parseFloat(novoLimite),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar limite");
      }

      const limiteSalvo = await response.json();

      // Adiciona o novo limite à lista sem recarregar
      setLimites((prev) => [...prev, limiteSalvo]);

      toast.success("Limite definido com sucesso");
      setEditando(null);
      setNovoLimite("");
    } catch (error) {
      console.error("Erro ao salvar limite:", error);
      toast.error("Erro ao salvar limite");
      // Em caso de erro, recarrega os dados
      carregarDados();
    } finally {
      setSalvando(null);
    }
  };

  const ajustarLimite = async (limiteId: string, novoValor: number) => {
    if (!novoValor || novoValor <= 0) {
      toast.error("Digite um valor válido");
      return;
    }

    setSalvando(limiteId);

    try {
      const response = await fetch(`/api/dashboard/limites/${limiteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limiteMensal: novoValor,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao ajustar limite");
      }

      const limiteAtualizado = await response.json();

      // Atualiza o limite na lista sem recarregar
      setLimites((prev) =>
        prev.map((limite) =>
          limite.id === limiteId ? limiteAtualizado : limite
        )
      );

      toast.success("Limite ajustado com sucesso");
      setEditando(null);
      setNovoLimite("");
    } catch (error) {
      console.error("Erro ao ajustar limite:", error);
      toast.error("Erro ao ajustar limite");
      // Em caso de erro, recarrega os dados
      carregarDados();
    } finally {
      setSalvando(null);
    }
  };

  const excluirLimite = async (limiteId: string) => {
    setExcluindoLimite(limiteId);

    const limiteParaExcluir = limites.find((limite) => limite.id === limiteId);

    try {
      // Fecha o dialog primeiro
      setDialogExclusaoAberto(null);

      // Remove da lista
      setLimites((prev) => prev.filter((limite) => limite.id !== limiteId));

      const response = await fetch(`/api/dashboard/limites/${limiteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao excluir limite");
      }

      toast.success("Limite excluído com sucesso");
    } catch (error) {
      console.error("Erro ao excluir limite:", error);
      toast.error("Erro ao excluir limite");

      // Reverte se der erro
      if (limiteParaExcluir) {
        setLimites((prev) => [...prev, limiteParaExcluir]);
      }
    } finally {
      setExcluindoLimite(null);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const obterStatusLimite = (limite: LimiteCategoria) => {
    const percentual = (limite.gastoAtual / limite.limiteMensal) * 100;

    if (percentual > 100) {
      return {
        texto: "Estourado",
        cor: "text-red-400",
        bgCor: "bg-red-900/50",
        borderCor: "border-red-700",
        icone: <AlertTriangle className="h-4 w-4" />,
      };
    }

    if (percentual > 80) {
      return {
        texto: "Próximo do limite",
        cor: "text-yellow-400",
        bgCor: "bg-yellow-900/50",
        borderCor: "border-yellow-700",
        icone: <Clock className="h-4 w-4" />,
      };
    }

    return {
      texto: "Dentro do limite",
      cor: "text-green-400",
      bgCor: "bg-green-900/50",
      borderCor: "border-green-700",
      icone: <CheckCircle2 className="h-4 w-4" />,
    };
  };

  const categoriasSemLimite = categorias.filter(
    (cat) => !limites.some((limite) => limite.categoriaId === cat.id)
  );

  const obterNomeMesAbreviado = (mes: string) => {
    const mesesAbreviados = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    return mesesAbreviados[Number(mes) - 1] || "Mês";
  };

  console.log("Estado editando:", editando);
  console.log("Estado dialogExclusaoAberto:", dialogExclusaoAberto);

  // 🔥 AQUI ESTÁ A MUDANÇA PRINCIPAL: Loading em tela cheia
  if (carregando) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-white">Limites</h1>
              <p className="text-gray-300">
                Controle seus gastos por categoria
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            {/* Seletor de Mês no Header */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
                {/* Seta esquerda */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    let novoMes = parseInt(mesSelecionado) - 1;
                    let novoAno = parseInt(anoSelecionado);
                    if (novoMes < 1) {
                      novoMes = 12;
                      novoAno = novoAno - 1;
                    }
                    setMesSelecionado(novoMes.toString());
                    setAnoSelecionado(novoAno.toString());
                  }}
                  className="h-7 w-7 text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </Button>

                {/* Mês atual */}
                <div className="text-center min-w-20">
                  <p className="text-sm font-medium text-white">
                    {obterNomeMesAbreviado(mesSelecionado)}/{anoSelecionado}
                  </p>
                </div>

                {/* Seta direita */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    let novoMes = parseInt(mesSelecionado) + 1;
                    let novoAno = parseInt(anoSelecionado);
                    if (novoMes > 12) {
                      novoMes = 1;
                      novoAno = novoAno + 1;
                    }
                    setMesSelecionado(novoMes.toString());
                    setAnoSelecionado(novoAno.toString());
                  }}
                  className="h-7 w-7 text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Limites Existentes */}
        <div className="grid gap-4">
          {limites.length === 0 ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-16 w-16 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Nenhum limite definido
                </h3>
                <p className="text-gray-400 text-center mb-6">
                  Comece definindo limites para suas categorias de despesas
                </p>
                <Button
                  onClick={() => {
                    const primeiraCategoria = categoriasSemLimite[0];
                    if (primeiraCategoria) {
                      setEditando(primeiraCategoria.id);
                      setNovoLimite("");
                    }
                  }}
                  className="bg-white text-gray-900 hover:bg-gray-100"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Limite
                </Button>
              </CardContent>
            </Card>
          ) : (
            limites.map((limite) => {
              const percentual =
                (limite.gastoAtual / limite.limiteMensal) * 100;
              const status = obterStatusLimite(limite);
              const valorSlider = Math.min(percentual, 100);

              return (
                <Card key={limite.id} className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: limite.categoria.cor }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-semibold text-white text-lg truncate">
                              {limite.categoria.nome}
                            </h3>
                            <Badge
                              variant="outline"
                              className={`${status.bgCor} ${status.cor} ${status.borderCor}`}
                            >
                              <div className="flex items-center gap-1">
                                {status.icone}
                                {status.texto}
                              </div>
                            </Badge>
                          </div>

                          {/* Slider */}
                          <div className="space-y-2 mb-4">
                            <Slider
                              value={[valorSlider]}
                              max={100}
                              step={1}
                              className="w-full"
                              disabled
                            />
                            <div className="flex justify-between text-sm text-gray-400">
                              <span>{formatarMoeda(limite.gastoAtual)}</span>
                              <span className="font-medium text-white">
                                {percentual.toFixed(0)}%
                              </span>
                              <span>{formatarMoeda(limite.limiteMensal)}</span>
                            </div>
                          </div>

                          {/* Informações adicionais */}
                          <div className="flex gap-4 text-sm text-gray-400">
                            <span>
                              Gasto:{" "}
                              <span className="text-white">
                                {formatarMoeda(limite.gastoAtual)}
                              </span>
                            </span>
                            <span>
                              Limite:{" "}
                              <span className="text-white">
                                {formatarMoeda(limite.limiteMensal)}
                              </span>
                            </span>
                            <span>
                              Restante:{" "}
                              <span className="text-white">
                                {formatarMoeda(
                                  limite.limiteMensal - limite.gastoAtual
                                )}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Menu de três pontos */}
                      <DropdownMenu
                        open={dropdownAberto === limite.id}
                        onOpenChange={(open) => {
                          if (!open) {
                            setDropdownAberto(null);
                          }
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDropdownAberto(limite.id)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-gray-800 border-gray-700 text-white"
                          onInteractOutside={() => setDropdownAberto(null)}
                          onEscapeKeyDown={() => setDropdownAberto(null)}
                        >
                          <DropdownMenuItem
                            onClick={() => {
                              setEditando(limite.id);
                              setNovoLimite(limite.limiteMensal.toString());
                              setDropdownAberto(null); // 👈 FECHA O DROPDOWN
                            }}
                            className="flex items-center gap-2 hover:bg-gray-700 cursor-pointer"
                          >
                            <Edit className="h-4 w-4" />
                            Ajustar Limite
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setDialogExclusaoAberto(limite.id);
                              setDropdownAberto(null); // 👈 FECHA O DROPDOWN
                            }}
                            className="flex items-center gap-2 text-red-400 hover:bg-red-950 hover:text-red-300 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir Limite
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Modal de edição inline */}
                    {editando === limite.id && (
                      <div className="mt-4 p-4 border border-gray-700 rounded-lg bg-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <Label
                              htmlFor="ajuste-limite"
                              className="text-white text-sm mb-2 block"
                            >
                              Novo valor do limite
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                R$
                              </span>
                              <Input
                                id="ajuste-limite"
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0,00"
                                value={novoLimite}
                                onChange={(e) => setNovoLimite(e.target.value)}
                                className="pl-8 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-6">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                ajustarLimite(limite.id, parseFloat(novoLimite))
                              }
                              disabled={salvando === limite.id} // 👈 ADICIONE ESTA LINHA
                              className="bg-green-100 text-gray-900 hover:bg-green-100 hover:text-gray-600"
                            >
                              {salvando === limite.id
                                ? "Salvando..."
                                : "Salvar"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditando(null)}
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Seção para adicionar novos limites (apenas se houver categorias sem limite) */}
        {categoriasSemLimite.length > 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">
                Adicionar Novo Limite
              </CardTitle>
              <CardDescription className="text-gray-400">
                Selecione uma categoria para definir um limite mensal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoriasSemLimite.map((categoria) => (
                  <div
                    key={categoria.id}
                    className="flex items-center justify-between p-3 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: categoria.cor }}
                      />
                      <span className="font-medium text-white">
                        {categoria.nome}
                      </span>
                    </div>

                    {editando === categoria.id ? (
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            R$
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0,00"
                            value={novoLimite}
                            onChange={(e) => setNovoLimite(e.target.value)}
                            className="w-32 pl-8 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => salvarLimite(categoria.id)}
                          disabled={salvando === categoria.id} // 👈 ADICIONE ESTA LINHA
                          className="bg-green-100 text-gray-900 hover:bg-green-100 hover:text-gray-600"
                        >
                          {salvando === categoria.id ? "Salvando..." : "Salvar"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditando(null)}
                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditando(categoria.id);
                          setNovoLimite("");
                        }}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        Definir Limite
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      {/* Dialog de Confirmação de Exclusão */}
      <Dialog
        open={!!dialogExclusaoAberto}
        onOpenChange={(open) => {
          if (!open) {
            setDialogExclusaoAberto(null);
          }
        }}
      >
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Excluir Limite</DialogTitle>
            <DialogDescription className="text-gray-400">
              Tem certeza que deseja excluir o limite desta categoria? Esta ação
              não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setDialogExclusaoAberto(null)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => excluirLimite(dialogExclusaoAberto!)}
              disabled={!!excluindoLimite} // 👈 ADICIONE ESTA LINHA
            >
              {excluindoLimite ? "Excluindo..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
