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
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [redirecting, setRedirecting] = useState(false);
  const [checkedOnboarding, setCheckedOnboarding] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    console.log("🔍 [AUTH GUARD] Status:", status);
    console.log("🔍 [AUTH GUARD] Session:", session?.user?.email);
    console.log("🔍 [AUTH GUARD] Pathname:", pathname);
  }, [status, session, pathname]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!session && !redirecting) {
      setRedirecting(true);
      const locale = pathname?.split("/")[1] || "pt";
      const loginUrl = `/${locale}/login`;

      console.log("❌ [AUTH GUARD] Sem sessão, redirecionando para:", loginUrl);
      setTimeout(() => {
        router.push(loginUrl);
      }, 500);
      return;
    }

    if (session && !checkedOnboarding && !redirecting) {
      const checkOnboarding = async () => {
        try {
          console.log("📋 [AUTH GUARD] Verificando onboarding...");
          const response = await fetch("/api/usuarios/me");

          if (response.ok) {
            const data = await response.json();
            setUserData(data);

            if (!data.onboardingCompleto) {
              setRedirecting(true);
              console.log(
                "🚀 [AUTH GUARD] Onboarding incompleto, redirecionando...",
              );
              setTimeout(() => {
                router.push("/pt/login/onboarding");
              }, 500);
              return;
            }

            console.log("✅ [AUTH GUARD] Onboarding completo");
            setCheckedOnboarding(true);
          }
        } catch (error) {
          console.error("❌ [AUTH GUARD] Erro ao verificar onboarding:", error);
          setCheckedOnboarding(true);
        }
      };

      checkOnboarding();
    }
  }, [session, status, router, pathname, redirecting, checkedOnboarding]);

  // Loading state
  if (status === "loading") {
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

  // Se está redirecionando para onboarding
  if (redirecting) {
    return <RedirectingScreen />;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
