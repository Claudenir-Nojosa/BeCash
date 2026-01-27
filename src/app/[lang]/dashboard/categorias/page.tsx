"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
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
  Menu,
  X,
  Crown,
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
import { useParams, useRouter } from "next/navigation";
import { Loading } from "@/components/ui/loading-barrinhas";
import { getFallback } from "@/lib/i18nFallback";

interface Categoria {
  id: string;
  nome: string;
  tipo: string;
  cor: string;
  icone: string;
}

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

function FormularioCategoria({
  formData,
  setFormData,
  handleSubmit,
  enviando,
  editingCategoria,
  translations,
  setIsSheetOpen,
  setEditingCategoria,
}: any) {
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 sm:space-y-6 mt-4 sm:mt-6"
    >
      <div className="space-y-1 sm:space-y-2">
        <Label
          htmlFor="nome"
          className="text-gray-900 dark:text-white text-sm sm:text-base"
        >
          {translations.formulario.nomeLabel}
        </Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          placeholder={translations.formulario.nomePlaceholder}
          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm sm:text-base"
          required
        />
      </div>

      <div className="space-y-1 sm:space-y-2">
        <Label
          htmlFor="tipo"
          className="text-gray-900 dark:text-white text-sm sm:text-base"
        >
          {translations.formulario.tipoLabel}
        </Label>
        <Select
          value={formData.tipo}
          onValueChange={(value: "DESPESA" | "RECEITA") =>
            setFormData({ ...formData, tipo: value })
          }
        >
          <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm sm:text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
            <SelectItem value="DESPESA">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm sm:text-base">
                  {translations.formulario.despesa}
                </span>
              </div>
            </SelectItem>
            <SelectItem value="RECEITA">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm sm:text-base">
                  {translations.formulario.receita}
                </span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 sm:space-y-3">
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
            onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
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
        <Label
          htmlFor="icone"
          className="text-gray-900 dark:text-white text-sm sm:text-base"
        >
          {translations.formulario.iconeLabel}
        </Label>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 sm:gap-2">
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
                onClick={() => setFormData({ ...formData, icone: iconName })}
                className={`p-1 sm:p-2 border rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-all ${
                  formData.icone === iconName
                    ? "border-gray-900 dark:border-white bg-gray-100 dark:bg-gray-800"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              >
                <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900 dark:text-white" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
        <Button
          type="submit"
          className="flex-1 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-white text-sm sm:text-base"
          disabled={enviando}
        >
          {enviando
            ? editingCategoria
              ? translations.estados.atualizando
              : translations.estados.criando
            : editingCategoria
              ? translations.botoes.atualizar
              : translations.botoes.criar}
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
              setIsSheetOpen(false);
            }}
            className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 text-sm sm:text-base"
          >
            {translations.botoes.cancelar}
          </Button>
        )}
      </div>
    </form>
  );
}

export default function CategoriasPage() {
  const router = useRouter();
  const { t } = useTranslation("categorias");
  const params = useParams();
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
        return getFallback(currentLang, "Categorias", "Categories");
      case "subtitulo":
        return getFallback(
          currentLang,
          "Organize suas receitas e despesas por categorias",
          "Organize your income and expenses by categories",
        );

      // Botões
      case "botoes.novaCategoria":
        return getFallback(currentLang, "Nova Categoria", "New Category");
      case "botoes.criarPrimeira":
        return getFallback(
          currentLang,
          "Criar Primeira Categoria",
          "Create First Category",
        );
      case "botoes.atualizar":
        return getFallback(currentLang, "Atualizar", "Update");
      case "botoes.criar":
        return getFallback(currentLang, "Criar Categoria", "Create Category");
      case "botoes.cancelar":
        return getFallback(currentLang, "Cancelar", "Cancel");
      case "botoes.confirmar":
        return getFallback(currentLang, "Confirmar", "Confirm");
      case "botoes.upgrade":
        return getFallback(currentLang, "Upgrade", "Upgrade");

      // Estados
      case "estados.carregando":
        return getFallback(
          currentLang,
          "Carregando categorias...",
          "Loading categories...",
        );
      case "estados.atualizando":
        return getFallback(currentLang, "Atualizando...", "Updating...");
      case "estados.criando":
        return getFallback(currentLang, "Criando...", "Creating...");
      case "estados.excluindo":
        return getFallback(currentLang, "Excluindo...", "Deleting...");
      case "estados.limite":
        return getFallback(currentLang, "Limite", "Limit");

      // Stats
      case "stats.total":
        return getFallback(currentLang, "Total", "Total");
      case "stats.despesas":
        return getFallback(currentLang, "Despesas", "Expenses");
      case "stats.receitas":
        return getFallback(currentLang, "Receitas", "Income");

      // Filtros
      case "filtros.buscar":
        return getFallback(
          currentLang,
          "Buscar categorias...",
          "Search categories...",
        );
      case "filtros.todas":
        return getFallback(currentLang, "Todas", "All");
      case "filtros.despesas":
        return getFallback(currentLang, "Despesas", "Expenses");
      case "filtros.receitas":
        return getFallback(currentLang, "Receitas", "Income");

      // Formulário
      case "formulario.tituloNovo":
        return getFallback(currentLang, "Nova Categoria", "New Category");
      case "formulario.tituloEditar":
        return getFallback(currentLang, "Editar Categoria", "Edit Category");
      case "formulario.descricaoNovo":
        return getFallback(
          currentLang,
          "Crie uma nova categoria para organizar seus lançamentos",
          "Create a new category to organize your entries",
        );
      case "formulario.descricaoEditar":
        return getFallback(
          currentLang,
          "Atualize os dados da categoria",
          "Update category data",
        );
      case "formulario.nomeLabel":
        return getFallback(currentLang, "Nome da Categoria", "Category Name");
      case "formulario.nomePlaceholder":
        return getFallback(
          currentLang,
          "Ex: Alimentação, Transporte, Salário...",
          "Ex: Food, Transportation, Salary...",
        );
      case "formulario.tipoLabel":
        return getFallback(currentLang, "Tipo", "Type");
      case "formulario.despesa":
        return getFallback(currentLang, "Despesa", "Expense");
      case "formulario.receita":
        return getFallback(currentLang, "Receita", "Income");
      case "formulario.corLabel":
        return getFallback(
          currentLang,
          "Cor de Identificação",
          "Identification Color",
        );
      case "formulario.iconeLabel":
        return getFallback(currentLang, "Ícone", "Icon");

      // Confirmação
      case "confirmacao.titulo":
        return getFallback(currentLang, "Excluir Categoria", "Delete Category");
      case "confirmacao.descricao":
        return getFallback(
          currentLang,
          'Tem certeza que deseja excluir a categoria "{{nome}}"? Esta ação não pode ser desfeita.',
          'Are you sure you want to delete the category "{{nome}}"? This action cannot be undone.',
        );

      // Tooltips
      case "tooltips.editar":
        return getFallback(currentLang, "Editar categoria", "Edit category");
      case "tooltips.excluir":
        return getFallback(currentLang, "Excluir categoria", "Delete category");

      // Mensagens
      case "mensagens.nenhumaEncontrada":
        return getFallback(
          currentLang,
          "Nenhuma categoria encontrada",
          "No categories found",
        );
      case "mensagens.ajustarFiltros":
        return getFallback(
          currentLang,
          "Tente ajustar os filtros ou termos de busca",
          "Try adjusting the filters or search terms",
        );
      case "mensagens.criarPrimeira":
        return getFallback(
          currentLang,
          "Comece criando sua primeira categoria",
          "Start by creating your first category",
        );
      case "mensagens.criada":
        return getFallback(
          currentLang,
          "Categoria criada com sucesso!",
          "Category created successfully!",
        );
      case "mensagens.atualizada":
        return getFallback(
          currentLang,
          "Categoria atualizada com sucesso!",
          "Category updated successfully!",
        );
      case "mensagens.excluida":
        return getFallback(
          currentLang,
          "Categoria deletada com sucesso!",
          "Category deleted successfully!",
        );
      case "mensagens.erroCarregar":
        return getFallback(
          currentLang,
          "Erro ao carregar categorias",
          "Error loading categories",
        );
      case "mensagens.erroSalvar":
        return getFallback(
          currentLang,
          "Erro ao salvar categoria.",
          "Error saving category.",
        );
      case "mensagens.erroExcluir":
        return getFallback(
          currentLang,
          "Erro ao deletar categoria.",
          "Error deleting category.",
        );

      // Avisos de Limite (novas traduções)
      case "avisos.categoriasFree.titulo":
        return getFallback(currentLang, "Categorias Free", "Free Categories");
      case "avisos.categoriasFree.descricao":
        return getFallback(
          currentLang,
          "categorias • restantes",
          "categories • remaining",
        );
      case "avisos.categoriasFree.atingido":
        return getFallback(
          currentLang,
          "Você atingiu o limite de categorias do plano Free",
          "You have reached the Free plan categories limit",
        );

      default:
        return key;
    }
  };

  // Criar um objeto de traduções para fácil acesso
  const translations = {
    titulo: getTranslation("titulo"),
    subtitulo: getTranslation("subtitulo"),

    botoes: {
      novaCategoria: getTranslation("botoes.novaCategoria"),
      criarPrimeira: getTranslation("botoes.criarPrimeira"),
      atualizar: getTranslation("botoes.atualizar"),
      criar: getTranslation("botoes.criar"),
      cancelar: getTranslation("botoes.cancelar"),
      confirmar: getTranslation("botoes.confirmar"),
      upgrade: getTranslation("botoes.upgrade"),
    },

    estados: {
      carregando: getTranslation("estados.carregando"),
      atualizando: getTranslation("estados.atualizando"),
      criando: getTranslation("estados.criando"),
      excluindo: getTranslation("estados.excluindo"),
      limite: getTranslation("estados.limite"),
    },

    stats: {
      total: getTranslation("stats.total"),
      despesas: getTranslation("stats.despesas"),
      receitas: getTranslation("stats.receitas"),
    },

    filtros: {
      buscar: getTranslation("filtros.buscar"),
      todas: getTranslation("filtros.todas"),
      despesas: getTranslation("filtros.despesas"),
      receitas: getTranslation("filtros.receitas"),
    },

    formulario: {
      tituloNovo: getTranslation("formulario.tituloNovo"),
      tituloEditar: getTranslation("formulario.tituloEditar"),
      descricaoNovo: getTranslation("formulario.descricaoNovo"),
      descricaoEditar: getTranslation("formulario.descricaoEditar"),
      nomeLabel: getTranslation("formulario.nomeLabel"),
      nomePlaceholder: getTranslation("formulario.nomePlaceholder"),
      tipoLabel: getTranslation("formulario.tipoLabel"),
      despesa: getTranslation("formulario.despesa"),
      receita: getTranslation("formulario.receita"),
      corLabel: getTranslation("formulario.corLabel"),
      iconeLabel: getTranslation("formulario.iconeLabel"),
    },

    confirmacao: {
      titulo: getTranslation("confirmacao.titulo"),
      descricao: getTranslation("confirmacao.descricao"),
    },

    tooltips: {
      editar: getTranslation("tooltips.editar"),
      excluir: getTranslation("tooltips.excluir"),
    },

    mensagens: {
      nenhumaEncontrada: getTranslation("mensagens.nenhumaEncontrada"),
      ajustarFiltros: getTranslation("mensagens.ajustarFiltros"),
      criarPrimeira: getTranslation("mensagens.criarPrimeira"),
      criada: getTranslation("mensagens.criada"),
      atualizada: getTranslation("mensagens.atualizada"),
      excluida: getTranslation("mensagens.excluida"),
      erroCarregar: getTranslation("mensagens.erroCarregar"),
      erroSalvar: getTranslation("mensagens.erroSalvar"),
      erroExcluir: getTranslation("mensagens.erroExcluir"),
    },

    avisos: {
      categoriasFree: {
        titulo: getTranslation("avisos.categoriasFree.titulo"),
        descricao: getTranslation("avisos.categoriasFree.descricao"),
        atingido: getTranslation("avisos.categoriasFree.atingido"),
      },
    },
  };

  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<"all" | "DESPESA" | "RECEITA">(
    "all",
  );
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(
    null,
  );
  const [dialogAberto, setDialogAberto] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "DESPESA",
    cor: "#3B82F6",
    icone: "Tag",
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [limiteInfo, setLimiteInfo] = useState<{
    plano: string;
    limiteCategorias: number;
    categoriasUsadas: number;
    atingido: boolean;
  } | null>(null);
  const [loadingLimite, setLoadingLimite] = useState(false);

  useEffect(() => {
    carregarCategorias();
    fetchLimiteCategorias();
  }, []);

  const fetchLimiteCategorias = async () => {
    try {
      setLoadingLimite(true);
      const response = await fetch(
        "/api/usuarios/subscription/limite-categorias",
      );
      if (response.ok) {
        const data = await response.json();
        setLimiteInfo(data);
      }
    } catch (error) {
      console.error("Erro ao buscar limite de categorias:", error);
    } finally {
      setLoadingLimite(false);
    }
  };

  const carregarCategorias = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/categorias");
      if (res.ok) {
        const data = await res.json();
        setCategorias(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error(translations.mensagens.erroCarregar, error);
      toast.error(translations.mensagens.erroCarregar);
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

      if (!res.ok) {
        const errorData = await res.json();

        if (
          res.status === 403 &&
          errorData.error === "Limite de categorias atingido"
        ) {
          toast.error(errorData.message, {
            action: {
              label: "Upgrade",
              onClick: () => router.push(`/${currentLang}/dashboard/perfil`),
            },
          });
          return;
        }

        throw new Error(translations.mensagens.erroSalvar);
      }

      const categoriaSalva = await res.json();

      if (editingCategoria) {
        setCategorias((prev) =>
          prev.map((cat) =>
            cat.id === editingCategoria.id ? categoriaSalva : cat,
          ),
        );
        toast.success(translations.mensagens.atualizada);
      } else {
        setCategorias((prev) => [...prev, categoriaSalva]);
        toast.success(translations.mensagens.criada);

        if (limiteInfo) {
          setLimiteInfo({
            ...limiteInfo,
            categoriasUsadas: limiteInfo.categoriasUsadas + 1,
            atingido:
              limiteInfo.categoriasUsadas + 1 >= limiteInfo.limiteCategorias,
          });
        }
      }

      setFormData({
        nome: "",
        tipo: "DESPESA",
        cor: "#3B82F6",
        icone: "Tag",
      });
      setEditingCategoria(null);
      setIsSheetOpen(false);
    } catch (error: any) {
      console.error(translations.mensagens.erroSalvar, error);
      if (error.message !== "Limite de categorias atingido") {
        toast.error(translations.mensagens.erroSalvar);
      }
      carregarCategorias();
    } finally {
      setEnviando(false);
    }
  };

  const AvisoLimiteCategorias = () => {
    if (!limiteInfo || loadingLimite || limiteInfo.plano !== "free") {
      return null;
    }

    const { categoriasUsadas, limiteCategorias, atingido } = limiteInfo;
    const porcentagem = Math.min(
      (categoriasUsadas / limiteCategorias) * 100,
      100,
    );

    return (
      <div className="mb-4 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <svg className="h-full w-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#fbbf24"
                  strokeWidth="4"
                  strokeOpacity="0.2"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#f59e0b"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${porcentagem * 2.51} 251`}
                  strokeDashoffset="0"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  {porcentagem}%
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {translations.avisos.categoriasFree.titulo}
                </span>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {categoriasUsadas}/{limiteCategorias}{" "}
                {currentLang === "pt" ? "categorias" : "categories"}
                {!atingido &&
                  ` • ${limiteCategorias - categoriasUsadas} ${currentLang === "pt" ? "restantes" : "remaining"}`}
              </p>
            </div>
          </div>

          {atingido && (
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

  const handleDelete = async (id: string) => {
    setExcluindo(id);

    const categoriaParaExcluir = categorias.find((cat) => cat.id === id);

    try {
      setCategorias((prev) => prev.filter((cat) => cat.id !== id));
      setDialogAberto(null);

      const res = await fetch(`/api/categorias/${id}`, { method: "DELETE" });

      if (!res.ok) {
        throw new Error(translations.mensagens.erroExcluir);
      }

      toast.success(translations.mensagens.excluida);
    } catch (error) {
      console.error(translations.mensagens.erroExcluir, error);

      if (categoriaParaExcluir) {
        setCategorias((prev) => [...prev, categoriaParaExcluir]);
      }

      toast.error(translations.mensagens.erroExcluir);
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
    return <Loading />;
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                {translations.titulo}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                {translations.subtitulo}
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
                    setEditingCategoria(null);
                    setFormData({
                      nome: "",
                      tipo: "DESPESA",
                      cor: "#3B82F6",
                      icone: "Tag",
                    });
                  }}
                  disabled={limiteInfo?.atingido && !editingCategoria}
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="ml-1 sm:ml-2">
                    {translations.botoes.novaCategoria}
                    {limiteInfo?.atingido &&
                      !editingCategoria &&
                      ` (${translations.estados.limite})`}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle className="text-gray-900 dark:text-white text-lg sm:text-xl">
                    {editingCategoria
                      ? translations.formulario.tituloEditar
                      : translations.formulario.tituloNovo}
                  </SheetTitle>
                  <SheetDescription className="text-gray-600 dark:text-gray-400 text-sm">
                    {editingCategoria
                      ? translations.formulario.descricaoEditar
                      : translations.formulario.descricaoNovo}
                  </SheetDescription>
                </SheetHeader>
                <FormularioCategoria
                  formData={formData}
                  setFormData={setFormData}
                  handleSubmit={handleSubmit}
                  enviando={enviando}
                  editingCategoria={editingCategoria}
                  translations={translations}
                  setIsSheetOpen={setIsSheetOpen}
                  setEditingCategoria={setEditingCategoria}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                    {translations.stats.total}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {categorias.length}
                  </p>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
                  <Tag className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                    {translations.stats.despesas}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                    {categoriasPorTipo.DESPESA.length}
                  </p>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-600 dark:bg-red-500 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                    {translations.stats.receitas}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                    {categoriasPorTipo.RECEITA.length}
                  </p>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-600 dark:bg-green-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder={translations.filtros.buscar}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 sm:pl-9 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm"
                />
              </div>

              <Tabs
                value={tipoFiltro}
                onValueChange={(value) => setTipoFiltro(value as any)}
                className="w-full sm:w-auto"
              >
                <TabsList className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex w-full sm:w-auto">
                  <TabsTrigger
                    value="all"
                    className="flex-1 sm:flex-none text-xs sm:text-sm text-gray-700 dark:text-gray-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-gray-300 dark:data-[state=active]:border-gray-600"
                  >
                    {translations.filtros.todas}
                  </TabsTrigger>
                  <TabsTrigger
                    value="DESPESA"
                    className="flex-1 sm:flex-none text-xs sm:text-sm text-gray-700 dark:text-gray-300 data-[state=active]:bg-red-100 dark:data-[state=active]:bg-red-600 data-[state=active]:text-red-700 dark:data-[state=active]:text-white"
                  >
                    {translations.filtros.despesas}
                  </TabsTrigger>
                  <TabsTrigger
                    value="RECEITA"
                    className="flex-1 sm:flex-none text-xs sm:text-sm text-gray-700 dark:text-gray-300 data-[state=active]:bg-green-100 dark:data-[state=active]:bg-green-600 data-[state=active]:text-green-700 dark:data-[state=active]:text-white"
                  >
                    {translations.filtros.receitas}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>
        {/* Aviso de Limite de Categorias */}
        <AvisoLimiteCategorias />
        {/* Lista de Categorias */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <AnimatePresence>
            {categoriasFiltradas.map((categoria, index) => (
              <motion.div
                key={categoria.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 group hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 shadow-sm">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1">
                        <div
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm"
                          style={{ backgroundColor: categoria.cor }}
                        >
                          {(() => {
                            try {
                              const Icon =
                                require("lucide-react")[
                                  categoria.icone || "Tag"
                                ];
                              return (
                                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                              );
                            } catch {
                              return (
                                <Tag className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                              );
                            }
                          })()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white truncate">
                            {categoria.nome}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`mt-1 text-xs ${
                              categoria.tipo === "RECEITA"
                                ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-400 border-green-200 dark:border-green-700"
                                : "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-400 border-red-200 dark:border-red-700"
                            }`}
                          >
                            {categoria.tipo === "RECEITA"
                              ? translations.formulario.receita
                              : translations.formulario.despesa}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
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
                                className="h-8 w-8 sm:h-9 sm:w-9 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
                              >
                                <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-900 dark:bg-gray-800 text-white dark:text-white border-gray-700 text-xs">
                              <p>{translations.tooltips.editar}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
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
                                    className="h-8 w-8 sm:h-9 sm:w-9 text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-gray-800"
                                  >
                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white w-[90vw] sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle className="text-gray-900 dark:text-white text-lg">
                                      {translations.confirmacao.titulo}
                                    </DialogTitle>
                                    <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
                                      {translations.confirmacao.descricao.replace(
                                        "{{nome}}",
                                        categoria.nome,
                                      )}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
                                    <Button
                                      variant="outline"
                                      onClick={() => setDialogAberto(null)}
                                      className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 text-sm"
                                    >
                                      {translations.botoes.cancelar}
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleDelete(categoria.id)}
                                      disabled={excluindo === categoria.id}
                                      className="text-sm"
                                    >
                                      {excluindo === categoria.id
                                        ? translations.estados.excluindo
                                        : translations.botoes.confirmar}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-900 dark:bg-gray-800 text-white dark:text-white border-gray-700 text-xs">
                              <p>{translations.tooltips.excluir}</p>
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
            className="text-center py-8 sm:py-12"
          >
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Tag className="w-6 h-6 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
              {translations.mensagens.nenhumaEncontrada}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 px-4">
              {searchTerm || tipoFiltro !== "all"
                ? translations.mensagens.ajustarFiltros
                : translations.mensagens.criarPrimeira}
            </p>
            {!searchTerm && tipoFiltro === "all" && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-white gap-2 text-sm">
                    <Plus className="w-4 h-4" />
                    {translations.botoes.criarPrimeira}
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle className="text-gray-900 dark:text-white">
                      {translations.formulario.tituloNovo}
                    </SheetTitle>
                    <SheetDescription className="text-gray-600 dark:text-gray-400">
                      {translations.formulario.descricaoNovo}
                    </SheetDescription>
                  </SheetHeader>
                  <FormularioCategoria
                    formData={formData}
                    setFormData={setFormData}
                    handleSubmit={handleSubmit}
                    enviando={enviando}
                    editingCategoria={editingCategoria}
                    translations={translations}
                    setIsSheetOpen={setIsSheetOpen}
                    setEditingCategoria={setEditingCategoria}
                  />
                </SheetContent>
              </Sheet>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
