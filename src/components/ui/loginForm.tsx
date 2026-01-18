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

// Defina as props do componente
interface LoginFormProps {
  lang?: string; // Propriedade opcional
}

export default function LoginForm({ lang }: LoginFormProps) {
  const params = useParams();
  
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
          router.push(`/${currentLang}/dashboard`);
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
      <Form action={handleFormAction}>
        {/* Adicionar campo hidden para linguagem */}
        <input type="hidden" name="lang" value={currentLang} />
        
        <div>
          <Label>Email</Label>
          <Input type="email" name="email" placeholder="eu@exemplo.com" />
        </div>
        <div>
          <Label>Senha</Label>
          <Input type="password" name="password" placeholder="********" />
        </div>
        <div>
          <Button className="w-full mt-6 bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-300 hover:to-indigo-400 text-white font-medium rounded-md transition-all duration-300 shadow-[0_0_15px_-3px_rgba(217,70,239,0.4)] hover:shadow-[0_0_20px_-3px_rgba(217,70,239,0.6)]" type="submit">
            {isPending ? (
              <Icons.spinner className="h-4 w-4 animate-spin" />
            ) : (
              <p>Login</p>
            )}
          </Button>
        </div>
      </Form>
    </>
  );
}