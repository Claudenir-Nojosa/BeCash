"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  User,
  Camera,
  Save,
  Loader2,
  Upload,
  X,
  Shield,
  Users,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PricingMenor } from "@/components/dashboard/PricingMenor";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface UserSubscription {
  id: string;
  userId: string;
  plano: "free" | "pro" | "family";
  status: "active" | "canceled" | "expired";
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeCustomerId: string | null;
  inicioPlano: Date;
  fimPlano: Date;
  canceladoEm: Date | null;
}

// Função auxiliar para obter tradução com fallback
const getFallback = (lang: string, pt: string, en: string) => {
  return lang === "en" ? en : pt;
};

export default function PerfilPage() {
  const { data: session, update } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null,
  );
  const [isManaging, setIsManaging] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, i18n } = useTranslation("perfil");
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
      case "titulo":
        return getFallback(currentLang, "Meu Perfil", "My Profile");
      case "descricao":
        return getFallback(
          currentLang,
          "Gerencie suas informações pessoais e preferências",
          "Manage your personal information and preferences",
        );

      // Informações Pessoais
      case "informacoesPessoais":
        return getFallback(
          currentLang,
          "Informações Pessoais",
          "Personal Information",
        );
      case "descricaoInformacoes.comFoto":
        return getFallback(
          currentLang,
          "Clique em Salvar Alterações para atualizar sua foto",
          "Click Save Changes to update your photo",
        );
      case "descricaoInformacoes.semFoto":
        return getFallback(
          currentLang,
          "Clique no ícone da câmera para alterar sua foto de perfil",
          "Click the camera icon to change your profile picture",
        );

      // Botões
      case "cancelar":
        return getFallback(currentLang, "Cancelar", "Cancel");
      case "salvando":
        return getFallback(currentLang, "Salvando...", "Saving...");
      case "salvarAlteracoes":
        return getFallback(currentLang, "Salvar Alterações", "Save Changes");
      case "editarFoto":
        return getFallback(currentLang, "Editar Foto", "Edit Photo");
      case "removerFoto":
        return getFallback(
          currentLang,
          "Remover Foto Atual",
          "Remove Current Photo",
        );

      // Status da Conta
      case "statusConta":
        return getFallback(currentLang, "Status da Conta", "Account Status");
      case "gerenciarPlano":
        return getFallback(currentLang, "Gerenciar Plano", "Manage Plan");

      // Campos
      case "campos.nomeCompleto":
        return getFallback(currentLang, "Nome Completo", "Full Name");
      case "campos.email":
        return getFallback(currentLang, "E-mail", "Email");
      case "campos.telefone":
        return getFallback(currentLang, "Telefone", "Phone");
      case "campos.dataCadastro":
        return getFallback(
          currentLang,
          "Data de Cadastro",
          "Registration Date",
        );
      case "campos.planoAtual":
        return getFallback(currentLang, "Plano Atual", "Current Plan");
      case "campos.validade":
        return getFallback(currentLang, "Validade", "Expiration Date");
      case "campos.naoInformado":
        return getFallback(currentLang, "Não informado", "Not informed");

      // Notificações
      case "notificacoes.fotoAtualizada":
        return getFallback(
          currentLang,
          "Foto atualizada com sucesso!",
          "Photo updated successfully!",
        );
      case "notificacoes.fotoRemovida":
        return getFallback(
          currentLang,
          "Foto removida com sucesso!",
          "Photo removed successfully!",
        );
      case "notificacoes.erroAtualizar":
        return getFallback(
          currentLang,
          "Erro ao atualizar foto",
          "Error updating photo",
        );
      case "notificacoes.erroRemover":
        return getFallback(
          currentLang,
          "Erro ao remover foto",
          "Error removing photo",
        );
      case "notificacoes.arquivoInvalido":
        return getFallback(
          currentLang,
          "Por favor, selecione uma imagem válida",
          "Please select a valid image file",
        );
      case "notificacoes.tamanhoExcedido":
        return getFallback(
          currentLang,
          "A imagem deve ter no máximo 5MB",
          "Image must be maximum 5MB",
        );

      // Dicas
      case "dicas.selecionarImagem":
        return getFallback(
          currentLang,
          "Clique no ícone da câmera para selecionar uma nova foto",
          "Click the camera icon to select a new photo",
        );
      case "dicas.formatosSuportados":
        return getFallback(
          currentLang,
          "Formatos suportados: JPG, PNG, WebP",
          "Supported formats: JPG, PNG, WebP",
        );
      case "dicas.tamanhoMaximo":
        return getFallback(
          currentLang,
          "Tamanho máximo: 5MB",
          "Maximum size: 5MB",
        );

      // Planos
      case "plano.free":
        return getFallback(currentLang, "Grátis", "Free");
      case "plano.premium":
        return getFallback(currentLang, "Premium", "Premium");
      case "plano.business":
        return getFallback(currentLang, "Business", "Business");
      case "plano.expirado":
        return getFallback(currentLang, "Expirado", "Expired");
      case "plano.ativo":
        return getFallback(currentLang, "Ativo", "Active");

      // Tabs
      case "perfil":
        return getFallback(currentLang, "Perfil", "Profile");
      case "assinatura":
        return getFallback(currentLang, "Assinatura", "Subscription");

      // Assinatura
      case "assinatura.titulo":
        return getFallback(
          currentLang,
          "Gerenciar Assinatura",
          "Manage Subscription",
        );
      case "assinatura.descricao":
        return getFallback(
          currentLang,
          "Visualize e gerencie sua assinatura atual",
          "View and manage your current subscription",
        );
      case "assinatura.cobrancaMensal":
        return getFallback(currentLang, "Cobrança mensal", "Monthly billing");
      case "assinatura.status":
        return getFallback(currentLang, "Status", "Status");
      case "assinatura.inicio":
        return getFallback(currentLang, "Data de Início", "Start Date");
      case "assinatura.expirouEm":
        return getFallback(currentLang, "Expirou em", "Expired on");
      case "assinatura.expiraEm":
        return getFallback(currentLang, "Expira em", "Expires on");
      case "assinatura.renovaEm":
        return getFallback(currentLang, "Próxima Renovação", "Next Renewal");

      // Status
      case "status.ativo":
        return getFallback(currentLang, "Ativo", "Active");
      case "status.cancelado":
        return getFallback(currentLang, "Cancelado", "Canceled");
      case "status.expirado":
        return getFallback(currentLang, "Expirado", "Expired");

      // Avisos
      case "avisos.assinaturaCancelada":
        return getFallback(
          currentLang,
          "Assinatura Cancelada",
          "Subscription Canceled",
        );
      case "avisos.acessoAte":
        return getFallback(
          currentLang,
          "Você ainda terá acesso aos recursos premium até",
          "You will still have access to premium features until",
        );
      case "avisos.assinaturaExpirada":
        return getFallback(
          currentLang,
          "Assinatura Expirada",
          "Subscription Expired",
        );
      case "avisos.renovePara":
        return getFallback(
          currentLang,
          "Sua assinatura expirou. Renove agora para continuar aproveitando todos os recursos premium.",
          "Your subscription has expired. Renew now to continue enjoying all premium features.",
        );

      // Recursos
      case "recursosIncluidos":
        return getFallback(
          currentLang,
          "Recursos Incluídos no seu Plano",
          "Features Included in Your Plan",
        );
      case "recursos.lancamentosLimitados":
        return getFallback(
          currentLang,
          "Até 50 lançamentos por mês",
          "Up to 50 entries per month",
        );
      case "recursos.whatsappLimitado":
        return getFallback(
          currentLang,
          "3 mensagens WhatsApp AI por mês",
          "3 WhatsApp AI messages per month",
        );
      case "recursos.categorias":
        return getFallback(
          currentLang,
          "Até 10 categorias",
          "Up to 10 categories",
        );
      case "recursos.metas":
        return getFallback(
          currentLang,
          "Até 2 metas pessoais",
          "Up to 2 personal goals",
        );
      case "recursos.lancamentosIlimitados":
        return getFallback(
          currentLang,
          "Lançamentos ilimitados",
          "Unlimited entries",
        );
      case "recursos.whatsappIlimitado":
        return getFallback(
          currentLang,
          "WhatsApp AI ilimitado",
          "Unlimited WhatsApp AI",
        );
      case "recursos.categoriasIlimitadas":
        return getFallback(
          currentLang,
          "Categorias ilimitadas",
          "Unlimited categories",
        );
      case "recursos.metasIlimitadas":
        return getFallback(currentLang, "Metas ilimitadas", "Unlimited goals");
      case "recursos.limitesCategorias":
        return getFallback(
          currentLang,
          "Limites por categoria",
          "Limits by category",
        );
      case "recursos.despesasCompartilhadas":
        return getFallback(
          currentLang,
          "Até 3 despesas compartilhadas",
          "Up to 3 shared expenses",
        );
      case "recursos.tudoPro":
        return getFallback(
          currentLang,
          "Tudo do plano Pro",
          "Everything from Pro plan",
        );
      case "recursos.membros":
        return getFallback(
          currentLang,
          "Até 5 membros da família",
          "Up to 5 family members",
        );
      case "recursos.despesasIlimitadas":
        return getFallback(
          currentLang,
          "Despesas compartilhadas ilimitadas",
          "Unlimited shared expenses",
        );
      case "recursos.metasFamiliares":
        return getFallback(
          currentLang,
          "Metas familiares colaborativas",
          "Collaborative family goals",
        );

      // Ações
      case "acoes":
        return getFallback(currentLang, "Ações", "Actions");
      case "portalGerenciamento":
        return getFallback(
          currentLang,
          "Abrir Portal do Stripe",
          "Open Stripe Portal",
        );
      case "cancelarAssinatura":
        return getFallback(
          currentLang,
          "Cancelar Assinatura",
          "Cancel Subscription",
        );
      case "reativarAssinatura":
        return getFallback(
          currentLang,
          "Reativar Assinatura",
          "Reactivate Subscription",
        );
      case "assinarAgora":
        return getFallback(currentLang, "Assinar Agora", "Subscribe Now");
      case "verPlanos":
        return getFallback(
          currentLang,
          "Ver Planos Disponíveis",
          "View Available Plans",
        );
      case "upgradePlano":
        return getFallback(currentLang, "Fazer Upgrade", "Upgrade Plan");

      // Carregamento
      case "carregando":
        return getFallback(currentLang, "Carregando...", "Loading...");
      case "cancelando":
        return getFallback(currentLang, "Cancelando...", "Canceling...");
      case "reativando":
        return getFallback(currentLang, "Reativando...", "Reactivating...");

      // Sem assinatura
      case "semAssinatura.titulo":
        return getFallback(
          currentLang,
          "Nenhuma assinatura ativa",
          "No active subscription",
        );
      case "semAssinatura.descricao":
        return getFallback(
          currentLang,
          "Você está usando o plano gratuito. Faça upgrade para desbloquear recursos premium e aproveitar ao máximo nossa plataforma.",
          "You are using the free plan. Upgrade to unlock premium features and make the most of our platform.",
        );

      // Voltar
      case "voltarParaAssinatura":
        return getFallback(
          currentLang,
          "Voltar para Assinatura",
          "Back to Subscription",
        );

      // Dialogs
      case "dialog.cancelar.titulo":
        return getFallback(
          currentLang,
          "Confirmar Cancelamento",
          "Confirm Cancellation",
        );
      case "dialog.cancelar.descricao":
        return getFallback(
          currentLang,
          "Tem certeza que deseja cancelar sua assinatura?",
          "Are you sure you want to cancel your subscription?",
        );
      case "dialog.cancelar.acessoAte":
        return getFallback(
          currentLang,
          "Acesso até o fim do período",
          "Access until the end of the period",
        );
      case "dialog.cancelar.continuaraAcesso":
        return getFallback(
          currentLang,
          "Você continuará com acesso premium até",
          "You will continue to have premium access until",
        );
      case "dialog.cancelar.manterAssinatura":
        return getFallback(
          currentLang,
          "Manter Assinatura",
          "Keep Subscription",
        );
      case "dialog.cancelar.confirmarCancelamento":
        return getFallback(
          currentLang,
          "Confirmar Cancelamento",
          "Confirm Cancellation",
        );

      case "dialog.reativar.titulo":
        return getFallback(
          currentLang,
          "Reativar Assinatura",
          "Reactivate Subscription",
        );
      case "dialog.reativar.descricao":
        return getFallback(
          currentLang,
          "Confirme a reativação da sua assinatura",
          "Confirm the reactivation of your subscription",
        );
      case "dialog.reativar.beneficios":
        return getFallback(
          currentLang,
          "Benefícios que você recupera",
          "Benefits you will regain",
        );
      case "dialog.reativar.manterCancelado":
        return getFallback(currentLang, "Manter Cancelado", "Keep Canceled");
      case "dialog.reativar.reativarAgora":
        return getFallback(currentLang, "Reativar Agora", "Reactivate Now");
      case "dialog.reativar.processando":
        return getFallback(currentLang, "Processando...", "Processing...");

      default:
        return key;
    }
  };

  // Carregar dados da assinatura
  useEffect(() => {
    loadUserSubscription();
  }, []);

  const loadUserSubscription = async () => {
    try {
      setLoadingSubscription(true);
      const response = await fetch("/api/usuarios/subscription");
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error("Erro ao carregar assinatura:", error);
      toast.error(getTranslation("notificacoes.erroAtualizar"));
    } finally {
      setLoadingSubscription(false);
    }
  };

  const getUsername = () => {
    if (!session?.user?.email) return "";
    return session.user.email.split("@")[0];
  };

  const username = getUsername();

  const getInitials = (name: string | undefined | null) => {
    if (!name) return "U";
    const nameParts = name.split(" ");
    return nameParts
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error(getTranslation("notificacoes.arquivoInvalido"));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(getTranslation("notificacoes.tamanhoExcedido"));
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!selectedFile) {
        toast.info(getTranslation("notificacoes.arquivoInvalido"));
        return;
      }

      const formData = new FormData();
      formData.append("avatar", selectedFile);

      const response = await fetch("/api/usuarios/alterar-foto", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(getTranslation("notificacoes.erroAtualizar"));
      }

      toast.success(getTranslation("notificacoes.fotoAtualizada"));

      await update();
      setSelectedFile(null);
      setAvatarPreview(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Erro ao salvar foto:", error);
      toast.error(
        error.message || getTranslation("notificacoes.erroAtualizar"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmCancel = async () => {
    try {
      setIsCanceling(true);
      const response = await fetch("/api/usuarios/subscription/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: cancellationReason
          ? JSON.stringify({ reason: cancellationReason })
          : JSON.stringify({}),
      });

      if (response.ok) {
        toast.success(getTranslation("notificacoes.fotoAtualizada"));

        await loadUserSubscription();
        setShowCancelDialog(false);
        setCancellationReason("");
      } else {
        throw new Error(getTranslation("notificacoes.erroAtualizar"));
      }
    } catch (error: any) {
      console.error("Erro ao cancelar assinatura:", error);
      toast.error(
        error.message || getTranslation("notificacoes.erroAtualizar"),
      );
    } finally {
      setIsCanceling(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getPlansData = () => {
    return [
      {
        name: getFallback(currentLang, "Básico", "Basic"),
        price: "0",
        yearlyPrice: "0",
        priceReal: "0",
        yearlyPriceReal: "0",
        period: getFallback(currentLang, "mês", "month"),
        features: [
          getFallback(
            currentLang,
            "Até 50 lançamentos por mês",
            "Up to 50 entries per month",
          ),
          getFallback(
            currentLang,
            "3 mensagens WhatsApp AI por mês",
            "3 WhatsApp AI messages per month",
          ),
          getFallback(
            currentLang,
            "Criação de até 10 categorias",
            "Create up to 10 categories",
          ),
          getFallback(
            currentLang,
            "Criação de até 2 metas pessoais",
            "Create up to 2 personal goals",
          ),
          getFallback(
            currentLang,
            "Análise básica de gastos",
            "Basic spending analysis",
          ),
          getFallback(currentLang, "Suporte por email", "Email support"),
        ],
        description: getFallback(
          currentLang,
          "Perfeito para começar a controlar suas finanças",
          "Perfect for starting to control your finances",
        ),
        buttonText: getFallback(currentLang, "Começar Grátis", "Start Free"),
        href: `/${currentLang}/signup`,
        isPopular: false,
      },
      {
        name: getFallback(currentLang, "Pro", "Pro"),
        price: "5.00",
        yearlyPrice: "4.00",
        priceReal: "19.90",
        yearlyPriceReal: "16.58",
        period: getFallback(currentLang, "mês", "month"),
        features: [
          getFallback(
            currentLang,
            "Lançamentos ilimitados",
            "Unlimited entries",
          ),
          getFallback(
            currentLang,
            "WhatsApp AI ilimitado",
            "Unlimited WhatsApp AI",
          ),
          getFallback(
            currentLang,
            "Categorias ilimitadas",
            "Unlimited categories",
          ),
          getFallback(currentLang, "Metas ilimitadas", "Unlimited goals"),
          getFallback(
            currentLang,
            "Limites por categoria",
            "Limits by category",
          ),
          getFallback(
            currentLang,
            "Até 3 despesas compartilhadas",
            "Up to 3 shared expenses",
          ),
          getFallback(currentLang, "Relatórios avançados", "Advanced reports"),
          getFallback(currentLang, "Suporte prioritário", "Priority support"),
        ],
        description: getFallback(
          currentLang,
          "Para quem leva finanças a sério",
          "For those who take finances seriously",
        ),
        buttonText: session?.user
          ? getFallback(currentLang, "Upgrade para Pro", "Upgrade to Pro")
          : getFallback(currentLang, "Seja PRO", "Go PRO"),
        href: session?.user
          ? `/api/checkout?plan=pro&lang=${currentLang}`
          : `/${currentLang}/signup?plan=pro`,
        isPopular: true,
        badge: getFallback(currentLang, "Popular", "Popular"),
      },
      {
        name: getFallback(currentLang, "Família", "Family"),
        price: "13.00",
        yearlyPrice: "11.00",
        priceReal: "49.90",
        yearlyPriceReal: "41.58",
        period: getFallback(currentLang, "mês", "month"),
        features: [
          getFallback(
            currentLang,
            "Tudo do plano Pro",
            "Everything from Pro plan",
          ),
          getFallback(
            currentLang,
            "Até 5 membros da família",
            "Up to 5 family members",
          ),
          getFallback(
            currentLang,
            "Despesas compartilhadas ilimitadas",
            "Unlimited shared expenses",
          ),
          getFallback(
            currentLang,
            "Metas familiares colaborativas",
            "Collaborative family goals",
          ),
          getFallback(
            currentLang,
            "Suporte 24/7 com BiCla (IA assistente financeiro)",
            "24/7 support with BiCla (AI financial assistant)",
          ),
        ],
        description: getFallback(
          currentLang,
          "Ideal para famílias que querem controlar tudo junto",
          "Ideal for families who want to control everything together",
        ),
        buttonText: session?.user
          ? getFallback(
              currentLang,
              "Upgrade para Família",
              "Upgrade to Family",
            )
          : getFallback(
              currentLang,
              "Começar Teste Grátis",
              "Start Free Trial",
            ),
        href: session?.user
          ? `/api/checkout?plan=family&lang=${currentLang}`
          : `/${currentLang}/signup?plan=family`,
        isPopular: false,
      },
    ];
  };

  const handleManageSubscription = async () => {
    try {
      setIsManaging(true);
      const response = await fetch("/api/create-portal-session", {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error(getTranslation("notificacoes.erroAtualizar"));
      }
    } catch (error) {
      console.error("Erro ao acessar portal:", error);
      toast.error(getTranslation("notificacoes.erroAtualizar"));
    } finally {
      setIsManaging(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setIsReactivating(true);
      const response = await fetch("/api/usuarios/subscription/reactivate", {
        method: "POST",
      });

      if (response.ok) {
        toast.success(getTranslation("notificacoes.fotoAtualizada"));

        await loadUserSubscription();
        setShowReactivateDialog(false);
      } else {
        throw new Error(getTranslation("notificacoes.erroAtualizar"));
      }
    } catch (error: any) {
      console.error("Erro ao reativar assinatura:", error);
      toast.error(
        error.message || getTranslation("notificacoes.erroAtualizar"),
      );
    } finally {
      setIsReactivating(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(
      currentLang === "en" ? "en-US" : "pt-BR",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      },
    );
  };

  const getPlanName = (plan: string) => {
    const planMap: Record<string, string> = {
      free: getFallback(currentLang, "Básico", "Basic"),
      pro: getFallback(currentLang, "Pro", "Pro"),
      family: getFallback(currentLang, "Família", "Family"),
    };
    return planMap[plan] || plan;
  };

  const getPlanColor = (plan: string) => {
    const colorMap: Record<string, string> = {
      basic: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      pro: "bg-gradient-to-r from-[#00cfec]/20 to-[#007cca]/20 text-[#007cca] dark:text-[#00cfec] border border-[#00cfec]/30",
      family:
        "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30",
    };
    return colorMap[plan] || "bg-gray-100 text-gray-800";
  };

  const getPlanIcon = (plan: string) => {
    if (plan === "pro") return Shield;
    if (plan === "family") return Users;
    return User;
  };

  const PlanIcon = subscription ? getPlanIcon(subscription.plano) : User;

  // Verificar se a subscription está expirada
  const isExpired = subscription
    ? new Date(subscription.fimPlano) < new Date()
    : false;
  const effectiveStatus = isExpired ? "expired" : subscription?.status;

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Cabeçalho */}
          <div className="mb-8">
            {username && (
              <div className="mb-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-normal tracking-tight">
                  @{username}
                </span>
              </div>
            )}

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {getTranslation("titulo")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {getTranslation("descricao")}
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">
                {getTranslation("perfil")}
              </TabsTrigger>
              <TabsTrigger value="subscription">
                {getTranslation("assinatura")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna Esquerda - Informações do Perfil */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {getTranslation("informacoesPessoais")}
                      </CardTitle>
                      <CardDescription>
                        {selectedFile
                          ? getTranslation("descricaoInformacoes.comFoto")
                          : getTranslation("descricaoInformacoes.semFoto")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Foto do Perfil */}
                      <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-6">
                        <div className="relative">
                          <Avatar className="h-24 w-24 border-4 border-gray-100 dark:border-gray-800">
                            <AvatarImage
                              src={avatarPreview || session?.user?.image || ""}
                              alt={
                                session?.user?.name ||
                                getTranslation("campos.nomeCompleto")
                              }
                              className="object-cover"
                            />
                            <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                              {getInitials(session?.user?.name)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="absolute -bottom-2 -right-2">
                            <Button
                              size="icon"
                              className="rounded-full h-10 w-10 shadow-lg"
                              onClick={triggerFileInput}
                            >
                              <Camera className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>

                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />

                        <div className="text-center md:text-left">
                          <h3 className="text-lg font-semibold">
                            {session?.user?.name}
                          </h3>

                          {username && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                              @{username}
                            </p>
                          )}

                          <p className="text-gray-600 dark:text-gray-400">
                            {session?.user?.email}
                          </p>

                          {selectedFile && (
                            <div className="mt-4 space-y-2 max-w-sm">
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Upload className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm truncate">
                                    {selectedFile.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {(selectedFile.size / 1024).toFixed(0)}KB
                                  </span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={handleCancel}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                {getTranslation("dicas.tamanhoMaximo")} •{" "}
                                {getTranslation("dicas.formatosSuportados")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-gray-500 dark:text-gray-400">
                              {getTranslation("campos.nomeCompleto")}
                            </Label>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <p className="text-gray-900 dark:text-white">
                                {session?.user?.name ||
                                  getTranslation("campos.naoInformado")}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-gray-500 dark:text-gray-400">
                              {getTranslation("campos.email")}
                            </Label>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <p className="text-gray-900 dark:text-white">
                                {session?.user?.email ||
                                  getTranslation("campos.naoInformado")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {selectedFile && (
                        <div className="flex justify-end space-x-3 pt-4">
                          <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isSaving}
                          >
                            {getTranslation("cancelar")}
                          </Button>
                          <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {getTranslation("salvando")}
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                {getTranslation("salvarAlteracoes")}
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Coluna Direita - Status rápido */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {getTranslation("statusConta")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          {getTranslation("campos.planoAtual")}
                        </span>
                        {loadingSubscription ? (
                          <Skeleton className="h-6 w-20" />
                        ) : (
                          <Badge
                            className={getPlanColor(
                              subscription?.plano || "free",
                            )}
                          >
                            {getPlanName(subscription?.plano || "free")}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          {getTranslation("assinatura.status")}
                        </span>
                        {loadingSubscription ? (
                          <Skeleton className="h-6 w-24" />
                        ) : effectiveStatus === "active" ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {getTranslation("status.ativo")}
                          </Badge>
                        ) : effectiveStatus === "canceled" ? (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                            <X className="h-3 w-3 mr-1" />
                            {getTranslation("status.cancelado")}
                          </Badge>
                        ) : effectiveStatus === "expired" ? (
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {getTranslation("status.expirado")}
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            {getTranslation("plano.free")}
                          </Badge>
                        )}
                      </div>

                      {subscription?.fimPlano && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            {isExpired
                              ? getTranslation("assinatura.expirouEm")
                              : getTranslation("assinatura.renovaEm")}
                          </span>
                          <span className="font-medium text-sm">
                            {formatDate(subscription.fimPlano)}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-6">
              {showPlans ? (
                <div id="plans-section">
                  <div className="flex items-center justify-between mb-6">
                    <Button
                      variant="ghost"
                      onClick={() => setShowPlans(false)}
                      className="gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      {getTranslation("voltarParaAssinatura")}
                    </Button>
                  </div>
                  <PricingMenor plans={getPlansData()} />
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PlanIcon className="h-5 w-5" />
                      {getTranslation("assinatura.titulo")}
                    </CardTitle>
                    <CardDescription>
                      {getTranslation("assinatura.descricao")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {loadingSubscription ? (
                      <div className="space-y-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : subscription ? (
                      <>
                        {/* Card do Plano Atual */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-4">
                                <div>
                                  <h3 className="text-2xl font-bold">
                                    {getTranslation("campos.planoAtual")}{" "}
                                    {getPlanName(subscription.plano)}
                                  </h3>
                                  <p className="text-gray-600 dark:text-gray-400">
                                    {getTranslation(
                                      "assinatura.cobrancaMensal",
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                    {getTranslation("assinatura.status")}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    {subscription.status === "active" &&
                                    new Date(subscription.fimPlano) >
                                      new Date() ? (
                                      <>
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                                          {getTranslation("status.ativo")}
                                        </span>
                                      </>
                                    ) : subscription.status === "canceled" ||
                                      subscription.canceladoEm ? (
                                      <>
                                        <X className="h-5 w-5 text-red-500" />
                                        <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                                          {getTranslation("status.cancelado")}
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <AlertCircle className="h-5 w-5 text-gray-500" />
                                        <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                                          {getTranslation("status.expirado")}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                    {getTranslation("assinatura.inicio")}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <p className="font-semibold">
                                      {format(
                                        new Date(subscription.inicioPlano),
                                        "dd/MM/yyyy",
                                      )}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                    {new Date(subscription.fimPlano) <
                                    new Date()
                                      ? getTranslation("assinatura.expirouEm")
                                      : subscription.canceladoEm
                                        ? getTranslation("assinatura.expiraEm")
                                        : getTranslation("assinatura.renovaEm")}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <p className="font-semibold">
                                      {format(
                                        new Date(subscription.fimPlano),
                                        "dd/MM/yyyy",
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {subscription.plano !== "family" &&
                              subscription.status === "active" && (
                                <div className="md:ml-4">
                                  <Button
                                    onClick={() => setShowPlans(true)}
                                    className="whitespace-nowrap bg-gradient-to-r from-[#00cfec] to-[#007cca] text-white hover:opacity-90"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    {getTranslation("upgradePlano")}
                                  </Button>
                                </div>
                              )}
                          </div>

                          {/* Avisos e Alertas */}
                          {subscription.canceladoEm &&
                            new Date(subscription.fimPlano) > new Date() && (
                              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-yellow-800 dark:text-yellow-300 font-semibold">
                                      {getTranslation(
                                        "avisos.assinaturaCancelada",
                                      )}
                                    </p>
                                    <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">
                                      {getTranslation("avisos.acessoAte")}{" "}
                                      <span className="font-semibold">
                                        {format(
                                          new Date(subscription.fimPlano),
                                          "dd/MM/yyyy",
                                        )}
                                      </span>
                                      .
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                          {new Date(subscription.fimPlano) < new Date() && (
                            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                              <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-red-800 dark:text-red-300 font-semibold">
                                    {getTranslation(
                                      "avisos.assinaturaExpirada",
                                    )}
                                  </p>
                                  <p className="text-red-700 dark:text-red-400 text-sm mt-1">
                                    {getTranslation("avisos.renovePara")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <Separator />

                        {/* Recursos do Plano */}
                        <div>
                          <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-[#007cca]" />
                            {getTranslation("recursosIncluidos")}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {subscription.plano === "free" ? (
                              <>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>
                                    {getTranslation(
                                      "recursos.lancamentosLimitados",
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>
                                    {getTranslation(
                                      "recursos.whatsappLimitado",
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>
                                    {getTranslation("recursos.categorias")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>
                                    {getTranslation("recursos.metas")}
                                  </span>
                                </div>
                              </>
                            ) : subscription.plano === "pro" ? (
                              <>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="font-semibold bg-gradient-to-r from-[#00cfec] to-[#007cca] bg-clip-text text-transparent">
                                    {getTranslation(
                                      "recursos.lancamentosIlimitados",
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="font-semibold bg-gradient-to-r from-[#00cfec] to-[#007cca] bg-clip-text text-transparent">
                                    {getTranslation(
                                      "recursos.whatsappIlimitado",
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>
                                    {getTranslation(
                                      "recursos.categoriasIlimitadas",
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>
                                    {getTranslation("recursos.metasIlimitadas")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>
                                    {getTranslation(
                                      "recursos.limitesCategorias",
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>
                                    {getTranslation(
                                      "recursos.despesasCompartilhadas",
                                    )}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-purple-500" />
                                  <span className="font-semibold">
                                    {getTranslation("recursos.tudoPro")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-purple-500" />
                                  <span>
                                    {getTranslation("recursos.membros")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-purple-500" />
                                  <span>
                                    {getTranslation(
                                      "recursos.despesasIlimitadas",
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-purple-500" />
                                  <span>
                                    {getTranslation("recursos.metasFamiliares")}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <Separator />

                        {/* Ações */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg">
                            {getTranslation("acoes")}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button
                              onClick={handleManageSubscription}
                              disabled={isManaging}
                              variant="outline"
                              className="w-full"
                            >
                              {isManaging ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  {getTranslation("carregando")}
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  {getTranslation("portalGerenciamento")}
                                </>
                              )}
                            </Button>

                            {subscription.status === "active" &&
                            !subscription.canceladoEm ? (
                              <Button
                                onClick={() => setShowCancelDialog(true)}
                                variant="destructive"
                                disabled={isCanceling}
                                className="w-full"
                              >
                                {isCanceling ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {getTranslation("cancelando")}
                                  </>
                                ) : (
                                  <>
                                    <X className="h-4 w-4 mr-2" />
                                    {getTranslation("cancelarAssinatura")}
                                  </>
                                )}
                              </Button>
                            ) : subscription.canceladoEm &&
                              new Date(subscription.fimPlano) > new Date() ? (
                              <Button
                                onClick={() => setShowReactivateDialog(true)}
                                variant="default"
                                disabled={isReactivating}
                                className="w-full bg-green-600 hover:bg-green-700"
                              >
                                {isReactivating ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {getTranslation("reativando")}
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    {getTranslation("reativarAssinatura")}
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button
                                onClick={() => setShowPlans(true)}
                                className="w-full bg-gradient-to-r from-[#00cfec] to-[#007cca] text-white hover:opacity-90"
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                {getTranslation("assinarAgora")}
                              </Button>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      // Sem assinatura ativa
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
                          <Shield className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                          {getTranslation("semAssinatura.titulo")}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                          {getTranslation("semAssinatura.descricao")}
                        </p>
                        <Button
                          onClick={() => setShowPlans(true)}
                          size="lg"
                          className="bg-gradient-to-r from-[#00cfec] to-[#007cca] text-white hover:opacity-90"
                        >
                          <Shield className="h-5 w-5 mr-2" />
                          {getTranslation("verPlanos")}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Dialog de Cancelamento */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">
                {getTranslation("dialog.cancelar.titulo")}
              </DialogTitle>
              <DialogDescription className="text-center">
                {getTranslation("dialog.cancelar.descricao")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-300">
                      {getTranslation("dialog.cancelar.acessoAte")}
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      {getTranslation("dialog.cancelar.continuaraAcesso")}{" "}
                      <span className="font-semibold">
                        {format(
                          new Date(subscription?.fimPlano || new Date()),
                          "dd/MM/yyyy",
                        )}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                className="w-full sm:w-1/2"
              >
                {getTranslation("dialog.cancelar.manterAssinatura")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmCancel}
                disabled={isCanceling}
                className="w-full sm:w-1/2"
              >
                {isCanceling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {getTranslation("cancelando")}
                  </>
                ) : (
                  getTranslation("dialog.cancelar.confirmarCancelamento")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Reativação */}
        <Dialog
          open={showReactivateDialog}
          onOpenChange={setShowReactivateDialog}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mb-4">
                <RotateCcw className="h-6 w-6 text-emerald-600" />
              </div>
              <DialogTitle className="text-center text-xl">
                {getTranslation("dialog.reativar.titulo")}
              </DialogTitle>
              <DialogDescription className="text-center">
                {getTranslation("dialog.reativar.descricao")}{" "}
                {getPlanName(subscription?.plano || "pro")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-emerald-800 dark:text-emerald-300">
                      {getTranslation("dialog.reativar.beneficios")}
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-emerald-700 dark:text-emerald-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        {getTranslation("recursos.lancamentosIlimitados")}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        {getTranslation("recursos.whatsappIlimitado")}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        {getTranslation("recursos.categoriasIlimitadas")}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setShowReactivateDialog(false)}
                className="w-full sm:w-1/2"
              >
                {getTranslation("dialog.reativar.manterCancelado")}
              </Button>
              <Button
                onClick={handleReactivateSubscription}
                disabled={isReactivating}
                className="w-full sm:w-1/2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
              >
                {isReactivating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {getTranslation("dialog.reativar.processando")}
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {getTranslation("dialog.reativar.reativarAgora")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
