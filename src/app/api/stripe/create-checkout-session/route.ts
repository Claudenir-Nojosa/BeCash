// app/api/stripe/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import db from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export async function POST(req: NextRequest) {
  try {
    const { plan, currency, interval, userId, userEmail } = await req.json();

    // Validar dados recebidos
    if (!plan || !currency || !interval || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Mapear para as URLs de checkout corretas
    const checkoutUrlMap = {
      pro: {
        BRL: {
          month: process.env.NEXT_PUBLIC_STRIPE_PRO_BRL_MONTHLY_CHECKOUT_URL,
          year: process.env.NEXT_PUBLIC_STRIPE_PRO_BRL_YEARLY_CHECKOUT_URL,
        },
        USD: {
          month: process.env.NEXT_PUBLIC_STRIPE_PRO_USD_MONTHLY_CHECKOUT_URL,
          year: process.env.NEXT_PUBLIC_STRIPE_PRO_USD_YEARLY_CHECKOUT_URL,
        },
      },
      family: {
        BRL: {
          month: process.env.NEXT_PUBLIC_STRIPE_FAMILY_BRL_MONTHLY_CHECKOUT_URL,
          year: process.env.NEXT_PUBLIC_STRIPE_FAMILY_BRL_YEARLY_CHECKOUT_URL,
        },
        USD: {
          month: process.env.NEXT_PUBLIC_STRIPE_FAMILY_USD_MONTHLY_CHECKOUT_URL,
          year: process.env.NEXT_PUBLIC_STRIPE_FAMILY_USD_YEARLY_CHECKOUT_URL,
        },
      },
    };

    // Obter URL de checkout
    const checkoutUrl = checkoutUrlMap[plan as keyof typeof checkoutUrlMap]?.[currency as 'BRL' | 'USD']?.[interval as 'month' | 'year'];

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'URL de checkout não encontrada para esta configuração' },
        { status: 400 }
      );
    }

    // Criar ou buscar cliente no Stripe
    let stripeCustomerId: string;
    
    // Verificar se usuário já tem stripeCustomerId
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true }
    });

    if (user?.stripeCustomerId) {
      stripeCustomerId = user.stripeCustomerId;
    } else {
      // Criar novo cliente no Stripe
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId }
      });
      stripeCustomerId = customer.id;

      // Atualizar usuário com stripeCustomerId
      await db.user.update({
        where: { id: userId },
        data: { stripeCustomerId }
      });
    }

    // Criar sessão de checkout do Stripe usando a URL de checkout pronta
    // Mas passando o customer e metadata
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        userId,
        plan,
        currency,
        interval,
        checkoutType: 'direct_link',
      },
      // Para usar URLs de checkout prontas, você pode usar o line_items
      // Mas como temos URLs prontas, vamos redirecionar para elas
      // com parâmetros de cliente pré-preenchidos
    });

    // Retornar URL de checkout com cliente pré-preenchido
    const checkoutWithCustomer = `${checkoutUrl}?client_reference_id=${userId}&prefilled_email=${encodeURIComponent(userEmail)}&customer=${stripeCustomerId}`;

    return NextResponse.json({ 
      url: checkoutWithCustomer,
      sessionId: session.id
    });

  } catch (error: any) {
    console.error('Erro ao criar sessão de checkout:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}