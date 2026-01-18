/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import db from "@/lib/db";
import { AuthError } from "next-auth";
import { signIn } from "../../../../../auth";

export default async function loginAction(_prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const provider = formData.get("provider") as string | null;
  const lang = formData.get("lang") as string || "pt"; // Adicionar linguagem do formulário

  try {
    // Login normal, sem restrição de e-mail
    await signIn(provider || "credentials", {
      email,
      password: formData.get("password") as string,
      redirect: false,
      callbackUrl: `/${lang}/dashboard`, // Adicionar callbackUrl com linguagem
    });

    // Verifica se o usuário já existe no banco
    const user = await db.user.findUnique({
      where: { email },
    });

    return { 
      success: true, 
      message: "Login realizado com sucesso!",
      redirectTo: `/${lang}/dashboard` // Retornar redirecionamento correto
    };
  } catch (e: any) {
    if (e instanceof AuthError) {
      switch (e.type) {
        case "CredentialsSignin":
          return { success: false, message: "Dados de login incorretos" };
        case "AccessDenied":
          return { success: false, message: e.message || "Acesso negado" };
        default:
          return { success: false, message: "Ops, algum erro aconteceu!" };
      }
    }

    console.error(e);
    return { success: false, message: "Ops, algum erro aconteceu!" };
  }
}