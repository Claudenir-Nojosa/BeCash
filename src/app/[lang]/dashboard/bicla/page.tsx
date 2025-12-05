// app/dashboard/bicla/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Brain, Sparkles, RotateCcw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bicla";
  timestamp: Date;
}

export default function BiclaPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Olá! Sou a Bicla, sua IA financeira. Posso analisar seus dados e responder perguntas sobre suas finanças. 💡",
      sender: "bicla",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatMessage = (content: string) => {
    return content.split("\n").map((line, index) => {
      if (line.startsWith("## ")) {
        return (
          <h3 key={index} className="font-bold text-lg mt-4 mb-2 text-white">
            {line.replace("## ", "")}
          </h3>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h4
            key={index}
            className="font-semibold text-base mt-3 mb-1 text-white"
          >
            {line.replace("### ", "")}
          </h4>
        );
      }

      if (line.startsWith("- ") || line.startsWith("• ")) {
        return (
          <div key={index} className="flex items-start gap-2 my-1">
            <span className="flex-shrink-0 text-gray-300">•</span>
            <span className="text-gray-300">{line.replace(/^[-•] /, "")}</span>
          </div>
        );
      }

      if (line.includes("**")) {
        const parts = line.split("**");
        return (
          <p key={index} className="my-2 text-gray-300">
            {parts.map((part, i) =>
              i % 2 === 1 ? (
                <strong key={i} className="font-semibold text-white">
                  {part}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        );
      }

      if (line.trim() === "") {
        return <br key={index} />;
      }

      return (
        <p key={index} className="my-2 text-gray-300">
          {line}
        </p>
      );
    });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

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

      if (!response.ok) throw new Error("Erro na resposta da Bicla");

      const data = await response.json();

      const biclaMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.resposta,
        sender: "bicla",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, biclaMessage]);
    } catch (error) {
      console.error("Erro:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "Desculpe, estou com problemas técnicos no momento. Tente novamente em alguns instantes.",
        sender: "bicla",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      toast.error("Erro ao conversar com a Bicla");
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
        content:
          "Olá! Sou a Bicla, sua IA financeira. Posso analisar seus dados e responder perguntas sobre suas finanças. 💡",
        sender: "bicla",
        timestamp: new Date(),
      },
    ]);
  };

  const quickPrompts = [
    "Analise minha saúde financeira",
    "Quais áreas posso economizar?",
    "Me dê dicas de investimento",
    "Como melhorar meus gastos?",
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Bicla</h1>
              <p className="text-gray-300">
                Sua assistente financeira inteligente
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={clearChat}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Limpar Chat
            </Button>
          </div>
        </div>

        {/* Área de Chat */}
        <Card className="bg-gray-900 border-gray-800 flex flex-col h-[calc(100vh-12rem)]">
          <CardContent className="p-0 flex flex-col h-full">
            {/* Mensagens com Scroll */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-6 space-y-6"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.sender === "user"
                        ? "bg-gray-600 text-white"
                        : "bg-gray-800 border border-gray-700 text-gray-300"
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {message.sender === "bicla"
                        ? formatMessage(message.content)
                        : message.content}
                    </div>
                    <div
                      className={`text-xs mt-2 ${
                        message.sender === "user"
                          ? "text-gray-200"
                          : "text-gray-500"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 max-w-[80%]">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      Bicla está pensando...
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            {messages.length <= 1 && (
              <div className="border-t border-gray-800 p-4 bg-gray-800/50">
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-xs"
                      onClick={() => {
                        setInputMessage(prompt);
                        setTimeout(handleSendMessage, 100);
                      }}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-gray-800 p-4 bg-gray-800/30">
              <div className="flex gap-3">
                <Input
                  placeholder="Pergunte sobre suas finanças..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  size="icon"
                  className="bg-white text-gray-900 hover:bg-gray-100 disabled:bg-gray-700 disabled:text-gray-500"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Footer */}
              <div className="text-center mt-3">
                <p className="text-xs text-gray-500">
                  💡 Dica: Pergunte sobre gastos, investimentos, economia ou
                  análise geral
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
