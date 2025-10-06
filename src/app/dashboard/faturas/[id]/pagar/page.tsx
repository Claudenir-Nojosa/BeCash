// app/dashboard/faturas/[id]/pagar/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

interface Fatura {
  id: string;
  mesReferencia: string;
  dataFechamento: string;
  dataVencimento: string;
  valorTotal: number;
  valorPago: number;
  status: string;
  cartao: {
    id: string;
    nome: string;
    bandeira: string;
    cor: string;
  };
  lancamentos: Array<{
    id: string;
    descricao: string;
    valor: number;
    data: string;
  }>;
}

export default function PagarFaturaPage() {
  const router = useRouter();
  const params = useParams();
  const faturaId = params.id as string;

  const [fatura, setFatura] = useState<Fatura | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);

  const [formData, setFormData] = useState({
    valor: "",
    metodo: "",
    data: "",
    observacoes: "",
  });

  useEffect(() => {
    carregarFatura();
  }, [faturaId]);

  const carregarFatura = async () => {
    try {
      setCarregando(true);
      const response = await fetch(`/api/faturas/${faturaId}`);

      if (!response.ok) {
        throw new Error("Fatura não encontrada");
      }

      const data = await response.json();
      setFatura(data);

      // Preencher valor padrão (valor restante)
      const valorRestante = data.valorTotal - data.valorPago;
      setFormData((prev) => ({
        ...prev,
        valor: valorRestante.toString(),
        data: new Date().toISOString().split("T")[0],
      }));
    } catch (error) {
      console.error("Erro ao carregar fatura:", error);
      toast.error("Erro ao carregar fatura");
      // Redirecionar para a página anterior ou lista de faturas
      router.back();
    } finally {
      setCarregando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fatura) return;

    try {
      setProcessando(true);

      const valorNumerico = parseFloat(formData.valor);
      const valorRestante = fatura.valorTotal - fatura.valorPago;

      if (valorNumerico <= 0) {
        toast.error("Valor deve ser maior que zero");
        return;
      }

      if (valorNumerico > valorRestante) {
        toast.error("Valor não pode ser maior que o valor restante");
        return;
      }

      const response = await fetch(`/api/faturas/${faturaId}/pagar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          valor: valorNumerico,
          metodo: formData.metodo,
          data: formData.data,
          observacoes: formData.observacoes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao processar pagamento");
      }

      toast.success("Pagamento realizado com sucesso!");

      router.push("/dashboard/cartoes");
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao processar pagamento"
      );
    } finally {
      setProcessando(false);
    }
  };
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ABERTA: { variant: "secondary" as const, label: "Aberta" },
      FECHADA: { variant: "default" as const, label: "Fechada" },
      PAGA: { variant: "success" as const, label: "Paga" },
      ATRASADA: { variant: "destructive" as const, label: "Atrasada" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.ABERTA;
    return <Badge>{config.label}</Badge>;
  };

  if (carregando) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Carregando fatura...</div>
        </div>
      </div>
    );
  }

  if (!fatura) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Fatura não encontrada</div>
        </div>
      </div>
    );
  }

  const valorRestante = fatura.valorTotal - fatura.valorPago;
  const estaPaga = fatura.status === "PAGA";

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push(`/dashboard/cartoes`)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pagar Fatura</h1>
          <p className="text-gray-600 mt-2">
            Realize o pagamento da fatura do cartão
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Resumo da Fatura */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Resumo da Fatura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cartão:</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: fatura.cartao.cor }}
                />
                <span className="font-medium">{fatura.cartao.nome}</span>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Mês de referência:</span>
              <span className="font-medium">{fatura.mesReferencia}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              {getStatusBadge(fatura.status)}
            </div>

            <div className="flex justify-between text-lg font-semibold">
              <span className="text-gray-600">Valor Total:</span>
              <span>R$ {fatura.valorTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Valor Pago:</span>
              <span className="text-green-600">
                R$ {fatura.valorPago.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span className="text-gray-600">Valor Restante:</span>
              <span
                className={
                  valorRestante > 0 ? "text-red-600" : "text-green-600"
                }
              >
                R$ {valorRestante.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Vencimento:</span>
              <span>
                {format(parseISO(fatura.dataVencimento), "dd/MM/yyyy")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle>Pagamento</CardTitle>
            <CardDescription>
              {estaPaga
                ? "Esta fatura já está totalmente paga."
                : "Preencha os dados para realizar o pagamento."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {estaPaga ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  Fatura Quitada
                </p>
                <p className="text-gray-600">
                  Esta fatura já foi totalmente paga.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor do Pagamento *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={valorRestante}
                    value={formData.valor}
                    onChange={(e) =>
                      setFormData({ ...formData, valor: e.target.value })
                    }
                    required
                    disabled={processando}
                  />
                  <p className="text-sm text-gray-500">
                    Valor restante: R$ {valorRestante.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metodo">Método de Pagamento *</Label>
                  <Select
                    value={formData.metodo}
                    onValueChange={(value) =>
                      setFormData({ ...formData, metodo: value })
                    }
                    required
                  >
                    <SelectTrigger disabled={processando}>
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="TRANSFERENCIA">
                        Transferência
                      </SelectItem>
                      <SelectItem value="DEBITO">Débito</SelectItem>
                      <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data">Data do Pagamento</Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) =>
                      setFormData({ ...formData, data: e.target.value })
                    }
                    disabled={processando}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    placeholder="Observações sobre o pagamento..."
                    value={formData.observacoes}
                    onChange={(e) =>
                      setFormData({ ...formData, observacoes: e.target.value })
                    }
                    disabled={processando}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={processando || valorRestante <= 0}
                >
                  {processando ? (
                    <>Processando...</>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmar Pagamento
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
