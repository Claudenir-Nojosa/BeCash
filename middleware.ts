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
  "/api/webhooks/stripe",
];

// Rotas de onboarding
const onboardingRoutes = ["/login/onboarding"];

// Rotas que precisam de onboarding completo
const protectedAfterOnboarding = [
  "/dashboard",
  "/lancamentos",
  "/metas",
  "/cartoes",
  "/faturas",
  "/relatorios",
  "/configuracoes",
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
  return routeList.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

// Helper para detectar locale preferido
function getPreferredLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get("accept-language") || "";
  return acceptLanguage.toLowerCase().startsWith("en") ? "en" : defaultLocale;
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith("/api/")) {
      console.log(
        `✅ [MIDDLEWARE] Ignorando completamente rota de API: ${pathname}`,
      );
      // Crie uma nova resposta sem nenhum redirecionamento
      const response = NextResponse.next();
      // Adicione headers se necessário
      response.headers.set("x-middleware-cache", "no-cache");
      return response;
    }

    // Ignorar arquivos estáticos e APIs
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/static") ||
      pathname.includes(".") // Arquivos com extensão
    ) {
      return NextResponse.next();
    }

    // Extrair locale atual (se houver)
    const currentLocale = getLocaleFromPath(pathname);
    const pathWithoutLocale = removeLocaleFromPath(pathname);

    // 1. CASO ESPECIAL: Rota raiz sem locale
    if (pathname === "/") {
      const preferredLocale = getPreferredLocale(request);

      const redirectUrl = new URL(`/${preferredLocale}`, request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // 2. Se não tem locale em rotas não-raiz, adicionar locale
    if (!currentLocale && pathname !== "/") {
      const preferredLocale = getPreferredLocale(request);
      const redirectUrl = new URL(
        `/${preferredLocale}${pathname}`,
        request.url,
      );
      return NextResponse.redirect(redirectUrl);
    }

    // A partir daqui, temos certeza que há um locale na URL
    const locale = currentLocale as string;

    // 3. Se está na raiz com locale (ex: /pt ou /en)
    if (pathname === `/${locale}`) {
      let session = null;
      let isAuthenticated = false;
      let onboardingCompleto = false;

      try {
        session = await auth();
        isAuthenticated = !!session?.user;
        onboardingCompleto =
          (session?.user as any)?.onboardingCompleto || false;

        console.log("🔍 [MIDDLEWARE] Rota raiz com locale:", pathname);
        console.log("🔍 [MIDDLEWARE] isAuthenticated:", isAuthenticated);
        console.log("🔍 [MIDDLEWARE] User email:", session?.user?.email);
      } catch (error) {
        console.error("❌ [MIDDLEWARE] Erro ao verificar autenticação:", error);
      }

      if (!onboardingCompleto) {
        console.log("➡️ [MIDDLEWARE] Redirecionando para onboarding");
        return NextResponse.redirect(
          new URL(`/${locale}/login/onboarding`, request.url),
        );
      }

      console.log("➡️ [MIDDLEWARE] Redirecionando para dashboard");
      return NextResponse.redirect(
        new URL(`/${locale}/dashboard`, request.url),
      );
    }

    // 4. Para outras rotas com locale, verificar autenticação/onboarding
    let session = null;
    let isAuthenticated = false;
    let onboardingCompleto = false;

    try {
      session = await auth();
      isAuthenticated = !!session?.user;
      onboardingCompleto = (session?.user as any)?.onboardingCompleto || false;

      console.log("🔍 [MIDDLEWARE] Session check para:", pathname);
      console.log("🔍 [MIDDLEWARE] isAuthenticated:", isAuthenticated);
      console.log("🔍 [MIDDLEWARE] onboardingCompleto:", onboardingCompleto);
    } catch (error) {
      console.error("❌ [MIDDLEWARE] Erro ao verificar autenticação:", error);
    }

    const isPublicRoute = isRouteInList(pathWithoutLocale, publicRoutes);
    const isOnboardingRoute = isRouteInList(
      pathWithoutLocale,
      onboardingRoutes,
    );
    const isProtectedRoute = isRouteInList(
      pathWithoutLocale,
      protectedAfterOnboarding,
    );

    console.log("🔍 [MIDDLEWARE] Verificando rota:", pathname);
    console.log("🔍 [MIDDLEWARE] pathWithoutLocale:", pathWithoutLocale);
    console.log("🔍 [MIDDLEWARE] isPublicRoute:", isPublicRoute);
    console.log("🔍 [MIDDLEWARE] isAuthenticated:", isAuthenticated);
    console.log("🔍 [MIDDLEWARE] User email:", session?.user?.email);

    // Se é rota pública e usuário está autenticado, redirecionar
    if (isPublicRoute && isAuthenticated) {
      const redirectPath = onboardingCompleto
        ? `/${locale}/dashboard`
        : `/${locale}/login/onboarding`;
      console.log(
        "➡️ [MIDDLEWARE] Usuário autenticado em rota pública, redirecionando para:",
        redirectPath,
      );
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    // Se não é rota pública e usuário não está autenticado, redirecionar para login
    if (!isPublicRoute && !isAuthenticated) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      console.log(
        "➡️ [MIDDLEWARE] Usuário não autenticado em rota protegida, redirecionando para:",
        loginUrl.toString(),
      );
      return NextResponse.redirect(loginUrl);
    }

    // Se está autenticado, verificar onboarding
    if (isAuthenticated) {
      // Se está em onboarding mas já completou, redirecionar para dashboard
      if (isOnboardingRoute && onboardingCompleto) {
        return NextResponse.redirect(
          new URL(`/${locale}/dashboard`, request.url),
        );
      }

      // Se não completou onboarding e tenta acessar rota protegida
      if (!onboardingCompleto && isProtectedRoute && !isOnboardingRoute) {
        return NextResponse.redirect(
          new URL(`/${locale}/login/onboarding`, request.url),
        );
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Erro no middleware:", error);
    // Em caso de erro, tentar redirecionar para login com locale padrão
    return NextResponse.redirect(
      new URL(`/${defaultLocale}/login`, request.url),
    );
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
