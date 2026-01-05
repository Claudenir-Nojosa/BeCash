// app/dashboard/cartoes/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
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
  TrendingUp,
  Eye,
  Plus,
  Tag,
  Users,
  UserPlus,
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
import { Loading } from "@/components/ui/loading-barrinhas";

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
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
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
      image?: string;
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
  const { t, i18n } = useTranslation("cartaoDetalhes");
  const [cartao, setCartao] = useState<Cartao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [sheetEditarAberto, setSheetEditarAberto] = useState(false);
  const [enviandoConvite, setEnviandoConvite] = useState(false);
  const [emailConvidado, setEmailConvidado] = useState("");
  const [dialogConvidarAberto, setDialogConvidarAberto] = useState(false);
  const cartaoId = params.id as string;
  const session = useSession();

  const getLocalizedPath = (path: string) => {
    return `/${i18n.language}${path}`;
  };

  useEffect(() => {
    if (cartaoId) {
      carregarCartao();
    }
  }, [cartaoId]);

  const handleConviteEnviado = () => {
    carregarCartao();
  };

  const carregarCartao = async () => {
    try {
      const response = await fetch(`/api/cartoes/${cartaoId}`);
      if (response.ok) {
        const data = await response.json();
        setCartao(data);
      } else {
        throw new Error(t("mensagens.erroCarregar"));
      }
    } catch (error) {
      console.error(t("mensagens.erroCarregar"), error);
      toast.error(t("mensagens.erroCarregar"));
    } finally {
      setCarregando(false);
    }
  };

  const handleConvidarColaborador = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailConvidado.trim()) {
      toast.error(t("mensagens.emailInvalido"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailConvidado)) {
      toast.error(t("mensagens.emailInvalido"));
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
        toast.success(t("mensagens.conviteEnviado"));
        setEmailConvidado("");
        setDialogConvidarAberto(false);
        carregarCartao();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || t("mensagens.erroEnviarConvite"));
      }
    } catch (error: any) {
      console.error(t("mensagens.erroEnviarConvite"), error);
      toast.error(error.message || t("mensagens.erroEnviarConvite"));
    } finally {
      setEnviandoConvite(false);
    }
  };

  const handleRemoverColaborador = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/cartoes/${cartaoId}/colaboradores/${userId}`,
        { method: "DELETE" }
      );

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("Resposta não é JSON:", textResponse.substring(0, 200));
        throw new Error("Resposta inválida do servidor");
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t("mensagens.erroRemoverColaborador"));
      }

      toast.success(t("mensagens.colaboradorRemovido"));
      carregarCartao();
    } catch (error: any) {
      console.error(t("mensagens.erroRemoverColaborador"), error);
      toast.error(error.message || t("mensagens.erroRemoverColaborador"));
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ABERTA:
        "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700",
      FECHADA:
        "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700",
      PAGA: "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700",
      VENCIDA:
        "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700",
    };
    return (
      colors[status as keyof typeof colors] ||
      "bg-gray-100 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700"
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
    return lancamentosAtivos.reduce((sum, l) => sum + l.valor, 0);
  };

  const formatarMoeda = (valor: number) => {
    const locale = i18n.language === "pt" ? "pt-BR" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarData = (dataString: string) => {
    if (!dataString || dataString === "Invalid Date") return "Data inválida";
    const locale = i18n.language === "pt" ? "pt-BR" : "en-US";
    const dataPart = dataString.substring(0, 10);
    const [ano, mes, dia] = dataPart.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const ColaboradoresSection = () => {
    if (!cartao) return null;

    const usuarioAtualEhDono = cartao.userId === session?.data?.user?.id;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700 dark:text-gray-400">
            {t("titulos.colaboradores")}
          </p>
          {usuarioAtualEhDono && (
            <Dialog
              open={dialogConvidarAberto}
              onOpenChange={setDialogConvidarAberto}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  {t("botoes.convidar")}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white">
                <DialogHeader>
                  <DialogTitle className="text-gray-900 dark:text-white">
                    {t("dialogs.convidarTitulo")}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-400">
                    {t("dialogs.convidarDescricao")}
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={handleConvidarColaborador}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-gray-900 dark:text-white"
                    >
                      {t("labels.emailColaborador")}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={emailConvidado}
                      onChange={(e) => setEmailConvidado(e.target.value)}
                      placeholder="colaborador@email.com"
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogConvidarAberto(false)}
                      className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      {t("botoes.cancelar")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={enviandoConvite}
                      className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900"
                    >
                      {enviandoConvite
                        ? t("botoes.enviando")
                        : t("botoes.enviarConvite")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="space-y-2">
          {/* Dono do Cartão */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-gray-800/30 border border-blue-200 dark:border-gray-700">
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
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {cartao.user?.name || "Usuário"}
                  {usuarioAtualEhDono && t("badges.voce")}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {cartao.user?.email}
                </p>
              </div>
            </div>
            <Badge className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
              {t("badges.dono")}
            </Badge>
          </div>

          {/* Colaboradores */}
          {cartao.ColaboradorCartao.map((colaborador) => {
            const ehUsuarioAtual =
              colaborador.user.id === session?.data?.user?.id;
            return (
              <div
                key={colaborador.id}
                className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-gray-800/30 border border-green-200 dark:border-gray-700 hover:bg-green-100 dark:hover:bg-gray-800/50 transition-colors"
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
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {colaborador.user.name}
                      {ehUsuarioAtual && t("badges.voce")}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {colaborador.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                    {colaborador.permissao === "LEITURA"
                      ? t("badges.colaborador")
                      : t("badges.escrita")}
                  </Badge>
                  {usuarioAtualEhDono && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleRemoverColaborador(colaborador.user.id)
                      }
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Convites Pendentes */}
          {usuarioAtualEhDono &&
            cartao.ConviteCartao.map((convite) => (
              <div
                key={convite.id}
                className="flex items-center justify-between p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-yellow-500 dark:bg-yellow-600 text-white text-xs">
                      <Bell className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      {convite.emailConvidado}
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                      {t("mensagens.convitePendente", {
                        data: formatarData(convite.expiraEm),
                      })}
                    </p>
                  </div>
                </div>
                <Badge className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700">
                  {t("status.pendenteBadge")}
                </Badge>
              </div>
            ))}

          {cartao.ColaboradorCartao.length === 0 &&
            (!usuarioAtualEhDono || cartao.ConviteCartao.length === 0) && (
              <div className="text-center py-4 text-gray-600 dark:text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t("mensagens.nenhumColaborador")}</p>
                {usuarioAtualEhDono && (
                  <p className="text-xs">{t("mensagens.convideAlguem")}</p>
                )}
              </div>
            )}
        </div>
      </div>
    );
  };

  if (carregando) {
    return <Loading />;
  }

  if (!cartao) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t("mensagens.cartaoNaoEncontrado")}
          </h1>
          <Button
            onClick={() => router.push(getLocalizedPath("/dashboard/cartoes"))}
            className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900"
          >
            {t("botoes.voltar")}
          </Button>
        </div>
      </div>
    );
  }

  const utilizacao = calcularUtilizacao();
  const totalFaturaAtual = calcularTotalFaturaAtual();
  const lancamentosRecentes = cartao.lancamentos.slice(0, 10);
  const hoje = new Date();

  const proximaFatura = cartao.Fatura.filter(
    (fatura) => new Date(fatura.dataVencimento) >= hoje
  ).sort(
    (a, b) =>
      new Date(a.dataVencimento).getTime() -
      new Date(b.dataVencimento).getTime()
  )[0];

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-white dark:bg-transparent">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                router.push(getLocalizedPath("/dashboard/cartoes"))
              }
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-8 rounded"
                style={{ backgroundColor: cartao.cor }}
              />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {cartao.nome}
                </h1>
                {cartao.ehCompartilhado && cartao.user && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("labels.compartilhadoPor", { nome: cartao.user.name })}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  getLocalizedPath(`/dashboard/cartoes/${cartaoId}/faturas`)
                )
              }
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
            >
              <Eye className="h-4 w-4 mr-2" />
              {t("botoes.verFaturas")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setSheetEditarAberto(true)}
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              {t("botoes.editarCartao")}
            </Button>
          </div>
        </div>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Informações do Cartão */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <CreditCard className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                </div>
                {t("titulos.informacoes")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("labels.bandeira")}
                  </p>
                  <p className="text-gray-900 dark:text-white capitalize">
                    {cartao.bandeira.toLowerCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("labels.limiteTotal")}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatarMoeda(cartao.limite)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("labels.fechamento")}
                    </p>
                    <p className="text-gray-900 dark:text-white flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {t("labels.dia", { dia: cartao.diaFechamento })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("labels.vencimento")}
                    </p>
                    <p className="text-gray-900 dark:text-white flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {t("labels.dia", { dia: cartao.diaVencimento })}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                  <ColaboradoresSection />
                </div>

                {cartao.observacoes && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("labels.observacoes")}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {cartao.observacoes}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <Button
                  className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white"
                  onClick={() =>
                    router.push(getLocalizedPath("/dashboard/lancamentos/"))
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("botoes.novoLancamento")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Status do Limite */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                {t("titulos.statusLimite")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("labels.utilizado")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatarMoeda(totalFaturaAtual)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("labels.disponivel")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatarMoeda(cartao.limite - totalFaturaAtual)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t("labels.utilizacaoLimite")}
                  </span>
                  <span
                    className={`font-medium ${
                      utilizacao >= 90
                        ? "text-red-600 dark:text-red-400"
                        : utilizacao >= 70
                          ? "text-amber-600 dark:text-orange-400"
                          : "text-emerald-600 dark:text-green-400"
                    }`}
                  >
                    {utilizacao.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      utilizacao >= 90
                        ? "bg-red-500"
                        : utilizacao >= 70
                          ? "bg-amber-500 dark:bg-orange-500"
                          : "bg-emerald-500 dark:bg-green-500"
                    }`}
                    style={{ width: `${Math.min(utilizacao, 100)}%` }}
                  />
                </div>
              </div>

              {utilizacao >= 70 && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    utilizacao >= 90
                      ? "bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                      : "bg-amber-50 dark:bg-orange-900/50 text-amber-700 dark:text-orange-300 border border-amber-200 dark:border-orange-800"
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {utilizacao >= 90
                      ? t("alertas.limiteCritico")
                      : t("alertas.limiteElevado")}
                  </span>
                </div>
              )}

              {/* Fatura Atual */}
              {proximaFatura && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t("labels.proximaFatura")}
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatarMoeda(proximaFatura.valorTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t("labels.vencimento")}
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {formatarData(proximaFatura.dataVencimento)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t("labels.status")}
                    </span>
                    <Badge className={getStatusColor(proximaFatura.status)}>
                      {proximaFatura.status === "ABERTA"
                        ? t("status.aberta")
                        : proximaFatura.status === "FECHADA"
                          ? t("status.fechada")
                          : proximaFatura.status === "PAGA"
                            ? t("status.paga")
                            : t("status.vencida")}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Ranking de Despesas por Categoria */}
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                {t("titulos.despesasCategoria")}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {t("subtitulos.distribuicaoGastos")}
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
                      <p className="text-gray-700 dark:text-gray-400">
                        {t("mensagens.nenhumaDespesa")}
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
                            className="flex justify-between items-center p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/50 hover:bg-gray-100/80 dark:hover:bg-gray-800/70 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: categoriaData.cor }}
                              >
                                {getIcone(categoriaData.icone)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-900 dark:text-white text-sm font-medium truncate">
                                  {categoriaNome}
                                </p>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
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
                              <p className="text-gray-900 dark:text-white font-medium">
                                {formatarMoeda(categoriaData.total)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {porcentagem.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        );
                      }
                    )}

                    {/* Total geral */}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">
                          Total:
                        </span>
                        <span className="text-gray-900 dark:text-white font-bold">
                          {formatarMoeda(totalDespesas)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                <Button
                  variant="outline"
                  className="w-full border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  onClick={() =>
                    router.push(`/dashboard/relatorios?cartaoId=${cartaoId}`)
                  }
                >
                  {t("botoes.verRelatorioCompleto")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card 4: Lançamentos Recentes */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              {t("titulos.lancamentosRecentes")}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {t("subtitulos.totalLancamentos", {
                count: cartao.lancamentos.length,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cartao.lancamentos.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {t("mensagens.nenhumLancamento")}
                </p>
                <Button
                  className="mt-4 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white"
                  onClick={() =>
                    router.push(
                      `/dashboard/lancamentos/novo?cartaoId=${cartaoId}`
                    )
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("botoes.adicionarPrimeiro")}
                </Button>
              </div>
            ) : (
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
                      <TableHead className="text-gray-700 dark:text-gray-300">
                        {t("labels.descricao")}
                      </TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">
                        {t("labels.data")}
                      </TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">
                        {t("labels.valor")}
                      </TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">
                        {t("labels.status")}
                      </TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">
                        {t("labels.fatura")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lancamentosRecentes.map((lancamento) => (
                      <TableRow
                        key={lancamento.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                      >
                        <TableCell className="font-medium text-gray-900 dark:text-white">
                          {lancamento.descricao}
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-300">
                          {formatarData(lancamento.data)}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-white">
                          {formatarMoeda(lancamento.valor)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={lancamento.pago ? "default" : "secondary"}
                            className={
                              lancamento.pago
                                ? "bg-emerald-100 dark:bg-green-900/50 text-emerald-700 dark:text-green-300 border-emerald-200 dark:border-green-700"
                                : "bg-amber-100 dark:bg-yellow-900/50 text-amber-700 dark:text-yellow-300 border-amber-200 dark:border-yellow-700"
                            }
                          >
                            {lancamento.pago
                              ? t("status.pago")
                              : t("status.pendenteBadge")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-300">
                          {lancamento.Fatura ? (
                            <Badge
                              className={getStatusColor(
                                lancamento.Fatura.status
                              )}
                            >
                              {lancamento.Fatura.mesReferencia}
                            </Badge>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-500">
                              -
                            </span>
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
                className="w-full mt-4 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                onClick={() =>
                  router.push(`/dashboard/lancamentos?cartaoId=${cartaoId}`)
                }
              >
                {t("botoes.verTodosLancamentos")}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={sheetEditarAberto} onOpenChange={setSheetEditarAberto}>
        <SheetContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white overflow-y-auto w-full sm:max-w-2xl">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-gray-900 dark:text-white">
              {t("titulos.editarCartao")}
            </SheetTitle>
            <SheetDescription className="text-gray-600 dark:text-gray-400">
              {t("subtitulos.atualizarInformacoes")}
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
