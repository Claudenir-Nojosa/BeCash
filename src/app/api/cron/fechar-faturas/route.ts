import { NextRequest, NextResponse } from "next/server";
import { FaturaService } from "@/lib/faturaService";

export async function POST(request: NextRequest) {
  try {
    // Verificar se é uma chamada do cron (adicionar verificação de segredo)
    await FaturaService.fecharFaturasVencidas();

    return NextResponse.json({ message: "Faturas fechadas com sucesso" });
  } catch (error) {
    console.error("Erro ao fechar faturas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
