"use client";

import { Button } from "@/components/ui/button";
import Form from "next/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import registerAction from "@/app/(auth)/cadastro/registerAction";
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
            className="w-full mt-6 hover:bg-red-400/85 bg-red-400"
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
