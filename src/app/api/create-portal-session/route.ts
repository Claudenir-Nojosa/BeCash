import db from "@/lib/db";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "../../../../auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: "Cliente Stripe não encontrado" },
        { status: 400 }
      );
    }

    // Use o ID da configuração que você já tem
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/perfil?tab=subscription`,
      configuration: "bpc_1StXMp4fNQAvMR7aban8OaLA", // ← SEU CONFIGURATION ID
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error("Erro ao criar portal:", error);
    return NextResponse.json(
      { error: "Erro ao criar portal do Stripe" },
      { status: 500 }
    );
  }
}