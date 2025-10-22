// app/dashboard/components/DashboardTable.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Eye, Users } from "lucide-react";

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
}

export default function DashboardTable({ mes, ano }: DashboardTableProps) {
  const router = useRouter();
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarUltimosLancamentos();
  }, [mes, ano]); // Recarregar quando mês/ano mudar

  const carregarUltimosLancamentos = async () => {
    try {
      const params = new URLSearchParams();
      params.append("limit", "10");
      if (mes) params.append("mes", mes);
      if (ano) params.append("ano", ano);

      const response = await fetch(`/api/lancamentos?${params}`);
      if (!response.ok) throw new Error("Erro ao carregar lançamentos");

      const data = await response.json();
      setLancamentos(data);
    } catch (error) {
      console.error("Erro ao carregar lançamentos:", error);
    } finally {
      setCarregando(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarData = (data: Date) => {
    return new Date(data).toLocaleDateString("pt-BR");
  };

  const temCompartilhamento = (lancamento: Lancamento) => {
    return (
      lancamento.LancamentoCompartilhado &&
      lancamento.LancamentoCompartilhado.length > 0
    );
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white">Últimos Lançamentos</CardTitle>
          <CardDescription className="text-gray-400">
            Suas transações mais recentes
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/lancamentos")}
          className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          <Eye className="mr-2 h-4 w-4" />
          Ver Todos
        </Button>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full bg-gray-700" />
            ))}
          </div>
        ) : lancamentos.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="mb-3">Nenhum lançamento encontrado</p>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/lancamentos/novo")}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Adicionar Primeiro Lançamento
            </Button>
          </div>
        ) : (
          <div className="rounded-md border border-gray-700">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-700 hover:bg-gray-700 border-gray-600">
                  <TableHead className="text-gray-300">Descrição</TableHead>
                  <TableHead className="text-gray-300">Categoria</TableHead>
                  <TableHead className="text-gray-300">Data</TableHead>
                  <TableHead className="text-right text-gray-300">
                    Valor
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lancamentos.map((lancamento) => (
                  <TableRow
                    key={lancamento.id}
                    className="hover:bg-gray-700/50 cursor-pointer border-gray-700"
                    onClick={() =>
                      router.push(`/dashboard/lancamentos/${lancamento.id}`)
                    }
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">
                          {lancamento.descricao}
                        </p>
                        {temCompartilhamento(lancamento) && (
                          <Users className="h-3 w-3 text-blue-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {lancamento.metodoPagamento}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-gray-700 text-gray-300 border-gray-600"
                        style={{
                          backgroundColor: `${lancamento.categoria.cor}20`,
                          borderColor: lancamento.categoria.cor,
                          color: lancamento.categoria.cor,
                        }}
                      >
                        {lancamento.categoria.nome}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {formatarData(lancamento.data)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-semibold ${
                          lancamento.tipo === "RECEITA"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {lancamento.tipo === "RECEITA" ? "+" : "-"}
                        {formatarMoeda(lancamento.valor)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
