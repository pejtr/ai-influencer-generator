import { useState } from "react";
import { trpc } from "../lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Star, MessageCircle, Send, User, Reply, LogIn } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

interface BlogCommentsProps {
  articleId: number;
}

function StarRating({
  rating,
  onRate,
  size = "md",
  interactive = false,
}: {
  rating: number;
  onRate?: (r: number) => void;
  size?: "sm" | "md";
  interactive?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const starSize = size === "sm" ? "w-4 h-4" : "w-6 h-6";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onRate?.(star)}
        >
          <Star
            className={`${starSize} ${
              star <= (hover || rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-white/20"
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function BlogComments({ articleId }: BlogCommentsProps) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: comments, refetch: refetchComments } = trpc.blog.getComments.useQuery(
    { articleId },
    { enabled: !!articleId }
  );

  const { data: ratingStats, refetch: refetchRating } = trpc.blog.getRatingStats.useQuery(
    { articleId },
    { enabled: !!articleId }
  );

  const { data: userRating } = trpc.blog.getUserRating.useQuery(
    { articleId },
    { enabled: !!articleId && !!user }
  );

  const addCommentMutation = trpc.blog.addComment.useMutation({
    onSuccess: () => {
      setCommentText("");
      setReplyTo(null);
      setReplyText("");
      refetchComments();
      toast.success("Comment posted!");
    },
    onError: () => {
      toast.error("Failed to post comment");
    },
  });

  const submitRatingMutation = trpc.blog.submitRating.useMutation({
    onSuccess: () => {
      refetchRating();
      toast.success("Rating submitted!");
    },
    onError: () => {
      toast.error("Failed to submit rating");
    },
  });

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate({ articleId, content: commentText.trim() });
  };

  const handleSubmitReply = (parentId: number) => {
    if (!replyText.trim()) return;
    addCommentMutation.mutate({ articleId, content: replyText.trim(), parentId });
  };

  const handleRate = (rating: number) => {
    if (!user) {
      toast.error("Please sign in to rate");
      return;
    }
    submitRatingMutation.mutate({ articleId, rating });
  };

  const parentComments = comments?.filter((c) => !c.parent_id) || [];
  const getReplies = (parentId: number) =>
    comments?.filter((c) => c.parent_id === parentId) || [];

  return (
    <div className="space-y-8">
      {/* Rating Section */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          Rate This Article
        </h3>
        <div className="flex items-center gap-6">
          <div>
            <StarRating
              rating={userRating ?? 0}
              onRate={handleRate}
              interactive={!!user}
            />
            {!user && (
              <p className="text-xs text-white/40 mt-1">
                <a href={getLoginUrl()} className="text-blue-400 hover:underline">
                  Sign in
                </a>{" "}
                to rate
              </p>
            )}
          </div>
          {ratingStats && ratingStats.totalRatings > 0 && (
            <div className="flex items-center gap-2 text-sm text-white/60">
              <span className="text-2xl font-bold text-white">
                {ratingStats.averageRating.toFixed(1)}
              </span>
              <div>
                <StarRating rating={Math.round(ratingStats.averageRating)} size="sm" />
                <span className="text-xs">{ratingStats.totalRatings} ratings</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Comments
          {parentComments.length > 0 && (
            <span className="text-sm font-normal text-white/40">
              ({comments?.length || 0})
            </span>
          )}
        </h3>

        {/* Comment Form */}
        {user ? (
          <div className="mb-8">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 resize-none min-h-[80px]"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || addCommentMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    size="sm"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-sm text-white/60 mb-3">Sign in to join the discussion</p>
            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <a href={getLoginUrl()}>
                <LogIn className="w-4 h-4 mr-1" />
                Sign In
              </a>
            </Button>
          </div>
        )}

        {/* Comments List */}
        {parentComments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40">No comments yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {parentComments.map((comment) => {
              const replies = getReplies(comment.id);
              return (
                <div key={comment.id} className="space-y-4">
                  {/* Parent Comment */}
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white/40" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{comment.user_name}</span>
                        <span className="text-xs text-white/30">
                          {timeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {comment.content}
                      </p>
                      {user && (
                        <button
                          onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                          className="text-xs text-white/40 hover:text-blue-400 mt-2 flex items-center gap-1 transition-colors"
                        >
                          <Reply className="w-3 h-3" />
                          Reply
                        </button>
                      )}

                      {/* Reply Form */}
                      {replyTo === comment.id && (
                        <div className="mt-3 flex gap-2">
                          <input
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
                          />
                          <Button
                            onClick={() => handleSubmitReply(comment.id)}
                            disabled={!replyText.trim() || addCommentMutation.isPending}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Send className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Replies */}
                  {replies.length > 0 && (
                    <div className="ml-12 space-y-4 border-l-2 border-white/5 pl-4">
                      {replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-white/40" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{reply.user_name}</span>
                              <span className="text-xs text-white/30">
                                {timeAgo(reply.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-white/70 leading-relaxed">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
