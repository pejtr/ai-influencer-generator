import { Request, Response } from "express";
import Stripe from "stripe";
import { stripe, constructWebhookEvent } from "./stripe";
import { getTierByName, getTierCredits, getCreditPackById, TierName } from "./products";
import { 
  getUserByStripeCustomerId, 
  updateUserTier, 
  addUserCredits,
  updateUserStripeSubscription,
  createCreditTransaction,
  getUserById
} from "../db";

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"] as string;

  if (!signature) {
    console.error("[Webhook] No signature provided");
    return res.status(400).json({ error: "No signature" });
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(req.body, signature);
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return res.status(400).json({ error: "Invalid signature" });
  }

  console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error(`[Webhook] Error handling ${event.type}:`, error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
}

/**
 * Handle checkout.session.completed
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`[Webhook] Checkout completed: ${session.id}`);

  const userId = parseInt(session.metadata?.user_id || session.client_reference_id || "0");
  if (!userId) {
    console.error("[Webhook] No user ID in checkout session");
    return;
  }

  // Handle subscription checkout
  if (session.mode === "subscription" && session.subscription) {
    const tier = session.metadata?.tier as TierName;
    const subscriptionId = typeof session.subscription === "string" 
      ? session.subscription 
      : session.subscription.id;

    console.log(`[Webhook] Subscription created for user ${userId}, tier: ${tier}`);

    // Update user tier and subscription
    await updateUserTier(userId, tier);
    await updateUserStripeSubscription(userId, subscriptionId);

    // Add monthly credits
    const credits = getTierCredits(tier);
    await addUserCredits(userId, credits);

    // Log transaction
    const user = await getUserById(userId);
    await createCreditTransaction({
      userId,
      amount: credits,
      type: "subscription",
      description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} subscription - ${credits} credits`,
      balanceAfter: (user?.credits || 0) + credits,
    });

    console.log(`[Webhook] Added ${credits} credits to user ${userId}`);
  }

  // Handle one-time credit pack purchase
  if (session.mode === "payment") {
    const packId = session.metadata?.pack_id;
    const credits = parseInt(session.metadata?.credits || "0");

    if (packId && credits > 0) {
      console.log(`[Webhook] Credit pack purchased: ${packId} (${credits} credits) for user ${userId}`);

      await addUserCredits(userId, credits);

      // Log transaction
      const user = await getUserById(userId);
      await createCreditTransaction({
        userId,
        amount: credits,
        type: "purchase",
        description: `Credit pack purchase - ${credits} credits`,
        balanceAfter: (user?.credits || 0) + credits,
      });

      console.log(`[Webhook] Added ${credits} credits to user ${userId}`);
    }
  }
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`[Webhook] Subscription updated: ${subscription.id}, status: ${subscription.status}`);

  const userId = parseInt(subscription.metadata?.user_id || "0");
  if (!userId) {
    // Try to find user by customer ID
    const customerId = typeof subscription.customer === "string" 
      ? subscription.customer 
      : subscription.customer.id;
    
    const user = await getUserByStripeCustomerId(customerId);
    if (!user) {
      console.error("[Webhook] Cannot find user for subscription");
      return;
    }
  }

  const tier = subscription.metadata?.tier as TierName;
  
  if (subscription.status === "active" && tier) {
    await updateUserTier(userId, tier);
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`[Webhook] Subscription deleted: ${subscription.id}`);

  const customerId = typeof subscription.customer === "string" 
    ? subscription.customer 
    : subscription.customer.id;

  const user = await getUserByStripeCustomerId(customerId);
  if (!user) {
    console.error("[Webhook] Cannot find user for cancelled subscription");
    return;
  }

  // Downgrade to free tier
  await updateUserTier(user.id, "free");
  await updateUserStripeSubscription(user.id, null);

  console.log(`[Webhook] User ${user.id} downgraded to free tier`);
}

/**
 * Handle successful invoice payment (subscription renewal)
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Only handle subscription invoices (not the first one which is handled by checkout)
  const invoiceAny = invoice as any;
  if (!invoiceAny.subscription || invoice.billing_reason === "subscription_create") {
    return;
  }

  console.log(`[Webhook] Invoice paid: ${invoice.id}`);

  const customerId = typeof invoice.customer === "string" 
    ? invoice.customer 
    : invoice.customer?.id;

  if (!customerId) return;

  const user = await getUserByStripeCustomerId(customerId);
  if (!user) {
    console.error("[Webhook] Cannot find user for invoice");
    return;
  }

  // Get subscription to find tier
  const subscriptionId = typeof invoiceAny.subscription === "string"
    ? invoiceAny.subscription
    : invoiceAny.subscription.id;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const tier = subscription.metadata?.tier as TierName;

  if (tier) {
    const credits = getTierCredits(tier);
    
    // Reset monthly credits
    await addUserCredits(user.id, credits);

    await createCreditTransaction({
      userId: user.id,
      amount: credits,
      type: "subscription",
      description: `Monthly renewal - ${credits} credits`,
      balanceAfter: (user.credits || 0) + credits,
    });

    console.log(`[Webhook] Monthly renewal: Added ${credits} credits to user ${user.id}`);
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`[Webhook] Invoice payment failed: ${invoice.id}`);

  const customerId = typeof invoice.customer === "string" 
    ? invoice.customer 
    : invoice.customer?.id;

  if (!customerId) return;

  const user = await getUserByStripeCustomerId(customerId);
  if (user) {
    // Could send notification to user about failed payment
    console.log(`[Webhook] Payment failed for user ${user.id}`);
  }
}
