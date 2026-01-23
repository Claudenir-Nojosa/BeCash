// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { findUserByCredentials } from "@/lib/user";
import { AuthError } from "next-auth";

const prisma = new PrismaClient();

export const { handlers, signIn, signOut, auth } = NextAuth({
  // @ts-ignore - Ignorar erro de tipos temporariamente
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios");
        }

        const user = await findUserByCredentials(
          credentials.email as string,
          credentials.password as string,
        );

        if (!user) {
          throw new Error("Credenciais inválidas");
        }

        return user;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("SignIn callback - email:", profile?.email || user.email);

      if (account?.provider === "google") {
        const email = profile?.email || user.email;

        if (!email) {
          throw new AuthError("O e-mail é obrigatório para login com Google.");
        }

        try {
          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          console.log("Usuário existente encontrado:", existingUser);

          if (existingUser) {
            user.id = existingUser.id;

            // Usar casting para evitar erro de tipo
            (user as any).onboardingCompleto =
              existingUser.onboardingCompleto || false;

            const existingAccount = await prisma.account.findFirst({
              where: {
                userId: existingUser.id,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            });

            if (!existingAccount) {
              console.log("Vinculando conta Google ao usuário existente");
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                },
              });
            }
          }

          console.log("User ID final:", user.id);
          return true;
        } catch (error) {
          console.error("Erro no signIn callback:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.onboardingCompleto = (user as any).onboardingCompleto || false;
      }
      return token;
    },

    async session({ session, token }) {
      const userId = token.sub || token.id;

      if (session.user && userId) {
        session.user.id = userId as string;
        (session.user as any).onboardingCompleto =
          token.onboardingCompleto || false;

        try {
          const user = await prisma.user.findUnique({
            where: { id: userId as string },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              subscriptionStatus: true,
              onboardingCompleto: true,
            },
          });

          if (user) {
            session.user.id = user.id;
            session.user.name = user.name;
            session.user.email = user.email;
            session.user.image = user.image;
            (session.user as any).subscriptionStatus = user.subscriptionStatus;
            (session.user as any).onboardingCompleto = user.onboardingCompleto;
          }
        } catch (error) {
          console.error("Erro ao buscar usuário na session:", error);
        }
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      console.log("🔍 [AUTH REDIRECT] url:", url);
      console.log("🔍 [AUTH REDIRECT] baseUrl:", baseUrl);

      // Se a URL já contém locale (/pt ou /en), usar ela
      if (url.startsWith(`${baseUrl}/pt`) || url.startsWith(`${baseUrl}/en`)) {
        console.log("✅ [AUTH REDIRECT] URL já tem locale, retornando:", url);
        return url;
      }

      // Se é URL relativa com locale
      if (url.startsWith("/pt") || url.startsWith("/en")) {
        const finalUrl = `${baseUrl}${url}`;
        console.log("✅ [AUTH REDIRECT] URL relativa com locale:", finalUrl);
        return finalUrl;
      }

      // Se a URL começa com baseUrl mas não tem locale, extrair o path e adicionar locale
      if (url.startsWith(baseUrl)) {
        const path = url.replace(baseUrl, "");

        // Se o path já tem locale, retornar
        if (path.startsWith("/pt") || path.startsWith("/en")) {
          console.log("✅ [AUTH REDIRECT] Path já tem locale:", url);
          return url;
        }

        // Adicionar locale padrão
        const finalUrl = `${baseUrl}/pt${path || "/dashboard"}`;
        console.log("⚠️ [AUTH REDIRECT] Adicionando locale padrão:", finalUrl);
        return finalUrl;
      }

      // Para URLs relativas sem locale, adicionar locale padrão
      if (url.startsWith("/")) {
        const finalUrl = `${baseUrl}/pt${url}`;
        console.log("⚠️ [AUTH REDIRECT] URL relativa sem locale:", finalUrl);
        return finalUrl;
      }

      // Fallback: dashboard com locale padrão
      const fallbackUrl = `${baseUrl}/pt/dashboard`;
      console.log("⚠️ [AUTH REDIRECT] Fallback:", fallbackUrl);
      return fallbackUrl;
    },
  },
  pages: {
    signIn: "/pt/login", // ✅ COM LOCALE
    error: "/pt/login", // ✅ COM LOCALE
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
});
