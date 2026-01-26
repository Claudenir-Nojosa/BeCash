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

// Mock da função de tradução
const t = (key: string, fallback: string) => fallback;

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
  const { i18n } = useTranslation("");

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
    toast.error("Não foi possível carregar os dados da assinatura");
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
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
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
      toast.info("Nenhuma imagem selecionada");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", selectedFile);

    const response = await fetch("/api/usuarios/alterar-foto", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Erro ao atualizar foto");
    }

    toast.success("Foto atualizada com sucesso!");
    
    await update();
    setSelectedFile(null);
    setAvatarPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  } catch (error: any) {
    console.error("Erro ao salvar foto:", error);
    toast.error(error.message || "Erro ao atualizar foto");
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
      toast.success("Assinatura cancelada com sucesso");
      
      await loadUserSubscription();
      setShowCancelDialog(false);
      setCancellationReason("");
    } else {
      throw new Error("Erro ao cancelar assinatura");
    }
  } catch (error: any) {
    console.error("Erro ao cancelar assinatura:", error);
    toast.error(error.message || "Erro ao cancelar assinatura");
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
        name: t("pricingPlans:plans.basic.name", "Básico"),
        price: "0",
        yearlyPrice: "0",
        priceReal: "0",
        yearlyPriceReal: "0",
        period: t("pricingPlans:plans.basic.period", "mês"),
        features: [
          t(
            "pricingPlans:plans.basic.features.0",
            "Até 50 lançamentos por mês",
          ),
          t(
            "pricingPlans:plans.basic.features.1",
            "3 mensagens WhatsApp AI por mês",
          ),
          t(
            "pricingPlans:plans.basic.features.2",
            "Criação de até 10 categorias",
          ),
          t(
            "pricingPlans:plans.basic.features.3",
            "Criação de até 2 metas pessoais",
          ),
          t("pricingPlans:plans.basic.features.4", "Análise básica de gastos"),
          t("pricingPlans:plans.basic.features.5", "Suporte por email"),
        ],
        description: t(
          "pricingPlans:plans.basic.description",
          "Perfeito para começar a controlar suas finanças",
        ),
        buttonText: t("pricingPlans:plans.basic.buttonText", "Começar Grátis"),
        href: `/${i18n.language}/signup`,
        isPopular: false,
      },
      {
        name: t("pricingPlans:plans.pro.name", "Pro"),
        price: "5.00",
        yearlyPrice: "4.00",
        priceReal: "19.90",
        yearlyPriceReal: "16.58",
        period: t("pricingPlans:plans.pro.period", "mês"),
        features: [
          t("pricingPlans:plans.pro.features.0", "Lançamentos ilimitados"),
          t("pricingPlans:plans.pro.features.1", "WhatsApp AI ilimitado"),
          t("pricingPlans:plans.pro.features.2", "Categorias ilimitadas"),
          t("pricingPlans:plans.pro.features.3", "Metas ilimitadas"),
          t("pricingPlans:plans.pro.features.4", "Limites por categoria"),
          t(
            "pricingPlans:plans.pro.features.5",
            "Até 3 despesas compartilhadas",
          ),
          t("pricingPlans:plans.pro.features.6", "Relatórios avançados"),
          t("pricingPlans:plans.pro.features.7", "Suporte prioritário"),
        ],
        description: t(
          "pricingPlans:plans.pro.description",
          "Para quem leva finanças a sério",
        ),
        buttonText: session?.user
          ? t("perfil:upgradeParaPro", "Upgrade para Pro")
          : t("pricingPlans:plans.pro.buttonText", "Seja PRO"),
        href: session?.user
          ? `/api/checkout?plan=pro&lang=${i18n.language}`
          : `/${i18n.language}/signup?plan=pro`,
        isPopular: true,
        badge: t("popularBadge", "Popular"),
      },
      {
        name: t("pricingPlans:plans.family.name", "Família"),
        price: "13.00",
        yearlyPrice: "11.00",
        priceReal: "49.90",
        yearlyPriceReal: "41.58",
        period: t("pricingPlans:plans.family.period", "mês"),
        features: [
          t("pricingPlans:plans.family.features.0", "Tudo do plano Pro"),
          t("pricingPlans:plans.family.features.1", "Até 5 membros da família"),
          t(
            "pricingPlans:plans.family.features.2",
            "Despesas compartilhadas ilimitadas",
          ),
          t(
            "pricingPlans:plans.family.features.3",
            "Metas familiares colaborativas",
          ),
          t(
            "pricingPlans:plans.family.features.4",
            "Suporte 24/7 com BiCla (IA assistente financeiro)",
          ),
        ],
        description: t(
          "pricingPlans:plans.family.description",
          "Ideal para famílias que querem controlar tudo junto",
        ),
        buttonText: session?.user
          ? t("perfil:upgradeParaFamilia", "Upgrade para Família")
          : t("pricingPlans:plans.family.buttonText", "Começar Teste Grátis"),
        href: session?.user
          ? `/api/checkout?plan=family&lang=${i18n.language}`
          : `/${i18n.language}/signup?plan=family`,
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
      throw new Error("URL do portal não disponível");
    }
  } catch (error) {
    console.error("Erro ao acessar portal:", error);
    toast.error("Erro ao acessar portal de gerenciamento");
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
      toast.success("Assinatura reativada com sucesso");
      
      await loadUserSubscription();
      setShowReactivateDialog(false);
    } else {
      throw new Error("Erro ao reativar assinatura");
    }
  } catch (error: any) {
    console.error("Erro ao reativar assinatura:", error);
    toast.error(error.message || "Erro ao reativar assinatura");
  } finally {
    setIsReactivating(false);
  }
};

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getPlanName = (plan: string) => {
    const planMap: Record<string, string> = {
      free: "Básico",
      pro: "Pro",
      family: "Família",
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
              Meu Perfil
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gerencie suas informações pessoais e preferências
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="subscription">Assinatura</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna Esquerda - Informações do Perfil */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Informações Pessoais
                      </CardTitle>
                      <CardDescription>
                        {selectedFile
                          ? "Clique em Salvar Alterações para atualizar sua foto"
                          : "Clique no ícone da câmera para alterar sua foto de perfil"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Foto do Perfil */}
                      <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-6">
                        <div className="relative">
                          <Avatar className="h-24 w-24 border-4 border-gray-100 dark:border-gray-800">
                            <AvatarImage
                              src={avatarPreview || session?.user?.image || ""}
                              alt={session?.user?.name || "Usuário"}
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
                                Tamanho máximo: 5MB • Formatos: JPG, PNG, WebP
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
                              Nome Completo
                            </Label>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <p className="text-gray-900 dark:text-white">
                                {session?.user?.name || "Não informado"}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-gray-500 dark:text-gray-400">
                              E-mail
                            </Label>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <p className="text-gray-900 dark:text-white">
                                {session?.user?.email || "Não informado"}
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
                            Cancelar
                          </Button>
                          <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Salvando...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Salvar Alterações
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
                      <CardTitle className="text-lg">Status da Conta</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Plano Atual
                        </span>
                        {loadingSubscription ? (
                          <Skeleton className="h-6 w-20" />
                        ) : (
                          <Badge
                            className={getPlanColor(
                              subscription?.plano || "free"
                            )}
                          >
                            {getPlanName(subscription?.plano || "free")}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Status
                        </span>
                        {loadingSubscription ? (
                          <Skeleton className="h-6 w-24" />
                        ) : effectiveStatus === "active" ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : effectiveStatus === "canceled" ? (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                            <X className="h-3 w-3 mr-1" />
                            Cancelado
                          </Badge>
                        ) : effectiveStatus === "expired" ? (
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Expirado
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            Teste Grátis
                          </Badge>
                        )}
                      </div>

                      {subscription?.fimPlano && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            {isExpired ? "Expirou em" : "Próximo vencimento"}
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
                      {t("perfil:voltarParaAssinatura", "Voltar para Assinatura")}
                    </Button>
                  </div>
                  <PricingMenor plans={getPlansData()} />
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PlanIcon className="h-5 w-5" />
                      {t("perfil:assinatura.titulo", "Gerenciar Assinatura")}
                    </CardTitle>
                    <CardDescription>
                      {t(
                        "perfil:assinatura.descricao",
                        "Visualize e gerencie sua assinatura atual",
                      )}
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
                                    {t("perfil:plano", "Plano")}{" "}
                                    {getPlanName(subscription.plano)}
                                  </h3>
                                  <p className="text-gray-600 dark:text-gray-400">
                                    {t(
                                      "perfil:assinatura.cobrancaMensal",
                                      "Cobrança mensal",
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                    {t("perfil:assinatura.status", "Status")}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    {subscription.status === "active" &&
                                    new Date(subscription.fimPlano) >
                                      new Date() ? (
                                      <>
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                                          {t("perfil:status.ativo", "Ativo")}
                                        </span>
                                      </>
                                    ) : subscription.status === "canceled" ||
                                      subscription.canceladoEm ? (
                                      <>
                                        <X className="h-5 w-5 text-red-500" />
                                        <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                                          {t(
                                            "perfil:status.cancelado",
                                            "Cancelado",
                                          )}
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <AlertCircle className="h-5 w-5 text-gray-500" />
                                        <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                                          {t(
                                            "perfil:status.expirado",
                                            "Expirado",
                                          )}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                    {t(
                                      "perfil:assinatura.inicio",
                                      "Data de Início",
                                    )}
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
                                    {new Date(subscription.fimPlano) < new Date()
                                      ? t(
                                          "perfil:assinatura.expirouEm",
                                          "Expirou em",
                                        )
                                      : subscription.canceladoEm
                                        ? t(
                                            "perfil:assinatura.expiraEm",
                                            "Expira em",
                                          )
                                        : t(
                                            "perfil:assinatura.renovaEm",
                                            "Próxima Renovação",
                                          )}
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
                                    {t("perfil:upgradePlano", "Fazer Upgrade")}
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
                                      {t(
                                        "perfil:avisos.assinaturaCancelada",
                                        "Assinatura Cancelada",
                                      )}
                                    </p>
                                    <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">
                                      {t(
                                        "perfil:avisos.acessoAte",
                                        "Você ainda terá acesso aos recursos premium até",
                                      )}{" "}
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
                                    {t(
                                      "perfil:avisos.assinaturaExpirada",
                                      "Assinatura Expirada",
                                    )}
                                  </p>
                                  <p className="text-red-700 dark:text-red-400 text-sm mt-1">
                                    {t(
                                      "perfil:avisos.renovePara",
                                      "Sua assinatura expirou. Renove agora para continuar aproveitando todos os recursos premium.",
                                    )}
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
                            {t(
                              "perfil:recursosIncluidos",
                              "Recursos Incluídos no seu Plano",
                            )}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {subscription.plano === "free" ? (
                              <>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>
                                    {t(
                                      "recursos.lancamentosLimitados",
                                      "Até 50 lançamentos por mês",
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>
                                    {t(
                                      "recursos.whatsappLimitado",
                                      "3 mensagens WhatsApp AI por mês",
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>
                                    {t(
                                      "recursos.categorias",
                                      "Até 10 categorias",
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>
                                    {t("recursos.metas", "Até 2 metas pessoais")}
                                  </span>
                                </div>
                              </>
                            ) : subscription.plano === "pro" ? (
                              <>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="font-semibold bg-gradient-to-r from-[#00cfec] to-[#007cca] bg-clip-text text-transparent">
                                    {t(
                                      "recursos.lancamentosIlimitados",
                                      "Lançamentos ilimitados",
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="font-semibold bg-gradient-to-r from-[#00cfec] to-[#007cca] bg-clip-text text-transparent">
                                    {t(
                                      "recursos.whatsappIlimitado",
                                      "WhatsApp AI ilimitado",
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>
                                    {t(
                                      "recursos.categoriasIlimitadas",
                                      "Categorias ilimitadas",
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>
                                    {t(
                                      "recursos.metasIlimitadas",
                                      "Metas ilimitadas",
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>
                                    {t(
                                      "recursos.limitesCategorias",
                                      "Limites por categoria",
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>
                                    {t(
                                      "recursos.despesasCompartilhadas",
                                      "Até 3 despesas compartilhadas",
                                    )}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-purple-500" />
                                  <span className="font-semibold">
                                    {t("recursos.tudoPro", "Tudo do plano Pro")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-purple-500" />
                                  <span>
                                    {t(
                                      "recursos.membros",
                                      "Até 5 membros da família",
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-purple-500" />
                                  <span>
                                    {t(
                                      "recursos.despesasIlimitadas",
                                      "Despesas compartilhadas ilimitadas",
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-purple-500" />
                                  <span>
                                    {t(
                                      "recursos.metasFamiliares",
                                      "Metas familiares colaborativas",
                                    )}
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
                            {t("perfil:acoes", "Ações")}
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
                                  {t("perfil:carregando", "Carregando...")}
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  {t(
                                    "perfil:portalGerenciamento",
                                    "Abrir Portal do Stripe",
                                  )}
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
                                    {t("perfil:cancelando", "Cancelando...")}
                                  </>
                                ) : (
                                  <>
                                    <X className="h-4 w-4 mr-2" />
                                    {t(
                                      "perfil:cancelarAssinatura",
                                      "Cancelar Assinatura",
                                    )}
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
                                    {t("perfil:reativando", "Reativando...")}
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    {t(
                                      "perfil:reativarAssinatura",
                                      "Reativar Assinatura",
                                    )}
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button
                                onClick={() => setShowPlans(true)}
                                className="w-full bg-gradient-to-r from-[#00cfec] to-[#007cca] text-white hover:opacity-90"
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                {t("perfil:assinarAgora", "Assinar Agora")}
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
                          {t(
                            "perfil:semAssinatura.titulo",
                            "Nenhuma assinatura ativa",
                          )}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                          {t(
                            "perfil:semAssinatura.descricao",
                            "Você está usando o plano gratuito. Faça upgrade para desbloquear recursos premium e aproveitar ao máximo nossa plataforma.",
                          )}
                        </p>
                        <Button
                          onClick={() => setShowPlans(true)}
                          size="lg"
                          className="bg-gradient-to-r from-[#00cfec] to-[#007cca] text-white hover:opacity-90"
                        >
                          <Shield className="h-5 w-5 mr-2" />
                          {t("perfil:verPlanos", "Ver Planos Disponíveis")}
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
                Confirmar Cancelamento
              </DialogTitle>
              <DialogDescription className="text-center">
                Tem certeza que deseja cancelar sua assinatura?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-300">
                      Acesso até o fim do período
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Você continuará com acesso premium até{" "}
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
                Manter Assinatura
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
                    Cancelando...
                  </>
                ) : (
                  "Confirmar Cancelamento"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Reativação */}
        <Dialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mb-4">
                <RotateCcw className="h-6 w-6 text-emerald-600" />
              </div>
              <DialogTitle className="text-center text-xl">
                Reativar Assinatura
              </DialogTitle>
              <DialogDescription className="text-center">
                Confirme a reativação da sua assinatura{" "}
                {getPlanName(subscription?.plano || "pro")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-emerald-800 dark:text-emerald-300">
                      Benefícios que você recupera
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-emerald-700 dark:text-emerald-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        Lançamentos ilimitados
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        WhatsApp AI ilimitado
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        Categorias ilimitadas
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
                Manter Cancelado
              </Button>
              <Button
                onClick={handleReactivateSubscription}
                disabled={isReactivating}
                className="w-full sm:w-1/2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
              >
                {isReactivating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reativar Agora
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