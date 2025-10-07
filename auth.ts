// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { findUserByCredentials } from "@/lib/user";
import { AuthError } from "next-auth";

const prisma = new PrismaClient();

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const user = await findUserByCredentials(
          credentials.email as string,
          credentials.password as string
        );
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

    async jwt({ token, user, account, profile }) {
      console.log("JWT callback - user:", user);

      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      console.log("Session callback - token.sub:", token.sub);
      console.log("Session callback - session.user ANTES:", session.user);

      // Garantir que temos um ID válido
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

          console.log("Usuário encontrado no banco:", user);

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

      console.log("Session callback - session.user DEPOIS:", session.user);
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
  // ADICIONE ESTAS CONFIGURAÇÕES:
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
});
