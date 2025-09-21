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
import { Calendar, User, Target, ArrowLeft, Plus, History } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

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
  icone: string | null;
  cor: string | null;
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
  const [observacoesContribuicao, setObservacoesContribuicao] = useState("");

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

      if (!response.ok) {
        throw new Error("Erro ao carregar meta");
      }

      const data = await response.json();
      setMeta(data);
    } catch (error) {
      console.error("Erro ao carregar meta:", error);
      toast.error("Erro ao carregar meta");
    } finally {
      setCarregando(false);
    }
  };

  const handleContribuir = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!meta) {
      toast.error("Meta não encontrada");
      return;
    }

    const valorNumerico = parseFloat(valorContribuicao);

    if (!valorContribuicao || valorNumerico <= 0 || isNaN(valorNumerico)) {
      toast.error("Digite um valor válido para contribuição");
      return;
    }

    // Lidar com imprecisão de números float - usar tolerância de 0.01
    const valorRestantePreciso = Math.max(0, meta.valorAlvo - meta.valorAtual);
    const tolerancia = 0.01; // 1 centavo de tolerância

    if (valorNumerico > valorRestantePreciso + tolerancia) {
      toast.error(
        `O valor não pode ser maior que ${formatarMoeda(valorRestantePreciso)}`
      );
      return;
    }

    try {
      setContribuindo(true);

      const response = await fetch(`/api/metas/${id}/contribuir`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          valor: valorContribuicao,
          observacoes: observacoesContribuicao,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao contribuir");
      }

      const data = await response.json();
      setMeta(data.meta);

      setValorContribuicao("");
      setObservacoesContribuicao("");

      toast.success("Contribuição realizada com sucesso!");

      // Fechar o formulário de contribuição
      router.replace(`/dashboard/metas/${id}`);
    } catch (error: any) {
      console.error("Erro ao contribuir:", error);
      toast.error(error.message || "Erro ao realizar contribuição");
    } finally {
      setContribuindo(false);
    }
  };

  const calcularProgresso = (valorAtual: number, valorAlvo: number) => {
    return Math.min((valorAtual / valorAlvo) * 100, 100);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarCategoria = (categoria: string) => {
    const categorias: Record<string, string> = {
      viagem: "Viagem",
      reserva: "Reserva",
      investimento: "Investimento",
      compra: "Compra",
      outros: "Outros",
    };
    return categorias[categoria] || categoria;
  };

  // Adicionar esta função no início do componente
  const calcularValorRestante = () => {
    if (!meta) return 0;
    // Usar precisão de centavos para evitar problemas com float
    const restante = meta.valorAlvo - meta.valorAtual;
    return Math.max(0, Math.round(restante * 100) / 100); // Arredondar para 2 casas decimais
  };

  // Usar esta função onde for necessário
  const valorRestante = calcularValorRestante();

  if (carregando) {
    return (
      <div className="container mx-auto p-6 mt-20 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="container mx-auto p-6 mt-20 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Meta não encontrada</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              A meta solicitada não foi encontrada.
            </p>
            <div className="flex justify-center">
              <Button onClick={() => router.push("/dashboard/metas")}>
                Voltar para Metas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 mt-20 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Detalhes da Meta</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card de informações da meta */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {meta.icone && <span>{meta.icone}</span>}
                    {meta.titulo}
                  </CardTitle>
                  <CardDescription>{meta.descricao}</CardDescription>
                </div>
                <Badge
                  variant={meta.concluida ? "default" : "secondary"}
                  className={
                    meta.concluida ? "bg-green-100 text-green-800" : ""
                  }
                >
                  {meta.concluida ? "Concluída" : "Em andamento"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progresso */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">
                    {formatarMoeda(meta.valorAtual)}
                  </span>
                  <span className="font-medium">
                    {formatarMoeda(meta.valorAlvo)}
                  </span>
                </div>
                <Progress
                  value={calcularProgresso(meta.valorAtual, meta.valorAlvo)}
                  className="h-3"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Arrecadado</span>
                  <span>
                    {calcularProgresso(meta.valorAtual, meta.valorAlvo).toFixed(
                      1
                    )}
                    %
                  </span>
                </div>
              </div>

              {/* Informações */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span className="font-medium">Categoria:</span>
                  </div>
                  <span>{formatarCategoria(meta.categoria)}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Responsável:</span>
                  </div>
                  <span>{meta.responsavel}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Tipo:</span>
                  </div>
                  <span>
                    {meta.tipo === "individual"
                      ? "Individual"
                      : "Compartilhado"}
                  </span>
                </div>

                {meta.dataLimite && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Data Limite:</span>
                    </div>
                    <span>
                      {format(new Date(meta.dataLimite), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Valor restante */}
              {!meta.concluida && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">
                    Valor Restante
                  </h3>
                  <p className="text-2xl font-bold text-blue-800">
                    {formatarMoeda(valorRestante)}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    Faltam {formatarMoeda(valorRestante)} para atingir sua meta!
                  </p>
                </div>
              )}

              {/* Botão de contribuição */}
              {!meta.concluida && !mostrarFormContribuicao && (
                <Button
                  className="w-full"
                  onClick={() =>
                    router.push(`/dashboard/metas/${id}?contribuir=true`)
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Contribuir para esta Meta
                </Button>
              )}

              {/* Formulário de contribuição */}
              {mostrarFormContribuicao && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Fazer Contribuição
                    </CardTitle>
                    <CardDescription>
                      Adicione um valor para contribuir com esta meta
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleContribuir} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="valor">Valor da Contribuição *</Label>
                        <Input
                          id="valor"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={valorContribuicao}
                          onChange={(e) => {
                            // Permitir apenas números e ponto decimal
                            const value = e.target.value.replace(
                              /[^0-9.]/g,
                              ""
                            );
                            // Garantir que há no máximo um ponto decimal
                            const parts = value.split(".");
                            if (parts.length > 2) return;
                            // Garantir que após o ponto há no máximo 2 dígitos
                            if (parts.length === 2 && parts[1].length > 2)
                              return;
                            setValorContribuicao(value);
                          }}
                          placeholder="0,00"
                          required
                        />
                        <p className="text-sm text-muted-foreground">
                          Valor máximo: {formatarMoeda(valorRestante)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="observacoes">
                          Observações (Opcional)
                        </Label>
                        <Textarea
                          id="observacoes"
                          value={observacoesContribuicao}
                          onChange={(e) =>
                            setObservacoesContribuicao(e.target.value)
                          }
                          placeholder="Descreva esta contribuição..."
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-4">
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
                          {contribuindo
                            ? "Processando..."
                            : "Confirmar Contribuição"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Histórico de contribuições */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Contribuições
              </CardTitle>
              <CardDescription>
                {meta.contribuicoes.length} contribuição(ões) realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {meta.contribuicoes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma contribuição realizada ainda.
                </p>
              ) : (
                <div className="space-y-4">
                  {meta.contribuicoes.map((contribuicao) => (
                    <div
                      key={contribuicao.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-green-600">
                          + {formatarMoeda(contribuicao.valor)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(
                            new Date(contribuicao.data),
                            "dd/MM/yyyy 'às' HH:mm",
                            {
                              locale: ptBR,
                            }
                          )}
                        </p>
                        {contribuicao.observacoes && (
                          <p className="text-sm">{contribuicao.observacoes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna lateral - Estatísticas */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Valor Arrecadado</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatarMoeda(meta.valorAtual)}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Valor Restante</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatarMoeda(valorRestante)}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Progresso</p>
                <p className="text-2xl font-bold">
                  {calcularProgresso(meta.valorAtual, meta.valorAlvo).toFixed(
                    1
                  )}
                  %
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Total de Contribuições</p>
                <p className="text-2xl font-bold">
                  {meta.contribuicoes.length}
                </p>
              </div>

              {meta.dataLimite && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Dias Restantes</p>
                  <p className="text-2xl font-bold">
                    {Math.max(
                      0,
                      Math.ceil(
                        (new Date(meta.dataLimite).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!meta.concluida && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    router.push(`/dashboard/metas/${id}?contribuir=true`)
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Contribuir
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/dashboard/metas`)}
              >
                Voltar para Lista
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
