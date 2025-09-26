// app/dashboard/bicla/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Brain, Sparkles, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bicla";
  timestamp: Date;
}

export default function BiclaPage() {
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
          <h3
            key={index}
            className="font-bold text-lg mt-4 mb-2 text-foreground"
          >
            {line.replace("## ", "")}
          </h3>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h4
            key={index}
            className="font-semibold text-base mt-3 mb-1 text-foreground"
          >
            {line.replace("### ", "")}
          </h4>
        );
      }

      if (line.startsWith("- ") || line.startsWith("• ")) {
        return (
          <div key={index} className="flex items-start gap-2 my-1">
            <span className="flex-shrink-0">•</span>
            <span className="text-foreground">
              {line.replace(/^[-•] /, "")}
            </span>
          </div>
        );
      }

      if (line.includes("**")) {
        const parts = line.split("**");
        return (
          <p key={index} className="my-2 text-foreground">
            {parts.map((part, i) =>
              i % 2 === 1 ? (
                <strong key={i} className="font-semibold">
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
        <p key={index} className="my-2 text-foreground">
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
      toast.error("Erro ao conversar com a Bicla");

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "Desculpe, tive um problema. Tente novamente em alguns instantes.",
        sender: "bicla",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
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
    <div className="min-h-screen bg-background p-4 mt-16">
      <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
        {/* Header Fixo */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Bicla
              </h1>
              <p className="text-sm text-muted-foreground">
                Assistente Financeira IA
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Limpar
          </Button>
        </div>

        {/* Área de Chat com Scroll Interno */}
        <Card className="border shadow-sm flex flex-col flex-1 min-h-0">
          <CardContent className="p-0 flex flex-col h-full">
            {/* Mensagens com Scroll */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 bg-background"
              style={{ maxHeight: "calc(100vh - 20rem)" }}
            >
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 ${
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 border"
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
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
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
                    <div className="bg-muted/50 border rounded-2xl p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
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
            </div>

            {/* Área de Input Fixa */}
            <div className="border-t p-4 bg-muted/20 flex-shrink-0">
              {/* Quick Prompts */}
              <div className="flex flex-wrap gap-2 mb-4">
                {quickPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 border-muted-foreground/20 hover:border-muted-foreground/40"
                    onClick={() => {
                      setInputMessage(prompt);
                      setTimeout(handleSendMessage, 100);
                    }}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Pergunte sobre suas finanças..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 bg-background border-muted-foreground/20 focus:border-primary"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  size="icon"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Fixo */}
        <div className="text-center mt-4 flex-shrink-0">
          <p className="text-xs text-muted-foreground">
            💡 Dica: Pergunte sobre gastos, investimentos, economia ou análise
            geral
          </p>
        </div>
      </div>
    </div>
  );
}
