// app/dashboard/metas/page.tsx
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, TrendingUp, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function MetasPage() {
  const router = useRouter();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<"todas" | "ativas" | "concluidas">(
    "ativas"
  );

  useEffect(() => {
    buscarMetas();
  }, [filtro]);

  const buscarMetas = async () => {
    try {
      setCarregando(true);
      const params = new URLSearchParams();

      if (filtro !== "todas") {
        params.append("concluida", filtro === "concluidas" ? "true" : "false");
      }

      const response = await fetch(`/api/metas?${params}`);

      if (!response.ok) {
        throw new Error("Erro ao buscar metas");
      }

      const data = await response.json();
      setMetas(data);
    } catch (error) {
      console.error("Erro ao buscar metas:", error);
      toast.error("Erro ao carregar metas");
    } finally {
      setCarregando(false);
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

  const metasFiltradas = metas.filter((meta) => {
    if (filtro === "todas") return true;
    if (filtro === "ativas") return !meta.concluida;
    return meta.concluida;
  });

  const totalArrecadado = metas.reduce((sum, meta) => sum + meta.valorAtual, 0);
  const totalMeta = metas.reduce((sum, meta) => sum + meta.valorAlvo, 0);

  return (
    <div className="container mx-auto p-6 mt-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold">Metas Financeiras</h1>
            <p className="text-muted-foreground">
              Acompanhe e gerencie seus objetivos financeiros
            </p>
          </div>
        </div>
        <Button onClick={() => router.push("/dashboard/metas/nova")}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total de Metas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metas.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Valor Arrecadado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatarMoeda(totalArrecadado)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Progresso Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {totalMeta > 0
                ? `${((totalArrecadado / totalMeta) * 100).toFixed(1)}%`
                : "0%"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filtro === "ativas" ? "default" : "outline"}
          onClick={() => setFiltro("ativas")}
        >
          Ativas
        </Button>
        <Button
          variant={filtro === "concluidas" ? "default" : "outline"}
          onClick={() => setFiltro("concluidas")}
        >
          Concluídas
        </Button>
        <Button
          variant={filtro === "todas" ? "default" : "outline"}
          onClick={() => setFiltro("todas")}
        >
          Todas
        </Button>
      </div>

      {/* Lista de Metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {carregando ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : metasFiltradas.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Nenhuma meta encontrada
            </h3>
            <p className="text-muted-foreground">
              {filtro === "ativas"
                ? "Comece criando sua primeira meta financeira!"
                : "Nenhuma meta neste filtro."}
            </p>
            {filtro === "ativas" && (
              <Button
                className="mt-4"
                onClick={() => router.push("/dashboard/metas/nova")}
              >
                Criar Primeira Meta
              </Button>
            )}
          </div>
        ) : (
          metasFiltradas.map((meta) => (
            <Card
              key={meta.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardHeader
                onClick={() => router.push(`/dashboard/metas/${meta.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{meta.titulo}</CardTitle>
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
              <CardContent
                onClick={() => router.push(`/dashboard/metas/${meta.id}`)}
              >
                <div className="space-y-4">
                  {/* Progresso */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{formatarMoeda(meta.valorAtual)}</span>
                      <span>{formatarMoeda(meta.valorAlvo)}</span>
                    </div>
                    <Progress
                      value={calcularProgresso(meta.valorAtual, meta.valorAlvo)}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {calcularProgresso(
                        meta.valorAtual,
                        meta.valorAlvo
                      ).toFixed(1)}
                      % concluído
                    </p>
                  </div>

                  {/* Informações */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span>{formatarCategoria(meta.categoria)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{meta.responsavel}</span>
                    </div>
                    {meta.dataLimite && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(meta.dataLimite), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botão de ação */}
                  {!meta.concluida && (
                    <Button
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/dashboard/metas/${meta.id}?contribuir=true`
                        );
                      }}
                    >
                      Contribuir
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
