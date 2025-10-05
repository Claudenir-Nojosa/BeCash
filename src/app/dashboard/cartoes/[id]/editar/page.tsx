// app/dashboard/cartoes/[id]/editar/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Cartao {
  id: string;
  nome: string;
  bandeira: string;
  limite: number;
  diaFechamento: number;
  diaVencimento: number;
  cor: string;
  ativo: boolean;
  observacoes?: string;
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
  { value: "#6B7280", label: "Cinza" },
];

export default function EditarCartaoPage() {
  const params = useParams();
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const cartaoId = params.id as string;

  const [formData, setFormData] = useState({
    nome: "",
    bandeira: "",
    limite: "",
    diaFechamento: "",
    diaVencimento: "",
    cor: "#3B82F6",
    ativo: true,
    observacoes: "",
  });

  useEffect(() => {
    if (cartaoId) {
      carregarCartao();
    }
  }, [cartaoId]);

  const carregarCartao = async () => {
    try {
      const response = await fetch(`/api/cartoes/${cartaoId}`);
      if (response.ok) {
        const data: Cartao = await response.json();
        setFormData({
          nome: data.nome,
          bandeira: data.bandeira,
          limite: data.limite.toString(),
          diaFechamento: data.diaFechamento.toString(),
          diaVencimento: data.diaVencimento.toString(),
          cor: data.cor,
          ativo: data.ativo,
          observacoes: data.observacoes || "",
        });
      } else {
        throw new Error("Erro ao carregar cartão");
      }
    } catch (error) {
      console.error("Erro ao carregar cartão:", error);
      toast.error("Erro ao carregar cartão");
    } finally {
      setCarregando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    try {
      const response = await fetch(`/api/cartoes/${cartaoId}`, {
        method: "PUT",
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
        throw new Error(errorData.error || "Erro ao atualizar cartão");
      }

      toast.success("Cartão atualizado com sucesso!");
      router.push(`/dashboard/cartoes/${cartaoId}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar cartão");
      console.error(error);
    } finally {
      setSalvando(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (carregando) {
    return (
      <div className="container mx-auto p-6 mt-20">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 mt-20 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push(`/dashboard/cartoes/${cartaoId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Cartão</h1>
          <p className="text-muted-foreground">
            Atualize as informações do seu cartão
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Dados principais do cartão</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Cartão *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleChange("nome", e.target.value)}
                    placeholder="Ex: Nubank, Itaú Platinum..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bandeira">Bandeira *</Label>
                  <Select
                    value={formData.bandeira}
                    onValueChange={(value) => handleChange("bandeira", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a bandeira" />
                    </SelectTrigger>
                    <SelectContent>
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
                <Label htmlFor="limite">Limite do Cartão *</Label>
                <Input
                  id="limite"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.limite}
                  onChange={(e) => handleChange("limite", e.target.value)}
                  placeholder="0,00"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datas do Cartão</CardTitle>
              <CardDescription>
                Configure as datas de fechamento e vencimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="diaFechamento">Dia de Fechamento *</Label>
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
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Dia que a fatura fecha
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diaVencimento">Dia de Vencimento *</Label>
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
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Dia que a fatura vence
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personalização</CardTitle>
              <CardDescription>Aparência e status do cartão</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cor">Cor de Identificação</Label>
                <Select
                  value={formData.cor}
                  onValueChange={(value) => handleChange("cor", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma cor" />
                  </SelectTrigger>
                  <SelectContent>
                    {CORES.map((cor) => (
                      <SelectItem key={cor.value} value={cor.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: cor.value }}
                          />
                          {cor.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="ativo" className="text-base">
                    Cartão Ativo
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.ativo
                      ? "Cartão está ativo e aparecendo nas listas"
                      : "Cartão está inativo e oculto"}
                  </p>
                </div>
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => handleChange("ativo", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleChange("observacoes", e.target.value)}
                  placeholder="Observações sobre o cartão..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/cartoes/${cartaoId}`)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {salvando ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
