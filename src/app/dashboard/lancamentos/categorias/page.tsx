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

interface Categoria {
  id: string;
  nome: string;
  tipo: string;
  cor: string;
  icone: string;
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
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

  const [formData, setFormData] = useState({
    nome: "",
    tipo: "DESPESA",
    cor: "#3B82F6",
    icone: "Tag", // valor padrão
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

    const url = editingCategoria
      ? `/api/categorias/${editingCategoria.id}` // 👈 edição
      : "/api/categorias"; // 👈 criação

    const method = editingCategoria ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setFormData({
        nome: "",
        tipo: "DESPESA",
        cor: "#3B82F6",
        icone: "Tag",
      });
      setEditingCategoria(null);
      carregarCategorias();
      setIsSheetOpen(false); // 👈 fecha o modal
      toast.success(
        editingCategoria
          ? "Categoria atualizada com sucesso!"
          : "Categoria criada com sucesso!"
      );
    } else {
      toast.error("Erro ao salvar categoria.");
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/categorias/${id}`, { method: "DELETE" });

    if (res.ok) {
      carregarCategorias();
      toast.success("Categoria deletada com sucesso!");
    } else {
      toast.error("Erro ao deletar categoria.");
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
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando categorias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Tag className="w-6 h-6 text-white" />
              </div>
              Categorias
            </h1>
            <p className="text-muted-foreground mt-2">
              Organize suas receitas e despesas por categorias
            </p>
          </div>

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                className="gap-2"
                onClick={() => {
                  setEditingCategoria(null);
                  setFormData({
                    nome: "",
                    tipo: "DESPESA",
                    cor: "#3B82F6",
                    icone: "Tag",
                  });
                  setIsSheetOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
                Nova Categoria
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>
                  {editingCategoria ? "Editar Categoria" : "Nova Categoria"}
                </SheetTitle>
                <SheetDescription>
                  {editingCategoria
                    ? "Atualize os dados da categoria"
                    : "Crie uma nova categoria para organizar seus lançamentos"}
                </SheetDescription>
              </SheetHeader>

              <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Categoria</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    placeholder="Ex: Alimentação, Transporte, Salário..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: "DESPESA" | "RECEITA") =>
                      setFormData({ ...formData, tipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DESPESA">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-red-500" />
                          Despesa
                        </div>
                      </SelectItem>
                      <SelectItem value="RECEITA">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          Receita
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Cor de Identificação</Label>

                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg border shadow-sm"
                      style={{ backgroundColor: formData.cor }}
                    />
                    <Input
                      type="color"
                      value={formData.cor}
                      onChange={(e) =>
                        setFormData({ ...formData, cor: e.target.value })
                      }
                      className="w-20 h-10 p-1"
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
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-muted"
                        }`}
                        style={{ backgroundColor: cor }}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icone">Ícone</Label>
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
                          className={`p-2 border rounded-lg flex items-center justify-center hover:bg-accent transition-all ${
                            formData.icone === iconName
                              ? "border-primary bg-accent"
                              : "border-muted"
                          }`}
                        >
                          <IconComponent className="w-5 h-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingCategoria ? "Atualizar" : "Criar"} Categoria
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
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </SheetContent>
          </Sheet>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total
                  </p>
                  <p className="text-2xl font-bold">{categorias.length}</p>
                </div>
                <Tag className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Despesas
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {categoriasPorTipo.DESPESA.length}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Receitas
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {categoriasPorTipo.RECEITA.length}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar categorias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Tabs
                value={tipoFiltro}
                onValueChange={(value) => setTipoFiltro(value as any)}
                className="w-full sm:w-auto"
              >
                <TabsList>
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="DESPESA">Despesas</TabsTrigger>
                  <TabsTrigger value="RECEITA">Receitas</TabsTrigger>
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
                <Card
                  className="group hover:shadow-lg transition-all duration-300 border-l-4"
                  style={{ borderLeftColor: categoria.cor }}
                >
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
                          <h3 className="font-semibold text-lg">
                            {categoria.nome}
                          </h3>
                          <Badge
                            variant={
                              categoria.tipo === "RECEITA"
                                ? "default"
                                : "destructive"
                            }
                            className="mt-1"
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
                                  setIsSheetOpen(true); // 👈 abre o sheet já no modo de edição
                                }}
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar categoria</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Dialog
                                open={isDialogOpen}
                                onOpenChange={setIsDialogOpen}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsDialogOpen(true)}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Excluir Categoria</DialogTitle>
                                    <DialogDescription>
                                      Tem certeza que deseja excluir a categoria
                                      "{categoria.nome}"? Esta ação não pode ser
                                      desfeita.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex gap-3 justify-end">
                                    <Button
                                      variant="outline"
                                      onClick={() => setIsDialogOpen(false)} // 👈 fecha o diálogo
                                    >
                                      Cancelar
                                    </Button>
                                    <Button
                                      variant="destructive"
                                    
                                      onClick={() => handleDelete(categoria.id)}
                                    >
                                     Confirmar
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TooltipTrigger>
                            <TooltipContent>
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
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma categoria encontrada
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || tipoFiltro !== "all"
                ? "Tente ajustar os filtros ou termos de busca"
                : "Comece criando sua primeira categoria"}
            </p>
            {!searchTerm && tipoFiltro === "all" && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Criar Primeira Categoria
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Nova Categoria</SheetTitle>
                    <SheetDescription>
                      Crie sua primeira categoria para organizar seus
                      lançamentos
                    </SheetDescription>
                  </SheetHeader>

                  <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome da Categoria</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) =>
                          setFormData({ ...formData, nome: e.target.value })
                        }
                        placeholder="Ex: Alimentação, Transporte, Salário..."
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value: "DESPESA" | "RECEITA") =>
                          setFormData({ ...formData, tipo: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DESPESA">Despesa</SelectItem>
                          <SelectItem value="RECEITA">Receita</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Cor de Identificação</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {coresPredefinidas.map((cor) => (
                          <button
                            key={cor}
                            type="button"
                            onClick={() => setFormData({ ...formData, cor })}
                            className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                              formData.cor === cor
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-muted"
                            }`}
                            style={{ backgroundColor: cor }}
                          />
                        ))}
                      </div>
                    </div>

                    <Button type="submit" className="w-full">
                      Criar Categoria
                    </Button>
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
