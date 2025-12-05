"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Target,
  TrendingUp,
  Calendar,
  Coins,
  ArrowLeft,
  Edit3,
  Trash2,
  Brain,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MetaPontos {
  id: string;
  programa: string;
  metaPontos: number;
  descricao: string | null;
  dataAlvo: Date;
}

interface Projecao {
  diasRestantes: number;
  pontosRestantes: number;
  pontosNecessariosPorDia: number;
  dataProjecao: Date | null;
  mensagem: string;
}

export default function MetasPontosPage() {
  const router = useRouter();
  const [metas, setMetas] = useState<MetaPontos[]>([]);
  const [pontosAtuais, setPontosAtuais] = useState<{ [key: string]: number }>(
    {}
  );
  const [projecoes, setProjecoes] = useState<{ [key: string]: Projecao }>({});
  const [carregando, setCarregando] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [dialogAberto, setDialogAberto] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [analisando, setAnalisando] = useState<string | null>(null);
  const [analise, setAnalise] = useState<{ [key: string]: string }>({});
  const [enviando, setEnviando] = useState(false);
  const [editandoMeta, setEditandoMeta] = useState<MetaPontos | null>(null);

  const [formData, setFormData] = useState({
    programa: "LIVELO",
    metaPontos: "",
    descricao: "",
    dataAlvo: "",
  });

  useEffect(() => {
    carregarMetasEDados();
  }, []);

  const carregarMetasEDados = async () => {
    try {
      setCarregando(true);

      // Carregar metas
      const responseMetas = await fetch("/api/pontos/metas");
      if (!responseMetas.ok) throw new Error("Erro ao carregar metas");
      const metasData = await responseMetas.json();
      setMetas(metasData);

      // Carregar pontos atuais
      const responsePontos = await fetch(
        "/api/pontos?mes=1&ano=2024&programa=todos&tipo=todos"
      );
      if (!responsePontos.ok) throw new Error("Erro ao carregar pontos");
      const pontosData = await responsePontos.json();

      const pontosPorPrograma: { [key: string]: number } = {};
      metasData.forEach((meta: MetaPontos) => {
        pontosPorPrograma[meta.programa] = pontosData.resumo.totalPontos;
      });

      setPontosAtuais(pontosPorPrograma);
      calcularProjecoes(metasData, pontosPorPrograma);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar metas e pontos");
    } finally {
      setCarregando(false);
    }
  };

  const calcularProjecoes = (
    metas: MetaPontos[],
    pontosAtuais: { [key: string]: number }
  ) => {
    const projecoesCalc: { [key: string]: Projecao } = {};

    metas.forEach((meta) => {
      const pontosAtuaisPrograma = pontosAtuais[meta.programa] || 0;
      const pontosRestantes = Math.max(
        0,
        meta.metaPontos - pontosAtuaisPrograma
      );
      const diasRestantes = Math.max(
        0,
        differenceInDays(new Date(meta.dataAlvo), new Date())
      );

      let pontosNecessariosPorDia = 0;
      let dataProjecao: Date | null = null;
      let mensagem = "";

      if (pontosRestantes > 0 && diasRestantes > 0) {
        pontosNecessariosPorDia = pontosRestantes / diasRestantes;

        // Calcular data de projeção baseada no ritmo atual
        const ritmoAtual = calcularRitmoAtual(meta.programa);
        if (ritmoAtual > 0) {
          const diasNecessarios = pontosRestantes / ritmoAtual;
          dataProjecao = addDays(new Date(), diasNecessarios);

          if (diasNecessarios <= diasRestantes) {
            mensagem = `No seu ritmo atual, você atingirá a meta em ${format(dataProjecao, "dd/MM/yyyy")}`;
          } else {
            mensagem = `No seu ritmo atual, você precisará de ${Math.ceil(diasNecessarios - diasRestantes)} dias a mais`;
          }
        } else {
          mensagem = "Aumente seu ritmo de ganho de pontos para atingir a meta";
        }
      } else if (pontosRestantes <= 0) {
        mensagem = "Parabéns! Você já atingiu sua meta! 🎉";
      } else {
        mensagem = "Meta expirada";
      }

      projecoesCalc[meta.id] = {
        diasRestantes,
        pontosRestantes,
        pontosNecessariosPorDia,
        dataProjecao,
        mensagem,
      };
    });

    setProjecoes(projecoesCalc);
  };

  const calcularRitmoAtual = (programa: string): number => {
    return 100; // 100 pontos por dia em média
  };

  const iniciarEdicao = (meta: MetaPontos) => {
    setEditandoMeta(meta);
    setFormData({
      programa: meta.programa,
      metaPontos: meta.metaPontos.toString(),
      descricao: meta.descricao || "",
      dataAlvo: format(new Date(meta.dataAlvo), "yyyy-MM-dd"),
    });
    setIsSheetOpen(true);
  };

  const cancelarEdicao = () => {
    setEditandoMeta(null);
    setFormData({
      programa: "LIVELO",
      metaPontos: "",
      descricao: "",
      dataAlvo: "",
    });
    setIsSheetOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    try {
      const url = editandoMeta
        ? `/api/pontos/metas/${editandoMeta.id}`
        : "/api/pontos/metas";

      const method = editandoMeta ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          metaPontos: parseInt(formData.metaPontos),
        }),
      });

      if (!response.ok) throw new Error("Erro ao salvar meta");

      const metaSalva = await response.json();

      if (editandoMeta) {
        // Atualização otimista
        setMetas((prev) =>
          prev.map((meta) => (meta.id === editandoMeta.id ? metaSalva : meta))
        );
        toast.success("Meta atualizada com sucesso!");
      } else {
        // Criação otimista
        setMetas((prev) => [...prev, metaSalva]);
        toast.success("Meta salva com sucesso!");
      }

      cancelarEdicao();

      // Recarregar dados para atualizar projeções
      carregarMetasEDados();
    } catch (error) {
      toast.error("Erro ao salvar meta");
      console.error(error);
    } finally {
      setEnviando(false);
    }
  };

  const handleDelete = async (id: string) => {
    setExcluindo(id);

    const metaParaExcluir = metas.find((meta) => meta.id === id);

    try {
      // Exclusão otimista
      setMetas((prev) => prev.filter((meta) => meta.id !== id));
      setDialogAberto(null);

      const res = await fetch(`/api/pontos/metas/${id}`, { method: "DELETE" });

      if (!res.ok) {
        throw new Error("Erro ao deletar meta");
      }

      toast.success("Meta deletada com sucesso!");
    } catch (error) {
      console.error("Erro ao deletar meta:", error);

      // Revert se der erro
      if (metaParaExcluir) {
        setMetas((prev) => [...prev, metaParaExcluir]);
      }

      toast.error("Erro ao deletar meta.");
    } finally {
      setExcluindo(null);
    }
  };

  const programas = [
    { value: "LIVELO", label: "LIVELO" },
    { value: "SMILES", label: "SMILES" },
    { value: "TUDOAZUL", label: "TudoAzul" },
    { value: "LATAMPASS", label: "LATAM Pass" },
    { value: "OUTRO", label: "Outro" },
  ];

  const progresso = (pontosAtuais: number, metaPontos: number) => {
    return Math.min(100, (pontosAtuais / metaPontos) * 100);
  };

  const analisarComIA = async (metaId: string) => {
    setAnalisando(metaId);
    try {
      const response = await fetch("/api/analisar-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metaId,
        }),
      });

      if (!response.ok) throw new Error("Erro na análise");

      const data = await response.json();
      setAnalise((prev) => ({ ...prev, [metaId]: data.analise }));

      toast.success("Análise gerada com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar análise");
      console.error(error);
    } finally {
      setAnalisando(null);
    }
  };

  if (carregando && metas.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400">Carregando metas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-white">Metas de Pontos</h1>
              <p className="text-gray-300">
                Acompanhe suas metas de pontos de fidelidade
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={"outline"}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              onClick={() => router.push("/dashboard/pontos")}
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant={"outline"}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                  onClick={() => {
                    setEditandoMeta(null);
                    setFormData({
                      programa: "LIVELO",
                      metaPontos: "",
                      descricao: "",
                      dataAlvo: "",
                    });
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Nova Meta
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-gray-900 border-gray-800 text-white">
                <SheetHeader>
                  <SheetTitle className="text-white">
                    {editandoMeta ? "Editar Meta" : "Nova Meta"}
                  </SheetTitle>
                  <SheetDescription className="text-gray-400">
                    {editandoMeta
                      ? "Atualize os dados da sua meta"
                      : "Defina uma meta de pontos para acompanhar seu progresso"}
                  </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="programa" className="text-white">
                      Programa
                    </Label>
                    <Select
                      value={formData.programa}
                      onValueChange={(value) =>
                        setFormData({ ...formData, programa: value })
                      }
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Selecione o programa" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        {programas.map((programa) => (
                          <SelectItem
                            key={programa.value}
                            value={programa.value}
                          >
                            {programa.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metaPontos" className="text-white">
                      Meta de Pontos
                    </Label>
                    <Input
                      id="metaPontos"
                      type="number"
                      min="1"
                      value={formData.metaPontos}
                      onChange={(e) =>
                        setFormData({ ...formData, metaPontos: e.target.value })
                      }
                      placeholder="Ex: 10000"
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao" className="text-white">
                      Descrição (Opcional)
                    </Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData({ ...formData, descricao: e.target.value })
                      }
                      placeholder="Ex: Meta para viagem internacional"
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataAlvo" className="text-white">
                      Data Alvo
                    </Label>
                    <Input
                      id="dataAlvo"
                      type="date"
                      value={formData.dataAlvo}
                      onChange={(e) =>
                        setFormData({ ...formData, dataAlvo: e.target.value })
                      }
                      className="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      className="flex-1 bg-white text-gray-900 hover:bg-gray-100"
                      disabled={enviando}
                    >
                      {enviando
                        ? "Salvando..."
                        : editandoMeta
                          ? "Atualizar Meta"
                          : "Salvar Meta"}
                    </Button>

                    {editandoMeta && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelarEdicao}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </form>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Metas */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence>
              {metas.map((meta, index) => {
                const pontosAtuaisPrograma = pontosAtuais[meta.programa] || 0;
                const projecao = projecoes[meta.id];
                const progressoAtual = progresso(
                  pontosAtuaisPrograma,
                  meta.metaPontos
                );

                return (
                  <motion.div
                    key={meta.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-gray-900 border-gray-800 group hover:border-gray-700 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg text-white">
                                  {meta.programa}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className="bg-gray-800 text-gray-300 border-gray-700"
                                >
                                  {pontosAtuaisPrograma.toLocaleString()} /{" "}
                                  {meta.metaPontos.toLocaleString()} pts
                                </Badge>
                              </div>

                              <p className="text-gray-400 mb-3">
                                {meta.descricao || "Meta de pontos"}
                              </p>

                              {/* Progresso */}
                              <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-400">
                                    Progresso
                                  </span>
                                  <span className="text-white">
                                    {progressoAtual.toFixed(1)}%
                                  </span>
                                </div>
                                <Progress
                                  value={progressoAtual}
                                  className="h-2 bg-gray-800"
                                />
                              </div>

                              {/* Informações */}
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <Label className="text-gray-400 text-xs">
                                    Data Alvo
                                  </Label>
                                  <p className="font-medium text-white">
                                    {format(
                                      new Date(meta.dataAlvo),
                                      "dd/MM/yyyy",
                                      {
                                        locale: ptBR,
                                      }
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-gray-400 text-xs">
                                    Dias Restantes
                                  </Label>
                                  <p className="font-medium text-white">
                                    {projecao?.diasRestantes || 0} dias
                                  </p>
                                </div>
                              </div>

                              {/* Projeção */}
                              {projecao && (
                                <Card className="bg-gray-800 border-gray-700 mt-4">
                                  <CardContent className="pt-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <TrendingUp className="h-4 w-4 text-blue-400" />
                                      <Label className="text-white">
                                        Projeção
                                      </Label>
                                    </div>
                                    <p className="text-sm text-gray-300 mb-2">
                                      {projecao.mensagem}
                                    </p>
                                    {projecao.pontosNecessariosPorDia > 0 && (
                                      <p className="text-xs text-gray-400">
                                        <strong className="text-white">
                                          {projecao.pontosNecessariosPorDia.toFixed(
                                            1
                                          )}{" "}
                                          pontos/dia
                                        </strong>{" "}
                                        necessários
                                      </p>
                                    )}
                                  </CardContent>
                                </Card>
                              )}

                              {/* Análise com IA */}
                              {analise[meta.id] && (
                                <Card className="bg-gray-900/20 border-gray-700 mt-4">
                                  <CardContent className="pt-4">
                                    <div className="flex items-center gap-2 mb-3">
                                      <Sparkles className="h-4 w-4 text-blue-400" />
                                      <Label className="text-white">
                                        Análise com IA
                                      </Label>
                                    </div>
                                    <div className="text-sm text-gray-300 whitespace-pre-wrap">
                                      {analise[meta.id]}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => analisarComIA(meta.id)}
                                    disabled={analisando === meta.id}
                                    className="text-gray-400 hover:text-blue-400 hover:bg-gray-800"
                                  >
                                    {analisando === meta.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Brain className="w-4 h-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-800 text-white border-gray-700">
                                  <p>Analisar com IA</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => iniciarEdicao(meta)}
                                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-800 text-white border-gray-700">
                                  <p>Editar meta</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Dialog
                                    open={dialogAberto === meta.id}
                                    onOpenChange={(open) =>
                                      setDialogAberto(open ? meta.id : null)
                                    }
                                  >
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-400 hover:text-red-400 hover:bg-gray-800"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-gray-900 border-gray-800 text-white">
                                      <DialogHeader>
                                        <DialogTitle className="text-white">
                                          Excluir Meta
                                        </DialogTitle>
                                        <DialogDescription className="text-gray-400">
                                          Tem certeza que deseja excluir esta
                                          meta? Esta ação não pode ser desfeita.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="flex gap-3 justify-end">
                                        <Button
                                          variant="outline"
                                          onClick={() => setDialogAberto(null)}
                                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                                        >
                                          Cancelar
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          onClick={() => handleDelete(meta.id)}
                                          disabled={excluindo === meta.id}
                                        >
                                          {excluindo === meta.id
                                            ? "Excluindo..."
                                            : "Confirmar"}
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-800 text-white border-gray-700">
                                  <p>Excluir meta</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Estado Vazio */}
            {metas.length === 0 && !carregando && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Nenhuma meta definida
                </h3>
                <p className="text-gray-400 mb-6">
                  Comece criando sua primeira meta de pontos
                </p>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button className="bg-white text-gray-900 hover:bg-gray-100 gap-2">
                      <Plus className="w-4 h-4" />
                      Criar Primeira Meta
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="bg-gray-900 border-gray-800 text-white">
                    <SheetHeader>
                      <SheetTitle className="text-white">Nova Meta</SheetTitle>
                      <SheetDescription className="text-gray-400">
                        Defina uma meta de pontos para acompanhar seu progresso
                      </SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                      <div className="space-y-2">
                        <Label htmlFor="programa" className="text-white">
                          Programa
                        </Label>
                        <Select
                          value={formData.programa}
                          onValueChange={(value) =>
                            setFormData({ ...formData, programa: value })
                          }
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Selecione o programa" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                            {programas.map((programa) => (
                              <SelectItem
                                key={programa.value}
                                value={programa.value}
                              >
                                {programa.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="metaPontos" className="text-white">
                          Meta de Pontos
                        </Label>
                        <Input
                          id="metaPontos"
                          type="number"
                          min="1"
                          value={formData.metaPontos}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              metaPontos: e.target.value,
                            })
                          }
                          placeholder="Ex: 10000"
                          className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="descricao" className="text-white">
                          Descrição (Opcional)
                        </Label>
                        <Input
                          id="descricao"
                          value={formData.descricao}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              descricao: e.target.value,
                            })
                          }
                          placeholder="Ex: Meta para viagem internacional"
                          className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dataAlvo" className="text-white">
                          Data Alvo
                        </Label>
                        <Input
                          id="dataAlvo"
                          type="date"
                          value={formData.dataAlvo}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              dataAlvo: e.target.value,
                            })
                          }
                          className="bg-gray-800 border-gray-700 text-white"
                          required
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="submit"
                          className="flex-1 bg-white text-gray-900 hover:bg-gray-100"
                          disabled={enviando}
                        >
                          {enviando
                            ? "Salvando..."
                            : editandoMeta
                              ? "Atualizar Meta"
                              : "Salvar Meta"}
                        </Button>

                        {editandoMeta && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={cancelarEdicao}
                            className="border-gray-700 text-gray-300 hover:bg-gray-800"
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </form>
                  </SheetContent>
                </Sheet>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Estatísticas */}
          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Metas Ativas</span>
                  <Badge className="bg-gray-600 text-white hover:bg-gray-700">
                    {metas.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">
                    Meta Mais Próxima
                  </span>
                  <span className="text-sm font-medium text-white">
                    {metas.length > 0
                      ? format(new Date(metas[0].dataAlvo), "dd/MM/yy")
                      : "-"}
                  </span>
                </div>

                {metas.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                    onClick={() => analisarComIA(metas[0].id)}
                    disabled={analisando === metas[0].id}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    {analisando === metas[0].id
                      ? "Analisando..."
                      : "Analisar Todas as Metas"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
