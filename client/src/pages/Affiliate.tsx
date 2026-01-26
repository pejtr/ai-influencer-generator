import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Copy, DollarSign, Users, TrendingUp, 
  Loader2, Check, Gift, Percent, Wallet
} from "lucide-react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
              <Gift className="w-4 h-4" />
              Earn 30% Recurring Commission
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Partner With <span className="text-primary neon-text">AI Influencer</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Join our affiliate program and earn passive income by referring customers. 
              Get 30% of every payment, every month, for as long as they stay subscribed.
            </p>
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
                  <h3 className="font-semibold mb-2">Recurring Revenue</h3>
                  <p className="text-sm text-muted-foreground">
                    Get paid every month as long as they're subscribed
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
                        ${Number(affiliateStatus.affiliate?.totalEarnings ?? 0).toFixed(2)}
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
                        ${Number(affiliateStatus.affiliate?.pendingEarnings ?? 0).toFixed(2)}
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
                        {affiliateStatus.affiliate?.totalReferrals ?? 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Active Subscribers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      <span className="text-2xl font-bold">
                        {affiliateStatus.affiliate?.activeReferrals ?? 0}
                      </span>
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

              {/* Commission history */}
              <Card>
                <CardHeader>
                  <CardTitle>Commission History</CardTitle>
                  <CardDescription>
                    Your recent earnings from referrals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {commissions && commissions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commissions.map((commission) => (
                          <TableRow key={commission.id}>
                            <TableCell>
                              {new Date(commission.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-semibold text-primary">
                              ${Number(commission.amount).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                commission.status === "paid" 
                                  ? "bg-green-500/10 text-green-500"
                                  : commission.status === "approved"
                                  ? "bg-blue-500/10 text-blue-500"
                                  : "bg-yellow-500/10 text-yellow-500"
                              }`}>
                                {commission.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No commissions yet. Start sharing your referral link!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tips */}
              <Card>
                <CardHeader>
                  <CardTitle>Tips for Success</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary mt-0.5" />
                      <span>Share your link on social media, blogs, and YouTube videos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary mt-0.5" />
                      <span>Create tutorials showing how to use AI Influencer Generator</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary mt-0.5" />
                      <span>Target content creators, marketers, and social media managers</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary mt-0.5" />
                      <span>Highlight the time and cost savings of AI-generated influencers</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
