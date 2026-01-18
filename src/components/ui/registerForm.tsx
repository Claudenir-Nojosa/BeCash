"use client";

import { Button } from "@/components/ui/button";
import Form from "next/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import registerAction from "@/app/[lang]/(auth)/signup/registerAction";
import { Toaster, toast } from "sonner";
import { useActionState } from "react";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation"; // Adicione useParams
import { Icons } from "./loadingSpinner";

// Definir props do componente
interface RegisterFormProps {
  lang?: string;
}

export default function RegisterForm({ lang }: RegisterFormProps) {
  const params = useParams();

  // Usar a prop lang se fornecida, caso contrário extrair dos params
  const currentLang = lang || (params?.lang as string) || "pt";

  const [state, formAction, isPending] = useActionState(registerAction, null);
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

        // Redirecionar para dashboard com linguagem correta
        setTimeout(() => {
          router.push(`/${currentLang}/dashboard`);
        }, 3200);
      }
    }
  }, [state, hasShownToast, router, currentLang]);

  // Se apertar o botão, mudar para false e mostrar mais toasts
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
          <Label>Nome</Label>
          <Input type="text" name="name" placeholder="Fulano de Tal" />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" name="email" placeholder="eu@exemplo.com" />
        </div>
        <div>
          <Label>Senha</Label>
          <Input type="password" name="password" placeholder="********" />
        </div>
        <div>
          <Button
            className="w-full mt-6 bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-300 hover:to-indigo-400 text-white font-medium rounded-md transition-all duration-300 shadow-[0_0_15px_-3px_rgba(217,70,239,0.4)] hover:shadow-[0_0_20px_-3px_rgba(217,70,239,0.6)]"
            type="submit"
          >
            {isPending ? (
              <Icons.spinner className="h-4 w-4 animate-spin" />
            ) : (
              <p>Registrar</p>
            )}
          </Button>
        </div>
      </Form>
    </>
  );
}
