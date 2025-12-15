"use client";

import { Button } from "@/components/ui/button";
import Form from "next/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import registerAction from "@/app/[lang]/(auth)/cadastro/registerAction";
import { Toaster, toast } from "sonner";
import { useActionState } from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "./loadingSpinner";

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, null);
  const [hasShownToast, setHasShownToast] = useState(false);
  const router = useRouter();
  useEffect(() => {
    if (state && !hasShownToast) {
      if (state.success === false) {
        toast.error(state.message);
        setHasShownToast(true);
      } else if (state.success === true) {
        toast.success(state.message);
        setHasShownToast(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 3200);
      }
    }
  }, [state, hasShownToast, router]);

  // Se apertar o botão, mudar para false e mostrar mais toasts
  useEffect(() => {
    if (!isPending) {
      setHasShownToast(false);
    }
  }, [isPending]);

  return (
    <>
      <Form action={formAction}>
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
            className="w-full mt-6 bg-gradient-to-r from-purple-400 to-fuchsia-500 hover:from-purple-300 hover:to-fuchsia-400 text-white font-medium rounded-md transition-all duration-300 shadow-[0_0_15px_-3px_rgba(217,70,239,0.4)] hover:shadow-[0_0_20px_-3px_rgba(217,70,239,0.6)]"
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
