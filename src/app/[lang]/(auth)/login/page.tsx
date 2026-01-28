// app/[lang]/login/page.tsx
import LoginForm from "@/components/ui/loginForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { redirect } from "next/navigation";
import BotaoGoogleServer from "@/components/shared/botaoGoogleServer";
import { auth } from "../../../../../auth";
import ClientLoginPage from "./client-login-page";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  const session = await auth();

  // Se já está autenticado, SEMPRE redirecionar para dashboard
  if (session?.user) {
    console.log("🔄 [LOGIN PAGE SERVER] Usuário já autenticado, redirecionando para dashboard");
    redirect(`/${lang}/dashboard`);
  }


  // Mensagens traduzidas por idioma
  const translations = {
    pt: {
      title: "BeCash",
      description: "Faça seu login com email e senha.",
      orDivider: "ou",
      noAccount: "Não tem uma conta?",
      signUpLink: "Cadastre-se",
    },
    en: {
      title: "BeCash",
      description: "Sign in with your email and password.",
      orDivider: "or",
      noAccount: "Don't have an account?",
      signUpLink: "Sign up",
    },
  };

  const t = translations[lang as keyof typeof translations] || translations.pt;

  return (
    <ClientLoginPage lang={lang} />
  );
}