// app/dashboard/metas/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Plus,
  Target,
  Calendar,
  Trophy,
  Edit3,
  Trash2,
  ArrowLeft,
  DollarSign,
  Crown,
} from "lucide-react";
import { MetaPessoal } from "../../../../../types/dashboard";
import { UploadImage } from "@/components/shared/upload-image";
import { useSession } from "next-auth/react";
import { ColaboradoresMeta } from "@/components/shared/ColaboradoresMeta";
import { Loading } from "@/components/ui/loading-barrinhas";
import { motion, AnimatePresence } from "framer-motion";
import { getFallback } from "@/lib/i18nFallback";

type PlanoUsuario = "free" | "pro" | "family";

export default function MetasPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const { t, i18n } = useTranslation("metas");
  const currentLang = (params?.lang as string) || "pt";

  // Função auxiliar para obter tradução com fallback
  const getTranslation = (key: string) => {
    // Primeiro tenta usar o i18n
    const translation = t(key);
    if (translation && translation !== key) {
      return translation;
    }

    // Fallback manual baseado nas chaves que você tem nos arquivos JSON
    switch (key) {
      // Títulos
      case "titulo":
        return getFallback(currentLang, "Metas Pessoais", "Personal Goals");
      case "subtitulo":
        return getFallback(
          currentLang,
          "Gerencie seus objetivos financeiros",
          "Manage your financial objectives",
        );

      // Botões
      case "botoes.novaMeta":
        return getFallback(currentLang, "Nova Meta", "New Goal");
      case "botoes.criarMeta":
        return getFallback(currentLang, "Criar Meta", "Create Goal");
      case "botoes.criarPrimeiraMeta":
        return getFallback(
          currentLang,
          "Criar Primeira Meta",
          "Create First Goal",
        );
      case "botoes.atualizar":
        return getFallback(currentLang, "Atualizar", "Update");
      case "botoes.cancelar":
        return getFallback(currentLang, "Cancelar", "Cancel");
      case "botoes.confirmar":
        return getFallback(currentLang, "Confirmar", "Confirm");
      case "botoes.upgrade":
        return getFallback(currentLang, "Upgrade", "Upgrade");

      // Formulário
      case "formulario.tituloNovo":
        return getFallback(currentLang, "Nova Meta", "New Goal");
      case "formulario.tituloEditar":
        return getFallback(currentLang, "Editar Meta", "Edit Goal");
      case "formulario.descricaoNovo":
        return getFallback(
          currentLang,
          "Crie uma nova meta financeira",
          "Create a new financial goal",
        );
      case "formulario.descricaoEditar":
        return getFallback(
          currentLang,
          "Atualize os dados da meta",
          "Update goal data",
        );
      case "formulario.tituloLabel":
        return getFallback(currentLang, "Título", "Title");
      case "formulario.tituloPlaceholder":
        return getFallback(
          currentLang,
          "Ex: Comprar um carro, Viagem...",
          "Ex: Buy a car, Trip...",
        );
      case "formulario.descricaoLabel":
        return getFallback(currentLang, "Descrição", "Description");
      case "formulario.descricaoPlaceholder":
        return getFallback(
          currentLang,
          "Descrição detalhada da meta...",
          "Detailed description of the goal...",
        );
      case "formulario.valorAlvoLabel":
        return getFallback(currentLang, "Valor Alvo", "Target Amount");
      case "formulario.valorAtualLabel":
        return getFallback(currentLang, "Valor Atual", "Current Amount");
      case "formulario.dataAlvoLabel":
        return getFallback(currentLang, "Data Alvo", "Target Date");
      case "formulario.categoriaLabel":
        return getFallback(currentLang, "Categoria", "Category");
      case "formulario.categoriaPlaceholder":
        return getFallback(
          currentLang,
          "Ex: Veículo, Casa, Educação...",
          "Ex: Vehicle, House, Education...",
        );
      case "formulario.corLabel":
        return getFallback(currentLang, "Cor", "Color");
      case "formulario.iconeLabel":
        return getFallback(currentLang, "Ícone", "Icon");

      // Status
      case "status.concluida":
        return getFallback(currentLang, "Concluída", "Completed");
      case "status.atrasada":
        return getFallback(currentLang, "Atrasada", "Overdue");
      case "status.proxima":
        return getFallback(currentLang, "Próxima", "Upcoming");
      case "status.em_andamento":
        return getFallback(currentLang, "Em andamento", "In Progress");

      // Progresso
      case "progresso.label":
        return getFallback(currentLang, "Progresso", "Progress");

      // Compartilhada
      case "compartilhada.por":
        return getFallback(currentLang, "Compartilhada por", "Shared by");

      // Mensagens
      case "mensagens.nenhumaMeta":
        return getFallback(
          currentLang,
          "Nenhuma meta definida",
          "No goals defined",
        );
      case "mensagens.comeceCriando":
        return getFallback(
          currentLang,
          "Comece criando sua primeira meta financeira",
          "Start by creating your first financial goal",
        );
      case "mensagens.criada":
        return getFallback(
          currentLang,
          "Meta criada com sucesso!",
          "Goal created successfully!",
        );
      case "mensagens.atualizada":
        return getFallback(
          currentLang,
          "Meta atualizada com sucesso!",
          "Goal updated successfully!",
        );
      case "mensagens.excluida":
        return getFallback(
          currentLang,
          "Meta excluída com sucesso!",
          "Goal deleted successfully!",
        );
      case "mensagens.valorAdicionado":
        return getFallback(
          currentLang,
          "Valor de R$ {{valor}} adicionado com sucesso",
          "Amount of $ {{valor}} added successfully",
        );
      case "mensagens.diasRestantes":
        if (i18n.language === "pt") {
          const count = Number(key.split(".").pop());
          return count === 1
            ? "{{count}} dia restante"
            : "{{count}} dias restantes";
        }
        const count = Number(key.split(".").pop());
        return count === 1
          ? "{{count}} day remaining"
          : "{{count}} days remaining";

      // Estados
      case "estados.carregando":
        return getFallback(currentLang, "Carregando...", "Loading...");
      case "estados.criando":
        return getFallback(currentLang, "Criando...", "Creating...");
      case "estados.atualizando":
        return getFallback(currentLang, "Atualizando...", "Updating...");
      case "estados.excluindo":
        return getFallback(currentLang, "Excluindo...", "Deleting...");
      case "estados.limiteMetas":
        return getFallback(currentLang, "Limite", "Limit");

      // Tooltips
      case "tooltips.adicionarValor":
        return getFallback(currentLang, "Adicionar valor", "Add amount");
      case "tooltips.editarMeta":
        return getFallback(currentLang, "Editar meta", "Edit goal");
      case "tooltips.excluirMeta":
        return getFallback(currentLang, "Excluir meta", "Delete goal");

      // Confirmação
      case "confirmacao.titulo":
        return getFallback(currentLang, "Excluir Meta", "Delete Goal");
      case "confirmacao.descricao":
        return getFallback(
          currentLang,
          'Tem certeza que deseja excluir a meta "{{titulo}}"? Esta ação não pode ser desfeita.',
          'Are you sure you want to delete the goal "{{titulo}}"? This action cannot be undone.',
        );

      // Erros
      case "erros.carregarMetas":
        return getFallback(
          currentLang,
          "Erro ao carregar metas",
          "Error loading goals",
        );
      case "erros.carregarColaboradores":
        return getFallback(
          currentLang,
          "Erro ao carregar colaboradores",
          "Error loading collaborators",
        );
      case "erros.excluirMeta":
        return getFallback(
          currentLang,
          "Erro ao excluir meta",
          "Error deleting goal",
        );
      case "erros.salvarMeta":
        return getFallback(
          currentLang,
          "Erro ao salvar meta",
          "Error saving goal",
        );
      case "erros.valorInvalido":
        return getFallback(
          currentLang,
          "Digite um valor válido",
          "Enter a valid amount",
        );
      case "erros.contribuirMeta":
        return getFallback(
          currentLang,
          "Erro ao contribuir para meta",
          "Error contributing to goal",
        );
      case "erros.adicionarValor":
        return getFallback(
          currentLang,
          "Erro ao adicionar valor",
          "Error adding amount",
        );
      case "erros.contribuir":
        return getFallback(
          currentLang,
          "Erro ao contribuir",
          "Error contributing",
        );

      // Aviso Limite Metas (novas traduções)
      case "avisos.metasFree.titulo":
        return getFallback(currentLang, "Metas Free", "Free Goals");
      case "avisos.metasFree.descricao":
        return getFallback(
          currentLang,
          "metas • restantes",
          "goals • remaining",
        );
      case "avisos.metasFree.atingido":
        return getFallback(
          currentLang,
          "Você atingiu o limite de metas do plano Free",
          "You have reached the Free plan goals limit",
        );
      case "avisos.colaboradores.titulo":
        return getFallback(
          currentLang,
          "Recurso exclusivo do plano Família",
          "Exclusive Family plan feature",
        );
      case "avisos.colaboradores.descricao":
        return getFallback(
          currentLang,
          "Faça upgrade para adicionar colaboradores às suas metas",
          "Upgrade to add collaborators to your goals",
        );
      case "avisos.colaboradores.conhecerPlanos":
        return getFallback(currentLang, "Conhecer planos", "View plans");

      default:
        return key;
    }
  };

  // Criar um objeto de traduções para fácil acesso
  const translations = {
    titulo: getTranslation("titulo"),
    subtitulo: getTranslation("subtitulo"),

    botoes: {
      novaMeta: getTranslation("botoes.novaMeta"),
      criarMeta: getTranslation("botoes.criarMeta"),
      criarPrimeiraMeta: getTranslation("botoes.criarPrimeiraMeta"),
      atualizar: getTranslation("botoes.atualizar"),
      cancelar: getTranslation("botoes.cancelar"),
      confirmar: getTranslation("botoes.confirmar"),
      upgrade: getTranslation("botoes.upgrade"),
    },

    formulario: {
      tituloNovo: getTranslation("formulario.tituloNovo"),
      tituloEditar: getTranslation("formulario.tituloEditar"),
      descricaoNovo: getTranslation("formulario.descricaoNovo"),
      descricaoEditar: getTranslation("formulario.descricaoEditar"),
      tituloLabel: getTranslation("formulario.tituloLabel"),
      tituloPlaceholder: getTranslation("formulario.tituloPlaceholder"),
      descricaoLabel: getTranslation("formulario.descricaoLabel"),
      descricaoPlaceholder: getTranslation("formulario.descricaoPlaceholder"),
      valorAlvoLabel: getTranslation("formulario.valorAlvoLabel"),
      valorAtualLabel: getTranslation("formulario.valorAtualLabel"),
      dataAlvoLabel: getTranslation("formulario.dataAlvoLabel"),
      categoriaLabel: getTranslation("formulario.categoriaLabel"),
      categoriaPlaceholder: getTranslation("formulario.categoriaPlaceholder"),
      corLabel: getTranslation("formulario.corLabel"),
      iconeLabel: getTranslation("formulario.iconeLabel"),
    },

    status: {
      concluida: getTranslation("status.concluida"),
      atrasada: getTranslation("status.atrasada"),
      proxima: getTranslation("status.proxima"),
      em_andamento: getTranslation("status.em_andamento"),
    },

    progresso: {
      label: getTranslation("progresso.label"),
    },

    compartilhada: {
      por: getTranslation("compartilhada.por"),
    },

    mensagens: {
      nenhumaMeta: getTranslation("mensagens.nenhumaMeta"),
      comeceCriando: getTranslation("mensagens.comeceCriando"),
      criada: getTranslation("mensagens.criada"),
      atualizada: getTranslation("mensagens.atualizada"),
      excluida: getTranslation("mensagens.excluida"),
      valorAdicionado: getTranslation("mensagens.valorAdicionado"),
      diasRestantes: (count: number) => {
        const key =
          count === 1
            ? "mensagens.diasRestantes"
            : "mensagens.diasRestantes_plural";
        return getTranslation(key);
      },
    },

    estados: {
      carregando: getTranslation("estados.carregando"),
      criando: getTranslation("estados.criando"),
      atualizando: getTranslation("estados.atualizando"),
      excluindo: getTranslation("estados.excluindo"),
      limiteMetas: getTranslation("estados.limiteMetas"),
    },

    tooltips: {
      adicionarValor: getTranslation("tooltips.adicionarValor"),
      editarMeta: getTranslation("tooltips.editarMeta"),
      excluirMeta: getTranslation("tooltips.excluirMeta"),
    },

    confirmacao: {
      titulo: getTranslation("confirmacao.titulo"),
      descricao: getTranslation("confirmacao.descricao"),
    },

    erros: {
      carregarMetas: getTranslation("erros.carregarMetas"),
      carregarColaboradores: getTranslation("erros.carregarColaboradores"),
      excluirMeta: getTranslation("erros.excluirMeta"),
      salvarMeta: getTranslation("erros.salvarMeta"),
      valorInvalido: getTranslation("erros.valorInvalido"),
      contribuirMeta: getTranslation("erros.contribuirMeta"),
      adicionarValor: getTranslation("erros.adicionarValor"),
      contribuir: getTranslation("erros.contribuir"),
    },

    avisos: {
      metasFree: {
        titulo: getTranslation("avisos.metasFree.titulo"),
        descricao: getTranslation("avisos.metasFree.descricao"),
        atingido: getTranslation("avisos.metasFree.atingido"),
      },
      colaboradores: {
        titulo: getTranslation("avisos.colaboradores.titulo"),
        descricao: getTranslation("avisos.colaboradores.descricao"),
        conhecerPlanos: getTranslation("avisos.colaboradores.conhecerPlanos"),
      },
    },
  };

  const [colaboradoresCarregando, setColaboradoresCarregando] = useState<
    Set<string>
  >(new Set());
  const [dialogContribuicaoAberto, setDialogContribuicaoAberto] =
    useState(false);
  const [metaParaContribuir, setMetaParaContribuir] = useState<{
    id: string;
    titulo: string;
  } | null>(null);
  const [valorParaContribuir, setValorParaContribuir] = useState("100");
  const [carregandoContribuicao, setCarregandoContribuicao] = useState(false);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [metas, setMetas] = useState<MetaPessoal[]>([]);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [dialogAberto, setDialogAberto] = useState<string | null>(null);
  const [editandoMeta, setEditandoMeta] = useState<MetaPessoal | null>(null);
  const [valorAdicional, setValorAdicional] = useState("100");
  const [mostrarInputValor, setMostrarInputValor] = useState<string | null>(
    null,
  );
  const [limiteInfo, setLimiteInfo] = useState<{
    plano: PlanoUsuario;
    usadoMetas: number;
    limiteMetas: number;
    metasAtingido: boolean;
    percentualMetas: number;
  } | null>(null);

  const [loadingLimite, setLoadingLimite] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    valorAlvo: "",
    valorAtual: "",
    dataAlvo: "",
    categoria: "",
    cor: "#3B82F6",
    icone: "🏠",
    imagemUrl: "",
  });

  const coresPredefinidas = [
    "#EF4444",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#84CC16",
    "#F97316",
    "#6366F1",
  ];

  const iconesPredefinidos = [
    "🏠",
    "🚗",
    "💼",
    "🎓",
    "✈️",
    "💍",
    "📱",
    "💻",
    "🏥",
    "🎮",
  ];

  useEffect(() => {
    carregarMetas();
    fetchLimiteInfo();
  }, []);

  const fetchLimiteInfo = async () => {
    try {
      setLoadingLimite(true);
      const response = await fetch(
        "/api/usuarios/subscription/limite-combinado",
      );
      if (response.ok) {
        const data = await response.json();
        setLimiteInfo({
          plano: data.plano as PlanoUsuario,
          usadoMetas: data.usadoMetas,
          limiteMetas: data.limiteMetas,
          metasAtingido: data.metasAtingido,
          percentualMetas: data.percentualMetas,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar limite de metas:", error);
    } finally {
      setLoadingLimite(false);
    }
  };

  const podeTerColaboradores = () => {
    return limiteInfo?.plano === "family";
  };

  const carregarColaboradoresMeta = async (metaId: string) => {
    try {
      setColaboradoresCarregando((prev) => new Set(prev).add(metaId));

      const response = await fetch(`/api/metas/${metaId}/colaboradores`);
      if (response.ok) {
        const data = await response.json();

        setMetas((prev) =>
          prev.map((meta) =>
            meta.id === metaId
              ? {
                  ...meta,
                  ColaboradorMeta: data.colaboradores,
                  ConviteMeta: data.convites,
                }
              : meta,
          ),
        );
      }
    } catch (error) {
      console.error(translations.erros.carregarColaboradores, error);
      toast.error(translations.erros.carregarColaboradores);
    } finally {
      setColaboradoresCarregando((prev) => {
        const newSet = new Set(prev);
        newSet.delete(metaId);
        return newSet;
      });
    }
  };

  const handleColaboradoresAtualizados = (metaId: string) => {
    carregarColaboradoresMeta(metaId);
  };

  const carregarMetas = async () => {
    try {
      setCarregando(true);
      const response = await fetch("/api/dashboard/metas");

      if (!response.ok) throw new Error(translations.erros.carregarMetas);

      const data = await response.json();
      setMetas(data);
    } catch (error) {
      console.error(translations.erros.carregarMetas, error);
      toast.error(translations.erros.carregarMetas);
    } finally {
      setCarregando(false);
    }
  };

  const excluirMeta = async (id: string) => {
    setExcluindo(id);

    const metaParaExcluir = metas.find((meta) => meta.id === id);

    try {
      setMetas((prev) => prev.filter((meta) => meta.id !== id));
      setDialogAberto(null);

      const response = await fetch(`/api/dashboard/metas/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error(translations.erros.excluirMeta);

      toast.success(translations.mensagens.excluida);
    } catch (error) {
      console.error(translations.erros.excluirMeta, error);

      if (metaParaExcluir) {
        setMetas((prev) => [...prev, metaParaExcluir]);
      }

      toast.error(translations.erros.excluirMeta);
    } finally {
      setExcluindo(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    try {
      const url = editandoMeta
        ? `/api/dashboard/metas/${editandoMeta.id}`
        : "/api/dashboard/metas";

      const method = editandoMeta ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          valorAlvo: parseFloat(formData.valorAlvo),
          valorAtual: parseFloat(formData.valorAtual),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();

        if (
          res.status === 403 &&
          errorData.error === "Limite de metas atingido"
        ) {
          toast.error(errorData.message, {
            action: {
              label: "Upgrade",
              onClick: () => router.push(`/${currentLang}/dashboard/perfil`),
            },
          });
          return;
        }

        throw new Error(errorData.error || translations.erros.salvarMeta);
      }

      const metaSalva = await res.json();

      if (editandoMeta) {
        setMetas((prev) =>
          prev.map((meta) => (meta.id === editandoMeta.id ? metaSalva : meta)),
        );
        toast.success(translations.mensagens.atualizada);
      } else {
        setMetas((prev) => [...prev, metaSalva]);
        toast.success(translations.mensagens.criada);
      }

      setFormData({
        titulo: "",
        descricao: "",
        valorAlvo: "",
        valorAtual: "",
        dataAlvo: "",
        categoria: "",
        cor: "#3B82F6",
        icone: "🏠",
        imagemUrl: "",
      });
      setEditandoMeta(null);
      setIsSheetOpen(false);
    } catch (error) {
      console.error(translations.erros.salvarMeta, error);
      toast.error(translations.erros.salvarMeta);
      carregarMetas();
    } finally {
      setEnviando(false);
    }
  };

  const startEdit = (meta: MetaPessoal) => {
    setEditandoMeta(meta);
    setFormData({
      titulo: meta.titulo,
      descricao: meta.descricao || "",
      valorAlvo: meta.valorAlvo.toString(),
      valorAtual: meta.valorAtual.toString(),
      dataAlvo: new Date(meta.dataAlvo).toISOString().split("T")[0],
      categoria: meta.categoria,
      cor: meta.cor || "#3B82F6",
      icone: meta.icone || "🏠",
      imagemUrl: meta.imagemUrl || "",
    });
    setIsSheetOpen(true);
  };

  const adicionarValorCustomizado = async (id: string) => {
    if (!valorAdicional || parseFloat(valorAdicional) <= 0) {
      toast.error(translations.erros.valorInvalido);
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/metas/${id}/contribuir`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          valor: parseFloat(valorAdicional),
        }),
      });

      if (!response.ok) throw new Error(translations.erros.contribuirMeta);

      toast.success(
        translations.mensagens.valorAdicionado.replace(
          "{{valor}}",
          parseFloat(valorAdicional).toFixed(2),
        ),
      );
      setMostrarInputValor(null);
      setValorAdicional("100");
      carregarMetas();
    } catch (error) {
      console.error(translations.erros.adicionarValor, error);
      toast.error(translations.erros.adicionarValor);
    }
  };

  const currencySymbol = i18n.language === "en" ? "$" : "R$";
  const formatarMoeda = (valor: number) => {
    const locale = i18n.language === "pt" ? "pt-BR" : "en-US";
    const currency = i18n.language === "pt" ? "BRL" : "USD";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(valor);
  };

  const formatarData = (data: Date) => {
    return new Date(data).toLocaleDateString("pt-BR");
  };

  const calcularProgresso = (meta: MetaPessoal) => {
    return (meta.valorAtual / meta.valorAlvo) * 100;
  };

  const obterStatusMeta = (progresso: number, dataAlvo: Date) => {
    const hoje = new Date();
    const dataAlvoDate = new Date(dataAlvo);

    if (progresso >= 100) return "concluida";
    if (dataAlvoDate < hoje) return "atrasada";
    if (progresso >= 75) return "proxima";
    return "em_andamento";
  };

  const abrirDialogContribuicao = (metaId: string, metaTitulo: string) => {
    setMetaParaContribuir({ id: metaId, titulo: metaTitulo });
    setDialogContribuicaoAberto(true);
  };

  const confirmarContribuicao = async (data: {
    lancarComoDespesa: boolean;
    categoriaId?: string;
    novaCategoriaNome?: string;
  }) => {
    if (!metaParaContribuir) return;

    setCarregandoContribuicao(true);

    try {
      const payload: any = {
        valor: parseFloat(valorParaContribuir),
        lancarComoDespesa: data.lancarComoDespesa,
      };

      if (data.lancarComoDespesa) {
        if (data.novaCategoriaNome) {
          payload.novaCategoria = {
            nome: data.novaCategoriaNome,
            cor: "#8B5CF6",
            icone: "🎯",
          };
        } else if (data.categoriaId) {
          payload.categoriaId = data.categoriaId;
        }
      }

      const response = await fetch(
        `/api/metas/${metaParaContribuir.id}/contribuir`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || translations.erros.contribuirMeta);
      }

      const result = await response.json();

      toast.success(
        translations.mensagens.valorAdicionado.replace(
          "{{valor}}",
          parseFloat(valorParaContribuir).toFixed(2),
        ),
      );

      setDialogContribuicaoAberto(false);
      setMetaParaContribuir(null);
      setValorParaContribuir("100");
      carregarMetas();
    } catch (error) {
      console.error(translations.erros.contribuir, error);
      toast.error(
        error instanceof Error ? error.message : translations.erros.contribuir,
      );
    } finally {
      setCarregandoContribuicao(false);
    }
  };

  if (carregando) {
    return <Loading />;
  }

  const AvisoLimiteMetas = () => {
    if (!limiteInfo || loadingLimite || limiteInfo.plano !== "free") {
      return null;
    }

    const { usadoMetas, limiteMetas, metasAtingido, percentualMetas } =
      limiteInfo;

    let corProgresso = "#f59e0b";
    let corTexto = "text-amber-700 dark:text-amber-300";
    let corFundo = "bg-amber-50 dark:bg-amber-900/20";
    let corBorda = "border-amber-200 dark:border-amber-800";

    if (metasAtingido) {
      corProgresso = "#ef4444";
      corTexto = "text-red-700 dark:text-red-300";
      corFundo = "bg-red-50 dark:bg-red-900/20";
      corBorda = "border-red-200 dark:border-red-800";
    } else if (percentualMetas >= 80) {
      corProgresso = "#f59e0b";
      corTexto = "text-amber-700 dark:text-amber-300";
      corFundo = "bg-amber-50 dark:bg-amber-900/20";
      corBorda = "border-amber-200 dark:border-amber-800";
    }

    return (
      <div className={`mb-4 p-4 rounded-lg border ${corBorda} ${corFundo}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <svg className="h-full w-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={metasAtingido ? "#fecaca" : "#fde68a"}
                  strokeWidth="4"
                  strokeOpacity="0.3"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={corProgresso}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${percentualMetas * 2.51} 251`}
                  strokeDashoffset="0"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xs font-medium ${corTexto}`}>
                  {Math.round(percentualMetas)}%
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${corTexto}`}>
                  {translations.avisos.metasFree.titulo}
                </span>
              </div>
              <p className={`text-sm ${corTexto}`}>
                {usadoMetas}/{limiteMetas}{" "}
                {currentLang === "pt" ? "metas" : "goals"}
                {!metasAtingido &&
                  ` • ${limiteMetas - usadoMetas} ${currentLang === "pt" ? "restantes" : "remaining"}`}
              </p>
            </div>
          </div>

          {metasAtingido && (
            <Button
              size="sm"
              className="bg-gradient-to-r from-[#00cfec] to-[#007cca] text-white hover:opacity-90 text-xs"
              onClick={() => router.push(`/${currentLang}/dashboard/perfil`)}
            >
              <Crown className="h-3 w-3 mr-1" />
              {translations.botoes.upgrade}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen p-3 sm:p-4 md:p-6"
    >
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Cabeçalho */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {translations.titulo}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                {translations.subtitulo}
              </p>
            </motion.div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white text-xs sm:text-sm"
                    onClick={() => {
                      setEditandoMeta(null);
                      setFormData({
                        titulo: "",
                        descricao: "",
                        valorAlvo: "",
                        valorAtual: "",
                        dataAlvo: "",
                        categoria: "",
                        cor: "#3B82F6",
                        icone: "🏠",
                        imagemUrl: "",
                      });
                    }}
                    disabled={limiteInfo?.metasAtingido && !editandoMeta}
                  >
                    <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span>
                      {translations.botoes.novaMeta}
                      {limiteInfo?.metasAtingido &&
                        !editandoMeta &&
                        ` (${translations.estados.limiteMetas})`}
                    </span>
                  </Button>
                </motion.div>
              </SheetTrigger>
              <SheetContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white overflow-y-auto w-full sm:max-w-md">
                <SheetHeader>
                  <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <SheetTitle className="text-gray-900 dark:text-white text-lg sm:text-xl">
                      {editandoMeta
                        ? translations.formulario.tituloEditar
                        : translations.formulario.tituloNovo}
                    </SheetTitle>
                    <SheetDescription className="text-gray-600 dark:text-gray-400 text-sm">
                      {editandoMeta
                        ? translations.formulario.descricaoEditar
                        : translations.formulario.descricaoNovo}
                    </SheetDescription>
                  </motion.div>
                </SheetHeader>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 sm:space-y-6 mt-4 sm:mt-6"
                >
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-1 sm:space-y-2"
                  >
                    <Label
                      htmlFor="titulo"
                      className="text-gray-900 dark:text-white text-sm sm:text-base"
                    >
                      {translations.formulario.tituloLabel}
                    </Label>
                    <Input
                      id="titulo"
                      value={formData.titulo}
                      onChange={(e) =>
                        setFormData({ ...formData, titulo: e.target.value })
                      }
                      placeholder={translations.formulario.tituloPlaceholder}
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 text-sm sm:text-base"
                      required
                    />
                  </motion.div>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="space-y-1 sm:space-y-2"
                  >
                    <Label
                      htmlFor="descricao"
                      className="text-gray-900 dark:text-white text-sm sm:text-base"
                    >
                      {translations.formulario.descricaoLabel}
                    </Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData({ ...formData, descricao: e.target.value })
                      }
                      placeholder={translations.formulario.descricaoPlaceholder}
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 text-sm sm:text-base"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
                  >
                    <div className="space-y-1 sm:space-y-2">
                      <Label
                        htmlFor="valorAlvo"
                        className="text-gray-900 dark:text-white text-sm sm:text-base"
                      >
                        {translations.formulario.valorAlvoLabel}
                      </Label>
                      <Input
                        id="valorAlvo"
                        type="number"
                        step="0.01"
                        value={formData.valorAlvo}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            valorAlvo: e.target.value,
                          })
                        }
                        placeholder="0,00"
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                        required
                      />
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <Label
                        htmlFor="valorAtual"
                        className="text-gray-900 dark:text-white text-sm sm:text-base"
                      >
                        {translations.formulario.valorAtualLabel}
                      </Label>
                      <Input
                        id="valorAtual"
                        type="number"
                        step="0.01"
                        value={formData.valorAtual}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            valorAtual: e.target.value,
                          })
                        }
                        placeholder="0,00"
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                        required
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-1 sm:space-y-2"
                  >
                    <Label
                      htmlFor="dataAlvo"
                      className="text-gray-900 dark:text-white text-sm sm:text-base"
                    >
                      {translations.formulario.dataAlvoLabel}
                    </Label>
                    <Input
                      id="dataAlvo"
                      type="date"
                      value={formData.dataAlvo}
                      onChange={(e) =>
                        setFormData({ ...formData, dataAlvo: e.target.value })
                      }
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                      required
                    />
                  </motion.div>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-1 sm:space-y-2"
                  >
                    <Label
                      htmlFor="categoria"
                      className="text-gray-900 dark:text-white text-sm sm:text-base"
                    >
                      {translations.formulario.categoriaLabel}
                    </Label>
                    <Input
                      id="categoria"
                      value={formData.categoria}
                      onChange={(e) =>
                        setFormData({ ...formData, categoria: e.target.value })
                      }
                      placeholder={translations.formulario.categoriaPlaceholder}
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 text-sm sm:text-base"
                      required
                    />
                  </motion.div>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="space-y-2 sm:space-y-3"
                  >
                    <Label className="text-gray-900 dark:text-white text-sm sm:text-base">
                      {translations.formulario.corLabel}
                    </Label>
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm"
                        style={{ backgroundColor: formData.cor }}
                      />
                      <Input
                        type="color"
                        value={formData.cor}
                        onChange={(e) =>
                          setFormData({ ...formData, cor: e.target.value })
                        }
                        className="w-16 h-8 sm:w-20 sm:h-10 p-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                      />
                    </div>
                    <div className="grid grid-cols-5 sm:grid-cols-5 gap-1 sm:gap-2">
                      {coresPredefinidas.map((cor, index) => (
                        <motion.button
                          key={cor}
                          type="button"
                          onClick={() => setFormData({ ...formData, cor })}
                          className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                            formData.cor === cor
                              ? "border-gray-900 dark:border-white ring-2 ring-gray-900/20 dark:ring-white/20"
                              : "border-gray-300 dark:border-gray-700"
                          }`}
                          style={{ backgroundColor: cor }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.35 + index * 0.03 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        />
                      ))}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-1 sm:space-y-2"
                  >
                    <Label className="text-gray-900 dark:text-white text-sm sm:text-base">
                      {translations.formulario.iconeLabel}
                    </Label>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-1 sm:gap-2">
                      {iconesPredefinidos.map((icone, index) => (
                        <motion.button
                          key={icone}
                          type="button"
                          onClick={() => setFormData({ ...formData, icone })}
                          className={`p-1 sm:p-2 border rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-xl sm:text-2xl ${
                            formData.icone === icone
                              ? "border-gray-900 dark:border-white bg-gray-100 dark:bg-gray-800"
                              : "border-gray-300 dark:border-gray-700"
                          }`}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.4 + index * 0.02 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {icone}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.45 }}
                    className="space-y-1 sm:space-y-2"
                  >
                    <UploadImage
                      onImageChange={(url) =>
                        setFormData({ ...formData, imagemUrl: url || "" })
                      }
                      currentImage={formData.imagemUrl}
                      userId={session?.user?.id || ""}
                      metaId={editandoMeta?.id || "new"}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4"
                  >
                    <Button
                      type="submit"
                      className="flex-1 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-sm sm:text-base"
                      disabled={enviando}
                    >
                      {enviando
                        ? editandoMeta
                          ? translations.estados.atualizando
                          : translations.estados.criando
                        : editandoMeta
                          ? translations.botoes.atualizar
                          : translations.botoes.criarMeta}
                    </Button>

                    {editandoMeta && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditandoMeta(null);
                          setFormData({
                            titulo: "",
                            descricao: "",
                            valorAlvo: "",
                            valorAtual: "",
                            dataAlvo: "",
                            categoria: "",
                            cor: "#3B82F6",
                            icone: "🏠",
                            imagemUrl: "",
                          });
                          setIsSheetOpen(false);
                        }}
                        className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 text-sm sm:text-base"
                      >
                        {translations.botoes.cancelar}
                      </Button>
                    )}
                  </motion.div>
                </form>
              </SheetContent>
            </Sheet>
          </div>
        </motion.div>
        <div>
          <AvisoLimiteMetas />
        </div>
        {/* Grid de Metas */}
        <AnimatePresence mode="wait">
          {metas.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="col-span-full text-center py-8 sm:py-12"
            >
              <motion.div
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                <Trophy className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-gray-400 dark:text-gray-600" />
              </motion.div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-1 sm:mb-2">
                {translations.mensagens.nenhumaMeta}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 px-4">
                {translations.mensagens.comeceCriando}
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => setIsSheetOpen(true)}
                  className="bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-sm"
                >
                  <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  {translations.botoes.criarPrimeiraMeta}
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="metas-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
            >
              <AnimatePresence>
                {metas.map((meta, index) => {
                  const progresso = calcularProgresso(meta);
                  const status = obterStatusMeta(progresso, meta.dataAlvo);
                  const diasRestantes = Math.ceil(
                    (new Date(meta.dataAlvo).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24),
                  );

                  const usuarioAtualEhDono = meta.userId === session?.user?.id;

                  return (
                    <motion.div
                      key={meta.id}
                      initial={{ y: 20, opacity: 0, scale: 0.95 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: -20, opacity: 0, scale: 0.95 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                      }}
                      whileHover={{ y: -1, transition: { duration: 0.2 } }}
                      layout
                    >
                      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm group hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                        {/* Imagem de capa */}
                        {meta.imagemUrl && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="w-full h-28 sm:h-32 overflow-hidden cursor-pointer"
                            onClick={() => setFotoAmpliada(meta.imagemUrl!)}
                            whileHover={{ scale: 1.02 }}
                          >
                            <img
                              src={meta.imagemUrl}
                              alt={meta.titulo}
                              className="w-full h-full object-cover transition-transform hover:scale-105"
                            />
                          </motion.div>
                        )}

                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-lg sm:text-xl"
                              >
                                {meta.icone}
                              </motion.span>
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-white truncate">
                                  {meta.titulo}
                                </CardTitle>
                                {meta.ehCompartilhada && meta.user && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                    {translations.compartilhada.por}{" "}
                                    {meta.user.name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  status === "concluida"
                                    ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700"
                                    : status === "atrasada"
                                      ? "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700"
                                      : status === "proxima"
                                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700"
                                }`}
                              >
                                {translations.status[status]}
                              </Badge>
                            </motion.div>
                          </div>
                          <CardDescription className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm line-clamp-2">
                            {meta.descricao}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-3 sm:space-y-4">
                          {/* Progresso */}
                          <div className="space-y-1 sm:space-y-2">
                            <div className="flex justify-between text-xs sm:text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                {translations.progresso.label}
                              </span>
                              <motion.span
                                key={progresso}
                                initial={{ scale: 1.2 }}
                                animate={{ scale: 1 }}
                                className="font-medium text-gray-900 dark:text-white"
                              >
                                {progresso.toFixed(1)}%
                              </motion.span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 sm:h-2 overflow-hidden">
                              <motion.div
                                className="h-1.5 sm:h-2 rounded-full"
                                style={{
                                  backgroundColor: meta.cor,
                                }}
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${Math.min(progresso, 100)}%`,
                                }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                              />
                            </div>
                            <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              <span className="truncate">
                                {formatarMoeda(meta.valorAtual)}
                              </span>
                              <span className="truncate">
                                {formatarMoeda(meta.valorAlvo)}
                              </span>
                            </div>
                          </div>

                          {/* Informações */}
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 gap-1 sm:gap-0">
                            <motion.div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>{formatarData(meta.dataAlvo)}</span>
                            </motion.div>
                            <motion.span
                              key={diasRestantes}
                              initial={{ scale: 1.1 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              {diasRestantes === 1
                                ? translations.mensagens.diasRestantes(1)
                                : translations.mensagens.diasRestantes(
                                    diasRestantes,
                                  )}
                            </motion.span>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Badge
                                variant="outline"
                                className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700 text-xs w-fit"
                              >
                                {meta.categoria}
                              </Badge>
                            </motion.div>

                            {/* Ações */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                              {mostrarInputValor === meta.id ? (
                                <motion.div
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-1"
                                >
                                  <div className="relative">
                                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-xs">
                                      {currencySymbol}
                                    </span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0.01"
                                      value={valorAdicional}
                                      onChange={(e) =>
                                        setValorAdicional(e.target.value)
                                      }
                                      className="w-16 sm:w-20 h-7 bg-white dark:bg-gray-800 border-0 text-gray-900 dark:text-white text-xs sm:text-sm pl-6 pr-2 focus:ring-0 focus:outline-none"
                                      placeholder="0,00"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          adicionarValorCustomizado(meta.id);
                                        } else if (e.key === "Escape") {
                                          setMostrarInputValor(null);
                                          setValorAdicional("100");
                                        }
                                      }}
                                    />
                                  </div>
                                  <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        adicionarValorCustomizado(meta.id)
                                      }
                                      className="h-7 w-7 p-0 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-md transition-all"
                                    >
                                      <svg
                                        className="w-3 h-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </Button>
                                  </motion.div>
                                  <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setMostrarInputValor(null);
                                        setValorAdicional("100");
                                      }}
                                      className="h-7 w-7 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-all"
                                    >
                                      <svg
                                        className="w-3 h-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </Button>
                                  </motion.div>
                                </motion.div>
                              ) : (
                                <>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <motion.div
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                        >
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              setMostrarInputValor(meta.id)
                                            }
                                            disabled={progresso >= 100}
                                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
                                          >
                                            <span className="text-xs sm:text-sm">
                                              +
                                            </span>
                                          </Button>
                                        </motion.div>
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-gray-900 dark:bg-gray-800 text-white dark:text-white border-gray-700 text-xs">
                                        <p>
                                          {translations.tooltips.adicionarValor}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  {usuarioAtualEhDono && (
                                    <>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <motion.div
                                              whileHover={{ scale: 1.1 }}
                                              whileTap={{ scale: 0.9 }}
                                            >
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => startEdit(meta)}
                                                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
                                              >
                                                <Edit3 className="h-3 w-3 sm:h-3 sm:w-3" />
                                              </Button>
                                            </motion.div>
                                          </TooltipTrigger>
                                          <TooltipContent className="bg-gray-900 dark:bg-gray-800 text-white dark:text-white border-gray-700 text-xs">
                                            <p>
                                              {translations.tooltips.editarMeta}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Dialog
                                              open={dialogAberto === meta.id}
                                              onOpenChange={(open) =>
                                                setDialogAberto(
                                                  open ? meta.id : null,
                                                )
                                              }
                                            >
                                              <DialogTrigger asChild>
                                                <motion.div
                                                  whileHover={{ scale: 1.1 }}
                                                  whileTap={{ scale: 0.9 }}
                                                >
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50"
                                                  >
                                                    <Trash2 className="h-3 w-3 sm:h-3 sm:w-3" />
                                                  </Button>
                                                </motion.div>
                                              </DialogTrigger>
                                              <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white w-[90vw] sm:max-w-md">
                                                <DialogHeader>
                                                  <DialogTitle className="text-gray-900 dark:text-white text-lg">
                                                    {
                                                      translations.confirmacao
                                                        .titulo
                                                    }
                                                  </DialogTitle>
                                                  <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
                                                    {translations.confirmacao.descricao.replace(
                                                      "{{titulo}}",
                                                      meta.titulo,
                                                    )}
                                                  </DialogDescription>
                                                </DialogHeader>
                                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
                                                  <Button
                                                    variant="outline"
                                                    onClick={() =>
                                                      setDialogAberto(null)
                                                    }
                                                    className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 text-sm"
                                                  >
                                                    {
                                                      translations.botoes
                                                        .cancelar
                                                    }
                                                  </Button>
                                                  <Button
                                                    variant="destructive"
                                                    onClick={() =>
                                                      excluirMeta(meta.id)
                                                    }
                                                    disabled={
                                                      excluindo === meta.id
                                                    }
                                                    className="text-sm"
                                                  >
                                                    {excluindo === meta.id
                                                      ? translations.estados
                                                          .excluindo
                                                      : translations.botoes
                                                          .confirmar}
                                                  </Button>
                                                </div>
                                              </DialogContent>
                                            </Dialog>
                                          </TooltipTrigger>
                                          <TooltipContent className="bg-gray-900 dark:bg-gray-800 text-white dark:text-white border-gray-700 text-xs">
                                            <p>
                                              {
                                                translations.tooltips
                                                  .excluirMeta
                                              }
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Seção de Colaboradores */}
                          {(usuarioAtualEhDono ||
                            (meta.ColaboradorMeta &&
                              meta.ColaboradorMeta.length > 0)) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              transition={{ duration: 0.3 }}
                              className="pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-800"
                            >
                              {podeTerColaboradores() ? (
                                <ColaboradoresMeta
                                  metaId={meta.id}
                                  colaboradores={meta.ColaboradorMeta || []}
                                  convites={meta.ConviteMeta || []}
                                  usuarioAtualEhDono={usuarioAtualEhDono}
                                  onColaboradoresAtualizados={() =>
                                    handleColaboradoresAtualizados(meta.id)
                                  }
                                />
                              ) : (
                                <div className="text-center py-2">
                                  <div className="flex items-center justify-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                                    <Crown className="h-3 w-3" />
                                    <span className="font-medium">
                                      {translations.avisos.colaboradores.titulo}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {
                                      translations.avisos.colaboradores
                                        .descricao
                                    }
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="mt-2 h-6 text-xs"
                                    onClick={() =>
                                      router.push(
                                        `/${currentLang}/dashboard/perfil`,
                                      )
                                    }
                                  >
                                    <Crown className="h-3 w-3 mr-1" />
                                    {
                                      translations.avisos.colaboradores
                                        .conhecerPlanos
                                    }
                                  </Button>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dialog open={!!fotoAmpliada} onOpenChange={() => setFotoAmpliada(null)}>
        <DialogContent className="max-w-4xl bg-black border-0 p-0 overflow-hidden w-[95vw] sm:w-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <img
              src={fotoAmpliada || ""}
              alt="Capa da meta"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </motion.div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
