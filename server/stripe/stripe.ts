import Stripe from "stripe";
import { ENV } from "../_core/env";
import { SUBSCRIPTION_TIERS, CREDIT_PACKS, TierName, getTierByName, getCreditPackById, CreditPack } from "./products";

// Initialize Stripe with secret key
const stripe = new Stripe(ENV.stripeSecretKey || "", {
  apiVersion: "2025-12-15.clover",
});

export { stripe };

/**
 * Create or retrieve a Stripe customer for a user
 */
export async function getOrCreateCustomer(
  userId: number,
  email: string,
  name?: string | null,
  existingCustomerId?: string | null
): Promise<string> {
  // Return existing customer if we have one
  if (existingCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(existingCustomerId);
      if (!customer.deleted) {
        return existingCustomerId;
      }
    } catch {
      // Customer doesn't exist, create new one
    }
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      user_id: userId.toString(),
    },
  });

  return customer.id;
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createSubscriptionCheckout(
  userId: number,
  email: string,
  name: string | null,
  tier: TierName,
  customerId: string,
  origin: string,
  affiliateCode?: string | null
): Promise<{ url: string; sessionId: string }> {
  const tierConfig = getTierByName(tier);
  if (!tierConfig) {
    throw new Error(`Invalid tier: ${tier}`);
  }

  // Create or get price for this tier
  const price = await getOrCreateSubscriptionPrice(tier, tierConfig.priceMonthly);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    customer_email: undefined, // Already have customer
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
    client_reference_id: userId.toString(),
    metadata: {
      user_id: userId.toString(),
      customer_email: email,
      customer_name: name || "",
      tier: tier,
      affiliate_code: affiliateCode || "",
    },
    success_url: `${origin}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?canceled=true`,
    subscription_data: {
      metadata: {
        user_id: userId.toString(),
        tier: tier,
        affiliate_code: affiliateCode || "",
      },
    },
  });

  return {
    url: session.url!,
    sessionId: session.id,
  };
}

/**
 * Create a Stripe Checkout session for one-time credit pack purchase
 */
export async function createCreditPackCheckout(
  userId: number,
  email: string,
  name: string | null,
  packId: string,
  customerId: string,
  origin: string
): Promise<{ url: string; sessionId: string }> {
  const pack = getCreditPackById(packId);
  if (!pack) {
    throw new Error(`Invalid credit pack: ${packId}`);
  }

  // Create or get price for this credit pack
  const price = await getOrCreateCreditPackPrice(packId, pack.totalCredits, pack.price);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
    client_reference_id: userId.toString(),
    metadata: {
      user_id: userId.toString(),
      customer_email: email,
      customer_name: name || "",
      pack_id: packId,
      pack_slug: pack.slug,
      credits: pack.credits.toString(),
      bonus_credits: pack.bonusCredits.toString(),
      total_credits: pack.totalCredits.toString(),
    },
    success_url: `${origin}/pricing?success=true&credits=${pack.totalCredits}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?canceled=true`,
  });

  return {
    url: session.url!,
    sessionId: session.id,
  };
}

/**
 * Get or create a subscription price for a tier
 */
async function getOrCreateSubscriptionPrice(tier: TierName, amountCents: number): Promise<Stripe.Price> {
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  const productName = `AI Influencer Generator - ${tierConfig.displayName}`;
  
  // Search for existing product
  const products = await stripe.products.search({
    query: `name:'${productName}' AND active:'true'`,
  });

  let product: Stripe.Product;
  
  if (products.data.length > 0) {
    product = products.data[0];
  } else {
    // Create new product
    product = await stripe.products.create({
      name: productName,
      description: tierConfig.description,
      metadata: {
        tier: tier,
        monthly_credits: tierConfig.monthlyCredits.toString(),
      },
    });
  }

  // Search for existing price
  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
    type: "recurring",
  });

  const existingPrice = prices.data.find(
    (p: Stripe.Price) => p.unit_amount === amountCents && p.recurring?.interval === "month"
  );

  if (existingPrice) {
    return existingPrice;
  }

  // Create new price
  return stripe.prices.create({
    product: product.id,
    unit_amount: amountCents,
    currency: "usd",
    recurring: {
      interval: "month",
    },
    metadata: {
      tier: tier,
    },
  });
}

/**
 * Get or create a one-time price for a credit pack
 */
async function getOrCreateCreditPackPrice(packId: string, totalCredits: number, amountCents: number): Promise<Stripe.Price> {
  const productName = `AI Influencer Generator - ${totalCredits} Credits`;
  
  // Search for existing product
  const products = await stripe.products.search({
    query: `name:'${productName}' AND active:'true'`,
  });

  let product: Stripe.Product;
  
  if (products.data.length > 0) {
    product = products.data[0];
  } else {
    // Create new product
    product = await stripe.products.create({
      name: productName,
      description: `${totalCredits} credits for AI Influencer Generator`,
      metadata: {
        pack_id: packId,
        credits: totalCredits.toString(),
      },
    });
  }

  // Search for existing price
  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
    type: "one_time",
  });

  const existingPrice = prices.data.find((p: Stripe.Price) => p.unit_amount === amountCents);

  if (existingPrice) {
    return existingPrice;
  }

  // Create new price
  return stripe.prices.create({
    product: product.id,
    unit_amount: amountCents,
    currency: "usd",
    metadata: {
      pack_id: packId,
      credits: totalCredits.toString(),
    },
  });
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<Stripe.Subscription> {
  if (cancelAtPeriodEnd) {
    return stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  } else {
    return stripe.subscriptions.cancel(subscriptionId);
  }
}

/**
 * Resume a subscription that was set to cancel
 */
export async function resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch {
    return null;
  }
}

/**
 * Create a billing portal session for managing subscription
 */
export async function createBillingPortalSession(customerId: string, returnUrl: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

/**
 * Verify webhook signature
 */
export function constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    ENV.stripeWebhookSecret || ""
  );
}
