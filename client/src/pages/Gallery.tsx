import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Download, Trash2, Loader2, Image as ImageIcon, 
  Plus, ExternalLink, Share2
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
import { useState } from "react";
import { Link } from "wouter";

export default function Gallery() {
  const { user, isAuthenticated, loading } = useAuth();
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: generations, isLoading, refetch } = trpc.generation.list.useQuery(
    { limit: 50, offset: 0 },
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

  const handleShare = async (imageUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AI Influencer",
          text: "Check out my AI-generated influencer!",
          url: imageUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(imageUrl);
      toast.success("Link copied to clipboard!");
    }
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Gallery</h1>
              <p className="text-muted-foreground">
                {generations?.length ?? 0} AI influencers generated
              </p>
            </div>
            <Button asChild className="gradient-primary neon-glow">
              <Link href="/studio">
                <Plus className="w-4 h-4 mr-2" />
                Create New
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : generations && generations.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {generations.map((gen) => (
                <div
                  key={gen.id}
                  className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-card border border-border cursor-pointer"
                  onClick={() => setSelectedImage(gen.id)}
                >
                  <img
                    src={gen.imageUrl}
                    alt={`AI Influencer ${gen.id}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {gen.hasWatermark && (
                    <div className="watermark-diagonal">AI Influencer</div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="flex gap-2">
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
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(gen.imageUrl);
                          }}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
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
            </div>
          )}
        </div>
      </main>

      {/* Image preview dialog */}
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
                  onClick={() => handleShare(selectedGeneration.imageUrl)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.open(selectedGeneration.imageUrl, "_blank")}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
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
