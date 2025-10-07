/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { signIn } from "../../../../auth";
import db from "@/lib/db";
import { AuthError } from "next-auth";

export default async function loginAction(_prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const provider = formData.get("provider") as string | null;

  try {
    // Login normal, sem restrição de e-mail
    await signIn(provider || "credentials", {
      email,
      password: formData.get("password") as string,
      redirect: false,
    });

    // Verifica se o usuário já existe no banco
    const user = await db.user.findUnique({
      where: { email },
    });

    return { success: true, message: "Login realizado com sucesso!" };
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
