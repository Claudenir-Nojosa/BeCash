// components/ui/registerForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import Form from "next/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import registerAction from "@/app/[lang]/(auth)/signup/registerAction";
import { Toaster, toast } from "sonner";
import { useActionState } from "react";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icons } from "./loadingSpinner";
import { useTranslation } from "react-i18next";
import { signIn } from "next-auth/react";
import { getFallback } from "@/lib/i18nFallback";

interface RegisterFormProps {
  lang?: string;
}

export default function RegisterForm({ lang }: RegisterFormProps) {
  const params = useParams();
  const { t } = useTranslation("register");
  const currentLang = lang || (params?.lang as string) || "pt";
  
  // Função auxiliar para obter tradução com fallback
  const getTranslation = (key: string) => {
    // Primeiro tenta usar o i18n
    const translation = t(key);
    if (translation && translation !== key) {
      return translation;
    }

    // Fallback manual baseado nas chaves
    switch (key) {
      // Labels e placeholders
      case "formulario.nome":
        return getFallback(currentLang, "Nome", "Name");
      case "formulario.placeholderNome":
        return getFallback(currentLang, "Fulano de Tal", "John Doe");
      
      case "formulario.email":
        return getFallback(currentLang, "Email", "Email");
      case "formulario.placeholderEmail":
        return getFallback(currentLang, "eu@exemplo.com", "you@example.com");
      
      case "formulario.senha":
        return getFallback(currentLang, "Senha", "Password");
      case "formulario.placeholderSenha":
        return getFallback(currentLang, "********", "********");
      case "formulario.dicaSenha":
        return getFallback(currentLang, "Mínimo 6 caracteres", "Minimum 6 characters");
      
      // Botões
      case "botoes.registrar":
        return getFallback(currentLang, "Registrar", "Register");
      case "botoes.registrando":
        return getFallback(currentLang, "Registrando...", "Registering...");
      
      // Mensagens de sucesso/erro
      case "mensagens.sucesso":
        return getFallback(currentLang, "Registro realizado com sucesso! Redirecionando...", "Registration successful! Redirecting...");
      case "mensagens.erroDuplicado":
        return getFallback(currentLang, "Este email já está cadastrado", "This email is already registered");
      case "mensagens.erroGenerico":
        return getFallback(currentLang, "Ocorreu um erro ao registrar. Tente novamente.", "An error occurred during registration. Please try again.");
      case "mensagens.registroConcluido":
        return getFallback(currentLang, "Registro concluído! Faça login para continuar.", "Registration completed! Please log in to continue.");
      case "mensagens.erroLoginAuto":
        return getFallback(currentLang, "Erro no login automático", "Error in automatic login");
      
      default:
        return key;
    }
  };

  // Criar objeto de traduções
  const translations = {
    formulario: {
      nome: getTranslation("formulario.nome"),
      placeholderNome: getTranslation("formulario.placeholderNome"),
      email: getTranslation("formulario.email"),
      placeholderEmail: getTranslation("formulario.placeholderEmail"),
      senha: getTranslation("formulario.senha"),
      placeholderSenha: getTranslation("formulario.placeholderSenha"),
      dicaSenha: getTranslation("formulario.dicaSenha"),
    },
    botoes: {
      registrar: getTranslation("botoes.registrar"),
      registrando: getTranslation("botoes.registrando"),
    },
    mensagens: {
      sucesso: getTranslation("mensagens.sucesso"),
      erroDuplicado: getTranslation("mensagens.erroDuplicado"),
      erroGenerico: getTranslation("mensagens.erroGenerico"),
      registroConcluido: getTranslation("mensagens.registroConcluido"),
      erroLoginAuto: getTranslation("mensagens.erroLoginAuto"),
    },
  };

  const [state, formAction, isPending] = useActionState(registerAction, null);
  const [hasShownToast, setHasShownToast] = useState(false);
  const router = useRouter();

  const handleFormAction = (formData: FormData) => {
    formData.append("lang", currentLang);
    formAction(formData);
  };

  // 🆕 Função para login automático após registro
  const handleAutoLogin = async (email: string, password: string) => {
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        console.error("Erro no login automático:", result.error);
        toast.error(translations.mensagens.registroConcluido);
        // Redirecionar para página de login
        setTimeout(() => {
          router.push(
            `/${currentLang}/login?email=${encodeURIComponent(email)}`,
          );
        }, 2000);
      } else {
        setTimeout(() => {
          router.push(`/${currentLang}/login/onboarding`);
        }, 1500);
      }
    } catch (error) {
      console.error("Erro no login automático:", error);
      toast.error(translations.mensagens.registroConcluido);
      setTimeout(() => {
        router.push(`/${currentLang}/login?email=${encodeURIComponent(email)}`);
      }, 2000);
    }
  };

  useEffect(() => {
    if (state && !hasShownToast) {
      if (state.success === false) {
        toast.error(state.message);
        setHasShownToast(true);
      } else if (state.success === true) {
        toast.success(translations.mensagens.sucesso);
        setHasShownToast(true);

        // 🆕 Se registro foi bem-sucedido, fazer login automático
        if (state.email && state.password) {
          // Aguarda um pouco para o usuário ver a mensagem de sucesso
          setTimeout(() => {
            handleAutoLogin(state.email, state.password);
          }, 1000);
        } else {
          // Fallback: redirecionar para login
          setTimeout(() => {
            router.push(`/${state.lang || currentLang}/login`);
          }, 2000);
        }
      }
    }
  }, [state, hasShownToast, router, currentLang, translations.mensagens]);

  useEffect(() => {
    if (!isPending) {
      setHasShownToast(false);
    }
  }, [isPending]);

  return (
    <>
      <Form action={handleFormAction}>
        <input type="hidden" name="lang" value={currentLang} />

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {translations.formulario.nome}
            </Label>
            <Input
              type="text"
              name="name"
              placeholder={translations.formulario.placeholderNome}
              className="w-full"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {translations.formulario.email}
            </Label>
            <Input
              type="email"
              name="email"
              placeholder={translations.formulario.placeholderEmail}
              className="w-full"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {translations.formulario.senha}
            </Label>
            <Input
              type="password"
              name="password"
              placeholder={translations.formulario.placeholderSenha}
              className="w-full"
              required
              disabled={isPending}
              minLength={6}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {translations.formulario.dicaSenha}
            </p>
          </div>

          <Button
            className="w-full mt-4 bg-gradient-to-r from-[#00cfec] to-[#007cca] hover:from-[#00cfec]/90 hover:to-[#007cca]/90 text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                {translations.botoes.registrando}
              </>
            ) : (
              translations.botoes.registrar
            )}
          </Button>
        </div>
      </Form>
    </>
  );
}