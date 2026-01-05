// app/dashboard/limites/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
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
  ChevronRight,
  ChevronLeft,
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
  const { t, i18n } = useTranslation("limites");
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

  // MESES localizados
  const MESES =
    i18n.language === "pt"
      ? [
          { value: "0", label: t("meses.janeiro") },
          { value: "1", label: t("meses.fevereiro") },
          { value: "2", label: t("meses.marco") },
          { value: "3", label: t("meses.abril") },
          { value: "4", label: t("meses.maio") },
          { value: "5", label: t("meses.junho") },
          { value: "6", label: t("meses.julho") },
          { value: "7", label: t("meses.agosto") },
          { value: "8", label: t("meses.setembro") },
          { value: "9", label: t("meses.outubro") },
          { value: "10", label: t("meses.novembro") },
          { value: "11", label: t("meses.dezembro") },
        ]
      : [
          { value: "0", label: t("meses.janeiro") },
          { value: "1", label: t("meses.fevereiro") },
          { value: "2", label: t("meses.marco") },
          { value: "3", label: t("meses.abril") },
          { value: "4", label: t("meses.maio") },
          { value: "5", label: t("meses.junho") },
          { value: "6", label: t("meses.julho") },
          { value: "7", label: t("meses.agosto") },
          { value: "8", label: t("meses.setembro") },
          { value: "9", label: t("meses.outubro") },
          { value: "10", label: t("meses.novembro") },
          { value: "11", label: t("meses.dezembro") },
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
        throw new Error(t("mensagens.erroCarregarDados"));
      }

      const [limitesData, categoriasData] = await Promise.all([
        limitesRes.json(),
        categoriasRes.json(),
      ]);

      setLimites(limitesData);
      setCategorias(categoriasData);
    } catch (error) {
      console.error(t("mensagens.erroCarregarDados"), error);
      toast.error(t("mensagens.erroCarregarLimites"));
    } finally {
      setCarregando(false);
    }
  };

  const salvarLimite = async (categoriaId: string) => {
    if (!novoLimite || parseFloat(novoLimite) <= 0) {
      toast.error(t("validacao.valorInvalido"));
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
        throw new Error(error.error || t("mensagens.erroSalvarLimite"));
      }

      const limiteSalvo = await response.json();

      setLimites((prev) => [...prev, limiteSalvo]);

      toast.success(t("mensagens.limiteDefinidoSucesso"));
      setEditando(null);
      setNovoLimite("");
    } catch (error) {
      console.error(t("mensagens.erroSalvarLimite"), error);
      toast.error(t("mensagens.erroSalvarLimite"));
      carregarDados();
    } finally {
      setSalvando(null);
    }
  };

  const ajustarLimite = async (limiteId: string, novoValor: number) => {
    if (!novoValor || novoValor <= 0) {
      toast.error(t("validacao.valorInvalido"));
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
        throw new Error(error.error || t("mensagens.erroAjustarLimite"));
      }

      const limiteAtualizado = await response.json();

      setLimites((prev) =>
        prev.map((limite) =>
          limite.id === limiteId ? limiteAtualizado : limite
        )
      );

      toast.success(t("mensagens.limiteAjustadoSucesso"));
      setEditando(null);
      setNovoLimite("");
    } catch (error) {
      console.error(t("mensagens.erroAjustarLimite"), error);
      toast.error(t("mensagens.erroAjustarLimite"));
      carregarDados();
    } finally {
      setSalvando(null);
    }
  };

  const excluirLimite = async (limiteId: string) => {
    setExcluindoLimite(limiteId);

    const limiteParaExcluir = limites.find((limite) => limite.id === limiteId);

    try {
      setDialogExclusaoAberto(null);
      setLimites((prev) => prev.filter((limite) => limite.id !== limiteId));

      const response = await fetch(`/api/dashboard/limites/${limiteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t("mensagens.erroExcluirLimite"));
      }

      toast.success(t("mensagens.limiteExcluidoSucesso"));
    } catch (error) {
      console.error(t("mensagens.erroExcluirLimite"), error);
      toast.error(t("mensagens.erroExcluirLimite"));

      if (limiteParaExcluir) {
        setLimites((prev) => [...prev, limiteParaExcluir]);
      }
    } finally {
      setExcluindoLimite(null);
    }
  };

  const formatarMoeda = (valor: number) => {
    const locale = i18n.language === "pt" ? "pt-BR" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const obterStatusLimite = (limite: LimiteCategoria) => {
    const percentual = (limite.gastoAtual / limite.limiteMensal) * 100;

    if (percentual > 100) {
      return {
        texto: t("status.estourado"),
        cor: "text-red-400",
        bgCor: "bg-red-900/50",
        borderCor: "border-red-700",
        icone: <AlertTriangle className="h-4 w-4" />,
      };
    }

    if (percentual > 80) {
      return {
        texto: t("status.proximoLimite"),
        cor: "text-yellow-400",
        bgCor: "bg-yellow-900/50",
        borderCor: "border-yellow-700",
        icone: <Clock className="h-4 w-4" />,
      };
    }

    return {
      texto: t("status.dentroLimite"),
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
    const mesesAbreviados =
      i18n.language === "pt"
        ? [
            t("mesesAbreviados.jan"),
            t("mesesAbreviados.fev"),
            t("mesesAbreviados.mar"),
            t("mesesAbreviados.abr"),
            t("mesesAbreviados.mai"),
            t("mesesAbreviados.jun"),
            t("mesesAbreviados.jul"),
            t("mesesAbreviados.ago"),
            t("mesesAbreviados.set"),
            t("mesesAbreviados.out"),
            t("mesesAbreviados.nov"),
            t("mesesAbreviados.dez"),
          ]
        : [
            t("mesesAbreviados.jan"),
            t("mesesAbreviados.fev"),
            t("mesesAbreviados.mar"),
            t("mesesAbreviados.abr"),
            t("mesesAbreviados.mai"),
            t("mesesAbreviados.jun"),
            t("mesesAbreviados.jul"),
            t("mesesAbreviados.ago"),
            t("mesesAbreviados.set"),
            t("mesesAbreviados.out"),
            t("mesesAbreviados.nov"),
            t("mesesAbreviados.dez"),
          ];
    return mesesAbreviados[Number(mes)] || t("mesesAbreviados.mes");
  };

  // Loading em tela cheia
  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-white dark:bg-transparent">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {t("titulos.limites")}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {t("subtitulos.controleGastos")}
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            {/* Seletor de Mês no Header */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg px-3 py-2 shadow-sm">
                {/* Seta esquerda */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    let novoMes = parseInt(mesSelecionado) - 1;
                    let novoAno = parseInt(anoSelecionado);
                    if (novoMes < 0) {
                      novoMes = 11;
                      novoAno = novoAno - 1;
                    }
                    setMesSelecionado(novoMes.toString());
                    setAnoSelecionado(novoAno.toString());
                  }}
                  className="h-7 w-7 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>

                {/* Mês atual */}
                <div className="text-center min-w-20">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
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
                    if (novoMes > 11) {
                      novoMes = 0;
                      novoAno = novoAno + 1;
                    }
                    setMesSelecionado(novoMes.toString());
                    setAnoSelecionado(novoAno.toString());
                  }}
                  className="h-7 w-7 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Limites Existentes */}
        <div className="grid gap-4">
          {limites.length === 0 ? (
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {t("mensagens.nenhumLimiteDefinido")}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                  {t("mensagens.iniciarLimites")}
                </p>
                <Button
                  onClick={() => {
                    const primeiraCategoria = categoriasSemLimite[0];
                    if (primeiraCategoria) {
                      setEditando(primeiraCategoria.id);
                      setNovoLimite("");
                    }
                  }}
                  className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("botoes.criarPrimeiroLimite")}
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
                <Card
                  key={limite.id}
                  className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: limite.categoria.cor }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate">
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
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                              <span>{formatarMoeda(limite.gastoAtual)}</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {percentual.toFixed(0)}%
                              </span>
                              <span>{formatarMoeda(limite.limiteMensal)}</span>
                            </div>
                          </div>

                          {/* Informações adicionais */}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>
                              {t("limites.gasto")}:{" "}
                              <span className="text-gray-900 dark:text-white">
                                {formatarMoeda(limite.gastoAtual)}
                              </span>
                            </span>
                            <span>
                              {t("limites.limite")}:{" "}
                              <span className="text-gray-900 dark:text-white">
                                {formatarMoeda(limite.limiteMensal)}
                              </span>
                            </span>
                            <span>
                              {t("limites.restante")}:{" "}
                              <span className="text-gray-900 dark:text-white">
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
                            className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white shadow-lg"
                          onInteractOutside={() => setDropdownAberto(null)}
                          onEscapeKeyDown={() => setDropdownAberto(null)}
                        >
                          <DropdownMenuItem
                            onClick={() => {
                              setEditando(limite.id);
                              setNovoLimite(limite.limiteMensal.toString());
                              setDropdownAberto(null);
                            }}
                            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            <Edit className="h-4 w-4" />
                            {t("menu.ajustarLimite")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setDialogExclusaoAberto(limite.id);
                              setDropdownAberto(null);
                            }}
                            className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                            {t("menu.excluirLimite")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Modal de edição inline */}
                    {editando === limite.id && (
                      <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <Label
                              htmlFor="ajuste-limite"
                              className="text-gray-700 dark:text-white text-sm mb-2 block"
                            >
                              {t("formularios.novoValorLimite")}
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                {i18n.language === "pt" ? "R$" : "$"}
                              </span>
                              <Input
                                id="ajuste-limite"
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0,00"
                                value={novoLimite}
                                onChange={(e) => setNovoLimite(e.target.value)}
                                className="pl-8 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
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
                              disabled={salvando === limite.id}
                              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-green-600 dark:hover:bg-green-700 text-white border-emerald-600 dark:border-green-600"
                            >
                              {salvando === limite.id
                                ? t("botoes.salvando")
                                : t("botoes.salvar")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditando(null)}
                              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              {t("botoes.cancelar")}
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

        {/* Seção para adicionar novos limites */}
        {categoriasSemLimite.length > 0 && (
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                {t("titulos.adicionarNovoLimite")}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {t("subtitulos.selecioneCategoria")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoriasSemLimite.map((categoria) => (
                  <div
                    key={categoria.id}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-700 transition-colors bg-gray-50/50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: categoria.cor }}
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {categoria.nome}
                      </span>
                    </div>

                    {editando === categoria.id ? (
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                            {i18n.language === "pt" ? "R$" : "$"}
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0,00"
                            value={novoLimite}
                            onChange={(e) => setNovoLimite(e.target.value)}
                            className="w-32 pl-8 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => salvarLimite(categoria.id)}
                          disabled={salvando === categoria.id}
                          className="bg-emerald-600 hover:bg-emerald-700 dark:bg-green-600 dark:hover:bg-green-700 text-white border-emerald-600 dark:border-green-600"
                        >
                          {salvando === categoria.id
                            ? t("botoes.salvando")
                            : t("botoes.salvar")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditando(null)}
                          className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          {t("botoes.cancelar")}
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
                        className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        {t("botoes.definirLimite")}
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
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {t("dialogs.excluirLimiteTitulo")}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {t("dialogs.excluirLimiteDescricao")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setDialogExclusaoAberto(null)}
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {t("botoes.cancelar")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => excluirLimite(dialogExclusaoAberto!)}
              disabled={!!excluindoLimite}
            >
              {excluindoLimite ? t("botoes.excluindo") : t("botoes.confirmar")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
