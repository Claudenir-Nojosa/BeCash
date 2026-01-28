// lib/services/verification-code.service.ts
import { redisGet, redisSet, redisDel } from '@/lib/redis';

export interface VerificationCodeData {
  code: string;
  telefone: string;
  email: string;
  createdAt: number;
  attempts: number;
}

export class VerificationCodeService {
  private static readonly PREFIX = 'verification:';
  private static readonly TTL = 600; // 10 minutos em segundos
  private static readonly MAX_ATTEMPTS = 3;

  /**
   * Gerar código de 6 dígitos
   */
  static generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Criar e salvar código de verificação
   */
  static async createVerificationCode(
    telefone: string,
    email: string
  ): Promise<string> {
    const key = `${this.PREFIX}${telefone}`;
    const code = this.generateCode();

    const data: VerificationCodeData = {
      code,
      telefone,
      email,
      createdAt: Date.now(),
      attempts: 0,
    };

    await redisSet(key, data, this.TTL);
    console.log(`✅ Código criado para ${telefone}: ${code}`);

    return code;
  }

  /**
   * Verificar código fornecido pelo usuário
   */
  static async verifyCode(
    telefone: string,
    codeToVerify: string
  ): Promise<{
    valid: boolean;
    message: string;
    attemptsLeft?: number;
  }> {
    const key = `${this.PREFIX}${telefone}`;

    try {
      const data = await redisGet(key);

      if (!data) {
        return {
          valid: false,
          message: 'Código expirado ou não encontrado. Solicite um novo código.',
        };
      }

      // Verificar expiração (redundante com TTL, mas seguro)
      if (Date.now() - data.createdAt > this.TTL * 1000) {
        await this.deleteCode(telefone);
        return {
          valid: false,
          message: 'Código expirado. Solicite um novo código.',
        };
      }

      // Verificar tentativas
      if (data.attempts >= this.MAX_ATTEMPTS) {
        await this.deleteCode(telefone);
        return {
          valid: false,
          message: 'Número máximo de tentativas excedido. Solicite um novo código.',
        };
      }

      // Verificar código
      if (data.code === codeToVerify) {
        await this.deleteCode(telefone);
        console.log(`✅ Código verificado com sucesso para ${telefone}`);
        return {
          valid: true,
          message: 'Código verificado com sucesso!',
        };
      }

      // Incrementar tentativas
      data.attempts++;
      await redisSet(key, data, this.TTL);

      const attemptsLeft = this.MAX_ATTEMPTS - data.attempts;

      console.log(`❌ Código incorreto para ${telefone}. Tentativas restantes: ${attemptsLeft}`);

      return {
        valid: false,
        message: `Código incorreto. Você tem ${attemptsLeft} tentativa(s) restante(s).`,
        attemptsLeft,
      };
    } catch (error) {
      console.error(`❌ Erro ao verificar código para ${telefone}:`, error);
      return {
        valid: false,
        message: 'Erro ao verificar código. Tente novamente.',
      };
    }
  }

  /**
   * Deletar código de verificação
   */
  static async deleteCode(telefone: string): Promise<void> {
    const key = `${this.PREFIX}${telefone}`;
    await redisDel(key);
    console.log(`🗑️ Código removido para ${telefone}`);
  }

  /**
   * Verificar se já existe código pendente
   */
  static async hasActiveCode(telefone: string): Promise<boolean> {
    const key = `${this.PREFIX}${telefone}`;
    const data = await redisGet(key);
    return !!data;
  }

  /**
   * Obter tempo restante do código
   */
  static async getTimeLeft(telefone: string): Promise<number | null> {
    const key = `${this.PREFIX}${telefone}`;
    const data = await redisGet(key);

    if (!data) return null;

    const elapsed = Date.now() - data.createdAt;
    const timeLeft = this.TTL * 1000 - elapsed;

    return timeLeft > 0 ? Math.ceil(timeLeft / 1000) : 0;
  }
}