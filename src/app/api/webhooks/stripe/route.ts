import db from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();

  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  console.log(`📥 Webhook recebido: ${event.type}`);

  try {
    switch (event.type) {
      case "customer.subscription.created": {
        console.log("🔍 Processando customer.subscription.created");

        const subscriptionData = event.data.object as any;

        const sessions = await stripe.checkout.sessions.list({
          subscription: subscriptionData.id,
          limit: 1,
        });

        const session = sessions.data[0];
        const userId = session?.client_reference_id;

        if (!userId) {
          console.error("❌ No client_reference_id found");
          return NextResponse.json({ error: "No userId" }, { status: 400 });
        }

        const currentPeriodEnd =
          subscriptionData.items?.data?.[0]?.current_period_end;

        console.log("📝 Current period end:", currentPeriodEnd);

        if (!currentPeriodEnd) {
          console.error("❌ current_period_end não encontrado");
          return NextResponse.json(
            { error: "Invalid subscription" },
            { status: 400 },
          );
        }

        const priceId = subscriptionData.items.data[0].price.id;
        const productId = subscriptionData.items.data[0].price.product; // ✅ Pegar o Product ID
        const fimPlano = new Date(currentPeriodEnd * 1000);

        if (isNaN(fimPlano.getTime())) {
          console.error("❌ Data inválida");
          return NextResponse.json({ error: "Invalid date" }, { status: 400 });
        }

        // ✅ CORREÇÃO: Detectar plano pelo Product ID
        let nomePlano = "basic";

        // IDs dos produtos (cole seus IDs aqui)
        const PRO_BRL_PRODUCT = "prod_TqRfK0oDJgp1rk";
        const PRO_USD_PRODUCT = "prod_TqwUcas4n9VrpV";
        const FAMILY_BRL_PRODUCT = "prod_TqwPSdkPK5YcVO";
        const FAMILY_USD_PRODUCT = "prod_TqwXThoP9Ajb6I";

        if (productId === PRO_BRL_PRODUCT || productId === PRO_USD_PRODUCT) {
          nomePlano = "pro";
        } else if (
          productId === FAMILY_BRL_PRODUCT ||
          productId === FAMILY_USD_PRODUCT
        ) {
          nomePlano = "family";
        }

        console.log(
          `💾 Salvando subscription: userId=${userId}, plano=${nomePlano}, productId=${productId}, priceId=${priceId}, fimPlano=${fimPlano.toISOString()}`,
        );

        await db.subscription.upsert({
          where: { userId },
          update: {
            plano: nomePlano,
            status: "active",
            stripeSubscriptionId: subscriptionData.id,
            stripePriceId: priceId,
            stripeCustomerId: subscriptionData.customer,
            fimPlano,
            updatedAt: new Date(),
          },
          create: {
            userId,
            plano: nomePlano,
            status: "active",
            stripeSubscriptionId: subscriptionData.id,
            stripePriceId: priceId,
            stripeCustomerId: subscriptionData.customer,
            inicioPlano: new Date(),
            fimPlano,
          },
        });

        await db.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: nomePlano,
            stripeSubscriptionId: subscriptionData.id,
            stripeCustomerId: subscriptionData.customer,
          },
        });

        console.log(
          `✅ Subscription criada para usuário ${userId} - Plano: ${nomePlano}`,
        );
        break;
      }

      case "customer.subscription.updated": {
        const subscriptionData = event.data.object as any;
        const customerId = subscriptionData.customer;
        const currentPeriodEnd =
          subscriptionData.items?.data?.[0]?.current_period_end;

        if (!currentPeriodEnd) {
          console.error("❌ current_period_end não encontrado");
          break;
        }

        const userSub = await db.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (!userSub) {
          console.log(`⚠️  Usuário não encontrado para customer ${customerId}`);
          break;
        }

        const fimPlano = new Date(currentPeriodEnd * 1000);
        const status =
          subscriptionData.status === "active" ? "active" : "canceled";

        // ✅ Atualizar subscription
        await db.subscription.update({
          where: { userId: userSub.userId },
          data: {
            status,
            fimPlano,
            canceladoEm: subscriptionData.canceled_at
              ? new Date(subscriptionData.canceled_at * 1000)
              : null,
            updatedAt: new Date(),
          },
        });

        // ✅ Atualizar também o User
        await db.user.update({
          where: { id: userSub.userId },
          data: {
            subscriptionStatus: status === "active" ? userSub.plano : "free",
          },
        });

        console.log(`✅ Subscription atualizada: ${subscriptionData.id}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscriptionData = event.data.object as any;
        const customerId = subscriptionData.customer;

        const userSub = await db.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (!userSub) {
          console.log(`⚠️  Usuário não encontrado para customer ${customerId}`);
          break;
        }

        // ✅ Atualizar subscription para expirada
        await db.subscription.update({
          where: { userId: userSub.userId },
          data: {
            status: "expired",
            canceladoEm: new Date(),
            updatedAt: new Date(),
          },
        });

        // ✅ Atualizar User para plano free
        await db.user.update({
          where: { id: userSub.userId },
          data: {
            subscriptionStatus: "free",
          },
        });

        console.log(`✅ Subscription cancelada`);
        break;
      }

      default:
        console.log(`ℹ️  Evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("❌ Erro ao processar webhook:", error);
    console.error("Stack trace:", error.stack);
    return NextResponse.json(
      { error: "Webhook handler failed", details: error.message },
      { status: 500 },
    );
  }
}
