import { compareSync } from "bcrypt-ts";
import db from "./db";

type User = {
  email: string;
  password?: string;
  name: string;
  id: string;
};

export async function findUserByCredentials(
  email: string,
  password: string
): Promise<User | null> {
  const user = await db.usuario.findFirst({
    where: {
      email: email,
    },
  });

  // Se o usuário não for encontrado, retorne null
  if (!user) {
    return null;
  }

  // Verifique se user.password não é null
  if (!user.password) {
    return null; // Ou você pode lançar um erro, dependendo do seu caso de uso
  }

  // Compare a senha fornecida com o hash armazenado
  const passwordMatch = compareSync(password, user.password);

  // Se as senhas coincidirem, retorne o usuário
  if (passwordMatch) {
    return { email: user.email, name: user.name, id: user.id };
  }

  // Se as senhas não coincidirem, retorne null
  return null;
}