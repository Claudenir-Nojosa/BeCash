// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "@auth/prisma-adapter"; // ← Mude para @auth/prisma-adapter
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
        email: { label: "Email", type: "email" }, // ← Adicione labels para v5
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios");
        }
        
        const user = await findUserByCredentials(
          credentials.email as string,
          credentials.password as string
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

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
      }
      
      // Adicione suporte para atualização de sessão
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }
      
      return token;
    },

    async session({ session, token }) {
      const userId = token.sub || token.id;

      if (session.user && userId) {
        session.user.id = userId as string;

        try {
          const user = await prisma.user.findUnique({
            where: { id: userId as string },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              subscriptionStatus: true,
            },
          });

          if (user) {
            session.user.id = user.id;
            session.user.name = user.name;
            session.user.email = user.email;
            session.user.image = user.image;
            (session.user as any).subscriptionStatus = user.subscriptionStatus;
          }
        } catch (error) {
          console.error("Erro ao buscar usuário na session:", error);
        }
      }

      
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
});