"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Sparkles, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Target,
  TrendingUp,
  Calendar,
  Coins,
  ArrowLeft,
  Edit,
} from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

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
  const [mostrarForm, setMostrarForm] = useState(false);
  const [analisando, setAnalisando] = useState<string | null>(null);
  const [analise, setAnalise] = useState<{ [key: string]: string }>({});
  const [perguntaPersonalizada, setPerguntaPersonalizada] = useState<{
    [key: string]: string;
  }>({});

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
    // Simulação - você precisará implementar a lógica real baseada no histórico
    // Por enquanto, retornando um valor fixo para demonstração
    return 100; // 100 pontos por dia em média
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/pontos/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          metaPontos: parseInt(formData.metaPontos),
        }),
      });

      if (!response.ok) throw new Error("Erro ao salvar meta");

      toast.success("Meta salva com sucesso!");
      setMostrarForm(false);
      setFormData({
        programa: "LIVELO",
        metaPontos: "",
        descricao: "",
        dataAlvo: "",
      });
      carregarMetasEDados();
    } catch (error) {
      toast.error("Erro ao salvar meta");
      console.error(error);
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

  // Adicione esta função para análise com IA
  const analisarComIA = async (metaId: string, pergunta?: string) => {
    setAnalisando(metaId);
    try {
      const response = await fetch("/api/analisar-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metaId,
          perguntaEspecifica: pergunta || perguntaPersonalizada[metaId],
        }),
      });

      if (!response.ok) throw new Error("Erro na análise");

      const data = await response.json();
      setAnalise((prev) => ({ ...prev, [metaId]: data.analise }));
      setPerguntaPersonalizada((prev) => ({ ...prev, [metaId]: "" }));

      toast.success("Análise gerada com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar análise");
      console.error(error);
    } finally {
      setAnalisando(null);
    }
  };

  return (
    <div className="container mx-auto p-6 mt-20 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold">Metas de Pontos</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Metas */}
        <div className="lg:col-span-2 space-y-6">
          {metas.map((meta) => {
            const pontosAtuaisPrograma = pontosAtuais[meta.programa] || 0;
            const projecao = projecoes[meta.id];
            const progressoAtual = progresso(
              pontosAtuaisPrograma,
              meta.metaPontos
            );

            return (
              <Card key={meta.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {meta.programa}
                        <Badge variant="secondary">
                          {pontosAtuaisPrograma.toLocaleString()} /{" "}
                          {meta.metaPontos.toLocaleString()} pts
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {meta.descricao || "Meta de pontos"}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span>{progressoAtual.toFixed(1)}%</span>
                    </div>
                    <Progress value={progressoAtual} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>Data Alvo</Label>
                      <p className="font-medium">
                        {format(new Date(meta.dataAlvo), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <div>
                      <Label>Dias Restantes</Label>
                      <p className="font-medium">
                        {projecao?.diasRestantes || 0} dias
                      </p>
                    </div>
                  </div>

                  {/* Projeção */}
                  {projecao && (
                    <Card className="bg-muted">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <Label>Projeção</Label>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {projecao.mensagem}
                        </p>
                        {projecao.pontosNecessariosPorDia > 0 && (
                          <p className="text-xs">
                            <strong>
                              {projecao.pontosNecessariosPorDia.toFixed(1)}{" "}
                              pontos/dia
                            </strong>{" "}
                            necessários
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  {analise[meta.id] && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="h-4 w-4 text-blue-600" />
                          <Label className="text-blue-800">
                            Análise com IA
                          </Label>
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          {analise[meta.id]}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {metas.length === 0 && !carregando && (
            <Card>
              <CardContent className="text-center py-8">
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-muted-foreground mb-4">
                  Nenhuma meta definida
                </p>
                <Button onClick={() => setMostrarForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Meta
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Formulário de Meta */}
        <div>
          {mostrarForm || metas.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {metas.length === 0 ? "Nova Meta" : "Adicionar Meta"}
                </CardTitle>
                <CardDescription>
                  Defina uma meta de pontos para acompanhar seu progresso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="programa">Programa</Label>
                    <Select
                      value={formData.programa}
                      onValueChange={(value) =>
                        setFormData({ ...formData, programa: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o programa" />
                      </SelectTrigger>
                      <SelectContent>
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
                    <Label htmlFor="metaPontos">Meta de Pontos</Label>
                    <Input
                      id="metaPontos"
                      type="number"
                      min="1"
                      value={formData.metaPontos}
                      onChange={(e) =>
                        setFormData({ ...formData, metaPontos: e.target.value })
                      }
                      placeholder="Ex: 10000"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição (Opcional)</Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData({ ...formData, descricao: e.target.value })
                      }
                      placeholder="Ex: Meta para viagem internacional"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataAlvo">Data Alvo</Label>
                    <Input
                      id="dataAlvo"
                      type="date"
                      value={formData.dataAlvo}
                      onChange={(e) =>
                        setFormData({ ...formData, dataAlvo: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      Salvar Meta
                    </Button>
                    {metas.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setMostrarForm(false)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Button onClick={() => setMostrarForm(true)} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Meta
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Metas Ativas</span>
                <Badge>{metas.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Meta Mais Próxima</span>
                <span className="text-sm font-medium">
                  {metas.length > 0
                    ? format(new Date(metas[0].dataAlvo), "dd/MM/yy")
                    : "-"}
                </span>
              </div>

              {metas.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => analisarComIA(metas[0].id)}
                  disabled={analisando === metas[0].id}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Analisar Todas as Metas
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
