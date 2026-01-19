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

interface RegisterFormProps {
  lang?: string;
}

export default function RegisterForm({ lang }: RegisterFormProps) {
  const params = useParams();
  const { t } = useTranslation("register");

  const currentLang = lang || (params?.lang as string) || "pt";

  const [state, formAction, isPending] = useActionState(registerAction, null);
  const [hasShownToast, setHasShownToast] = useState(false);
  const router = useRouter();

  const handleFormAction = (formData: FormData) => {
    formData.append("lang", currentLang);
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

        // Redirecionar após sucesso
        setTimeout(() => {
          router.push(`/${state.lang || currentLang}/dashboard`);
        }, 2000);
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
        <input type="hidden" name="lang" value={currentLang} />

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("fields.name.label")}
            </Label>
            <Input 
              type="text" 
              name="name" 
              placeholder={t("fields.name.placeholder")}
              className="w-full"
              required
              disabled={isPending}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("fields.email.label")}
            </Label>
            <Input 
              type="email" 
              name="email" 
              placeholder={t("fields.email.placeholder")}
              className="w-full"
              required
              disabled={isPending}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("fields.password.label")}
            </Label>
            <Input 
              type="password" 
              name="password" 
              placeholder={t("fields.password.placeholder")}
              className="w-full"
              required
              disabled={isPending}
              minLength={6}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("fields.password.hint", "Mínimo 6 caracteres")}
            </p>
          </div>
          
          <Button
            className="w-full mt-4 bg-gradient-to-r from-[#00cfec] to-[#007cca] hover:from-[#00cfec]/90 hover:to-[#007cca]/90 text-white font-medium transition-all duration-300"
            type="submit"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                {t("buttons.registering")}
              </>
            ) : (
              t("buttons.register")
            )}
          </Button>
        </div>
      </Form>
    </>
  );
}