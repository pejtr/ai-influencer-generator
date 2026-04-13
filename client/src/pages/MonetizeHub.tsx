/**
 * MonetizeHub.tsx
 *
 * Monetization Hub — dreamfall.art 3-stream income model:
 * 1. Freelance Services (client work)
 * 2. Educational Products (courses, guides, templates)
 * 3. Brand Collaborations (paid partnerships)
 *
 * Features:
 * - Interactive income calculator (MRR projector)
 * - Pre-built Comment-to-DM funnel templates
 * - Claude × Higgsfield automation guide (drcintas method)
 * - Action plan generator
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DollarSign,
  BookOpen,
  Handshake,
  Calculator,
  Zap,
  Copy,
  CheckCircle,
  TrendingUp,
  Users,
  Target,
  Lightbulb,
  ExternalLink,
  ChevronRight,
  Star,
  Clock,
  BarChart3,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Stream = "freelance" | "products" | "brands";

// ── Copy Button ───────────────────────────────────────────────────────────────
function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      }}
      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
    >
      {copied ? <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-500" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
      {copied ? "Copied!" : label}
    </Button>
  );
}

// ── Income Calculator ─────────────────────────────────────────────────────────
function IncomeCalculator() {
  const [freelanceRate, setFreelanceRate] = useState(150);
  const [freelanceHours, setFreelanceHours] = useState(20);
  const [courseSales, setCourseSales] = useState(10);
  const [coursePrice, setCoursePrice] = useState(197);
  const [brandDeals, setBrandDeals] = useState(2);
  const [brandDealValue, setBrandDealValue] = useState(500);

  const freelanceMRR = freelanceRate * freelanceHours * 4;
  const productsMRR = courseSales * coursePrice;
  const brandsMRR = brandDeals * brandDealValue;
  const totalMRR = freelanceMRR + productsMRR + brandsMRR;
  const totalARR = totalMRR * 12;

  const streams = [
    { label: "Freelance", value: freelanceMRR, color: "bg-blue-500", pct: Math.round((freelanceMRR / totalMRR) * 100) || 0 },
    { label: "Products", value: productsMRR, color: "bg-purple-500", pct: Math.round((productsMRR / totalMRR) * 100) || 0 },
    { label: "Brands", value: brandsMRR, color: "bg-green-500", pct: Math.round((brandsMRR / totalMRR) * 100) || 0 },
  ];

  const SliderRow = ({
    label,
    value,
    min,
    max,
    step,
    onChange,
    prefix = "",
    suffix = "",
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (v: number) => void;
    prefix?: string;
    suffix?: string;
  }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">
          {prefix}{value.toLocaleString()}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-border accent-indigo-500"
      />
    </div>
  );

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4 text-yellow-400" />
          MRR Income Calculator
        </CardTitle>
        <CardDescription className="text-xs">Dreamfall.art 3-stream model — drag to project your monthly revenue</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Stream 1: Freelance */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">💼 Freelance Services</p>
          <SliderRow label="Hourly rate" value={freelanceRate} min={25} max={500} step={25} onChange={setFreelanceRate} prefix="$" suffix="/h" />
          <SliderRow label="Hours/week" value={freelanceHours} min={1} max={40} step={1} onChange={setFreelanceHours} suffix="h" />
          <div className="text-right text-xs text-blue-400 font-medium">${freelanceMRR.toLocaleString()}/mo</div>
        </div>

        <div className="border-t border-border" />

        {/* Stream 2: Products */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wide">📚 Educational Products</p>
          <SliderRow label="Course sales/month" value={courseSales} min={0} max={200} step={1} onChange={setCourseSales} />
          <SliderRow label="Course price" value={coursePrice} min={27} max={997} step={10} onChange={setCoursePrice} prefix="$" />
          <div className="text-right text-xs text-purple-400 font-medium">${productsMRR.toLocaleString()}/mo</div>
        </div>

        <div className="border-t border-border" />

        {/* Stream 3: Brands */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-green-400 uppercase tracking-wide">🤝 Brand Collaborations</p>
          <SliderRow label="Deals/month" value={brandDeals} min={0} max={20} step={1} onChange={setBrandDeals} />
          <SliderRow label="Avg deal value" value={brandDealValue} min={100} max={10000} step={100} onChange={setBrandDealValue} prefix="$" />
          <div className="text-right text-xs text-green-400 font-medium">${brandsMRR.toLocaleString()}/mo</div>
        </div>

        <div className="border-t border-border" />

        {/* Revenue Breakdown */}
        <div className="space-y-3">
          <div className="flex overflow-hidden rounded-full h-3">
            {streams.map((s) => (
              <div
                key={s.label}
                className={`${s.color} transition-all duration-300`}
                style={{ width: `${s.pct}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs">
            {streams.map((s) => (
              <div key={s.label} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${s.color}`} />
                <span className="text-muted-foreground">{s.label} {s.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-center">
            <p className="text-xs text-muted-foreground mb-1">Monthly (MRR)</p>
            <p className="text-xl font-bold text-indigo-400">${totalMRR.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 text-center">
            <p className="text-xs text-muted-foreground mb-1">Annual (ARR)</p>
            <p className="text-xl font-bold text-green-400">${totalARR.toLocaleString()}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Based on dreamfall.art's verified 3-stream model (400K+ followers)
        </p>
      </CardContent>
    </Card>
  );
}

// ── Funnel Templates ──────────────────────────────────────────────────────────
const FUNNEL_TEMPLATES = [
  {
    keyword: "COURSE",
    source: "dreamfall.art",
    platform: "Instagram",
    initialDm: "Hey {name}! 🎬 Thanks for commenting! Here's your link to the full AI visuals course: [LINK]\n\nInside you'll learn: ideation → advanced prompting → animation → refinement → delivery.\n\nThis is the exact system I used to grow to 400K+ and work with top brands. 🔥",
    followUpDm: "Hey {name}! Just checking — did you get a chance to look at the course? Happy to answer any questions. The early-bird pricing ends soon! 🚀",
    category: "Education",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10 border-purple-500/20",
  },
  {
    keyword: "VIDEO",
    source: "drcintas",
    platform: "Instagram/TikTok",
    initialDm: "Hey {name}! 🤖 Here's the full Claude × Higgsfield automation setup guide: [LINK]\n\nYou'll learn how to connect Higgsfield to Claude Code via Playwright so Claude controls your browser, generates prompts, and runs everything automatically.\n\nNo clicking. No manual work. 🔥",
    followUpDm: "Hey {name}! Did you get the automation guide? Let me know if you need help with the Playwright setup — it's easier than it looks! 💪",
    category: "Automation",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/20",
  },
  {
    keyword: "FIRE",
    source: "kayvon.ai",
    platform: "Instagram/TikTok",
    initialDm: "Hey {name}! 🔥 You asked for the guide — here it is: [LINK]\n\nThis covers the full Kling 3.0 + Higgsfield workflow, JSON prompt structure for Veo 3, and the batch generation strategy (4-5 variants per scene).\n\nLet me know what you create! 🎬",
    followUpDm: "Hey {name}! Hope the guide was helpful! What are you working on? Drop your first video link — I'd love to see it! 🎥",
    category: "Workflow",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10 border-orange-500/20",
  },
];

function FunnelTemplates() {
  const [expanded, setExpanded] = useState<number | null>(0);
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-400" />
          Pre-built Comment-to-DM Templates
        </CardTitle>
        <CardDescription className="text-xs">Ready-to-use funnel templates from top AI creators — import directly to your Comment Funnel</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {FUNNEL_TEMPLATES.map((tmpl, i) => (
          <div key={i} className={`rounded-xl border p-3 ${tmpl.bgColor}`}>
            <button
              className="w-full flex items-center justify-between"
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs ${tmpl.color} border-current`}>
                  Comment "{tmpl.keyword}"
                </Badge>
                <span className="text-xs text-muted-foreground">{tmpl.platform}</span>
                <span className="text-xs text-muted-foreground">via @{tmpl.source}</span>
              </div>
              <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded === i ? "rotate-90" : ""}`} />
            </button>

            {expanded === i && (
              <div className="mt-3 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-muted-foreground">Initial DM</p>
                    <CopyBtn text={tmpl.initialDm} />
                  </div>
                  <p className="text-xs font-mono bg-background/50 rounded-lg p-2.5 border border-border text-foreground whitespace-pre-wrap">
                    {tmpl.initialDm}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-muted-foreground">Follow-up DM (24h later)</p>
                    <CopyBtn text={tmpl.followUpDm} />
                  </div>
                  <p className="text-xs font-mono bg-background/50 rounded-lg p-2.5 border border-border text-foreground whitespace-pre-wrap">
                    {tmpl.followUpDm}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs h-8"
                  onClick={() => {
                    toast.success(`Template "${tmpl.keyword}" ready — go to Comment Funnel to import!`);
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Use in Comment Funnel
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Automation Guide ──────────────────────────────────────────────────────────
function AutomationGuide() {
  const STEPS = [
    {
      step: 1,
      title: "Install Claude Code",
      desc: "Download Claude Code from Anthropic. This is the AI coding assistant that will control your browser.",
      code: "npm install -g @anthropic-ai/claude-code",
      tip: "Requires Node.js 18+",
    },
    {
      step: 2,
      title: "Install Playwright",
      desc: "Playwright lets Claude control your browser — navigate Higgsfield, fill prompts, click generate.",
      code: "npm install playwright\nnpx playwright install chromium",
      tip: "Only Chromium needed for Higgsfield",
    },
    {
      step: 3,
      title: "Create your automation script",
      desc: "Give Claude this instruction set to generate the full automation script:",
      code: `Create a Playwright script that:
1. Opens Higgsfield.ai in Chromium
2. Logs in with my credentials
3. For each prompt in prompts.json:
   - Navigates to the video generation page
   - Selects the Cinema Studio 3.0 model
   - Pastes the prompt
   - Sets duration to 5 seconds
   - Clicks Generate
   - Waits for completion
   - Downloads the video
4. Saves all videos to ./output/ folder`,
      tip: "Claude will write the entire script for you",
    },
    {
      step: 4,
      title: "Create your prompts.json",
      desc: "Use the Workflow Builder to generate your prompts, then export as JSON:",
      code: `[
  {
    "id": 1,
    "prompt": "A lone warrior walks through...",
    "model": "cinema_studio_3",
    "duration": 5
  }
]`,
      tip: "Generate 30 prompts at once for a full day's content",
    },
    {
      step: 5,
      title: "Run the automation",
      desc: "Execute the script and let Claude + Playwright handle everything:",
      code: "node higgsfield-automation.js",
      tip: "Generates 30 videos while you sleep 🚀",
    },
  ];

  const [openStep, setOpenStep] = useState<number | null>(0);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-cyan-400" />
          Claude × Higgsfield Automation
        </CardTitle>
        <CardDescription className="text-xs">
          drcintas method — connect Higgsfield to Claude Code via Playwright. Zero manual clicks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 mb-3">
          <p className="text-xs text-cyan-300 font-medium">💡 The concept</p>
          <p className="text-xs text-muted-foreground mt-1">
            Claude Code connects through Playwright to control your browser. It sets up the entire project, generates prompts, and runs Higgsfield automatically. No clicking. No manual work. Everything runs inside Claude Code.
          </p>
        </div>

        {STEPS.map((s, i) => (
          <div key={i} className="rounded-lg border border-border overflow-hidden">
            <button
              className="w-full flex items-center gap-3 p-3 hover:bg-muted/10 transition-colors text-left"
              onClick={() => setOpenStep(openStep === i ? null : i)}
            >
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-400 flex-shrink-0">
                {s.step}
              </div>
              <span className="text-sm font-medium">{s.title}</span>
              <ChevronRight className={`h-4 w-4 text-muted-foreground ml-auto transition-transform ${openStep === i ? "rotate-90" : ""}`} />
            </button>
            {openStep === i && (
              <div className="px-3 pb-3 space-y-2 border-t border-border">
                <p className="text-xs text-muted-foreground pt-2">{s.desc}</p>
                <div className="relative">
                  <pre className="text-xs font-mono bg-background rounded-lg p-3 border border-border overflow-x-auto text-green-400 whitespace-pre-wrap">
                    {s.code}
                  </pre>
                  <div className="absolute top-2 right-2">
                    <CopyBtn text={s.code} />
                  </div>
                </div>
                {s.tip && (
                  <p className="text-xs text-yellow-400/80 flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {s.tip}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Action Plan ───────────────────────────────────────────────────────────────
function ActionPlan() {
  const phases = [
    {
      phase: "Week 1-2",
      title: "Build your AI visual portfolio",
      icon: "🎬",
      color: "border-blue-500/30 bg-blue-500/5",
      actions: [
        "Generate 30 cinematic AI videos using Workflow Builder",
        "Post 3x/day on Instagram + TikTok (use batch generation)",
        "Set up Comment-to-DM funnel with 'FIRE' keyword",
        "Create your first free lead magnet (prompt guide PDF)",
      ],
    },
    {
      phase: "Week 3-4",
      title: "Launch your first product",
      icon: "📚",
      color: "border-purple-500/30 bg-purple-500/5",
      actions: [
        "Package your best prompts + workflow into a $27 guide",
        "Set up 'Comment COURSE' funnel template",
        "DM your first 50 engaged followers personally",
        "Target: 10 sales = $270 first product revenue",
      ],
    },
    {
      phase: "Month 2",
      title: "Add freelance income stream",
      icon: "💼",
      color: "border-green-500/30 bg-green-500/5",
      actions: [
        "Offer AI video creation services ($150-500/video)",
        "Pitch 5 brands in your niche for paid collabs",
        "Use POV Rebuild to create unique content angles",
        "Target: 2 clients + 1 brand deal = $1,000+/mo",
      ],
    },
    {
      phase: "Month 3+",
      title: "Scale with automation",
      icon: "🤖",
      color: "border-orange-500/30 bg-orange-500/5",
      actions: [
        "Set up Claude × Higgsfield automation (30 videos/day)",
        "Launch full course ($197-497) with Comment-to-DM funnel",
        "Hire VA to handle DM follow-ups and client onboarding",
        "Target: $5,000+/mo across all 3 streams",
      ],
    },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4 text-red-400" />
          90-Day Action Plan
        </CardTitle>
        <CardDescription className="text-xs">Dreamfall.art + kayvon.ai methodology — from zero to $5K/mo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {phases.map((phase, i) => (
          <div key={i} className={`p-3 rounded-xl border ${phase.color}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{phase.icon}</span>
              <div>
                <p className="text-xs font-semibold text-foreground">{phase.title}</p>
                <p className="text-xs text-muted-foreground">{phase.phase}</p>
              </div>
            </div>
            <ul className="space-y-1">
              {phase.actions.map((action, j) => (
                <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MonetizeHub() {
  const [activeStream, setActiveStream] = useState<Stream>("freelance");

  const streams = [
    {
      id: "freelance" as Stream,
      icon: <DollarSign className="h-5 w-5" />,
      label: "Freelance",
      color: "text-blue-400",
      bgActive: "bg-blue-500/10 border-blue-500/40",
      desc: "Client work — AI videos, visuals, content creation",
      avgRate: "$150-500/video",
      timeToFirst: "1-2 weeks",
      difficulty: "Easy",
    },
    {
      id: "products" as Stream,
      icon: <BookOpen className="h-5 w-5" />,
      label: "Products",
      color: "text-purple-400",
      bgActive: "bg-purple-500/10 border-purple-500/40",
      desc: "Courses, guides, templates, prompt packs",
      avgRate: "$27-997/sale",
      timeToFirst: "2-4 weeks",
      difficulty: "Medium",
    },
    {
      id: "brands" as Stream,
      icon: <Handshake className="h-5 w-5" />,
      label: "Brand Deals",
      color: "text-green-400",
      bgActive: "bg-green-500/10 border-green-500/40",
      desc: "Paid partnerships, sponsored content, collabs",
      avgRate: "$200-5K/deal",
      timeToFirst: "4-8 weeks",
      difficulty: "Hard",
    },
  ];

  const streamDetails: Record<Stream, { tips: string[]; tools: string[]; cta: string }> = {
    freelance: {
      tips: [
        "Start with AI video creation ($150-500/video) — high demand, low competition",
        "Offer 'AI visual identity packages' for brands ($500-2K)",
        "Use POV Rebuild to create unique angles that justify premium pricing",
        "Batch generate 5 variations, charge for the best 3",
        "Use Kling Motion Control to offer 'face-swap to AI character' as a service",
      ],
      tools: ["Higgsfield Cinema Studio 3.0", "Kling 3.0 Motion Control", "ElevenLabs (voiceover)", "CapCut (editing)"],
      cta: "Start with 3 portfolio pieces → DM 10 potential clients",
    },
    products: {
      tips: [
        "Start with a $27 prompt pack — low barrier, proves market demand",
        "Use Comment-to-DM funnel: 'Comment COURSE' → automated DM with link",
        "Bundle: prompts + workflow guide + 1 Zoom call = $197 offer",
        "Add community access to justify $297-497 price point",
        "dreamfall.art model: ideation → prompting → animation → refinement → delivery",
      ],
      tools: ["Stan Store / Gumroad (sales)", "Comment-to-DM Funnel (this platform)", "Notion (course hosting)", "Loom (video lessons)"],
      cta: "Create a $27 prompt pack this week → launch with Comment funnel",
    },
    brands: {
      tips: [
        "Pitch brands in your niche with a 'AI visual package' deck",
        "Start with gifted collabs → build case studies → charge $500+",
        "Use your AI influencer character as the brand ambassador",
        "Offer 3 deliverables: 1 Reel + 3 Stories + 1 static post = $500 minimum",
        "dreamfall.art charges premium because AI visuals are unique — position accordingly",
      ],
      tools: ["Canva (pitch deck)", "Instagram Creator Marketplace", "AspireIQ / Grin (brand discovery)", "DocuSign (contracts)"],
      cta: "Create a 5-slide pitch deck → reach out to 5 brands this week",
    },
  };

  const active = streams.find((s) => s.id === activeStream)!;
  const details = streamDetails[activeStream];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Monetization Hub</h1>
              <p className="text-sm text-muted-foreground">
                dreamfall.art 3-stream model — freelance services + educational products + brand collaborations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
              <Users className="h-3 w-3 mr-1" />
              400K+ followers proven
            </Badge>
            <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
              <BarChart3 className="h-3 w-3 mr-1" />
              3 income streams
            </Badge>
            <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
              <Clock className="h-3 w-3 mr-1" />
              90-day roadmap
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stream Selector */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {streams.map((stream) => (
            <button
              key={stream.id}
              onClick={() => setActiveStream(stream.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                activeStream === stream.id
                  ? stream.bgActive
                  : "border-border bg-card hover:bg-muted/10"
              }`}
            >
              <div className={`mb-2 ${stream.color}`}>{stream.icon}</div>
              <p className="font-semibold text-sm text-foreground">{stream.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stream.desc}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className={`text-xs ${stream.color} border-current`}>
                  {stream.avgRate}
                </Badge>
                <span className="text-xs text-muted-foreground">{stream.timeToFirst}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Stream Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-400" />
                  {active.label} — VIP Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {details.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/10 border border-border">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-sm text-foreground">{tip}</p>
                  </div>
                ))}
                <div className="p-3 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 mt-3">
                  <p className="text-xs font-semibold text-indigo-400 mb-1">🎯 First Action</p>
                  <p className="text-sm text-foreground">{details.cta}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Recommended Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {details.tools.map((tool, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-border text-muted-foreground">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <FunnelTemplates />
            <AutomationGuide />
          </div>

          <div className="space-y-4">
            <IncomeCalculator />
            <ActionPlan />
          </div>
        </div>
      </div>
    </div>
  );
}
