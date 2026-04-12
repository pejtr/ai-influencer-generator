import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Star, CheckCircle2, ArrowRight, Sparkles, TrendingUp, Users,
  Play, Lock, Clock, Zap, Gift, Shield, ChevronRight,
  Camera, Mic, Video, DollarSign, BarChart3, Globe,
  Loader2, Crown, BookOpen, Award
} from "lucide-react";

const SKILLS = [
  { icon: Camera, text: "Create hyper-realistic AI influencers" },
  { icon: Mic, text: "Clone voices & build AI personas" },
  { icon: Video, text: "Generate unlimited content at scale" },
  { icon: DollarSign, text: "Monetize across 5+ revenue streams" },
  { icon: BarChart3, text: "Automate fan engagement & growth" },
  { icon: Globe, text: "Build a faceless online empire" },
];

const OUTCOMES = [
  "Run a faceless account that generates passive income",
  "Earn money without showing your face online",
  "Offer AI services to clients and charge premium rates",
  "Scale the OnlyFans business without physical limits",
  "Create content daily without ever being on camera",
  "Build an automated influencer business from scratch",
];

const FOR_WHO = [
  { title: "Aspiring Creators", desc: "Who want to build an online presence without being on camera" },
  { title: "Affiliate Marketers", desc: "Looking for a scalable, automated content channel" },
  { title: "Agency Owners", desc: "Who want to offer AI influencer services to clients" },
  { title: "OnlyFans Creators", desc: "Ready to scale without physical content limitations" },
  { title: "Digital Entrepreneurs", desc: "Building passive income systems with AI" },
  { title: "Content Managers", desc: "Managing multiple brands or accounts simultaneously" },
];

const FAQ = [
  {
    q: "Do I need any technical skills or experience?",
    a: "Absolutely not. This course is designed for complete beginners. Every step is shown with screen recordings and clear instructions. If you can use a smartphone, you can do this.",
  },
  {
    q: "How long does it take to see results?",
    a: "Most students have their AI influencer live within the first week. Revenue depends on your effort and niche, but many students report their first income within 30 days.",
  },
  {
    q: "What tools do I need?",
    a: "You'll use our AI Influencer Generator platform (included with course access) plus a few free/low-cost tools. Total monthly tool cost is under $50.",
  },
  {
    q: "Is this course updated regularly?",
    a: "Yes. AI tools evolve fast and so does this course. All updates are included for free — you pay once and get lifetime access.",
  },
  {
    q: "What's the refund policy?",
    a: "We offer a 7-day money-back guarantee. If you go through the course and don't find value, email us for a full refund — no questions asked.",
  },
  {
    q: "Can I use this for affiliate marketing?",
    a: "100%. Module 4 specifically covers affiliate marketing integration — how to set up your AI influencer to promote products 24/7 on autopilot.",
  },
];

export default function AIFluencerStudio() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<"full" | "installment">("full");

  const { data: modules = [] } = trpc.course.getModules.useQuery();
  const { data: testimonials = [] } = trpc.course.getTestimonials.useQuery({ featuredOnly: false });
  const { data: bonuses = [] } = trpc.course.getBonuses.useQuery();
  const { data: enrollmentData } = trpc.course.checkEnrollment.useQuery(undefined, { enabled: !!user });
  const { data: enrollmentCount = 0 } = trpc.course.getEnrollmentCount.useQuery();

  const seedMutation = trpc.course.adminSeed.useMutation({
    onSuccess: (d) => {
      toast.success(`Seeded ${d.seeded} items!`);
    },
  });

  const checkoutMutation = trpc.course.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.success("Redirecting to checkout...");
        window.open(data.checkoutUrl, "_blank");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const enrollFreeMutation = trpc.course.adminEnrollFree.useMutation({
    onSuccess: () => {
      toast.success("Enrolled for free!");
      navigate("/course");
    },
  });

  const handleEnroll = () => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
    if (enrollmentData?.enrolled) {
      navigate("/course");
      return;
    }
    checkoutMutation.mutate({ plan: selectedPlan });
  };

  const isAdmin = user?.role === "admin";
  const isEnrolled = enrollmentData?.enrolled;
  const totalBonusValue = bonuses.reduce((sum: number, b: any) => sum + Number(b.value || 0), 0) || 591;

  return (
    <div className="min-h-screen bg-[#0a0a08] text-[#f5f0e8]">
      <Navbar />

      {/* Admin Controls */}
      {isAdmin && (
        <div className="fixed bottom-4 right-4 z-50 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="bg-black/80 border-amber-500/30 text-amber-400"
          >
            {seedMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
            Seed Course Data
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => enrollFreeMutation.mutate({})}
            disabled={enrollFreeMutation.isPending}
            className="bg-black/80 border-green-500/30 text-green-400"
          >
            Enroll Free (Admin)
          </Button>
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#2a1f0a_0%,_#0a0a08_60%)]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMwLTkuOTQtOC4wNi0xOC0xOC0xOFMwIDguMDYgMCAxOHM4LjA2IDE4IDE4IDE4IDE4LTguMDYgMTgtMTh6IiBzdHJva2U9IiNmNWYwZTgwNSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9nPjwvc3ZnPg==')] opacity-20" />

        <div className="container relative max-w-4xl mx-auto text-center px-4">
          {/* Pre-headline */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 px-3 py-1">
              <Crown className="w-3 h-3 mr-1.5" />
              AIFluencer Studio
            </Badge>
            {enrollmentCount > 0 && (
              <Badge variant="outline" className="border-white/10 text-white/50 text-xs">
                {enrollmentCount}+ enrolled
              </Badge>
            )}
          </div>

          {/* Strikethrough price */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-white/30 line-through text-xl">$157</span>
            <span className="text-4xl font-bold text-amber-400">$97</span>
            <span className="text-white/50 text-sm">one-time</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
            <span className="text-[#f5f0e8]">Meet Your</span>
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
              AI Influencer
            </span>
          </h1>

          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-4 leading-relaxed">
            The complete system to build, launch, and monetize a hyper-realistic AI influencer —
            <strong className="text-white"> without showing your face, without expensive equipment,
            and without any prior experience.</strong>
          </p>

          <p className="text-white/40 text-sm mb-10">
            *Start inside this course this week, no experience required
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            {isEnrolled ? (
              <Button
                size="lg"
                onClick={() => navigate("/course")}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg px-10 py-6 rounded-full shadow-lg shadow-amber-500/20"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Go to My Course
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={() => { setSelectedPlan("full"); handleEnroll(); }}
                  disabled={checkoutMutation.isPending}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg px-10 py-6 rounded-full shadow-lg shadow-amber-500/20"
                >
                  {checkoutMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Zap className="w-5 h-5 mr-2" />}
                  Get Instant Access — $97
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <button
                  onClick={() => { setSelectedPlan("installment"); handleEnroll(); }}
                  className="text-white/50 hover:text-white/80 text-sm underline underline-offset-4 transition-colors"
                >
                  Or 2 monthly payments of $49
                </button>
              </>
            )}
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/40 text-xs">
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> 7-day money back</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Lifetime access</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Instant access</span>
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Private community</span>
          </div>
        </div>
      </section>

      {/* ── WHAT YOU'LL MASTER ───────────────────────────────────────────── */}
      <section className="py-20 border-t border-white/5">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              What You'll <span className="text-amber-400">Master</span>
            </h2>
            <p className="text-white/50">Inside the course</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SKILLS.map((skill, i) => {
              const Icon = skill.icon;
              return (
                <div key={i} className="flex items-center gap-4 bg-white/3 rounded-xl p-5 border border-white/5 hover:border-amber-500/20 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-white/80 text-sm font-medium">{skill.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── COURSE MODULES ───────────────────────────────────────────────── */}
      <section className="py-20 border-t border-white/5">
        <div className="container max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Inside the <span className="text-amber-400">Course</span>
            </h2>
            <p className="text-white/50">5 modules, everything you need</p>
          </div>

          {modules.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-white/3 rounded-xl animate-pulse border border-white/5" />
              ))}
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-3">
              {modules.map((mod: any, i: number) => (
                <AccordionItem
                  key={mod.id}
                  value={`mod-${mod.id}`}
                  className="bg-white/3 border border-white/5 rounded-xl px-5 hover:border-amber-500/20 transition-all"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-400 font-bold text-sm">
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-white/90">{mod.title}</div>
                        {mod.duration && (
                          <div className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> {mod.duration}
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <p className="text-white/60 text-sm leading-relaxed pl-12">{mod.description}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </section>

      {/* ── FREE BONUSES ─────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-white/5 bg-gradient-to-b from-transparent to-amber-950/10">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-amber-500/20 text-amber-400 border-amber-500/30">
              <Gift className="w-3 h-3 mr-1.5" />
              Free Bonuses
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Join Today and Get <span className="text-amber-400">${totalBonusValue} in Bonuses</span>
            </h2>
            <p className="text-white/50">Included free when you enroll today</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {bonuses.length === 0 ? (
              [
                { title: "AI Influencer Prompt Vault", desc: "500+ proven prompts for instant content", value: 197, icon: Sparkles },
                { title: "Monetization Blueprint PDF", desc: "5 income streams in 30 days roadmap", value: 97, icon: TrendingUp },
                { title: "Private Community Access", desc: "500+ AI creators, weekly live Q&As", value: 297, icon: Users },
              ].map((b, i) => {
                const Icon = b.icon;
                return (
                  <Card key={i} className="bg-white/3 border-amber-500/10 p-6 text-center hover:border-amber-500/30 transition-all">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="text-amber-400 font-bold text-lg mb-1">${b.value} value</div>
                    <h3 className="font-semibold text-white/90 mb-2">{b.title}</h3>
                    <p className="text-white/50 text-sm">{b.desc}</p>
                  </Card>
                );
              })
            ) : (
              bonuses.map((b: any) => (
                <Card key={b.id} className="bg-white/3 border-amber-500/10 p-6 text-center hover:border-amber-500/30 transition-all">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                    <Gift className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="text-amber-400 font-bold text-lg mb-1">${Number(b.value).toFixed(0)} value</div>
                  <h3 className="font-semibold text-white/90 mb-2">{b.title}</h3>
                  <p className="text-white/50 text-sm">{b.description}</p>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── WHAT YOU CAN DO AFTER ────────────────────────────────────────── */}
      <section className="py-20 border-t border-white/5">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              What You Can Do After <span className="text-amber-400">AIFluencer?</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {OUTCOMES.map((outcome, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-white/3 rounded-xl border border-white/5">
                <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-white/80 text-sm">{outcome}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-white/5 bg-gradient-to-b from-transparent to-amber-950/5">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              What People Are <span className="text-amber-400">Saying</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.length === 0 ? (
              [
                { name: "Sarah K.", role: "AI Creator, 12k followers", content: "I went from zero to $3,200/month in my first 60 days. The AI tools are insane.", rating: 5 },
                { name: "Marcus T.", role: "Digital Entrepreneur", content: "The monetization module alone was worth 10x the price. Running 3 AI accounts now.", rating: 5 },
                { name: "Priya M.", role: "Content Creator", content: "Zero tech background, had my first AI influencer live within a week. Crystal clear tutorials.", rating: 5 },
              ].map((t, i) => (
                <TestimonialCard key={i} {...t} />
              ))
            ) : (
              testimonials.map((t: any) => (
                <TestimonialCard key={t.id} name={t.name} role={t.role} content={t.content} rating={t.rating} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── WHO IS IT FOR ─────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-white/5">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Who Is It <span className="text-amber-400">For?</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FOR_WHO.map((item, i) => (
              <div key={i} className="p-5 bg-white/3 rounded-xl border border-white/5 hover:border-amber-500/20 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                  <h3 className="font-semibold text-white/90 text-sm">{item.title}</h3>
                </div>
                <p className="text-white/50 text-xs leading-relaxed pl-6">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 border-t border-white/5 bg-gradient-to-b from-transparent to-amber-950/10">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Simple, <span className="text-amber-400">Transparent</span> Pricing
            </h2>
            <p className="text-white/50">One-time investment. Lifetime access.</p>
          </div>

          <Card className="bg-white/3 border-amber-500/20 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />

            <Badge className="mb-4 bg-amber-500/20 text-amber-400 border-amber-500/30">
              <Crown className="w-3 h-3 mr-1.5" />
              AIFluencer Studio — Full Access
            </Badge>

            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-white/30 line-through text-2xl">$157</span>
              <span className="text-6xl font-black text-amber-400">$97</span>
            </div>
            <p className="text-white/40 text-sm mb-8">one-time payment · no subscription</p>

            {/* What's included */}
            <div className="text-left space-y-3 mb-8">
              {[
                "5 comprehensive modules (6+ hours of content)",
                "AI Influencer Prompt Vault ($197 value)",
                "Monetization Blueprint PDF ($97 value)",
                "Private Community Access ($297 value)",
                "Lifetime access + all future updates",
                "7-day money-back guarantee",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-white/70 text-sm">{item}</span>
                </div>
              ))}
            </div>

            {isEnrolled ? (
              <Button
                size="lg"
                onClick={() => navigate("/course")}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg py-6 rounded-full"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Go to My Course
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={() => { setSelectedPlan("full"); handleEnroll(); }}
                  disabled={checkoutMutation.isPending}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg py-6 rounded-full mb-3"
                >
                  {checkoutMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Zap className="w-5 h-5 mr-2" />}
                  Get Instant Access — $97
                </Button>
                <button
                  onClick={() => { setSelectedPlan("installment"); handleEnroll(); }}
                  className="text-white/40 hover:text-white/70 text-sm underline underline-offset-4 transition-colors"
                >
                  Or 2 monthly payments of $49
                </button>
              </>
            )}

            <div className="flex items-center justify-center gap-6 mt-6 text-white/30 text-xs">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> 7-day guarantee</span>
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Secure checkout</span>
              <span className="flex items-center gap-1"><Award className="w-3 h-3" /> Lifetime access</span>
            </div>
          </Card>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-white/5">
        <div className="container max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Frequently Asked <span className="text-amber-400">Questions</span>
            </h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {FAQ.map((item, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-white/3 border border-white/5 rounded-xl px-5 hover:border-amber-500/10 transition-all"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5 text-white/80 font-medium">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-white/50 text-sm leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── ABOUT THE CREATOR ────────────────────────────────────────────── */}
      <section className="py-20 border-t border-white/5">
        <div className="container max-w-3xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center flex-shrink-0 text-4xl font-black text-black">
              AI
            </div>
            <div>
              <p className="text-amber-400 text-sm font-medium mb-2">About the Creator</p>
              <h3 className="text-2xl font-bold mb-4">Built by AI Influencer Practitioners</h3>
              <p className="text-white/60 leading-relaxed">
                This course was built by a team of AI creators, affiliate marketers, and digital entrepreneurs
                who have collectively generated over $500k using AI influencer systems. We don't teach theory —
                we teach exactly what works right now, with real examples and real results.
              </p>
              <div className="flex items-center gap-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
                <span className="text-white/40 text-sm ml-2">Rated 4.9/5 by 200+ students</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 border-t border-white/5 bg-gradient-to-b from-transparent to-amber-950/20">
        <div className="container max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Ready to Build Your
            <br />
            <span className="text-amber-400">AI Empire?</span>
          </h2>
          <p className="text-white/50 mb-10">
            Join 200+ creators who are already building faceless income with AI influencers.
          </p>
          {isEnrolled ? (
            <Button
              size="lg"
              onClick={() => navigate("/course")}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xl px-12 py-7 rounded-full"
            >
              <BookOpen className="w-6 h-6 mr-2" />
              Continue Learning
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={() => { setSelectedPlan("full"); handleEnroll(); }}
              disabled={checkoutMutation.isPending}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xl px-12 py-7 rounded-full shadow-2xl shadow-amber-500/20"
            >
              {checkoutMutation.isPending ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : <Zap className="w-6 h-6 mr-2" />}
              Get Instant Access — $97
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

function TestimonialCard({ name, role, content, rating }: {
  name: string; role?: string; content: string; rating?: number;
}) {
  return (
    <Card className="bg-white/3 border-white/5 p-5 hover:border-amber-500/20 transition-all">
      <div className="flex items-center gap-1 mb-3">
        {[...Array(rating || 5)].map((_, i) => (
          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-white/70 text-sm leading-relaxed mb-4">"{content}"</p>
      <div>
        <div className="font-semibold text-white/90 text-sm">{name}</div>
        {role && <div className="text-white/40 text-xs">{role}</div>}
      </div>
    </Card>
  );
}
