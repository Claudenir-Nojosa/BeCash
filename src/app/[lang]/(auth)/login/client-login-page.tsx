// app/[lang]/login/client-login-page.tsx
"use client";

import LoginForm from "@/components/ui/loginForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import BotaoGoogleServer from "@/components/shared/botaoGoogleServer";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getFallback } from "@/lib/i18nFallback";

interface ClientLoginPageProps {
  lang: string;
}

export default function ClientLoginPage({ lang }: ClientLoginPageProps) {
  const { t } = useTranslation("auth");
  const currentLang = lang || "pt";
  
  // Função auxiliar para obter tradução com fallback
  const getTranslation = (key: string) => {
    // Primeiro tenta usar o i18n
    const translation = t(key);
    if (translation && translation !== key) {
      return translation;
    }

    // Fallback manual baseado nas chaves
    switch (key) {
      // Títulos e descrições
      case "paginaLogin.titulo":
        return getFallback(currentLang, "Acesse sua conta", "Access your account");
      case "paginaLogin.descricao":
        return getFallback(currentLang, "Entre para gerenciar suas finanças", "Sign in to manage your finances");
      case "paginaLogin.ou":
        return getFallback(currentLang, "Ou continue com", "Or continue with");
      case "paginaLogin.semConta":
        return getFallback(currentLang, "Não tem uma conta?", "Don't have an account?");
      case "paginaLogin.cadastrar":
        return getFallback(currentLang, "Cadastre-se", "Sign up");

      // Loading states
      case "status.verificando":
        return getFallback(currentLang, "Verificando...", "Checking...");

      default:
        return key;
    }
  };

  // Criar objeto de traduções
  const translations = {
    titulo: getTranslation("paginaLogin.titulo"),
    descricao: getTranslation("paginaLogin.descricao"),
    ou: getTranslation("paginaLogin.ou"),
    semConta: getTranslation("paginaLogin.semConta"),
    cadastrar: getTranslation("paginaLogin.cadastrar"),
    verificando: getTranslation("status.verificando"),
  };

  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    // Se já está autenticado no cliente, redirecionar
    if (session?.user) {
      const onboardingCompleto = (session.user as any).onboardingCompleto || false;
      const redirectTo = onboardingCompleto 
        ? `/${currentLang}/dashboard`
        : `/${currentLang}/login/onboarding`;
      
      console.log("🔄 [LOGIN PAGE CLIENT] Usuário já autenticado, redirecionando para:", redirectTo);
      router.push(redirectTo);
    }
  }, [session, status, router, currentLang]);

  // Mostrar loading enquanto verifica a sessão
  if (status === "loading" || session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-blue-100 border-t-blue-600 dark:border-gray-800 dark:border-t-blue-500"></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
            {translations.verificando}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="isolate">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          >
            <div
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
              className="relative left-[calc(0%-11rem)] aspect-[1155/678] w-[36.600rem] -translate-x-1/2 rotate-[210deg] bg-gradient-to-br from-[#00cfec] via-[#007cca] to-[#00cfec] opacity-20 sm:left-[calc(46%-30rem)] sm:w-[102.1875rem]"
            />
          </div>
        </div>
      </div>
      
      <Card className="max-w-sm w-full rounded-2xl mt-12 border-gray-200 dark:border-gray-800 shadow-xl">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            {translations.titulo}
          </CardTitle>
          <CardDescription className="text-center text-gray-600 dark:text-gray-400">
            {translations.descricao}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <LoginForm lang={currentLang} />
          
          <div className="flex flex-col w-full justify-center items-center">
            <div className="mx-auto my-4 flex w-full items-center justify-evenly before:mr-4 before:block before:h-px before:flex-grow before:bg-gray-300 dark:before:bg-gray-700 after:ml-4 after:block after:h-px after:flex-grow after:bg-gray-300 dark:after:bg-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400 px-2">
                {translations.ou}
              </span>
            </div>
            
            <div className="gap-3 flex flex-col mt-2 w-full">
              <BotaoGoogleServer lang={currentLang} />
              <div className="flex gap-5 w-full items-center"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-gray-600 dark:text-gray-400 mt-6 text-center">
        {translations.semConta}{" "}
        <Link 
          className="text-[#007cca] dark:text-[#00cfec] font-medium hover:underline transition-all" 
          href={`/${currentLang}/signup`}
        >
          {translations.cadastrar}
        </Link>
      </p>
    </>
  );
}