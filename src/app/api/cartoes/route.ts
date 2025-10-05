// app/api/cartoes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import db from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const cartoes = await db.cartao.findMany({
      where: { usuarioId: session.user.id },
      include: {
        lancamentos: {
          where: {
            pago: false,
            fatura: {
              is: {
                status: {
                  in: ["ABERTA", "FECHADA"],
                },
              },
            },
          },
        },
        faturas: {
          where: {
            status: {
              in: ["ABERTA", "FECHADA"],
            },
          },
          orderBy: {
            mesReferencia: "desc",
          },
          take: 1,
        },
      },
      orderBy: { nome: "asc" },
    });

    // Calcular counts e totais manualmente
    const cartoesComTotais = cartoes.map(cartao => {
      const totalGasto = cartao.lancamentos.reduce((sum, lancamento) => sum + lancamento.valor, 0);
      const utilizacaoLimite = (totalGasto / cartao.limite) * 100;
      const faturaAtual = cartao.faturas[0];

      return {
        ...cartao,
        _count: {
          lancamentos: cartao.lancamentos.length
        },
        totalGasto,
        utilizacaoLimite
      };
    });

    return NextResponse.json(cartoesComTotais);
  } catch (error) {
    console.error("Erro ao buscar cartões:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      nome,
      bandeira,
      limite,
      diaFechamento,
      diaVencimento,
      cor,
      observacoes,
    } = body;

    // Validações
    if (!nome || !bandeira || !limite || !diaFechamento || !diaVencimento) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    if (
      diaFechamento < 1 ||
      diaFechamento > 31 ||
      diaVencimento < 1 ||
      diaVencimento > 31
    ) {
      return NextResponse.json(
        { error: "Dias de fechamento e vencimento devem ser entre 1 e 31" },
        { status: 400 }
      );
    }

    const cartao = await db.cartao.create({
      data: {
        nome,
        bandeira,
        limite: parseFloat(limite),
        diaFechamento: parseInt(diaFechamento),
        diaVencimento: parseInt(diaVencimento),
        cor: cor || "#3B82F6",
        observacoes: observacoes || null,
        usuarioId: session.user.id,
      },
    });

    return NextResponse.json(cartao, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar cartão:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}