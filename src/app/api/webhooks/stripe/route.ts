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
        const customerId = subscriptionData.customer;

        console.log("📋 Subscription ID:", subscriptionData.id);
        console.log("📋 Customer ID:", customerId);

        // 1. PRIMEIRO: Buscar cliente no Stripe para pegar email
        let userId = null;
        let customerEmail = null;
        let stripeCustomer: Stripe.Customer | null = null;

        try {
          stripeCustomer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
          customerEmail = stripeCustomer.email;
          console.log("📧 Customer email:", customerEmail);
          
          // 2. Buscar usuário pelo email no banco
          if (customerEmail) {
            const user = await db.user.findUnique({
              where: { email: customerEmail },
              select: { id: true, stripeCustomerId: true }
            });
            
            if (user) {
              userId = user.id;
              console.log("✅ Usuário encontrado por email:", userId);
              
              // Atualizar stripeCustomerId se estiver null
              if (!user.stripeCustomerId) {
                await db.user.update({
                  where: { id: userId },
                  data: { stripeCustomerId: customerId }
                });
                console.log("✅ stripeCustomerId atualizado no usuário");
              }
            } else {
              console.log("⚠️  Usuário não encontrado no banco para email:", customerEmail);
            }
          } else {
            console.log("⚠️  Cliente Stripe não tem email");
          }
        } catch (error: any) {
          console.error("❌ Erro ao buscar cliente no Stripe:", error.message);
        }

        // 3. SEGUNDA TENTATIVA: Buscar por metadata da subscription
        if (!userId && subscriptionData.metadata?.userId) {
          userId = subscriptionData.metadata.userId;
          console.log("✅ UserId encontrado no metadata da subscription:", userId);
        }

        // 4. TERCEIRA TENTATIVA: Buscar por invoice
        if (!userId && subscriptionData.latest_invoice) {
          try {
            const invoice = await stripe.invoices.retrieve(subscriptionData.latest_invoice);
            if (invoice.metadata?.userId) {
              userId = invoice.metadata.userId;
              console.log("✅ UserId encontrado na invoice:", userId);
            }
            if (!userId && invoice.customer_email) {
              // Tentar buscar por email da invoice
              const userByInvoiceEmail = await db.user.findUnique({
                where: { email: invoice.customer_email },
                select: { id: true }
              });
              if (userByInvoiceEmail) {
                userId = userByInvoiceEmail.id;
                console.log("✅ UserId encontrado pelo email da invoice:", userId);
              }
            }
          } catch (error: any) {
            console.error("❌ Erro ao buscar invoice:", error.message);
          }
        }

        // 5. QUARTA TENTATIVA: Buscar por checkout sessions
        if (!userId) {
          try {
            // BUSCAR POR CUSTOMER, não por subscription!
            const sessions = await stripe.checkout.sessions.list({
              customer: customerId,
              limit: 3, // Buscar mais para garantir
              expand: ["data.line_items"]
            });

            if (sessions.data.length > 0) {
              for (const session of sessions.data) {
                if (session.client_reference_id) {
                  userId = session.client_reference_id;
                  console.log("✅ UserId encontrado na session:", userId, "Session ID:", session.id);
                  break;
                }
              }
              
              // Se ainda não encontrou, verificar metadata da session
              if (!userId) {
                for (const session of sessions.data) {
                  if (session.metadata?.userId) {
                    userId = session.metadata.userId;
                    console.log("✅ UserId encontrado no metadata da session:", userId);
                    break;
                  }
                }
              }
            } else {
              console.log("⚠️  Nenhuma session encontrada para o customer");
            }
          } catch (error: any) {
            console.error("❌ Erro ao buscar sessions:", error.message);
          }
        }

        // 6. ÚLTIMA TENTATIVA: Buscar por email se não tiver userId ainda
        if (!userId && customerEmail) {
          try {
            // Tentar criar usuário se não existir? Ou apenas logar?
            console.log("⚠️  Tentando encontrar ou criar usuário por email:", customerEmail);
            
            // Para agora, apenas logamos o erro
            console.log("❌ Usuário não encontrado após todas as tentativas");
            console.log("📊 Dump completo para debugging:");
            console.log("   Customer ID:", customerId);
            console.log("   Customer Email:", customerEmail);
            console.log("   Subscription Metadata:", subscriptionData.metadata);
            console.log("   Latest Invoice:", subscriptionData.latest_invoice);
            
            if (stripeCustomer?.metadata) {
              console.log("   Customer Metadata:", stripeCustomer.metadata);
            }
            
          } catch (error: any) {
            console.error("❌ Erro na última tentativa:", error.message);
          }
        }

        // ERRO FINAL: Se ainda não encontrou
        if (!userId) {
          console.error("❌ Não foi possível encontrar userId após todas as tentativas");
          
          // Retornar sucesso mas com warning (não falhar completamente)
          // Isso evita que o Stripe fique retentando infinitamente
          console.log("⚠️  Subscription criada mas usuário não encontrado. Manual fix required.");
          return NextResponse.json({ 
            received: true, 
            warning: "User not found, manual fix required",
            customerId,
            customerEmail,
            subscriptionId: subscriptionData.id
          });
        }

        // ✅ Pegar informações do item da subscription
        const subscriptionItem = subscriptionData.items?.data?.[0];
        if (!subscriptionItem) {
          console.error("❌ No subscription item found");
          return NextResponse.json(
            { error: "Invalid subscription" },
            { status: 400 },
          );
        }

        const priceId = subscriptionItem.price.id;
        const currentPeriodEnd = subscriptionItem.current_period_end;

        console.log("📝 Price ID:", priceId);
        console.log("📝 Current period end:", currentPeriodEnd);
        console.log("📝 User ID encontrado:", userId);

        if (!currentPeriodEnd) {
          console.error("❌ current_period_end não encontrado");
          return NextResponse.json(
            { error: "Invalid subscription" },
            { status: 400 },
          );
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
            expand: ["product"],
          });

          console.log("🔍 Price metadata:", price.metadata);
          console.log(
            "🔍 Product metadata:",
            (price.product as Stripe.Product)?.metadata,
          );

          // Tentar obter o plano dos metadados
          const planType =
            price.metadata?.plan_type ||
            price.metadata?.plan_name ||
            (price.product as Stripe.Product)?.metadata?.plan_type;

          if (planType) {
            nomePlano = planType;
          } else {
            // Fallback: verificar o nome do produto
            const productName =
              (price.product as Stripe.Product)?.name?.toLowerCase() || "";
            if (productName.includes("pro")) {
              nomePlano = "pro";
            } else if (
              productName.includes("family") ||
              productName.includes("família")
            ) {
              nomePlano = "family";
            }
          }

          console.log(`✅ Plano identificado: ${nomePlano}`);
        } catch (priceError: any) {
          console.error("❌ Erro ao buscar informações do preço:", priceError.message);
          // Fallback: verificar pelo amount
          if (subscriptionItem.price.unit_amount > 0) {
            nomePlano =
              subscriptionItem.price.unit_amount >= 4990 ? "family" : "pro";
          }
        }

        console.log(
          `💾 Salvando subscription: userId=${userId}, plano=${nomePlano}, fimPlano=${fimPlano.toISOString()}`,
        );

        try {
          await db.subscription.upsert({
            where: { userId },
            update: {
              plano: nomePlano,
              status: "active",
              stripeSubscriptionId: subscriptionData.id,
              stripePriceId: priceId,
              stripeCustomerId: customerId,
              fimPlano,
              updatedAt: new Date(),
            },
            create: {
              userId,
              plano: nomePlano,
              status: "active",
              stripeSubscriptionId: subscriptionData.id,
              stripePriceId: priceId,
              stripeCustomerId: customerId,
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
              stripeCustomerId: customerId,
            },
          });

          console.log(`✅ Subscription criada para usuário ${userId}`);
        } catch (dbError: any) {
          console.error("❌ Erro ao salvar no banco de dados:", dbError.message);
          return NextResponse.json(
            { error: "Database error", details: dbError.message },
            { status: 500 },
          );
        }
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
          
          // Tentar encontrar por email do cliente
          try {
            const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
            if (customer.email) {
              const user = await db.user.findUnique({
                where: { email: customer.email },
                select: { id: true }
              });
              if (user) {
                // Atualizar subscription com userId encontrado
                const fimPlano = new Date(currentPeriodEnd * 1000);
                const status = subscriptionData.status === "active" ? "active" : "canceled";
                
                await db.subscription.update({
                  where: { userId: user.id },
                  data: {
                    status,
                    fimPlano,
                    stripeCustomerId: customerId,
                    canceladoEm: subscriptionData.canceled_at
                      ? new Date(subscriptionData.canceled_at * 1000)
                      : null,
                    updatedAt: new Date(),
                  },
                });
                console.log(`✅ Subscription atualizada via email lookup: ${subscriptionData.id}`);
              }
            }
          } catch (error: any) {
            console.error("❌ Erro ao tentar atualizar via email:", error.message);
          }
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
      { status: 500 },
    );
  }
}