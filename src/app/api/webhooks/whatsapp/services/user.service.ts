// app/api/webhooks/whatsapp/services/user.service.ts
import db from "@/lib/db";
import { normalizarTelefone } from "../utils/validators";
import { UserSession } from "../types";

export class UserService {
  static async getUserByPhone(userPhone: string): Promise<UserSession | null> {
    try {
      console.log(`🔍 Buscando usuário para telefone: ${userPhone}`);

      const telefoneBusca = normalizarTelefone(userPhone);
      console.log(`🎯 Telefone para busca: ${telefoneBusca}`);

      const variacoesTelefone = [
        telefoneBusca,
        `+55${telefoneBusca}`,
        `55${telefoneBusca}`,
        telefoneBusca.replace(/^55/, ""),
        telefoneBusca.substring(2),
      ].filter((tel, index, self) => tel && self.indexOf(tel) === index);

      console.log(`🎯 Variações a buscar:`, variacoesTelefone);

      const usuario = await db.user.findFirst({
        where: {
          OR: variacoesTelefone.map((telefone) => ({ telefone })),
        },
        include: {
          configuracoesUsuarios: true,
        },
      });

      if (usuario) {
        console.log(`✅ Usuário encontrado: ${usuario.name} (${usuario.id})`);
        console.log(`📞 Telefone no banco: ${usuario.telefone}`);

        const idiomaPreferido = usuario.configuracoesUsuarios?.[0]?.idioma;
        console.log(`🌐 Idioma preferido do usuário: ${idiomaPreferido}`);

        return {
          user: {
            id: usuario.id,
            name: usuario.name,
          },
          idiomaPreferido: idiomaPreferido,
        };
      }

      console.log(`❌ Nenhum usuário encontrado para: ${userPhone}`);
      return null;
    } catch (error) {
      console.error("❌ Erro ao buscar usuário:", error);
      return null;
    }
  }

  static async getCategoriasUsuario(userId: string) {
    try {
      const categorias = await db.categoria.findMany({
        where: { userId },
        orderBy: { nome: "asc" },
      });
      return categorias;
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      return [];
    }
  }
  static async encontrarUsuarioPorUsername(
    username: string,
    userIdAtual: string,
  ) {
    try {
      console.log(
        `🔍 Buscando usuário por username: "@${username}" (usuário atual: ${userIdAtual})`,
      );

      // Remover @ se o usuário digitou
      const usernameBusca = username.replace(/^@/, "").toLowerCase().trim();
      console.log(`🎯 Username para busca: "${usernameBusca}"`);

      // Buscar primeiro por username exato
      const usuarioExato = await db.user.findFirst({
        where: {
          username: usernameBusca,
          NOT: { id: userIdAtual },
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          image: true,
        },
      });

      if (usuarioExato) {
        console.log(
          `✅ Usuário encontrado por username exato: ${usuarioExato.name} (@${usuarioExato.username})`,
        );
        return usuarioExato;
      }

      // Se não encontrou por username exato, buscar por aproximação
      const usuarios = await db.user.findMany({
        where: {
          NOT: { id: userIdAtual },
          username: {
            not: null,
            contains: usernameBusca,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          image: true,
        },
        take: 5,
      });

      console.log(
        `📋 Usuários encontrados por username parcial:`,
        usuarios.map((u) => ({
          name: u.name,
          username: u.username,
        })),
      );

      if (usuarios.length > 0) {
        const melhorUsuario = usuarios[0];
        console.log(
          `✅ Usuário encontrado por username parcial: ${melhorUsuario.name} (@${melhorUsuario.username})`,
        );
        return melhorUsuario;
      }

      console.log(
        `❌ Nenhum usuário encontrado com username: "@${usernameBusca}"`,
      );
      return null;
    } catch (error) {
      console.error("❌ Erro ao buscar usuário por username:", error);
      return null;
    }
  }

  static async encontrarUsuarioPorNome(nome: string, userIdAtual: string) {
    try {
      console.log(
        `🔍 Buscando usuário por nome: "${nome}" (usuário atual: ${userIdAtual})`,
      );

      const usuarios = await db.user.findMany({
        where: {
          NOT: { id: userIdAtual },
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });

      console.log(
        `📋 Usuários disponíveis para compartilhamento:`,
        usuarios.map((u) => ({ id: u.id, name: u.name })),
      );

      const nomeBusca = nome.toLowerCase().trim();
      console.log(`🎯 Buscando por: "${nomeBusca}"`);

      let melhorUsuario = null;
      let melhorPontuacao = 0;

      for (const usuario of usuarios) {
        const nomeUsuario = usuario.name.toLowerCase();
        let pontuacao = 0;

        console.log(`🔍 Comparando com: "${nomeUsuario}"`);

        // Verificação exata primeiro
        if (nomeUsuario === nomeBusca) {
          console.log(`✅ CORRESPONDÊNCIA EXATA encontrada: ${usuario.name}`);
          return usuario;
        }

        // Verificação por partes do nome
        const partesBusca = nomeBusca.split(" ");
        const partesUsuario = nomeUsuario.split(" ");

        for (const parteBusca of partesBusca) {
          if (parteBusca.length > 2) {
            for (const parteUsuario of partesUsuario) {
              if (
                parteUsuario.includes(parteBusca) ||
                parteBusca.includes(parteUsuario)
              ) {
                pontuacao += 1;
                console.log(
                  `   ✅ Parte "${parteBusca}" corresponde a "${parteUsuario}"`,
                );
              }
            }
          }
        }

        // Verificar apelidos comuns
        const apelidos: { [key: string]: string[] } = {
          claudenir: ["clau", "claudenir", "nenir"],
          beatriz: ["bia", "bea", "beatriz"],
          filho: ["junior", "jr", "filho"],
        };

        for (const [nomeCompleto, variacoes] of Object.entries(apelidos)) {
          if (
            variacoes.includes(nomeBusca) &&
            nomeUsuario.includes(nomeCompleto)
          ) {
            pontuacao += 2;
            console.log(
              `   ✅ Apelido "${nomeBusca}" corresponde a "${nomeCompleto}"`,
            );
          }
        }

        if (pontuacao > melhorPontuacao) {
          melhorPontuacao = pontuacao;
          melhorUsuario = usuario;
          console.log(
            `   🏆 Novo melhor usuário: ${usuario.name} (pontuação: ${pontuacao})`,
          );
        }
      }

      if (melhorUsuario && melhorPontuacao >= 1) {
        console.log(
          `✅ Usuário encontrado: ${melhorUsuario.name} (pontuação: ${melhorPontuacao})`,
        );
        return melhorUsuario;
      }

      console.log(`❌ Nenhum usuário adequado encontrado para: "${nome}"`);
      return null;
    } catch (error) {
      console.error("❌ Erro ao buscar usuário:", error);
      return null;
    }
  }

  static async buscarLimiteCategoria(
    categoriaId: string,
    userId: string,
    mesReferencia: string,
  ) {
    try {
      const limite = await db.limiteCategoria.findUnique({
        where: {
          categoriaId_mesReferencia_userId: {
            categoriaId,
            mesReferencia,
            userId,
          },
        },
        include: {
          categoria: true,
        },
      });

      return limite;
    } catch (error) {
      console.error("Erro ao buscar limite da categoria:", error);
      return null;
    }
  }
}
