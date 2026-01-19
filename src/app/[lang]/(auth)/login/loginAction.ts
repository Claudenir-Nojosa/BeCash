/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import db from "@/lib/db";
import { AuthError } from "next-auth";
import { signIn } from "../../../../../auth";

export default async function loginAction(_prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const provider = formData.get("provider") as string | null;
  const lang = formData.get("lang") as string || "pt";

  // Mensagens de erro por idioma
  const errorMessages = {
    pt: {
      credentials: "Dados de login incorretos",
      accessDenied: "Acesso negado",
      generic: "Ops, algum erro aconteceu!",
      success: "Login realizado com sucesso!",
    },
    en: {
      credentials: "Incorrect login credentials",
      accessDenied: "Access denied",
      generic: "Oops, something went wrong!",
      success: "Login successful!",
    },
  };

  const t = errorMessages[lang as keyof typeof errorMessages] || errorMessages.pt;

  try {
    // Login normal, sem restrição de e-mail
    await signIn(provider || "credentials", {
      email,
      password: formData.get("password") as string,
      redirect: false,
      callbackUrl: `/${lang}/dashboard`,
    });

    // Verifica se o usuário já existe no banco
    const user = await db.user.findUnique({
      where: { email },
    });

    return { 
      success: true, 
      message: t.success,
      redirectTo: `/${lang}/dashboard`,
      lang: lang
    };
  } catch (e: any) {
    if (e instanceof AuthError) {
      switch (e.type) {
        case "CredentialsSignin":
          return { 
            success: false, 
            message: t.credentials,
            lang: lang
          };
        case "AccessDenied":
          return { 
            success: false, 
            message: e.message || t.accessDenied,
            lang: lang
          };
        default:
          return { 
            success: false, 
            message: t.generic,
            lang: lang
          };
      }
    }

    console.error(e);
    return { 
      success: false, 
      message: t.generic,
      lang: lang
    };
  }
}