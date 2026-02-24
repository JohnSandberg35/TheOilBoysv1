import { useState, useEffect } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CreditCard } from "lucide-react";

interface PaymentFormProps {
  amount: number;
  appointmentData: any;
  onSuccess: (appointment: any) => void;
  onError: (error: string) => void;
}

function PaymentFormContent({
  amount,
  appointmentData,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Create payment intent when component mounts
  useEffect(() => {
    async function createIntent() {
      try {
        setIsLoading(true);
        const intentResponse = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            appointmentData,
          }),
        });

        if (!intentResponse.ok) {
          const errorData = await intentResponse.json();
          throw new Error(errorData.error || "Failed to create payment intent");
        }

        const data = await intentResponse.json();
        setClientSecret(data.clientSecret);
        setAppointmentId(data.appointmentId);
        setPaymentIntentId(data.paymentIntentId);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        onError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }

    createIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault?.();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      console.log('💳 Confirming payment with Stripe...');
      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: appointmentData.customerName,
              email: appointmentData.customerEmail,
              phone: appointmentData.customerPhone,
            },
          },
        });

      console.log('💳 Stripe payment result:', { stripeError, paymentIntent });

      if (stripeError) {
        console.error('❌ Stripe error:', stripeError);
        throw new Error(stripeError.message || "Payment failed");
      }

      if (paymentIntent?.status !== "succeeded") {
        console.error('❌ Payment status not succeeded:', paymentIntent?.status);
        throw new Error(`Payment was not successful. Status: ${paymentIntent?.status}`);
      }

      console.log('✅ Stripe payment succeeded');

      // Confirm payment on backend
      if (!paymentIntentId || !appointmentId) {
        throw new Error("Missing payment information");
      }

      const confirmResponse = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId,
          appointmentId,
        }),
      });

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        throw new Error(errorData.error || "Failed to confirm payment");
      }

      const confirmData = await confirmResponse.json();
      console.log('✅ Payment confirmed, appointment:', confirmData);
      
      if (!confirmData.appointment) {
        throw new Error("Appointment data not returned from server");
      }
      
      onSuccess(confirmData.appointment);
    } catch (err) {
      console.error('❌ Payment error:', err);
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Setting up payment...</span>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">
          Failed to initialize payment. Please try again.
        </p>
        {error && (
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Card Information
          </label>
          <div className="border rounded-lg p-4 bg-background">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-2xl font-bold">${amount.toFixed(2)}</p>
          </div>
          <Button
            type="button"
            disabled={!stripe || !elements || isProcessing}
            className="min-w-[150px]"
            onClick={() => handleSubmit()}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay ${amount.toFixed(2)}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PaymentForm(props: PaymentFormProps) {
  const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

  if (!stripePublishableKey) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">
            Stripe is not configured. Set VITE_STRIPE_PUBLISHABLE_KEY in your environment.
          </p>
        </CardContent>
      </Card>
    );
  }

  const stripePromise = loadStripe(stripePublishableKey);

  const options: StripeElementsOptions = {
    appearance: {
      theme: "stripe",
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentFormContent {...props} />
    </Elements>
  );
}
