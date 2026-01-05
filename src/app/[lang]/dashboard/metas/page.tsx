// app/dashboard/metas/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { MetaPessoal } from "../../../../../types/dashboard";
import { UploadImage } from "@/components/shared/upload-image";
import { useSession } from "next-auth/react";
import { ColaboradoresMeta } from "@/components/shared/ColaboradoresMeta";
import { Loading } from "@/components/ui/loading-barrinhas";

export default function MetasPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useTranslation("metas");
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
    null
  );
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
  }, []);

  // Adicione esta função para carregar colaboradores de uma meta específica
  const carregarColaboradoresMeta = async (metaId: string) => {
    try {
      setColaboradoresCarregando((prev) => new Set(prev).add(metaId));

      const response = await fetch(`/api/metas/${metaId}/colaboradores`);
      if (response.ok) {
        const data = await response.json();

        // Atualizar a meta específica com os colaboradores
        setMetas((prev) =>
          prev.map((meta) =>
            meta.id === metaId
              ? {
                  ...meta,
                  ColaboradorMeta: data.colaboradores,
                  ConviteMeta: data.convites,
                }
              : meta
          )
        );
      }
    } catch (error) {
      console.error(t("erros.carregarColaboradores"), error);
      toast.error(t("erros.carregarColaboradores"));
    } finally {
      setColaboradoresCarregando((prev) => {
        const newSet = new Set(prev);
        newSet.delete(metaId);
        return newSet;
      });
    }
  };

  // Adicione esta função para quando os colaboradores forem atualizados
  const handleColaboradoresAtualizados = (metaId: string) => {
    carregarColaboradoresMeta(metaId);
  };

  const carregarMetas = async () => {
    try {
      setCarregando(true);
      const response = await fetch("/api/dashboard/metas");

      if (!response.ok) throw new Error(t("erros.carregarMetas"));

      const data = await response.json();
      setMetas(data);
    } catch (error) {
      console.error(t("erros.carregarMetas"), error);
      toast.error(t("erros.carregarMetas"));
    } finally {
      setCarregando(false);
    }
  };

  const excluirMeta = async (id: string) => {
    setExcluindo(id);

    // Salva a meta para possível rollback
    const metaParaExcluir = metas.find((meta) => meta.id === id);

    try {
      // Exclusão otimista - remove da UI imediatamente
      setMetas((prev) => prev.filter((meta) => meta.id !== id));
      setDialogAberto(null);

      // Faz a exclusão real no banco
      const response = await fetch(`/api/dashboard/metas/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error(t("erros.excluirMeta"));

      toast.success(t("mensagens.excluida"));
    } catch (error) {
      console.error(t("erros.excluirMeta"), error);

      // Revert se der erro - adiciona a meta de volta
      if (metaParaExcluir) {
        setMetas((prev) => [...prev, metaParaExcluir]);
      }

      toast.error(t("erros.excluirMeta"));
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
        throw new Error(errorData.error || t("erros.salvarMeta"));
      }

      const metaSalva = await res.json();

      if (editandoMeta) {
        // Atualização otimista
        setMetas((prev) =>
          prev.map((meta) => (meta.id === editandoMeta.id ? metaSalva : meta))
        );
        toast.success(t("mensagens.atualizada"));
      } else {
        // Criação otimista
        setMetas((prev) => [...prev, metaSalva]);
        toast.success(t("mensagens.criada"));
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
      console.error(t("erros.salvarMeta"), error);
      toast.error(t("erros.salvarMeta"));
      // Em caso de erro, recarrega os dados do servidor
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
      toast.error(t("erros.valorInvalido"));
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

      if (!response.ok) throw new Error(t("erros.contribuirMeta"));

      toast.success(
        t("mensagens.valorAdicionado", {
          valor: parseFloat(valorAdicional).toFixed(2),
        })
      );
      setMostrarInputValor(null);
      setValorAdicional("100");
      carregarMetas();
    } catch (error) {
      console.error(t("erros.adicionarValor"), error);
      toast.error(t("erros.adicionarValor"));
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
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

  // Função para abrir o diálogo de contribuição
  const abrirDialogContribuicao = (metaId: string, metaTitulo: string) => {
    setMetaParaContribuir({ id: metaId, titulo: metaTitulo });
    setDialogContribuicaoAberto(true);
  };

  // Função para confirmar a contribuição
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
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("erros.contribuirMeta"));
      }

      const result = await response.json();

      toast.success(
        t("mensagens.valorAdicionado", {
          valor: parseFloat(valorParaContribuir).toFixed(2),
        })
      );

      setDialogContribuicaoAberto(false);
      setMetaParaContribuir(null);
      setValorParaContribuir("100");
      carregarMetas();
    } catch (error) {
      console.error(t("erros.contribuir"), error);
      toast.error(
        error instanceof Error ? error.message : t("erros.contribuir")
      );
    } finally {
      setCarregandoContribuicao(false);
    }
  };
  if (carregando) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {t("titulo")}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                {t("subtitulo")}
              </p>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant={"outline"}
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
                >
                  <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{t("botoes.novaMeta")}</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white overflow-y-auto w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle className="text-gray-900 dark:text-white text-lg sm:text-xl">
                    {editandoMeta
                      ? t("formulario.tituloEditar")
                      : t("formulario.tituloNovo")}
                  </SheetTitle>
                  <SheetDescription className="text-gray-600 dark:text-gray-400 text-sm">
                    {editandoMeta
                      ? t("formulario.descricaoEditar")
                      : t("formulario.descricaoNovo")}
                  </SheetDescription>
                </SheetHeader>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 sm:space-y-6 mt-4 sm:mt-6"
                >
                  <div className="space-y-1 sm:space-y-2">
                    <Label
                      htmlFor="titulo"
                      className="text-gray-900 dark:text-white text-sm sm:text-base"
                    >
                      {t("formulario.tituloLabel")}
                    </Label>
                    <Input
                      id="titulo"
                      value={formData.titulo}
                      onChange={(e) =>
                        setFormData({ ...formData, titulo: e.target.value })
                      }
                      placeholder={t("formulario.tituloPlaceholder")}
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 text-sm sm:text-base"
                      required
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label
                      htmlFor="descricao"
                      className="text-gray-900 dark:text-white text-sm sm:text-base"
                    >
                      {t("formulario.descricaoLabel")}
                    </Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData({ ...formData, descricao: e.target.value })
                      }
                      placeholder={t("formulario.descricaoPlaceholder")}
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 text-sm sm:text-base"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1 sm:space-y-2">
                      <Label
                        htmlFor="valorAlvo"
                        className="text-gray-900 dark:text-white text-sm sm:text-base"
                      >
                        {t("formulario.valorAlvoLabel")}
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
                        {t("formulario.valorAtualLabel")}
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
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label
                      htmlFor="dataAlvo"
                      className="text-gray-900 dark:text-white text-sm sm:text-base"
                    >
                      {t("formulario.dataAlvoLabel")}
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
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label
                      htmlFor="categoria"
                      className="text-gray-900 dark:text-white text-sm sm:text-base"
                    >
                      {t("formulario.categoriaLabel")}
                    </Label>
                    <Input
                      id="categoria"
                      value={formData.categoria}
                      onChange={(e) =>
                        setFormData({ ...formData, categoria: e.target.value })
                      }
                      placeholder={t("formulario.categoriaPlaceholder")}
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 text-sm sm:text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-gray-900 dark:text-white text-sm sm:text-base">
                      {t("formulario.corLabel")}
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
                      {coresPredefinidas.map((cor) => (
                        <button
                          key={cor}
                          type="button"
                          onClick={() => setFormData({ ...formData, cor })}
                          className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                            formData.cor === cor
                              ? "border-gray-900 dark:border-white ring-2 ring-gray-900/20 dark:ring-white/20"
                              : "border-gray-300 dark:border-gray-700"
                          }`}
                          style={{ backgroundColor: cor }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label className="text-gray-900 dark:text-white text-sm sm:text-base">
                      {t("formulario.iconeLabel")}
                    </Label>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-1 sm:gap-2">
                      {iconesPredefinidos.map((icone) => (
                        <button
                          key={icone}
                          type="button"
                          onClick={() => setFormData({ ...formData, icone })}
                          className={`p-1 sm:p-2 border rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-xl sm:text-2xl ${
                            formData.icone === icone
                              ? "border-gray-900 dark:border-white bg-gray-100 dark:bg-gray-800"
                              : "border-gray-300 dark:border-gray-700"
                          }`}
                        >
                          {icone}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <UploadImage
                      onImageChange={(url) =>
                        setFormData({ ...formData, imagemUrl: url || "" })
                      }
                      currentImage={formData.imagemUrl}
                      userId={session?.user?.id || ""}
                      metaId={editandoMeta?.id || "new"}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
                    <Button
                      type="submit"
                      className="flex-1 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-sm sm:text-base"
                      disabled={enviando}
                    >
                      {enviando
                        ? editandoMeta
                          ? t("estados.atualizando")
                          : t("estados.criando")
                        : editandoMeta
                          ? t("botoes.atualizar")
                          : t("botoes.criarMeta")}
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
                        {t("botoes.cancelar")}
                      </Button>
                    )}
                  </div>
                </form>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Grid de Metas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {metas.length === 0 ? (
            <div className="col-span-full text-center py-8 sm:py-12">
              <Trophy className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-gray-400 dark:text-gray-600" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-1 sm:mb-2">
                {t("mensagens.nenhumaMeta")}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 px-4">
                {t("mensagens.comeceCriando")}
              </p>
              <Button
                onClick={() => setIsSheetOpen(true)}
                className="bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-sm"
              >
                <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                {t("botoes.criarPrimeiraMeta")}
              </Button>
            </div>
          ) : (
            metas.map((meta) => {
              const progresso = calcularProgresso(meta);
              const status = obterStatusMeta(progresso, meta.dataAlvo);
              const diasRestantes = Math.ceil(
                (new Date(meta.dataAlvo).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              );

              // 👇 ADICIONE ESTA LINHA para verificar se o usuário atual é o dono
              const usuarioAtualEhDono = meta.userId === session?.user?.id;

              return (
                <Card
                  key={meta.id}
                  className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm group hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                >
                  {/* Imagem de capa */}
                  {meta.imagemUrl && (
                    <div
                      className="w-full h-28 sm:h-32 overflow-hidden cursor-pointer"
                      onClick={() => setFotoAmpliada(meta.imagemUrl!)}
                    >
                      <img
                        src={meta.imagemUrl}
                        alt={meta.titulo}
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg sm:text-xl">{meta.icone}</span>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-white truncate">
                            {meta.titulo}
                          </CardTitle>
                          {meta.ehCompartilhada && meta.user && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {t("compartilhada.por")} {meta.user.name}
                            </p>
                          )}
                        </div>
                      </div>
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
                        {t(`status.${status}`)}
                      </Badge>
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
                          {t("progresso.label")}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {progresso.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 sm:h-2">
                        <div
                          className="h-1.5 sm:h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(progresso, 100)}%`,
                            backgroundColor: meta.cor,
                          }}
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
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{formatarData(meta.dataAlvo)}</span>
                      </div>
                      <span>
                        {t("diasRestantes", { count: diasRestantes })}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                      <Badge
                        variant="outline"
                        className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700 text-xs w-fit"
                      >
                        {meta.categoria}
                      </Badge>

                      {/* Ações */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        {mostrarInputValor === meta.id ? (
                          // Modo de edição de valor - VISÍVEL PARA DONO E COLABORADORES
                          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-1">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-xs">
                                R$
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => adicionarValorCustomizado(meta.id)}
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
                          </div>
                        ) : (
                          // Modo normal - botões de ação
                          <>
                            {/* Botão + - VISÍVEL PARA DONO E COLABORADORES */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
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
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-900 dark:bg-gray-800 text-white dark:text-white border-gray-700 text-xs">
                                  <p>{t("tooltips.adicionarValor")}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {/* Botões de Editar e Excluir - APENAS PARA DONO */}
                            {usuarioAtualEhDono && (
                              <>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => startEdit(meta)}
                                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
                                      >
                                        <Edit3 className="h-3 w-3 sm:h-3 sm:w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-gray-900 dark:bg-gray-800 text-white dark:text-white border-gray-700 text-xs">
                                      <p>{t("tooltips.editarMeta")}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Dialog
                                        open={dialogAberto === meta.id}
                                        onOpenChange={(open) =>
                                          setDialogAberto(open ? meta.id : null)
                                        }
                                      >
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50"
                                          >
                                            <Trash2 className="h-3 w-3 sm:h-3 sm:w-3" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white w-[90vw] sm:max-w-md">
                                          <DialogHeader>
                                            <DialogTitle className="text-gray-900 dark:text-white text-lg">
                                              {t("confirmacao.titulo")}
                                            </DialogTitle>
                                            <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
                                              {t("confirmacao.descricao", {
                                                titulo: meta.titulo,
                                              })}
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
                                              {t("botoes.cancelar")}
                                            </Button>
                                            <Button
                                              variant="destructive"
                                              onClick={() =>
                                                excluirMeta(meta.id)
                                              }
                                              disabled={excluindo === meta.id}
                                              className="text-sm"
                                            >
                                              {excluindo === meta.id
                                                ? t("estados.excluindo")
                                                : t("botoes.confirmar")}
                                            </Button>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-gray-900 dark:bg-gray-800 text-white dark:text-white border-gray-700 text-xs">
                                      <p>{t("tooltips.excluirMeta")}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* 👇 SEÇÃO DE COLABORADORES - CORRIGIDA ESTRUTURALMENTE */}
                    {(usuarioAtualEhDono ||
                      (meta.ColaboradorMeta &&
                        meta.ColaboradorMeta.length > 0)) && (
                      <div className="pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-800">
                        <ColaboradoresMeta
                          metaId={meta.id}
                          colaboradores={meta.ColaboradorMeta || []}
                          convites={meta.ConviteMeta || []}
                          usuarioAtualEhDono={usuarioAtualEhDono}
                          onColaboradoresAtualizados={() =>
                            handleColaboradoresAtualizados(meta.id)
                          }
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <Dialog open={!!fotoAmpliada} onOpenChange={() => setFotoAmpliada(null)}>
        <DialogContent className="max-w-4xl bg-black border-0 p-0 overflow-hidden w-[95vw] sm:w-auto">
          <div className="relative">
            <img
              src={fotoAmpliada || ""}
              alt="Capa da meta"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
