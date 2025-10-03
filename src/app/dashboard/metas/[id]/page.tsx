// app/dashboard/metas/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Plus,
  Calendar,
  User,
  Target,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Meta {
  id: string;
  titulo: string;
  descricao: string | null;
  valorAlvo: number;
  valorAtual: number;
  dataLimite: Date | null;
  tipo: string;
  responsavel: string;
  categoria: string;
  concluida: boolean;
  createdAt: Date;
  updatedAt: Date;
  contribuicoes: Contribuicao[];
}

interface Contribuicao {
  id: string;
  valor: number;
  data: Date;
  observacoes: string | null;
  createdAt: Date;
}

export default function DetalhesMetaPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [meta, setMeta] = useState<Meta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [contribuindo, setContribuindo] = useState(false);
  const [valorContribuicao, setValorContribuicao] = useState("");

  const mostrarFormContribuicao = searchParams.get("contribuir") === "true";

  useEffect(() => {
    if (id) {
      carregarMeta();
    }
  }, [id]);

  const carregarMeta = async () => {
    try {
      setCarregando(true);
      const response = await fetch(`/api/metas/${id}`);
      if (!response.ok) throw new Error("Erro ao carregar meta");
      const data = await response.json();
      setMeta(data);
    } catch (error) {
      toast.error("Erro ao carregar meta");
    } finally {
      setCarregando(false);
    }
  };

  const handleContribuir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meta) return;

    const valorNumerico = parseFloat(valorContribuicao);
    if (!valorContribuicao || valorNumerico <= 0 || isNaN(valorNumerico)) {
      toast.error("Digite um valor válido");
      return;
    }

    const valorRestante = Math.max(0, meta.valorAlvo - meta.valorAtual);
    if (valorNumerico > valorRestante + 0.01) {
      toast.error(`Valor máximo: ${formatarMoeda(valorRestante)}`);
      return;
    }

    try {
      setContribuindo(true);
      const response = await fetch(`/api/metas/${id}/contribuir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor: valorContribuicao }),
      });

      if (!response.ok) throw new Error("Erro ao contribuir");

      const data = await response.json();
      setMeta(data.meta);
      setValorContribuicao("");
      toast.success("Contribuição realizada!");
      router.replace(`/dashboard/metas/${id}`);
    } catch (error) {
      toast.error("Erro ao realizar contribuição");
    } finally {
      setContribuindo(false);
    }
  };

  const calcularProgresso = () => {
    if (!meta) return 0;
    return Math.min((meta.valorAtual / meta.valorAlvo) * 100, 100);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-muted rounded-lg animate-pulse" />
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-96 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl">Meta não encontrada</h1>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/metas")}
          >
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const progresso = calcularProgresso();
  const valorRestante = Math.max(0, meta.valorAlvo - meta.valorAtual);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl">{meta.titulo}</h1>
            {meta.descricao && (
              <p className="text-muted-foreground mt-1">{meta.descricao}</p>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          {/* Progresso */}
          <Card className="border-0 shadow-none">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-2xl">
                    {formatarMoeda(meta.valorAtual)}
                  </span>
                  <span className="text-2xl text-muted-foreground">
                    {formatarMoeda(meta.valorAlvo)}
                  </span>
                </div>

                <Progress value={progresso} className="h-2" />

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{progresso.toFixed(1)}% concluído</span>
                  <span>{formatarMoeda(valorRestante)} restantes</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categoria</p>
                    <p className="">{meta.categoria}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Responsável</p>
                    <p className="">{meta.responsavel}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {meta.dataLimite && (
              <Card className="border-0 shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-orange-50 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Data Limite
                      </p>
                      <p className="">
                        {format(new Date(meta.dataLimite), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Contribuição */}
          {!meta.concluida && (
            <Card className="border-0 shadow-none">
              <CardContent className="p-6">
                {!mostrarFormContribuicao ? (
                  <div className="text-center space-y-4">
                    <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className=" mb-1">
                        Contribuir para a meta
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Ajude a alcançar o objetivo
                      </p>
                    </div>
                    <Button
                      onClick={() =>
                        router.push(`/dashboard/metas/${id}?contribuir=true`)
                      }
                      className="w-full max-w-xs"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Fazer Contribuição
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="">Fazer Contribuição</h3>
                    <form onSubmit={handleContribuir} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="valor">Valor</Label>
                        <Input
                          id="valor"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={valorContribuicao}
                          onChange={(e) => setValorContribuicao(e.target.value)}
                          placeholder="0,00"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Máximo: {formatarMoeda(valorRestante)}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            router.replace(`/dashboard/metas/${id}`)
                          }
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={contribuindo}
                          className="flex-1"
                        >
                          {contribuindo ? "Processando..." : "Confirmar"}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Histórico */}
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle className="text-lg ">
                Contribuições
              </CardTitle>
              <CardDescription>
                {meta.contribuicoes.length} contribuições realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {meta.contribuicoes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma contribuição ainda
                </div>
              ) : (
                <div className="space-y-3">
                  {meta.contribuicoes.map((contribuicao) => (
                    <div
                      key={contribuicao.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className=" text-green-600">
                          + {formatarMoeda(contribuicao.valor)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(contribuicao.data), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
