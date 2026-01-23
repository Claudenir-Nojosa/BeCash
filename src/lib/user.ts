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
  console.log("🔍 [FIND USER] ==================== INÍCIO ====================");
  console.log("🔍 [FIND USER] Email recebido:", email);
  console.log("🔍 [FIND USER] Senha recebida:", password ? "***" : "VAZIO");

  try {
    console.log("🔍 [FIND USER] Consultando banco de dados...");
    
    const user = await db.user.findFirst({
      where: {
        email: email,
      },
    });

    console.log("🔍 [FIND USER] Usuário encontrado:", !!user);

    // Se o usuário não for encontrado, retorne null
    if (!user) {
      console.log("❌ [FIND USER] Usuário NÃO existe no banco");
      return null;
    }

    console.log("🔍 [FIND USER] Detalhes do usuário:", {
      id: user.id,
      email: user.email,
      name: user.name,
      hasPassword: !!user.password,
      passwordLength: user.password?.length || 0,
    });

    // Verifique se user.password não é null
    if (!user.password) {
      console.log("❌ [FIND USER] Usuário não tem senha (login social)");
      return null;
    }

    console.log("🔍 [FIND USER] Comparando senhas...");
    console.log("🔍 [FIND USER] Hash armazenado (primeiros 20 chars):", user.password.substring(0, 20) + "...");

    // Compare a senha fornecida com o hash armazenado
    const passwordMatch = compareSync(password, user.password);

    console.log("🔍 [FIND USER] Resultado da comparação:", passwordMatch);

    // Se as senhas coincidirem, retorne o usuário
    if (passwordMatch) {
      console.log("✅ [FIND USER] Login bem-sucedido!");
      console.log("🔍 [FIND USER] ==================== FIM ====================");
      return { email: user.email, name: user.name, id: user.id };
    }

    // Se as senhas não coincidirem, retorne null
    console.log("❌ [FIND USER] Senha INCORRETA");
    console.log("🔍 [FIND USER] ==================== FIM ====================");
    return null;
  } catch (error) {
    console.error("❌ [FIND USER] ERRO FATAL:", error);
    console.log("🔍 [FIND USER] ==================== FIM (COM ERRO) ====================");
    return null;
  }
}