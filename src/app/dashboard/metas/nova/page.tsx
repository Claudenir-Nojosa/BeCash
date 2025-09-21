// app/dashboard/metas/nova/page.tsx
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft, Target } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function NovaMetaPage() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [dataLimite, setDataLimite] = useState<Date | undefined>(undefined);

  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    valorAlvo: "",
    tipo: "",
    responsavel: "",
    categoria: "",
    icone: "🎯",
    cor: "#3b82f6",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);

    try {
      const response = await fetch("/api/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          valorAlvo: parseFloat(formData.valorAlvo),
          dataLimite: dataLimite ? dataLimite.toISOString() : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar meta");
      }

      toast.success("Meta criada com sucesso!");
      router.push("/dashboard/metas");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar meta");
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const categorias = [
    { value: "viagem", label: "Viagem", icone: "✈️" },
    { value: "reserva", label: "Reserva de Emergência", icone: "💰" },
    { value: "investimento", label: "Investimento", icone: "📈" },
    { value: "compra", label: "Compra", icone: "🛒" },
    { value: "outros", label: "Outros", icone: "🎯" },
  ];

  const icones = [
    { value: "🎯", label: "Alvo" },
    { value: "💰", label: "Dinheiro" },
    { value: "✈️", label: "Avião" },
    { value: "🏠", label: "Casa" },
    { value: "🚗", label: "Carro" },
    { value: "💍", label: "Casamento" },
    { value: "🎓", label: "Formatura" },
    { value: "🏖️", label: "Férias" },
  ];

  const cores = [
    { value: "#3b82f6", label: "Azul" },
    { value: "#ef4444", label: "Vermelho" },
    { value: "#10b981", label: "Verde" },
    { value: "#f59e0b", label: "Amarelo" },
    { value: "#8b5cf6", label: "Roxo" },
    { value: "#ec4899", label: "Rosa" },
  ];

  return (
    <div className="container mx-auto p-6 mt-20 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Nova Meta Financeira</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações da Meta</CardTitle>
            <CardDescription>
              Defina os detalhes do seu objetivo financeiro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título da Meta *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => handleChange("titulo", e.target.value)}
                placeholder="Ex: Viagem para Europa, Reserva de Emergência..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
                placeholder="Descreva sua meta com mais detalhes..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorAlvo">Valor Alvo *</Label>
              <Input
                id="valorAlvo"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.valorAlvo}
                onChange={(e) => handleChange("valorAlvo", e.target.value)}
                placeholder="0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Data Limite (Opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataLimite
                      ? format(dataLimite, "PPP", { locale: ptBR })
                      : "Selecione a data limite"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataLimite}
                    onSelect={setDataLimite}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
            <CardDescription>Personalize sua meta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => handleChange("tipo", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="compartilhado">Compartilhado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável *</Label>
                <Select
                  value={formData.responsavel}
                  onValueChange={(value) => handleChange("responsavel", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Claudenir">Claudenir</SelectItem>
                    <SelectItem value="Beatriz">Beatriz</SelectItem>
                    <SelectItem value="Compartilhado">Compartilhado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => handleChange("categoria", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <span className="flex items-center gap-2">
                        <span>{cat.icone}</span>
                        {cat.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icone">Ícone</Label>
                <Select
                  value={formData.icone}
                  onValueChange={(value) => handleChange("icone", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um ícone" />
                  </SelectTrigger>
                  <SelectContent>
                    {icones.map((icone) => (
                      <SelectItem key={icone.value} value={icone.value}>
                        <span className="flex items-center gap-2">
                          <span>{icone.value}</span>
                          {icone.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cor">Cor</Label>
                <Select
                  value={formData.cor}
                  onValueChange={(value) => handleChange("cor", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma cor" />
                  </SelectTrigger>
                  <SelectContent>
                    {cores.map((cor) => (
                      <SelectItem key={cor.value} value={cor.value}>
                        <span className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: cor.value }}
                          />
                          {cor.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

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
            {carregando ? "Criando..." : "Criar Meta"}
          </Button>
        </div>
      </form>
    </div>
  );
}
