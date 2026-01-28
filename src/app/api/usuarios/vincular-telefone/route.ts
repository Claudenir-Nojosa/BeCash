import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "../../../../../auth";
import { VerificationCodeService } from "@/lib/services/verification-code.service";
import { WhatsAppService } from "@/app/api/webhooks/whatsapp/services/whatsapp.service";

// Função para obter mensagens no idioma correto
function getMessages(language: string = 'pt-BR') {
  const messages = {
    'pt-BR': {
      verificationCode: {
        title: "🔐 *BeCash - Código de Verificação*\n\nSeu código de verificação é:\n\n*{code}*\n\n⏰ Este código expira em 10 minutos.\n\n⚠️ Não compartilhe este código com ninguém.",
        welcome: "🎉 *Bem-vindo ao BeCash!*\n\nSeu telefone foi vinculado com sucesso!\n\nAgora você pode:\n✅ Registrar gastos e receitas por aqui\n✅ Enviar áudios com seus lançamentos\n\nExperimente enviar: \"Gastei 20 reais no almoço hoje.\""
      },
      errors: {
        unauthorized: "Não autorizado",
        phoneRequired: "Telefone é obrigatório",
        alreadyLinked: "Você já possui um telefone vinculado",
        phoneInUse: "Este telefone já está vinculado a outra conta",
        activeCodeExists: "Já existe um código ativo. Aguarde {minutes} minuto(s) ou use o código enviado.",
        whatsappError: "Erro ao enviar código via WhatsApp. Verifique se o número está correto.",
        verificationRequired: "Telefone e código são obrigatórios",
        internalError: "Erro interno do servidor",
        invalidAction: "Ação inválida. Use 'request_code' ou 'verify_code'"
      },
      success: {
        codeSent: "Código de verificação enviado via WhatsApp!",
        phoneLinked: "Telefone vinculado com sucesso!",
        phoneUnlinked: "Telefone desvinculado com sucesso!"
      }
    },
    'en-US': {
      verificationCode: {
        title: "🔐 *BeCash - Verification Code*\n\nYour verification code is:\n\n*{code}*\n\n⏰ This code expires in 10 minutes.\n\n⚠️ Do not share this code with anyone.",
        welcome: "🎉 *Welcome to BeCash!*\n\nYour phone has been successfully linked!\n\nNow you can:\n✅ Record expenses and incomes here\n✅ Send audios with your transactions\n\nTry sending: \"Spent 12 dollars on lunch today\""
      },
      errors: {
        unauthorized: "Unauthorized",
        phoneRequired: "Phone number is required",
        alreadyLinked: "You already have a phone number linked",
        phoneInUse: "This phone number is already linked to another account",
        activeCodeExists: "There is already an active code. Wait {minutes} minute(s) or use the sent code.",
        whatsappError: "Error sending code via WhatsApp. Please check if the number is correct.",
        verificationRequired: "Phone number and code are required",
        internalError: "Internal server error",
        invalidAction: "Invalid action. Use 'request_code' or 'verify_code'"
      },
      success: {
        codeSent: "Verification code sent via WhatsApp!",
        phoneLinked: "Phone number linked successfully!",
        phoneUnlinked: "Phone number unlinked successfully!"
      }
    }
  };

  return messages[language as keyof typeof messages] || messages['pt-BR'];
}


// GET - Verificar se usuário já tem telefone vinculado
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar configurações do usuário para obter idioma
    const configuracoes = await db.configuracoesUsuario.findUnique({
      where: { userId: session.user.id },
    });
    
    const userLanguage = configuracoes?.idioma || 'pt-BR';
    const messages = getMessages(userLanguage);

    const usuario = await db.user.findUnique({
      where: { email: session.user.email },
      select: {
        telefone: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json({
      success: true,
      temTelefoneVinculado: !!usuario?.telefone,
      telefone: usuario?.telefone,
      usuario: {
        name: usuario?.name,
        email: usuario?.email,
      },
      idioma: userLanguage
    });
  } catch (error) {
    console.error("Erro ao verificar telefone:", error);
    const messages = getMessages();
    return NextResponse.json(
      { error: messages.errors.internalError },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      const messages = getMessages();
      return NextResponse.json({ error: messages.errors.unauthorized }, { status: 401 });
    }

    // Buscar configurações do usuário para obter idioma
    const configuracoes = await db.configuracoesUsuario.findUnique({
      where: { userId: session.user.id },
    });
    
    const userLanguage = configuracoes?.idioma || 'pt-BR';
    const messages = getMessages(userLanguage);

    const body = await request.json();
    const { action, telefone, code } = body;

    // 🔥 NORMALIZAR TELEFONE: remover tudo que não é número
    const telefoneNormalizado = telefone?.replace(/\D/g, "") || "";

    console.log(`📞 Telefone recebido: ${telefone}`);
    console.log(`🔧 Telefone normalizado: ${telefoneNormalizado}`);

    // ========================================
    // AÇÃO 1: SOLICITAR CÓDIGO DE VERIFICAÇÃO
    // ========================================
    if (action === "request_code") {
      if (!telefoneNormalizado) {
        return NextResponse.json(
          { error: messages.errors.phoneRequired },
          { status: 400 }
        );
      }

      // Verificar se usuário já tem telefone vinculado
      const usuarioAtual = await db.user.findUnique({
        where: { email: session.user.email },
        select: { telefone: true },
      });

      if (usuarioAtual?.telefone) {
        return NextResponse.json({
          success: false,
          error: messages.errors.alreadyLinked,
          telefoneAtual: usuarioAtual.telefone,
        }, { status: 400 });
      }

      // Verificar se telefone já está em uso por outro usuário
      const telefoneParaSalvar = telefoneNormalizado.replace(/^55/, "");
      
      const telefoneExistente = await db.user.findFirst({
        where: {
          OR: [
            { telefone: telefoneParaSalvar },
            { telefone: `+${telefoneParaSalvar}` },
            { telefone: telefoneNormalizado },
            { telefone: `+${telefoneNormalizado}` },
          ],
          NOT: { email: session.user.email },
        },
      });

      if (telefoneExistente) {
        return NextResponse.json(
          { error: messages.errors.phoneInUse },
          { status: 400 }
        );
      }

      // Verificar se já existe código ativo
      const hasActiveCode = await VerificationCodeService.hasActiveCode(telefoneParaSalvar);
      if (hasActiveCode) {
        const timeLeft = await VerificationCodeService.getTimeLeft(telefoneParaSalvar);
        const minutes = Math.ceil((timeLeft || 0) / 60);
        return NextResponse.json({
          success: false,
          error: messages.errors.activeCodeExists.replace("{minutes}", minutes.toString()),
        }, { status: 429 });
      }

      // Gerar código de verificação
      const verificationCode = await VerificationCodeService.createVerificationCode(
        telefoneParaSalvar,
        session.user.email
      );

      // Enviar código via WhatsApp
      try {
        const mensagem = messages.verificationCode.title.replace("{code}", verificationCode);
        
        await WhatsAppService.sendMessage(telefoneParaSalvar, mensagem);

        console.log(`✅ Código enviado para ${telefoneParaSalvar}`);

        return NextResponse.json({
          success: true,
          message: messages.success.codeSent,
          expiresIn: 600, // 10 minutos
        });
      } catch (error) {
        console.error("❌ Erro ao enviar código via WhatsApp:", error);
        // Deletar código se falhou o envio
        await VerificationCodeService.deleteCode(telefoneParaSalvar);
        
        return NextResponse.json(
          { error: messages.errors.whatsappError },
          { status: 500 }
        );
      }
    }

    // ========================================
    // AÇÃO 2: VERIFICAR CÓDIGO E VINCULAR
    // ========================================
    if (action === "verify_code") {
      if (!telefoneNormalizado || !code) {
        return NextResponse.json(
          { error: messages.errors.verificationRequired },
          { status: 400 }
        );
      }

      const telefoneParaSalvar = telefoneNormalizado.replace(/^55/, "");

      // Verificar código
      const verification = await VerificationCodeService.verifyCode(
        telefoneParaSalvar,
        code
      );

      if (!verification.valid) {
        return NextResponse.json(
          { 
            success: false,
            error: verification.message,
            attemptsLeft: verification.attemptsLeft,
          },
          { status: 400 }
        );
      }

      // Código válido - vincular telefone
      try {
        const usuarioAtualizado = await db.user.update({
          where: { email: session.user.email },
          data: { telefone: telefoneParaSalvar },
        });

        console.log(`✅ Telefone ${telefoneParaSalvar} vinculado com sucesso!`);

        // Enviar mensagem de boas-vindas no idioma correto
        try {
          const mensagemBoasVindas = messages.verificationCode.welcome;
          await WhatsAppService.sendMessage(telefoneParaSalvar, mensagemBoasVindas);
        } catch (error) {
          console.error("Erro ao enviar mensagem de boas-vindas:", error);
        }

        return NextResponse.json({
          success: true,
          message: messages.success.phoneLinked,
          usuario: {
            name: usuarioAtualizado.name,
            telefone: usuarioAtualizado.telefone,
          },
        });
      } catch (error: any) {
        console.error("Erro ao vincular telefone:", error);

        if (error.code === "P2002") {
          return NextResponse.json(
            { error: messages.errors.phoneInUse },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: messages.errors.internalError },
          { status: 500 }
        );
      }
    }

    // Ação inválida
    return NextResponse.json(
      { error: messages.errors.invalidAction },
      { status: 400 }
    );

  } catch (error: any) {
    console.error("Erro ao processar requisição:", error);
    const messages = getMessages();
    return NextResponse.json(
      { error: messages.errors.internalError },
      { status: 500 }
    );
  }
}

// DELETE - Desvincular telefone
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      const messages = getMessages();
      return NextResponse.json({ error: messages.errors.unauthorized }, { status: 401 });
    }

    // Buscar configurações do usuário para obter idioma
    const configuracoes = await db.configuracoesUsuario.findUnique({
      where: { userId: session.user.id },
    });
    
    const userLanguage = configuracoes?.idioma || 'pt-BR';
    const messages = getMessages(userLanguage);

    const usuarioAtualizado = await db.user.update({
      where: { email: session.user.email },
      data: { telefone: null },
    });

    return NextResponse.json({
      success: true,
      message: messages.success.phoneUnlinked,
    });
  } catch (error) {
    console.error("Erro ao desvincular telefone:", error);
    const messages = getMessages();
    return NextResponse.json(
      { error: messages.errors.internalError },
      { status: 500 }
    );
  }
}