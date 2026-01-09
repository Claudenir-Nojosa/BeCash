"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Eye, Users, Plus } from "lucide-react";

interface Lancamento {
  id: string;
  descricao: string;
  valor: number;
  tipo: "RECEITA" | "DESPESA";
  data: Date;
  categoria: {
    nome: string;
    cor: string;
  };
  metodoPagamento: string;
  LancamentoCompartilhado?: Array<{
    valorCompartilhado: number;
    status: string;
  }>;
}

interface DashboardTableProps {
  mes?: string;
  ano?: string;
  refreshTrigger?: number;
}

const LIMITE_LANCAMENTOS = 10;

export default function DashboardTable({
  mes,
  ano,
  refreshTrigger,
}: DashboardTableProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation("dashboardTable");
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [carregando, setCarregando] = useState(true);

  const getLocalizedPath = (path: string) => {
    return `/${i18n.language}${path}`;
  };

  useEffect(() => {
    carregarUltimosLancamentos();
  }, [mes, ano, refreshTrigger]);

  const carregarUltimosLancamentos = async () => {
    try {
      setCarregando(true);

      const params = new URLSearchParams();
      params.append("limit", LIMITE_LANCAMENTOS.toString());
      params.append("sort", "createdAt_desc"); // ✅ Mudança aqui: ordenar por criação
      if (mes) params.append("mes", mes);
      if (ano) params.append("ano", ano);

      const response = await fetch(`/api/lancamentos?${params}`);
      if (!response.ok) throw new Error(t("erros.erroCarregar"));

      const data = await response.json();

      // Já vem ordenado pela API, mas garantimos a ordenação localmente também
      const ordenado = data.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const lancamentosLimitados = ordenado.slice(0, LIMITE_LANCAMENTOS);
      setLancamentos(lancamentosLimitados);
    } catch (error) {
      console.error(t("erros.erroCarregar"), error);
    } finally {
      setCarregando(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    const locale = i18n.language === "pt" ? "pt-BR" : "en-US";
    const currency = i18n.language === "pt" ? "BRL" : "USD";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(valor);
  };

  const formatarData = (data: Date) => {
    const locale = i18n.language === "pt" ? "pt-BR" : "en-US";
    return new Date(data).toLocaleDateString(locale);
  };

  const temCompartilhamento = (lancamento: Lancamento) => {
    return (
      lancamento.LancamentoCompartilhado &&
      lancamento.LancamentoCompartilhado.length > 0
    );
  };

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-gray-900 dark:text-white text-lg font-semibold">
            {t("titulo")}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
            {t("subtitulo", { limit: LIMITE_LANCAMENTOS })}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push(getLocalizedPath("/dashboard/lancamentos"))
            }
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Eye className="mr-2 h-3.5 w-3.5" />
            {t("botoes.verTodos")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-800" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32 bg-gray-200 dark:bg-gray-800" />
                    <Skeleton className="h-3 w-24 bg-gray-200 dark:bg-gray-800" />
                  </div>
                </div>
                <Skeleton className="h-4 w-20 bg-gray-200 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        ) : lancamentos.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-gray-400 dark:text-gray-600" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              {t("mensagens.nenhumLancamento")}
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/lancamentos/novo")}
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("botoes.adicionarPrimeiro")}
            </Button>
          </div>
        ) : (
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-x-auto">
            <div className="md:min-w-[700px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800">
                    <TableHead className="md:table-cell hidden">
                      {t("tabela.colunas.descricao")}
                    </TableHead>
                    <TableHead className="md:table-cell hidden">
                      {t("tabela.colunas.categoria")}
                    </TableHead>
                    <TableHead className="md:table-cell hidden">
                      {t("tabela.colunas.data")}
                    </TableHead>
                    <TableHead className="md:table-cell hidden text-right">
                      {t("tabela.colunas.valor")}
                    </TableHead>

                    {/* Mobile */}
                    <TableHead className="md:hidden">
                      {t("tabela.colunas.descricao")}
                    </TableHead>
                    <TableHead className="md:hidden text-right">
                      {t("tabela.colunas.valor")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lancamentos.map((lancamento) => (
                    <TableRow
                      key={lancamento.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() =>
                        router.push(`/dashboard/lancamentos/${lancamento.id}`)
                      }
                    >
                      {/* DESKTOP */}
                      <TableCell className="hidden md:table-cell">
                        {lancamento.descricao}
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        {lancamento.categoria.nome}
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        {formatarData(lancamento.data)}
                      </TableCell>

                      <TableCell className="hidden md:table-cell text-right">
                        {formatarMoeda(lancamento.valor)}
                      </TableCell>

                      {/* MOBILE */}
                      <TableCell className="md:hidden px-3 py-3 align-top">
                        <div className="space-y-1">
                          <span
                            className="text-xs font-semibold"
                            style={{ color: lancamento.categoria.cor }}
                          >
                            {lancamento.categoria.nome}
                          </span>

                          <p className="font-medium text-sm break-words whitespace-normal">
                            {lancamento.descricao}
                          </p>

                          <p className="text-xs text-gray-500">
                            {lancamento.metodoPagamento}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="md:hidden px-3 py-3 text-right align-top">
                        <div className="space-y-1">
                          <p
                            className={`font-semibold ${
                              lancamento.tipo === "RECEITA"
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatarMoeda(lancamento.valor)}
                          </p>

                          <p className="text-xs text-gray-500">
                            {formatarData(lancamento.data)}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
