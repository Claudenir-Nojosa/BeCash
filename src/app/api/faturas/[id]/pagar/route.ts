// app/api/faturas/[id]/pagar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import db from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const faturaId = params.id;
    const body = await request.json();
    const { valor, metodo, data, observacoes } = body;

    // Validações
    if (!valor || !metodo) {
      return NextResponse.json(
        { error: "Valor e método de pagamento são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar a fatura
    const fatura = await db.fatura.findFirst({
      where: {
        id: faturaId,
        cartao: {
          usuarioId: session.user.id,
        },
      },
      include: {
        lancamentos: true,
        cartao: true,
      },
    });

    if (!fatura) {
      return NextResponse.json(
        { error: "Fatura não encontrada" },
        { status: 404 }
      );
    }

    if (fatura.status === "PAGA") {
      return NextResponse.json(
        { error: "Fatura já está paga" },
        { status: 400 }
      );
    }

    // Usar transaction para garantir consistência
    const result = await db.$transaction(async (tx) => {
      // 1. Criar registro de pagamento
      const pagamento = await tx.pagamentoFatura.create({
        data: {
          faturaId,
          valor: parseFloat(valor),
          metodo,
          data: data ? new Date(data) : new Date(),
          observacoes: observacoes || null,
          usuarioId: session.user.id,
        },
      });

      // 2. Atualizar fatura
      const valorPagoTotal = fatura.valorPago + parseFloat(valor);
      const novaFatura = await tx.fatura.update({
        where: { id: faturaId },
        data: {
          valorPago: valorPagoTotal,
          status: valorPagoTotal >= fatura.valorTotal ? "PAGA" : "FECHADA",
        },
        include: {
          lancamentos: true,
        },
      });

      // 3. Se a fatura foi totalmente paga, marcar lançamentos como pagos
      if (valorPagoTotal >= fatura.valorTotal) {
        await tx.lancamento.updateMany({
          where: {
            faturaId: faturaId,
            pago: false,
          },
          data: {
            pago: true,
          },
        });
      }

      return { pagamento, fatura: novaFatura };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao processar pagamento da fatura:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
