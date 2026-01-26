import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Check, Sparkles, Zap, Crown, Gem, Loader2, CreditCard, Star, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useSearch } from "wouter";

const TIER_ICONS = {
  free: Sparkles,
  basic: Zap,
  premium: Crown,
  vip: Gem,
};

const TIER_COLORS = {
  free: "text-muted-foreground",
  basic: "text-blue-500",
  premium: "text-primary",
  vip: "text-purple-500",
};

const PACK_IDS = ["credits_100", "credits_500", "credits_1000"] as const;

// Feature descriptions for each tier
const TIER_FEATURES = {
  free: [
    "5 AI generations per month",
    "Basic character customization",
    "Watermarked exports",
    "Community support",
  ],
  basic: [
    "50 AI generations per month",
    "Full character customization",
    "HD exports without watermark",
    "Email support",
    "Basic analytics",
  ],
  premium: [
    "300 AI generations per month",
    "Batch generation (30 at once)",
    "Content calendar",
    "Priority support",
    "Advanced analytics",
    "Fanvue integration",
    "Auto-publish scheduling",
  ],
  vip: [
    "1000+ AI generations per month",
    "Unlimited batch generation",
    "AI Chat persona builder",
    "White-label exports",
    "Dedicated account manager",
    "Full Fanvue/OnlyFans integration",
    "Revenue tracking dashboard",
    "API access",
  ],
};

// Locked features shown to lower tiers
const LOCKED_FEATURES = {
  free: ["HD exports", "Batch generation", "Fanvue integration", "AI Chat builder"],
  basic: ["Batch generation", "Fanvue integration", "AI Chat builder", "API access"],
  premium: ["Unlimited generations", "AI Chat builder", "API access", "White-label"],
};

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  
  const { data: pricing } = trpc.credits.getPricing.useQuery();
  const { data: userCredits, refetch: refetchCredits } = trpc.credits.getBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Stripe checkout mutations
  const subscriptionCheckout = trpc.stripe.createSubscriptionCheckout.useMutation({
    onSuccess: (data) => {
      toast.info("Redirecting to checkout...");
      window.open(data.url, "_blank");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
    },
  });

  const creditPackCheckout = trpc.stripe.createCreditPackCheckout.useMutation({
    onSuccess: (data) => {
      toast.info("Redirecting to checkout...");
      window.open(data.url, "_blank");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
    },
  });

  const billingPortal = trpc.stripe.getBillingPortal.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to open billing portal");
    },
  });

  // Handle success/cancel from Stripe redirect
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    const credits = searchParams.get("credits");

    if (success === "true") {
      if (credits) {
        toast.success(`Successfully purchased ${credits} credits!`);
      } else {
        toast.success("Subscription activated successfully!");
      }
      refetchCredits();
      window.history.replaceState({}, "", "/pricing");
    } else if (canceled === "true") {
      toast.info("Checkout was canceled");
      window.history.replaceState({}, "", "/pricing");
    }
  }, [searchString]);

  const handleSubscribe = (tier: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    if (tier === "free") {
      toast.info("You're already on the free plan!");
      return;
    }

    if (tier === userCredits?.tier) {
      toast.info("You're already on this plan!");
      return;
    }

    subscriptionCheckout.mutate({ tier: tier as "basic" | "premium" | "vip" });
  };

  const handleBuyCredits = (packId: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    creditPackCheckout.mutate({ packId: packId as "credits_100" | "credits_500" | "credits_1000" });
  };

  const tiers = pricing?.tiers ? Object.values(pricing.tiers) : [];
  const creditPacks = pricing?.creditPacks || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Star className="h-4 w-4" />
            AI Influencer Marketing Platform
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your <span className="text-primary">Success</span> Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From hobbyist to professional AI influencer creator. Scale your virtual persona empire with our flexible plans.
          </p>
        </div>

        {/* Current Plan Badge */}
        {isAuthenticated && userCredits && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-card border border-border">
              <span className="text-muted-foreground">Current plan:</span>
              <span className={cn("font-bold uppercase", TIER_COLORS[userCredits.tier as keyof typeof TIER_COLORS])}>
                {userCredits.tier}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="font-medium">{userCredits.credits} credits</span>
              {userCredits.tier !== "free" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => billingPortal.mutate()}
                  disabled={billingPortal.isPending}
                >
                  {billingPortal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage Subscription"}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Pricing Tiers */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {tiers.map((tier) => {
            const Icon = TIER_ICONS[tier.id as keyof typeof TIER_ICONS] || Sparkles;
            const colorClass = TIER_COLORS[tier.id as keyof typeof TIER_COLORS] || "text-muted-foreground";
            const features = TIER_FEATURES[tier.id as keyof typeof TIER_FEATURES] || [];
            const lockedFeatures = LOCKED_FEATURES[tier.id as keyof typeof LOCKED_FEATURES] || [];
            const isCurrentTier = userCredits?.tier === tier.id;
            const isPremium = tier.id === "premium";
            const isVip = tier.id === "vip";

            return (
              <div
                key={tier.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-card p-6 transition-all duration-300",
                  isPremium && "border-primary shadow-lg shadow-primary/20 scale-105",
                  isVip && "border-purple-500 shadow-lg shadow-purple-500/20",
                  isCurrentTier && "ring-2 ring-primary"
                )}
              >
                {/* Popular Badge */}
                {isPremium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase">
                      Most Popular
                    </span>
                  </div>
                )}
                {isVip && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-purple-500 text-white text-xs font-bold uppercase">
                      Best Value
                    </span>
                  </div>
                )}

                {/* Tier Header */}
                <div className="mb-6">
                  <div className={cn("inline-flex p-3 rounded-xl mb-4", 
                    tier.id === "free" && "bg-secondary",
                    tier.id === "basic" && "bg-blue-500/10",
                    tier.id === "premium" && "bg-primary/10",
                    tier.id === "vip" && "bg-purple-500/10"
                  )}>
                    <Icon className={cn("h-6 w-6", colorClass)} />
                  </div>
                  <h3 className="text-xl font-bold uppercase">{tier.name}</h3>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">${tier.price}</span>
                    {tier.price > 0 && <span className="text-muted-foreground">/month</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {tier.credits} credits/month
                  </p>
                </div>

                {/* Features */}
                <div className="flex-1 space-y-3 mb-6">
                  {features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className={cn("h-5 w-5 mt-0.5 shrink-0", colorClass)} />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  {/* Locked features preview */}
                  {lockedFeatures.slice(0, 2).map((feature, i) => (
                    <div key={`locked-${i}`} className="flex items-start gap-2 opacity-40">
                      <Lock className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground line-through">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  className={cn(
                    "w-full",
                    isPremium && "bg-primary hover:bg-primary/90",
                    isVip && "bg-purple-500 hover:bg-purple-600"
                  )}
                  variant={tier.id === "free" ? "outline" : "default"}
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={isCurrentTier || subscriptionCheckout.isPending}
                >
                  {subscriptionCheckout.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrentTier ? (
                    "Current Plan"
                  ) : tier.id === "free" ? (
                    "Get Started Free"
                  ) : (
                    `Upgrade to ${tier.name}`
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Credit Packs */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">
              Need More <span className="text-primary">Credits</span>?
            </h2>
            <p className="text-muted-foreground">
              One-time credit packs for extra generations. No subscription required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {creditPacks.map((pack) => (
              <div
                key={pack.id}
                className="rounded-xl border bg-card p-6 text-center hover:border-primary/50 transition-colors"
              >
                <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">{pack.credits} Credits</h3>
                <p className="text-3xl font-bold text-primary mt-2">${pack.price}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  ${(pack.price / pack.credits).toFixed(2)} per credit
                </p>
                <Button
                  className="w-full mt-4"
                  variant="outline"
                  onClick={() => handleBuyCredits(pack.id)}
                  disabled={creditPackCheckout.isPending}
                >
                  {creditPackCheckout.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Buy Now"
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Test Mode Notice */}
        <div className="mt-16 p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/20 max-w-2xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <CreditCard className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <h4 className="font-semibold text-yellow-500">Test Mode Active</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Use test card <code className="px-2 py-0.5 rounded bg-secondary font-mono">4242 4242 4242 4242</code> with any future expiry and CVC.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          
          <div className="space-y-6">
            {[
              {
                q: "What happens when I run out of credits?",
                a: "You can purchase additional credit packs anytime, or upgrade to a higher tier for more monthly credits. Unused credits roll over to the next month."
              },
              {
                q: "Can I cancel my subscription anytime?",
                a: "Yes! You can cancel anytime from your billing portal. You'll keep access until the end of your billing period."
              },
              {
                q: "What's included in Fanvue integration?",
                a: "Premium and VIP tiers include OAuth connection to Fanvue, auto-publish scheduling, and revenue tracking. Perfect for monetizing your AI influencer."
              },
              {
                q: "Do you offer refunds?",
                a: "We offer a 7-day money-back guarantee for first-time subscribers. Contact support if you're not satisfied."
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, debit cards, and Apple Pay through our secure Stripe payment system."
              }
            ].map((faq, i) => (
              <div key={i} className="p-6 rounded-xl bg-card border border-border">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-20">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2026 AI Influencer Generator. The #1 AI Influencer Marketing Platform.</p>
        </div>
      </footer>
    </div>
  );
}
