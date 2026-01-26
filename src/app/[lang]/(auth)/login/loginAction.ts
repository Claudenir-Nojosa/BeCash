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
    // ✅ Fazer o login e capturar o resultado
    const result = await signIn("credentials", {
      email,
      password,
      redirect: true,
    });

    console.log("✅ [LOGIN ACTION] SignIn result:", result);

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
      : `/${lang}/login/onboarding`;

    console.log("✅ [LOGIN ACTION] Redirecionando para:", redirectTo);

    // 🔥 FAZER O REDIRECT SERVER-SIDE
    redirect(redirectTo);
  } catch (e: any) {
    // ✅ IMPORTANTE: O redirect() do Next.js lança um erro especial
    if (e?.digest?.startsWith("NEXT_REDIRECT")) {
      console.log("✅ [LOGIN ACTION] Redirect do Next.js detectado");
      throw e;
    }

    console.error("❌ [LOGIN ACTION] Erro completo:", e);
    console.error("❌ [LOGIN ACTION] Tipo do erro:", e?.type);
    console.error("❌ [LOGIN ACTION] Mensagem:", e?.message);

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
        case "CallbackRouteError":
          return {
            success: false,
            message: t.credentials,
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
