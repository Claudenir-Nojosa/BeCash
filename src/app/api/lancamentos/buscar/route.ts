// app/api/lancamentos/buscar/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";

// Usar a variável de ambiente
const API_KEY_FIXA = process.env.N8N_API_KEY;

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 INICIANDO REQUISIÇÃO...");

    // Debug: ver todos os parâmetros que estão chegando
    const { searchParams } = new URL(request.url);
    const allParams = Object.fromEntries(searchParams.entries());

    console.log("📨 TODOS OS PARÂMETROS RECEBIDOS:", allParams);
    console.log("🔑 API Key recebida:", searchParams.get("apiKey"));
    console.log(
      "🔐 API Key esperada:",
      API_KEY_FIXA ? "***" + API_KEY_FIXA.slice(-4) : "NÃO CONFIGURADA"
    );
    console.log("🌐 URL completa:", request.url);

    // Verificar se a API Key está configurada no ambiente
    if (!API_KEY_FIXA) {
      console.log("❌ N8N_API_KEY não configurada no .env");
      return NextResponse.json(
        { error: "API Key não configurada no servidor" },
        { status: 500 }
      );
    }

    // Tentar autenticação via session primeiro
    const session = await auth();
    console.log("👤 Session:", session ? "Sim" : "Não");

    let usuarioId: string;

    if (session?.user?.id) {
      usuarioId = session.user.id;
      console.log("✅ Autenticado via session, usuarioId:", usuarioId);
    } else {
      // Autenticação via API Key
      const apiKey = searchParams.get("apiKey");
      console.log("🔐 Tentando autenticar com API Key:", apiKey);

      if (!apiKey) {
        console.log("❌ API Key não encontrada nos parâmetros");
        return NextResponse.json(
          {
            error: "API Key é obrigatória",
            debug: { paramsRecebidos: allParams },
          },
          { status: 401 }
        );
      }

      if (apiKey !== API_KEY_FIXA) {
        console.log("❌ API Key inválida");
        return NextResponse.json(
          { error: "API Key inválida" },
          { status: 401 }
        );
      }

      console.log("✅ API Key válida!");

      // Buscar um usuário para usar (primeiro usuário do banco)
      const usuario = await db.usuario.findFirst();

      if (!usuario) {
        console.log("❌ Nenhum usuário encontrado no banco");
        return NextResponse.json(
          { error: "Nenhum usuário encontrado" },
          { status: 401 }
        );
      }

      usuarioId = usuario.id;
      console.log("👤 Usuário selecionado:", usuario.email, "ID:", usuarioId);
    }

    // Buscar lançamentos
    const descricao = searchParams.get("descricao");
    const valor = searchParams.get("valor");
    const dataParam = searchParams.get("data");
    const categoria = searchParams.get("categoria");
    const limit = searchParams.get("limit") || "20";
    const orderBy = searchParams.get("orderBy") || "data_desc";

    console.log("🎯 Filtros aplicados:", {
      descricao,
      valor,
      dataParam,
      categoria,
      limit,
      orderBy,
    });

    const where: any = { usuarioId };

    if (descricao) {
      where.descricao = { contains: descricao, mode: "insensitive" };
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

    const lancamentos = await db.lancamento.findMany({
      where,
      orderBy: { data: "desc" },
      take: parseInt(limit),
      include: { divisao: true },
    });

    console.log("✅ Lançamentos encontrados:", lancamentos.length);

    return NextResponse.json(lancamentos);
  } catch (error) {
    console.error("💥 Erro completo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
