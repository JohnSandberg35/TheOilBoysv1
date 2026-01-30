import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("⚠️ STRIPE_SECRET_KEY not set - payment functionality will be disabled");
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
    })
  : null;

export interface CreatePaymentIntentParams {
  amount: number; // in cents
  appointmentId: string;
  customerEmail: string;
  customerName: string;
}

export async function createPaymentIntent(params: CreatePaymentIntentParams) {
  if (!stripe) {
    throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.");
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: params.amount,
    currency: "usd",
    metadata: {
      appointmentId: params.appointmentId,
      customerEmail: params.customerEmail,
      customerName: params.customerName,
    },
    receipt_email: params.customerEmail,
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

export async function confirmPaymentIntent(paymentIntentId: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
  if (paymentIntent.status === "succeeded") {
    return {
      success: true,
      chargeId: paymentIntent.latest_charge as string | undefined,
    };
  }

  return {
    success: false,
    status: paymentIntent.status,
  };
}
