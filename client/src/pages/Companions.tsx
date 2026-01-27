import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle, Sparkles, Search, Users, Heart,
  ArrowRight
} from "lucide-react";

// Personality type colors and labels
const PERSONALITY_STYLES: Record<string, { color: string; emoji: string }> = {
  flirty: { color: "bg-pink-500/20 text-pink-400 border-pink-500/30", emoji: "💋" },
  friendly: { color: "bg-green-500/20 text-green-400 border-green-500/30", emoji: "😊" },
  mysterious: { color: "bg-purple-500/20 text-purple-400 border-purple-500/30", emoji: "🔮" },
  playful: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", emoji: "🎭" },
  sophisticated: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", emoji: "👑" },
  bold: { color: "bg-red-500/20 text-red-400 border-red-500/30", emoji: "🔥" },
};

export default function Companions() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Get active personalities
  const { data: personalities, isLoading } = trpc.chatCompanion.getActivePersonalities.useQuery(
    { limit: 50 }
  );

  // Filter personalities
  const filteredPersonalities = personalities?.filter((p) => {
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bio?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedType || p.personalityType === selectedType;
    return matchesSearch && matchesType;
  });

  // Handle start chat
  const handleStartChat = (personalityId: number) => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
    setLocation(`/chat/${personalityId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10" />
        <div className="container max-w-6xl mx-auto px-4 py-16 relative">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">AI Chat Companions</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Chat with AI Influencers
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Connect with unique AI personalities, unlock exclusive content, and enjoy 
              personalized conversations 24/7
            </p>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search companions..."
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b bg-card/50">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex gap-2 flex-wrap justify-center">
            <Button
              variant={selectedType === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(null)}
            >
              All
            </Button>
            {Object.entries(PERSONALITY_STYLES).map(([type, { emoji }]) => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(type)}
                className="gap-1"
              >
                <span>{emoji}</span>
                <span className="capitalize">{type}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Companions Grid */}
      <div className="container max-w-6xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-muted" />
                    <div className="flex-1">
                      <div className="h-5 w-24 bg-muted rounded mb-2" />
                      <div className="h-4 w-16 bg-muted rounded" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-16 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPersonalities?.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">No Companions Found</h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? "Try a different search term" 
                : "Be the first to create an AI companion!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPersonalities?.map((personality) => {
              const style = PERSONALITY_STYLES[personality.personalityType] || PERSONALITY_STYLES.friendly;
              
              return (
                <Card 
                  key={personality.id} 
                  className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16 border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
                        <AvatarImage src={personality.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xl">
                          {personality.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                          {personality.name}
                        </h3>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${style.color}`}
                        >
                          {style.emoji} {personality.personalityType}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {personality.bio || "Ready to chat and get to know you! 💬"}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{personality.totalConversations || 0} chats</span>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-0">
                    <Button 
                      onClick={() => handleStartChat(personality.id)}
                      className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      variant="outline"
                    >
                      <Heart className="w-4 h-4" />
                      Start Chatting
                      <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="border-t bg-card/50">
        <div className="container max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Create Your Own AI Companion
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Build a unique AI personality, customize their traits, and start earning 
            from conversations and exclusive content sales.
          </p>
          <Button 
            size="lg" 
            onClick={() => setLocation("/creator/personalities")}
            className="gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Create AI Companion
          </Button>
        </div>
      </div>
    </div>
  );
}
