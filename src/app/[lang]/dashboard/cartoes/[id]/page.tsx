// app/dashboard/cartoes/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  CreditCard,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  Eye,
  Plus,
  MoreVertical,
  Tag,
  Users,
  UserPlus,
  Mail,
  User,
  Trash2,
  Bell,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FormEditarCartao } from "@/components/shared/FormEditarCartao";
import { useSession } from "next-auth/react";
import { ConviteColaboradorDialog } from "@/components/shared/ConviteColaboradorDialog";

interface Cartao {
  id: string;
  nome: string;
  bandeira: string;
  limite: number;
  diaFechamento: number;
  diaVencimento: number;
  cor: string;
  ativo: boolean;
  observacoes?: string;
  userId: string;

  // Informações do dono (para cartões compartilhados)
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string; // 👈 ADICIONE image AQUI
  };

  // ... resto da interface permanece igual
  ehCompartilhado?: boolean;
  lancamentos: Array<{
    id: string;
    descricao: string;
    valor: number;
    data: string;
    pago: boolean;
    tipo: string;
    categoria?: {
      id: string;
      nome: string;
      cor: string;
      icone: string;
    };
    Fatura: {
      status: string;
      mesReferencia: string;
    } | null;
  }>;

  Fatura: Array<{
    id: string;
    valorTotal: number;
    valorPago: number;
    status: string;
    mesReferencia: string;
    dataFechamento: string;
    dataVencimento: string;
    lancamentos: Array<{
      id: string;
      descricao: string;
      valor: number;
      data: string;
      categoria?: {
        id: string;
        nome: string;
        cor: string;
      };
    }>;
    PagamentoFatura: Array<{
      id: string;
      valor: number;
      data: string;
      metodo: string;
      observacoes?: string;
    }>;
  }>;

  ColaboradorCartao: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string; // 👈 Já está aqui
    };
    permissao: string;
  }>;

  ConviteCartao: Array<{
    id: string;
    emailConvidado: string;
    status: string;
    expiraEm: string;
  }>;
}

export default function DetalhesCartaoPage() {
  const params = useParams();
  const router = useRouter();
  const [cartao, setCartao] = useState<Cartao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [sheetEditarAberto, setSheetEditarAberto] = useState(false);
  const [enviandoConvite, setEnviandoConvite] = useState(false);
  const [emailConvidado, setEmailConvidado] = useState("");
  const [dialogConvidarAberto, setDialogConvidarAberto] = useState(false);
  const cartaoId = params.id as string;

  const session = useSession();

  useEffect(() => {
    if (cartaoId) {
      carregarCartao();
    }
  }, [cartaoId]);

  // Função para quando o convite for enviado com sucesso
  const handleConviteEnviado = () => {
    carregarCartao(); // Recarrega os dados
  };

  const carregarCartao = async () => {
    try {
      const response = await fetch(`/api/cartoes/${cartaoId}`);
      if (response.ok) {
        const data = await response.json();
        setCartao(data);
      } else {
        throw new Error("Erro ao carregar cartão");
      }
    } catch (error) {
      console.error("Erro ao carregar cartão:", error);
      toast.error("Erro ao carregar cartão");
    } finally {
      setCarregando(false);
    }
  };

  const handleConvidarColaborador = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailConvidado.trim()) {
      toast.error("Digite um email válido");
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailConvidado)) {
      toast.error("Digite um email válido");
      return;
    }

    setEnviandoConvite(true);
    try {
      const response = await fetch(`/api/cartoes/${cartaoId}/colaboradores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailConvidado: emailConvidado.trim() }),
      });

      if (response.ok) {
        toast.success("Convite enviado com sucesso!");
        setEmailConvidado(""); // Limpa o input
        setDialogConvidarAberto(false); // Fecha o dialog
        carregarCartao(); // Recarrega os dados para mostrar o convite pendente
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao enviar convite");
      }
    } catch (error: any) {
      console.error("Erro ao enviar convite:", error);
      toast.error(error.message || "Erro ao enviar convite");
    } finally {
      setEnviandoConvite(false);
    }
  };

  const handleRemoverColaborador = async (userId: string) => {
    try {
      console.log(
        `Tentando remover colaborador ${userId} do cartão ${cartaoId}`
      );

      const response = await fetch(
        `/api/cartoes/${cartaoId}/colaboradores/${userId}`,
        {
          method: "DELETE",
        }
      );

      console.log("Status da resposta:", response.status);
      console.log("Content-Type:", response.headers.get("content-type"));

      // Verificar se a resposta é JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("Resposta não é JSON:", textResponse.substring(0, 200));
        throw new Error("Resposta inválida do servidor");
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao remover colaborador");
      }

      toast.success("Colaborador removido com sucesso!");
      carregarCartao(); // Recarrega os dados
    } catch (error: any) {
      console.error("Erro completo ao remover colaborador:", error);
      toast.error(error.message || "Erro ao remover colaborador");
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ABERTA: "bg-blue-900/50 text-blue-300 border-blue-700",
      FECHADA: "bg-orange-900/50 text-orange-300 border-orange-700",
      PAGA: "bg-green-900/50 text-green-300 border-green-700",
      VENCIDA: "bg-red-900/50 text-red-300 border-red-700",
    };
    return (
      colors[status as keyof typeof colors] ||
      "bg-gray-900/50 text-gray-300 border-gray-700"
    );
  };

  const calcularUtilizacao = () => {
    if (!cartao) return 0;
    const lancamentosAtivos = cartao.lancamentos.filter(
      (l) => !l.pago && l.Fatura?.status !== "PAGA"
    );
    const total = lancamentosAtivos.reduce((sum, l) => sum + l.valor, 0);
    return (total / cartao.limite) * 100;
  };

  const calcularTotalFaturaAtual = () => {
    if (!cartao) return 0;
    const lancamentosAtivos = cartao.lancamentos.filter(
      (l) => !l.pago && l.Fatura?.status !== "PAGA"
    );
    const total = lancamentosAtivos.reduce((sum, l) => sum + l.valor, 0);
    return total;
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarData = (dataString: string) => {
    if (!dataString || dataString === "Invalid Date") return "Data inválida";
    const dataPart = dataString.substring(0, 10);
    const [ano, mes, dia] = dataPart.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  // Componente para mostrar colaboradores
  const ColaboradoresSection = () => {
    if (!cartao) return null;

    // Verificar se o usuário atual é o dono do cartão
    const usuarioAtualEhDono = cartao.userId === session?.data?.user?.id;
    const usuarioAtualEhColaborador = cartao.ColaboradorCartao.some(
      (colab) => colab.user.id === session?.data?.user?.id
    );

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">Colaboradores</p>
          {/* Só mostrar botão de convidar se for o dono do cartão */}
          {usuarioAtualEhDono && (
            <Dialog
              open={dialogConvidarAberto}
              onOpenChange={setDialogConvidarAberto}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Convidar
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-800 text-white">
                <DialogHeader>
                  <DialogTitle>Convidar Colaborador</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Envie um convite para alguém acessar este cartão
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={handleConvidarColaborador}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">
                      Email do Colaborador
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={emailConvidado}
                      onChange={(e) => setEmailConvidado(e.target.value)}
                      placeholder="colaborador@email.com"
                      className="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogConvidarAberto(false)}
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={enviandoConvite}
                      className="bg-white text-gray-900 hover:bg-gray-100"
                    >
                      {enviandoConvite ? "Enviando..." : "Enviar Convite"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Lista de Colaboradores */}
        <div className="space-y-2">
          {/* Dono do Cartão */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800/30">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={cartao.user?.image || ""} />
                <AvatarFallback className="bg-blue-600 text-white text-xs">
                  {cartao.user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-white">
                  {cartao.user?.name || "Usuário"}
                  {usuarioAtualEhDono && " (Você)"}
                </p>
                <p className="text-xs text-gray-400">{cartao.user?.email}</p>
              </div>
            </div>
            <Badge className="bg-blue-900/50 text-blue-300 border-blue-700">
              Dono
            </Badge>
          </div>

          {/* Colaboradores */}
          {cartao.ColaboradorCartao.map((colaborador) => {
            const ehUsuarioAtual =
              colaborador.user.id === session?.data?.user?.id;
            return (
              <div
                key={colaborador.id}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={colaborador.user.image || ""} />
                    <AvatarFallback className="bg-green-600 text-white text-xs">
                      {colaborador.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {colaborador.user.name}
                      {ehUsuarioAtual && " (Você)"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {colaborador.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-900/50 text-green-300 border-green-700">
                    {colaborador.permissao === "LEITURA"
                      ? "Colaborador"
                      : "Escrita"}
                  </Badge>
                  {/* Só mostrar botão de remover se for o dono do cartão */}
                  {usuarioAtualEhDono && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleRemoverColaborador(colaborador.user.id)
                      }
                      className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Convites Pendentes - Só mostrar para o dono */}
          {usuarioAtualEhDono &&
            cartao.ConviteCartao.map((convite) => (
              <div
                key={convite.id}
                className="flex items-center justify-between p-2 rounded-lg bg-yellow-900/20 border border-yellow-800/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-yellow-600 text-white text-xs">
                      <Bell className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-yellow-300">
                      {convite.emailConvidado}
                    </p>
                    <p className="text-xs text-yellow-400">
                      Convite pendente - Expira {formatarData(convite.expiraEm)}
                    </p>
                  </div>
                </div>
                <Badge className="bg-yellow-900/50 text-yellow-300 border-yellow-700">
                  Pendente
                </Badge>
              </div>
            ))}

          {cartao.ColaboradorCartao.length === 0 &&
            (!usuarioAtualEhDono || cartao.ConviteCartao.length === 0) && (
              <div className="text-center py-4 text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum colaborador</p>
                {usuarioAtualEhDono && (
                  <p className="text-xs">Convide alguém para colaborar</p>
                )}
              </div>
            )}
        </div>
      </div>
    );
  };

  if (carregando) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-8 bg-gray-800 rounded w-64 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-40 bg-gray-800 rounded-lg animate-pulse" />
              <div className="h-96 bg-gray-800 rounded-lg animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="h-48 bg-gray-800 rounded-lg animate-pulse" />
              <div className="h-32 bg-gray-800 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cartao) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Cartão não encontrado
          </h1>
          <Button
            onClick={() => router.push("/dashboard/cartoes")}
            className="bg-white text-gray-900 hover:bg-gray-100"
          >
            Voltar para Cartões
          </Button>
        </div>
      </div>
    );
  }

  const utilizacao = calcularUtilizacao();
  const totalFaturaAtual = calcularTotalFaturaAtual();
  const faturaAberta = cartao.Fatura.find((f) => f.status === "ABERTA");
  const lancamentosRecentes = cartao.lancamentos.slice(0, 10);
  const hoje = new Date();

  // Encontrar a próxima fatura que ainda não venceu
  const proximaFatura = cartao.Fatura.filter(
    (fatura) => new Date(fatura.dataVencimento) >= hoje
  ).sort(
    (a, b) =>
      new Date(a.dataVencimento).getTime() -
      new Date(b.dataVencimento).getTime()
  )[0];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/dashboard/cartoes")}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-8 rounded"
                style={{ backgroundColor: cartao.cor }}
              />
              <div>
                <h1 className="text-3xl font-bold text-white">{cartao.nome}</h1>
                {cartao.ehCompartilhado && cartao.user && (
                  <p className="text-sm text-gray-400">
                    Compartilhado por {cartao.user.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/dashboard/cartoes/${cartaoId}/faturas`)
              }
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Faturas
            </Button>
            <Button
              variant="outline"
              onClick={() => setSheetEditarAberto(true)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Cartão
            </Button>
          </div>
        </div>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Informações do Cartão */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CreditCard className="h-5 w-5" />
                Informações do Cartão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Bandeira</p>
                  <p className="text-white capitalize">
                    {cartao.bandeira.toLowerCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Limite Total</p>
                  <p className="text-xl font-bold text-white">
                    {formatarMoeda(cartao.limite)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Fechamento</p>
                    <p className="text-white flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Dia {cartao.diaFechamento}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Vencimento</p>
                    <p className="text-white flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Dia {cartao.diaVencimento}
                    </p>
                  </div>
                </div>

                {/* 👇 SEÇÃO DE COLABORADORES ADICIONADA AQUI */}
                <div className="pt-3 border-t border-gray-800">
                  <ColaboradoresSection />
                </div>

                {cartao.observacoes && (
                  <div>
                    <p className="text-sm text-gray-400">Observações</p>
                    <p className="text-sm text-gray-300">
                      {cartao.observacoes}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-800">
                <Button
                  className="w-full bg-white text-gray-900 hover:bg-gray-100"
                  onClick={() => router.push("/dashboard/lancamentos/")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Lançamento
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Status do Limite */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5" />
                Status do Limite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-400">Utilizado</p>
                  <p className="text-2xl font-bold text-white">
                    {formatarMoeda(totalFaturaAtual)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-400">Disponível</p>
                  <p className="text-2xl font-bold text-white">
                    {formatarMoeda(cartao.limite - totalFaturaAtual)}
                  </p>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Utilização do limite</span>
                  <span
                    className={`font-medium ${
                      utilizacao >= 90
                        ? "text-red-400"
                        : utilizacao >= 70
                          ? "text-orange-400"
                          : "text-green-400"
                    }`}
                  >
                    {utilizacao.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      utilizacao >= 90
                        ? "bg-red-500"
                        : utilizacao >= 70
                          ? "bg-orange-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(utilizacao, 100)}%` }}
                  />
                </div>
              </div>

              {utilizacao >= 70 && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    utilizacao >= 90
                      ? "bg-red-900/50 text-red-300 border border-red-800"
                      : "bg-orange-900/50 text-orange-300 border border-orange-800"
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {utilizacao >= 90
                      ? "Limite quase esgotado - considere reduzir gastos"
                      : "Limite elevado - atenção aos próximos gastos"}
                  </span>
                </div>
              )}

              {/* Fatura Atual */}
              {proximaFatura && (
                <div className="pt-4 border-t border-gray-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Próxima fatura:</span>
                    <span className="text-lg font-bold text-white">
                      {formatarMoeda(proximaFatura.valorTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Vencimento:</span>
                    <span className="text-white">
                      {formatarData(proximaFatura.dataVencimento)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Status:</span>
                    <Badge className={getStatusColor(proximaFatura.status)}>
                      {proximaFatura.status === "ABERTA"
                        ? "Em aberto"
                        : proximaFatura.status === "FECHADA"
                          ? "Fechada"
                          : proximaFatura.status === "PAGA"
                            ? "Paga"
                            : "Vencida"}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Card 3: Ranking de Despesas por Categoria */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">
                Despesas por Categoria
              </CardTitle>
              <CardDescription className="text-gray-400">
                Distribuição dos gastos por categoria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                // Calcular despesas por categoria
                const despesasPorCategoria = cartao.lancamentos
                  .filter((lancamento) => lancamento.tipo === "DESPESA") // Apenas despesas
                  .reduce(
                    (acc, lancamento) => {
                      const categoriaNome =
                        lancamento.categoria?.nome || "Sem Categoria";
                      if (!acc[categoriaNome]) {
                        acc[categoriaNome] = {
                          total: 0,
                          cor: lancamento.categoria?.cor || "#6B7280",
                          icone: lancamento.categoria?.icone || "Tag",
                        };
                      }
                      acc[categoriaNome].total += lancamento.valor;
                      return acc;
                    },
                    {} as Record<
                      string,
                      { total: number; cor: string; icone: string }
                    >
                  );

                // Converter para array e ordenar do maior para o menor
                const rankingCategorias = Object.entries(despesasPorCategoria)
                  .sort(([, a], [, b]) => b.total - a.total)
                  .slice(0, 5); // Top 5 categorias

                const totalDespesas = rankingCategorias.reduce(
                  (sum, [, categoria]) => sum + categoria.total,
                  0
                );

                if (rankingCategorias.length === 0) {
                  return (
                    <div className="text-center py-4">
                      <p className="text-gray-400">
                        Nenhuma despesa encontrada
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {rankingCategorias.map(
                      ([categoriaNome, categoriaData], index) => {
                        const porcentagem =
                          totalDespesas > 0
                            ? (categoriaData.total / totalDespesas) * 100
                            : 0;

                        // Função para obter o ícone da categoria
                        const getIcone = (icone: string) => {
                          try {
                            const IconComponent =
                              require("lucide-react")[icone];
                            return (
                              <IconComponent className="w-3 h-3 text-white" />
                            );
                          } catch {
                            return <Tag className="w-3 h-3 text-white" />;
                          }
                        };

                        return (
                          <div
                            key={categoriaNome}
                            className="flex justify-between items-center p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: categoriaData.cor }}
                              >
                                {getIcone(categoriaData.icone)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">
                                  {categoriaNome}
                                </p>
                                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                                  <div
                                    className="h-1.5 rounded-full"
                                    style={{
                                      backgroundColor: categoriaData.cor,
                                      width: `${porcentagem}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <p className="text-white font-medium">
                                {formatarMoeda(categoriaData.total)}
                              </p>
                              <p className="text-xs text-gray-400">
                                {porcentagem.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        );
                      }
                    )}

                    {/* Total geral */}
                    <div className="pt-3 border-t border-gray-800">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Total:</span>
                        <span className="text-white font-bold">
                          {formatarMoeda(totalDespesas)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-3 border-t border-gray-800">
                <Button
                  variant="outline"
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                  onClick={() =>
                    router.push(`/dashboard/relatorios?cartaoId=${cartaoId}`)
                  }
                >
                  Ver Relatório Completo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card 4: Lançamentos Recentes */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Lançamentos Recentes</CardTitle>
            <CardDescription className="text-gray-400">
              {cartao.lancamentos.length} lançamentos realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cartao.lancamentos.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Nenhum lançamento encontrado</p>
                <Button
                  className="mt-4 bg-white text-gray-900 hover:bg-gray-100"
                  onClick={() =>
                    router.push(
                      `/dashboard/lancamentos/novo?cartaoId=${cartaoId}`
                    )
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Lançamento
                </Button>
              </div>
            ) : (
              <div className="border border-gray-800 rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-gray-800/50">
                      <TableHead className="text-gray-300">Descrição</TableHead>
                      <TableHead className="text-gray-300">Data</TableHead>
                      <TableHead className="text-gray-300">Valor</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Fatura</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lancamentosRecentes.map((lancamento) => (
                      <TableRow
                        key={lancamento.id}
                        className="border-gray-800 hover:bg-gray-800/50"
                      >
                        <TableCell className="font-medium text-white">
                          {lancamento.descricao}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {formatarData(lancamento.data)}
                        </TableCell>
                        <TableCell className="text-white">
                          {formatarMoeda(lancamento.valor)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={lancamento.pago ? "default" : "secondary"}
                            className={
                              lancamento.pago
                                ? "bg-green-900/50 text-green-300 border-green-700"
                                : "bg-yellow-900/50 text-yellow-300 border-yellow-700"
                            }
                          >
                            {lancamento.pago ? "Pago" : "Pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {lancamento.Fatura ? (
                            <Badge
                              className={getStatusColor(
                                lancamento.Fatura.status
                              )}
                            >
                              {lancamento.Fatura.mesReferencia}
                            </Badge>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {cartao.lancamentos.length > 10 && (
              <Button
                variant="outline"
                className="w-full mt-4 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                onClick={() =>
                  router.push(`/dashboard/lancamentos?cartaoId=${cartaoId}`)
                }
              >
                Ver todos os lançamentos
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={sheetEditarAberto} onOpenChange={setSheetEditarAberto}>
        <SheetContent className="bg-gray-900 border-gray-800 text-white overflow-y-auto w-full sm:max-w-2xl">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white">Editar Cartão</SheetTitle>
            <SheetDescription className="text-gray-400">
              Atualize as informações do seu cartão
            </SheetDescription>
          </SheetHeader>

          <FormEditarCartao
            cartao={cartao}
            onSalvo={() => {
              setSheetEditarAberto(false);
              carregarCartao(); // Recarrega os dados
            }}
            onCancelar={() => setSheetEditarAberto(false)}
          />
        </SheetContent>
      </Sheet>
      <ConviteColaboradorDialog
        open={dialogConvidarAberto}
        onOpenChange={setDialogConvidarAberto}
        cartaoId={cartaoId}
        onConviteEnviado={handleConviteEnviado}
      />
    </div>
  );
}
