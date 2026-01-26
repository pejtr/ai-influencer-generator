import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Check, Sparkles, Zap, Crown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const { data: pricing } = trpc.credits.getPricing.useQuery();
  const { data: userCredits } = trpc.credits.getBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const handleSubscribe = (tier: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    if (tier === "free") {
      toast.info("You're already on the free plan!");
      return;
    }

    // TODO: Implement Stripe checkout
    toast.info("Stripe integration coming soon! Contact us for early access.");
  };

  const handleBuyCredits = (credits: number, price: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    // TODO: Implement Stripe checkout for credit packs
    toast.info("Credit pack purchases coming soon!");
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
              <p className="text-sm text-primary">{userCredits.credits} credits remaining</p>
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
                    disabled={isCurrentPlan}
                    onClick={() => handleSubscribe(key)}
                  >
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
                    onClick={() => handleBuyCredits(pack.credits, pack.price)}
                  >
                    Buy Now
                  </Button>
                </div>
              ))}
            </div>
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
