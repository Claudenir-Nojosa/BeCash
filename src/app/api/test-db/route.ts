// app/api/test-db/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    console.log("🧪 Testando conexão com o banco...");
    
    // Testar conexão simples
    const result = await db.$queryRaw`SELECT 1 as test`;
    console.log("✅ Conexão OK:", result);

    // Testar schema
    const tables = await db.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log("📊 Tabelas:", tables);

    return NextResponse.json({ 
      status: "OK", 
      connection: "success",
      tables 
    });

  } catch (error: any) {
    console.error("❌ Erro no teste do banco:", error);
    return NextResponse.json({ 
      status: "ERROR", 
      error: error.message 
    }, { status: 500 });
  }
}