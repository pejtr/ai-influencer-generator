import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Check, Sparkles, Zap, Crown, Building2, Loader2, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useSearch } from "wouter";

const TIER_ICONS = {
  free: Sparkles,
  starter: Zap,
  pro: Crown,
  business: Building2,
};

const TIER_COLORS = {
  free: "text-muted-foreground",
  starter: "text-blue-500",
  pro: "text-primary",
  business: "text-purple-500",
};

const PACK_IDS = ["credits_100", "credits_500", "credits_1000"] as const;

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
      // Clean URL
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

    subscriptionCheckout.mutate({ 
      tier: tier as "starter" | "pro" | "business" 
    });
  };

  const handleBuyCredits = (packIndex: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    creditPackCheckout.mutate({ 
      packId: PACK_IDS[packIndex] 
    });
  };

  const handleManageBilling = () => {
    billingPortal.mutate();
  };

  const tiers = pricing?.tiers ?? {
    free: { credits: 5, price: 0, features: ["5 credits/month", "Watermark on images", "Basic support"] },
    starter: { credits: 50, price: 9, features: ["50 credits/month", "No watermark", "HD downloads", "Email support"] },
    pro: { credits: 300, price: 29, features: ["300 credits/month", "No watermark", "HD downloads", "Priority support", "Commercial license"] },
    business: { credits: 1000, price: 99, features: ["1000 credits/month", "No watermark", "HD downloads", "Dedicated support", "API access", "White-label option"] },
  };

  const creditPacks = pricing?.creditPacks ?? [
    { credits: 100, price: 15 },
    { credits: 500, price: 60 },
    { credits: 1000, price: 100 },
  ];

  const isLoading = subscriptionCheckout.isPending || creditPackCheckout.isPending;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 pb-16">
        <div className="container">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent <span className="text-primary neon-text">Pricing</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Choose the plan that fits your needs. Start free and upgrade as you grow.
            </p>
          </div>

          {/* Current plan indicator */}
          {isAuthenticated && userCredits && (
            <div className="max-w-md mx-auto mb-8 p-4 rounded-xl bg-card border border-border text-center">
              <p className="text-sm text-muted-foreground mb-1">Your current plan</p>
              <p className="text-lg font-semibold capitalize">{userCredits.tier}</p>
              <p className="text-sm text-primary mb-3">{userCredits.credits} credits remaining</p>
              {userCredits.tier !== "free" && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleManageBilling}
                  disabled={billingPortal.isPending}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {billingPortal.isPending ? "Loading..." : "Manage Billing"}
                </Button>
              )}
            </div>
          )}

          {/* Pricing tiers */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {(Object.entries(tiers) as [keyof typeof tiers, typeof tiers.free][]).map(([key, tier]) => {
              const Icon = TIER_ICONS[key];
              const isCurrentPlan = userCredits?.tier === key;
              const isPopular = key === "pro";

              return (
                <div
                  key={key}
                  className={cn(
                    "relative rounded-2xl p-6 bg-card border transition-all",
                    isPopular ? "border-primary neon-glow" : "border-border",
                    isCurrentPlan && "ring-2 ring-primary"
                  )}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                      Most Popular
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
                      Current Plan
                    </div>
                  )}

                  <div className="mb-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-3", 
                      key === "pro" ? "gradient-primary" : "bg-secondary"
                    )}>
                      <Icon className={cn("w-6 h-6", key === "pro" ? "text-primary-foreground" : TIER_COLORS[key])} />
                    </div>
                    <h3 className="text-xl font-bold capitalize">{key}</h3>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">${tier.price}</span>
                      {tier.price > 0 && <span className="text-muted-foreground">/month</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tier.credits} credits per month
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={cn(
                      "w-full",
                      isPopular ? "gradient-primary neon-glow" : "",
                      isCurrentPlan && "opacity-50"
                    )}
                    variant={isPopular ? "default" : "outline"}
                    disabled={isCurrentPlan || isLoading}
                    onClick={() => handleSubscribe(key)}
                  >
                    {isLoading && subscriptionCheckout.variables?.tier === key ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {isCurrentPlan ? "Current Plan" : tier.price === 0 ? "Get Started" : "Subscribe"}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Credit packs */}
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Need More Credits?</h2>
              <p className="text-muted-foreground">
                Purchase additional credit packs anytime. No subscription required.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {creditPacks.map((pack, i) => (
                <div
                  key={i}
                  className="rounded-xl p-6 bg-card border border-border text-center hover:border-primary/50 transition-colors"
                >
                  <div className="text-3xl font-bold text-primary mb-1">{pack.credits}</div>
                  <div className="text-sm text-muted-foreground mb-4">credits</div>
                  <div className="text-2xl font-bold mb-4">${pack.price}</div>
                  <div className="text-xs text-muted-foreground mb-4">
                    ${(pack.price / pack.credits).toFixed(2)} per credit
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={!isAuthenticated || isLoading}
                    onClick={() => handleBuyCredits(i)}
                  >
                    {isLoading && creditPackCheckout.variables?.packId === PACK_IDS[i] ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Buy Now
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Test mode notice */}
          <div className="max-w-2xl mx-auto mt-8 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
            <p className="text-sm text-yellow-500">
              <strong>Test Mode:</strong> Use card number <code className="bg-background px-1 rounded">4242 4242 4242 4242</code> with any future expiry date and CVC to test payments.
            </p>
          </div>

          {/* FAQ or additional info */}
          <div className="max-w-2xl mx-auto mt-16 text-center">
            <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4 text-left">
              <div className="p-4 rounded-lg bg-card border border-border">
                <h3 className="font-semibold mb-2">What happens when I run out of credits?</h3>
                <p className="text-sm text-muted-foreground">
                  You can purchase additional credit packs or upgrade your plan. Unused credits from subscriptions roll over to the next month.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border">
                <h3 className="font-semibold mb-2">Can I cancel my subscription anytime?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes! You can cancel your subscription at any time. You'll keep access until the end of your billing period.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border">
                <h3 className="font-semibold mb-2">What's included in the commercial license?</h3>
                <p className="text-sm text-muted-foreground">
                  Pro and Business plans include a commercial license that allows you to use generated images for marketing, advertising, and other commercial purposes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
