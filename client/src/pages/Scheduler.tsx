import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Clock, Image, Trash2, Edit, CheckCircle, XCircle, Loader2, Lock, Sparkles, CalendarDays, Zap } from "lucide-react";
import { Link } from "wouter";

export default function Scheduler() {
  const { user, loading: authLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState<number | null>(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("#AIInfluencer #VirtualModel #ContentCreator");
  const [scheduledTime, setScheduledTime] = useState("");

  // Check if user has CREATOR tier (scheduler access)
  const isCreator = user?.tier === "creator";

  // Fetch scheduled posts
  const { data: scheduledPosts, isLoading: postsLoading, refetch: refetchPosts } = trpc.scheduler.list.useQuery(
    undefined,
    { enabled: isCreator }
  );

  // Fetch unpublished generations for selection
  const { data: unpublishedGenerations } = trpc.generation.getUnpublished.useQuery(
    undefined,
    { enabled: isCreator }
  );

  // Mutations
  const createMutation = trpc.scheduler.create.useMutation({
    onSuccess: () => {
      toast.success("Post scheduled successfully!");
      setIsCreateOpen(false);
      setSelectedGeneration(null);
      setCaption("");
      setScheduledTime("");
      refetchPosts();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const cancelMutation = trpc.scheduler.cancel.useMutation({
    onSuccess: () => {
      toast.success("Scheduled post cancelled");
      refetchPosts();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.scheduler.delete.useMutation({
    onSuccess: () => {
      toast.success("Scheduled post deleted");
      refetchPosts();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Calendar helpers
  const currentMonth = useMemo(() => {
    const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const days: Date[] = [];
    
    // Add padding days from previous month
    const startDay = start.getDay();
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(start);
      d.setDate(d.getDate() - i - 1);
      days.push(d);
    }
    
    // Add days of current month
    for (let i = 1; i <= end.getDate(); i++) {
      days.push(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i));
    }
    
    // Add padding days from next month
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, i));
    }
    
    return days;
  }, [selectedDate]);

  const getPostsForDate = (date: Date) => {
    if (!scheduledPosts) return [];
    return scheduledPosts.filter(post => {
      const postDate = new Date(post.scheduledAt);
      return postDate.toDateString() === date.toDateString();
    });
  };

  const handleCreatePost = () => {
    if (!selectedGeneration || !scheduledTime) {
      toast.error("Please select an image and schedule time");
      return;
    }

    createMutation.mutate({
      generationId: selectedGeneration,
      scheduledAt: scheduledTime,
      caption,
      hashtags,
    });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Scheduled</Badge>;
      case "published":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" /> Published</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/30"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      default:
        return null;
    }
  };

  // VIP Gate
  if (!authLoading && !isCreator) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#c8ff00]/10 flex items-center justify-center">
              <Lock className="w-10 h-10 text-[#c8ff00]" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Content Scheduler</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Plan and schedule your Fanvue content in advance. Batch generate up to 30 images at once and automate your posting workflow.
            </p>
            
            <Card className="bg-card/50 border-[#c8ff00]/20 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#c8ff00]" />
                  VIP Feature
                </CardTitle>
                <CardDescription>
                  Upgrade to VIP to unlock the Content Scheduler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-left space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-[#c8ff00]" />
                    <span>Visual content calendar</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#c8ff00]" />
                    <span>Batch generation (up to 30 images)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#c8ff00]" />
                    <span>Auto-publish to Fanvue</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-[#c8ff00]" />
                    <span>1000 credits/month</span>
                  </li>
                </ul>
                <Link href="/pricing">
                  <Button className="w-full bg-[#c8ff00] text-black hover:bg-[#a8d600]">
                    Upgrade to VIP - $99/month
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CalendarDays className="w-8 h-8 text-[#c8ff00]" />
              Content Scheduler
            </h1>
            <p className="text-muted-foreground mt-1">
              Plan and schedule your Fanvue content
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#c8ff00] text-black hover:bg-[#a8d600]">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Post</DialogTitle>
                <DialogDescription>
                  Select an image and schedule it for automatic publishing to Fanvue
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Image Selection */}
                <div>
                  <Label>Select Image</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2 max-h-48 overflow-y-auto">
                    {unpublishedGenerations?.map((gen) => (
                      <div
                        key={gen.id}
                        onClick={() => setSelectedGeneration(gen.id)}
                        className={`relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                          selectedGeneration === gen.id
                            ? "border-[#c8ff00] ring-2 ring-[#c8ff00]/50"
                            : "border-transparent hover:border-[#c8ff00]/50"
                        }`}
                      >
                        <img loading="lazy"
                          src={gen.imageUrl}
                          alt="Generated"
                          className="w-full h-full object-cover"
                        />
                        {selectedGeneration === gen.id && (
                          <div className="absolute inset-0 bg-[#c8ff00]/20 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-[#c8ff00]" />
                          </div>
                        )}
                      </div>
                    ))}
                    {(!unpublishedGenerations || unpublishedGenerations.length === 0) && (
                      <div className="col-span-4 text-center py-8 text-muted-foreground">
                        No unpublished images available. Generate some content first!
                      </div>
                    )}
                  </div>
                </div>

                {/* Schedule Time */}
                <div>
                  <Label htmlFor="scheduledTime">Schedule Time</Label>
                  <Input
                    id="scheduledTime"
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="mt-1"
                  />
                </div>

                {/* Caption */}
                <div>
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea
                    id="caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a caption for your post..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {/* Hashtags */}
                <div>
                  <Label htmlFor="hashtags">Hashtags</Label>
                  <Input
                    id="hashtags"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    placeholder="#AIInfluencer #VirtualModel"
                    className="mt-1"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePost}
                  disabled={createMutation.isPending || !selectedGeneration || !scheduledTime}
                  className="bg-[#c8ff00] text-black hover:bg-[#a8d600]"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Post
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <Card className="lg:col-span-2 bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </CardTitle>
                <CardDescription>Click on a date to view scheduled posts</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                >
                  Next
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {currentMonth.map((date, index) => {
                  const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
                  const isToday = date.toDateString() === new Date().toDateString();
                  const posts = getPostsForDate(date);
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[80px] p-1 rounded-lg border transition-all cursor-pointer ${
                        isCurrentMonth
                          ? "bg-card border-border/50 hover:border-[#c8ff00]/50"
                          : "bg-muted/20 border-transparent"
                      } ${isToday ? "ring-2 ring-[#c8ff00]/50" : ""}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                      } ${isToday ? "text-[#c8ff00]" : ""}`}>
                        {date.getDate()}
                      </div>
                      {posts.slice(0, 2).map((post) => (
                        <div
                          key={post.id}
                          className="text-xs bg-[#c8ff00]/20 text-[#c8ff00] rounded px-1 py-0.5 mb-0.5 truncate"
                        >
                          {new Date(post.scheduledAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      ))}
                      {posts.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{posts.length - 2} more
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Posts */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#c8ff00]" />
                Upcoming Posts
              </CardTitle>
              <CardDescription>Your scheduled content queue</CardDescription>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#c8ff00]" />
                </div>
              ) : scheduledPosts && scheduledPosts.length > 0 ? (
                <div className="space-y-4">
                  {scheduledPosts
                    .filter((post) => post.status === "scheduled")
                    .slice(0, 5)
                    .map((post) => (
                      <div
                        key={post.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                      >
                        <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0 bg-muted">
                          {/* Would show thumbnail here */}
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(post.status)}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {post.caption || "No caption"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(post.scheduledAt)}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => cancelMutation.mutate({ id: post.id })}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteMutation.mutate({ id: post.id })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No scheduled posts yet</p>
                  <p className="text-sm mt-1">Click "Schedule Post" to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
