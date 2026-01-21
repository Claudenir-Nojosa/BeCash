// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";


const locales = ["pt", "en"];
const defaultLocale = "pt";

// Rotas públicas (não precisam de autenticação)
const publicRoutes = [
  "/login",
  "/signup",
  "/forgot-password",
];

// Rotas de onboarding
const onboardingRoutes = ["/onboarding"];

// Rotas que precisam de onboarding completo
const protectedAfterOnboarding = [
  "/dashboard",
  "/lancamentos",
  "/metas",
  "/cartoes",
  "/faturas",
  "/relatorios",
  "/configuracoes"
];

// Helper para extrair locale da URL
function getLocaleFromPath(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && locales.includes(segments[0])) {
    return segments[0];
  }
  return null;
}

// Helper para remover locale da URL
function removeLocaleFromPath(pathname: string): string {
  for (const locale of locales) {
    if (pathname === `/${locale}`) {
      return "/";
    }
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.replace(`/${locale}`, "") || "/";
    }
  }
  return pathname;
}

// Helper para verificar se a rota corresponde a uma lista
function isRouteInList(pathname: string, routeList: string[]): boolean {
  return routeList.some(route => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    
    // Ignorar arquivos estáticos e APIs
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/static") ||
      pathname.startsWith("/api") ||
      pathname.includes(".") // Arquivos com extensão
    ) {
      return NextResponse.next();
    }

    // Detectar locale preferido do usuário
    const acceptLanguage = request.headers.get("accept-language") || "";
    const userLocale = acceptLanguage.startsWith("en") ? "en" : defaultLocale;
    
    // Extrair locale atual (se houver)
    const currentLocale = getLocaleFromPath(pathname);
    const pathWithoutLocale = removeLocaleFromPath(pathname);
    const locale = currentLocale || userLocale;

    // LOGICA PRINCIPAL DE REDIRECIONAMENTO
    
    // 1. Se não tem locale e não está na raiz, adicionar locale
    if (!currentLocale && pathname !== "/") {
      return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
    }

    // 2. Se está na raiz sem locale
    if (pathname === "/") {
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }

    // 3. Se está na raiz com locale (ex: /pt ou /en)
    if (currentLocale && pathname === `/${currentLocale}`) {
      // Verificar autenticação
      let session = null;
      let isAuthenticated = false;
      let onboardingCompleto = false;
      
      try {
        session = await auth();
        isAuthenticated = !!session?.user;
        onboardingCompleto = (session?.user as any)?.onboardingCompleto || false;
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        // Em caso de erro, tratar como não autenticado
      }

      if (!isAuthenticated) {
        return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
      }

      if (!onboardingCompleto) {
        return NextResponse.redirect(new URL(`/${locale}/onboarding`, request.url));
      }

      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }

    // 4. Para outras rotas com locale, verificar autenticação/onboarding
    if (currentLocale) {
      let session = null;
      let isAuthenticated = false;
      let onboardingCompleto = false;
      
      try {
        session = await auth();
        isAuthenticated = !!session?.user;
        onboardingCompleto = (session?.user as any)?.onboardingCompleto || false;
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
      }

      const isPublicRoute = isRouteInList(pathWithoutLocale, publicRoutes);
      const isOnboardingRoute = isRouteInList(pathWithoutLocale, onboardingRoutes);
      const isProtectedRoute = isRouteInList(pathWithoutLocale, protectedAfterOnboarding);

      // Se é rota pública e usuário está autenticado, redirecionar
      if (isPublicRoute && isAuthenticated) {
        const redirectPath = onboardingCompleto 
          ? `/${locale}/dashboard`
          : `/${locale}/onboarding`;
        return NextResponse.redirect(new URL(redirectPath, request.url));
      }

      // Se não é rota pública e usuário não está autenticado, redirecionar para login
      if (!isPublicRoute && !isAuthenticated) {
        const loginUrl = new URL(`/${locale}/login`, request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Se está autenticado, verificar onboarding
      if (isAuthenticated) {
        // Se está em onboarding mas já completou, redirecionar para dashboard
        if (isOnboardingRoute && onboardingCompleto) {
          return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
        }

        // Se não completou onboarding e tenta acessar rota protegida
        if (!onboardingCompleto && isProtectedRoute && !isOnboardingRoute) {
          return NextResponse.redirect(new URL(`/${locale}/onboarding`, request.url));
        }
      }
    }

    return NextResponse.next();
    
  } catch (error) {
    console.error("Erro no middleware:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};