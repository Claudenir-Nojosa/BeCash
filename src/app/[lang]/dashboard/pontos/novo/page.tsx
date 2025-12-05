// app/dashboard/pontos/novo/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CalendarIcon,
  ArrowLeft,
  Coins,
  TrendingUp,
  Gift,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function NovoPontoPage() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [date, setDate] = useState<Date>(new Date());

  const [formData, setFormData] = useState({
    programa: "LIVELO",
    quantidade: "",
    descricao: "",
    tipo: "GANHO",
    valorResgate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);

    try {
      const payload = {
        ...formData,
        quantidade: parseInt(formData.quantidade),
        valorResgate: formData.valorResgate
          ? parseFloat(formData.valorResgate)
          : null,
        data: date.toISOString(),
      };

      const response = await fetch("/api/pontos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar ponto");
      }

      toast.success("Ponto registrado com sucesso!");
      router.push("/dashboard/pontos");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar ponto");
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const programas = [
    { value: "LIVELO", label: "LIVELO" },
    { value: "SMILES", label: "SMILES" },
    { value: "TUDOAZUL", label: "TudoAzul" },
    { value: "LATAMPASS", label: "LATAM Pass" },
    { value: "OUTRO", label: "Outro" },
  ];

  const tipos = [
    {
      value: "GANHO",
      label: "Ganho de Pontos",
      icon: <TrendingUp className="h-4 w-4" />,
      description: "Quando você ganha pontos",
    },
    {
      value: "RESGATE",
      label: "Resgate de Pontos",
      icon: <Gift className="h-4 w-4" />,
      description: "Quando você usa pontos",
    },
    {
      value: "EXPIRACAO",
      label: "Expiração de Pontos",
      icon: <Clock className="h-4 w-4" />,
      description: "Quando pontos expiram",
    },
  ];

  return (
    <div className="container mx-auto p-6 mt-20 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <Coins className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold">Novo Ponto</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Ponto</CardTitle>
            <CardDescription>
              Registre seus ganhos, resgates ou expirações de pontos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="programa">Programa *</Label>
                <Select
                  value={formData.programa}
                  onValueChange={(value) => handleChange("programa", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o programa" />
                  </SelectTrigger>
                  <SelectContent>
                    {programas.map((programa) => (
                      <SelectItem key={programa.value} value={programa.value}>
                        {programa.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                    {tipos.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        <div className="flex items-center gap-2">
                          {tipo.icon}
                          {tipo.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade de Pontos *</Label>
              <Input
                id="quantidade"
                type="number"
                min="1"
                value={formData.quantidade}
                onChange={(e) => handleChange("quantidade", e.target.value)}
                placeholder="Ex: 1000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
                placeholder="Ex: Compra no Supermercado, Resgate de passagem, Expiração anual..."
                required
                rows={3}
              />
            </div>

            {formData.tipo === "RESGATE" && (
              <div className="space-y-2">
                <Label htmlFor="valorResgate">Valor do Resgate (R$)</Label>
                <Input
                  id="valorResgate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valorResgate}
                  onChange={(e) => handleChange("valorResgate", e.target.value)}
                  placeholder="Ex: 150,00"
                />
                <p className="text-xs text-muted-foreground">
                  Valor em reais que você resgatou com os pontos (opcional)
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date
                      ? format(date, "PPP", { locale: ptBR })
                      : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
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
            {carregando ? "Registrando..." : "Registrar Ponto"}
          </Button>
        </div>
      </form>
    </div>
  );
}
