import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Send, Heart, Lock, Unlock, DollarSign, ArrowLeft, 
  Sparkles, MessageCircle, Image as ImageIcon
} from "lucide-react";
import { MemoryIndicator } from "@/components/MemoryIndicator";

// Personality type colors
const PERSONALITY_COLORS: Record<string, string> = {
  flirty: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  friendly: "bg-green-500/20 text-green-400 border-green-500/30",
  mysterious: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  playful: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  sophisticated: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  bold: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [tipAmount, setTipAmount] = useState(5);
  const [tipMessage, setTipMessage] = useState("");
  const [showContentDialog, setShowContentDialog] = useState(false);
  const [selectedContent, setSelectedContent] = useState<{
    id: number;
    title: string;
    price: string;
    previewUrl?: string | null;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const personalityId = id ? parseInt(id) : null;

  // Get personality details
  const { data: personality } = trpc.chatCompanion.getPersonality.useQuery(
    { id: personalityId! },
    { enabled: !!personalityId }
  );

  // Start or get conversation
  const startConversation = trpc.chatCompanion.startConversation.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Get messages
  const { data: messages, refetch: refetchMessages } = trpc.chatCompanion.getMessages.useQuery(
    { conversationId: startConversation.data?.conversationId ?? 0, limit: 100 },
    { enabled: !!startConversation.data?.conversationId }
  );

  // Send message mutation
  const sendMessage = trpc.chatCompanion.sendMessage.useMutation({
    onSuccess: (data) => {
      setIsTyping(false);
      refetchMessages();
      
      // Show content offer if present
      if (data.contentOffer) {
        setSelectedContent(data.contentOffer);
        setShowContentDialog(true);
      }
    },
    onError: (error) => {
      setIsTyping(false);
      toast.error(error.message);
    },
  });

  // Unlock content mutation
  const unlockContent = trpc.chatCompanion.unlockContent.useMutation({
    onSuccess: (data) => {
      if (data.alreadyOwned) {
        toast.info("You already own this content!");
      } else {
        toast.success("Content unlocked! 🎉");
      }
      setShowContentDialog(false);
      // Open content in new tab
      window.open(data.fullUrl, "_blank");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Send tip mutation
  const sendTip = trpc.chatCompanion.sendTip.useMutation({
    onSuccess: () => {
      toast.success(`Tip sent! 💕 Thank you for your support!`);
      setShowTipDialog(false);
      setTipAmount(5);
      setTipMessage("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Start conversation on mount
  useEffect(() => {
    if (user && personalityId && !startConversation.data) {
      startConversation.mutate({ personalityId });
    }
  }, [user, personalityId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!message.trim() || !startConversation.data?.conversationId) return;
    
    const currentMessage = message;
    setMessage("");
    setIsTyping(true);
    
    sendMessage.mutate({
      conversationId: startConversation.data.conversationId,
      message: currentMessage,
    });
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle tip
  const handleSendTip = () => {
    if (!personality || tipAmount < 1) return;
    
    sendTip.mutate({
      creatorUserId: 0, // Will be filled from personality
      personalityId: personalityId!,
      conversationId: startConversation.data?.conversationId,
      amount: tipAmount,
      message: tipMessage || undefined,
    });
  };

  // Handle unlock content
  const handleUnlockContent = () => {
    if (!selectedContent) return;
    
    unlockContent.mutate({
      contentId: selectedContent.id,
      conversationId: startConversation.data?.conversationId,
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
            <CardTitle>Sign in to Chat</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              Connect with AI influencers and unlock exclusive content
            </p>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No personality selected
  if (!personalityId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
            <CardTitle>Choose an AI Companion</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              Browse our AI influencers and start chatting
            </p>
            <Button onClick={() => setLocation("/companions")} className="w-full">
              Browse Companions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/companions")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          {personality && (
            <>
              <Avatar className="w-10 h-10 border-2 border-primary/20">
                <AvatarImage src={personality.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {personality.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h1 className="font-semibold truncate">{personality.name}</h1>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${PERSONALITY_COLORS[personality.personalityType] || ""}`}
                >
                  {personality.personalityType}
                </Badge>
              </div>
              
              {startConversation.data?.conversationId && (
                <MemoryIndicator
                  conversationId={startConversation.data.conversationId}
                  personalityId={personalityId}
                  personalityName={personality.name}
                />
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTipDialog(true)}
                className="gap-2"
              >
                <Heart className="w-4 h-4 text-pink-500" />
                Tip
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto px-4 py-6 space-y-4">
          {messages?.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "fan" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "fan"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                
                {/* Content offer in message */}
                {msg.hasContentOffer && msg.offeredContentId && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-2 gap-2"
                    onClick={() => {
                      setSelectedContent({
                        id: msg.offeredContentId!,
                        title: "Exclusive Content",
                        price: "9.99",
                      });
                      setShowContentDialog(true);
                    }}
                  >
                    <Lock className="w-4 h-4" />
                    Unlock Content
                  </Button>
                )}
                
                <p className="text-xs opacity-60 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { 
                    hour: "2-digit", 
                    minute: "2-digit" 
                  })}
                </p>
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card/50 backdrop-blur-sm sticky bottom-0">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={`Message ${personality?.name || ""}...`}
              className="flex-1"
              disabled={isTyping || sendMessage.isPending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isTyping || sendMessage.isPending}
              size="icon"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tip Dialog */}
      <Dialog open={showTipDialog} onOpenChange={setShowTipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Send a Tip
            </DialogTitle>
            <DialogDescription>
              Show your appreciation to {personality?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex gap-2 flex-wrap">
              {[5, 10, 20, 50, 100].map((amount) => (
                <Button
                  key={amount}
                  variant={tipAmount === amount ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTipAmount(amount)}
                >
                  ${amount}
                </Button>
              ))}
            </div>
            
            <Input
              type="number"
              value={tipAmount}
              onChange={(e) => setTipAmount(Math.max(1, parseInt(e.target.value) || 0))}
              min={1}
              max={1000}
              className="text-center text-xl font-bold"
            />
            
            <Input
              value={tipMessage}
              onChange={(e) => setTipMessage(e.target.value)}
              placeholder="Add a message (optional)"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTipDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendTip}
              disabled={sendTip.isPending}
              className="gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Send ${tipAmount}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content Unlock Dialog */}
      <Dialog open={showContentDialog} onOpenChange={setShowContentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Unlock Exclusive Content
            </DialogTitle>
            <DialogDescription>
              {selectedContent?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {selectedContent?.previewUrl && (
              <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                <img loading="lazy" decoding="async"
                  src={selectedContent.previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover blur-xl"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <ImageIcon className="w-12 h-12 text-white/50" />
                </div>
              </div>
            )}
            
            <div className="text-center">
              <p className="text-3xl font-bold text-primary mb-2">
                ${selectedContent?.price}
              </p>
              <p className="text-sm text-muted-foreground">
                One-time purchase • Instant access
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContentDialog(false)}>
              Maybe Later
            </Button>
            <Button 
              onClick={handleUnlockContent}
              disabled={unlockContent.isPending}
              className="gap-2"
            >
              <Unlock className="w-4 h-4" />
              Unlock Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
