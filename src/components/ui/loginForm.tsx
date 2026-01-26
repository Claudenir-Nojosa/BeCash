// components/ui/loginForm.tsx
"use client";

import loginAction from "@/app/[lang]/(auth)/login/loginAction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Form from "next/form";
import { useActionState } from "react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Icons } from "./loadingSpinner";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import Link from "next/link";

interface LoginFormProps {
  lang?: string;
}

export default function LoginForm({ lang }: LoginFormProps) {
  const params = useParams();
  const { t } = useTranslation("auth");

  const currentLang = lang || (params?.lang as string) || "pt";

  console.log("🔍 [LOGIN FORM] currentLang:", currentLang);

  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [hasShownToast, setHasShownToast] = useState(false);

  const handleFormAction = (formData: FormData) => {
    console.log("🔍 [LOGIN FORM] Enviando lang:", currentLang);
    formData.append("lang", currentLang);
    formAction(formData);
  };

  useEffect(() => {
    if (state) {
      console.log("🔍 [LOGIN FORM] State recebido:", state);
      
      // Mostrar toast apenas para erros
      if (state.success === false && !hasShownToast) {
        toast.error(state.message);
        setHasShownToast(true);
      }
      
      // Se foi bem sucedido, não fazer nada - o redirect server-side vai acontecer
      if (state.success === true) {
        console.log("✅ [LOGIN FORM] Login bem sucedido, aguardando redirect...");
        // Não mostrar toast de sucesso nem redirecionar aqui
        // O redirect server-side no loginAction já cuidará disso
      }
    }
  }, [state, hasShownToast]);

  useEffect(() => {
    if (!isPending) {
      setHasShownToast(false);
    }
  }, [isPending]);

  return (
    <Form action={handleFormAction}>
      <input type="hidden" name="lang" value={currentLang} />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("labels.email")}
          </Label>
          <Input
            type="email"
            name="email"
            placeholder={t("placeholders.email")}
            className="w-full"
            required
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("labels.password")}
            </Label>
            <Link
              href={`/${currentLang}/forgot-password`}
              className="text-xs text-[#007cca] dark:text-[#00cfec] hover:underline"
            >
              {t("links.forgotPassword")}
            </Link>
          </div>
          <Input
            type="password"
            name="password"
            placeholder={t("placeholders.password")}
            className="w-full"
            required
            disabled={isPending}
          />
        </div>

        <Button
          className="w-full mt-2 bg-gradient-to-r from-[#00cfec] to-[#007cca] hover:from-[#00cfec]/90 hover:to-[#007cca]/90 text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              {t("buttons.signInLoading", "Entrando...")}
            </>
          ) : (
            t("buttons.signIn")
          )}
        </Button>
      </div>
    </Form>
  );
}