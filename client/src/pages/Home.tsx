import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { Link } from "wouter";
import { 
  Sparkles, ArrowRight, Check, Star, Users, 
  Zap, Shield, Globe, Play, ChevronRight
} from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI-Powered Generation",
    description: "Create photorealistic AI influencers in seconds with our advanced image generation technology."
  },
  {
    icon: Users,
    title: "Endless Customization",
    description: "Choose from dozens of character types, ethnicities, features, and styles to create your perfect influencer."
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Generate high-quality images in under 30 seconds. No waiting, no complicated software."
  },
  {
    icon: Shield,
    title: "Commercial License",
    description: "Use your AI influencers for marketing, advertising, and social media with full commercial rights."
  },
  {
    icon: Globe,
    title: "Global Appeal",
    description: "Create diverse influencers that resonate with audiences worldwide."
  },
  {
    icon: Star,
    title: "Premium Quality",
    description: "HD downloads, no watermarks on paid plans, and professional-grade output."
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    role: "Marketing Director",
    content: "AI Influencer Generator has transformed our content strategy. We create consistent brand ambassadors without the hassle of scheduling real influencers.",
    rating: 5,
  },
  {
    name: "James K.",
    role: "E-commerce Owner",
    content: "The quality is incredible. Our product photos with AI influencers have increased conversions by 40%.",
    rating: 5,
  },
  {
    name: "Lisa T.",
    role: "Social Media Manager",
    content: "Finally, a tool that lets me create diverse, on-brand content without breaking the budget. Absolutely essential.",
    rating: 5,
  },
];

const STATS = [
  { value: "50K+", label: "Influencers Created" },
  { value: "10K+", label: "Happy Users" },
  { value: "4.9/5", label: "User Rating" },
  { value: "30s", label: "Avg Generation Time" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-pulse-glow">
              <Sparkles className="w-4 h-4" />
              #1 AI Influencer Marketing Platform
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Create Stunning{" "}
              <span className="text-primary neon-text">AI Influencers</span>
              {" "}in Seconds
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The most powerful AI influencer generator for marketers, brands, and content creators. 
              Design photorealistic virtual influencers without any design skills.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild size="lg" className="gradient-primary neon-glow text-lg h-14 px-8">
                {isAuthenticated ? (
                  <Link href="/studio">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Open Studio
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                ) : (
                  <a href={getLoginUrl()}>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start Creating Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </a>
                )}
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg h-14 px-8">
                <Link href="/pricing">
                  View Pricing
                </Link>
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="flex -space-x-2">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-secondary border-2 border-background" />
                  ))}
                </div>
                <span className="ml-2">10,000+ creators</span>
              </div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
                <span className="ml-1">4.9/5 rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border bg-card/50">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Create{" "}
              <span className="text-primary">Virtual Influencers</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Our AI influencer generator comes packed with powerful features to help you create, customize, and deploy virtual influencers at scale.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <div 
                key={i} 
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 md:py-28 bg-card/50">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Create Your AI Influencer in{" "}
              <span className="text-primary">3 Simple Steps</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              No design skills required. Our intuitive builder makes it easy for anyone to create stunning AI influencers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: "1", title: "Choose Your Style", description: "Select character type, gender, ethnicity, and customize every detail with our visual builder." },
              { step: "2", title: "Generate with AI", description: "Our advanced AI creates a photorealistic influencer based on your specifications in seconds." },
              { step: "3", title: "Download & Use", description: "Get your HD image ready for social media, marketing campaigns, or any commercial use." },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-primary-foreground neon-glow">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%]">
                    <ChevronRight className="w-6 h-6 text-primary/30" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" className="gradient-primary neon-glow">
              <Link href="/studio">
                <Play className="w-5 h-5 mr-2" />
                Try It Now - Free
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Showcase Gallery */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              See What Our <span className="text-primary">AI Can Create</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Explore stunning AI-generated influencers created by our users. Every image is unique and ready for commercial use.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto mb-8">
            {[
              { src: "/showcase/influencer-1.png", name: "Sophia", style: "Elegant" },
              { src: "/showcase/influencer-2.jpg", name: "Emma", style: "Natural" },
              { src: "/showcase/influencer-3.jpg", name: "Olivia", style: "Professional" },
              { src: "/showcase/influencer-4.png", name: "Ava", style: "Glamour" },
            ].map((item, i) => (
              <div 
                key={i} 
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <img 
                  src={item.src} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="text-sm text-white/70">{item.style}</p>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="px-2 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium">
                    AI Generated
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/gallery">
                View More Examples
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28 bg-card/30">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by <span className="text-primary">Thousands</span> of Creators
            </h2>
            <p className="text-lg text-muted-foreground">
              See what our users are saying about AI Influencer Generator.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map((testimonial, i) => (
              <div key={i} className="p-6 rounded-2xl bg-card border border-border">
                <div className="flex gap-1 mb-4">
                  {Array(testimonial.rating).fill(0).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-card/50">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Create Your First{" "}
              <span className="text-primary neon-text">AI Influencer</span>?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of creators using AI Influencer Generator. Start free, no credit card required.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild size="lg" className="gradient-primary neon-glow text-lg h-14 px-8">
                <a href={isAuthenticated ? "/studio" : getLoginUrl()}>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </a>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>5 free credits</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold">AI Influencer</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The #1 AI influencer marketing platform for creating photorealistic virtual influencers.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/studio" className="hover:text-foreground transition-colors">Studio</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/gallery" className="hover:text-foreground transition-colors">Gallery</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/affiliate" className="hover:text-foreground transition-colors">Affiliate Program</Link></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AI Influencer Generator. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              AI Influencer Marketing Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
