// app/[lang]/dashboard/perfil/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { Pricing } from "@/components/landingpage/Pricing";
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
  User,
  Camera,
  Save,
  Loader2,
  CreditCard,
  Upload,
  X,
  Calendar,
  Shield,
  Users,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { PricingMenor } from "@/components/dashboard/PricingMenor";

// Tipos para o plano do usuário
interface UserSubscription {
  id: string;
  plan: "basic" | "pro" | "family";
  status: "active" | "canceled" | "past_due" | "trialing";
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  trial_end: number | null;
  currency: "BRL" | "USD";
  amount: number;
  interval: "month" | "year";
  customer_portal_url?: string;
}

export default function PerfilPage() {
  const { data: session, update } = useSession();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [showPlans, setShowPlans] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null,
  );
  const [isManaging, setIsManaging] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    } finally {
      setLoadingSubscription(false);
    }
  };

  // Funções auxiliares
  const getUsername = () => {
    if (!session?.user?.email) return "";
    const email = session.user.email;
    return email.split("@")[0];
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
        toast.error(
          t("perfil:notificacoes.arquivoInvalido") ||
            "Por favor, selecione uma imagem válida",
        );
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(
          t("perfil:notificacoes.tamanhoExcedido") ||
            "A imagem deve ter no máximo 5MB",
        );
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
        toast.error(
          t("perfil:notificacoes.erroAtualizar") ||
            "Nenhuma imagem selecionada",
        );
        setIsSaving(false);
        return;
      }

      const formData = new FormData();
      formData.append("avatar", selectedFile);

      const response = await fetch("/api/usuarios/alterar-foto", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            t("perfil:notificacoes.erroAtualizar") ||
            "Erro ao atualizar foto",
        );
      }

      toast.success(
        t("perfil:notificacoes.fotoAtualizada") ||
          "Foto atualizada com sucesso!",
      );

      await update();
      setSelectedFile(null);
      setAvatarPreview(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Erro ao salvar foto:", error);
      toast.error(
        error.message ||
          t("perfil:notificacoes.erroAtualizar") ||
          "Erro ao atualizar foto",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Funções para gerenciar plano
  const handleManageSubscription = async () => {
    try {
      setIsManaging(true);
      const response = await fetch("/api/usuarios/portal-session", {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL do portal não disponível");
      }
    } catch (error) {
      console.error("Erro ao acessar portal:", error);
      toast.error(
        t("perfil:notificacoes.erroPortal") ||
          "Erro ao acessar portal de gerenciamento",
      );
    } finally {
      setIsManaging(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        t("perfil:confirmacoes.cancelarAssinatura") ||
          "Tem certeza que deseja cancelar sua assinatura?",
      )
    ) {
      return;
    }

    try {
      setIsCanceling(true);
      const response = await fetch("/api/usuarios/subscription/cancel", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          t("perfil:notificacoes.assinaturaCancelada") ||
            "Assinatura cancelada com sucesso",
        );
        await loadUserSubscription(); // Recarregar dados
      } else {
        throw new Error(data.error || "Erro ao cancelar assinatura");
      }
    } catch (error: any) {
      console.error("Erro ao cancelar assinatura:", error);
      toast.error(
        error.message ||
          t("perfil:notificacoes.erroCancelar") ||
          "Erro ao cancelar assinatura",
      );
    } finally {
      setIsCanceling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setIsReactivating(true);
      const response = await fetch("/api/usuarios/subscription/reactivate", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          t("perfil:notificacoes.assinaturaReativada") ||
            "Assinatura reativada com sucesso",
        );
        await loadUserSubscription(); // Recarregar dados
      } else {
        throw new Error(data.error || "Erro ao reativar assinatura");
      }
    } catch (error: any) {
      console.error("Erro ao reativar assinatura:", error);
      toast.error(
        error.message ||
          t("perfil:notificacoes.erroReativar") ||
          "Erro ao reativar assinatura",
      );
    } finally {
      setIsReactivating(false);
    }
  };

  const handleUpgradePlan = () => {
    setShowPlans(true);
    // Rola a página para a seção de planos
    setTimeout(() => {
      document
        .getElementById("plans-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };
  const handleBackToProfile = () => {
    setShowPlans(false);
    // Volta para a aba de perfil
    setTimeout(() => {
      document
        .getElementById("profile-tab")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };
  // Funções auxiliares para formatação
  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "-";
    const locale = i18n.language === "pt" ? ptBR : enUS;
    return format(new Date(timestamp * 1000), "PPP", { locale });
  };

  const getPlanName = (plan: string) => {
    const planMap: Record<string, string> = {
      basic: t("perfil:plano.basic", "Básico"),
      pro: t("perfil:plano.pro", "Pro"),
      family: t("perfil:plano.family", "Família"),
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

  const PlanIcon = subscription ? getPlanIcon(subscription.plan) : User;

  return (
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
            {t("perfil:titulo", "Meu Perfil")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t(
              "perfil:descricao",
              "Gerencie suas informações pessoais e preferências",
            )}
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" id="profile-tab">
              {t("perfil:abas.perfil", "Perfil")}
            </TabsTrigger>
            <TabsTrigger value="subscription">
              {t("perfil:abas.assinatura", "Assinatura")}
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
                      {t("perfil:informacoesPessoais", "Informações Pessoais")}
                    </CardTitle>
                    <CardDescription>
                      {selectedFile
                        ? t(
                            "perfil:descricaoInformacoes.comFoto",
                            "Clique em Salvar Alterações para atualizar sua foto",
                          )
                        : t(
                            "perfil:descricaoInformacoes.semFoto",
                            "Clique no ícone da câmera para alterar sua foto de perfil",
                          )}
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
                              {t(
                                "perfil:dicas.tamanhoMaximo",
                                "Tamanho máximo: 5MB",
                              )}{" "}
                              •{" "}
                              {t(
                                "perfil:dicas.formatosSuportados",
                                "Formatos: JPG, PNG, WebP",
                              )}
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
                            {t("perfil:campos.nomeCompleto", "Nome Completo")}
                          </Label>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-gray-900 dark:text-white">
                              {session?.user?.name ||
                                t(
                                  "perfil:campos.naoInformado",
                                  "Não informado",
                                )}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-500 dark:text-gray-400">
                            {t("perfil:campos.email", "E-mail")}
                          </Label>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-gray-900 dark:text-white">
                              {session?.user?.email ||
                                t(
                                  "perfil:campos.naoInformado",
                                  "Não informado",
                                )}
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
                          {t("perfil:cancelar", "Cancelar")}
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                          {isSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              {t("perfil:salvando", "Salvando...")}
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              {t(
                                "perfil:salvarAlteracoes",
                                "Salvar Alterações",
                              )}
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
                      {t("perfil:statusConta", "Status da Conta")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {t("perfil:campos.planoAtual", "Plano Atual")}
                      </span>
                      {loadingSubscription ? (
                        <Skeleton className="h-6 w-20" />
                      ) : (
                        <Badge
                          className={getPlanColor(
                            subscription?.plan || "basic",
                          )}
                        >
                          {getPlanName(subscription?.plan || "basic")}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {t("perfil:campos.status", "Status")}
                      </span>
                      {loadingSubscription ? (
                        <Skeleton className="h-6 w-24" />
                      ) : subscription?.status === "active" ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t("perfil:status.ativo", "Ativo")}
                        </Badge>
                      ) : subscription?.status === "canceled" ? (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                          <X className="h-3 w-3 mr-1" />
                          {t("perfil:status.cancelado", "Cancelado")}
                        </Badge>
                      ) : subscription?.status === "past_due" ? (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {t("perfil:status.atrasado", "Atrasado")}
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {t("perfil:status.teste", "Teste Grátis")}
                        </Badge>
                      )}
                    </div>

                    {subscription?.current_period_end && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          {t("perfil:campos.vencimento", "Próximo vencimento")}
                        </span>
                        <span className="font-medium">
                          {formatDate(subscription.current_period_end)}
                        </span>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={() =>
                        router.push(
                          `/${i18n.language}/dashboard/perfil#subscription`,
                        )
                      }
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {t("perfil:gerenciarPlano", "Gerenciar Plano")}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-6">
            {showPlans ? (
              <div id="plans-section">
                <Card>
                  <CardContent>
                    {/* Componente Pricing com os planos */}
                    <PricingMenor plans={getPlansData()} />
                  </CardContent>
                </Card>
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
                      {/* Resumo da Assinatura */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
                                <PlanIcon className="h-6 w-6" />
                              </div>
                              <div>
                                <h3 className="text-xl font-semibold">
                                  {getPlanName(subscription.plan)}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                  {subscription.interval === "year"
                                    ? t(
                                        "perfil:assinatura.cobrancaAnual",
                                        "Cobrança anual",
                                      )
                                    : t(
                                        "perfil:assinatura.cobrancaMensal",
                                        "Cobrança mensal",
                                      )}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {t("perfil:assinatura.valor", "Valor")}
                                </p>
                                <p className="text-2xl font-bold">
                                  {subscription.currency === "BRL" ? "R$" : "$"}
                                  {(subscription.amount / 100).toFixed(2)}
                                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                                    /
                                    {subscription.interval === "year"
                                      ? t("perfil:periodo.ano", "ano")
                                      : t("perfil:periodo.mes", "mês")}
                                  </span>
                                </p>
                              </div>

                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {t("perfil:assinatura.status", "Status")}
                                </p>
                                <div className="flex items-center gap-2">
                                  {subscription.status === "active" ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                      <span className="font-medium text-green-600 dark:text-green-400">
                                        {t("perfil:status.ativo", "Ativo")}
                                      </span>
                                    </>
                                  ) : subscription.status === "canceled" ? (
                                    <>
                                      <X className="h-4 w-4 text-red-500" />
                                      <span className="font-medium text-red-600 dark:text-red-400">
                                        {t(
                                          "perfil:status.cancelado",
                                          "Cancelado",
                                        )}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                                      <span className="font-medium text-yellow-600 dark:text-yellow-400">
                                        {t(
                                          "perfil:status.atrasado",
                                          "Atrasado",
                                        )}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {subscription.cancel_at_period_end
                                    ? t(
                                        "perfil:assinatura.expiraEm",
                                        "Expira em",
                                      )
                                    : t(
                                        "perfil:assinatura.renovaEm",
                                        "Renova em",
                                      )}
                                </p>
                                <p className="font-medium">
                                  {subscription.current_period_end
                                    ? formatDate(
                                        subscription.current_period_end,
                                      )
                                    : "-"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {subscription.plan !== "family" && (
                            <Button
                              onClick={handleUpgradePlan}
                              variant="outline"
                              className="whitespace-nowrap"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              {t("perfil:upgradePlano", "Upgrade de Plano")}
                            </Button>
                          )}
                        </div>

                        {/* Avisos */}
                        {subscription.cancel_at_period_end && (
                          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                              <div>
                                <p className="text-yellow-800 dark:text-yellow-300 font-medium">
                                  {t(
                                    "perfil:avisos.assinaturaCancelada",
                                    "Sua assinatura foi cancelada",
                                  )}
                                </p>
                                <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">
                                  {t(
                                    "perfil:avisos.acessoAte",
                                    "Você terá acesso ao plano até",
                                  )}{" "}
                                  {subscription.current_period_end
                                    ? formatDate(
                                        subscription.current_period_end,
                                      )
                                    : "-"}
                                  .
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {subscription.trial_end &&
                          subscription.trial_end > Date.now() / 1000 && (
                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                              <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                <div>
                                  <p className="text-blue-800 dark:text-blue-300 font-medium">
                                    {t(
                                      "perfil:avisos.testeAtivo",
                                      "Período de teste ativo",
                                    )}
                                  </p>
                                  <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">
                                    {t(
                                      "perfil:avisos.testeTermina",
                                      "Seu teste gratuito termina em",
                                    )}{" "}
                                    {formatDate(subscription.trial_end)}.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                      </div>

                      {/* Ações da Assinatura */}
                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          onClick={handleManageSubscription}
                          disabled={
                            isManaging || subscription.status === "canceled"
                          }
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
                                "Portal de Gerenciamento",
                              )}
                            </>
                          )}
                        </Button>

                        {subscription.status === "active" &&
                        !subscription.cancel_at_period_end ? (
                          <Button
                            onClick={handleCancelSubscription}
                            variant="destructive"
                            disabled={isCanceling}
                            className="w-full"
                          >
                            {isCanceling ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              t(
                                "perfil:cancelarAssinatura",
                                "Cancelar Assinatura",
                              )
                            )}
                          </Button>
                        ) : subscription.cancel_at_period_end ? (
                          <Button
                            onClick={handleReactivateSubscription}
                            variant="outline"
                            disabled={isReactivating}
                            className="w-full"
                          >
                            {isReactivating ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
                            onClick={handleUpgradePlan}
                            className="w-full bg-gradient-to-r from-[#00cfec] to-[#007cca] text-white hover:opacity-90"
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            {t("perfil:assinarAgora", "Assinar Agora")}
                          </Button>
                        )}
                      </div>

                      {/* Informações de suporte */}
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t(
                            "perfil:infoSuporte",
                            "Precisa de ajuda? Entre em contato com nosso suporte.",
                          )}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {t(
                          "perfil:semAssinatura.titulo",
                          "Nenhuma assinatura ativa",
                        )}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {t(
                          "perfil:semAssinatura.descricao",
                          "Você está usando o plano gratuito. Faça upgrade para desbloquear todos os recursos.",
                        )}
                      </p>
                      <Button
                        onClick={handleUpgradePlan}
                        className="bg-gradient-to-r from-[#00cfec] to-[#007cca] text-white hover:opacity-90"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        {t("perfil:verPlanos", "Ver Planos")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
