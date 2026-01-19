"use server";

import db from "@/lib/db";
import { hashSync } from "bcrypt-ts";
import { redirect } from "next/navigation";

// Interface para as mensagens de erro
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

// Mensagens traduzidas por idioma
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
  es: {
    success: "¡Registro exitoso! Redirigiendo...",
    error: {
      required: "Por favor, complete todos los campos",
      email: "Por favor, ingrese un correo electrónico válido",
      password: "La contraseña debe tener al menos 6 caracteres",
      duplicate: "Este correo electrónico ya está registrado",
      generic: "Ocurrió un error durante el registro. Por favor, inténtelo de nuevo.",
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

  // Determinar o idioma (padrão: pt)
  const lang = data.lang || "pt";
  const t = messages[lang as keyof typeof messages] || messages.pt;

  try {
    // Validação básica dos campos
    if (!data.email || !data.name || !data.password) {
      return {
        message: t.error.required,
        success: false,
        lang: lang,
      };
    }

    // Validação do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return {
        message: t.error.email,
        success: false,
        lang: lang,
      };
    }

    // Validação da senha
    if (data.password.length < 6) {
      return {
        message: t.error.password,
        success: false,
        lang: lang,
      };
    }

    // Verificar se usuário já existe
    const existingUser = await db.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingUser) {
      return {
        message: t.error.duplicate,
        success: false,
        lang: lang,
      };
    }

    // Criar novo usuário
    const newUser = await db.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        password: hashSync(data.password),
        // Adicione outros campos se necessário
        // language: lang, // Você pode salvar o idioma do usuário
      },
    });

    console.log("------ Server Action - Registrar Usuário ------");
    console.log({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      lang: lang,
    });

    // Retornar sucesso antes do redirect
    return {
      message: t.success,
      success: true,
      lang: lang,
      userId: newUser.id,
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

// Função auxiliar para redirecionamento após sucesso
// (Esta seria chamada no cliente após receber a resposta de sucesso)
export async function redirectAfterSuccess(lang: string = "pt") {
  redirect(`/${lang}/dashboard`);
}