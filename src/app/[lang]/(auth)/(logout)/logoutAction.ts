// app/actions/logoutAction.ts
"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { signOut } from "../../../../../auth";

export async function logoutAction(locale: string) {
  console.log("🔍 [LOGOUT ACTION] Iniciando logout...");
  
  try {
    // Fazer logout
    await signOut({ redirect: false });
    
    // IMPORTANTE: Limpar o cache da sessão
    const headersList = await headers();
    const referer = headersList.get("referer") || "";
    
    console.log("✅ [LOGOUT ACTION] Logout realizado no servidor");
    
    // Redirecionar para login
    redirect(`/${locale}/login`);
  } catch (error) {
    console.error("❌ [LOGOUT ACTION] Erro:", error);
    // Mesmo com erro, redirecionar para login
    redirect(`/${locale}/login`);
  }
}