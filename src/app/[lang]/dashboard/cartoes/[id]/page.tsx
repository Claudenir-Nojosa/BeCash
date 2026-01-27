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
import { motion, AnimatePresence } from "framer-motion";
import { getFallback } from "@/lib/i18nFallback";

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
  const session = useSession();
  const cartaoId = params.id as string;
  const currentLang = i18n.language || "pt";

  // Função auxiliar para obter tradução com fallback
  const getTranslation = (key: string) => {
    // Primeiro tenta usar o i18n
    const translation = t(key);
    if (translation && translation !== key) {
      return translation;
    }

    // Fallback manual baseado nas chaves que você tem nos arquivos JSON
    switch (key) {
      // Títulos
      case "titulos.informacoes":
        return getFallback(currentLang, "Informações do Cartão", "Card Information");
      case "titulos.statusLimite":
        return getFallback(currentLang, "Status do Limite", "Limit Status");
      case "titulos.despesasCategoria":
        return getFallback(currentLang, "Despesas por Categoria", "Expenses by Category");
      case "titulos.lancamentosRecentes":
        return getFallback(currentLang, "Lançamentos Recentes", "Recent Transactions");
      case "titulos.colaboradores":
        return getFallback(currentLang, "Colaboradores", "Collaborators");
      case "titulos.editarCartao":
        return getFallback(currentLang, "Editar Cartão", "Edit Card");

      // Subtítulos
      case "subtitulos.distribuicaoGastos":
        return getFallback(currentLang, "Distribuição dos gastos por categoria", "Expense distribution by category");
      case "subtitulos.totalLancamentos":
        return getFallback(currentLang, "{{count}} lançamentos realizados", "{{count}} transactions made");
      case "subtitulos.atualizarInformacoes":
        return getFallback(currentLang, "Atualize as informações do seu cartão", "Update your card information");

      // Labels
      case "labels.bandeira":
        return getFallback(currentLang, "Bandeira", "Brand");
      case "labels.limiteTotal":
        return getFallback(currentLang, "Limite Total", "Total Limit");
      case "labels.fechamento":
        return getFallback(currentLang, "Fechamento", "Closing");
      case "labels.vencimento":
        return getFallback(currentLang, "Vencimento", "Due Date");
      case "labels.observacoes":
        return getFallback(currentLang, "Observações", "Notes");
      case "labels.utilizado":
        return getFallback(currentLang, "Utilizado", "Used");
      case "labels.disponivel":
        return getFallback(currentLang, "Disponível", "Available");
      case "labels.utilizacaoLimite":
        return getFallback(currentLang, "Utilização do limite", "Limit usage");
      case "labels.proximaFatura":
        return getFallback(currentLang, "Próxima fatura:", "Next invoice:");
      case "labels.status":
        return getFallback(currentLang, "Status:", "Status:");
      case "labels.descricao":
        return getFallback(currentLang, "Descrição", "Description");
      case "labels.data":
        return getFallback(currentLang, "Data", "Date");
      case "labels.valor":
        return getFallback(currentLang, "Valor", "Amount");
      case "labels.fatura":
        return getFallback(currentLang, "Fatura", "Invoice");
      case "labels.emailColaborador":
        return getFallback(currentLang, "Email do Colaborador", "Collaborator's Email");
      case "labels.dia":
        return getFallback(currentLang, "Dia {{dia}}", "Day {{dia}}");
      case "labels.compartilhadoPor":
        return getFallback(currentLang, "Compartilhado por {{nome}}", "Shared by {{nome}}");

      // Botões
      case "botoes.voltar":
        return getFallback(currentLang, "Voltar para Cartões", "Back to Cards");
      case "botoes.verFaturas":
        return getFallback(currentLang, "Ver Faturas", "View Invoices");
      case "botoes.editarCartao":
        return getFallback(currentLang, "Editar Cartão", "Edit Card");
      case "botoes.novoLancamento":
        return getFallback(currentLang, "Novo Lançamento", "New Transaction");
      case "botoes.convidar":
        return getFallback(currentLang, "Convidar", "Invite");
      case "botoes.cancelar":
        return getFallback(currentLang, "Cancelar", "Cancel");
      case "botoes.enviarConvite":
        return getFallback(currentLang, "Enviar Convite", "Send Invite");
      case "botoes.enviando":
        return getFallback(currentLang, "Enviando...", "Sending...");
      case "botoes.verRelatorioCompleto":
        return getFallback(currentLang, "Ver Relatório Completo", "View Full Report");
      case "botoes.verTodosLancamentos":
        return getFallback(currentLang, "Ver todos os lançamentos", "View all transactions");
      case "botoes.adicionarPrimeiro":
        return getFallback(currentLang, "Adicionar Primeiro Lançamento", "Add First Transaction");

      // Status
      case "status.pago":
        return getFallback(currentLang, "Pago", "Paid");
      case "status.pendente":
        return getFallback(currentLang, "Pendente", "Pending");
      case "status.aberta":
        return getFallback(currentLang, "Em aberto", "Open");
      case "status.fechada":
        return getFallback(currentLang, "Fechada", "Closed");
      case "status.paga":
        return getFallback(currentLang, "Paga", "Paid");
      case "status.vencida":
        return getFallback(currentLang, "Vencida", "Overdue");
      case "status.pendenteBadge":
        return getFallback(currentLang, "Pendente", "Pending");

      // Badges
      case "badges.dono":
        return getFallback(currentLang, "Dono", "Owner");
      case "badges.voce":
        return getFallback(currentLang, " (Você)", " (You)");
      case "badges.colaborador":
        return getFallback(currentLang, "Colaborador", "Collaborator");
      case "badges.escrita":
        return getFallback(currentLang, "Escrita", "Write");

      // Alertas
      case "alertas.limiteCritico":
        return getFallback(currentLang, "Limite quase esgotado - considere reduzir gastos", "Limit almost exhausted - consider reducing spending");
      case "alertas.limiteElevado":
        return getFallback(currentLang, "Limite elevado - atenção aos próximos gastos", "High limit - watch next expenses");

      // Mensagens
      case "mensagens.cartaoNaoEncontrado":
        return getFallback(currentLang, "Cartão não encontrado", "Card not found");
      case "mensagens.nenhumLancamento":
        return getFallback(currentLang, "Nenhum lançamento encontrado", "No transactions found");
      case "mensagens.nenhumaDespesa":
        return getFallback(currentLang, "Nenhuma despesa encontrada", "No expenses found");
      case "mensagens.nenhumColaborador":
        return getFallback(currentLang, "Nenhum colaborador", "No collaborators");
      case "mensagens.convideAlguem":
        return getFallback(currentLang, "Convide alguém para colaborar", "Invite someone to collaborate");
      case "mensagens.convitePendente":
        return getFallback(currentLang, "Convite pendente - Expira {{data}}", "Pending invite - Expires {{data}}");
      case "mensagens.conviteEnviado":
        return getFallback(currentLang, "Convite enviado com sucesso!", "Invite sent successfully!");
      case "mensagens.colaboradorRemovido":
        return getFallback(currentLang, "Colaborador removido com sucesso!", "Collaborator removed successfully!");
      case "mensagens.emailInvalido":
        return getFallback(currentLang, "Digite um email válido", "Enter a valid email");
      case "mensagens.erroCarregar":
        return getFallback(currentLang, "Erro ao carregar cartão", "Error loading card");
      case "mensagens.erroEnviarConvite":
        return getFallback(currentLang, "Erro ao enviar convite", "Error sending invite");
      case "mensagens.erroRemoverColaborador":
        return getFallback(currentLang, "Erro ao remover colaborador", "Error removing collaborator");

      // Dialogs
      case "dialogs.convidarTitulo":
        return getFallback(currentLang, "Convidar Colaborador", "Invite Collaborator");
      case "dialogs.convidarDescricao":
        return getFallback(currentLang, "Envie um convite para alguém acessar este cartão", "Send an invite for someone to access this card");

      default:
        return key;
    }
  };

  // Criar um objeto de traduções para fácil acesso
  const translations = {
    titulos: {
      informacoes: getTranslation("titulos.informacoes"),
      statusLimite: getTranslation("titulos.statusLimite"),
      despesasCategoria: getTranslation("titulos.despesasCategoria"),
      lancamentosRecentes: getTranslation("titulos.lancamentosRecentes"),
      colaboradores: getTranslation("titulos.colaboradores"),
      editarCartao: getTranslation("titulos.editarCartao"),
    },

    subtitulos: {
      distribuicaoGastos: getTranslation("subtitulos.distribuicaoGastos"),
      totalLancamentos: getTranslation("subtitulos.totalLancamentos"),
      atualizarInformacoes: getTranslation("subtitulos.atualizarInformacoes"),
    },

    labels: {
      bandeira: getTranslation("labels.bandeira"),
      limiteTotal: getTranslation("labels.limiteTotal"),
      fechamento: getTranslation("labels.fechamento"),
      vencimento: getTranslation("labels.vencimento"),
      observacoes: getTranslation("labels.observacoes"),
      utilizado: getTranslation("labels.utilizado"),
      disponivel: getTranslation("labels.disponivel"),
      utilizacaoLimite: getTranslation("labels.utilizacaoLimite"),
      proximaFatura: getTranslation("labels.proximaFatura"),
      status: getTranslation("labels.status"),
      descricao: getTranslation("labels.descricao"),
      data: getTranslation("labels.data"),
      valor: getTranslation("labels.valor"),
      fatura: getTranslation("labels.fatura"),
      emailColaborador: getTranslation("labels.emailColaborador"),
      dia: getTranslation("labels.dia"),
      compartilhadoPor: getTranslation("labels.compartilhadoPor"),
    },

    botoes: {
      voltar: getTranslation("botoes.voltar"),
      verFaturas: getTranslation("botoes.verFaturas"),
      editarCartao: getTranslation("botoes.editarCartao"),
      novoLancamento: getTranslation("botoes.novoLancamento"),
      convidar: getTranslation("botoes.convidar"),
      cancelar: getTranslation("botoes.cancelar"),
      enviarConvite: getTranslation("botoes.enviarConvite"),
      enviando: getTranslation("botoes.enviando"),
      verRelatorioCompleto: getTranslation("botoes.verRelatorioCompleto"),
      verTodosLancamentos: getTranslation("botoes.verTodosLancamentos"),
      adicionarPrimeiro: getTranslation("botoes.adicionarPrimeiro"),
    },

    status: {
      pago: getTranslation("status.pago"),
      pendente: getTranslation("status.pendente"),
      aberta: getTranslation("status.aberta"),
      fechada: getTranslation("status.fechada"),
      paga: getTranslation("status.paga"),
      vencida: getTranslation("status.vencida"),
      pendenteBadge: getTranslation("status.pendenteBadge"),
    },

    badges: {
      dono: getTranslation("badges.dono"),
      voce: getTranslation("badges.voce"),
      colaborador: getTranslation("badges.colaborador"),
      escrita: getTranslation("badges.escrita"),
    },

    alertas: {
      limiteCritico: getTranslation("alertas.limiteCritico"),
      limiteElevado: getTranslation("alertas.limiteElevado"),
    },

    mensagens: {
      cartaoNaoEncontrado: getTranslation("mensagens.cartaoNaoEncontrado"),
      nenhumLancamento: getTranslation("mensagens.nenhumLancamento"),
      nenhumaDespesa: getTranslation("mensagens.nenhumaDespesa"),
      nenhumColaborador: getTranslation("mensagens.nenhumColaborador"),
      convideAlguem: getTranslation("mensagens.convideAlguem"),
      convitePendente: getTranslation("mensagens.convitePendente"),
      conviteEnviado: getTranslation("mensagens.conviteEnviado"),
      colaboradorRemovido: getTranslation("mensagens.colaboradorRemovido"),
      emailInvalido: getTranslation("mensagens.emailInvalido"),
      erroCarregar: getTranslation("mensagens.erroCarregar"),
      erroEnviarConvite: getTranslation("mensagens.erroEnviarConvite"),
      erroRemoverColaborador: getTranslation("mensagens.erroRemoverColaborador"),
    },

    dialogs: {
      convidarTitulo: getTranslation("dialogs.convidarTitulo"),
      convidarDescricao: getTranslation("dialogs.convidarDescricao"),
    },
  };

  const [cartao, setCartao] = useState<Cartao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [sheetEditarAberto, setSheetEditarAberto] = useState(false);
  const [enviandoConvite, setEnviandoConvite] = useState(false);
  const [emailConvidado, setEmailConvidado] = useState("");
  const [dialogConvidarAberto, setDialogConvidarAberto] = useState(false);

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
        throw new Error(translations.mensagens.erroCarregar);
      }
    } catch (error) {
      console.error(translations.mensagens.erroCarregar, error);
      toast.error(translations.mensagens.erroCarregar);
    } finally {
      setCarregando(false);
    }
  };

  const handleConvidarColaborador = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailConvidado.trim()) {
      toast.error(translations.mensagens.emailInvalido);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailConvidado)) {
      toast.error(translations.mensagens.emailInvalido);
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
        toast.success(translations.mensagens.conviteEnviado);
        setEmailConvidado("");
        setDialogConvidarAberto(false);
        carregarCartao();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || translations.mensagens.erroEnviarConvite);
      }
    } catch (error: any) {
      console.error(translations.mensagens.erroEnviarConvite, error);
      toast.error(error.message || translations.mensagens.erroEnviarConvite);
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
        throw new Error(result.error || translations.mensagens.erroRemoverColaborador);
      }

      toast.success(translations.mensagens.colaboradorRemovido);
      carregarCartao();
    } catch (error: any) {
      console.error(translations.mensagens.erroRemoverColaborador, error);
      toast.error(error.message || translations.mensagens.erroRemoverColaborador);
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
    const currency = i18n.language === "pt" ? "BRL" : "USD";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
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
            {translations.titulos.colaboradores}
          </p>
          {usuarioAtualEhDono && (
            <Dialog
              open={dialogConvidarAberto}
              onOpenChange={setDialogConvidarAberto}
            >
              <DialogTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 text-xs border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    {translations.botoes.convidar}
                  </Button>
                </motion.div>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white">
                <DialogHeader>
                  <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <DialogTitle className="text-gray-900 dark:text-white">
                      {translations.dialogs.convidarTitulo}
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400">
                      {translations.dialogs.convidarDescricao}
                    </DialogDescription>
                  </motion.div>
                </DialogHeader>
                <form
                  onSubmit={handleConvidarColaborador}
                  className="space-y-4"
                >
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                  >
                    <Label
                      htmlFor="email"
                      className="text-gray-900 dark:text-white"
                    >
                      {translations.labels.emailColaborador}
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
                  </motion.div>
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex gap-3 justify-end"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogConvidarAberto(false)}
                      className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      {translations.botoes.cancelar}
                    </Button>
                    <Button
                      type="submit"
                      disabled={enviandoConvite}
                      className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900"
                    >
                      {enviandoConvite
                        ? translations.botoes.enviando
                        : translations.botoes.enviarConvite}
                    </Button>
                  </motion.div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="space-y-2">
          {/* Dono do Cartão */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-gray-800/30 border border-blue-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
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
              </motion.div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {cartao.user?.name || "Usuário"}
                  {usuarioAtualEhDono && translations.badges.voce}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {cartao.user?.email}
                </p>
              </div>
            </div>
            <Badge className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
              {translations.badges.dono}
            </Badge>
          </motion.div>

          {/* Colaboradores */}
          {cartao.ColaboradorCartao.map((colaborador, index) => {
            const ehUsuarioAtual =
              colaborador.user.id === session?.data?.user?.id;
            return (
              <motion.div
                key={colaborador.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-gray-800/30 border border-green-200 dark:border-gray-700 hover:bg-green-100 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
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
                  </motion.div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {colaborador.user.name}
                      {ehUsuarioAtual && translations.badges.voce}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {colaborador.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                    {colaborador.permissao === "LEITURA"
                      ? translations.badges.colaborador
                      : translations.badges.escrita}
                  </Badge>
                  {usuarioAtualEhDono && (
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
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
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Convites Pendentes */}
          {usuarioAtualEhDono &&
            cartao.ConviteCartao.map((convite, index) => (
              <motion.div
                key={convite.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
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
                  {translations.status.pendenteBadge}
                </Badge>
              </motion.div>
            ))}

          {cartao.ColaboradorCartao.length === 0 &&
            (!usuarioAtualEhDono || cartao.ConviteCartao.length === 0) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center py-4 text-gray-600 dark:text-gray-500"
              >
                <motion.div
                  animate={{ 
                    y: [0, -5, 0],
                    rotate: [0, 3, -3, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                </motion.div>
                <p className="text-sm">{translations.mensagens.nenhumColaborador}</p>
                {usuarioAtualEhDono && (
                  <p className="text-xs">{translations.mensagens.convideAlguem}</p>
                )}
              </motion.div>
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
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="min-h-screen p-6"
      >
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {translations.mensagens.cartaoNaoEncontrado}
          </h1>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => router.push(getLocalizedPath("/dashboard/cartoes"))}
              className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900"
            >
              {translations.botoes.voltar}
            </Button>
          </motion.div>
        </div>
      </motion.div>
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen p-3 sm:p-4 md:p-6 bg-white dark:bg-transparent"
    >
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  router.push(getLocalizedPath("/dashboard/cartoes"))
                }
                className="h-9 w-9 sm:h-10 sm:w-10 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white flex-shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </motion.div>
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-2 h-6 sm:h-8 rounded flex-shrink-0"
                style={{ backgroundColor: cartao.cor }}
              />
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">
                  {cartao.nome}
                </h1>
                {cartao.ehCompartilhado && cartao.user && (
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                    {t("labels.compartilhadoPor", { nome: cartao.user.name })}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto mt-3 sm:mt-0">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 sm:flex-none"
            >
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    getLocalizedPath(`/dashboard/cartoes/${cartaoId}/faturas`)
                  )
                }
                className="w-full border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white text-xs sm:text-sm"
              >
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="truncate">{translations.botoes.verFaturas}</span>
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 sm:flex-none"
            >
              <Button
                variant="outline"
                onClick={() => setSheetEditarAberto(true)}
                className="w-full border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white text-xs sm:text-sm"
              >
                <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="truncate">{translations.botoes.editarCartao}</span>
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Informações do Cartão */}
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-base sm:text-lg">
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <div className="p-1 sm:p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                      <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-700 dark:text-gray-300" />
                    </div>
                  </motion.div>
                  <span className="truncate">{translations.titulos.informacoes}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-2 sm:space-y-3">
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {translations.labels.bandeira}
                      </p>
                      <p className="text-gray-900 dark:text-white capitalize text-sm sm:text-base">
                        {cartao.bandeira.toLowerCase()}
                      </p>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {translations.labels.limiteTotal}
                      </p>
                      <motion.p
                        key={cartao.limite}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white"
                      >
                        {formatarMoeda(cartao.limite)}
                      </motion.p>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
                  >
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {translations.labels.fechamento}
                      </p>
                      <p className="text-gray-900 dark:text-white flex items-center gap-1 text-sm sm:text-base">
                        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                        {t("labels.dia", { dia: cartao.diaFechamento })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {translations.labels.vencimento}
                      </p>
                      <p className="text-gray-900 dark:text-white flex items-center gap-1 text-sm sm:text-base">
                        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                        {t("labels.dia", { dia: cartao.diaVencimento })}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-800"
                  >
                    <ColaboradoresSection />
                  </motion.div>

                  {cartao.observacoes && (
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          {translations.labels.observacoes}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                          {cartao.observacoes}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="pt-3 border-t border-gray-200 dark:border-gray-800"
                >
                  <Button
                    className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm sm:text-base py-2"
                    onClick={() =>
                      router.push(getLocalizedPath("/dashboard/lancamentos/"))
                    }
                  >
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="truncate">{translations.botoes.novoLancamento}</span>
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 2: Status do Limite */}
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-base sm:text-lg">
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.3, delay: 0.25 }}
                  >
                    <div className="p-1 sm:p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                      <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </motion.div>
                  <span className="truncate">{translations.titulos.statusLimite}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
                >
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {translations.labels.utilizado}
                    </p>
                    <motion.p
                      key={totalFaturaAtual}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white"
                    >
                      {formatarMoeda(totalFaturaAtual)}
                    </motion.p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {translations.labels.disponivel}
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {formatarMoeda(cartao.limite - totalFaturaAtual)}
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="space-y-2 sm:space-y-3"
                >
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {translations.labels.utilizacaoLimite}
                    </span>
                    <motion.span
                      key={utilizacao}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className={`font-medium ${
                        utilizacao >= 90
                          ? "text-red-600 dark:text-red-400"
                          : utilizacao >= 70
                            ? "text-amber-600 dark:text-orange-400"
                            : "text-emerald-600 dark:text-green-400"
                      }`}
                    >
                      {utilizacao.toFixed(1)}%
                    </motion.span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 sm:h-3 overflow-hidden">
                    <motion.div
                      className={`h-2 sm:h-3 rounded-full ${
                        utilizacao >= 90
                          ? "bg-red-500"
                          : utilizacao >= 70
                            ? "bg-amber-500 dark:bg-orange-500"
                            : "bg-emerald-500 dark:bg-green-500"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(utilizacao, 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>

                {utilizacao >= 70 && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.55 }}
                    className={`flex items-center gap-2 p-2 sm:p-3 rounded-lg ${
                      utilizacao >= 90
                        ? "bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                        : "bg-amber-50 dark:bg-orange-900/50 text-amber-700 dark:text-orange-300 border border-amber-200 dark:border-orange-800"
                    }`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium truncate">
                      {utilizacao >= 90
                        ? translations.alertas.limiteCritico
                        : translations.alertas.limiteElevado}
                    </span>
                  </motion.div>
                )}

                {/* Fatura Atual */}
                {proximaFatura && (
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.65 }}
                    className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2 sm:space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                        {translations.labels.proximaFatura}
                      </span>
                      <motion.span
                        key={proximaFatura.valorTotal}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="text-base sm:text-lg font-bold text-gray-900 dark:text-white"
                      >
                        {formatarMoeda(proximaFatura.valorTotal)}
                      </motion.span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                        {translations.labels.vencimento}
                      </span>
                      <span className="text-gray-900 dark:text-white text-xs sm:text-sm">
                        {formatarData(proximaFatura.dataVencimento)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                        {translations.labels.status}
                      </span>
                      <Badge
                        className={`text-xs ${getStatusColor(proximaFatura.status)}`}
                      >
                        {proximaFatura.status === "ABERTA"
                          ? translations.status.aberta
                          : proximaFatura.status === "FECHADA"
                            ? translations.status.fechada
                            : proximaFatura.status === "PAGA"
                              ? translations.status.paga
                              : translations.status.vencida}
                      </Badge>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 3: Ranking de Despesas por Categoria */}
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 dark:text-white text-base sm:text-lg">
                  <span className="truncate">
                    {translations.titulos.despesasCategoria}
                  </span>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                  {translations.subtitulos.distribuicaoGastos}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
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
                      <div className="text-center py-3 sm:py-4">
                        <p className="text-gray-700 dark:text-gray-400 text-xs sm:text-sm">
                          {translations.mensagens.nenhumaDespesa}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2 sm:space-y-3">
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
                                <IconComponent className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                              );
                            } catch {
                              return (
                                <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                              );
                            }
                          };

                          return (
                            <motion.div
                              key={categoriaNome}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              className="flex justify-between items-center p-2.5 sm:p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/50 hover:bg-gray-100/80 dark:hover:bg-gray-800/70 transition-colors"
                            >
                              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                <div
                                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: categoriaData.cor }}
                                >
                                  {getIcone(categoriaData.icone)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-900 dark:text-white text-xs sm:text-sm font-medium truncate">
                                    {categoriaNome}
                                  </p>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 sm:h-1.5 mt-1 overflow-hidden">
                                    <motion.div
                                      className="h-1 sm:h-1.5 rounded-full"
                                      style={{
                                        backgroundColor: categoriaData.cor,
                                      }}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${porcentagem}%` }}
                                      transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-1.5 sm:ml-2 min-w-[70px] sm:min-w-[80px]">
                                <motion.p
                                  key={categoriaData.total}
                                  initial={{ scale: 1.2 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.4 + index * 0.1 }}
                                  className="text-gray-900 dark:text-white font-medium text-xs sm:text-sm"
                                >
                                  {formatarMoeda(categoriaData.total)}
                                </motion.p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {porcentagem.toFixed(1)}%
                                </p>
                              </div>
                            </motion.div>
                          );
                        }
                      )}

                      {/* Total geral */}
                      <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-800"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                            Total:
                          </span>
                          <span className="text-gray-900 dark:text-white font-bold text-sm sm:text-base">
                            {formatarMoeda(totalDespesas)}
                          </span>
                        </div>
                      </motion.div>
                    </div>
                  );
                })()}

                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-800"
                >
                  <Button
                    variant="outline"
                    className="w-full border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white text-xs sm:text-sm py-2"
                    onClick={() =>
                      router.push(getLocalizedPath("/dashboard/relatorios"))
                    }
                  >
                    <span className="truncate">
                      {translations.botoes.verRelatorioCompleto}
                    </span>
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Card 4: Lançamentos Recentes */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 dark:text-white text-base sm:text-lg">
                {translations.titulos.lancamentosRecentes}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                {t("subtitulos.totalLancamentos", {
                  count: cartao.lancamentos.length,
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cartao.lancamentos.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-6 sm:py-8"
                >
                  <motion.div
                    animate={{ 
                      y: [0, -5, 0],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    <CreditCard className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                  </motion.div>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">
                    {translations.mensagens.nenhumLancamento}
                  </p>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm sm:text-base py-2"
                      onClick={() =>
                        router.push(
                          getLocalizedPath(
                            `/dashboard/lancamentos/novo?cartaoId=${cartaoId}`
                          )
                        )
                      }
                    >
                      <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="truncate">
                        {translations.botoes.adicionarPrimeiro}
                      </span>
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                <>
                  {/* Tabela para desktop */}
                  <div className="hidden sm:block border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
                          <TableHead className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                            {translations.labels.descricao}
                          </TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                            {translations.labels.data}
                          </TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                            {translations.labels.valor}
                          </TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                            {translations.labels.status}
                          </TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                            {translations.labels.fatura}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lancamentosRecentes.map((lancamento, index) => (
                          <motion.tr
                            key={lancamento.id}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                          >
                            <TableCell className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                              <span className="truncate block max-w-[200px]">
                                {lancamento.descricao}
                              </span>
                            </TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                              {formatarData(lancamento.data)}
                            </TableCell>
                            <TableCell className="text-gray-900 dark:text-white text-xs sm:text-sm font-medium">
                              {formatarMoeda(lancamento.valor)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  lancamento.pago ? "default" : "secondary"
                                }
                                className={`text-xs ${
                                  lancamento.pago
                                    ? "bg-emerald-100 dark:bg-green-900/50 text-emerald-700 dark:text-green-300 border-emerald-200 dark:border-green-700"
                                    : "bg-amber-100 dark:bg-yellow-900/50 text-amber-700 dark:text-yellow-300 border-amber-200 dark:border-yellow-700"
                                }`}
                              >
                                {lancamento.pago
                                  ? translations.status.pago
                                  : translations.status.pendenteBadge}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                              {lancamento.Fatura ? (
                                <Badge
                                  className={`text-xs ${getStatusColor(lancamento.Fatura.status)}`}
                                >
                                  {lancamento.Fatura.mesReferencia}
                                </Badge>
                              ) : (
                                <span className="text-gray-500 dark:text-gray-500">
                                  -
                                </span>
                              )}
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Lista para mobile */}
                  <div className="sm:hidden space-y-3">
                    {lancamentosRecentes.map((lancamento, index) => (
                      <motion.div
                        key={lancamento.id}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border border-gray-200 dark:border-gray-800 rounded-lg p-3 bg-gray-50/50 dark:bg-gray-800/50"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 dark:text-white font-medium text-sm truncate mb-1">
                              {lancamento.descricao}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 text-xs">
                              {formatarData(lancamento.data)}
                            </p>
                          </div>
                          <motion.p
                            key={lancamento.valor}
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                            className="text-gray-900 dark:text-white font-bold text-sm ml-2"
                          >
                            {formatarMoeda(lancamento.valor)}
                          </motion.p>
                        </div>
                        <div className="flex justify-between items-center">
                          <Badge
                            variant={lancamento.pago ? "default" : "secondary"}
                            className={`text-xs ${
                              lancamento.pago
                                ? "bg-emerald-100 dark:bg-green-900/50 text-emerald-700 dark:text-green-300 border-emerald-200 dark:border-green-700"
                                : "bg-amber-100 dark:bg-yellow-900/50 text-amber-700 dark:text-yellow-300 border-amber-200 dark:border-yellow-700"
                            }`}
                          >
                            {lancamento.pago
                              ? translations.status.pago
                              : translations.status.pendenteBadge}
                          </Badge>
                          <span className="text-gray-600 dark:text-gray-300 text-xs">
                            {lancamento.Fatura ? (
                              <Badge
                                className={`text-xs ${getStatusColor(lancamento.Fatura.status)}`}
                              >
                                {lancamento.Fatura.mesReferencia}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
              {cartao.lancamentos.length > 10 && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button
                    variant="outline"
                    className="w-full mt-3 sm:mt-4 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white text-xs sm:text-sm py-2"
                    onClick={() =>
                      router.push(
                        getLocalizedPath(
                          `/dashboard/lancamentos?cartaoId=${cartaoId}`
                        )
                      )
                    }
                  >
                    <span className="truncate">
                      {translations.botoes.verTodosLancamentos}
                    </span>
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Sheet open={sheetEditarAberto} onOpenChange={setSheetEditarAberto}>
        <SheetContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white overflow-y-auto w-full sm:max-w-2xl">
          <SheetHeader className="mb-4 sm:mb-6">
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <SheetTitle className="text-gray-900 dark:text-white text-lg sm:text-xl">
                {translations.titulos.editarCartao}
              </SheetTitle>
              <SheetDescription className="text-gray-600 dark:text-gray-400 text-sm">
                {translations.subtitulos.atualizarInformacoes}
              </SheetDescription>
            </motion.div>
          </SheetHeader>

          <FormEditarCartao
            cartao={cartao}
            onSalvo={() => {
              setSheetEditarAberto(false);
              carregarCartao();
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
    </motion.div>
  );
}