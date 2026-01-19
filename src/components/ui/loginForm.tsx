"use client";

import loginAction from "@/app/[lang]/(auth)/login/loginAction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Form from "next/form";
import { useActionState } from "react";
import { Toaster, toast } from "sonner";
import { useState, useEffect } from "react";
import { Icons } from "./loadingSpinner";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import Link from "next/link";

// Defina as props do componente
interface LoginFormProps {
  lang?: string; // Propriedade opcional
}

export default function LoginForm({ lang }: LoginFormProps) {
  const params = useParams();
  const { t } = useTranslation("auth");
  
  // Usar a prop lang se fornecida, caso contrário extrair dos params
  const currentLang = lang || (params?.lang as string) || "pt";
  
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [hasShownToast, setHasShownToast] = useState(false);
  const router = useRouter();

  // Adicionar linguagem ao FormData
  const handleFormAction = (formData: FormData) => {
    formData.append("lang", currentLang); // Adicionar linguagem ao FormData
    formAction(formData);
  };

  useEffect(() => {
    if (state && !hasShownToast) {
      if (state.success === false) {
        toast.error(state.message);
        setHasShownToast(true);
      } else if (state.success === true) {
        toast.success(state.message);
        setHasShownToast(true);

        // Aguarda um tempo para mostrar o toast e depois redireciona
        setTimeout(() => {
          // Redirecionar para dashboard com linguagem correta
          router.push(`/${state.lang || currentLang}/dashboard`);
        }, 1500);
      }
    }
  }, [state, hasShownToast, router, currentLang]);

  useEffect(() => {
    if (!isPending) {
      setHasShownToast(false);
    }
  }, [isPending]);

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          className: "font-sans",
          duration: 4000,
        }}
      />
      
      <Form action={handleFormAction}>
        {/* Adicionar campo hidden para linguagem */}
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
    </>
  );
}