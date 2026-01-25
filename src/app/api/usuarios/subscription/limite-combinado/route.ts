// app/api/usuarios/subscription/limite-combinado/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../../auth";

// Limites para plano free
const LIMITE_LANCAMENTOS_FREE = 50;
const LIMITE_CATEGORIAS_FREE = 10;
const LIMITE_METAS_FREE = 2;

// Limites para planos premium (apenas para referência)
const LIMITE_LANCAMENTOS_PRO = 50000000000;
const LIMITE_CATEGORIAS_PRO = 10000000000;
const LIMITE_METAS_PRO = 10000000000000;
const LIMITE_LANCAMENTOS_FAMILY = 100000000000000000;
const LIMITE_CATEGORIAS_FAMILY = 500000000000000;
const LIMITE_METAS_FAMILY = 10000000000000000000;

export async function GET() {
  try {
    console.log("🔍 Iniciando verificação de limite combinado...");

    const session = await auth();
    console.log("📊 Sessão:", session?.user?.id);

    if (!session?.user?.id) {
      console.log("❌ Usuário não autorizado");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Buscar assinatura
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });
    console.log("📋 Assinatura encontrada:", subscription?.plano);

    try {
      // Contar lançamentos, categorias e metas
      console.log("🔢 Contando lançamentos...");
      const lancamentosCount = await db.lancamento.count({
        where: { userId: session.user.id },
      });
      console.log("✅ Lançamentos:", lancamentosCount);

      console.log("🔢 Contando categorias...");
      const categoriasCount = await db.categoria.count({
        where: { userId: session.user.id },
      });
      console.log("✅ Categorias:", categoriasCount);

      console.log("🔢 Contando metas...");
      const metasCount = await db.metaPessoal.count({
        where: { userId: session.user.id },
      });
      console.log("✅ Metas:", metasCount);

      // Determinar plano e limites
      let plano = "free";
      let limiteLancamentos = LIMITE_LANCAMENTOS_FREE;
      let limiteCategorias = LIMITE_CATEGORIAS_FREE;
      let limiteMetas = LIMITE_METAS_FREE;

      if (subscription?.status === "active") {
        plano = subscription.plano;
        if (plano === "pro") {
          limiteLancamentos = LIMITE_LANCAMENTOS_PRO;
          limiteCategorias = LIMITE_CATEGORIAS_PRO;
          limiteMetas = LIMITE_METAS_PRO;
        } else if (plano === "family") {
          limiteLancamentos = LIMITE_LANCAMENTOS_FAMILY;
          limiteCategorias = LIMITE_CATEGORIAS_FAMILY;
          limiteMetas = LIMITE_METAS_FAMILY;
        }
      }

      console.log("🎯 Plano detectado:", plano);
      console.log("📊 Limites:", {
        lancamentos: limiteLancamentos,
        categorias: limiteCategorias,
        metas: limiteMetas,
      });

      // Calcular percentuais individuais (evitar divisão por zero)
      const percentualLancamentos =
        limiteLancamentos > 0
          ? Math.min((lancamentosCount / limiteLancamentos) * 100, 100)
          : 0;

      const percentualCategorias =
        limiteCategorias > 0
          ? Math.min((categoriasCount / limiteCategorias) * 100, 100)
          : 0;

      const percentualMetas =
        limiteMetas > 0 ? Math.min((metasCount / limiteMetas) * 100, 100) : 0;

      // Calcular percentual combinado (usamos o MAIOR percentual)
      const percentualCombinado = Math.max(
        percentualLancamentos,
        percentualCategorias,
        percentualMetas,
      );

      // Verificar se algum dos limites foi atingido
      const lancamentosAtingido = lancamentosCount >= limiteLancamentos;
      const categoriasAtingido = categoriasCount >= limiteCategorias;
      const metasAtingido = metasCount >= limiteMetas;
      const atingido =
        lancamentosAtingido || categoriasAtingido || metasAtingido;

      // Determinar qual limite está mais crítico
      let limiteCritico = "";
      const percentuais = [
        {
          tipo: "lançamentos",
          valor: percentualLancamentos,
          atingido: lancamentosAtingido,
        },
        {
          tipo: "categorias",
          valor: percentualCategorias,
          atingido: categoriasAtingido,
        },
        {
          tipo: "metas",
          valor: percentualMetas,
          atingido: metasAtingido,
        },
      ];

      // Ordenar por percentual mais alto
      percentuais.sort((a, b) => b.valor - a.valor);

      // Se algum atingido, mostrar primeiro
      const atingidos = percentuais.filter((p) => p.atingido);
      if (atingidos.length > 0) {
        limiteCritico = atingidos[0].tipo;
      } else {
        limiteCritico = percentuais[0].tipo;
      }

      const responseData = {
        plano,

        // Limites individuais
        limiteLancamentos,
        usadoLancamentos: lancamentosCount,
        percentualLancamentos,
        lancamentosAtingido,

        limiteCategorias,
        usadoCategorias: categoriasCount,
        percentualCategorias,
        categoriasAtingido,

        limiteMetas,
        usadoMetas: metasCount,
        percentualMetas,
        metasAtingido,

        // Dados combinados
        percentualCombinado,
        atingido,
        limiteCritico,

        // Estatísticas gerais
        usadoTotal: lancamentosCount + categoriasCount + metasCount,
        maisProximoDoLimite: percentuais[0].tipo,
      };

      console.log("📈 Dados retornados:", responseData);

      return NextResponse.json(responseData);
    } catch (dbError) {
      console.error("❌ Erro ao consultar banco de dados:", dbError);
      return NextResponse.json(
        { error: "Erro ao consultar banco de dados", details: String(dbError) },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("❌ Erro geral ao verificar limite combinado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: String(error) },
      { status: 500 },
    );
  }
}
