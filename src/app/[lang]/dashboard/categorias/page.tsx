"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Tag,
  TrendingUp,
  TrendingDown,
  Edit3,
  Trash2,
  Palette,
  Search,
  Filter,
  Sparkles,
  Trash,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useRouter } from "next/navigation";

interface Categoria {
  id: string;
  nome: string;
  tipo: string;
  cor: string;
  icone: string;
}

export default function CategoriasPage() {
  const router = useRouter();
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<"all" | "DESPESA" | "RECEITA">(
    "all"
  );
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(
    null
  );
  const [dialogAberto, setDialogAberto] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "DESPESA",
    cor: "#3B82F6",
    icone: "Tag",
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

  useEffect(() => {
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/categorias");
      if (res.ok) {
        const data = await res.json();
        setCategorias(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      toast.error("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setEnviando(true);

  try {
    const url = editingCategoria
      ? `/api/categorias/${editingCategoria.id}`
      : "/api/categorias";

    const method = editingCategoria ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!res.ok) throw new Error("Erro ao salvar categoria");

    const categoriaSalva = await res.json();

    if (editingCategoria) {
      // Atualização otimista
      setCategorias(prev => 
        prev.map(cat => 
          cat.id === editingCategoria.id ? categoriaSalva : cat
        )
      );
      toast.success("Categoria atualizada com sucesso!");
    } else {
      // Criação otimista
      setCategorias(prev => [...prev, categoriaSalva]);
      toast.success("Categoria criada com sucesso!");
    }

    setFormData({
      nome: "",
      tipo: "DESPESA",
      cor: "#3B82F6",
      icone: "Tag",
    });
    setEditingCategoria(null);
    setIsSheetOpen(false);

  } catch (error) {
    console.error("Erro ao salvar categoria:", error);
    toast.error("Erro ao salvar categoria.");
    // Em caso de erro, recarrega os dados do servidor
    carregarCategorias();
  } finally {
    setEnviando(false);
  }
};

const handleDelete = async (id: string) => {
  setExcluindo(id);
  
  // Declara a variável fora do try para poder usar no catch
  const categoriaParaExcluir = categorias.find(cat => cat.id === id);
  
  try {
    // Exclusão otimista - remove da UI imediatamente
    setCategorias(prev => prev.filter(cat => cat.id !== id));
    setDialogAberto(null);
    
    // Faz a exclusão real no banco
    const res = await fetch(`/api/categorias/${id}`, { method: "DELETE" });

    if (!res.ok) {
      throw new Error("Erro ao deletar categoria");
    }
    
    toast.success("Categoria deletada com sucesso!");
  } catch (error) {
    console.error("Erro ao deletar categoria:", error);
    
    // Revert se der erro - adiciona a categoria de volta
    if (categoriaParaExcluir) {
      setCategorias(prev => [...prev, categoriaParaExcluir]);
    }
    
    toast.error("Erro ao deletar categoria.");
  } finally {
    setExcluindo(null);
  }
};

  const startEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setFormData({
      nome: categoria.nome,
      tipo: categoria.tipo,
      cor: categoria.cor || "#3B82F6",
      icone: categoria.icone || "Tag",
    });
  };

  const categoriasFiltradas = categorias.filter((categoria) => {
    if (
      searchTerm &&
      !categoria.nome.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    if (tipoFiltro !== "all" && categoria.tipo !== tipoFiltro) {
      return false;
    }
    return true;
  });

  const categoriasPorTipo = {
    DESPESA: categoriasFiltradas.filter((c) => c.tipo === "DESPESA"),
    RECEITA: categoriasFiltradas.filter((c) => c.tipo === "RECEITA"),
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400">Carregando categorias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-white">Categorias</h1>
              <p className="text-gray-300">
                Organize suas receitas e despesas por categorias
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant={"outline"}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                  onClick={() => {
                    setEditingCategoria(null);
                    setFormData({
                      nome: "",
                      tipo: "DESPESA",
                      cor: "#3B82F6",
                      icone: "Tag",
                    });
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Nova Categoria
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-gray-900 border-gray-800 text-white">
                <SheetHeader>
                  <SheetTitle className="text-white">
                    {editingCategoria ? "Editar Categoria" : "Nova Categoria"}
                  </SheetTitle>
                  <SheetDescription className="text-gray-400">
                    {editingCategoria
                      ? "Atualize os dados da categoria"
                      : "Crie uma nova categoria para organizar seus lançamentos"}
                  </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-white">
                      Nome da Categoria
                    </Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({ ...formData, nome: e.target.value })
                      }
                      placeholder="Ex: Alimentação, Transporte, Salário..."
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo" className="text-white">
                      Tipo
                    </Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value: "DESPESA" | "RECEITA") =>
                        setFormData({ ...formData, tipo: value })
                      }
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        <SelectItem value="DESPESA">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-red-400" />
                            Despesa
                          </div>
                        </SelectItem>
                        <SelectItem value="RECEITA">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            Receita
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-white">Cor de Identificação</Label>

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
                    <Label htmlFor="icone" className="text-white">
                      Ícone
                    </Label>
                    <div className="grid grid-cols-6 gap-2">
                      {[
                        "Tag",
                        "Utensils",
                        "ShoppingCart",
                        "Home",
                        "Car",
                        "CreditCard",
                        "Briefcase",
                        "Gift",
                        "Heart",
                        "DollarSign",
                        "Coffee",
                        "Wifi",
                      ].map((iconName) => {
                        const IconComponent = require("lucide-react")[iconName];
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, icone: iconName })
                            }
                            className={`p-2 border rounded-lg flex items-center justify-center hover:bg-gray-800 transition-all ${
                              formData.icone === iconName
                                ? "border-white bg-gray-800"
                                : "border-gray-700"
                            }`}
                          >
                            <IconComponent className="w-5 h-5 text-white" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      className="flex-1 bg-white text-gray-900 hover:bg-gray-100"
                      disabled={enviando} // 👈 ADICIONE ESTA LINHA
                    >
                      {enviando
                        ? editingCategoria
                          ? "Atualizando..."
                          : "Criando..."
                        : editingCategoria
                          ? "Atualizar"
                          : "Criar Categoria"}
                    </Button>

                    {editingCategoria && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingCategoria(null);
                          setFormData({
                            nome: "",
                            tipo: "DESPESA",
                            cor: "#3B82F6",
                            icone: "Tag",
                          });
                          setIsSheetOpen(false); // 👈 ADICIONE ESTA LINHA
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-white">
                    {categorias.length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Tag className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Despesas</p>
                  <p className="text-2xl font-bold text-red-400">
                    {categoriasPorTipo.DESPESA.length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Receitas</p>
                  <p className="text-2xl font-bold text-green-400">
                    {categoriasPorTipo.RECEITA.length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar categorias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <Tabs
                value={tipoFiltro}
                onValueChange={(value) => setTipoFiltro(value as any)}
                className="w-full sm:w-auto"
              >
                <TabsList className="bg-gray-800 border border-gray-700">
                  <TabsTrigger
                    value="all"
                    className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                  >
                    Todas
                  </TabsTrigger>
                  <TabsTrigger
                    value="DESPESA"
                    className="text-gray-300 data-[state=active]:bg-red-600 data-[state=active]:text-white"
                  >
                    Despesas
                  </TabsTrigger>
                  <TabsTrigger
                    value="RECEITA"
                    className="text-gray-300 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                  >
                    Receitas
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Categorias */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence>
            {categoriasFiltradas.map((categoria, index) => (
              <motion.div
                key={categoria.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gray-900 border-gray-800 group hover:border-gray-700 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                          style={{ backgroundColor: categoria.cor }}
                        >
                          {(() => {
                            try {
                              const Icon =
                                require("lucide-react")[
                                  categoria.icone || "Tag"
                                ];
                              return <Icon className="w-6 h-6 text-white" />;
                            } catch {
                              return <Tag className="w-6 h-6 text-white" />;
                            }
                          })()}
                        </div>

                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-white">
                            {categoria.nome}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`mt-1 ${
                              categoria.tipo === "RECEITA"
                                ? "bg-green-900/50 text-green-400 border-green-700"
                                : "bg-red-900/50 text-red-400 border-red-700"
                            }`}
                          >
                            {categoria.tipo === "RECEITA"
                              ? "Receita"
                              : "Despesa"}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  startEdit(categoria);
                                  setIsSheetOpen(true);
                                }}
                                className="text-gray-400 hover:text-white hover:bg-gray-800"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 text-white border-gray-700">
                              <p>Editar categoria</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {/* 👈 Agora cada diálogo tem seu próprio estado de abertura */}
                              <Dialog
                                open={dialogAberto === categoria.id}
                                onOpenChange={(open) =>
                                  setDialogAberto(open ? categoria.id : null)
                                }
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-400 hover:text-red-400 hover:bg-gray-800"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-gray-900 border-gray-800 text-white">
                                  <DialogHeader>
                                    <DialogTitle className="text-white">
                                      Excluir Categoria
                                    </DialogTitle>
                                    <DialogDescription className="text-gray-400">
                                      Tem certeza que deseja excluir a categoria
                                      "{categoria.nome}"? Esta ação não pode ser
                                      desfeita.
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
                                      onClick={() => handleDelete(categoria.id)}
                                      disabled={excluindo === categoria.id} // 👈 ADICIONE ESTA LINHA
                                    >
                                      {excluindo === categoria.id
                                        ? "Excluindo..."
                                        : "Confirmar"}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 text-white border-gray-700">
                              <p>Excluir categoria</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Estado Vazio */}
        {categoriasFiltradas.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Nenhuma categoria encontrada
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || tipoFiltro !== "all"
                ? "Tente ajustar os filtros ou termos de busca"
                : "Comece criando sua primeira categoria"}
            </p>
            {!searchTerm && tipoFiltro === "all" && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="bg-white text-gray-900 hover:bg-gray-100 gap-2">
                    <Plus className="w-4 h-4" />
                    Criar Primeira Categoria
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-gray-900 border-gray-800 text-white">
                  <SheetHeader>
                    <SheetTitle className="text-white">
                      {editingCategoria ? "Editar Categoria" : "Nova Categoria"}
                    </SheetTitle>
                    <SheetDescription className="text-gray-400">
                      {editingCategoria
                        ? "Atualize os dados da categoria"
                        : "Crie uma nova categoria para organizar seus lançamentos"}
                    </SheetDescription>
                  </SheetHeader>

                  <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="nome" className="text-white">
                        Nome da Categoria
                      </Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) =>
                          setFormData({ ...formData, nome: e.target.value })
                        }
                        placeholder="Ex: Alimentação, Transporte, Salário..."
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tipo" className="text-white">
                        Tipo
                      </Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value: "DESPESA" | "RECEITA") =>
                          setFormData({ ...formData, tipo: value })
                        }
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 text-white">
                          <SelectItem value="DESPESA">
                            <div className="flex items-center gap-2">
                              <TrendingDown className="w-4 h-4 text-red-400" />
                              Despesa
                            </div>
                          </SelectItem>
                          <SelectItem value="RECEITA">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-green-400" />
                              Receita
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-white">Cor de Identificação</Label>

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
                      <Label htmlFor="icone" className="text-white">
                        Ícone
                      </Label>
                      <div className="grid grid-cols-6 gap-2">
                        {[
                          "Tag",
                          "Utensils",
                          "ShoppingCart",
                          "Home",
                          "Car",
                          "CreditCard",
                          "Briefcase",
                          "Gift",
                          "Heart",
                          "DollarSign",
                          "Coffee",
                          "Wifi",
                        ].map((iconName) => {
                          const IconComponent =
                            require("lucide-react")[iconName];
                          return (
                            <button
                              key={iconName}
                              type="button"
                              onClick={() =>
                                setFormData({ ...formData, icone: iconName })
                              }
                              className={`p-2 border rounded-lg flex items-center justify-center hover:bg-gray-800 transition-all ${
                                formData.icone === iconName
                                  ? "border-white bg-gray-800"
                                  : "border-gray-700"
                              }`}
                            >
                              <IconComponent className="w-5 h-5 text-white" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        className="flex-1 bg-white text-gray-900 hover:bg-gray-100"
                        disabled={enviando} // 👈 ADICIONE ESTA LINHA
                      >
                        {enviando
                          ? editingCategoria
                            ? "Atualizando..."
                            : "Criando..."
                          : editingCategoria
                            ? "Atualizar"
                            : "Criar Categoria"}
                      </Button>

                      {editingCategoria && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingCategoria(null);
                            setFormData({
                              nome: "",
                              tipo: "DESPESA",
                              cor: "#3B82F6",
                              icone: "Tag",
                            });
                            setIsSheetOpen(false); // 👈 ADICIONE ESTA LINHA
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
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
