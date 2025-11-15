// app/vincular-telefone/page.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (status === "loading") {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-lg animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded w-96 animate-pulse"></div>
            </div>
          </div>

          {/* Card Skeleton */}
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-700/50 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-700/50 rounded w-1/2 mb-2"></div>
              <div className="h-10 bg-gray-700/50 rounded"></div>
              <div className="h-10 bg-gray-700/50 rounded w-32"></div>
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
      setMessage("Erro ao vincular telefone");
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
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/dashboard")}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Vincular WhatsApp
              </h1>
              <p className="text-gray-400">
                Conecte seu número para criar lançamentos por voz
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário de Vinculação */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Smartphone className="h-5 w-5" />
                  Seu Número do WhatsApp
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Digite seu número com DDD para vincular ao BeCash
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <Label htmlFor="telefone" className="text-white">
                      Número do WhatsApp
                    </Label>
                    <Input
                      id="telefone"
                      name="telefone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      required
                      value={telefone}
                      onChange={handleTelefoneChange}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                    />
                    <p className="text-sm text-gray-400">
                      Digite seu número com DDD. Exemplo: (11) 99999-9999
                    </p>
                  </div>

                  {message && (
                    <div
                      className={`p-4 rounded-lg border ${
                        message === "success"
                          ? "bg-green-900/20 border-green-700 text-green-300"
                          : "bg-red-900/20 border-red-700 text-red-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {message === "success" ? (
                          <>
                            <CheckCircle2 className="h-5 w-5" />
                            <span>
                              Telefone vinculado com sucesso! Redirecionando...
                            </span>
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
                        Vinculando...
                      </div>
                    ) : (
                      "Vincular Telefone"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Benefícios */}
          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-lg">Benefícios</CardTitle>
                <CardDescription className="text-gray-400">
                  O que você ganha ao vincular
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mic className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      Lançamentos por Áudio
                    </p>
                    <p className="text-gray-400 text-xs">
                      Crie gastos e receitas por voz
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      WhatsApp Direto
                    </p>
                    <p className="text-gray-400 text-xs">
                      Registre gastos sem abrir o app
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      Rápido e Prático
                    </p>
                    <p className="text-gray-400 text-xs">
                      Registre em segundos
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
