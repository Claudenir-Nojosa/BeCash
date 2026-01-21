// app/api/onboarding/completar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { respostas, dataCompletado } = await request.json();

    // Atualizar usuário com onboarding completo
    const usuarioAtualizado = await db.user.update({
      where: { id: session.user.id },
      data: {
        onboardingCompleto: true,
        onboardingData: new Date(dataCompletado),
        onboardingRespostas: respostas,
      },
    });

    return NextResponse.json({
      sucesso: true,
      atualizado: true,
      usuario: {
        id: usuarioAtualizado.id,
        onboardingCompleto: usuarioAtualizado.onboardingCompleto,
      }
    });

  } catch (error) {
    console.error('Erro ao completar onboarding:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}