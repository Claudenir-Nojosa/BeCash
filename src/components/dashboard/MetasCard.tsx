// app/dashboard/components/MetasCard.tsx
"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Plus, Trophy, Calendar, ArrowRight } from "lucide-react";
import { MetaPessoal } from "../../../types/dashboard";

interface MetasCardProps {
  metas: MetaPessoal[];
  carregando: boolean;
}

export default function MetasCard({ metas, carregando }: MetasCardProps) {
  const router = useRouter();

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarData = (data: Date) => {
    return new Date(data).toLocaleDateString("pt-BR");
  };

  const calcularProgresso = (meta: MetaPessoal) => {
    return (meta.valorAtual / meta.valorAlvo) * 100;
  };

  const obterStatusMeta = (progresso: number, dataAlvo: Date) => {
    const hoje = new Date();
    const dataAlvoDate = new Date(dataAlvo);

    if (progresso >= 100) return "concluida";
    if (dataAlvoDate < hoje) return "atrasada";
    if (progresso >= 75) return "proxima";
    return "em_andamento";
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="h-5 w-5" />
            Metas Pessoais
          </CardTitle>
          <CardDescription className="text-gray-400">
            Suas economias e objetivos
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/metas/novo")}
          className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Meta
        </Button>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full bg-gray-700" />
            ))}
          </div>
        ) : metas.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-600" />
            <p className="mb-3">Nenhuma meta definida</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/metas/novo")}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Criar Primeira Meta
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {metas.slice(0, 3).map((meta) => {
              const progresso = calcularProgresso(meta);
              const status = obterStatusMeta(progresso, meta.dataAlvo);

              return (
                <div
                  key={meta.id}
                  className="p-3 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/metas/${meta.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: meta.cor }}
                      />
                      <h4 className="font-medium text-white">{meta.titulo}</h4>
                    </div>
                    <Badge
                      variant={
                        status === "concluida"
                          ? "default"
                          : status === "atrasada"
                            ? "destructive"
                            : "outline"
                      }
                      className={
                        status === "concluida"
                          ? "bg-green-900/50 text-green-300 border-green-700"
                          : status === "atrasada"
                            ? "bg-red-900/50 text-red-300 border-red-700"
                            : status === "proxima"
                              ? "bg-blue-900/50 text-blue-300 border-blue-700"
                              : "bg-gray-700 text-gray-300 border-gray-600"
                      }
                    >
                      {status === "concluida"
                        ? "Concluída"
                        : status === "atrasada"
                          ? "Atrasada"
                          : status === "proxima"
                            ? "Próxima"
                            : "Em andamento"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        {formatarMoeda(meta.valorAtual)} /{" "}
                        {formatarMoeda(meta.valorAlvo)}
                      </span>
                      <span className="font-medium text-white">
                        {progresso.toFixed(0)}%
                      </span>
                    </div>

                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(progresso, 100)}%`,
                          backgroundColor: meta.cor,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatarData(meta.dataAlvo)}
                      </div>
                      <span>{meta.categoria}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {metas.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-gray-400 hover:text-white hover:bg-gray-700"
                onClick={() => router.push("/dashboard/metas")}
              >
                Ver todas as metas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
