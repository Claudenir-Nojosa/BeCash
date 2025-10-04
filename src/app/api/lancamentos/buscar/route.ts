// app/api/lancamentos/buscar/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

// API Key fixa - use a mesma que você colocou no Make
const API_KEY_FIXA = "minha_chave_secreta_super_segura_12345";

export async function GET(request: NextRequest) {
  try {
    // Tentar autenticação via session (usuário logado)
    const session = await auth();

    let usuarioId: string;

    if (session?.user?.id) {
      // Autenticação via session (web)
      usuarioId = session.user.id;
    } else {
      // Autenticação via API Key fixa
      const { searchParams } = new URL(request.url);
      const apiKey = searchParams.get("apiKey");

      if (!apiKey) {
        return NextResponse.json(
          { error: "API Key é obrigatória" },
          { status: 401 }
        );
      }

      // Verificar se a API Key é válida (comparação simples)
      if (apiKey !== API_KEY_FIXA) {
        return NextResponse.json(
          { error: "API Key inválida" },
          { status: 401 }
        );
      }

      // PARA TESTES: Use um usuário específico ou o primeiro usuário
      // Você pode ajustar isso conforme sua necessidade
      const usuario = await db.usuario.findFirst();
      
      if (!usuario) {
        return NextResponse.json(
          { error: "Nenhum usuário encontrado" },
          { status: 401 }
        );
      }

      usuarioId = usuario.id;
    }

    const { searchParams } = new URL(request.url);

    // Extrair parâmetros de busca
    const descricao = searchParams.get("descricao");
    const valor = searchParams.get("valor");
    const dataParam = searchParams.get("data");
    const categoria = searchParams.get("categoria");
    const limit = searchParams.get("limit") || "10";
    const orderBy = searchParams.get("orderBy") || "data_desc";

    // Construir where clause
    const where: any = {
      usuarioId: usuarioId,
    };

    if (descricao) {
      where.descricao = {
        contains: descricao,
        mode: "insensitive",
      };
    }

    if (valor) {
      where.valor = parseFloat(valor);
    }

    if (categoria) {
      where.categoria = categoria;
    }

    if (dataParam) {
      let dataBusca;
      if (dataParam === "hoje") {
        dataBusca = new Date();
      } else if (dataParam === "ontem") {
        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        dataBusca = ontem;
      } else {
        const [dia, mes, ano] = dataParam.split("/");
        dataBusca = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
      }

      where.data = {
        gte: new Date(dataBusca.setHours(0, 0, 0, 0)),
        lt: new Date(dataBusca.setHours(23, 59, 59, 999)),
      };
    }

    // Ordenação
    const orderByClause: any = {};
    if (orderBy === "data_desc") {
      orderByClause.data = "desc";
    } else if (orderBy === "data_asc") {
      orderByClause.data = "asc";
    }

    const lancamentos = await db.lancamento.findMany({
      where,
      orderBy: orderByClause,
      take: parseInt(limit),
      include: {
        divisao: true,
      },
    });

    return NextResponse.json(lancamentos);
  } catch (error) {
    console.error("Erro ao buscar lançamentos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}