// app/[locale]/signup/actions.ts (ou onde está seu registerAction)
"use server";

import db from "@/lib/db";
import { hashSync } from "bcrypt-ts";
import { redirect } from "next/navigation";

interface ErrorMessages {
  [key: string]: {
    success: string;
    error: {
      required: string;
      email: string;
      password: string;
      duplicate: string;
      generic: string;
    };
  };
}

const messages: ErrorMessages = {
  pt: {
    success: "Registro realizado com sucesso! Redirecionando...",
    error: {
      required: "Por favor, preencha todos os campos",
      email: "Por favor, insira um email válido",
      password: "A senha deve ter pelo menos 6 caracteres",
      duplicate: "Este email já está cadastrado",
      generic: "Ocorreu um erro ao registrar. Tente novamente.",
    },
  },
  en: {
    success: "Registration successful! Redirecting...",
    error: {
      required: "Please fill in all fields",
      email: "Please enter a valid email",
      password: "Password must be at least 6 characters",
      duplicate: "This email is already registered",
      generic: "An error occurred during registration. Please try again.",
    },
  },
};

export default async function registerAction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _prevState: any,
  formData: FormData
) {
  const entries = Array.from(formData.entries());
  const data = Object.fromEntries(entries) as {
    name: string;
    email: string;
    password: string;
    lang?: string;
  };

  const lang = data.lang || "pt";
  const t = messages[lang as keyof typeof messages] || messages.pt;

  try {
    // Validação básica
    if (!data.email || !data.name || !data.password) {
      return {
        message: t.error.required,
        success: false,
        lang: lang,
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return {
        message: t.error.email,
        success: false,
        lang: lang,
      };
    }

    if (data.password.length < 6) {
      return {
        message: t.error.password,
        success: false,
        lang: lang,
      };
    }

    // Verificar se usuário já existe
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return {
        message: t.error.duplicate,
        success: false,
        lang: lang,
      };
    }

    // 🆕 CRIAÇÃO DO USUÁRIO COM ONBOARDING INCOMPLETO
    const newUser = await db.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        password: hashSync(data.password),
        onboardingCompleto: false, // 🆕 IMPORTANTE: Novo usuário precisa fazer onboarding
        subscriptionStatus: "free",
        // Criar configurações padrão
        configuracoesUsuarios: {
          create: {
            idioma: lang === "en" ? "en-US" : "pt-BR",
          }
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        onboardingCompleto: true,
      }
    });

    console.log("------ Server Action - Registrar Usuário ------");
    console.log({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      onboardingCompleto: newUser.onboardingCompleto,
      lang: lang,
    });

    // 🆕 Não redirecionar aqui, vamos fazer login primeiro
    return {
      message: t.success,
      success: true,
      lang: lang,
      userId: newUser.id,
      email: newUser.email,
      password: data.password, // Para login automático
    };

  } catch (error) {
    console.error("Error in registerAction:", error);
    
    return {
      message: t.error.generic,
      success: false,
      lang: lang,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}