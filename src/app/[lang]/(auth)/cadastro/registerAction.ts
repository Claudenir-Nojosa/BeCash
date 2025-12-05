"use server";

import db from "@/lib/db";
import { hashSync } from "bcrypt-ts";
import { redirect } from "next/navigation";

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
  };

  // Se não tiver e-mail, nome ou senha, retornar erro
  if (!data.email || !data.name || !data.password) {
    return {
      message: "Preencha todos os campos",
      success: false,
    };
  }

  // Se um usuário já existe
  const user = await db.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (user) {
    return {
      message: "Este usuário já existe",
      success: false,
    };
  }

  // Se um usuário não existe
  const newUser = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashSync(data.password),
    },
  });

  console.log("------ Server Action - Registrar Usuário ------");
  console.log(data);


  redirect(`/dashboard`);
}