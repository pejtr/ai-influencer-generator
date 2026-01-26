import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Copy, Users, DollarSign, TrendingUp, Award, Star, 
  Trophy, Medal, Crown, Gem, Share2, ChevronRight,
  Loader2, Check, Network, Layers, Gift, Wallet, Percent
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Badge definitions
const BADGES = {
  bronze: { icon: Medal, color: "text-amber-600", bg: "bg-amber-600/10", name: "Bronze Partner", requirement: "10+ referrals" },
  silver: { icon: Medal, color: "text-gray-400", bg: "bg-gray-400/10", name: "Silver Partner", requirement: "50+ referrals" },
  gold: { icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/10", name: "Gold Partner", requirement: "100+ referrals" },
  diamond: { icon: Gem, color: "text-cyan-400", bg: "bg-cyan-400/10", name: "Diamond Partner", requirement: "500+ referrals" },
  rising_star: { icon: Star, color: "text-yellow-400", bg: "bg-yellow-400/10", name: "Rising Star", requirement: "$100+ earned" },
  top_earner: { icon: Crown, color: "text-purple-500", bg: "bg-purple-500/10", name: "Top Earner", requirement: "$1000+/month" },
};

// Commission rates
const COMMISSION_RATES = {
  level1: { rate: 30, label: "Direct Referrals", description: "Earn 30% on every sale from users you directly refer" },
  level2: { rate: 10, label: "2nd Level", description: "Earn 10% when your referrals bring in new users" },
  level3: { rate: 5, label: "3rd Level", description: "Earn 5% from the third level of your network" },
};

export default function Affiliate() {
  const { user, isAuthenticated, loading } = useAuth();
  const [copied, setCopied] = useState(false);
  
  const { data: affiliateStatus, isLoading: statusLoading, refetch } = trpc.affiliate.getStatus.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  const { data: commissions } = trpc.affiliate.getCommissions.useQuery(
    undefined,
    { enabled: isAuthenticated && affiliateStatus?.isAffiliate }
  );

  const { data: leaderboard } = trpc.affiliate.getLeaderboard.useQuery(undefined);

  const { data: networkStats } = trpc.affiliate.getNetworkStats.useQuery(
    undefined,
    { enabled: isAuthenticated && affiliateStatus?.isAffiliate }
  );

  const registerMutation = trpc.affiliate.register.useMutation({
    onSuccess: () => {
      toast.success("Welcome to the affiliate program!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to register");
    },
  });

  const copyReferralLink = () => {
    if (!affiliateStatus?.affiliate?.affiliateCode) return;
    
    const link = `${window.location.origin}?ref=${affiliateStatus.affiliate.affiliateCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate totals from affiliate data
  const totalEarnings = Number(affiliateStatus?.affiliate?.totalEarnings ?? 0);
  const pendingPayout = Number(affiliateStatus?.affiliate?.pendingEarnings ?? 0);
  const totalReferrals = affiliateStatus?.affiliate?.totalReferrals ?? 0;

  // Get current badge
  const getCurrentBadge = () => {
    if (totalReferrals >= 500) return "diamond";
    if (totalReferrals >= 100) return "gold";
    if (totalReferrals >= 50) return "silver";
    if (totalReferrals >= 10) return "bronze";
    return null;
  };

  const currentBadge = getCurrentBadge();

  if (loading || statusLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 pb-16">
        <div className="container">
          {/* Hero section */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Network className="w-4 h-4" />
              Multi-Level Affiliate Program
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Earn <span className="text-primary neon-text">30%</span> Recurring Commission
            </h1>
            <p className="text-xl text-muted-foreground">
              Build your network and earn from 3 levels of referrals. Join the most profitable AI influencer affiliate program.
            </p>
          </div>

          {/* Commission Tiers */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {Object.entries(COMMISSION_RATES).map(([key, tier], index) => (
              <div 
                key={key}
                className={cn(
                  "relative rounded-2xl border bg-card p-6 transition-all",
                  index === 0 && "border-primary shadow-lg shadow-primary/20"
                )}
              >
                {index === 0 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      HIGHEST RATE
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "p-3 rounded-xl",
                    index === 0 ? "bg-primary/10" : "bg-secondary"
                  )}>
                    <Layers className={cn("h-6 w-6", index === 0 ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <h3 className="font-bold">{tier.label}</h3>
                    <p className="text-3xl font-bold text-primary">{tier.rate}%</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
              </div>
            ))}
          </div>

          {!isAuthenticated ? (
            // Not logged in
            <div className="max-w-md mx-auto text-center">
              <Card>
                <CardHeader>
                  <CardTitle>Join the Program</CardTitle>
                  <CardDescription>
                    Sign in to become an affiliate partner
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full gradient-primary neon-glow">
                    <a href={getLoginUrl()}>Sign In to Get Started</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : !affiliateStatus?.isAffiliate ? (
            // Logged in but not an affiliate
            <div className="max-w-2xl mx-auto">
              {/* Benefits */}
              <div className="grid sm:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-6 rounded-xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Percent className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">30% Commission</h3>
                  <p className="text-sm text-muted-foreground">
                    Earn 30% of every payment from your referrals
                  </p>
                </div>
                <div className="text-center p-6 rounded-xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">3-Level Network</h3>
                  <p className="text-sm text-muted-foreground">
                    Earn from 3 levels: 30% + 10% + 5%
                  </p>
                </div>
                <div className="text-center p-6 rounded-xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Monthly Payouts</h3>
                  <p className="text-sm text-muted-foreground">
                    Get paid via PayPal every month
                  </p>
                </div>
              </div>

              <Card>
                <CardHeader className="text-center">
                  <CardTitle>Ready to Start Earning?</CardTitle>
                  <CardDescription>
                    Join thousands of affiliates earning passive income
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button
                    className="gradient-primary neon-glow"
                    onClick={() => registerMutation.mutate()}
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Gift className="w-4 h-4 mr-2" />
                    )}
                    Become an Affiliate
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Affiliate dashboard
            <div className="space-y-8">
              {/* Stats */}
              <div className="grid sm:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Earnings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-primary" />
                      <span className="text-2xl font-bold">
                        ${totalEarnings.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Pending Payout</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-yellow-500" />
                      <span className="text-2xl font-bold">
                        ${pendingPayout.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Referrals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span className="text-2xl font-bold">
                        {totalReferrals}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Current Badge</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {currentBadge ? (
                        <>
                          {(() => {
                            const BadgeIcon = BADGES[currentBadge as keyof typeof BADGES].icon;
                            return <BadgeIcon className={cn("w-5 h-5", BADGES[currentBadge as keyof typeof BADGES].color)} />;
                          })()}
                          <span className="text-lg font-bold">
                            {BADGES[currentBadge as keyof typeof BADGES].name}
                          </span>
                        </>
                      ) : (
                        <>
                          <Award className="w-5 h-5 text-muted-foreground" />
                          <span className="text-lg font-bold text-muted-foreground">
                            No badge yet
                          </span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Referral link */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Referral Link</CardTitle>
                  <CardDescription>
                    Share this link to earn commissions on every signup
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <div className="flex-1 p-3 rounded-lg bg-secondary font-mono text-sm truncate">
                      {`${window.location.origin}?ref=${affiliateStatus.affiliate?.affiliateCode}`}
                    </div>
                    <Button onClick={copyReferralLink} variant="outline">
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Your affiliate code: <span className="font-mono font-semibold">{affiliateStatus.affiliate?.affiliateCode}</span>
                  </p>
                </CardContent>
              </Card>

              {/* Network Stats */}
              {networkStats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Network className="w-5 h-5 text-primary" />
                      Your Network
                    </CardTitle>
                    <CardDescription>
                      Track your multi-level referral network
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <p className="text-4xl font-bold text-primary">{networkStats.level1Count}</p>
                        <p className="text-sm text-muted-foreground mt-1">Direct Referrals (30%)</p>
                        <p className="text-xs text-primary mt-2">${(networkStats.level1Earnings / 100).toFixed(2)} earned</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-secondary">
                        <p className="text-4xl font-bold">{networkStats.level2Count}</p>
                        <p className="text-sm text-muted-foreground mt-1">2nd Level (10%)</p>
                        <p className="text-xs text-muted-foreground mt-2">${(networkStats.level2Earnings / 100).toFixed(2)} earned</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-secondary">
                        <p className="text-4xl font-bold">{networkStats.level3Count}</p>
                        <p className="text-sm text-muted-foreground mt-1">3rd Level (5%)</p>
                        <p className="text-xs text-muted-foreground mt-2">${(networkStats.level3Earnings / 100).toFixed(2)} earned</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Badges Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Achievement Badges
                  </CardTitle>
                  <CardDescription>
                    Unlock badges as you grow your network
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {Object.entries(BADGES).map(([key, badge]) => {
                      const Icon = badge.icon;
                      const isEarned = 
                        (key === "bronze" && totalReferrals >= 10) ||
                        (key === "silver" && totalReferrals >= 50) ||
                        (key === "gold" && totalReferrals >= 100) ||
                        (key === "diamond" && totalReferrals >= 500) ||
                        (key === "rising_star" && totalEarnings >= 100) ||
                        (key === "top_earner" && totalEarnings >= 1000);
                      
                      return (
                        <div 
                          key={key}
                          className={cn(
                            "text-center p-4 rounded-xl border transition-all",
                            isEarned ? badge.bg : "bg-secondary/50 opacity-50"
                          )}
                        >
                          <Icon className={cn("h-8 w-8 mx-auto mb-2", isEarned ? badge.color : "text-muted-foreground")} />
                          <p className="text-xs font-medium">{badge.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{badge.requirement}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Leaderboard */}
              {leaderboard && leaderboard.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      Top Affiliates Leaderboard
                    </CardTitle>
                    <CardDescription>
                      See how you rank against other affiliates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {leaderboard.slice(0, 10).map((affiliate: any, index: number) => (
                        <div 
                          key={affiliate.id}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-xl",
                            index === 0 && "bg-yellow-500/10 border border-yellow-500/20",
                            index === 1 && "bg-gray-400/10",
                            index === 2 && "bg-amber-600/10",
                            index > 2 && "bg-secondary"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                            index === 0 && "bg-yellow-500 text-black",
                            index === 1 && "bg-gray-400 text-black",
                            index === 2 && "bg-amber-600 text-white",
                            index > 2 && "bg-muted text-muted-foreground"
                          )}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{affiliate.userName || "Anonymous"}</p>
                            <p className="text-xs text-muted-foreground">{affiliate.totalReferrals} referrals</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">${Number(affiliate.totalEarnings).toFixed(0)}</p>
                            <p className="text-xs text-muted-foreground">earned</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Commissions */}
              {commissions && commissions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Commissions</CardTitle>
                    <CardDescription>
                      Your recent earnings from referrals
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {commissions.slice(0, 10).map((commission: any) => (
                        <div 
                          key={commission.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-secondary"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-lg",
                              commission.level === 1 ? "bg-primary/10" : "bg-muted"
                            )}>
                              <DollarSign className={cn(
                                "h-4 w-4",
                                commission.level === 1 ? "text-primary" : "text-muted-foreground"
                              )} />
                            </div>
                            <div>
                              <p className="font-medium">
                                Level {commission.level || 1} Commission
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(commission.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-500">
                              +${Number(commission.amount).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {commission.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* How It Works */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-center mb-10">
              How It <span className="text-primary">Works</span>
            </h2>
            
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: 1, title: "Sign Up", description: "Join our affiliate program for free in seconds" },
                { step: 2, title: "Share Your Link", description: "Share your unique referral link with your audience" },
                { step: 3, title: "Build Your Network", description: "Your referrals bring more referrals - earn from 3 levels" },
                { step: 4, title: "Get Paid", description: "Earn 30%/10%/5% recurring commission every month" },
              ].map((item) => (
                <div key={item.step} className="relative">
                  <div className="p-6 rounded-xl border bg-card h-full">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-4">
                      {item.step}
                    </div>
                    <h3 className="font-bold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  {item.step < 4 && (
                    <ChevronRight className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
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
