import { NextRequest, NextResponse } from "next/server";

const locales = ["pt", "en"];
const defaultLocale = "pt";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Se já tiver idioma, não redireciona
  if (locales.some((locale) => pathname.startsWith(`/${locale}`))) {
    return NextResponse.next();
  }

  // Só na raiz "/"
  if (pathname === "/") {
    const acceptLanguage = request.headers.get("accept-language") || "";
    const locale = acceptLanguage.startsWith("en") ? "en" : defaultLocale;

    return NextResponse.redirect(
      new URL(`/${locale}`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
