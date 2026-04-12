import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Check, Sparkles, Zap, Crown, Loader2, CreditCard, Star, Gift, TrendingUp, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TIER_ICONS = {
  free: Sparkles,
  pro: Zap,
  creator: Crown,
};

const TIER_COLORS = {
  free: "text-muted-foreground",
  pro: "text-primary",
  creator: "text-purple-500",
};

// Feature descriptions for each tier
const TIER_FEATURES = {
  free: [
    "5 free generations daily",
    "Basic character customization",
    "Watermarked exports",
    "Community support",
  ],
  pro: [
    "500 credits/month",
    "5 free generations daily",
    "Full character customization",
    "HD exports without watermark",
    "Priority queue",
    "Fanvue integration",
    "Email support",
  ],
  creator: [
    "1500 credits/month",
    "5 free generations daily",
    "Batch generation (30 at once)",
    "Content scheduler",
    "Auto-publish to Fanvue",
    "AI Chat persona builder",
    "Advanced analytics",
    "Priority support",
  ],
};

// Credit pack data
const CREDIT_PACKS = [
  { id: "starter", name: "Starter", credits: 100, bonus: 0, price: 9.99, popular: false },
  { id: "growth", name: "Growth", credits: 400, bonus: 133, price: 29.99, popular: true },
  { id: "scale", name: "Scale", credits: 1500, bonus: 750, price: 99.99, popular: false },
];

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const [activeTab, setActiveTab] = useState<"subscription" | "credits">("subscription");

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
        setActiveTab("credits");
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

    subscriptionCheckout.mutate({ tier: tier as "pro" | "creator" });
  };

  const handleBuyCredits = (packId: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    creditPackCheckout.mutate({ packId: packId });
  };

  const tiers = [
    { id: "free", name: "Free", price: 0, credits: 5, description: "5 daily free generations" },
    { id: "pro", name: "Pro", price: 19.99, credits: 500, description: "500 credits/month + daily free" },
    { id: "creator", name: "Creator", price: 49.99, credits: 1500, description: "1500 credits/month + all features" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <main className="container py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="trust-badge mx-auto mb-6 inline-flex">
            <Star className="h-3.5 w-3.5" />
            Flexible Pricing for Every Creator
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 uppercase tracking-tight" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Pay Your Way: <span className="gold-gradient-text">Subscribe</span> or <span className="text-white/60">Buy Credits</span>
          </h1>
          <p className="text-xl text-white/50 max-w-2xl mx-auto">
            Choose a subscription for consistent monthly credits, or buy credit packs when you need them. Mix and match for maximum flexibility.
          </p>
          {/* Anchor pricing — show crossed-out value */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
            <span className="text-green-400 text-sm font-semibold">🎉 Limited: Save up to 40% vs competitors</span>
          </div>
        </div>

        {/* Current Balance */}
        {isAuthenticated && userCredits && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-4 px-6 py-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground">Your Balance:</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center px-3">
                  <div className="text-2xl font-bold text-green-500">{userCredits.freeCreditsToday || 0}</div>
                  <div className="text-xs text-muted-foreground">Free Today</div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center px-3">
                  <div className="text-2xl font-bold text-primary">{userCredits.subscriptionCredits || 0}</div>
                  <div className="text-xs text-muted-foreground">Monthly</div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center px-3">
                  <div className="text-2xl font-bold text-purple-500">{userCredits.paidCredits || 0}</div>
                  <div className="text-xs text-muted-foreground">Purchased</div>
                </div>
              </div>
              {userCredits.tier !== "free" && (
                <>
                  <div className="h-8 w-px bg-border" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => billingPortal.mutate()}
                    disabled={billingPortal.isPending}
                  >
                    {billingPortal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage Subscription"}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "subscription" | "credits")} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="subscription" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Monthly Plans
              </TabsTrigger>
              <TabsTrigger value="credits" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Credit Packs
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Subscription Plans */}
          <TabsContent value="subscription">
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {tiers.map((tier) => {
                const Icon = TIER_ICONS[tier.id as keyof typeof TIER_ICONS] || Sparkles;
                const colorClass = TIER_COLORS[tier.id as keyof typeof TIER_COLORS] || "text-muted-foreground";
                const features = TIER_FEATURES[tier.id as keyof typeof TIER_FEATURES] || [];
                const isCurrentTier = userCredits?.tier === tier.id;
                const isPro = tier.id === "pro";
                const isCreator = tier.id === "creator";

                return (
                  <div
                    key={tier.id}
                    className={cn(
                      "relative flex flex-col rounded-2xl p-6 transition-all duration-300",
                      isPro ? "premium-card gold-glow scale-105" : "bg-white/[0.03] border border-white/[0.08] hover:border-white/20",
                      isCreator && "bg-white/[0.04] border border-purple-500/30 hover:border-purple-500/60",
                      isCurrentTier && "ring-2 ring-amber-500/50"
                    )}
                  >
                    {/* Popular Badge */}
                    {isPro && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="px-4 py-1 rounded-full text-black text-xs font-bold uppercase btn-gold">
                          Most Popular
                        </span>
                      </div>
                    )}
                    {isCreator && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="px-4 py-1 rounded-full bg-purple-500 text-white text-xs font-bold uppercase">
                          Best Value
                        </span>
                      </div>
                    )}

                    {/* Tier Header */}
                    <div className="mb-6">
                      <div className={cn("inline-flex p-3 rounded-xl mb-4", 
                        tier.id === "free" && "bg-white/10",
                        tier.id === "pro" && "bg-amber-500/15",
                        tier.id === "creator" && "bg-purple-500/10"
                      )}>
                        <Icon className={cn("h-6 w-6", isPro ? "gold-text" : colorClass)} />
                      </div>
                      <h3 className="text-xl font-bold uppercase tracking-wide" style={{ fontFamily: "'Oswald', sans-serif" }}>{tier.name}</h3>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className={cn("text-4xl font-bold", isPro && "gold-gradient-text")}>${tier.price}</span>
                        {tier.price > 0 && <span className="text-white/40">/month</span>}
                        {tier.price === 0 && <span className="text-white/40">forever</span>}
                      </div>
                      {/* Anchor: show what it would cost elsewhere */}
                      {isPro && <p className="text-xs text-green-400 mt-1">Competitors charge $49+/mo for this</p>}
                      {isCreator && <p className="text-xs text-purple-400 mt-1">Competitors charge $99+/mo for this</p>}
                      <p className="text-sm text-white/40 mt-2">
                        {tier.description}
                      </p>
                    </div>

                    {/* Features */}
                    <div className="flex-1 space-y-3 mb-6">
                      {features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className={cn("h-5 w-5 mt-0.5 shrink-0", isPro ? "gold-text" : "text-green-400")} />
                          <span className="text-sm text-white/70">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <Button
                      className={cn(
                        "w-full font-bold",
                        isPro && "btn-gold text-black",
                        isCreator && "bg-purple-500 hover:bg-purple-600 text-white",
                        tier.id === "free" && "border border-white/20 text-white hover:bg-white/10 bg-transparent"
                      )}
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={isCurrentTier || subscriptionCheckout.isPending}
                    >
                      {subscriptionCheckout.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isCurrentTier ? (
                        "✓ Current Plan"
                      ) : tier.id === "free" ? (
                        "Get Started Free"
                      ) : (
                        `Upgrade to ${tier.name} →`
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Free Credits Info */}
            <div className="mt-12 max-w-2xl mx-auto">
              <div className="flex items-center gap-4 p-6 rounded-xl bg-green-500/10 border border-green-500/20">
                <Gift className="h-10 w-10 text-green-500 shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-500">5 Free Generations Daily</h4>
                  <p className="text-sm text-muted-foreground">
                    Every user gets 5 free AI generations per day, regardless of subscription. Free credits reset at midnight UTC.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Credit Packs */}
          <TabsContent value="credits">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Buy Credits When You Need Them</h2>
                <p className="text-muted-foreground">
                  No subscription required. Credits never expire and can be used anytime.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {CREDIT_PACKS.map((pack) => (
                  <div
                    key={pack.id}
                    className={cn(
                      "relative flex flex-col rounded-2xl p-6 transition-all duration-300",
                      pack.popular ? "premium-card gold-glow scale-105" : "bg-white/[0.03] border border-white/[0.08] hover:border-white/20"
                    )}
                  >
                    {pack.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="px-4 py-1 rounded-full btn-gold text-black text-xs font-bold uppercase">
                          Best Value
                        </span>
                      </div>
                    )}

                    <div className="mb-6">
                      <div className={cn("inline-flex p-3 rounded-xl mb-4", pack.popular ? "bg-amber-500/15" : "bg-white/10")}>
                        <CreditCard className={cn("h-6 w-6", pack.popular ? "gold-text" : "text-white/60")} />
                      </div>
                      <h3 className="text-xl font-bold uppercase tracking-wide" style={{ fontFamily: "'Oswald', sans-serif" }}>{pack.name}</h3>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className={cn("text-4xl font-bold", pack.popular && "gold-gradient-text")}>${pack.price}</span>
                        <span className="text-white/40"> one-time</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3 mb-6">
                      <div className="flex items-center gap-2">
                        <Check className={cn("h-5 w-5", pack.popular ? "gold-text" : "text-green-400")} />
                        <span className="text-lg font-semibold">{pack.credits} credits</span>
                      </div>
                      {pack.bonus > 0 && (
                        <div className="flex items-center gap-2 text-green-500">
                          <Gift className="h-5 w-5" />
                          <span className="font-medium">+{pack.bonus} bonus credits!</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Check className="h-5 w-5" />
                        <span className="text-sm">Never expires</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Check className="h-5 w-5" />
                        <span className="text-sm">Use anytime</span>
                      </div>
                      {pack.bonus > 0 && (
                        <div className="pt-2 border-t border-border">
                          <div className="text-sm text-muted-foreground">
                            Total: <span className="font-bold text-foreground">{pack.credits + pack.bonus} credits</span>
                          </div>
                          <div className="text-xs text-green-500">
                            Save {Math.round((pack.bonus / pack.credits) * 100)}%
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      className={cn(
                        "w-full font-bold",
                        pack.popular ? "btn-gold text-black" : "border border-white/20 text-white hover:bg-white/10 bg-transparent"
                      )}
                      onClick={() => handleBuyCredits(pack.id)}
                      disabled={creditPackCheckout.isPending}
                    >
                      {creditPackCheckout.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        `Buy ${pack.credits + pack.bonus} Credits →`
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              {/* Credit Usage Info */}
              <div className="mt-12 grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-card border border-border text-center">
                  <div className="text-3xl font-bold text-primary mb-1">1</div>
                  <div className="text-sm text-muted-foreground">credit = 1 AI generation</div>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border text-center">
                  <div className="text-3xl font-bold text-green-500 mb-1">∞</div>
                  <div className="text-sm text-muted-foreground">Credits never expire</div>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border text-center">
                  <div className="text-3xl font-bold text-purple-500 mb-1">+</div>
                  <div className="text-sm text-muted-foreground">Stack with subscription</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 uppercase tracking-wide" style={{ fontFamily: "'Oswald', sans-serif" }}>Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-amber-500/20 transition-colors">
              <h4 className="font-semibold mb-2">How do credits work?</h4>
              <p className="text-sm text-white/50">
                Each AI generation costs 1 credit. You get 5 free credits daily (reset at midnight UTC). 
                Subscription credits are added monthly. Purchased credits never expire.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-amber-500/20 transition-colors">
              <h4 className="font-semibold mb-2">Which credits are used first?</h4>
              <p className="text-sm text-white/50">
                Credits are used in this order: Free daily credits → Subscription credits → Purchased credits. 
                This ensures your purchased credits last as long as possible.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-amber-500/20 transition-colors">
              <h4 className="font-semibold mb-2">Can I combine subscription and credit packs?</h4>
              <p className="text-sm text-white/50">
                Yes! You can have a subscription AND buy credit packs. They stack together. 
                Great for when you need extra credits for a big project.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-amber-500/20 transition-colors">
              <h4 className="font-semibold mb-2">Do unused subscription credits roll over?</h4>
              <p className="text-sm text-white/50">
                Subscription credits reset each billing cycle and don't roll over. 
                However, purchased credit packs never expire and are always available.
              </p>
            </div>
          </div>
        </div>

        {/* Test Card Notice */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            🧪 Test mode: Use card <code className="px-2 py-1 rounded bg-muted">4242 4242 4242 4242</code> with any future date and CVC
          </p>
        </div>
      </main>
    </div>
  );
}
