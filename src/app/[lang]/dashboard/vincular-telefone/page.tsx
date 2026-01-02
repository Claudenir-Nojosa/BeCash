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

export default function VincularTelefone() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation("vincular");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (status === "loading") {
    return (
      <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-800/30 border border-gray-400 dark:border-gray-700/50 rounded-lg animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-300 dark:bg-gray-800/30 border border-gray-400 dark:border-gray-700/50 rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-800/30 border border-gray-400 dark:border-gray-700/50 rounded w-96 animate-pulse"></div>
            </div>
          </div>

          {/* Card Skeleton */}
          <div className="bg-gray-100 dark:bg-gray-800/30 border border-gray-300 dark:border-gray-700/50 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-300 dark:bg-gray-700/50 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-300 dark:bg-gray-700/50 rounded w-1/2 mb-2"></div>
              <div className="h-10 bg-gray-300 dark:bg-gray-700/50 rounded"></div>
              <div className="h-10 bg-gray-300 dark:bg-gray-700/50 rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    );
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
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/dashboard")}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t("titulo")}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t("subtitulo")}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário de Vinculação */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Smartphone className="h-5 w-5" />
                  {t("formulario.titulo")}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {t("formulario.descricao")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <Label
                      htmlFor="telefone"
                      className="text-gray-900 dark:text-white"
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
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-500"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("formulario.instrucaoTelefone")}
                    </p>
                  </div>

                  {message && (
                    <div
                      className={`p-4 rounded-lg border ${
                        message === "success"
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300"
                          : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {message === "success" ? (
                          <>
                            <CheckCircle2 className="h-5 w-5" />
                            <span>{t("mensagens.sucesso")}</span>
                          </>
                        ) : (
                          <>
                            <span>❌ {message}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || telefone.length < 14}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t("botoes.vincularLoading")}
                      </div>
                    ) : (
                      t("botoes.vincular")
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Benefícios */}
          <div className="space-y-6">
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white text-lg">
                  {t("beneficios.titulo")}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {t("beneficios.descricao")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-gray-800/50">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mic className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white text-sm font-medium">
                      {t("beneficios.lancamentos.titulo")}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      {t("beneficios.lancamentos.descricao")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-gray-800/50">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white text-sm font-medium">
                      {t("beneficios.whatsapp.titulo")}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      {t("beneficios.whatsapp.descricao")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-gray-800/50">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white text-sm font-medium">
                      {t("beneficios.rapido.titulo")}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
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
