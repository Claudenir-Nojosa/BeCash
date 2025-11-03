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
import {
  Bell,
  Check,
  X,
  Clock,
  User,
  Calendar,
  Tag,
  CreditCard,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Target, // 👈 NOVO ÍCONE DE LOADING
} from "lucide-react";

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

interface ConviteCartao {
  id: string;
  emailConvidado: string;
  status: string;
  expiraEm: string;
  criadoEm: string;
  cartao: {
    id: string;
    nome: string;
    bandeira: string;
    cor: string;
  };
  usuarioCriador: {
    name: string;
    email: string;
    image?: string;
  };
}

interface ConviteMeta {
  id: string;
  emailConvidado: string;
  status: string;
  expiraEm: string;
  criadoEm: string;
  meta: {
    id: string;
    titulo: string;
    categoria: string;
    cor: string;
    icone: string;
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
  const [convitesPendentes, setConvitesPendentes] = useState<ConviteCartao[]>(
    []
  );
  const [convitesMetasPendentes, setConvitesMetasPendentes] = useState<
    ConviteMeta[]
  >([]);
  const [carregando, setCarregando] = useState(true);
  const [sheetAberto, setSheetAberto] = useState(false);
  const [processandoTodos, setProcessandoTodos] = useState(false);

  // Estados separados para cada ação
  const [aceitandoConvites, setAceitandoConvites] = useState<Set<string>>(
    new Set()
  );
  const [recusandoConvites, setRecusandoConvites] = useState<Set<string>>(
    new Set()
  );
  const [aceitandoCompartilhamentos, setAceitandoCompartilhamentos] = useState<
    Set<string>
  >(new Set());
  const [recusandoCompartilhamentos, setRecusandoCompartilhamentos] = useState<
    Set<string>
  >(new Set());
  // 👇 NOVOS ESTADOS PARA CONVITES DE METAS
  const [aceitandoConvitesMetas, setAceitandoConvitesMetas] = useState<
    Set<string>
  >(new Set());
  const [recusandoConvitesMetas, setRecusandoConvitesMetas] = useState<
    Set<string>
  >(new Set());

  const carregarNotificacoes = async () => {
    try {
      setCarregando(true);

      // Carregar todos os tipos de notificações
      const [
        compartilhamentosResponse,
        convitesResponse,
        convitesMetasResponse,
      ] = await Promise.all([
        fetch("/api/lancamentos/compartilhados?status=PENDENTE"),
        fetch("/api/convites/pendentes"),
        fetch("/api/convites-metas/pendentes"),
      ]);

      if (compartilhamentosResponse.ok) {
        const compartilhamentosData = await compartilhamentosResponse.json();
        setCompartilhamentosPendentes(compartilhamentosData);
      }

      if (convitesResponse.ok) {
        const convitesData = await convitesResponse.json();
        setConvitesPendentes(convitesData);
      }

      if (convitesMetasResponse.ok) {
        const convitesMetasData = await convitesMetasResponse.json();
        setConvitesMetasPendentes(convitesMetasData);
      }
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarNotificacoes();

    // Atualizar a cada 30 segundos quando o sheet estiver fechado
    const interval = setInterval(() => {
      if (!sheetAberto) {
        carregarNotificacoes();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [sheetAberto]);

  const handleAceitarCompartilhamento = async (
    compartilhamentoId: string,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();

    // 👇 CORREÇÃO: Usar estado específico para aceitar
    setAceitandoCompartilhamentos((prev) =>
      new Set(prev).add(compartilhamentoId)
    );

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
    } finally {
      // 👇 CORREÇÃO: Remover apenas do estado específico
      setAceitandoCompartilhamentos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(compartilhamentoId);
        return newSet;
      });
    }
  };

  const handleRecusarCompartilhamento = async (
    compartilhamentoId: string,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();

    // 👇 CORREÇÃO: Usar estado específico para recusar
    setRecusandoCompartilhamentos((prev) =>
      new Set(prev).add(compartilhamentoId)
    );

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
    } finally {
      // 👇 CORREÇÃO: Remover apenas do estado específico
      setRecusandoCompartilhamentos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(compartilhamentoId);
        return newSet;
      });
    }
  };

  const handleAceitarConvite = async (
    conviteId: string,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();

    // 👇 CORREÇÃO: Usar estado específico para aceitar
    setAceitandoConvites((prev) => new Set(prev).add(conviteId));

    try {
      const response = await fetch(`/api/convites/${conviteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          acao: "ACEITAR",
        }),
      });

      if (response.ok) {
        toast.success("Convite aceito com sucesso!");
        setConvitesPendentes((prev) =>
          prev.filter((item) => item.id !== conviteId)
        );
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao aceitar convite");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao processar solicitação");
    } finally {
      // 👇 CORREÇÃO: Remover apenas do estado específico
      setAceitandoConvites((prev) => {
        const newSet = new Set(prev);
        newSet.delete(conviteId);
        return newSet;
      });
    }
  };

  const handleRecusarConvite = async (
    conviteId: string,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();

    // 👇 CORREÇÃO: Usar estado específico para recusar
    setRecusandoConvites((prev) => new Set(prev).add(conviteId));

    try {
      const response = await fetch(`/api/convites/${conviteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          acao: "RECUSAR",
        }),
      });

      if (response.ok) {
        toast.success("Convite recusado!");
        setConvitesPendentes((prev) =>
          prev.filter((item) => item.id !== conviteId)
        );
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao recusar convite");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao processar solicitação");
    } finally {
      // 👇 CORREÇÃO: Remover apenas do estado específico
      setRecusandoConvites((prev) => {
        const newSet = new Set(prev);
        newSet.delete(conviteId);
        return newSet;
      });
    }
  };
  const handleAceitarConviteMeta = async (
    conviteId: string,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();

    setAceitandoConvitesMetas((prev) => new Set(prev).add(conviteId));

    try {
      const response = await fetch(`/api/convites-metas/${conviteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "ACEITAR" }),
      });

      if (response.ok) {
        toast.success("Convite de meta aceito com sucesso!");
        setConvitesMetasPendentes((prev) =>
          prev.filter((item) => item.id !== conviteId)
        );
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao aceitar convite");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao processar solicitação");
    } finally {
      setAceitandoConvitesMetas((prev) => {
        const newSet = new Set(prev);
        newSet.delete(conviteId);
        return newSet;
      });
    }
  };

  const handleRecusarConviteMeta = async (
    conviteId: string,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();

    setRecusandoConvitesMetas((prev) => new Set(prev).add(conviteId));

    try {
      const response = await fetch(`/api/convites-metas/${conviteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "RECUSAR" }),
      });

      if (response.ok) {
        toast.success("Convite de meta recusado!");
        setConvitesMetasPendentes((prev) =>
          prev.filter((item) => item.id !== conviteId)
        );
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao recusar convite");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao processar solicitação");
    } finally {
      setRecusandoConvitesMetas((prev) => {
        const newSet = new Set(prev);
        newSet.delete(conviteId);
        return newSet;
      });
    }
  };

  // 👇 ATUALIZAR AS FUNÇÕES DE ACEITAR/RECUSAR TODOS PARA INCLUIR METAS
  const handleAceitarTodos = async () => {
    if (processandoTodos) return;

    setProcessandoTodos(true);
    try {
      const promisesConvites = convitesPendentes.map((convite) =>
        fetch(`/api/convites/${convite.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ acao: "ACEITAR" }),
        })
      );

      const promisesCompartilhamentos = compartilhamentosPendentes.map(
        (compartilhamento) =>
          fetch("/api/lancamentos/compartilhados", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lancamentoCompartilhadoId: compartilhamento.id,
              status: "ACEITO",
            }),
          })
      );

      const promisesConvitesMetas = convitesMetasPendentes.map((convite) =>
        fetch(`/api/convites-metas/${convite.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ acao: "ACEITAR" }),
        })
      );

      const todasPromises = [
        ...promisesConvites,
        ...promisesCompartilhamentos,
        ...promisesConvitesMetas,
      ];

      const resultados = await Promise.allSettled(todasPromises);

      const sucessos = resultados.filter(
        (result) => result.status === "fulfilled" && result.value.ok
      ).length;
      const erros = resultados.length - sucessos;

      if (erros === 0) {
        toast.success(
          `Todas as ${todasPromises.length} notificações foram aceitas!`
        );
      } else {
        toast.success(`${sucessos} notificações aceitas, ${erros} com erro`);
      }

      setConvitesPendentes([]);
      setCompartilhamentosPendentes([]);
      setConvitesMetasPendentes([]);
    } catch (error) {
      console.error("Erro ao aceitar todas as notificações:", error);
      toast.error("Erro ao processar todas as notificações");
    } finally {
      setProcessandoTodos(false);
    }
  };

  const handleRecusarTodos = async () => {
    if (processandoTodos) return;

    setProcessandoTodos(true);
    try {
      const promisesConvites = convitesPendentes.map((convite) =>
        fetch(`/api/convites/${convite.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ acao: "RECUSAR" }),
        })
      );

      const promisesCompartilhamentos = compartilhamentosPendentes.map(
        (compartilhamento) =>
          fetch("/api/lancamentos/compartilhados", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lancamentoCompartilhadoId: compartilhamento.id,
              status: "RECUSADO",
            }),
          })
      );

      const promisesConvitesMetas = convitesMetasPendentes.map((convite) =>
        fetch(`/api/convites-metas/${convite.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ acao: "RECUSAR" }),
        })
      );

      const todasPromises = [
        ...promisesConvites,
        ...promisesCompartilhamentos,
        ...promisesConvitesMetas,
      ];

      const resultados = await Promise.allSettled(todasPromises);

      const sucessos = resultados.filter(
        (result) => result.status === "fulfilled" && result.value.ok
      ).length;
      const erros = resultados.length - sucessos;

      if (erros === 0) {
        toast.success(
          `Todas as ${todasPromises.length} notificações foram recusadas!`
        );
      } else {
        toast.success(`${sucessos} notificações recusadas, ${erros} com erro`);
      }

      setConvitesPendentes([]);
      setCompartilhamentosPendentes([]);
      setConvitesMetasPendentes([]);
    } catch (error) {
      console.error("Erro ao recusar todas as notificações:", error);
      toast.error("Erro ao processar todas as notificações");
    } finally {
      setProcessandoTodos(false);
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

  const totalNotificacoes =
    compartilhamentosPendentes.length +
    convitesPendentes.length +
    convitesMetasPendentes.length;

  return (
    <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <Bell className="h-5 w-5" />
          {totalNotificacoes > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 border-0">
              {totalNotificacoes}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md bg-gray-900 border-gray-800">
        <SheetHeader className="border-b border-gray-800 pb-4">
          <SheetTitle className="text-white flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
            {totalNotificacoes > 0 && (
              <Badge
                variant="secondary"
                className="bg-red-900/50 text-red-300 border-red-700"
              >
                {totalNotificacoes}
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
          ) : totalNotificacoes === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Bell className="h-12 w-12 mb-3 text-gray-600" />
              <p className="text-sm">Nenhuma notificação</p>
              <p className="text-xs text-gray-500 mt-1">
                Você não tem solicitações pendentes
              </p>
            </div>
          ) : (
            <>
              {/* BOTÕES ACEITAR/RECUSAR TODOS */}
              <div className="flex gap-2 mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAceitarTodos();
                  }}
                  disabled={processandoTodos}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                  size="sm"
                >
                  {processandoTodos ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {processandoTodos ? "Processando..." : "Aceitar Todos"}
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRecusarTodos();
                  }}
                  disabled={processandoTodos}
                  variant="outline"
                  className="flex-1 border-red-600 text-red-400 hover:bg-red-900/50 text-sm"
                  size="sm"
                >
                  {processandoTodos ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {processandoTodos ? "Processando..." : "Recusar Todos"}
                </Button>
              </div>

              <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                {/* Convites de Cartão */}
                {convitesPendentes.map((convite) => {
                  const aceitando = aceitandoConvites.has(convite.id);
                  const recusando = recusandoConvites.has(convite.id);

                  return (
                    <div
                      key={convite.id}
                      className="p-4 border border-gray-800 rounded-lg bg-gray-800/50 hover:border-gray-700 transition-colors"
                    >
                      {/* Header - Usuário e Tempo */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {convite.usuarioCriador.image ? (
                            <img
                              src={convite.usuarioCriador.image}
                              alt={convite.usuarioCriador.name}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <User className="h-5 w-5 text-gray-400" />
                          )}
                          <span className="text-sm font-medium text-white">
                            {convite.usuarioCriador.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatarTempo(convite.criadoEm)}
                        </span>
                      </div>

                      {/* Detalhes do Convite */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-blue-400" />
                          <p className="text-sm text-gray-300 font-medium">
                            Convite para cartão
                          </p>
                        </div>

                        <div className="flex items-center gap-2 ml-6">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: convite.cartao.cor }}
                          />
                          <p className="text-sm text-white">
                            {convite.cartao.nome}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-xs bg-gray-700 text-gray-300 border-gray-600"
                          >
                            {convite.cartao.bandeira}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1 ml-6 text-xs text-gray-400">
                          <Users className="h-3 w-3" />
                          <span>Colaborador com acesso de leitura</span>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                          Expira em: {formatarData(convite.expiraEm)}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={(e) => handleAceitarConvite(convite.id, e)}
                            disabled={aceitando || recusando}
                            className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white"
                          >
                            {aceitando ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => handleRecusarConvite(convite.id, e)}
                            disabled={aceitando || recusando}
                            className="h-8 px-3 border-red-600 text-red-400 hover:bg-red-900/50"
                          >
                            {recusando ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Convites de Metas */}
                {convitesMetasPendentes.map((convite) => {
                  const aceitando = aceitandoConvitesMetas.has(convite.id);
                  const recusando = recusandoConvitesMetas.has(convite.id);

                  return (
                    <div
                      key={convite.id}
                      className="p-4 border border-gray-800 rounded-lg bg-gray-800/50 hover:border-gray-700 transition-colors"
                    >
                      {/* Header - Usuário e Tempo */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {convite.usuarioCriador.image ? (
                            <img
                              src={convite.usuarioCriador.image}
                              alt={convite.usuarioCriador.name}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <User className="h-5 w-5 text-gray-400" />
                          )}
                          <span className="text-sm font-medium text-white">
                            {convite.usuarioCriador.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatarTempo(convite.criadoEm)}
                        </span>
                      </div>

                      {/* Detalhes do Convite */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-purple-400" />
                          <p className="text-sm text-gray-300 font-medium">
                            Convite para meta
                          </p>
                        </div>

                        <div className="flex items-center gap-2 ml-6">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: convite.meta.cor }}
                          />
                          <p className="text-sm text-white">
                            {convite.meta.titulo}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-xs bg-gray-700 text-gray-300 border-gray-600"
                          >
                            {convite.meta.categoria}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1 ml-6 text-xs text-gray-400">
                          <Users className="h-3 w-3" />
                          <span>Colaborador com acesso de leitura</span>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                          Expira em: {formatarData(convite.expiraEm)}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={(e) =>
                              handleAceitarConviteMeta(convite.id, e)
                            }
                            disabled={aceitando || recusando}
                            className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white"
                          >
                            {aceitando ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) =>
                              handleRecusarConviteMeta(convite.id, e)
                            }
                            disabled={aceitando || recusando}
                            className="h-8 px-3 border-red-600 text-red-400 hover:bg-red-900/50"
                          >
                            {recusando ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Lançamentos Compartilhados */}
                {compartilhamentosPendentes.map((compartilhamento) => {
                  const aceitando = aceitandoCompartilhamentos.has(
                    compartilhamento.id
                  );
                  const recusando = recusandoCompartilhamentos.has(
                    compartilhamento.id
                  );

                  return (
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
                            onClick={(e) =>
                              handleAceitarCompartilhamento(
                                compartilhamento.id,
                                e
                              )
                            }
                            disabled={aceitando || recusando}
                            className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white"
                          >
                            {aceitando ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) =>
                              handleRecusarCompartilhamento(
                                compartilhamento.id,
                                e
                              )
                            }
                            disabled={aceitando || recusando}
                            className="h-8 px-3 border-red-600 text-red-400 hover:bg-red-900/50"
                          >
                            {recusando ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
