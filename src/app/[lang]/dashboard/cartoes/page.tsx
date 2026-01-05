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

interface Cartao {
  faturaAtual: any;
  id: string;
  nome: string;
  bandeira: string;
  limite: number;
  diaFechamento: number;
  diaVencimento: number;
  cor: string;
  observacoes?: string;
  lancamentos: Array<{
    id: string;
    valor: number;
    descricao: string;
    data: string;
  }>;
  _count?: {
    lancamentos: number;
  };
  totalGasto?: number;
  utilizacaoLimite?: number;
}

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
  const [enviando, setEnviando] = useState(false);
  const [dropdownAberto, setDropdownAberto] = useState<string | null>(null);

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
    <div className="min-h-screen p-4 sm:p-6 bg-white dark:bg-transparent">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {t("titulo")}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {t("subtitulo")}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
              <SheetTrigger asChild>
                <Button
                  variant={"outline"}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("botoes.novoCartao")}
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white overflow-y-auto">
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-gray-900 dark:text-white">
                    {t("formulario.tituloNovo")}
                  </SheetTitle>
                  <SheetDescription className="text-gray-600 dark:text-gray-400">
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
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CreditCard className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t("mensagens.nenhumCartao")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                {t("mensagens.nenhumCartaoDescricao")}
              </p>
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("botoes.cadastrarPrimeiro")}
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white overflow-y-auto">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="text-gray-900 dark:text-white">
                      {t("formulario.tituloNovo")}
                    </SheetTitle>
                    <SheetDescription className="text-gray-600 dark:text-gray-400">
                      {t("formulario.descricaoNovo")}
                    </SheetDescription>
                  </SheetHeader>
                  <FormularioCartao />
                </SheetContent>
              </Sheet>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cartoes.map((cartao) => {
              const status = getStatusUtilizacao(cartao.utilizacaoLimite || 0);

              return (
                <Card
                  key={cartao.id}
                  className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm group hover:shadow-md transition-shadow"
                >
                  <div
                    className="w-full h-1 rounded-t-lg"
                    style={{ backgroundColor: cartao.cor }}
                  />
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                          <CreditCard className="w-5 h-5" />
                          {cartao.nome}
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
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
                            className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white shadow-lg"
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
                            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                            {t("menu.verDetalhes")}
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
                            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            <FileText className="h-4 w-4" />
                            {t("menu.verFaturas")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              router.push(
                                getLocalizedPath(
                                  `/dashboard/cartoes/${cartao.id}/editar`
                                )
                              );
                              setDropdownAberto(null);
                            }}
                            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            <Edit className="h-4 w-4" />
                            {t("menu.editar")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setDialogExclusaoAberto(cartao.id);
                              setDropdownAberto(null);
                            }}
                            className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                            {t("menu.excluir")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {t("cartao.limite")}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatarMoeda(cartao.limite)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {t("cartao.utilizado")}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatarMoeda(cartao.totalGasto || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {t("cartao.disponivel")}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatarMoeda(
                            cartao.limite - (cartao.totalGasto || 0)
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {t("cartao.utilizacao")}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {Math.round(cartao.utilizacaoLimite || 0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
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

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        {status === "critico" ? (
                          <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />
                        ) : status === "alerta" ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-yellow-400" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-green-400" />
                        )}
                        <span
                          className={
                            status === "critico"
                              ? "text-red-600 dark:text-red-400"
                              : status === "alerta"
                                ? "text-amber-600 dark:text-yellow-400"
                                : "text-emerald-600 dark:text-green-400"
                          }
                        >
                          {t(`status.${status}`)}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                      >
                        {t("cartao.lancamentos", {
                          count: cartao._count?.lancamentos || 0,
                        })}
                      </Badge>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-800">
                      <span>
                        {t("cartao.fechamento", { dia: cartao.diaFechamento })}
                      </span>
                      <span>
                        {t("cartao.vencimento", { dia: cartao.diaVencimento })}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            getLocalizedPath(`/dashboard/cartoes/${cartao.id}`)
                          );
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        {t("botoes.detalhes")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
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
                        {t("botoes.faturas")}
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
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {t("confirmacao.titulo")}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {t("confirmacao.descricao")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setDialogExclusaoAberto(null)}
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {t("botoes.cancelar")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeletarCartao(dialogExclusaoAberto!)}
              disabled={!!excluindo}
            >
              {excluindo ? t("estados.excluindo") : t("botoes.confirmar")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
