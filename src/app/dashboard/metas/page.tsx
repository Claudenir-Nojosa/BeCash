// app/dashboard/metas/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { MetaPessoal } from "../../../../types/dashboard";
import { UploadImage } from "@/components/shared/upload-image";
import { useSession } from "next-auth/react";

export default function MetasPage() {
  const router = useRouter();
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

  const carregarMetas = async () => {
    try {
      setCarregando(true);
      const response = await fetch("/api/dashboard/metas");

      if (!response.ok) throw new Error("Erro ao carregar metas");

      const data = await response.json();
      setMetas(data);
    } catch (error) {
      console.error("Erro ao carregar metas:", error);
      toast.error("Erro ao carregar metas");
    } finally {
      setCarregando(false);
    }
  };

  const excluirMeta = async (id: string) => {
    setExcluindo(id); // 👈 ADICIONE ESTA LINHA
    try {
      const response = await fetch(`/api/dashboard/metas/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao excluir meta");

      toast.success("Meta excluída com sucesso");
      setDialogAberto(null);
      carregarMetas();
    } catch (error) {
      console.error("Erro ao excluir meta:", error);
      toast.error("Erro ao excluir meta");
    } finally {
      setExcluindo(null); // 👈 ADICIONE ESTA LINHA
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true); // 👈 ADICIONE ESTA LINHA

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

    if (res.ok) {
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
      carregarMetas();
      setIsSheetOpen(false);
      toast.success(
        editandoMeta
          ? "Meta atualizada com sucesso!"
          : "Meta criada com sucesso!"
      );
    } else {
      toast.error("Erro ao salvar meta.");
    }

    setEnviando(false); // 👈 ADICIONE ESTA LINHA
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
      imagemUrl: meta.imagemUrl || "", // 👈 NOVO
    });
    setIsSheetOpen(true);
  };

  const adicionarValorCustomizado = async (id: string) => {
    if (!valorAdicional || parseFloat(valorAdicional) <= 0) {
      toast.error("Digite um valor válido");
      return;
    }

    try {
      const meta = metas.find((m) => m.id === id);
      if (!meta) return;

      const novoValor = meta.valorAtual + parseFloat(valorAdicional);
      const response = await fetch(`/api/dashboard/metas/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          valorAtual: novoValor,
        }),
      });

      if (!response.ok) throw new Error("Erro ao atualizar meta");

      toast.success(
        `Valor de R$ ${parseFloat(valorAdicional).toFixed(2)} adicionado com sucesso`
      );
      setMostrarInputValor(null);
      setValorAdicional("100");
      carregarMetas();
    } catch (error) {
      console.error("Erro ao adicionar valor:", error);
      toast.error("Erro ao adicionar valor");
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

  const session = useSession();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-white">Metas Pessoais</h1>
              <p className="text-gray-300">
                Gerencie seus objetivos financeiros
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant={"outline"}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
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
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Meta
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-gray-900 border-gray-800 text-white overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-white">
                    {editandoMeta ? "Editar Meta" : "Nova Meta"}
                  </SheetTitle>
                  <SheetDescription className="text-gray-400">
                    {editandoMeta
                      ? "Atualize os dados da meta"
                      : "Crie uma nova meta financeira"}
                  </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="titulo" className="text-white">
                      Título
                    </Label>
                    <Input
                      id="titulo"
                      value={formData.titulo}
                      onChange={(e) =>
                        setFormData({ ...formData, titulo: e.target.value })
                      }
                      placeholder="Ex: Comprar um carro, Viagem..."
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao" className="text-white">
                      Descrição
                    </Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData({ ...formData, descricao: e.target.value })
                      }
                      placeholder="Descrição detalhada da meta..."
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="valorAlvo" className="text-white">
                        Valor Alvo
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
                        className="bg-gray-800 border-gray-700 text-white"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="valorAtual" className="text-white">
                        Valor Atual
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
                        className="bg-gray-800 border-gray-700 text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataAlvo" className="text-white">
                      Data Alvo
                    </Label>
                    <Input
                      id="dataAlvo"
                      type="date"
                      value={formData.dataAlvo}
                      onChange={(e) =>
                        setFormData({ ...formData, dataAlvo: e.target.value })
                      }
                      className="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoria" className="text-white">
                      Categoria
                    </Label>
                    <Input
                      id="categoria"
                      value={formData.categoria}
                      onChange={(e) =>
                        setFormData({ ...formData, categoria: e.target.value })
                      }
                      placeholder="Ex: Veículo, Casa, Educação..."
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-white">Cor</Label>
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-lg border border-gray-700 shadow-sm"
                        style={{ backgroundColor: formData.cor }}
                      />
                      <Input
                        type="color"
                        value={formData.cor}
                        onChange={(e) =>
                          setFormData({ ...formData, cor: e.target.value })
                        }
                        className="w-20 h-10 p-1 bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {coresPredefinidas.map((cor) => (
                        <button
                          key={cor}
                          type="button"
                          onClick={() => setFormData({ ...formData, cor })}
                          className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                            formData.cor === cor
                              ? "border-white ring-2 ring-white/20"
                              : "border-gray-700"
                          }`}
                          style={{ backgroundColor: cor }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Ícone</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {iconesPredefinidos.map((icone) => (
                        <button
                          key={icone}
                          type="button"
                          onClick={() => setFormData({ ...formData, icone })}
                          className={`p-2 border rounded-lg flex items-center justify-center hover:bg-gray-800 transition-all text-2xl ${
                            formData.icone === icone
                              ? "border-white bg-gray-800"
                              : "border-gray-700"
                          }`}
                        >
                          {icone}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <UploadImage
                      onImageChange={(url) =>
                        setFormData({ ...formData, imagemUrl: url || "" })
                      }
                      currentImage={formData.imagemUrl}
                      userId={session?.data?.user?.id || ""}
                      metaId={editandoMeta?.id || "new"}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      className="flex-1 bg-white text-gray-900 hover:bg-gray-100"
                      disabled={enviando}
                    >
                      {enviando
                        ? editandoMeta
                          ? "Atualizando..."
                          : "Criando..."
                        : editandoMeta
                          ? "Atualizar"
                          : "Criar Meta"}
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
                          setIsSheetOpen(false); // 👈 ADICIONE ESTA LINHA PARA FECHAR O SHEET
                        }}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </form>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Grid de Metas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {carregando ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4 bg-gray-800" />
                  <Skeleton className="h-4 w-full mb-2 bg-gray-800" />
                  <Skeleton className="h-4 w-2/3 mb-4 bg-gray-800" />
                  <Skeleton className="h-2 w-full mb-2 bg-gray-800" />
                  <Skeleton className="h-4 w-1/2 bg-gray-800" />
                </CardContent>
              </Card>
            ))
          ) : metas.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-lg font-medium text-white mb-2">
                Nenhuma meta definida
              </h3>
              <p className="text-gray-400 mb-6">
                Comece criando sua primeira meta financeira
              </p>
              <Button
                onClick={() => setIsSheetOpen(true)}
                className="bg-white text-gray-900 hover:bg-gray-100"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Meta
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

              return (
                <Card
                  key={meta.id}
                  className="bg-gray-900 border-gray-800 group hover:border-gray-700 transition-colors"
                >
                  {" "}
                  {/* Imagem de capa */}
                  {meta.imagemUrl && (
                    <div
                      className="w-full h-32 overflow-hidden cursor-pointer"
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
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{meta.icone}</span>
                        <CardTitle className="text-lg text-white">
                          {meta.titulo}
                        </CardTitle>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          status === "concluida"
                            ? "bg-green-900/50 text-green-300 border-green-700"
                            : status === "atrasada"
                              ? "bg-red-900/50 text-red-300 border-red-700"
                              : status === "proxima"
                                ? "bg-blue-900/50 text-blue-300 border-blue-700"
                                : "bg-gray-800 text-gray-300 border-gray-700"
                        }
                      >
                        {status === "concluida"
                          ? "Concluída"
                          : status === "atrasada"
                            ? "Atrasada"
                            : status === "proxima"
                              ? "Próxima"
                              : "Em andamento"}
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-400">
                      {meta.descricao}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progresso */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Progresso</span>
                        <span className="font-medium text-white">
                          {progresso.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(progresso, 100)}%`,
                            backgroundColor: meta.cor,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>{formatarMoeda(meta.valorAtual)}</span>
                        <span>{formatarMoeda(meta.valorAlvo)}</span>
                      </div>
                    </div>

                    {/* Informações */}
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatarData(meta.dataAlvo)}
                      </div>
                      <span>{diasRestantes} dias</span>
                    </div>

                    {/* Categoria e Ações */}
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="bg-gray-800 text-gray-300 border-gray-700"
                      >
                        {meta.categoria}
                      </Badge>

                      {/* Ações */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {mostrarInputValor === meta.id ? (
                          // Modo de edição de valor - mostra apenas input e botões de confirmação/cancelar
                          <div className="flex items-center gap-1 bg-gray-800 rounded-lg border border-gray-700 p-1">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">
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
                                className="w-20 h-7 bg-gray-800 border-0 text-white text-xs pl-6 pr-2 focus:ring-0 focus:outline-none"
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
                              className="h-7 w-7 p-0 text-green-400 hover:text-green-300 hover:bg-green-900/50 rounded-md transition-all"
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
                              className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/50 rounded-md transition-all"
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
                          // Modo normal - mostra apenas o botão +, editar e excluir
                          <>
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
                                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
                                  >
                                    <span className="text-sm">+</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-800 text-white border-gray-700">
                                  <p>Adicionar valor</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {/* Botões de editar e excluir */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEdit(meta)}
                                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-800 text-white border-gray-700">
                                  <p>Editar meta</p>
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
                                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/50"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-gray-900 border-gray-800 text-white">
                                      <DialogHeader>
                                        <DialogTitle className="text-white">
                                          Excluir Meta
                                        </DialogTitle>
                                        <DialogDescription className="text-gray-400">
                                          Tem certeza que deseja excluir a meta
                                          "{meta.titulo}"? Esta ação não pode
                                          ser desfeita.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="flex gap-3 justify-end">
                                        <Button
                                          variant="outline"
                                          onClick={() => setDialogAberto(null)}
                                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                                        >
                                          Cancelar
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          onClick={() => excluirMeta(meta.id)}
                                          disabled={excluindo === meta.id} // 👈 ADICIONE ESTA LINHA
                                        >
                                          {excluindo === meta.id
                                            ? "Excluindo..."
                                            : "Confirmar"}
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-800 text-white border-gray-700">
                                  <p>Excluir meta</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
      <Dialog open={!!fotoAmpliada} onOpenChange={() => setFotoAmpliada(null)}>
        <DialogContent className="max-w-4xl bg-black border-0 p-0 overflow-hidden">
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
