// app/dashboard/bicla/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Brain,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Target,
  Sparkles,
  Calendar,
  Wallet,
  PiggyBank,
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bicla";
  timestamp: Date;
  type?: "analysis" | "tip" | "warning" | "suggestion";
}

interface FinancialHealth {
  score: number;
  status: "excelente" | "bom" | "regular" | "ruim";
  recommendations: string[];
}

export default function BiclaPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Olá! Sou a Bicla, sua assistente financeira inteligente. Como posso ajudar você hoje?",
      sender: "bicla",
      timestamp: new Date(),
      type: "tip",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [financialHealth, setFinancialHealth] = useState<FinancialHealth>({
    score: 72,
    status: "bom",
    recommendations: [
      "Reduzir gastos com alimentação fora de casa",
      "Aumentar aporte na reserva de emergência",
      "Diversificar investimentos",
    ],
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Adiciona mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simula resposta da Bicla após um delay
    setTimeout(() => {
      generateBiclaResponse(inputMessage);
      setIsTyping(false);
    }, 1500);
  };

  const generateBiclaResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    let response: Message;

    if (lowerMessage.includes("saldo") || lowerMessage.includes("como estou")) {
      response = {
        id: Date.now().toString(),
        content: `Baseado na sua análise financeira, seu saldo está ${financialHealth.status}. Pontuação: ${financialHealth.score}/100. Vejo que você está no caminho certo, mas podemos melhorar!`,
        sender: "bicla",
        timestamp: new Date(),
        type: "analysis",
      };
    } else if (
      lowerMessage.includes("dica") ||
      lowerMessage.includes("sugestão")
    ) {
      response = {
        id: Date.now().toString(),
        content:
          "💡 Aqui vai uma dica: Tente automatizar seus investimentos. Configure transferências automáticas para sua reserva assim que receber seu salário. Isso ajuda a manter a disciplina!",
        sender: "bicla",
        timestamp: new Date(),
        type: "tip",
      };
    } else if (
      lowerMessage.includes("gasto") ||
      lowerMessage.includes("economizar")
    ) {
      response = {
        id: Date.now().toString(),
        content:
          "⚠️ Notei que seus gastos com alimentação estão 15% acima da média. Que tal planejar suas refeições semanais? Isso pode economizar até R$ 300 por mês!",
        sender: "bicla",
        timestamp: new Date(),
        type: "warning",
      };
    } else if (
      lowerMessage.includes("investimento") ||
      lowerMessage.includes("aplicação")
    ) {
      response = {
        id: Date.now().toString(),
        content:
          "📈 Analisando seus investimentos: Sua carteira está 80% em renda fixa e 20% em variável. Para seu perfil, sugiro diversificar mais para potencializar ganhos a longo prazo.",
        sender: "bicla",
        timestamp: new Date(),
        type: "suggestion",
      };
    } else {
      response = {
        id: Date.now().toString(),
        content:
          "Entendi sua dúvida! Posso ajudar com análises financeiras, dicas de economia, sugestões de investimento ou revisão do seu orçamento. O que gostaria de explorar?",
        sender: "bicla",
        timestamp: new Date(),
        type: "tip",
      };
    }

    setMessages((prev) => [...prev, response]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excelente":
        return "text-green-600 bg-green-100";
      case "bom":
        return "text-blue-600 bg-blue-100";
      case "regular":
        return "text-yellow-600 bg-yellow-100";
      case "ruim":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case "analysis":
        return <TrendingUp className="h-4 w-4" />;
      case "tip":
        return <Lightbulb className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "suggestion":
        return <Target className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const quickActions = [
    {
      title: "Análise do Mês",
      icon: <Calendar className="h-5 w-5" />,
      prompt: "Como está minha saúde financeira este mês?",
    },
    {
      title: "Dicas de Economia",
      icon: <PiggyBank className="h-5 w-5" />,
      prompt: "Me dê dicas para economizar mais",
    },
    {
      title: "Revisão de Gastos",
      icon: <Wallet className="h-5 w-5" />,
      prompt: "Analise meus gastos e sugira melhorias",
    },
  ];

  const handleQuickAction = (prompt: string) => {
    setInputMessage(prompt);
  };

  return (
    <div className="container mx-auto p-6 mt-20 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-2 rounded-full">
          <Brain className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Bicla</h1>
          <p className="text-muted-foreground">
            Assistente Financeira Inteligente
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Saúde Financeira */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Saúde Financeira
            </CardTitle>
            <CardDescription>Sua pontuação atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-blue-600">
                {financialHealth.score}
              </div>
              <Badge
                className={`mt-2 capitalize ${getStatusColor(financialHealth.status)}`}
              >
                {financialHealth.status}
              </Badge>
            </div>
            <Progress value={financialHealth.score} className="h-2" />
          </CardContent>
        </Card>

        {/* Recomendações */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recomendações</CardTitle>
            <CardDescription>Para melhorar suas finanças</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {financialHealth.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Chat Container */}
      <Card>
        <CardHeader>
          <CardTitle>Conversa com a Bicla</CardTitle>
          <CardDescription>
            Faça perguntas e receba insights inteligentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Ações Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-2"
                onClick={() => handleQuickAction(action.prompt)}
              >
                {action.icon}
                <span className="text-xs">{action.title}</span>
              </Button>
            ))}
          </div>

          {/* Área de Mensagens */}
          <div className="border rounded-lg p-4 h-96 overflow-y-auto mb-4 bg-muted/50">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md rounded-lg p-3 ${
                      message.sender === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white border"
                    }`}
                  >
                    {message.sender === "bicla" && (
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            BI
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">Bicla</span>
                        {message.type && (
                          <span className="text-muted-foreground">
                            {getMessageIcon(message.type)}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {message.timestamp.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                          BI
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">
                        BICA está digitando...
                      </span>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input de Mensagem */}
          <div className="flex gap-2">
            <Input
              placeholder="Digite sua pergunta..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
