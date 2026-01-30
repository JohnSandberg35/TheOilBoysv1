# Stripe Payment Integration Setup Guide

## Overview
Stripe payment processing has been integrated into the booking flow. Customers now pay securely via credit/debit card when booking an appointment.

## What's Been Implemented

### Backend
- ✅ Stripe SDK installed (`stripe` package)
- ✅ Payment service (`server/stripe.ts`) with:
  - `createPaymentIntent()` - Creates a Stripe payment intent
  - `confirmPaymentIntent()` - Confirms payment completion
- ✅ Payment API endpoints:
  - `POST /api/payments/create-intent` - Creates payment intent and temporary appointment
  - `POST /api/payments/confirm` - Confirms payment and finalizes appointment
- ✅ Database fields added:
  - `stripe_payment_intent_id` - Stripe payment intent ID
  - `stripe_charge_id` - Stripe charge ID after payment succeeds
  - `payment_status` - Payment status (pending, paid, failed)

### Frontend
- ✅ Stripe React components installed (`@stripe/stripe-js`, `@stripe/react-stripe-js`)
- ✅ Payment form component (`client/src/components/PaymentForm.tsx`)
- ✅ Booking flow updated to 4 steps:
  1. Vehicle & Service Info
  2. Date, Time & Location
  3. Contact Details
  4. **Payment** (NEW)
- ✅ Payment step shows appointment summary and secure card input

## Setup Instructions

### 1. Create Stripe Account
1. Go to https://stripe.com
2. Sign up for a free account
3. Complete business verification (if required for your region)

### 2. Get API Keys

**Test Mode (for development):**
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_...`)
3. Copy your **Secret key** (starts with `sk_test_...`)

**Live Mode (for production):**
1. Switch to "Live mode" in Stripe dashboard
2. Go to https://dashboard.stripe.com/apikeys
3. Copy your **Publishable key** (starts with `pk_live_...`)
4. Copy your **Secret key** (starts with `sk_live_...`)

### 3. Add Environment Variables

Add these to your `.env` file:

```env
# Stripe Test Keys (for development)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Stripe Live Keys (for production - use when ready to go live)
# VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
# STRIPE_SECRET_KEY=sk_live_...
```

**Important:**
- `VITE_STRIPE_PUBLISHABLE_KEY` - Used in frontend (React components)
- `STRIPE_SECRET_KEY` - Used in backend (server-side only, never expose!)

### 4. Test the Payment Flow

1. Start your development server: `npm run dev`
2. Go through the booking flow
3. On Step 4 (Payment), use Stripe test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Declined**: `4000 0000 0000 0002`
   - Use any future expiry date (e.g., 12/25)
   - Use any 3-digit CVC (e.g., 123)

### 5. Verify in Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/payments
2. You should see test payments appear when you complete bookings
3. Check payment details, customer info, etc.

## How It Works

### Booking Flow:
1. Customer fills out Steps 1-3 (vehicle, date/time, contact info)
2. **Step 4**: Payment form appears
3. Backend creates a temporary appointment with `payment_status: 'pending'`
4. Backend creates Stripe payment intent
5. Customer enters card details
6. Stripe processes payment
7. On success, backend:
   - Updates appointment with payment details
   - Sets `payment_status: 'paid'`, `isPaid: true`, `paymentMethod: 'Stripe'`
   - Sends confirmation emails
8. Customer sees success message and is redirected to home

### Payment Tracking:
- All Stripe payments are automatically tracked in the database
- Job Records tab shows `paymentMethod: 'Stripe'` for Stripe payments
- `isPaid` is automatically set to `true` when payment succeeds
- `dateReceived` and `dateBilled` are set to payment date

## Going Live

When ready for production:

1. **Switch to Live Keys:**
   - Update `.env` with live keys (`pk_live_...`, `sk_live_...`)
   - Restart server

2. **Test with Real Card:**
   - Use a real card with a small amount first
   - Verify payment appears in Stripe dashboard (live mode)

3. **Monitor:**
   - Check Stripe dashboard regularly
   - Set up webhooks if needed (for advanced features)

## Troubleshooting

**"Stripe is not configured" error:**
- Check that `VITE_STRIPE_PUBLISHABLE_KEY` is set in `.env`
- Restart dev server after adding env vars

**Payment fails:**
- Check server logs for errors
- Verify `STRIPE_SECRET_KEY` is set correctly
- Check Stripe dashboard for declined payment reasons

**Test cards not working:**
- Make sure you're using test keys (not live keys)
- Verify you're in Stripe test mode in dashboard

## Security Notes

- ✅ Secret key is server-side only (never exposed to frontend)
- ✅ Payment processing happens securely through Stripe
- ✅ Card details never touch your server (handled by Stripe)
- ✅ PCI compliance handled by Stripe

## Next Steps

1. Set up your Stripe account
2. Add test keys to `.env`
3. Test the booking flow
4. When ready, switch to live keys
