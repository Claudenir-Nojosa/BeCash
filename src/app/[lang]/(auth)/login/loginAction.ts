// app/[locale]/login/actions.ts
"use server";

import db from "@/lib/db";
import { AuthError } from "next-auth";
import { signIn } from "../../../../../auth";

export default async function loginAction(_prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const provider = formData.get("provider") as string | null;
  const lang = formData.get("lang") as string || "pt";

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
    await signIn(provider || "credentials", {
      email,
      password: formData.get("password") as string,
      redirect: false,
    });

    // Buscar usuário para verificar status de onboarding
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        onboardingCompleto: true,
      }
    });

    if (!user) {
      return { 
        success: false, 
        message: t.credentials,
        lang: lang
      };
    }

    // 🆕 Decidir para onde redirecionar baseado no onboarding
    let redirectTo = `/${lang}/dashboard`;
    if (!user.onboardingCompleto) {
      redirectTo = `/${lang}/onboarding`;
    }

    return { 
      success: true, 
      message: t.success,
      redirectTo: redirectTo,
      lang: lang,
      onboardingCompleto: user.onboardingCompleto
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