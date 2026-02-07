import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  ArrowRight, ArrowLeft, Check, 
  Camera, Wand2, Maximize, Mic, Video, Layers,
  ChevronRight, Sparkles
} from "lucide-react";

interface WorkflowStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: typeof Camera;
  tools: string[];
  tips: string[];
  color: string;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 1,
    title: "Face Creation",
    subtitle: "Generate Your AI Identity",
    description: "Start by creating a unique, hyper-realistic AI face using our foundational model. Choose ethnicity, age, features, and style. The generated face becomes the identity anchor for all subsequent content.",
    icon: Camera,
    tools: ["NanoBanana Pro", "Flux 2.0 Pro"],
    tips: [
      "Generate 10-20 variations and select the best one",
      "Ensure consistent lighting direction across all base images",
      "Save the seed number for identity consistency",
      "Use high-resolution (2048x2048 minimum) for best results",
    ],
    color: "from-blue-600 to-blue-800",
  },
  {
    id: 2,
    title: "Dataset Building",
    subtitle: "Create Training Material",
    description: "Build a comprehensive dataset of your AI identity in various poses, expressions, angles, and lighting conditions. This dataset ensures your AI influencer looks consistent across all content types.",
    icon: Layers,
    tools: ["Flux 2.0 Pro", "Seedrem 4"],
    tips: [
      "Create minimum 50 images with varied poses and expressions",
      "Include close-ups, mid-shots, and full-body images",
      "Vary backgrounds but keep the person consistent",
      "Include different clothing styles and accessories",
    ],
    color: "from-purple-600 to-purple-800",
  },
  {
    id: 3,
    title: "Upscale to 4K-8K",
    subtitle: "Production-Ready Quality",
    description: "Upscale all generated images to 4K or 8K resolution for production-ready quality. Fix any AI artifacts, smooth skin textures, and ensure pore-level detail that passes as real photography.",
    icon: Maximize,
    tools: ["Enhancor Skin Fix", "Topaz Gigapixel"],
    tips: [
      "Always fix skin texture before upscaling",
      "Use Enhancor's Skin Fix model for removing plastic AI look",
      "Upscale in 2x increments for best quality",
      "Check eyes and teeth detail after upscaling",
    ],
    color: "from-cyan-600 to-cyan-800",
  },
  {
    id: 4,
    title: "Voice Clone",
    subtitle: "Create Unique Voice Identity",
    description: "Clone or create a unique voice for your AI influencer. The voice should match the character's appearance and personality. Use for voiceovers, podcasts, and interactive content.",
    icon: Mic,
    tools: ["ElevenLabs", "Voice Engine"],
    tips: [
      "Record or select a reference voice that matches the character",
      "Generate voice samples in different emotions (happy, serious, excited)",
      "Test voice with long-form content to check consistency",
      "Create voice presets for different content types",
    ],
    color: "from-green-600 to-green-800",
  },
  {
    id: 5,
    title: "Image-to-Video",
    subtitle: "Bring Your AI to Life",
    description: "Transform your static AI images into dynamic video content. Add natural movements, expressions, and lip-sync to create engaging video content for social media platforms.",
    icon: Video,
    tools: ["Kling AI 2.5", "VEO 3.1", "PixVerse"],
    tips: [
      "Start with simple movements before complex actions",
      "Use Kling 2.5 Turbo for fast iterations",
      "Add lip-sync using the cloned voice for talking-head videos",
      "Keep initial videos 3-5 seconds for best quality",
    ],
    color: "from-orange-600 to-orange-800",
  },
  {
    id: 6,
    title: "Assembly & Publish",
    subtitle: "Create Final Content",
    description: "Assemble all elements into polished content pieces. Edit videos, add music, create thumbnails, write captions, and schedule posts across platforms for maximum engagement.",
    icon: Wand2,
    tools: ["CapCut", "Canva", "Our Scheduler"],
    tips: [
      "Create content batches (10-20 posts) for consistent publishing",
      "Use our built-in scheduler for optimal posting times",
      "A/B test different thumbnails and captions",
      "Track engagement metrics to optimize future content",
    ],
    color: "from-pink-600 to-pink-800",
  },
];

export default function CloneWorkflow() {
  const [activeStep, setActiveStep] = useState(0);
  const step = WORKFLOW_STEPS[activeStep];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="font-black text-xl tracking-tight">
              AI Influencer
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/prompts" className="text-sm text-white/70 hover:text-white">
                Prompts
              </Link>
              <Link href="/studio">
                <Button className="bg-white text-black hover:bg-white/90 font-semibold rounded-full px-6">
                  ENTER APP
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-28 pb-8 bg-gradient-to-b from-blue-950/30 to-black">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/20 text-blue-400 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              6-STEP WORKFLOW
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4" style={{ fontFamily: "'Oswald', sans-serif" }}>
              AI CLONE<br />WORKFLOW
            </h1>
            <p className="text-lg text-white/60 max-w-xl">
              The complete guide to creating a hyper-realistic AI influencer from scratch. 
              Follow these 6 steps to build your digital identity.
            </p>
          </div>
        </div>
      </section>

      {/* Step Progress */}
      <section className="sticky top-16 z-40 bg-black/90 backdrop-blur-md border-b border-white/10 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {WORKFLOW_STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveStep(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  i === activeStep
                    ? "bg-blue-600 text-white"
                    : i < activeStep
                    ? "bg-green-600/20 text-green-400"
                    : "bg-white/5 text-white/40 hover:bg-white/10"
                }`}
              >
                {i < activeStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs">
                    {s.id}
                  </span>
                )}
                {s.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Step Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-5 gap-8">
              {/* Left: Step Info */}
              <div className="md:col-span-3">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-400 font-medium uppercase tracking-wider">
                      Step {step.id} of 6
                    </p>
                    <h2 className="text-2xl font-black" style={{ fontFamily: "'Oswald', sans-serif" }}>
                      {step.title.toUpperCase()}
                    </h2>
                  </div>
                </div>

                <p className="text-lg text-white/70 mb-8 leading-relaxed">
                  {step.description}
                </p>

                {/* Tools */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-3">
                    Recommended Tools
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {step.tools.map((tool) => (
                      <span
                        key={tool}
                        className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-3">
                  {activeStep > 0 && (
                    <Button
                      onClick={() => setActiveStep(activeStep - 1)}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 rounded-full"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                  )}
                  {activeStep < WORKFLOW_STEPS.length - 1 ? (
                    <Button
                      onClick={() => setActiveStep(activeStep + 1)}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                    >
                      Next Step
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                    >
                      <Link href="/studio">
                        Start Creating
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              {/* Right: Tips */}
              <div className="md:col-span-2">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                  <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-4">
                    Pro Tips
                  </h3>
                  <div className="space-y-3">
                    {step.tips.map((tip, i) => (
                      <div key={i} className="flex gap-3">
                        <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-white/60 leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Links */}
                <div className="mt-6 rounded-2xl bg-blue-600/10 border border-blue-500/20 p-6">
                  <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-3">
                    Related Resources
                  </h3>
                  <div className="space-y-2">
                    <Link
                      href="/prompts"
                      className="flex items-center gap-2 text-sm text-white/60 hover:text-blue-400 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Prompt Templates
                    </Link>
                    <Link
                      href="/blog"
                      className="flex items-center gap-2 text-sm text-white/60 hover:text-blue-400 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Tutorial Articles
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Steps Overview */}
      <section className="py-12 border-t border-white/10">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-black mb-8 text-center" style={{ fontFamily: "'Oswald', sans-serif" }}>
            COMPLETE WORKFLOW OVERVIEW
          </h2>
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {WORKFLOW_STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveStep(i)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  i === activeStep
                    ? "bg-blue-600/20 border-blue-500/50"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                    <s.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Step {s.id}</p>
                    <p className="font-bold text-sm">{s.title}</p>
                  </div>
                </div>
                <p className="text-xs text-white/40 line-clamp-2">{s.subtitle}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="container mx-auto px-4 text-center text-sm text-white/40">
          © 2026 AI Influencer Generator. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
