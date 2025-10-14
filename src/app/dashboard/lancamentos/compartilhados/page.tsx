// app/dashboard/lancamentos/compartilhados/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface LancamentoCompartilhado {
  id: string;
  lancamentoId: string;
  usuarioCriadorId: string;
  usuarioAlvoId: string;
  status: string;
  valorCompartilhado: number;
  createdAt: string;
  lancamento?: {
    id: string;
    descricao: string;
    valor: number;
    tipo: string;
    metodoPagamento: string;
    data: string;
    categoria?: {
      nome: string;
      cor: string;
    };
    user?: {
      // ← CORRIGIDO: era usuarioCriador, mas na API é user
      name: string;
      email: string;
      image?: string;
    };
  };
  usuarioCriador?: {
    // ← ADICIONADO: usuário que compartilhou
    name: string;
    email: string;
    image?: string;
  };
}

export default function LancamentosCompartilhadosPage() {
  const { data: session, status, update } = useSession();
  const [lancamentos, setLancamentos] = useState<LancamentoCompartilhado[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregarLancamentosCompartilhados = async () => {
    console.log(
      "🔐 Tentando carregar lançamentos - Session ID:",
      session?.user?.id
    );

    if (!session?.user?.id) {
      console.log("❌ Session ID não disponível ainda");
      return;
    }

    setCarregando(true);
    try {
      console.log("📡 Fazendo fetch para /api/lancamentos-compartilhados...");
      const response = await fetch("/api/lancamentos-compartilhados");

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Lançamentos compartilhados recebidos:", data);
        setLancamentos(data);
      } else {
        console.error("❌ Erro na resposta:", response.status);
        toast.error("Erro ao carregar lançamentos compartilhados");
      }
    } catch (error) {
      console.error("❌ Erro ao carregar lançamentos compartilhados:", error);
      toast.error("Erro ao carregar lançamentos compartilhados");
    } finally {
      setCarregando(false);
    }
  };

  const handleAcao = async (
    lancamentoId: string,
    action: "ACEITAR" | "RECUSAR"
  ) => {
    try {
      const response = await fetch("/api/lancamentos-compartilhados", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lancamentoCompartilhadoId: lancamentoId,
          action,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        carregarLancamentosCompartilhados();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao processar solicitação");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao processar solicitação");
    }
  };

  // SOLUÇÃO: Forçar atualização da session se não autenticado
  useEffect(() => {
    const forceSessionUpdate = async () => {
      if (status === "unauthenticated") {
        console.log("🔄 Forçando atualização da session...");
        try {
          await update();
        } catch (error) {
          console.error("Erro ao forçar update:", error);
        }
      }
    };

    forceSessionUpdate();
  }, [status, update]);

  // SOLUÇÃO: Verificar tanto status quanto session.user.id
  useEffect(() => {
    console.log(
      "🔐 useEffect - Status:",
      status,
      "Session ID:",
      session?.user?.id
    );

    if (status === "authenticated" && session?.user?.id) {
      console.log("✅ Session pronta, carregando lançamentos...");
      carregarLancamentosCompartilhados();
    }
  }, [status, session]);

  // Função para renderizar conteúdo seguro
  const renderConteudoSeguro = (lancamento: LancamentoCompartilhado) => {
    // Verificações em cascata para evitar erros
    const nomeCriador =
      lancamento.usuarioCriador?.name ||
      lancamento.lancamento?.user?.name ||
      "Usuário não encontrado";
    const descricao =
      lancamento.lancamento?.descricao || "Descrição não disponível";
    const valorTotal = lancamento.lancamento?.valor || 0;
    const categoriaNome =
      lancamento.lancamento?.categoria?.nome || "Sem categoria";
    const dataLancamento = lancamento.lancamento?.data
      ? new Date(lancamento.lancamento.data).toLocaleDateString()
      : "Data não disponível";
    const tipo = lancamento.lancamento?.tipo || "DESPESA";

    return {
      nomeCriador,
      descricao,
      valorTotal,
      categoriaNome,
      dataLancamento,
      tipo,
    };
  };

  if (status === "loading" || carregando) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center">
          <p>Carregando lançamentos compartilhados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Lançamentos Compartilhados</h1>
        <p className="text-muted-foreground">
          Gerencie os lançamentos que foram compartilhados com você
        </p>
      </div>

      {lancamentos.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Nenhum lançamento compartilhado encontrado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {lancamentos.map((lancamento) => {
            const {
              nomeCriador,
              descricao,
              valorTotal,
              categoriaNome,
              dataLancamento,
              tipo,
            } = renderConteudoSeguro(lancamento);

            return (
              <Card key={lancamento.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{descricao}</CardTitle>
                      <CardDescription>
                        Compartilhado por: {nomeCriador}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        lancamento.status === "PENDENTE"
                          ? "secondary"
                          : lancamento.status === "ACEITO"
                            ? "default"
                            : "destructive"
                      }
                    >
                      {lancamento.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Valor Total:</span>
                      <p
                        className={
                          tipo === "DESPESA" ? "text-red-600" : "text-green-600"
                        }
                      >
                        R$ {valorTotal.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Sua Parte:</span>
                      <p className="font-bold">
                        R$ {lancamento.valorCompartilhado.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Categoria:</span>
                      <p>{categoriaNome}</p>
                    </div>
                    <div>
                      <span className="font-medium">Data:</span>
                      <p>{dataLancamento}</p>
                    </div>
                  </div>

                  {lancamento.status === "PENDENTE" && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => handleAcao(lancamento.id, "ACEITAR")}
                        variant="default"
                        size="sm"
                      >
                        Aceitar
                      </Button>
                      <Button
                        onClick={() => handleAcao(lancamento.id, "RECUSAR")}
                        variant="outline"
                        size="sm"
                      >
                        Recusar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
