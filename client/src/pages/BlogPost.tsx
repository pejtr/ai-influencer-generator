import { trpc } from "../lib/trpc";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, Calendar, Clock, ArrowLeft, ArrowRight, 
  Share2, Twitter, Facebook, Linkedin, Eye
} from "lucide-react";
import { Streamdown } from "streamdown";
import BlogComments from "../components/BlogComments";

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";

  const { data: article, isLoading, error } = trpc.blog.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const { data: recentArticles } = trpc.blog.getRecent.useQuery({ limit: 3 });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = article?.title || "";

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <span className="font-bold text-lg">AI Influencer</span>
              </Link>
            </div>
          </div>
        </nav>
        <div className="pt-32 pb-16 container mx-auto px-4">
          <div className="max-w-3xl mx-auto animate-pulse space-y-6">
            <div className="h-8 bg-white/10 rounded w-1/4" />
            <div className="h-12 bg-white/10 rounded w-3/4" />
            <div className="aspect-video bg-white/10 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-4 bg-white/10 rounded w-full" />
              <div className="h-4 bg-white/10 rounded w-full" />
              <div className="h-4 bg-white/10 rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-black text-white">
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <span className="font-bold text-lg">AI Influencer</span>
              </Link>
            </div>
          </div>
        </nav>
        <div className="pt-32 pb-16 container mx-auto px-4 text-center">
          <Sparkles className="w-16 h-16 text-white/20 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <p className="text-white/60 mb-8">The article you're looking for doesn't exist.</p>
          <Button asChild className="bg-lime-400 hover:bg-lime-500 text-black">
            <Link href="/blog">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* SEO Meta Tags */}
      {article.metaTitle && (
        <title>{article.metaTitle}</title>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <span className="font-bold text-lg">AI Influencer</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/blog" className="text-sm text-white/70 hover:text-white">
                Blog
              </Link>
              <Link href="/studio">
                <Button className="bg-lime-400 hover:bg-lime-500 text-black font-semibold">
                  LAUNCH APP
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Article Header */}
      <section className="pt-24 pb-8 bg-gradient-to-b from-zinc-900 to-black">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Back Link */}
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-lime-400 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>

            {/* Category */}
            <div className="mb-4">
              <span className="text-sm font-medium text-lime-400 uppercase">
                {article.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              {article.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60 mb-8">
              {article.authorName && (
                <span>By {article.authorName}</span>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(article.publishedAt)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {article.readTimeMinutes} min read
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {article.viewCount} views
              </div>
            </div>

            {/* Share */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/40">Share:</span>
              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-lime-400/20 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-lime-400/20 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={shareLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-lime-400/20 transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {article.featuredImageUrl && (
        <section className="pb-8">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="aspect-video rounded-2xl overflow-hidden">
                <img
                  src={article.featuredImageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Article Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <article className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-p:text-white/80 prose-a:text-lime-400 prose-strong:text-white prose-li:text-white/80">
              <Streamdown>{article.content}</Streamdown>
            </article>

            {/* Tags */}
            {article.tags && (
              <div className="mt-12 pt-8 border-t border-white/10">
                <div className="flex flex-wrap gap-2">
                  {article.tags.split(",").map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-white/5 text-sm text-white/60"
                    >
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Comments & Rating */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <BlogComments articleId={article.id} />
            </div>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      {recentArticles && recentArticles.length > 0 && (
        <section className="py-12 border-t border-white/10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-8">More Articles</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {recentArticles
                  .filter((a) => a.slug !== article.slug)
                  .slice(0, 3)
                  .map((related) => (
                    <Link key={related.id} href={`/blog/${related.slug}`}>
                      <article className="group rounded-xl bg-white/5 border border-white/10 overflow-hidden hover:border-lime-400/50 transition-all">
                        <div className="aspect-video bg-zinc-800 overflow-hidden">
                          {related.featuredImageUrl ? (
                            <img
                              src={related.featuredImageUrl}
                              alt={related.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Sparkles className="w-8 h-8 text-white/20" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium line-clamp-2 group-hover:text-lime-400 transition-colors">
                            {related.title}
                          </h3>
                          <p className="text-xs text-white/40 mt-2">
                            {related.readTimeMinutes} min read
                          </p>
                        </div>
                      </article>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-gradient-to-b from-black to-zinc-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Create Your AI Influencer?
          </h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto">
            Start generating stunning AI influencers today. No design skills required.
          </p>
          <Button asChild size="lg" className="bg-lime-400 hover:bg-lime-500 text-black font-semibold">
            <Link href="/studio">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="container mx-auto px-4 text-center text-sm text-white/40">
          © 2026 AI Influencer Generator. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
