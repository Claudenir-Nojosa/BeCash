// components/shared/AuthGuard.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, ReactNode } from "react";
import { Loading } from "../ui/loading-barrinhas";
import { RedirectingScreen } from "./RedirectingScreen";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    console.log("🔍 [AUTH GUARD] Status:", status);
    console.log("🔍 [AUTH GUARD] Session:", session?.user?.email);
    console.log("🔍 [AUTH GUARD] Pathname:", pathname);
    console.log("🔍 [AUTH GUARD] Onboarding:", (session?.user as any)?.onboardingCompleto);
  }, [status, session, pathname]);

  // Verificar se o usuário está autenticado
  useEffect(() => {
    if (status === "loading" || isChecking || initialCheckDone) {
      return;
    }

    const checkAuth = async () => {
      setIsChecking(true);
      
      // Se não há sessão, redirecionar para login
      if (!session) {
        console.log("❌ [AUTH GUARD] Sem sessão, redirecionando para login...");
        const locale = pathname?.split("/")[1] || "pt";
        const loginUrl = `/${locale}/login`;
        
        // Forçar atualização da sessão antes de redirecionar
        await update();
        
        setTimeout(() => {
          router.push(loginUrl);
        }, 500);
        return;
      }

      // Se tem sessão, verificar onboarding
      if (session.user) {
        const onboardingCompleto = (session.user as any).onboardingCompleto || false;
        const isOnboardingPage = pathname?.includes("/login/onboarding");
        const isLoginPage = pathname?.includes("/login") && !isOnboardingPage;

        console.log("📋 [AUTH GUARD] Verificando redirecionamentos:");
        console.log("  - Onboarding completo:", onboardingCompleto);
        console.log("  - É página de onboarding:", isOnboardingPage);
        console.log("  - É página de login:", isLoginPage);

        // Se está na página de login mas já está logado
        if (isLoginPage && session.user) {
          console.log("🔄 [AUTH GUARD] Já logado, redirecionando do login...");
          const locale = pathname?.split("/")[1] || "pt";
          const redirectTo = onboardingCompleto 
            ? `/${locale}/dashboard`
            : `/${locale}/login/onboarding`;
          
          setTimeout(() => {
            router.push(redirectTo);
          }, 500);
          return;
        }

        // Se onboarding não está completo e não está na página de onboarding
        if (!onboardingCompleto && !isOnboardingPage) {
          console.log("🚀 [AUTH GUARD] Redirecionando para onboarding...");
          const locale = pathname?.split("/")[1] || "pt";
          
          setTimeout(() => {
            router.push(`/${locale}/login/onboarding`);
          }, 500);
          return;
        }

        // Se onboarding está completo e está na página de onboarding
        if (onboardingCompleto && isOnboardingPage) {
          console.log("🏠 [AUTH GUARD] Redirecionando para dashboard...");
          const locale = pathname?.split("/")[1] || "pt";
          
          setTimeout(() => {
            router.push(`/${locale}/dashboard`);
          }, 500);
          return;
        }
      }

      setInitialCheckDone(true);
      setIsChecking(false);
    };

    checkAuth();
  }, [session, status, router, pathname, isChecking, initialCheckDone, update]);

  // Loading state
  if (status === "loading" || isChecking) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-blue-100 border-t-blue-600 dark:border-gray-800 dark:border-t-blue-500"></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
            Verificando autenticação...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}