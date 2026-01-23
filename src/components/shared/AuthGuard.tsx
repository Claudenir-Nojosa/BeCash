// components/shared/AuthGuard.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log("🔍 [AUTH GUARD] Status:", status);
    console.log("🔍 [AUTH GUARD] Session:", session?.user?.email);
    console.log("🔍 [AUTH GUARD] Pathname:", pathname);

    if (status === "loading") {
      console.log("⏳ [AUTH GUARD] Aguardando...");
      return;
    }

    if (!session) {
      // ✅ Extrair o locale do pathname atual
      const locale = pathname?.split("/")[1] || "pt";
      const loginUrl = `/${locale}/login`;

      console.log("❌ [AUTH GUARD] Sem sessão, redirecionando para:", loginUrl);
      router.push(loginUrl);
      return;
    }

    console.log("✅ [AUTH GUARD] Sessão válida");
  }, [session, status, router, pathname]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#007cca] dark:border-white mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
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
