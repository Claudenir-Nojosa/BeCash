"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Smartphone,
  CheckCircle2,
  MessageCircle,
  Mic,
  Zap,
  Trash2,
  Shield,
  Globe,
  Bell,
  Lock,
} from "lucide-react";
import { Loading } from "@/components/ui/loading-barrinhas";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

interface PhoneInfo {
  temTelefoneVinculado: boolean;
  telefone: string | null;
  usuario: {
    name: string | null;
    email: string | null;
  };
}

export default function VincularTelefone() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, i18n } = useTranslation("vincularTelefone");

  const [phoneInfo, setPhoneInfo] = useState<PhoneInfo | null>(null);
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPhoneInfo, setLoadingPhoneInfo] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("pt-BR");
  const [savedLanguage, setSavedLanguage] = useState("pt-BR");

  const getLocalizedPath = (path: string) => {
    return `/${i18n.language}${path}`;
  };

  const fetchPhoneInfo = useCallback(async () => {
    try {
      setLoadingPhoneInfo(true);
      const response = await fetch("/api/usuarios/vincular-telefone");
      const data = await response.json();

      if (data.success) {
        setPhoneInfo(data);
      } else {
        setMessage({ type: "error", text: t("mensagens.erroCarregar") });
      }
    } catch (error) {
      setMessage({ type: "error", text: t("mensagens.erroCarregar") });
    } finally {
      setLoadingPhoneInfo(false);
    }
  }, [t]);

  const fetchUserConfig = useCallback(async () => {
    try {
      const response = await fetch("/api/configuracoes");
      const data = await response.json();

      if (data.configuracoes) {
        setSelectedLanguage(data.configuracoes.idioma || "pt-BR");
        setSavedLanguage(data.configuracoes.idioma || "pt-BR");
      }
    } catch (error) {
      console.error(t("mensagens.erroConfiguracoes"), error);
    }
  }, [t]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPhoneInfo();
      fetchUserConfig();
    }
  }, [status, fetchPhoneInfo, fetchUserConfig]);

  const handleSaveLanguage = async () => {
    setSavingLanguage(true);
    setMessage(null);

    try {
      const response = await fetch("/api/configuracoes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idioma: selectedLanguage }),
      });

      const data = await response.json();

      if (data.success) {
        setSavedLanguage(selectedLanguage);
        setMessage({
          type: "success",
          text: t("mensagens.idiomaSalvo"),
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || t("erros.salvarIdioma"),
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: t("erros.salvarIdioma") });
    } finally {
      setSavingLanguage(false);
    }
  };

  if (status === "loading" || loadingPhoneInfo) {
    return <Loading />;
  }

  if (!session) {
    router.push(getLocalizedPath("/login"));
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (phoneInfo?.temTelefoneVinculado) {
      setMessage({
        type: "error",
        text: t("mensagens.jaVinculado"),
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/usuarios/vincular-telefone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ telefone }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: t("mensagens.vinculadoSucesso"),
        });
        setTelefone("");
        await fetchPhoneInfo();

        setTimeout(() => {
          router.push(getLocalizedPath("/dashboard"));
        }, 2000);
      } else {
        setMessage({
          type: "error",
          text: data.error || t("erros.vincularTelefone"),
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: t("erros.vincularTelefone") });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhone = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/usuarios/vincular-telefone", {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: t("mensagens.desvinculadoSucesso"),
        });
        await fetchPhoneInfo();
      } else {
        setMessage({
          type: "error",
          text: data.error || t("erros.desvincularTelefone"),
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: t("erros.desvincularTelefone") });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");

    if (value.length <= 11) {
      if (value.length > 2) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
      }
      if (value.length > 10) {
        value = `${value.slice(0, 10)}-${value.slice(10)}`;
      }
    }

    setTelefone(value);
  };

  const formatPhoneForDisplay = (phone: string | null) => {
    if (!phone) return "";

    const numbers = phone.replace(/\D/g, "");

    if (numbers.length === 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    } else if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }

    return phone;
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-3 sm:gap-4"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {t("titulo")}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {t("subtitulo")}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Formulário de Vinculação */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Card de Telefone Vinculado */}
            <AnimatePresence mode="wait">
              {phoneInfo?.temTelefoneVinculado && phoneInfo.telefone && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-white dark:bg-gray-900 border-green-200 dark:border-green-800 shadow-2xl">
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="flex items-center justify-between text-lg sm:text-xl text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Image
                            src="/icons/whatsapp.png"
                            alt="WhatsApp"
                            width={20}
                            height={20}
                            className="h-6 w-6 sm:h-5 sm:w-5"
                          />
                          {t("cartoes.telefoneVinculado.titulo")}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteDialog(true)}
                          disabled={isDeleting}
                          className="border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700"
                        >
                          {isDeleting ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              {t("estados.desvinculando")}
                            </div>
                          ) : (
                            <>
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                              {t("botoes.desvincular")}
                            </>
                          )}
                        </Button>
                      </CardTitle>
                      <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                        {t("cartoes.telefoneVinculado.descricao")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="space-y-4">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-800"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                              <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {phoneInfo.usuario.name || t("labels.usuario")}
                              </p>
                              <p className="text-lg font-bold text-green-700 dark:text-green-400">
                                {formatPhoneForDisplay(phoneInfo.telefone)}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {phoneInfo.usuario.email}
                              </p>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                          className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800"
                        >
                          <div className="flex items-start gap-3">
                            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {t("cartoes.seguranca.titulo")}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("cartoes.seguranca.descricao")}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Card de Vincular Novo Telefone */}
              {!phoneInfo?.temTelefoneVinculado && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-gray-900 dark:text-white">
                        <Smartphone className="h-4 w-4 sm:h-5 sm:w-5" />
                        {t("cartoes.vincularTelefone.titulo")}
                      </CardTitle>
                      <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                        {t("cartoes.vincularTelefone.descricao")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <form
                        className="space-y-4 sm:space-y-6"
                        onSubmit={handleSubmit}
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="space-y-2 sm:space-y-3"
                        >
                          <Label
                            htmlFor="telefone"
                            className="text-sm sm:text-base text-gray-900 dark:text-white"
                          >
                            {t("formulario.labelTelefone")}
                          </Label>
                          <Input
                            id="telefone"
                            name="telefone"
                            type="tel"
                            placeholder={t("formulario.placeholderTelefone")}
                            required
                            value={telefone}
                            onChange={handleTelefoneChange}
                            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-500 w-full text-sm sm:text-base"
                          />
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {t("formulario.instrucaoTelefone")}
                          </p>
                        </motion.div>

                        <AnimatePresence>
                          {message && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className={`p-3 sm:p-4 rounded-lg border text-sm sm:text-base ${
                                message.type === "success"
                                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300"
                                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {message.type === "success" ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                                    <span className="truncate">
                                      {message.text}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="truncate">
                                      ❌ {message.text}
                                    </span>
                                  </>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <Button
                          type="submit"
                          disabled={loading || telefone.length < 14}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 text-sm sm:text-base py-2.5 sm:py-3"
                        >
                          {loading ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span className="truncate">
                                {t("estados.vinculando")}
                              </span>
                            </div>
                          ) : (
                            <span className="truncate">
                              {t("botoes.vincularTelefone")}
                            </span>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Card de Preferências de Idioma */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-2xl">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-gray-900 dark:text-white">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
                    {t("cartoes.idioma.titulo")}
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    {t("cartoes.idioma.descricao")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label
                        htmlFor="language"
                        className="text-sm sm:text-base text-gray-900 dark:text-white"
                      >
                        {t("formulario.labelIdioma")}
                      </Label>
                      <Select
                        value={selectedLanguage}
                        onValueChange={setSelectedLanguage}
                      >
                        <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                          <SelectValue
                            placeholder={t("formulario.placeholderIdioma")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt-BR">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">🇧🇷</span>
                              <span>{t("idiomas.portugues")}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="en-US">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">🇺🇸</span>
                              <span>{t("idiomas.ingles")}</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {t("formulario.instrucaoIdioma")}
                      </p>
                    </div>

                    <Button
                      onClick={handleSaveLanguage}
                      disabled={savingLanguage}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {savingLanguage ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{t("estados.salvando")}</span>
                        </div>
                      ) : (
                        t("botoes.salvarIdioma")
                      )}
                    </Button>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        {t("cartoes.idioma.atualSalvo")}
                      </p>
                      <div className="flex items-center gap-2">
                        {savedLanguage === "pt-BR" ? (
                          <>
                            <span className="text-2xl">🇧🇷</span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {t("idiomas.portugues")}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-2xl">🇺🇸</span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {t("idiomas.ingles")}
                            </span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar de Benefícios */}
          <div className="space-y-6 sm:space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">
                    {t("beneficios.titulo")}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {t("beneficios.subtitulo")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      icon: Bell,
                      gradient: "from-green-500 to-emerald-600",
                      bg: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
                      border: "border-green-100 dark:border-green-800/50",
                      titulo: t("beneficios.alertas.titulo"),
                      descricao: t("beneficios.alertas.descricao"),
                      delay: 0.2,
                    },
                    {
                      icon: Mic,
                      gradient: "from-blue-500 to-cyan-600",
                      bg: "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
                      border: "border-blue-100 dark:border-blue-800/50",
                      titulo: t("beneficios.comandos.titulo"),
                      descricao: t("beneficios.comandos.descricao"),
                      delay: 0.3,
                    },
                    {
                      icon: Zap,
                      gradient: "from-purple-500 to-pink-600",
                      bg: "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",
                      border: "border-purple-100 dark:border-purple-800/50",
                      titulo: t("beneficios.acesso.titulo"),
                      descricao: t("beneficios.acesso.descricao"),
                      delay: 0.4,
                    },
                    {
                      icon: Lock,
                      gradient: "from-amber-500 to-orange-600",
                      bg: "from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20",
                      border: "border-amber-100 dark:border-amber-800/50",
                      titulo: t("beneficios.seguranca.titulo"),
                      descricao: t("beneficios.seguranca.descricao"),
                      delay: 0.5,
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: item.delay }}
                      className={`p-4 bg-gradient-to-br ${item.bg} rounded-2xl border ${item.border}`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 bg-gradient-to-r ${item.gradient} rounded-xl`}
                        >
                          <item.icon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.titulo}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {item.descricao}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 overflow-hidden">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="inline-flex p-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl mb-4">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                      {t("privacidade.titulo")}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {t("privacidade.descricao")}
                    </p>
                    <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      {t("privacidade.criptografia")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
      {/* Dialog de Confirmação para Desvincular */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-red-500 to-rose-600 rounded-xl">
                <Trash2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <AlertDialogTitle className="text-xl text-gray-900 dark:text-white">
                  {t("confirmacao.titulo")}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                  {t("confirmacao.descricao", {
                    telefone: formatPhoneForDisplay(phoneInfo?.telefone || ""),
                  })}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl border border-red-200 dark:border-red-800 mb-6">
            <p className="text-sm text-red-700 dark:text-red-300">
              ⚠️ {t("confirmacao.aviso")}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl"
            >
              {t("botoes.cancelar")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePhone}
              disabled={isDeleting}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white border-0 shadow-lg rounded-xl"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("estados.processando")}
                </div>
              ) : (
                t("botoes.desconectar")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
