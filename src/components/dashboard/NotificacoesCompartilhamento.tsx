// components/dashboard/NotificacoesSino.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Bell, Check, X, Clock, User, Calendar, Tag } from "lucide-react";

interface LancamentoCompartilhado {
  id: string;
  valorCompartilhado: number;
  status: string;
  createdAt: string;
  lancamento: {
    id: string;
    descricao: string;
    data: string;
    tipo: string;
    categoria: {
      nome: string;
      cor: string;
    };
  };
  usuarioCriador: {
    name: string;
    email: string;
    image?: string;
  };
}

export default function NotificacoesSino() {
  const [compartilhamentosPendentes, setCompartilhamentosPendentes] = useState<
    LancamentoCompartilhado[]
  >([]);
  const [carregando, setCarregando] = useState(true);
  const [sheetAberto, setSheetAberto] = useState(false);

  const carregarCompartilhamentosPendentes = async () => {
    try {
      setCarregando(true);
      const response = await fetch(
        "/api/lancamentos/compartilhados?status=PENDENTE"
      );

      if (response.ok) {
        const data = await response.json();
        setCompartilhamentosPendentes(data);
      }
    } catch (error) {
      console.error("Erro ao carregar compartilhamentos:", error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarCompartilhamentosPendentes();

    // Atualizar a cada 30 segundos quando o sheet estiver fechado
    const interval = setInterval(() => {
      if (!sheetAberto) {
        carregarCompartilhamentosPendentes();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [sheetAberto]);

  const handleAceitar = async (compartilhamentoId: string) => {
    try {
      const response = await fetch("/api/lancamentos/compartilhados", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lancamentoCompartilhadoId: compartilhamentoId,
          status: "ACEITO",
        }),
      });

      if (response.ok) {
        toast.success("Lançamento aceito com sucesso!");
        setCompartilhamentosPendentes((prev) =>
          prev.filter((item) => item.id !== compartilhamentoId)
        );
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao aceitar lançamento");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao processar solicitação");
    }
  };

  const handleRecusar = async (compartilhamentoId: string) => {
    try {
      const response = await fetch("/api/lancamentos/compartilhados", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lancamentoCompartilhadoId: compartilhamentoId,
          status: "RECUSADO",
        }),
      });

      if (response.ok) {
        toast.success("Lançamento recusado!");
        setCompartilhamentosPendentes((prev) =>
          prev.filter((item) => item.id !== compartilhamentoId)
        );
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao recusar lançamento");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao processar solicitação");
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleDateString("pt-BR");
  };

  const formatarTempo = (dataString: string) => {
    const data = new Date(dataString);
    const agora = new Date();
    const diffMs = agora.getTime() - data.getTime();
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutos < 60) {
      return `há ${diffMinutos} min`;
    } else if (diffHoras < 24) {
      return `há ${diffHoras} h`;
    } else {
      return `há ${diffDias} dia${diffDias > 1 ? "s" : ""}`;
    }
  };

  return (
    <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <Bell className="h-5 w-5" />
          {compartilhamentosPendentes.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 border-0">
              {compartilhamentosPendentes.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md bg-gray-900 border-gray-800">
        <SheetHeader className="border-b border-gray-800 pb-4">
          <SheetTitle className="text-white flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
            {compartilhamentosPendentes.length > 0 && (
              <Badge
                variant="secondary"
                className="bg-red-900/50 text-red-300 border-red-700"
              >
                {compartilhamentosPendentes.length}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="py-4">
          {carregando ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Clock className="h-8 w-8 mb-2 animate-spin" />
              <p className="text-sm">Carregando notificações...</p>
            </div>
          ) : compartilhamentosPendentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Bell className="h-12 w-12 mb-3 text-gray-600" />
              <p className="text-sm">Nenhuma notificação</p>
              <p className="text-xs text-gray-500 mt-1">
                Você não tem solicitações pendentes
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
              {compartilhamentosPendentes.map((compartilhamento) => (
                <div
                  key={compartilhamento.id}
                  className="p-4 border border-gray-800 rounded-lg bg-gray-800/50 hover:border-gray-700 transition-colors"
                >
                  {/* Header - Usuário e Tempo */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {compartilhamento.usuarioCriador.image ? (
                        <img
                          src={compartilhamento.usuarioCriador.image}
                          alt={compartilhamento.usuarioCriador.name}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <User className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="text-sm font-medium text-white">
                        {compartilhamento.usuarioCriador.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatarTempo(compartilhamento.createdAt)}
                    </span>
                  </div>

                  {/* Detalhes do Lançamento */}
                  <div className="space-y-2 mb-3">
                    <p className="text-sm text-gray-300 font-medium">
                      {compartilhamento.lancamento.descricao}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        <span>
                          {compartilhamento.lancamento.categoria.nome}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatarData(compartilhamento.lancamento.data)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Valor e Ações */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-yellow-400">
                        {formatarMoeda(compartilhamento.valorCompartilhado)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {compartilhamento.lancamento.tipo === "DESPESA"
                          ? "Despesa"
                          : "Receita"}{" "}
                        compartilhada
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAceitar(compartilhamento.id)}
                        className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRecusar(compartilhamento.id)}
                        className="h-8 px-3 border-red-600 text-red-400 hover:bg-red-900/50"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
