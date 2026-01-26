import db from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getUserSubscription } from "@/lib/subscription";

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

        // Buscar a session recente para pegar o client_reference_id
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

        // ✅ CORREÇÃO: Pegar informações do item da subscription
        const subscriptionItem = subscriptionData.items?.data?.[0];
        if (!subscriptionItem) {
          console.error("❌ No subscription item found");
          return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
        }

        const priceId = subscriptionItem.price.id;
        const currentPeriodEnd = subscriptionItem.current_period_end;
        
        console.log("📝 Price ID:", priceId);
        console.log("📝 Current period end:", currentPeriodEnd);

        if (!currentPeriodEnd) {
          console.error("❌ current_period_end não encontrado");
          return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
        }

        const fimPlano = new Date(currentPeriodEnd * 1000);

        if (isNaN(fimPlano.getTime())) {
          console.error("❌ Data inválida");
          return NextResponse.json({ error: "Invalid date" }, { status: 400 });
        }

        // ✅ CORREÇÃO: Buscar informações do preço para determinar o plano
        let nomePlano = "free";
        
        try {
          // Buscar o preço do Stripe para verificar os metadados
          const price = await stripe.prices.retrieve(priceId, {
            expand: ['product']
          });
          
          console.log("🔍 Price metadata:", price.metadata);
          console.log("🔍 Product metadata:", (price.product as Stripe.Product)?.metadata);
          
          // Tentar obter o plano dos metadados
          const planType = price.metadata?.plan_type || 
                          price.metadata?.plan_name || 
                          (price.product as Stripe.Product)?.metadata?.plan_type;
          
          if (planType) {
            nomePlano = planType;
          } else {
            // Fallback: verificar o nome do produto
            const productName = (price.product as Stripe.Product)?.name?.toLowerCase() || '';
            if (productName.includes('pro')) {
              nomePlano = 'pro';
            } else if (productName.includes('family') || productName.includes('família')) {
              nomePlano = 'family';
            }
          }
          
          console.log(`✅ Plano identificado: ${nomePlano}`);
          
        } catch (priceError) {
          console.error("❌ Erro ao buscar informações do preço:", priceError);
          // Fallback: verificar pelo amount
          if (subscriptionItem.price.unit_amount > 0) {
            nomePlano = subscriptionItem.price.unit_amount >= 4990 ? 'family' : 'pro';
          }
        }

        console.log(`💾 Salvando subscription: userId=${userId}, plano=${nomePlano}, fimPlano=${fimPlano.toISOString()}`);

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

        // ✅ Atualizar também na tabela User
        await db.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: nomePlano,
            stripeSubscriptionId: subscriptionData.id,
            stripeCustomerId: subscriptionData.customer,
          },
        });

        console.log(`✅ Subscription criada para usuário ${userId}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscriptionData = event.data.object as any;
        const customerId = subscriptionData.customer;
        const currentPeriodEnd = subscriptionData.items?.data?.[0]?.current_period_end;

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
        const status = subscriptionData.status === "active" ? "active" : "canceled";

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

        await db.subscription.update({
          where: { userId: userSub.userId },
          data: {
            status: "expired",
            canceladoEm: new Date(),
            updatedAt: new Date(),
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
      { status: 500 }
    );
  }
}