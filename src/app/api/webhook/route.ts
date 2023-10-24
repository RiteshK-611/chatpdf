import { db } from "@/lib/db";
import { userSubscriptions } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const POST = async (req: Request) => {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SIGNING_SECRET as string
    );
  } catch (error) {
    return new NextResponse("webhook error", { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // new subcription created
  if (event.type === "checkout.session.completed") {
    const subcription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    if (!session?.metadata?.userId) {
      return new NextResponse("no userId", { status: 400 });
    }

    await db.insert(userSubscriptions).values({
      userId: session.metadata.userId,
      stripeSubscriptionId: subcription.id,
      stripeCustomerId: subcription.customer as string,
      stripePriceId: subcription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(subcription.current_period_end * 1000),
    });
  }

  // update subscription
  if (event.type === "invoice.payment_succeeded") {
    const subcription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    await db
      .update(userSubscriptions)
      .set({
        stripePriceId: subcription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(subcription.current_period_end * 1000),
      })
      .where(eq(userSubscriptions.stripeSubscriptionId, subcription.id));
  }

  return new NextResponse(null, { status: 200 });
};
