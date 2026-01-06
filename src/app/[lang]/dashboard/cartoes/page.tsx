// app/dashboard/cartoes/page.tsx
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
import {
  Plus,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loading } from "@/components/ui/loading-barrinhas";
import { FormEditarCartao } from "@/components/shared/FormEditarCartao";
import { Cartao } from "../../../../../types/types";



export default function CartoesPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation("cartoes");
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [dialogExclusaoAberto, setDialogExclusaoAberto] = useState<
    string | null
  >(null);
  const [sheetAberto, setSheetAberto] = useState(false);
  const [sheetEditarAberto, setSheetEditarAberto] = useState<string | null>(
    null
  );
  const [enviando, setEnviando] = useState(false);
  const [dropdownAberto, setDropdownAberto] = useState<string | null>(null);
  const [cartaoParaEditar, setCartaoParaEditar] = useState<Cartao | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    bandeira: "",
    limite: "",
    diaFechamento: "",
    diaVencimento: "",
    cor: "#3B82F6",
    observacoes: "",
  });

  const BANDEIRAS = [
    { value: "VISA", label: t("bandeiras.VISA") },
    { value: "MASTERCARD", label: t("bandeiras.MASTERCARD") },
    { value: "ELO", label: t("bandeiras.ELO") },
    { value: "AMERICAN_EXPRESS", label: t("bandeiras.AMERICAN_EXPRESS") },
    { value: "HIPERCARD", label: t("bandeiras.HIPERCARD") },
    { value: "OUTROS", label: t("bandeiras.OUTROS") },
  ];

  const CORES = [
    { value: "#3B82F6", label: t("cores.#3B82F6") },
    { value: "#EF4444", label: t("cores.#EF4444") },
    { value: "#10B981", label: t("cores.#10B981") },
    { value: "#F59E0B", label: t("cores.#F59E0B") },
    { value: "#8B5CF6", label: t("cores.#8B5CF6") },
    { value: "#EC4899", label: t("cores.#EC4899") },
  ];

  const getLocalizedPath = (path: string) => {
    return `/${i18n.language}${path}`;
  };

  useEffect(() => {
    carregarCartoes();
  }, []);

  const carregarCartoes = async () => {
    try {
      setCarregando(true);
      const response = await fetch("/api/cartoes");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("mensagens.erroCarregar"));
      }

      const data = await response.json();

      const cartoesComLimiteReal = await Promise.all(
        data.map(async (cartao: Cartao) => {
          try {
            const limiteResponse = await fetch(
              `/api/cartoes/${cartao.id}/limite`
            );
            if (limiteResponse.ok) {
              const limiteData = await limiteResponse.json();
              return {
                ...cartao,
                totalGasto: limiteData.totalUtilizado,
                utilizacaoLimite: limiteData.utilizacaoPercentual,
              };
            }
            return cartao;
          } catch (error) {
            console.error(
              `Erro ao carregar limite do cartão ${cartao.id}:`,
              error
            );
            return cartao;
          }
        })
      );

      setCartoes(cartoesComLimiteReal);
    } catch (error) {
      console.error(t("mensagens.erroCarregar"), error);
      toast.error(
        error instanceof Error ? error.message : t("mensagens.erroCarregar")
      );
    } finally {
      setCarregando(false);
    }
  };

  const handleDeletarCartao = async (cartaoId: string) => {
    setExcluindo(cartaoId);
    setDropdownAberto(null);

    const cartaoParaExcluir = cartoes.find((cartao) => cartao.id === cartaoId);

    try {
      setCartoes((prev) => prev.filter((cartao) => cartao.id !== cartaoId));
      setDialogExclusaoAberto(null);

      const response = await fetch(`/api/cartoes/${cartaoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("mensagens.erroExcluir"));
      }

      toast.success(t("mensagens.excluido"));
    } catch (error) {
      console.error(t("mensagens.erroExcluir"), error);
      toast.error(
        error instanceof Error ? error.message : t("mensagens.erroExcluir")
      );

      if (cartaoParaExcluir) {
        setCartoes((prev) => [...prev, cartaoParaExcluir]);
      }
    } finally {
      setExcluindo(null);
    }
  };

  const handleCriarCartao = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    try {
      const response = await fetch("/api/cartoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          limite: parseFloat(formData.limite),
          diaFechamento: parseInt(formData.diaFechamento),
          diaVencimento: parseInt(formData.diaVencimento),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("mensagens.erroCriar"));
      }

      toast.success(t("mensagens.criado"));

      setSheetAberto(false);
      setFormData({
        nome: "",
        bandeira: "",
        limite: "",
        diaFechamento: "",
        diaVencimento: "",
        cor: "#3B82F6",
        observacoes: "",
      });

      carregarCartoes();
    } catch (error: any) {
      toast.error(error.message || t("mensagens.erroCriar"));
      console.error(error);
    } finally {
      setEnviando(false);
    }
  };

  const handleAbrirEditar = (cartao: Cartao) => {
    setCartaoParaEditar(cartao);
    setSheetEditarAberto(cartao.id);
    setDropdownAberto(null);
  };

  const handleFecharEditar = () => {
    setSheetEditarAberto(null);
    setCartaoParaEditar(null);
  };

  const handleCartaoEditado = () => {
    toast.success(t("mensagens.editadoSucesso"));
    handleFecharEditar();
    carregarCartoes();
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getStatusUtilizacao = (utilizacaoLimite: number) => {
    if (utilizacaoLimite >= 90) return "critico";
    if (utilizacaoLimite >= 70) return "alerta";
    return "normal";
  };

  const formatarMoeda = (valor: number) => {
    const locale = i18n.language === "pt" ? "pt-BR" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const FormularioCartao = () => (
    <form onSubmit={handleCriarCartao} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="nome" className="text-gray-700 dark:text-gray-300">
            {t("formulario.nomeLabel")}
          </Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => handleChange("nome", e.target.value)}
            placeholder={t("formulario.nomePlaceholder")}
            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="bandeira"
            className="text-gray-700 dark:text-gray-300"
          >
            {t("formulario.bandeiraLabel")}
          </Label>
          <Select
            value={formData.bandeira}
            onValueChange={(value) => handleChange("bandeira", value)}
            required
          >
            <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
              <SelectValue placeholder={t("formulario.bandeiraPlaceholder")} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
              {BANDEIRAS.map((bandeira) => (
                <SelectItem key={bandeira.value} value={bandeira.value}>
                  {bandeira.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="limite" className="text-gray-700 dark:text-gray-300">
          {t("formulario.limiteLabel")}
        </Label>
        <Input
          id="limite"
          type="number"
          step="0.01"
          min="0"
          value={formData.limite}
          onChange={(e) => handleChange("limite", e.target.value)}
          placeholder={t("formulario.limitePlaceholder")}
          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label
            htmlFor="diaFechamento"
            className="text-gray-700 dark:text-gray-300"
          >
            {t("formulario.diaFechamentoLabel")}
          </Label>
          <Input
            id="diaFechamento"
            type="number"
            min="1"
            max="31"
            value={formData.diaFechamento}
            onChange={(e) => handleChange("diaFechamento", e.target.value)}
            placeholder={t("formulario.diaFechamentoPlaceholder")}
            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("formulario.diaFechamentoHelper")}
          </p>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="diaVencimento"
            className="text-gray-700 dark:text-gray-300"
          >
            {t("formulario.diaVencimentoLabel")}
          </Label>
          <Input
            id="diaVencimento"
            type="number"
            min="1"
            max="31"
            value={formData.diaVencimento}
            onChange={(e) => handleChange("diaVencimento", e.target.value)}
            placeholder={t("formulario.diaVencimentoPlaceholder")}
            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("formulario.diaVencimentoHelper")}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cor" className="text-gray-700 dark:text-gray-300">
          {t("formulario.corLabel")}
        </Label>
        <Select
          value={formData.cor}
          onValueChange={(value) => handleChange("cor", value)}
        >
          <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
            <SelectValue placeholder={t("formulario.corPlaceholder")} />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
            {CORES.map((cor) => (
              <SelectItem key={cor.value} value={cor.value}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: cor.value }}
                  />
                  {cor.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="observacoes"
          className="text-gray-700 dark:text-gray-300"
        >
          {t("formulario.observacoesLabel")}
        </Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => handleChange("observacoes", e.target.value)}
          placeholder={t("formulario.observacoesPlaceholder")}
          rows={3}
          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setSheetAberto(false)}
          className="flex-1 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          {t("botoes.cancelar")}
        </Button>
        <Button
          type="submit"
          disabled={enviando}
          className="flex-1 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white"
        >
          {enviando ? t("estados.criando") : t("botoes.criar")}
        </Button>
      </div>
    </form>
  );

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 bg-white dark:bg-transparent">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">
                {t("titulo")}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                {t("subtitulo")}
              </p>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
              <SheetTrigger asChild>
                <Button
                  variant={"outline"}
                  className="flex-1 sm:flex-none border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500 text-xs sm:text-sm"
                >
                  <Plus className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="truncate">{t("botoes.novoCartao")}</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white overflow-y-auto w-full sm:max-w-md">
                <SheetHeader className="mb-4 sm:mb-6">
                  <SheetTitle className="text-gray-900 dark:text-white text-lg sm:text-xl">
                    {t("formulario.tituloNovo")}
                  </SheetTitle>
                  <SheetDescription className="text-gray-600 dark:text-gray-400 text-sm">
                    {t("formulario.descricaoNovo")}
                  </SheetDescription>
                </SheetHeader>
                <FormularioCartao />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Grid de Cartões */}
        {cartoes.length === 0 ? (
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
              <CreditCard className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-1 sm:mb-2 text-center">
                {t("mensagens.nenhumCartao")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center text-xs sm:text-sm mb-4 sm:mb-6 max-w-md">
                {t("mensagens.nenhumCartaoDescricao")}
              </p>
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm sm:text-base">
                    <Plus className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="truncate">
                      {t("botoes.cadastrarPrimeiro")}
                    </span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white overflow-y-auto w-full sm:max-w-md">
                  <SheetHeader className="mb-4 sm:mb-6">
                    <SheetTitle className="text-gray-900 dark:text-white text-lg sm:text-xl">
                      {t("formulario.tituloNovo")}
                    </SheetTitle>
                    <SheetDescription className="text-gray-600 dark:text-gray-400 text-sm">
                      {t("formulario.descricaoNovo")}
                    </SheetDescription>
                  </SheetHeader>
                  <FormularioCartao />
                </SheetContent>
              </Sheet>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {cartoes.map((cartao) => {
              const status = getStatusUtilizacao(cartao.utilizacaoLimite || 0);

              return (
                <Card
                  key={cartao.id}
                  className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm group hover:shadow-md transition-shadow"
                >
                  <div
                    className="w-full h-0.5 sm:h-1 rounded-t-lg"
                    style={{ backgroundColor: cartao.cor }}
                  />
                  <CardHeader className="pb-2 sm:pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-gray-900 dark:text-white text-sm sm:text-base">
                          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                          <span className="truncate">{cartao.nome}</span>
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm truncate">
                          {t(`bandeiras.${cartao.bandeira}`)}
                        </CardDescription>
                      </div>

                      <DropdownMenu
                        open={dropdownAberto === cartao.id}
                        onOpenChange={(open) => {
                          if (!open) {
                            setDropdownAberto(null);
                          }
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDropdownAberto(cartao.id)}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0 ml-1"
                          >
                            <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white shadow-lg w-40 sm:w-48 text-xs sm:text-sm"
                          onInteractOutside={() => setDropdownAberto(null)}
                          onEscapeKeyDown={() => setDropdownAberto(null)}
                        >
                          <DropdownMenuItem
                            onClick={() => {
                              router.push(
                                getLocalizedPath(
                                  `/dashboard/cartoes/${cartao.id}`
                                )
                              );
                              setDropdownAberto(null);
                            }}
                            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer py-2"
                          >
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="truncate">
                              {t("menu.verDetalhes")}
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              router.push(
                                getLocalizedPath(
                                  `/dashboard/cartoes/${cartao.id}/faturas`
                                )
                              );
                              setDropdownAberto(null);
                            }}
                            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer py-2"
                          >
                            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="truncate">
                              {t("menu.verFaturas")}
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAbrirEditar(cartao)}
                            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer py-2"
                          >
                            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="truncate">{t("menu.editar")}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setDialogExclusaoAberto(cartao.id);
                              setDropdownAberto(null);
                            }}
                            className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer py-2"
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="truncate">
                              {t("menu.excluir")}
                            </span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-600 dark:text-gray-400 truncate pr-1">
                          {t("cartao.limite")}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white truncate pl-1 text-right">
                          {formatarMoeda(cartao.limite)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-600 dark:text-gray-400 truncate pr-1">
                          {t("cartao.utilizado")}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white truncate pl-1 text-right">
                          {formatarMoeda(cartao.totalGasto || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-600 dark:text-gray-400 truncate pr-1">
                          {t("cartao.disponivel")}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white truncate pl-1 text-right">
                          {formatarMoeda(
                            cartao.limite - (cartao.totalGasto || 0)
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {t("cartao.utilizacao")}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {Math.round(cartao.utilizacaoLimite || 0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 sm:h-2">
                        <div
                          className={`h-1.5 sm:h-2 rounded-full ${
                            status === "critico"
                              ? "bg-red-500"
                              : status === "alerta"
                                ? "bg-amber-500 dark:bg-yellow-500"
                                : "bg-emerald-500 dark:bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min(cartao.utilizacaoLimite || 0, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        {status === "critico" ? (
                          <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                        ) : status === "alerta" ? (
                          <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 dark:text-yellow-400 flex-shrink-0" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 dark:text-green-400 flex-shrink-0" />
                        )}
                        <span
                          className={`truncate ${
                            status === "critico"
                              ? "text-red-600 dark:text-red-400"
                              : status === "alerta"
                                ? "text-amber-600 dark:text-yellow-400"
                                : "text-emerald-600 dark:text-green-400"
                          }`}
                        >
                          {t(`status.${status}`)}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 text-xs whitespace-nowrap flex-shrink-0"
                      >
                        {t("cartao.lancamentos", {
                          count: cartao._count?.lancamentos || 0,
                        })}
                      </Badge>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-800">
                      <span className="truncate pr-1">
                        {t("cartao.fechamento", { dia: cartao.diaFechamento })}
                      </span>
                      <span className="truncate pl-1 text-right">
                        {t("cartao.vencimento", { dia: cartao.diaVencimento })}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white text-xs sm:text-sm py-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            getLocalizedPath(`/dashboard/cartoes/${cartao.id}`)
                          );
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        <span className="truncate">{t("botoes.detalhes")}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white text-xs sm:text-sm py-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            getLocalizedPath(
                              `/dashboard/cartoes/${cartao.id}/faturas`
                            )
                          );
                        }}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        <span className="truncate">{t("botoes.faturas")}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog
        open={!!dialogExclusaoAberto}
        onOpenChange={() => setDialogExclusaoAberto(null)}
      >
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white text-lg">
              {t("confirmacao.titulo")}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
              {t("confirmacao.descricao")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setDialogExclusaoAberto(null)}
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
            >
              {t("botoes.cancelar")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeletarCartao(dialogExclusaoAberto!)}
              disabled={!!excluindo}
              className="text-sm"
            >
              {excluindo ? t("estados.excluindo") : t("botoes.confirmar")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sheet de Edição */}
      <Sheet open={!!sheetEditarAberto} onOpenChange={handleFecharEditar}>
        <SheetContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white overflow-y-auto w-full sm:max-w-2xl">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-gray-900 dark:text-white text-xl">
              {t("menu.editarCartao")}
            </SheetTitle>
            <SheetDescription className="text-gray-600 dark:text-gray-400">
              {t("menu.editarCartaoDescricao")}
            </SheetDescription>
          </SheetHeader>
          {cartaoParaEditar && (
            <FormEditarCartao
              cartao={cartaoParaEditar}
              onSalvo={handleCartaoEditado}
              onCancelar={handleFecharEditar}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
