import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Loader2, Lock, Sparkles, Link2, Unlink, CheckCircle, 
  ExternalLink, Upload, Image, Crown, AlertCircle 
} from "lucide-react";
import { Link, useLocation } from "wouter";

export default function FanvueConnect() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isConnecting, setIsConnecting] = useState(false);

  // Check tier access
  const hasTierAccess = user?.tier === "premium" || user?.tier === "vip";

  // Fetch Fanvue connection status
  const { data: fanvueStatus, isLoading: statusLoading, refetch: refetchStatus } = trpc.fanvue.getStatus.useQuery(
    undefined,
    { enabled: hasTierAccess }
  );

  // Mutations
  const startAuthMutation = trpc.fanvue.startAuth.useMutation({
    onSuccess: (data) => {
      // Open Fanvue OAuth in new window
      window.open(data.authUrl, "_blank", "width=600,height=700");
      toast.info("Complete the authorization in the popup window");
      setIsConnecting(true);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const disconnectMutation = trpc.fanvue.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Fanvue account disconnected");
      refetchStatus();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Handle OAuth callback (from URL params)
  const completeAuthMutation = trpc.fanvue.completeAuth.useMutation({
    onSuccess: (data) => {
      toast.success(`Connected to Fanvue as @${data.fanvueUser.handle}`);
      setIsConnecting(false);
      refetchStatus();
    },
    onError: (error) => {
      toast.error(error.message);
      setIsConnecting(false);
    },
  });

  // Check for OAuth callback params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    
    if (code && state && hasTierAccess) {
      completeAuthMutation.mutate({ code, state });
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [hasTierAccess]);

  // Tier Gate
  if (!authLoading && !hasTierAccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#c8ff00]/10 flex items-center justify-center">
              <Lock className="w-10 h-10 text-[#c8ff00]" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Fanvue Auto-Publish</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Connect your Fanvue account to automatically publish your AI-generated content.
              Streamline your workflow and grow your audience.
            </p>
            
            <Card className="bg-card/50 border-[#c8ff00]/20 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-[#c8ff00]" />
                  Premium Feature
                </CardTitle>
                <CardDescription>
                  Available for PREMIUM and VIP subscribers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-left space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-[#c8ff00]" />
                    <span>One-click Fanvue connection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-[#c8ff00]" />
                    <span>Direct publishing from gallery</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-[#c8ff00]" />
                    <span>Auto-caption generation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#c8ff00]" />
                    <span>Scheduled posting (VIP only)</span>
                  </li>
                </ul>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/pricing">
                    <Button variant="outline" className="w-full border-[#c8ff00]/50 text-[#c8ff00] hover:bg-[#c8ff00]/10">
                      PREMIUM - $29/mo
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button className="w-full bg-[#c8ff00] text-black hover:bg-[#a8d600]">
                      VIP - $99/mo
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Link2 className="w-8 h-8 text-[#c8ff00]" />
            Fanvue Integration
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect your Fanvue account for seamless content publishing
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Connection Status Card */}
          <Card className="bg-card/50 border-border/50 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Connection Status</span>
                {statusLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : fanvueStatus?.isConnected ? (
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Not Connected
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {fanvueStatus?.isConnected
                  ? `Connected since ${new Date(fanvueStatus.connectedAt!).toLocaleDateString()}`
                  : "Connect your Fanvue account to start publishing"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!fanvueStatus?.isConfigured ? (
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-500">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Configuration Required</span>
                  </div>
                  <p className="text-sm">
                    Fanvue API credentials are not configured. Please contact support to enable this feature.
                  </p>
                </div>
              ) : fanvueStatus?.isConnected ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Fanvue Account</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {fanvueStatus.fanvueUserId}
                        </p>
                      </div>
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => disconnectMutation.mutate()}
                    disabled={disconnectMutation.isPending}
                    className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10"
                  >
                    {disconnectMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      <>
                        <Unlink className="w-4 h-4 mr-2" />
                        Disconnect Fanvue Account
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => startAuthMutation.mutate()}
                  disabled={startAuthMutation.isPending || isConnecting}
                  className="w-full bg-[#c8ff00] text-black hover:bg-[#a8d600]"
                >
                  {startAuthMutation.isPending || isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isConnecting ? "Waiting for authorization..." : "Connecting..."}
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-2" />
                      Connect Fanvue Account
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Features Card */}
          {fanvueStatus?.isConnected && (
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>What You Can Do</CardTitle>
                <CardDescription>
                  Features available with your connected account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/gallery">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-[#c8ff00]/50 transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 text-[#c8ff00] mb-2" />
                      <h3 className="font-medium">Publish from Gallery</h3>
                      <p className="text-sm text-muted-foreground">
                        Select any generated image and publish it directly to Fanvue
                      </p>
                    </div>
                  </Link>
                  
                  {user?.tier === "vip" && (
                    <Link href="/scheduler">
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-[#c8ff00]/50 transition-colors cursor-pointer">
                        <Sparkles className="w-8 h-8 text-[#c8ff00] mb-2" />
                        <h3 className="font-medium">Schedule Posts</h3>
                        <p className="text-sm text-muted-foreground">
                          Plan your content calendar and auto-publish at optimal times
                        </p>
                      </div>
                    </Link>
                  )}
                </div>

                <div className="mt-6 p-4 rounded-lg bg-[#c8ff00]/5 border border-[#c8ff00]/20">
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <ExternalLink className="w-4 h-4" />
                    Quick Actions
                  </h4>
                  <div className="flex gap-3">
                    <Link href="/gallery">
                      <Button variant="outline" size="sm">
                        Go to Gallery
                      </Button>
                    </Link>
                    <a href="https://fanvue.com/dashboard" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        Open Fanvue Dashboard
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
