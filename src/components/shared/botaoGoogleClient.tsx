// components/BotaoGoogleClient.tsx
"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import { Button } from "../ui/button";

// Defina as props do componente
interface BotaoGoogleClientProps {
  lang?: string;
}

export default function BotaoGoogleClient({ lang = "pt" }: BotaoGoogleClientProps) {
  const handleGoogleSignIn = () => {
    signIn("google", {
      callbackUrl: `/${lang}/dashboard`, // Adicionar callbackUrl com linguagem
    });
  };

  return (
    <div className="flex items-center justify-center">
      <Button
        onClick={handleGoogleSignIn}
        variant={"outline"}
        className="flex items-center gap-2 px-4 py-2 border rounded-lg text-slate-600 shadow-md"
      >
        <Image src="/google.svg" alt="Google" height={25} width={25} />
        <p className="text-sm font-medium">Continue com Google</p>
      </Button>
    </div>
  );
}