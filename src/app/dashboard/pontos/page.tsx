// app/dashboard/pontos/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Plus,
  Filter,
  Search,
  TrendingUp,
  Gift,
  Clock,
  Calendar,
  Coins,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Ponto {
  id: string;
  programa: string;
  quantidade: number;
  descricao: string;
  data: Date;
  tipo: "GANHO" | "RESGATE" | "EXPIRACAO";
  valorResgate: number | null;
  usuarioId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ResumoPontos {
  totalPontos: number;
  pontosGanhos: number;
  pontosResgatados: number;
  pontosExpirados: number;
  valorTotalResgatado: number;
}

export default function PontosPage() {
  const router = useRouter();
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [resumo, setResumo] = useState<ResumoPontos>({
    totalPontos: 0,
    pontosGanhos: 0,
    pontosResgatados: 0,
    pontosExpirados: 0,
    valorTotalResgatado: 0,
  });
  const [carregando, setCarregando] = useState(true);
  const [filtros, setFiltros] = useState({
    programa: "todos",
    tipo: "todos",
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    busca: "",
  });

  useEffect(() => {
    buscarPontos();
  }, [filtros.mes, filtros.ano, filtros.programa, filtros.tipo]);

  const buscarPontos = async () => {
    try {
      setCarregando(true);
      const toastId = toast.loading("Carregando pontos...");

      const params = new URLSearchParams({
        mes: filtros.mes.toString(),
        ano: filtros.ano.toString(),
        programa: filtros.programa,
        tipo: filtros.tipo,
      });

      const response = await fetch(`/api/pontos?${params}`);

      if (!response.ok) throw new Error("Erro ao buscar pontos");

      const data = await response.json();

      setPontos(data.pontos);
      setResumo(data.resumo);

      toast.success("Pontos carregados", { id: toastId });
    } catch (error) {
      console.error("Erro ao buscar pontos:", error);
      toast.error("Erro ao carregar pontos");
    } finally {
      setCarregando(false);
    }
  };

  const formatarData = (data: Date): string => {
    return format(new Date(data), "dd/MM/yyyy", {
      locale: ptBR,
    });
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarPontos = (pontos: number) => {
    return new Intl.NumberFormat("pt-BR").format(pontos);
  };

  const obterCorTipo = (tipo: string) => {
    switch (tipo) {
      case "GANHO":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "RESGATE":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "EXPIRACAO":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const obterIconeTipo = (tipo: string) => {
    switch (tipo) {
      case "GANHO":
        return <TrendingUp className="h-4 w-4" />;
      case "RESGATE":
        return <Gift className="h-4 w-4" />;
      case "EXPIRACAO":
        return <Clock className="h-4 w-4" />;
      default:
        return <Coins className="h-4 w-4" />;
    }
  };

  const obterLabelTipo = (tipo: string) => {
    switch (tipo) {
      case "GANHO":
        return "Ganho";
      case "RESGATE":
        return "Resgate";
      case "EXPIRACAO":
        return "Expiração";
      default:
        return tipo;
    }
  };

  const programas = [
    { value: "todos", label: "Todos os programas" },
    { value: "LIVELO", label: "LIVELO" },
    { value: "SMILES", label: "SMILES" },
    { value: "TUDOAZUL", label: "TudoAzul" },
    { value: "LATAMPASS", label: "LATAM Pass" },
    { value: "OUTRO", label: "Outro" },
  ];

  const tipos = [
    { value: "todos", label: "Todos os tipos" },
    { value: "GANHO", label: "Ganhos" },
    { value: "RESGATE", label: "Resgates" },
    { value: "EXPIRACAO", label: "Expirações" },
  ];

  const meses = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];

  const anos = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  const pontosFiltrados = pontos.filter((ponto) =>
    ponto.descricao.toLowerCase().includes(filtros.busca.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 mt-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Coins className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Meus Pontos</h1>
            <p className="text-muted-foreground">
              Controle seus pontos de fidelidade
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/pontos/metas")}
        >
          <Target className="mr-2 h-4 w-4" />
          Metas
        </Button>
        <Button onClick={() => router.push("/dashboard/pontos/novo")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Lançamento
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="h-5 w-5 text-blue-600" />
              Total de Pontos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatarPontos(resumo.totalPontos)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Saldo atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Pontos Ganhos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              +{formatarPontos(resumo.pontosGanhos)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">No período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="h-5 w-5 text-blue-600" />
              Pontos Resgatados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              -{formatarPontos(resumo.pontosResgatados)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">No período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-600" />
              Valor Resgatado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatarMoeda(resumo.valorTotalResgatado)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Em reais</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <Button variant="outline" size="sm" onClick={buscarPontos}>
              Aplicar Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mes">Mês</Label>
              <Select
                value={filtros.mes.toString()}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, mes: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value.toString()}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ano">Ano</Label>
              <Select
                value={filtros.ano.toString()}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, ano: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((ano) => (
                    <SelectItem key={ano} value={ano.toString()}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="programa">Programa</Label>
              <Select
                value={filtros.programa}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, programa: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os programas" />
                </SelectTrigger>
                <SelectContent>
                  {programas.map((programa) => (
                    <SelectItem key={programa.value} value={programa.value}>
                      {programa.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={filtros.tipo}
                onValueChange={(value) =>
                  setFiltros({ ...filtros, tipo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  {tipos.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="busca">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="busca"
                placeholder="Buscar por descrição..."
                className="pl-8"
                value={filtros.busca}
                onChange={(e) =>
                  setFiltros({ ...filtros, busca: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Pontos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pontos</CardTitle>
          <CardDescription>
            {pontosFiltrados.length} lançamento(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : pontosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum ponto encontrado</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/dashboard/pontos/novo")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Primeiro Ponto
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Data</TableHead>
                    <TableHead className="text-center">Programa</TableHead>
                    <TableHead className="text-center">Descrição</TableHead>
                    <TableHead className="text-center">Tipo</TableHead>
                    <TableHead className="text-center">Pontos</TableHead>
                    <TableHead className="text-center">Valor Resgate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pontosFiltrados.map((ponto) => (
                    <TableRow key={ponto.id}>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          {formatarData(ponto.data)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        <Badge variant="outline">
                          {ponto.programa}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {ponto.descricao}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className={obterCorTipo(ponto.tipo)}
                        >
                          <div className="flex items-center gap-1">
                            {obterIconeTipo(ponto.tipo)}
                            {obterLabelTipo(ponto.tipo)}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div
                          className={`font-bold ${
                            ponto.tipo === "GANHO"
                              ? "text-green-600"
                              : ponto.tipo === "RESGATE"
                                ? "text-blue-600"
                                : "text-red-600"
                          }`}
                        >
                          {ponto.tipo === "GANHO" ? "+" : "-"}
                          {formatarPontos(ponto.quantidade)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {ponto.valorResgate ? (
                          <div className="font-medium text-green-600">
                            {formatarMoeda(ponto.valorResgate)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
