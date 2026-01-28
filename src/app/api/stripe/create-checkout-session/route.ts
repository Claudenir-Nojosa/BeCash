import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import db from "@/lib/db";
import { getPriceId } from "@/lib/stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

const TRIAL_DAYS = 7;

export async function POST(req: NextRequest) {
  try {
    const { plan, currency, interval, userId, userEmail } = await req.json();

    console.log("📝 Dados recebidos:", {
      plan,
      currency,
      interval,
      userId,
      userEmail,
    });

    if (!plan || !currency || !interval || !userId || !userEmail) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const period = interval === "month" ? "monthly" : "yearly";
    const priceId = await getPriceId({
      plan: plan as "free" | "pro" | "family",
      period,
      currency: currency as "BRL" | "USD",
    });

    if (!priceId) {
      console.error("❌ Preço não encontrado para:", {
        plan,
        period,
        currency,
      });
      return NextResponse.json(
        { error: "Preço não encontrado para esta configuração" },
        { status: 400 },
      );
    }

    console.log("✅ Price ID encontrado:", priceId);

    const existingSubscription = await db.subscription.findFirst({
      where: { userId },
    });

    const hasHadTrial = existingSubscription !== null;
    console.log("🔍 Usuário já teve trial?", hasHadTrial);

    let stripeCustomerId: string;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (user?.stripeCustomerId) {
      stripeCustomerId = user.stripeCustomerId;
      console.log("✅ Cliente Stripe existente:", stripeCustomerId);
    } else {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId, // 🔥 CRUCIAL: userId no metadata do customer
          plan, // 🔥 BONUS: adicionar o plano também
        },
      });
      stripeCustomerId = customer.id;
      console.log("✅ Novo cliente Stripe criado:", stripeCustomerId);

      await db.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
      });
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      client_reference_id: userId, // 🔥 Mantém isso
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?canceled=true`,
      metadata: {
        userId, // 🔥 userId no metadata da session
        plan,
        currency,
        interval,
      },
      subscription_data: {
        metadata: {
          userId, // 🔥 CRUCIAL: userId no metadata da subscription
          plan,
          userEmail, // 🔥 BONUS: adicionar email também
        },
      },
    };

    let trialDaysApplied = 0;
    if (!hasHadTrial) {
      sessionConfig.subscription_data!.trial_period_days = TRIAL_DAYS;
      trialDaysApplied = TRIAL_DAYS;
      console.log(`✨ Trial de ${TRIAL_DAYS} dias adicionado!`);
    } else {
      console.log(
        "⚠️ Trial não aplicado - usuário já teve trial anteriormente",
      );
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log("✅ Sessão criada:", session.id);
    console.log("📋 Metadata configurado:", {
      session: sessionConfig.metadata,
      subscription: sessionConfig.subscription_data?.metadata,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      trialDays: trialDaysApplied,
      hasHadTrial,
    });
  } catch (error: any) {
    console.error("❌ Erro ao criar sessão de checkout:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
