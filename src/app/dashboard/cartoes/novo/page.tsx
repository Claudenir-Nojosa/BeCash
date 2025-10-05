// app/dashboard/cartoes/novo/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

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

export default function NovoCartaoPage() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    bandeira: "",
    limite: "",
    diaFechamento: "",
    diaVencimento: "",
    cor: "#3B82F6",
    observacoes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);

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
      router.push("/dashboard/cartoes");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar cartão");
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto p-6 mt-20 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Novo Cartão</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="diaFechamento">Dia de Fechamento *</Label>
            <Input
              id="diaFechamento"
              type="number"
              min="1"
              max="31"
              value={formData.diaFechamento}
              onChange={(e) => handleChange("diaFechamento", e.target.value)}
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
              onChange={(e) => handleChange("diaVencimento", e.target.value)}
              placeholder="1-31"
              required
            />
            <p className="text-xs text-muted-foreground">
              Dia que a fatura vence
            </p>
          </div>
        </div>

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
                      className="w-4 h-4 rounded-full"
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
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            value={formData.observacoes}
            onChange={(e) => handleChange("observacoes", e.target.value)}
            placeholder="Observações sobre o cartão..."
            rows={3}
          />
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={carregando} className="flex-1">
            {carregando ? "Criando..." : "Criar Cartão"}
          </Button>
        </div>
      </form>
    </div>
  );
}