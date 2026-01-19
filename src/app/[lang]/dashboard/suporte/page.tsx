// app/dashboard/suporte/page.tsx
"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Bug,
  Lightbulb,
  MessageSquare,
  Send,
  CheckCircle2,
  Mail,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { Loading } from "@/components/ui/loading-barrinhas";

export default function SuportePage() {
  const { t } = useTranslation("suporte");
  const { data: session, status } = useSession();
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(true); // Adicionado state loading
  const [formData, setFormData] = useState({
    tipo: "",
    assunto: "",
    mensagem: "",
    email: session?.user?.email || "",
  });

  // Adicionado: Verificar quando a sessão está carregada
  useState(() => {
    if (status !== "loading") {
      setLoading(false);
    }
  });

  const tiposDeTicket = [
    { value: "bug", label: t("tipos.bug"), icon: Bug, color: "text-red-500" },
    {
      value: "melhoria",
      label: t("tipos.melhoria"),
      icon: Lightbulb,
      color: "text-yellow-500",
    },
    {
      value: "duvida",
      label: t("tipos.duvida"),
      icon: MessageSquare,
      color: "text-blue-500",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tipo || !formData.assunto || !formData.mensagem) {
      toast.error(t("erros.camposObrigatorios"));
      return;
    }

    setEnviando(true);

    try {
      const response = await fetch("/api/suporte", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          usuarioNome: session?.user?.name,
          usuarioId: session?.user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error(t("erros.enviar"));
      }

      setEnviado(true);
      toast.success(t("mensagens.sucesso"));

      // Resetar formulário após 3 segundos
      setTimeout(() => {
        setFormData({
          tipo: "",
          assunto: "",
          mensagem: "",
          email: session?.user?.email || "",
        });
        setEnviado(false);
      }, 3000);
    } catch (error) {
      console.error("Erro ao enviar ticket:", error);
      toast.error(t("erros.enviar"));
    } finally {
      setEnviando(false);
    }
  };

  const handleChange = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Mostrar loading enquanto carrega
  if (loading) {
    return <Loading />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen p-3 sm:p-4 md:p-6"
    >
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Cabeçalho */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-2"
        >
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {t("titulo")}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {t("descricao")}
          </p>
        </motion.div>

        {/* Cards de tipos de suporte */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
        >
          {tiposDeTicket.map((tipo, index) => {
            const Icon = tipo.icon;
            return (
              <motion.div
                key={tipo.value}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              >
                <Card
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    formData.tipo === tipo.value
                      ? "ring-2 ring-blue-500 dark:ring-blue-400"
                      : "hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                  onClick={() => handleChange("tipo", tipo.value)}
                >
                  <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center space-y-2">
                    <Icon className={`w-8 h-8 sm:w-10 sm:h-10 ${tipo.color}`} />
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                      {tipo.label}
                    </h3>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Formulário */}
        <AnimatePresence mode="wait">
          {!enviado ? (
            <motion.div
              key="formulario"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">
                    {t("formulario.titulo")}
                  </CardTitle>
                  <CardDescription>{t("formulario.descricao")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm sm:text-base">
                        {t("formulario.email")}
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          className="pl-9 sm:pl-10 text-sm sm:text-base"
                          placeholder={t("formulario.emailPlaceholder")}
                          required
                        />
                      </div>
                    </div>

                    {/* Tipo de ticket */}
                    <div className="space-y-2">
                      <Label htmlFor="tipo" className="text-sm sm:text-base">
                        {t("formulario.tipo")}
                      </Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value) => handleChange("tipo", value)}
                      >
                        <SelectTrigger className="text-sm sm:text-base">
                          <SelectValue
                            placeholder={t("formulario.tipoPlaceholder")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposDeTicket.map((tipo) => (
                            <SelectItem
                              key={tipo.value}
                              value={tipo.value}
                              className="text-sm sm:text-base"
                            >
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Assunto */}
                    <div className="space-y-2">
                      <Label htmlFor="assunto" className="text-sm sm:text-base">
                        {t("formulario.assunto")}
                      </Label>
                      <Input
                        id="assunto"
                        value={formData.assunto}
                        onChange={(e) => handleChange("assunto", e.target.value)}
                        className="text-sm sm:text-base"
                        placeholder={t("formulario.assuntoPlaceholder")}
                        required
                      />
                    </div>

                    {/* Mensagem */}
                    <div className="space-y-2">
                      <Label htmlFor="mensagem" className="text-sm sm:text-base">
                        {t("formulario.mensagem")}
                      </Label>
                      <Textarea
                        id="mensagem"
                        value={formData.mensagem}
                        onChange={(e) => handleChange("mensagem", e.target.value)}
                        className="min-h-[150px] sm:min-h-[200px] resize-none text-sm sm:text-base"
                        placeholder={t("formulario.mensagemPlaceholder")}
                        required
                      />
                    </div>

                    {/* Botão de envio */}
                    <Button
                      type="submit"
                      disabled={enviando}
                      className="w-full text-sm sm:text-base h-10 sm:h-11"
                    >
                      {enviando ? (
                        <>
                          {/* Removida a animação de rotação */}
                          <Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          {t("formulario.enviando") || "Enviando..."}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          {t("formulario.enviar")}
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="sucesso"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-green-200 dark:border-green-800">
                <CardContent className="p-8 sm:p-12 flex flex-col items-center text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.1,
                    }}
                  >
                    <CheckCircle2 className="w-16 h-16 sm:w-20 sm:h-20 text-green-500" />
                  </motion.div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {t("sucesso.titulo")}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-md">
                    {t("sucesso.descricao")}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Informações adicionais */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 sm:p-6">
              <h3 className="font-semibold text-sm sm:text-base text-blue-900 dark:text-blue-100 mb-2">
                {t("info.titulo")}
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                <li>• {t("info.item1")}</li>
                <li>• {t("info.item2")}</li>
                <li>• {t("info.item3")}</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}