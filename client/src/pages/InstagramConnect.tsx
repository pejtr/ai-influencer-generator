/**
 * InstagramConnect.tsx
 *
 * Full Instagram Graph API integration UI:
 * - Step-by-step setup guide (Meta App creation, permissions, webhook config)
 * - Direct Page Access Token entry form
 * - Webhook setup instructions with copy-paste values
 * - Connection status display
 * - DM logs and stats
 * - Test DM sender
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  Instagram,
  Zap,
  MessageCircle,
  BarChart3,
  AlertTriangle,
  RefreshCw,
  Send,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SetupStep {
  id: number;
  title: string;
  description: string;
  link?: { label: string; url: string };
  code?: string;
}

// ── Setup Steps ───────────────────────────────────────────────────────────────
const SETUP_STEPS: SetupStep[] = [
  {
    id: 1,
    title: "Create a Meta Developer App",
    description:
      "Go to developers.facebook.com, click 'My Apps' → 'Create App'. Choose 'Business' type. Add the 'Instagram' and 'Webhooks' products to your app.",
    link: { label: "Open Meta for Developers", url: "https://developers.facebook.com/apps" },
  },
  {
    id: 2,
    title: "Get a Page Access Token",
    description:
      "In your Meta App Dashboard, go to Tools → Graph API Explorer. Select your Facebook Page (linked to Instagram). Add permissions: instagram_basic, instagram_manage_comments, pages_messaging, pages_read_engagement. Click 'Generate Access Token'. Copy the token — it's valid for 1 hour (we'll exchange it for a 60-day token automatically).",
    link: {
      label: "Open Graph API Explorer",
      url: "https://developers.facebook.com/tools/explorer/",
    },
  },
  {
    id: 3,
    title: "Connect Your Instagram Account",
    description:
      "Paste your Page Access Token below along with your Facebook Page ID and Instagram details. We'll automatically exchange it for a long-lived 60-day token and subscribe to comment webhooks.",
  },
  {
    id: 4,
    title: "Configure Webhook in Meta App Dashboard",
    description:
      "After connecting, copy the Webhook Callback URL and Verify Token shown below. In your Meta App Dashboard → Webhooks → Instagram, add these values and subscribe to 'comments' and 'live_comments' fields.",
  },
  {
    id: 5,
    title: "Set App to Live Mode",
    description:
      "In your Meta App Dashboard, switch the app from 'Development' to 'Live' mode. This is required for Meta to send real webhook notifications. Note: Advanced Access review may be needed for non-test accounts.",
    link: {
      label: "App Review Guide",
      url: "https://developers.facebook.com/docs/app-review/",
    },
  },
];

// ── Copy Button ───────────────────────────────────────────────────────────────
function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label ?? "Value"} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
    >
      {copied ? <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-500" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function InstagramConnect() {
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [showTestDm, setShowTestDm] = useState(false);

  // Form state
  const [pageId, setPageId] = useState("");
  const [pageName, setPageName] = useState("");
  const [pageAccessToken, setPageAccessToken] = useState("");
  const [instagramAccountId, setInstagramAccountId] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");

  // Test DM state
  const [testCommentId, setTestCommentId] = useState("");
  const [testMessage, setTestMessage] = useState("Hey {name}! Thanks for commenting 🔥 Here's the guide you asked for: ");

  // Queries
  const { data: connection, refetch: refetchConnection } = trpc.instagram.getConnection.useQuery();
  const { data: webhookSetup } = trpc.instagram.getWebhookSetup.useQuery();
  const { data: dmStats } = trpc.instagram.getDmStats.useQuery();

  // Mutations
  const saveToken = trpc.instagram.saveDirectToken.useMutation({
    onSuccess: (data) => {
      toast.success(
        data.webhookSubscribed
          ? "Instagram connected! Webhook subscribed automatically ✓"
          : "Instagram connected! Please configure webhook manually (see Step 4)"
      );
      setShowConnectForm(false);
      refetchConnection();
    },
    onError: (err) => toast.error(err.message),
  });

  const disconnect = trpc.instagram.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Instagram disconnected");
      refetchConnection();
    },
    onError: (err) => toast.error(err.message),
  });

  const testDm = trpc.instagram.testDm.useMutation({
    onSuccess: (data) => {
      toast.success(`Test DM sent! Message ID: ${data.messageId}`);
    },
    onError: (err) => toast.error(`DM failed: ${err.message}`),
  });

  const handleConnect = () => {
    if (!pageId || !pageAccessToken) {
      toast.error("Page ID and Page Access Token are required");
      return;
    }
    saveToken.mutate({
      pageId: pageId.trim(),
      pageName: pageName.trim() || "My Page",
      pageAccessToken: pageAccessToken.trim(),
      instagramAccountId: instagramAccountId.trim() || undefined,
      instagramUsername: instagramUsername.trim() || undefined,
    });
  };

  const isConnected = !!connection;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Instagram className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Instagram Comment-to-DM</h1>
              <p className="text-sm text-muted-foreground">
                Automatically send DMs when users comment trigger keywords on your posts
              </p>
            </div>
          </div>

          {/* Connection Status Banner */}
          {isConnected ? (
            <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-400">
                  Connected: {connection.pageName ?? "Your Page"}
                  {connection.instagramUsername && (
                    <span className="text-muted-foreground ml-2">@{connection.instagramUsername}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Webhook: {connection.webhookSubscribed ? "✓ Subscribed" : "⚠ Not subscribed — see Step 4"}
                  {connection.tokenExpiresAt && (
                    <span className="ml-3">
                      Token expires: {new Date(connection.tokenExpiresAt).toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={() => disconnect.mutate()}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
              <p className="text-sm text-yellow-400">
                Not connected — follow the setup steps below to enable automated DMs
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Stats Row (only when connected) */}
        {isConnected && dmStats && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-muted-foreground">Total DMs</span>
                </div>
                <p className="text-2xl font-bold">{dmStats.total}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-muted-foreground">Sent</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{dmStats.sent}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="h-4 w-4 text-purple-400" />
                  <span className="text-xs text-muted-foreground">Success Rate</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{dmStats.successRate}%</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Setup Steps */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              Setup Guide
            </CardTitle>
            <CardDescription>Follow these steps to enable real Instagram DM automation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {SETUP_STEPS.map((step) => (
              <div
                key={step.id}
                className="border border-border rounded-lg overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isConnected && step.id <= 3
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isConnected && step.id <= 3 ? "✓" : step.id}
                    </div>
                    <span className="text-sm font-medium">{step.title}</span>
                  </div>
                  {expandedStep === step.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {expandedStep === step.id && (
                  <div className="px-3 pb-3 border-t border-border bg-muted/10">
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Step 3: Connect Form */}
                    {step.id === 3 && (
                      <div className="mt-4 space-y-3">
                        {!isConnected ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowConnectForm(!showConnectForm)}
                              className="text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
                            >
                              <Instagram className="h-4 w-4 mr-2" />
                              {showConnectForm ? "Hide Form" : "Enter Token & Connect"}
                            </Button>

                            {showConnectForm && (
                              <div className="space-y-3 p-4 rounded-lg bg-muted/20 border border-border">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">
                                      Facebook Page ID *
                                    </label>
                                    <Input
                                      placeholder="123456789012345"
                                      value={pageId}
                                      onChange={(e) => setPageId(e.target.value)}
                                      className="h-8 text-sm bg-background"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">
                                      Page Name
                                    </label>
                                    <Input
                                      placeholder="My Business Page"
                                      value={pageName}
                                      onChange={(e) => setPageName(e.target.value)}
                                      className="h-8 text-sm bg-background"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground mb-1 block">
                                    Page Access Token *
                                  </label>
                                  <Textarea
                                    placeholder="EAABsbCS..."
                                    value={pageAccessToken}
                                    onChange={(e) => setPageAccessToken(e.target.value)}
                                    className="text-sm bg-background font-mono text-xs"
                                    rows={3}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">
                                      Instagram Account ID (optional)
                                    </label>
                                    <Input
                                      placeholder="17841400000000000"
                                      value={instagramAccountId}
                                      onChange={(e) => setInstagramAccountId(e.target.value)}
                                      className="h-8 text-sm bg-background"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">
                                      Instagram Username (optional)
                                    </label>
                                    <Input
                                      placeholder="kayvon.ai"
                                      value={instagramUsername}
                                      onChange={(e) => setInstagramUsername(e.target.value)}
                                      className="h-8 text-sm bg-background"
                                    />
                                  </div>
                                </div>
                                <Button
                                  onClick={handleConnect}
                                  disabled={saveToken.isPending}
                                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                                >
                                  {saveToken.isPending ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      Connecting...
                                    </>
                                  ) : (
                                    <>
                                      <Instagram className="h-4 w-4 mr-2" />
                                      Connect Instagram
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-400">
                              Connected as {connection.pageName}
                              {connection.instagramUsername && ` (@${connection.instagramUsername})`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 4: Webhook config */}
                    {step.id === 4 && webhookSetup && (
                      <div className="mt-4 space-y-3">
                        <div className="p-3 rounded-lg bg-muted/20 border border-border space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs text-muted-foreground">Callback URL</label>
                              <CopyButton value={webhookSetup.callbackUrl} label="Callback URL" />
                            </div>
                            <code className="block text-xs bg-background border border-border rounded px-3 py-2 text-green-400 font-mono break-all">
                              {webhookSetup.callbackUrl}
                            </code>
                          </div>
                          {webhookSetup.verifyToken && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs text-muted-foreground">Verify Token</label>
                                <CopyButton value={webhookSetup.verifyToken} label="Verify Token" />
                              </div>
                              <code className="block text-xs bg-background border border-border rounded px-3 py-2 text-blue-400 font-mono break-all">
                                {webhookSetup.verifyToken}
                              </code>
                            </div>
                          )}
                          <div className="flex items-start gap-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                            <Info className="h-3.5 w-3.5 text-yellow-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-yellow-400">
                              Subscribe to fields: <strong>comments</strong> and <strong>live_comments</strong>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          {webhookSetup.steps.map((s, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <span className="text-purple-400 font-mono shrink-0">{i + 1}.</span>
                              <span>{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {step.link && (
                      <a
                        href={step.link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {step.link.label}
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Test DM Section */}
        {isConnected && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Send className="h-4 w-4 text-blue-400" />
                    Test DM Sender
                  </CardTitle>
                  <CardDescription>
                    Send a test Private Reply to verify your connection works
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTestDm(!showTestDm)}
                >
                  {showTestDm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {showTestDm && (
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-400">
                    To test, you need a real Comment ID from your Instagram post. Get it from the Instagram Graph API or from a webhook test event. The commenter must have commented within the last 7 days.
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Comment ID</label>
                  <Input
                    placeholder="17858893269000001"
                    value={testCommentId}
                    onChange={(e) => setTestCommentId(e.target.value)}
                    className="text-sm bg-background font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Message</label>
                  <Textarea
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="text-sm bg-background"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={() => testDm.mutate({ commentId: testCommentId, message: testMessage })}
                  disabled={testDm.isPending || !testCommentId}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {testDm.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Test DM
                    </>
                  )}
                </Button>
              </CardContent>
            )}
          </Card>
        )}

        {/* Limitations Notice */}
        <Card className="bg-card border-border border-yellow-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-400 mb-2">Important API Limitations</p>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li>• Only <strong>one DM</strong> can be sent per commenter (they must reply to continue the conversation)</li>
                  <li>• DM must be sent within <strong>7 days</strong> of the comment being posted</li>
                  <li>• <strong>Advanced Access</strong> is required for non-test users (requires Meta App Review)</li>
                  <li>• App must be in <strong>Live mode</strong> to receive real webhook events</li>
                  <li>• Instagram account must be a <strong>Professional account</strong> (Business or Creator)</li>
                  <li>• DMs go to <strong>Inbox</strong> if follower, <strong>Request folder</strong> if non-follower</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">How the Automation Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-0">
              {[
                { icon: "💬", label: "Someone comments on your post", detail: 'e.g., "FIRE 🔥 need this guide!"' },
                { icon: "🔔", label: "Meta sends webhook to our server", detail: "Within seconds via /api/instagram/webhook" },
                { icon: "🔍", label: "System checks comment against your keywords", detail: 'Matches "FIRE" → Campaign: Guide Funnel' },
                { icon: "📨", label: "Private Reply DM sent automatically", detail: "Via POST /<PAGE_ID>/messages with comment_id" },
                { icon: "📊", label: "Event logged in DM Logs", detail: "Track conversion rate in Comment Funnel dashboard" },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-base shrink-0">
                      {step.icon}
                    </div>
                    {i < 4 && <div className="w-px h-4 bg-border mt-1" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
