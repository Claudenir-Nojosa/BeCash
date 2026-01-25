// app/dashboard/bicla/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Brain,
  Sparkles,
  RotateCcw,
  ArrowLeft,
  Crown,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading-barrinhas";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bicla";
  timestamp: Date;
}

type PlanoUsuario = "free" | "pro" | "family";

export default function BiclaPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation("bicla");
  const currentLang = (params?.lang as string) || "pt";

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: t("mensagens.saudacao"),
      sender: "bicla",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [planoUsuario, setPlanoUsuario] = useState<PlanoUsuario>("free");
  const [carregandoPlano, setCarregandoPlano] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carregar o plano do usuário
  useEffect(() => {
    const carregarPlanoUsuario = async () => {
      try {
        setCarregandoPlano(true);
        const response = await fetch(
          "/api/usuarios/subscription/limite-combinado",
        );

        if (response.ok) {
          const data = await response.json();
          setPlanoUsuario(data.plano); // ← Isso já vem da sua rota existente
        } else {
          console.error("Erro ao carregar plano do usuário");
          setPlanoUsuario("free");
        }
      } catch (error) {
        console.error("Erro na requisição do plano:", error);
        setPlanoUsuario("free");
      } finally {
        setCarregandoPlano(false);
      }
    };

    carregarPlanoUsuario();
  }, []);

  const formatMessage = (content: string) => {
    return content.split("\n").map((line, index) => {
      if (line.startsWith("## ")) {
        return (
          <h3
            key={index}
            className="font-bold text-lg mt-4 mb-2 text-gray-900 dark:text-white"
          >
            {line.replace("## ", "")}
          </h3>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h4
            key={index}
            className="font-semibold text-base mt-3 mb-1 text-gray-900 dark:text-white"
          >
            {line.replace("### ", "")}
          </h4>
        );
      }

      if (line.startsWith("- ") || line.startsWith("• ")) {
        return (
          <div key={index} className="flex items-start gap-2 my-1">
            <span className="flex-shrink-0 text-gray-600 dark:text-gray-300">
              •
            </span>
            <span className="text-gray-600 dark:text-gray-300">
              {line.replace(/^[-•] /, "")}
            </span>
          </div>
        );
      }

      if (line.includes("**")) {
        const parts = line.split("**");
        return (
          <p key={index} className="my-2 text-gray-600 dark:text-gray-300">
            {parts.map((part, i) =>
              i % 2 === 1 ? (
                <strong
                  key={i}
                  className="font-semibold text-gray-900 dark:text-white"
                >
                  {part}
                </strong>
              ) : (
                part
              ),
            )}
          </p>
        );
      }

      if (line.trim() === "") {
        return <br key={index} />;
      }

      return (
        <p key={index} className="my-2 text-gray-600 dark:text-gray-300">
          {line}
        </p>
      );
    });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Verificar se o usuário tem plano family
    if (planoUsuario && planoUsuario !== "family") {
      toast.error(t("erros.planoNecessario"), {
        action: {
          label: t("botoes.upgrade"),
          onClick: () => router.push(`/${currentLang}/dashboard/perfil`),
        },
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/bicla/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputMessage }),
      });

      if (!response.ok) throw new Error(t("erros.resposta"));

      const data = await response.json();

      const biclaMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.resposta,
        sender: "bicla",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, biclaMessage]);
    } catch (error) {
      console.error(t("erros.conexao"), error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: t("mensagens.erroTecnico"),
        sender: "bicla",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      toast.error(t("toasts.erroConversa"));
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "1",
        content: t("mensagens.saudacao"),
        sender: "bicla",
        timestamp: new Date(),
      },
    ]);
  };

  const quickPrompts = [
    t("prompts.rapidos.analise"),
    t("prompts.rapidos.economia"),
    t("prompts.rapidos.investimento"),
    t("prompts.rapidos.gastos"),
  ];

  // Loading em tela cheia para carregamento dos dados
  if (carregandoPlano) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Se não é plano family, mostrar mensagem educativa
  if (planoUsuario !== "family") {
    return (
      <div className="h-full flex flex-col overflow-hidden p-4 sm:p-6">
        <div className="max-w-4xl mx-auto w-full h-full flex flex-col gap-4 sm:gap-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 flex-shrink-0"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-gray-500 dark:to-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">
                  {t("titulo")}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 truncate">
                  {t("subtitulo")}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Mensagem de plano necessário */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex-1 min-h-0"
          >
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm flex flex-col h-full">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 md:p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center mb-4 sm:mb-6">
                    <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                    Recursos Exclusivos do Plano Família
                  </h2>

                  <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 max-w-md">
                    O Bicla, seu assistente de IA financeira, está disponível
                    apenas para assinantes do plano Família. Desbloqueie
                    recursos avançados de análise financeira com inteligência
                    artificial.
                  </p>

                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 max-w-lg w-full">
                    <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
                      <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-blue-800 dark:text-blue-300">
                        Seu plano atual:{" "}
                        {(planoUsuario as string) === "family"
                          ? "Família"
                          : (planoUsuario as string) === "free"
                            ? "Grátis"
                            : "Pro"}
                      </span>
                    </div>

                    <ul className="space-y-2 text-left text-sm sm:text-base">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          Análise financeira personalizada com IA
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          Recomendações de investimentos inteligentes
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          Planejamento financeiro avançado
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          Suporte a metas compartilhadas em família
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button
                      onClick={() =>
                        router.push(`/${currentLang}/dashboard/perfil`)
                      }
                      className="bg-gradient-to-r from-[#00cfec] to-[#007cca] text-white hover:opacity-90"
                    >
                      <Crown className="mr-2 h-4 w-4" />
                      Fazer Upgrade para Família
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Se é plano family, mostrar o chat normal
  return (
    <div className="h-full flex flex-col overflow-hidden p-4 sm:p-6">
      <div className="max-w-4xl mx-auto w-full h-full flex flex-col gap-4 sm:gap-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 flex-shrink-0"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-gray-500 dark:to-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Brain className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">
                {t("titulo")}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 truncate">
                {t("subtitulo")}
              </p>
            </div>
          </div>

          <div className="flex gap-2 self-stretch sm:self-auto">
            <Button
              variant="outline"
              onClick={clearChat}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white text-xs sm:text-sm flex-1 sm:flex-none"
            >
              <RotateCcw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate">{t("botoes.limparChat")}</span>
            </Button>
          </div>
        </motion.div>

        {/* Área de Chat */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex-1 min-h-0"
        >
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm flex flex-col h-full">
            <CardContent className="p-0 flex flex-col h-full">
              {/* Mensagens com Scroll */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6"
              >
                <AnimatePresence mode="popLayout">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] rounded-xl sm:rounded-2xl p-3 sm:p-4 ${
                          message.sender === "user"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-300"
                        }`}
                      >
                        <div className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                          {message.sender === "bicla"
                            ? formatMessage(message.content)
                            : message.content}
                        </div>
                        <div
                          className={`text-xs mt-1 sm:mt-2 ${
                            message.sender === "user"
                              ? "text-blue-100"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                      className="flex justify-start"
                    >
                      <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 max-w-[85%] sm:max-w-[80%]">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span className="truncate">
                            {t("estados.pensando")}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts */}
              <AnimatePresence>
                {messages.length <= 1 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-200 dark:border-gray-800 p-2 sm:p-4 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0"
                  >
                    <div className="flex flex-wrap gap-1 sm:gap-2 justify-center">
                      {quickPrompts.map((prompt, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1, duration: 0.2 }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white text-xs px-2 py-1 h-auto"
                            onClick={() => {
                              setInputMessage(prompt);
                              setTimeout(handleSendMessage, 100);
                            }}
                          >
                            <span className="truncate max-w-[120px] sm:max-w-none">
                              {prompt}
                            </span>
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Area */}
              <div className="border-t border-gray-200 dark:border-gray-800 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/30 flex-shrink-0">
                <div className="flex gap-2 sm:gap-3">
                  <Input
                    placeholder={t("input.placeholder")}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-500 text-sm sm:text-base"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                    size="icon"
                    className="bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300 disabled:text-gray-500 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 dark:disabled:bg-gray-700 dark:disabled:text-gray-500 flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* Footer */}
                <div className="text-center mt-2 sm:mt-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 px-2">
                    {t("dicas.recomendacao")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
