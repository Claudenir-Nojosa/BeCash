// app/dashboard/suporte/page.tsx
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
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
import { getFallback } from "@/lib/i18nFallback";

export default function SuportePage() {
  const params = useParams();
  const { t } = useTranslation("suporte");
  const { data: session, status } = useSession();
  const currentLang = (params?.lang as string) || "pt";
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    tipo: "",
    assunto: "",
    mensagem: "",
    email: session?.user?.email || "",
  });

  // Função auxiliar para obter tradução com fallback
  const getTranslation = (key: string) => {
    // Primeiro tenta usar o i18n
    const translation = t(key);
    if (translation && translation !== key) {
      return translation;
    }

    // Fallback manual baseado nas chaves que você tem nos arquivos JSON
    switch (key) {
      // Título e descrição
      case "titulo":
        return getFallback(
          currentLang,
          "Central de Suporte",
          "Support Center",
        );
      case "descricao":
        return getFallback(
          currentLang,
          "Relate bugs, sugira melhorias ou tire suas dúvidas. Estamos aqui para ajudar!",
          "Report bugs, suggest improvements or ask questions. We're here to help!",
        );

      // Tipos de ticket
      case "tipos.bug":
        return getFallback(currentLang, "Reportar Bug", "Report Bug");
      case "tipos.melhoria":
        return getFallback(currentLang, "Sugerir Melhoria", "Suggest Improvement");
      case "tipos.duvida":
        return getFallback(currentLang, "Tirar Dúvida", "Ask Question");

      // Formulário
      case "formulario.titulo":
        return getFallback(
          currentLang,
          "Descreva sua solicitação",
          "Describe your request",
        );
      case "formulario.descricao":
        return getFallback(
          currentLang,
          "Preencha os campos abaixo com o máximo de detalhes possível",
          "Fill in the fields below with as much detail as possible",
        );
      case "formulario.email":
        return getFallback(currentLang, "E-mail", "Email");
      case "formulario.emailPlaceholder":
        return getFallback(currentLang, "seu@email.com", "your@email.com");
      case "formulario.tipo":
        return getFallback(currentLang, "Tipo de Solicitação", "Request Type");
      case "formulario.tipoPlaceholder":
        return getFallback(currentLang, "Selecione o tipo", "Select type");
      case "formulario.assunto":
        return getFallback(currentLang, "Assunto", "Subject");
      case "formulario.assuntoPlaceholder":
        return getFallback(
          currentLang,
          "Descreva brevemente o problema ou sugestão",
          "Briefly describe the issue or suggestion",
        );
      case "formulario.mensagem":
        return getFallback(currentLang, "Mensagem", "Message");
      case "formulario.mensagemPlaceholder":
        return getFallback(
          currentLang,
          "Descreva detalhadamente sua solicitação. Quanto mais informações, melhor poderemos ajudar!",
          "Describe your request in detail. The more information, the better we can help!",
        );
      case "formulario.enviar":
        return getFallback(currentLang, "Enviar Solicitação", "Submit Request");
      case "formulario.enviando":
        return getFallback(currentLang, "Enviando", "Submitting");

      // Sucesso
      case "sucesso.titulo":
        return getFallback(currentLang, "Solicitação Enviada!", "Request Submitted!");
      case "sucesso.descricao":
        return getFallback(
          currentLang,
          "Recebemos sua mensagem e entraremos em contato em breve. Obrigado por nos ajudar a melhorar o BeCash!",
          "We've received your message and will get back to you soon. Thank you for helping us improve BeCash!",
        );

      // Informações
      case "info.titulo":
        return getFallback(
          currentLang,
          "Dicas para um atendimento mais rápido:",
          "Tips for faster support:",
        );
      case "info.item1":
        return getFallback(
          currentLang,
          "Seja específico ao descrever o problema ou sugestão",
          "Be specific when describing the problem or suggestion",
        );
      case "info.item2":
        return getFallback(
          currentLang,
          "Inclua prints ou exemplos quando possível",
          "Include screenshots or examples when possible",
        );
      case "info.item3":
        return getFallback(
          currentLang,
          "Informe em qual dispositivo/navegador ocorreu o problema",
          "Let us know which device/browser the issue occurred on",
        );

      // Erros
      case "erros.camposObrigatorios":
        return getFallback(
          currentLang,
          "Por favor, preencha todos os campos obrigatórios",
          "Please fill in all required fields",
        );
      case "erros.enviar":
        return getFallback(
          currentLang,
          "Erro ao enviar solicitação. Tente novamente.",
          "Error submitting request. Please try again.",
        );

      // Mensagens
      case "mensagens.sucesso":
        return getFallback(
          currentLang,
          "Solicitação enviada com sucesso! Entraremos em contato em breve.",
          "Request submitted successfully! We'll be in touch soon.",
        );

      default:
        return key;
    }
  };

  // Criar um objeto de traduções para fácil acesso
  const translations = {
    titulo: getTranslation("titulo"),
    descricao: getTranslation("descricao"),

    // Tipos
    tipos: {
      bug: getTranslation("tipos.bug"),
      melhoria: getTranslation("tipos.melhoria"),
      duvida: getTranslation("tipos.duvida"),
    },

    // Formulário
    formulario: {
      titulo: getTranslation("formulario.titulo"),
      descricao: getTranslation("formulario.descricao"),
      email: getTranslation("formulario.email"),
      emailPlaceholder: getTranslation("formulario.emailPlaceholder"),
      tipo: getTranslation("formulario.tipo"),
      tipoPlaceholder: getTranslation("formulario.tipoPlaceholder"),
      assunto: getTranslation("formulario.assunto"),
      assuntoPlaceholder: getTranslation("formulario.assuntoPlaceholder"),
      mensagem: getTranslation("formulario.mensagem"),
      mensagemPlaceholder: getTranslation("formulario.mensagemPlaceholder"),
      enviar: getTranslation("formulario.enviar"),
      enviando: getTranslation("formulario.enviando"),
    },

    // Sucesso
    sucesso: {
      titulo: getTranslation("sucesso.titulo"),
      descricao: getTranslation("sucesso.descricao"),
    },

    // Informações
    info: {
      titulo: getTranslation("info.titulo"),
      item1: getTranslation("info.item1"),
      item2: getTranslation("info.item2"),
      item3: getTranslation("info.item3"),
    },

    // Erros
    erros: {
      camposObrigatorios: getTranslation("erros.camposObrigatorios"),
      enviar: getTranslation("erros.enviar"),
    },

    // Mensagens
    mensagens: {
      sucesso: getTranslation("mensagens.sucesso"),
    },
  };

  const tiposDeTicket = [
    { value: "bug", label: translations.tipos.bug, icon: Bug, color: "text-red-500" },
    {
      value: "melhoria",
      label: translations.tipos.melhoria,
      icon: Lightbulb,
      color: "text-yellow-500",
    },
    {
      value: "duvida",
      label: translations.tipos.duvida,
      icon: MessageSquare,
      color: "text-blue-500",
    },
  ];

  // Adicionado: Verificar quando a sessão está carregada
  useState(() => {
    if (status !== "loading") {
      setLoading(false);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tipo || !formData.assunto || !formData.mensagem) {
      toast.error(translations.erros.camposObrigatorios);
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
        throw new Error(translations.erros.enviar);
      }

      setEnviado(true);
      toast.success(translations.mensagens.sucesso);

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
      toast.error(translations.erros.enviar);
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
            {translations.titulo}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {translations.descricao}
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
                    {translations.formulario.titulo}
                  </CardTitle>
                  <CardDescription>{translations.formulario.descricao}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm sm:text-base">
                        {translations.formulario.email}
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          className="pl-9 sm:pl-10 text-sm sm:text-base"
                          placeholder={translations.formulario.emailPlaceholder}
                          required
                        />
                      </div>
                    </div>

                    {/* Tipo de ticket */}
                    <div className="space-y-2">
                      <Label htmlFor="tipo" className="text-sm sm:text-base">
                        {translations.formulario.tipo}
                      </Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value) => handleChange("tipo", value)}
                      >
                        <SelectTrigger className="text-sm sm:text-base">
                          <SelectValue
                            placeholder={translations.formulario.tipoPlaceholder}
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
                        {translations.formulario.assunto}
                      </Label>
                      <Input
                        id="assunto"
                        value={formData.assunto}
                        onChange={(e) => handleChange("assunto", e.target.value)}
                        className="text-sm sm:text-base"
                        placeholder={translations.formulario.assuntoPlaceholder}
                        required
                      />
                    </div>

                    {/* Mensagem */}
                    <div className="space-y-2">
                      <Label htmlFor="mensagem" className="text-sm sm:text-base">
                        {translations.formulario.mensagem}
                      </Label>
                      <Textarea
                        id="mensagem"
                        value={formData.mensagem}
                        onChange={(e) => handleChange("mensagem", e.target.value)}
                        className="min-h-[150px] sm:min-h-[200px] resize-none text-sm sm:text-base"
                        placeholder={translations.formulario.mensagemPlaceholder}
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
                          <Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          {translations.formulario.enviando}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          {translations.formulario.enviar}
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
                    {translations.sucesso.titulo}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-md">
                    {translations.sucesso.descricao}
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
                {translations.info.titulo}
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                <li>• {translations.info.item1}</li>
                <li>• {translations.info.item2}</li>
                <li>• {translations.info.item3}</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}