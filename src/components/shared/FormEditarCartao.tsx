// Crie um novo componente FormEditarCartao.tsx
"use client";

import { useState } from "react";
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
import { Save, X } from "lucide-react";
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

interface FormEditarCartaoProps {
  cartao: Cartao;
  onSalvo: () => void;
  onCancelar: () => void;
}

export function FormEditarCartao({
  cartao,
  onSalvo,
  onCancelar,
}: FormEditarCartaoProps) {
  const [salvando, setSalvando] = useState(false);
  const [formData, setFormData] = useState({
    nome: cartao.nome,
    bandeira: cartao.bandeira,
    limite: cartao.limite.toString(),
    diaFechamento: cartao.diaFechamento.toString(),
    diaVencimento: cartao.diaVencimento.toString(),
    cor: cartao.cor,
    observacoes: cartao.observacoes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    try {
      const response = await fetch(`/api/cartoes/${cartao.id}`, {
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
      onSalvo();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar cartão");
      console.error(error);
    } finally {
      setSalvando(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Informações Básicas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              onValueChange={(value) => handleChange("bandeira", value)}
              required
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Selecione a bandeira" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
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
      </div>

      {/* Datas do Cartão */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Datas do Cartão</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              onChange={(e) => handleChange("diaFechamento", e.target.value)}
              placeholder="1-31"
              className="bg-gray-800 border-gray-700 text-white"
              required
            />
            <p className="text-xs text-gray-400">Dia que a fatura fecha</p>
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
              onChange={(e) => handleChange("diaVencimento", e.target.value)}
              placeholder="1-31"
              className="bg-gray-800 border-gray-700 text-white"
              required
            />
            <p className="text-xs text-gray-400">Dia que a fatura vence</p>
          </div>
        </div>
      </div>

      {/* Personalização */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Personalização</h3>

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
            onChange={(e) => handleChange("observacoes", e.target.value)}
            placeholder="Observações sobre o cartão..."
            rows={3}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-6 border-t border-gray-800">
        <Button
          type="button"
          variant="outline"
          onClick={onCancelar}
          className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={salvando}
          className="flex-1 bg-white text-gray-900 hover:bg-gray-100"
        >
          <Save className="h-4 w-4 mr-2" />
          {salvando ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </form>
  );
}
