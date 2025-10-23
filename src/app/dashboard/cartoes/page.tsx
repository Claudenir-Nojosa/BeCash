// app/dashboard/cartoes/page.tsx
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
  ArrowLeft,
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

const BANDEIRAS = [
  { value: "VISA", label: "Visa" },
  { value: "MASTERCARD", label: "Mastercard" },
  { value: "ELO", label: "Elo" },
  { value: "AMERICAN_EXPRESS", label: "American Express" },
  { value: "HIPERCARD", label: "Hipercard" },
  { value: "OUTROS", label: "Outros" },
];

const CORES = [
  { value: "#3B82F6", label: "Azul" },
  { value: "#EF4444", label: "Vermelho" },
  { value: "#10B981", label: "Verde" },
  { value: "#F59E0B", label: "Amarelo" },
  { value: "#8B5CF6", label: "Roxo" },
  { value: "#EC4899", label: "Rosa" },
];

export default function CartoesPage() {
  const router = useRouter();
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [dialogExclusaoAberto, setDialogExclusaoAberto] = useState<
    string | null
  >(null);
  const [sheetAberto, setSheetAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [dropdownAberto, setDropdownAberto] = useState<string | null>(null); // 👈 NOVO ESTADO

  const [formData, setFormData] = useState({
    nome: "",
    bandeira: "",
    limite: "",
    diaFechamento: "",
    diaVencimento: "",
    cor: "#3B82F6",
    observacoes: "",
  });

  useEffect(() => {
    carregarCartoes();
  }, []);

  const carregarCartoes = async () => {
    try {
      setCarregando(true);
      const response = await fetch("/api/cartoes");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao carregar cartões");
      }

      const data = await response.json();

      // Para cada cartão, carregar o limite real (opcional)
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
      console.error("Erro ao carregar cartões:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao carregar cartões"
      );
    } finally {
      setCarregando(false);
    }
  };

  const handleDeletarCartao = async (cartaoId: string) => {
    setExcluindo(cartaoId);
    setDropdownAberto(null); // 👈 FECHA QUALQUER DROPDOWN ABERTO

    // Salva o cartão para possível rollback
    const cartaoParaExcluir = cartoes.find((cartao) => cartao.id === cartaoId);

    try {
      // Remove da lista imediatamente
      setCartoes((prev) => prev.filter((cartao) => cartao.id !== cartaoId));
      setDialogExclusaoAberto(null);

      const response = await fetch(`/api/cartoes/${cartaoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao excluir cartão");
      }

      toast.success("Cartão excluído com sucesso");
    } catch (error) {
      console.error("Erro ao excluir cartão:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao excluir cartão"
      );

      // Reverte se der erro
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
        throw new Error(errorData.error || "Erro ao criar cartão");
      }

      toast.success("Cartão criado com sucesso!");

      // Fecha o sheet e reseta o formulário
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

      // Recarrega a lista de cartões
      carregarCartoes();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar cartão");
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
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-white">Cartões</h1>
              <p className="text-gray-300">
                Gerencie seus cartões de crédito e débito
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
              <SheetTrigger asChild>
                <Button
                  variant={"outline"}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cartão
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-gray-900 border-gray-800 text-white overflow-y-auto">
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-white">Novo Cartão</SheetTitle>
                  <SheetDescription className="text-gray-400">
                    Adicione um novo cartão para gerenciar seus gastos
                  </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleCriarCartao} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nome" className="text-white">
                        Nome do Cartão *
                      </Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => handleChange("nome", e.target.value)}
                        placeholder="Ex: Nubank, Itaú Platinum..."
                        className="bg-gray-800 border-gray-700 text-white"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bandeira" className="text-white">
                        Bandeira *
                      </Label>
                      <Select
                        value={formData.bandeira}
                        onValueChange={(value) =>
                          handleChange("bandeira", value)
                        }
                        required
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue placeholder="Selecione a bandeira" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 text-white">
                          {BANDEIRAS.map((bandeira) => (
                            <SelectItem
                              key={bandeira.value}
                              value={bandeira.value}
                            >
                              {bandeira.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="limite" className="text-white">
                      Limite do Cartão *
                    </Label>
                    <Input
                      id="limite"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.limite}
                      onChange={(e) => handleChange("limite", e.target.value)}
                      placeholder="0,00"
                      className="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="diaFechamento" className="text-white">
                        Dia de Fechamento *
                      </Label>
                      <Input
                        id="diaFechamento"
                        type="number"
                        min="1"
                        max="31"
                        value={formData.diaFechamento}
                        onChange={(e) =>
                          handleChange("diaFechamento", e.target.value)
                        }
                        placeholder="1-31"
                        className="bg-gray-800 border-gray-700 text-white"
                        required
                      />
                      <p className="text-xs text-gray-400">
                        Dia que a fatura fecha
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="diaVencimento" className="text-white">
                        Dia de Vencimento *
                      </Label>
                      <Input
                        id="diaVencimento"
                        type="number"
                        min="1"
                        max="31"
                        value={formData.diaVencimento}
                        onChange={(e) =>
                          handleChange("diaVencimento", e.target.value)
                        }
                        placeholder="1-31"
                        className="bg-gray-800 border-gray-700 text-white"
                        required
                      />
                      <p className="text-xs text-gray-400">
                        Dia que a fatura vence
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cor" className="text-white">
                      Cor de Identificação
                    </Label>
                    <Select
                      value={formData.cor}
                      onValueChange={(value) => handleChange("cor", value)}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Selecione uma cor" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        {CORES.map((cor) => (
                          <SelectItem key={cor.value} value={cor.value}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full border border-gray-600"
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
                    <Label htmlFor="observacoes" className="text-white">
                      Observações
                    </Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) =>
                        handleChange("observacoes", e.target.value)
                      }
                      placeholder="Observações sobre o cartão..."
                      rows={3}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSheetAberto(false)}
                      className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={enviando}
                      className="flex-1 bg-white text-gray-900 hover:bg-gray-100"
                    >
                      {enviando ? "Criando..." : "Criar Cartão"}
                    </Button>
                  </div>
                </form>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Grid de Cartões */}
        {carregando ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4 bg-gray-800" />
                  <Skeleton className="h-4 w-full mb-2 bg-gray-800" />
                  <Skeleton className="h-4 w-2/3 mb-4 bg-gray-800" />
                  <Skeleton className="h-2 w-full mb-2 bg-gray-800" />
                  <Skeleton className="h-4 w-1/2 bg-gray-800" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : cartoes.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CreditCard className="h-16 w-16 text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Nenhum cartão cadastrado
              </h3>
              <p className="text-gray-400 text-center mb-6">
                Comece cadastrando seu primeiro cartão para acompanhar seus
                gastos.
              </p>
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="bg-white text-gray-900 hover:bg-gray-100">
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Primeiro Cartão
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-gray-900 border-gray-800 text-white overflow-y-auto">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="text-white">Novo Cartão</SheetTitle>
                    <SheetDescription className="text-gray-400">
                      Adicione um novo cartão para gerenciar seus gastos
                    </SheetDescription>
                  </SheetHeader>

                  <form onSubmit={handleCriarCartao} className="space-y-6">
                    {/* Formulário igual ao de cima */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="nome" className="text-white">
                          Nome do Cartão *
                        </Label>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) => handleChange("nome", e.target.value)}
                          placeholder="Ex: Nubank, Itaú Platinum..."
                          className="bg-gray-800 border-gray-700 text-white"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bandeira" className="text-white">
                          Bandeira *
                        </Label>
                        <Select
                          value={formData.bandeira}
                          onValueChange={(value) =>
                            handleChange("bandeira", value)
                          }
                          required
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Selecione a bandeira" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                            {BANDEIRAS.map((bandeira) => (
                              <SelectItem
                                key={bandeira.value}
                                value={bandeira.value}
                              >
                                {bandeira.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="limite" className="text-white">
                        Limite do Cartão *
                      </Label>
                      <Input
                        id="limite"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.limite}
                        onChange={(e) => handleChange("limite", e.target.value)}
                        placeholder="0,00"
                        className="bg-gray-800 border-gray-700 text-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="diaFechamento" className="text-white">
                          Dia de Fechamento *
                        </Label>
                        <Input
                          id="diaFechamento"
                          type="number"
                          min="1"
                          max="31"
                          value={formData.diaFechamento}
                          onChange={(e) =>
                            handleChange("diaFechamento", e.target.value)
                          }
                          placeholder="1-31"
                          className="bg-gray-800 border-gray-700 text-white"
                          required
                        />
                        <p className="text-xs text-gray-400">
                          Dia que a fatura fecha
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="diaVencimento" className="text-white">
                          Dia de Vencimento *
                        </Label>
                        <Input
                          id="diaVencimento"
                          type="number"
                          min="1"
                          max="31"
                          value={formData.diaVencimento}
                          onChange={(e) =>
                            handleChange("diaVencimento", e.target.value)
                          }
                          placeholder="1-31"
                          className="bg-gray-800 border-gray-700 text-white"
                          required
                        />
                        <p className="text-xs text-gray-400">
                          Dia que a fatura vence
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cor" className="text-white">
                        Cor de Identificação
                      </Label>
                      <Select
                        value={formData.cor}
                        onValueChange={(value) => handleChange("cor", value)}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue placeholder="Selecione uma cor" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 text-white">
                          {CORES.map((cor) => (
                            <SelectItem key={cor.value} value={cor.value}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded-full border border-gray-600"
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
                      <Label htmlFor="observacoes" className="text-white">
                        Observações
                      </Label>
                      <Textarea
                        id="observacoes"
                        value={formData.observacoes}
                        onChange={(e) =>
                          handleChange("observacoes", e.target.value)
                        }
                        placeholder="Observações sobre o cartão..."
                        rows={3}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSheetAberto(false)}
                        className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={enviando}
                        className="flex-1 bg-white text-gray-900 hover:bg-gray-100"
                      >
                        {enviando ? "Criando..." : "Criar Cartão"}
                      </Button>
                    </div>
                  </form>
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
                  className="bg-gray-900 border-gray-800 group hover:border-gray-700 transition-colors"
                >
                  <div
                    className="w-full h-1"
                    style={{ backgroundColor: cartao.cor }}
                  />
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-white">
                          <CreditCard className="w-5 h-5" />
                          {cartao.nome}
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          {cartao.bandeira}
                        </CardDescription>
                      </div>

                      {/* DropdownMenu Corrigido */}
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
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-gray-800 border-gray-700 text-white"
                          onInteractOutside={() => setDropdownAberto(null)}
                          onEscapeKeyDown={() => setDropdownAberto(null)}
                        >
                          <DropdownMenuItem
                            onClick={() => {
                              router.push(`/dashboard/cartoes/${cartao.id}`);
                              setDropdownAberto(null); // 👈 FECHA O DROPDOWN
                            }}
                            className="flex items-center gap-2 hover:bg-gray-700 cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              router.push(
                                `/dashboard/cartoes/${cartao.id}/faturas`
                              );
                              setDropdownAberto(null); // 👈 FECHA O DROPDOWN
                            }}
                            className="flex items-center gap-2 hover:bg-gray-700 cursor-pointer"
                          >
                            <FileText className="h-4 w-4" />
                            Ver Faturas
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              router.push(
                                `/dashboard/cartoes/${cartao.id}/editar`
                              );
                              setDropdownAberto(null); // 👈 FECHA O DROPDOWN
                            }}
                            className="flex items-center gap-2 hover:bg-gray-700 cursor-pointer"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setDialogExclusaoAberto(cartao.id);
                              setDropdownAberto(null); // 👈 FECHA O DROPDOWN
                            }}
                            className="flex items-center gap-2 text-red-400 hover:bg-red-950 hover:text-red-300 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Limite:</span>
                        <span className="font-medium text-white">
                          {formatarMoeda(cartao.limite)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Utilizado:</span>
                        <span className="font-medium text-white">
                          {formatarMoeda(cartao.totalGasto || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Disponível:</span>
                        <span className="font-medium text-white">
                          {formatarMoeda(
                            cartao.limite - (cartao.totalGasto || 0)
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Utilização:</span>
                        <span className="font-medium text-white">
                          {Math.round(cartao.utilizacaoLimite || 0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            status === "critico"
                              ? "bg-red-500"
                              : status === "alerta"
                                ? "bg-yellow-500"
                                : "bg-green-500"
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
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        ) : status === "alerta" ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                        <span
                          className={
                            status === "critico"
                              ? "text-red-400"
                              : status === "alerta"
                                ? "text-yellow-400"
                                : "text-green-400"
                          }
                        >
                          {status === "critico"
                            ? "Limite crítico"
                            : status === "alerta"
                              ? "Atenção"
                              : "Dentro do limite"}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-gray-800 text-gray-300 border-gray-700"
                      >
                        {cartao._count?.lancamentos || 0} lançamentos
                      </Badge>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-800">
                      <span>Fechamento: dia {cartao.diaFechamento}</span>
                      <span>Vencimento: dia {cartao.diaVencimento}</span>
                    </div>

                    {/* Botões de ação rápida */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/cartoes/${cartao.id}`);
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Detalhes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/dashboard/cartoes/${cartao.id}/faturas`
                          );
                        }}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Faturas
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
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Excluir Cartão</DialogTitle>
            <DialogDescription className="text-gray-400">
              Tem certeza que deseja excluir este cartão? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setDialogExclusaoAberto(null)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeletarCartao(dialogExclusaoAberto!)}
              disabled={!!excluindo}
            >
              {excluindo ? "Excluindo..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
