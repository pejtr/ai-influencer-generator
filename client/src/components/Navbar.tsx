import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { 
  Sparkles, Menu, X, User, LogOut, CreditCard, LayoutDashboard, 
  Image, Calendar, Zap, Link2, MessageCircle, Users,
  Home, Palette, DollarSign, ArrowRight, BookOpen, Crown
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { data: userCredits } = trpc.credits.getBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/studio", label: "Studio", icon: Sparkles },
    { href: "/gallery", label: "Gallery", icon: Image },
    { href: "/companions", label: "AI Chat", icon: MessageCircle },
    { href: "/earn", label: "Earn", icon: DollarSign },
    { href: "/video-templates", label: "Templates", icon: Palette },
    { href: "/aifluencer-studio", label: "Studio Course", icon: Crown },
    { href: "/pricing", label: "Pricing", icon: CreditCard },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center neon-glow">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                AI Influencer
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={isActive(link.href) ? "secondary" : "ghost"}
                    className={`${isActive(link.href) ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {/* Credits display */}
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{userCredits?.credits ?? 0} credits</span>
                  </div>

                  {/* Notifications */}
                  <NotificationBell />

                  {/* User menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium">{user?.name || "User"}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/studio" className="flex items-center gap-2 cursor-pointer">
                          <Sparkles className="w-4 h-4" />
                          <span>Studio</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/gallery" className="flex items-center gap-2 cursor-pointer">
                          <Image className="w-4 h-4" />
                          <span>My Gallery</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/pricing" className="flex items-center gap-2 cursor-pointer">
                          <CreditCard className="w-4 h-4" />
                          <span>Upgrade Plan</span>
                        </Link>
                      </DropdownMenuItem>
                      {(user?.tier === "pro" || user?.tier === "creator") && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href="/companions" className="flex items-center gap-2 cursor-pointer">
                              <MessageCircle className="w-4 h-4" />
                              <span>AI Chat Companions</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/creator" className="flex items-center gap-2 cursor-pointer">
                              <Users className="w-4 h-4" />
                              <span>Creator Dashboard</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/creator/tools" className="flex items-center gap-2 cursor-pointer">
                              <Zap className="w-4 h-4" />
                              <span>Creator Tools</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/fanvue" className="flex items-center gap-2 cursor-pointer">
                              <Link2 className="w-4 h-4" />
                              <span>Fanvue Connect</span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      {user?.tier === "creator" && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href="/scheduler" className="flex items-center gap-2 cursor-pointer">
                              <Calendar className="w-4 h-4" />
                              <span>Content Scheduler</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/batch" className="flex items-center gap-2 cursor-pointer">
                              <Zap className="w-4 h-4" />
                              <span>Batch Generation</span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      {user?.role === "admin" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                              <LayoutDashboard className="w-4 h-4" />
                              <span>Admin Dashboard</span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => logout()} className="text-destructive cursor-pointer">
                        <LogOut className="w-4 h-4 mr-2" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild className="hidden sm:inline-flex">
                    <a href={getLoginUrl()}>Log in</a>
                  </Button>
                  <Button asChild className="gradient-primary neon-glow">
                    <a href={getLoginUrl()}>Get Started Free</a>
                  </Button>
                </>
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden relative z-[60]"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Full-screen Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 z-[55] md:hidden transition-all duration-300 ${
          mobileMenuOpen 
            ? 'opacity-100 pointer-events-auto' 
            : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-background/95 backdrop-blur-xl"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Menu Content */}
        <div className={`relative h-full flex flex-col pt-24 pb-8 px-6 transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-y-0' : '-translate-y-8'
        }`}>
          {/* Credits bar for authenticated users */}
          {isAuthenticated && (
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{user?.name || "User"}</p>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-xs text-muted-foreground">{userCredits?.credits ?? 0} credits</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="flex-1 flex flex-col gap-1">
            {navLinks.map((link, i) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div 
                    className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200 active:scale-[0.98] ${
                      active 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-foreground hover:bg-muted/50'
                    }`}
                    style={{ 
                      transitionDelay: mobileMenuOpen ? `${i * 50}ms` : '0ms',
                      transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-20px)',
                      opacity: mobileMenuOpen ? 1 : 0,
                    }}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-lg font-medium">{link.label}</span>
                    {active && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                </Link>
              );
            })}

            {/* Additional links for authenticated users */}
            {isAuthenticated && (
              <>
                <div className="h-px bg-border my-3 mx-4" />
                
                {(user?.tier === "pro" || user?.tier === "creator") && (
                  <>
                    <Link href="/creator" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-foreground hover:bg-muted/50 transition-all active:scale-[0.98]">
                        <Users className="w-5 h-5 text-muted-foreground" />
                        <span className="text-base font-medium">Creator Dashboard</span>
                      </div>
                    </Link>
                    <Link href="/fanvue" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-foreground hover:bg-muted/50 transition-all active:scale-[0.98]">
                        <Link2 className="w-5 h-5 text-muted-foreground" />
                        <span className="text-base font-medium">Fanvue Connect</span>
                      </div>
                    </Link>
                  </>
                )}

                {user?.tier === "creator" && (
                  <>
                    <Link href="/scheduler" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-foreground hover:bg-muted/50 transition-all active:scale-[0.98]">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <span className="text-base font-medium">Content Scheduler</span>
                      </div>
                    </Link>
                    <Link href="/batch" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-foreground hover:bg-muted/50 transition-all active:scale-[0.98]">
                        <Zap className="w-5 h-5 text-muted-foreground" />
                        <span className="text-base font-medium">Batch Generation</span>
                      </div>
                    </Link>
                  </>
                )}

                {user?.role === "admin" && (
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-foreground hover:bg-muted/50 transition-all active:scale-[0.98]">
                      <LayoutDashboard className="w-5 h-5 text-muted-foreground" />
                      <span className="text-base font-medium">Admin Dashboard</span>
                    </div>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Bottom section */}
          <div className="mt-auto pt-4">
            {isAuthenticated ? (
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="flex items-center gap-4 px-4 py-4 rounded-2xl text-destructive hover:bg-destructive/10 transition-all w-full active:scale-[0.98]"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-base font-medium">Log out</span>
              </button>
            ) : (
              <a 
                href={getLoginUrl()}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-semibold text-lg neon-glow active:scale-[0.98] transition-transform"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
