// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import db from "@/lib/db";

// Use a mesma versão do seu stripe.ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`❌ Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 },
    );
  }

  console.log(`✅ Received event type: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice,
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "customer.created":
        await handleCustomerCreated(event.data.object as Stripe.Customer);
        break;

      case "customer.updated":
        await handleCustomerUpdated(event.data.object as Stripe.Customer);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

// Handler para quando uma sessão de checkout é completada
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('🛒 Checkout session completed:', session.id);

  // 🔥 AGORA PEGAMOS O USER ID DO client_reference_id
  const userId = session.client_reference_id;
  
  if (!userId) {
    console.error('❌ NO USER ID FOUND in client_reference_id');
    console.log('Session:', {
      id: session.id,
      client_reference_id: session.client_reference_id,
      customer: session.customer,
      metadata: session.metadata
    });
    return;
  }

  // Verificar se usuário existe
  const user = await db.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    console.error('❌ User not found with id:', userId);
    return;
  }

  // Pegar customerId e subscriptionId
  const customerId = typeof session.customer === 'string' 
    ? session.customer 
    : session.customer?.id;

  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id;

  try {
    // 🔥 Determinar qual plano foi comprado
    let plan = 'pro'; // default
    
    // Opção 1: Verificar pela URL de success
    if (session.success_url) {
      if (session.success_url.includes('family') || session.success_url.includes('familia')) {
        plan = 'family';
      }
    }
    
    // Opção 2: Verificar line_items (se disponível)
    if (session.line_items?.data?.[0]?.price?.product) {
      const productId = session.line_items.data[0].price.product;
      
      // Comparar com seus product IDs
      const familyProductIds = [
        process.env.NEXT_PUBLIC_STRIPE_FAMILY_BRL_PRODUCT_ID,
        process.env.NEXT_PUBLIC_STRIPE_FAMILY_USD_PRODUCT_ID
      ];
      
      if (familyProductIds.includes(productId as string)) {
        plan = 'family';
      }
    }
    
    // Opção 3: Verificar metadata (se você adicionar mais tarde)
    if (session.metadata?.plan) {
      plan = session.metadata.plan;
    }

    // 🔥 ATUALIZAR O USUÁRIO NO BANCO
    await db.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: plan, // 'pro' ou 'family'
        stripeCustomerId: customerId || null,
        stripeSubscriptionId: subscriptionId || null,
      },
    });

    console.log(`✅ Usuário ${user.email} atualizado para plano: ${plan}`);
    console.log('📊 Dados atualizados:', {
      userId,
      plan,
      stripeCustomerId: customerId?.substring(0, 10) + '...',
      stripeSubscriptionId: subscriptionId?.substring(0, 10) + '...'
    });

  } catch (error) {
    console.error('❌ Error updating user:', error);
    
    // Log detalhado
    console.log('Error details:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// Handler para quando uma assinatura é criada
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("📝 Subscription created:", subscription.id);

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  try {
    // Encontrar usuário pelo customerId
    const user = await db.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      console.error("User not found for customer:", customerId);
      return;
    }

    // Determinar o plano baseado no priceId
    const priceId = subscription.items.data[0]?.price.id;
    let plan = "free";

    // Verificar planos BRL
    if (process.env.STRIPE_BASIC_PRICE_ID === priceId) plan = "basic";
    if (process.env.STRIPE_PRO_MONTHLY_PRICE_ID === priceId) plan = "pro";
    if (process.env.STRIPE_PRO_YEARLY_PRICE_ID === priceId) plan = "pro";
    if (process.env.STRIPE_FAMILY_MONTHLY_PRICE_ID === priceId) plan = "family";
    if (process.env.STRIPE_FAMILY_YEARLY_PRICE_ID === priceId) plan = "family";

    // Verificar planos USD
    if (process.env.STRIPE_PRO_MONTHLY_USD_PRICE_ID === priceId) plan = "pro";
    if (process.env.STRIPE_PRO_YEARLY_USD_PRICE_ID === priceId) plan = "pro";
    if (process.env.STRIPE_FAMILY_MONTHLY_USD_PRICE_ID === priceId)
      plan = "family";
    if (process.env.STRIPE_FAMILY_YEARLY_USD_PRICE_ID === priceId)
      plan = "family";

    // Atualizar status da assinatura
    await db.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: plan,
        stripeSubscriptionId: subscription.id,
      },
    });

    console.log(
      `✅ Assinatura ${subscription.id} criada para usuário ${user.id}`,
    );
  } catch (error) {
    console.error("Error handling subscription creation:", error);
    throw error;
  }
}

// Handler para quando uma assinatura é atualizada
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("🔄 Subscription updated:", subscription.id);

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  try {
    // Encontrar usuário pelo customerId
    const user = await db.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      console.error("User not found for customer:", customerId);
      return;
    }

    // Verificar status da assinatura
    const subscriptionStatus = subscription.status;
    let userStatus = "free";

    if (subscriptionStatus === "active" || subscriptionStatus === "trialing") {
      // Determinar o plano baseado no priceId
      const priceId = subscription.items.data[0]?.price.id;

      // Verificar planos BRL
      if (process.env.STRIPE_BASIC_PRICE_ID === priceId) userStatus = "basic";
      if (process.env.STRIPE_PRO_MONTHLY_PRICE_ID === priceId)
        userStatus = "pro";
      if (process.env.STRIPE_PRO_YEARLY_PRICE_ID === priceId)
        userStatus = "pro";
      if (process.env.STRIPE_FAMILY_MONTHLY_PRICE_ID === priceId)
        userStatus = "family";
      if (process.env.STRIPE_FAMILY_YEARLY_PRICE_ID === priceId)
        userStatus = "family";

      // Verificar planos USD
      if (process.env.STRIPE_PRO_MONTHLY_USD_PRICE_ID === priceId)
        userStatus = "pro";
      if (process.env.STRIPE_PRO_YEARLY_USD_PRICE_ID === priceId)
        userStatus = "pro";
      if (process.env.STRIPE_FAMILY_MONTHLY_USD_PRICE_ID === priceId)
        userStatus = "family";
      if (process.env.STRIPE_FAMILY_YEARLY_USD_PRICE_ID === priceId)
        userStatus = "family";
    } else if (
      subscriptionStatus === "canceled" ||
      subscriptionStatus === "unpaid"
    ) {
      userStatus = "free";
    }

    // Atualizar usuário
    await db.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: userStatus,
        stripeSubscriptionId: subscription.id,
      },
    });

    console.log(
      `✅ Assinatura ${subscription.id} atualizada para status ${userStatus}`,
    );
  } catch (error) {
    console.error("Error handling subscription update:", error);
    throw error;
  }
}

// Handler para quando uma assinatura é deletada/cancelada
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("🗑️ Subscription deleted:", subscription.id);

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  try {
    // Encontrar usuário pelo customerId
    const user = await db.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      console.error("User not found for customer:", customerId);
      return;
    }

    // Reverter para plano free
    await db.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: "free",
        stripeSubscriptionId: null,
      },
    });

    console.log(`✅ Usuário ${user.id} revertido para plano free`);
  } catch (error) {
    console.error("Error handling subscription deletion:", error);
    throw error;
  }
}

// Handler para quando um pagamento de fatura é bem-sucedido (CORRIGIDO)
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("💰 Invoice payment succeeded:", invoice.id);

  // Verificar se invoice.customer existe antes de acessá-lo
  if (!invoice.customer) {
    console.error("Invoice has no customer:", invoice.id);
    return;
  }

  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer.id;

  try {
    // Encontrar usuário pelo customerId
    const user = await db.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (user) {
      console.log(`✅ Pagamento processado para usuário ${user.email}`);
      // Aqui você pode adicionar lógica adicional, como:
      // - Enviar recibo por email
      // - Registrar o pagamento em um log
      // - Atualizar data da última renovação
    }
  } catch (error) {
    console.error("Error handling successful payment:", error);
  }
}

// Handler para quando um pagamento de fatura falha (CORRIGIDO)
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("❌ Invoice payment failed:", invoice.id);

  // Verificar se invoice.customer existe antes de acessá-lo
  if (!invoice.customer) {
    console.error("Invoice has no customer:", invoice.id);
    return;
  }

  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer.id;

  try {
    // Encontrar usuário
    const user = await db.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (user) {
      // Você pode enviar um email de notificação aqui
      console.log(`⚠️ Pagamento falhou para usuário ${user.email}`);

      // Atualizar status para indicar problema de pagamento
      await db.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: "payment_failed",
        },
      });

      // Opcional: enviar email de notificação
      // await sendPaymentFailedEmail(user.email);
    }
  } catch (error) {
    console.error("Error handling failed payment:", error);
  }
}

// Handler para quando um cliente é criado
async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log("👤 Customer created:", customer.id);

  // Se você quiser sincronizar dados do cliente no seu banco de dados
  // Este handler pode ser útil para manter informações atualizadas

  if (customer.email) {
    try {
      // Verificar se já existe um usuário com este email
      const existingUser = await db.user.findFirst({
        where: { email: customer.email },
      });

      if (existingUser && !existingUser.stripeCustomerId) {
        // Atualizar usuário existente com o customerId
        await db.user.update({
          where: { id: existingUser.id },
          data: {
            stripeCustomerId: customer.id,
          },
        });
        console.log(`✅ Cliente vinculado ao usuário ${existingUser.email}`);
      }
    } catch (error) {
      console.error("Error syncing customer:", error);
    }
  }
}

// Handler para quando um cliente é atualizado
async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.log("🔄 Customer updated:", customer.id);

  // Atualizar informações do cliente no banco se necessário
}

// Handler para quando um payment intent é bem-sucedido
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
) {
  console.log("✅ Payment intent succeeded:", paymentIntent.id);

  // Útil para pagamentos únicos ou upgrades
}

// Handler para quando um payment intent falha
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log("❌ Payment intent failed:", paymentIntent.id);

  // Lógica para lidar com falhas de pagamento
}

// Configuração para desabilitar o body parsing padrão do Next.js
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Configurações específicas para webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};
