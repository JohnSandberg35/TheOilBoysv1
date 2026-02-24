import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  console.warn("⚠️ Stripe secret key not set - payment functionality will be disabled");
}

export const stripe = secretKey
  ? new Stripe(secretKey, { apiVersion: "2024-11-20.acacia" })
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
