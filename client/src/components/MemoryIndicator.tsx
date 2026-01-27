import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Sparkles, TrendingUp, Heart, User, Target, Briefcase, MessageCircle, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface MemoryIndicatorProps {
  conversationId: number;
  personalityId: number;
  personalityName: string;
}

// Memory type icons
const MEMORY_TYPE_ICONS: Record<string, React.ReactNode> = {
  fact: <User className="w-3 h-3" />,
  preference: <Heart className="w-3 h-3" />,
  interest: <Sparkles className="w-3 h-3" />,
  relationship: <Heart className="w-3 h-3" />,
  goal: <Target className="w-3 h-3" />,
  experience: <Briefcase className="w-3 h-3" />,
  context: <MessageCircle className="w-3 h-3" />,
};

// Memory type colors
const MEMORY_TYPE_COLORS: Record<string, string> = {
  fact: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  preference: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  interest: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  relationship: "bg-red-500/20 text-red-400 border-red-500/30",
  goal: "bg-green-500/20 text-green-400 border-green-500/30",
  experience: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  context: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export function MemoryIndicator({ conversationId, personalityId, personalityName }: MemoryIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Get conversation insights
  const { data: insights, refetch: refetchInsights } = trpc.chatCompanion.getConversationInsights.useQuery(
    { conversationId, personalityId },
    { enabled: conversationId > 0 }
  );

  // Get memories
  const { data: memories, refetch: refetchMemories } = trpc.chatCompanion.getMemories.useQuery(
    { personalityId },
    { enabled: showDetails }
  );

  // Delete memories mutation
  const deleteMemories = trpc.chatCompanion.deleteMemories.useMutation({
    onSuccess: (data: { deleted: number }) => {
      toast.success(`Deleted ${data.deleted} memories`);
      refetchMemories();
      refetchInsights();
    },
    onError: (error: { message: string }) => {
      toast.error(error.message);
    },
  });

  if (!insights) return null;

  const hasMemories = insights.memoriesCount > 0;

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${hasMemories ? "text-primary" : "text-muted-foreground"}`}
          >
            <Brain className={`w-4 h-4 ${hasMemories ? "text-primary animate-pulse" : ""}`} />
            {hasMemories && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {insights.memoriesCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                AI Memory
              </h4>
              {hasMemories && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(true)}
                  className="text-xs"
                >
                  View All
                </Button>
              )}
            </div>

            {hasMemories ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {personalityName} remembers <strong>{insights.memoriesCount}</strong> things about you
                </p>

                {/* Mood indicator */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Conversation mood:</span>
                  <Badge variant="outline" className="capitalize">
                    {insights.mood}
                  </Badge>
                </div>

                {/* Engagement level */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Engagement:</span>
                  <div className="flex gap-1">
                    {["low", "medium", "high"].map((level, i) => (
                      <div
                        key={level}
                        className={`w-2 h-4 rounded-sm ${
                          i <= ["low", "medium", "high"].indexOf(insights.engagementLevel)
                            ? "bg-primary"
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">
                    {insights.engagementLevel}
                  </span>
                </div>

                {/* Top topics */}
                {insights.topTopics.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Topics discussed:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {insights.topTopics.map((topic: string) => (
                        <Badge key={topic} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <Brain className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No memories yet. Keep chatting and {personalityName} will remember things about you!
                </p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Detailed Memory Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              What {personalityName} Remembers
            </DialogTitle>
            <DialogDescription>
              These are things {personalityName} has learned about you from your conversations
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[400px] pr-4">
            {memories && memories.length > 0 ? (
              <div className="space-y-3">
                {memories.map((memory: any) => (
                  <div
                    key={memory.id}
                    className="p-3 rounded-lg border bg-card/50 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${MEMORY_TYPE_COLORS[memory.memoryType] || ""}`}
                        >
                          {MEMORY_TYPE_ICONS[memory.memoryType]}
                          <span className="ml-1 capitalize">{memory.memoryType}</span>
                        </Badge>
                        {memory.category && (
                          <Badge variant="secondary" className="text-xs">
                            {memory.category}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Used {memory.timesUsed}x
                      </span>
                    </div>
                    <p className="text-sm">{memory.content}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Confidence: {Math.round(memory.confidence * 100)}%</span>
                      {memory.isVerified && (
                        <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">No memories found</p>
              </div>
            )}
          </ScrollArea>

          {memories && memories.length > 0 && (
            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                {memories.length} memories stored
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm("Are you sure you want to delete all memories? This cannot be undone.")) {
                    deleteMemories.mutate({ personalityId });
                  }
                }}
                disabled={deleteMemories.isPending}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Suggested links component
interface SuggestedLinksProps {
  links: Array<{ url: string; label: string; reason: string }>;
}

export function SuggestedLinks({ links }: SuggestedLinksProps) {
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {links.map((link, i) => (
        <a
          key={i}
          href={link.url}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          title={link.reason}
        >
          <TrendingUp className="w-3 h-3" />
          {link.label}
        </a>
      ))}
    </div>
  );
}
