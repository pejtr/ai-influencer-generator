import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Download, Trash2, Loader2, Image as ImageIcon, 
  Plus, ExternalLink, Share2, Filter, SortAsc, SortDesc,
  Calendar, Clock, CheckCircle2, XCircle, AlertCircle,
  Twitter, Facebook, Linkedin, Link2, Copy
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { Link } from "wouter";

type SortOption = "newest" | "oldest";
type StatusFilter = "all" | "completed" | "pending" | "failed";

export default function Gallery() {
  const { user, isAuthenticated, loading } = useAuth();
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showShareMenu, setShowShareMenu] = useState<number | null>(null);

  const { data: generations, isLoading, refetch } = trpc.generation.list.useQuery(
    { limit: 100, offset: 0 },
    { enabled: isAuthenticated }
  );

  const deleteMutation = trpc.generation.delete.useMutation({
    onSuccess: () => {
      toast.success("Image deleted successfully");
      refetch();
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete image");
    },
  });

  // Filtered and sorted generations
  const filteredGenerations = useMemo(() => {
    if (!generations) return [];
    
    let filtered = [...generations];
    
    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(g => g.status === statusFilter);
    }
    
    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });
    
    return filtered;
  }, [generations, statusFilter, sortBy]);

  // Stats
  const stats = useMemo(() => {
    if (!generations) return { total: 0, completed: 0, pending: 0, failed: 0 };
    return {
      total: generations.length,
      completed: generations.filter(g => g.status === "completed").length,
      pending: generations.filter(g => g.status === "pending").length,
      failed: generations.filter(g => g.status === "failed").length,
    };
  }, [generations]);

  const handleDownload = async (imageUrl: string, id: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-influencer-${id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Image downloaded!");
    } catch {
      toast.error("Failed to download image");
    }
  };

  const handleShareNative = async (imageUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AI Influencer",
          text: "Check out my AI-generated influencer! Created with AI Influencer Generator",
          url: imageUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(imageUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleShareSocial = (platform: string, imageUrl: string) => {
    const text = encodeURIComponent("Check out my AI-generated influencer! Created with AI Influencer Generator 🤖✨");
    const url = encodeURIComponent(imageUrl);
    
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };
    
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
    }
    setShowShareMenu(null);
  };

  const handleCopyLink = async (imageUrl: string) => {
    await navigator.clipboard.writeText(imageUrl);
    toast.success("Image link copied to clipboard!");
    setShowShareMenu(null);
  };

  const selectedGeneration = generations?.find(g => g.id === selectedImage);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-8">
          <div className="container">
            <div className="max-w-md mx-auto text-center py-20">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
                <ImageIcon className="w-10 h-10 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Sign in to view your gallery</h1>
              <p className="text-muted-foreground mb-6">
                Create an account to start generating AI influencers and build your collection.
              </p>
              <Button asChild className="gradient-primary neon-glow">
                <a href={getLoginUrl()}>Get Started Free</a>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 pb-8">
        <div className="container">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">My Gallery</h1>
              <p className="text-muted-foreground">
                {stats.total} total &middot; {stats.completed} completed
                {stats.pending > 0 && <> &middot; {stats.pending} pending</>}
                {stats.failed > 0 && <> &middot; {stats.failed} failed</>}
              </p>
            </div>
            <Button asChild className="gradient-primary neon-glow">
              <Link href="/studio">
                <Plus className="w-4 h-4 mr-2" />
                Create New
              </Link>
            </Button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 mb-6 p-3 rounded-xl bg-card/50 border border-border">
            {/* Status Filters */}
            <div className="flex items-center gap-1">
              <Filter className="w-4 h-4 text-muted-foreground mr-1" />
              {(["all", "completed", "pending", "failed"] as StatusFilter[]).map((status) => {
                const icons: Record<StatusFilter, React.ReactNode> = {
                  all: <ImageIcon className="w-3.5 h-3.5" />,
                  completed: <CheckCircle2 className="w-3.5 h-3.5" />,
                  pending: <Clock className="w-3.5 h-3.5" />,
                  failed: <XCircle className="w-3.5 h-3.5" />,
                };
                const labels: Record<StatusFilter, string> = {
                  all: "All",
                  completed: "Completed",
                  pending: "Pending",
                  failed: "Failed",
                };
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                      statusFilter === status
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-secondary text-muted-foreground"
                    }`}
                  >
                    {icons[status]}
                    {labels[status]}
                    {status !== "all" && (
                      <span className="text-xs opacity-70">
                        ({status === "completed" ? stats.completed : status === "pending" ? stats.pending : stats.failed})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="ml-auto" />

            {/* Sort */}
            <button
              onClick={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm hover:bg-secondary text-muted-foreground transition-all"
            >
              {sortBy === "newest" ? (
                <SortDesc className="w-3.5 h-3.5" />
              ) : (
                <SortAsc className="w-3.5 h-3.5" />
              )}
              {sortBy === "newest" ? "Newest first" : "Oldest first"}
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredGenerations.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredGenerations.map((gen) => (
                <div
                  key={gen.id}
                  className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-card border border-border cursor-pointer"
                  onClick={() => setSelectedImage(gen.id)}
                >
                  {gen.imageUrl ? (
                    <img
                      src={gen.imageUrl}
                      alt={`AI Influencer ${gen.id}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                      {gen.status === "pending" ? (
                        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                      ) : gen.status === "failed" ? (
                        <AlertCircle className="w-8 h-8 text-destructive/50" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                      )}
                    </div>
                  )}
                  
                  {gen.hasWatermark && (
                    <div className="watermark-diagonal">AI Influencer</div>
                  )}

                  {/* Status badge */}
                  {gen.status !== "completed" && (
                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      gen.status === "pending" ? "bg-yellow-500/80 text-black" : "bg-destructive/80 text-white"
                    }`}>
                      {gen.status}
                    </div>
                  )}

                  {/* Date badge */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                    {new Date(gen.createdAt).toLocaleDateString()}
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="flex gap-2">
                        {gen.imageUrl && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(gen.imageUrl, gen.id);
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        {gen.imageUrl && (
                          <DropdownMenu open={showShareMenu === gen.id} onOpenChange={(open) => setShowShareMenu(open ? gen.id : null)}>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuLabel>Share to</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleShareSocial("twitter", gen.imageUrl)}>
                                <Twitter className="w-4 h-4 mr-2" />
                                Twitter / X
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShareSocial("facebook", gen.imageUrl)}>
                                <Facebook className="w-4 h-4 mr-2" />
                                Facebook
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShareSocial("linkedin", gen.imageUrl)}>
                                <Linkedin className="w-4 h-4 mr-2" />
                                LinkedIn
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleCopyLink(gen.imageUrl)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Link
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShareNative(gen.imageUrl)}>
                                <Link2 className="w-4 h-4 mr-2" />
                                Share via...
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(gen.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
                <ImageIcon className="w-10 h-10 text-muted-foreground" />
              </div>
              {statusFilter !== "all" ? (
                <>
                  <h2 className="text-xl font-semibold mb-2">No {statusFilter} images</h2>
                  <p className="text-muted-foreground mb-6">
                    Try changing the filter to see other images.
                  </p>
                  <Button variant="outline" onClick={() => setStatusFilter("all")}>
                    Show All Images
                  </Button>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-2">No influencers yet</h2>
                  <p className="text-muted-foreground mb-6">
                    Start creating your first AI influencer in the studio.
                  </p>
                  <Button asChild className="gradient-primary neon-glow">
                    <Link href="/studio">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Influencer
                    </Link>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Image preview dialog with share */}
      <Dialog open={selectedImage !== null} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>AI Influencer #{selectedImage}</DialogTitle>
            <DialogDescription>
              Generated on {selectedGeneration?.createdAt ? new Date(selectedGeneration.createdAt).toLocaleDateString() : ""}
            </DialogDescription>
          </DialogHeader>
          
          {selectedGeneration && (
            <div className="space-y-4">
              <div className="relative aspect-[3/4] max-h-[60vh] rounded-lg overflow-hidden bg-card">
                <img
                  src={selectedGeneration.imageUrl}
                  alt={`AI Influencer ${selectedGeneration.id}`}
                  className="w-full h-full object-contain"
                />
                {selectedGeneration.hasWatermark && (
                  <div className="watermark-diagonal">AI Influencer</div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => handleDownload(selectedGeneration.imageUrl, selectedGeneration.id)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download HD
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.open(selectedGeneration.imageUrl, "_blank")}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>

              {/* Social share buttons */}
              <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-medium">Share to Social Media</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleShareSocial("twitter", selectedGeneration.imageUrl)}
                  >
                    <Twitter className="w-4 h-4 mr-2" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleShareSocial("facebook", selectedGeneration.imageUrl)}
                  >
                    <Facebook className="w-4 h-4 mr-2" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleShareSocial("linkedin", selectedGeneration.imageUrl)}
                  >
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(selectedGeneration.imageUrl)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {selectedGeneration.prompt && (
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Prompt used:</p>
                  <p className="text-sm">{selectedGeneration.prompt}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this influencer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The image will be permanently deleted from your gallery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
