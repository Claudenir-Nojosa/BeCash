// app/api/lancamentos/buscar/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

export async function GET(request: NextRequest) {
  try {
    // Tentar autenticação via session (usuário logado)
    const session = await auth();

    // Se não tem session, verificar API Key
    let usuarioId: string;

    if (session?.user?.id) {
      // Autenticação via session (web)
      usuarioId = session.user.id;
    } else {
      // Autenticação via API Key
      const { searchParams } = new URL(request.url);
      const apiKey = searchParams.get("apiKey");

      if (!apiKey) {
        return NextResponse.json(
          { error: "API Key é obrigatória" },
          { status: 401 }
        );
      }

      // Buscar usuário pela API Key - CORREÇÃO AQUI: db.usuario em vez de db.user
      const usuario = await db.usuario.findFirst({
        where: { apiKey: apiKey },
      });

      if (!usuario) {
        return NextResponse.json(
          { error: "API Key inválida" },
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
      usuarioId: usuarioId, // Usar o ID do usuário autenticado
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
      // Lógica para tratar datas (hoje, ontem, data específica)
      let dataBusca;
      if (dataParam === "hoje") {
        dataBusca = new Date();
      } else if (dataParam === "ontem") {
        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        dataBusca = ontem;
      } else {
        // Tentar parse como data DD/MM/YYYY
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
