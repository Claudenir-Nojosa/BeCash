// app/dashboard/components/MetasCard.tsx
"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
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
  const { t, i18n } = useTranslation("metasCard");

  const getLocalizedPath = (path: string) => {
    return `/${i18n.language}${path}`;
  };

  const formatarMoeda = (valor: number) => {
    const locale = i18n.language === "pt" ? "pt-BR" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarData = (data: Date) => {
    const locale = i18n.language === "pt" ? "pt-BR" : "en-US";
    return new Date(data).toLocaleDateString(locale);
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
    return "emAndamento";
  };

  const obterTextoStatus = (status: string) => {
    return t(`status.${status}`);
  };

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 dark:text-white ">
            <Trophy className="h-5 w-5" />
            {t("titulo")}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
            {t("subtitulo")}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(getLocalizedPath("/dashboard/metas"))}
          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500"
        >
          <Plus className="mr-2 h-3.5 w-3.5" />
          {t("botoes.novaMeta")}
        </Button>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-3 border border-gray-200 dark:border-gray-800 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <Skeleton className="h-4 w-32 bg-gray-200 dark:bg-gray-800" />
                  <Skeleton className="h-5 w-16 bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full bg-gray-200 dark:bg-gray-800" />
                  <Skeleton className="h-3 w-24 bg-gray-200 dark:bg-gray-800" />
                </div>
              </div>
            ))}
          </div>
        ) : metas.length === 0 ? (
          <div className="text-center py-6">
            <div className="mx-auto w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
              <Trophy className="h-7 w-7 text-gray-400 dark:text-gray-600" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              {t("mensagens.nenhumaMeta")}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(getLocalizedPath("/dashboard/metas"))
              }
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t("botoes.criarPrimeira")}
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
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer bg-gray-50/50 dark:bg-gray-800/50"
                  onClick={() =>
                    router.push(getLocalizedPath("/dashboard/metas/"))
                  }
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: meta.cor }}
                      />
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {meta.titulo}
                      </h4>
                    </div>
                    <Badge
                      variant={
                        status === "concluida"
                          ? "default"
                          : status === "atrasada"
                            ? "destructive"
                            : "outline"
                      }
                      className={`
                        text-xs font-medium
                        ${status === "concluida"
                          ? "bg-emerald-100 dark:bg-green-900/50 text-emerald-700 dark:text-green-300 border-emerald-200 dark:border-green-700"
                          : status === "atrasada"
                            ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
                            : status === "proxima"
                              ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600"
                        }
                      `}
                    >
                      {obterTextoStatus(status)}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatarMoeda(meta.valorAtual)} /{" "}
                        {formatarMoeda(meta.valorAlvo)}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {progresso.toFixed(0)}%
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(progresso, 100)}%`,
                          backgroundColor: meta.cor,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3 w-3" />
                        {formatarData(meta.dataAlvo)}
                      </div>
                      <span className="text-gray-600 dark:text-gray-300 font-medium">
                        {meta.categoria}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {metas.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() =>
                  router.push(getLocalizedPath("/dashboard/metas"))
                }
              >
                {t("botoes.verTodas")}
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}