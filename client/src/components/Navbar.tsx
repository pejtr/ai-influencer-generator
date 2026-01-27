import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { Sparkles, Menu, X, User, LogOut, CreditCard, LayoutDashboard, Image, Calendar, Zap, Link2, MessageCircle, Users } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { data: userCredits } = trpc.credits.getBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/studio", label: "Studio" },
    { href: "/gallery", label: "Gallery" },
    { href: "/companions", label: "AI Chat" },
    { href: "/pricing", label: "Pricing" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
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
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={isActive(link.href) ? "secondary" : "ghost"}
                    className={`w-full justify-start ${isActive(link.href) ? "text-primary" : ""}`}
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
              {isAuthenticated && (
                <div className="flex items-center gap-2 px-3 py-2 mt-2 rounded-lg bg-secondary">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{userCredits?.credits ?? 0} credits</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
