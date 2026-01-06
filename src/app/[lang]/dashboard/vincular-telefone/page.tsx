"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
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
  ArrowLeft,
  Smartphone,
  CheckCircle2,
  MessageCircle,
  Mic,
  Zap,
} from "lucide-react";
import { Loading } from "@/components/ui/loading-barrinhas";

export default function VincularTelefone() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation("vincular");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (status === "loading") {
    return <Loading />;
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

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
        setMessage("success");
        // Redirecionar após 2 segundos
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage(t("erros.erroVincular"));
    } finally {
      setLoading(false);
    }
  };

  // Formatar telefone enquanto digita
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

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Formulário de Vinculação */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-gray-900 dark:text-white">
                  <Smartphone className="h-4 w-4 sm:h-5 sm:w-5" />
                  {t("formulario.titulo")}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {t("formulario.descricao")}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <form
                  className="space-y-4 sm:space-y-6"
                  onSubmit={handleSubmit}
                >
                  <div className="space-y-2 sm:space-y-3">
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
                  </div>

                  {message && (
                    <div
                      className={`p-3 sm:p-4 rounded-lg border text-sm sm:text-base ${
                        message === "success"
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300"
                          : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {message === "success" ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                            <span className="truncate">
                              {t("mensagens.sucesso")}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="truncate">❌ {message}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || telefone.length < 14}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 text-sm sm:text-base py-2.5 sm:py-3"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="truncate">
                          {t("botoes.vincularLoading")}
                        </span>
                      </div>
                    ) : (
                      <span className="truncate">{t("botoes.vincular")}</span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Benefícios */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-white">
                  {t("beneficios.titulo")}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {t("beneficios.descricao")}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-blue-50 dark:bg-gray-800/50">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mic className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                      {t("beneficios.lancamentos.titulo")}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {t("beneficios.lancamentos.descricao")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-green-50 dark:bg-gray-800/50">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                      {t("beneficios.whatsapp.titulo")}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {t("beneficios.whatsapp.descricao")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-purple-50 dark:bg-gray-800/50">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                      {t("beneficios.rapido.titulo")}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {t("beneficios.rapido.descricao")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
