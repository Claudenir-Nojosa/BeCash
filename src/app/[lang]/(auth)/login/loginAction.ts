// app/[lang]/(auth)/login/loginAction.ts
"use server";

import db from "@/lib/db";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "../../../../../auth";

export default async function loginAction(_prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const lang = (formData.get("lang") as string) || "pt";

  console.log("🔍 [LOGIN ACTION] Lang recebido:", lang);
  console.log("🔍 [LOGIN ACTION] Email:", email);

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

  const t =
    errorMessages[lang as keyof typeof errorMessages] || errorMessages.pt;

  try {
    // Fazer o login
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    // Buscar usuário para verificar onboarding
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        onboardingCompleto: true,
      },
    });

    if (!user) {
      return {
        success: false,
        message: t.credentials,
        lang: lang,
      };
    }

    // Decidir para onde redirecionar
    const redirectTo = user.onboardingCompleto
      ? `/${lang}/dashboard`
      : `/${lang}/onboarding`;

    console.log("✅ [LOGIN ACTION] Redirecionando para:", redirectTo);

    // 🔥 FAZER O REDIRECT SERVER-SIDE (isso vai lançar um erro especial do Next.js)
    redirect(redirectTo);
  } catch (e: any) {
    // ✅ IMPORTANTE: O redirect() do Next.js lança um erro especial
    // que deve ser re-lançado para funcionar
    if (e?.digest?.startsWith("NEXT_REDIRECT")) {
      console.log("✅ [LOGIN ACTION] Redirect do Next.js detectado");
      throw e;
    }

    console.error("❌ [LOGIN ACTION] Erro:", e);

    if (e instanceof AuthError) {
      switch (e.type) {
        case "CredentialsSignin":
          return {
            success: false,
            message: t.credentials,
            lang: lang,
          };
        case "AccessDenied":
          return {
            success: false,
            message: e.message || t.accessDenied,
            lang: lang,
          };
        default:
          return {
            success: false,
            message: t.generic,
            lang: lang,
          };
      }
    }

    return {
      success: false,
      message: t.generic,
      lang: lang,
    };
  }
}
