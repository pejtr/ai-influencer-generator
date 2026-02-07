import { Link, useLocation } from "wouter";
import { Home, Sparkles, Image, MessageCircle, DollarSign } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { haptic } from "@/lib/haptics";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/studio", label: "Studio", icon: Sparkles },
  { href: "/gallery", label: "Gallery", icon: Image },
  { href: "/companions", label: "Chat", icon: MessageCircle },
  { href: "/earn", label: "Earn", icon: DollarSign },
];

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  // Don't show on landing page for non-authenticated users (they have the landing page nav)
  // Always show for authenticated users on all pages
  if (!isAuthenticated && location === "/") return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <button
                onClick={() => haptic("selection")}
                className={`flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl transition-colors ${
                  active
                    ? "text-blue-500"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-blue-500" : ""}`} />
                <span className={`text-[10px] font-medium ${active ? "text-blue-500" : ""}`}>
                  {item.label}
                </span>
                {active && (
                  <div className="absolute top-0 w-8 h-0.5 bg-blue-500 rounded-full" />
                )}
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
