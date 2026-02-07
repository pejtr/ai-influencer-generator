import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Sparkles, Search, Calendar, Clock, ArrowRight, 
  ChevronLeft, ChevronRight, Tag, Eye
} from "lucide-react";

export default function Blog() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 6;

  const { data: articlesData, isLoading } = trpc.blog.list.useQuery({
    category,
    limit,
    offset: page * limit,
  });

  const { data: categories } = trpc.blog.getCategories.useQuery();
  const { data: recentArticles } = trpc.blog.getRecent.useQuery({ limit: 5 });
  const { data: searchResults, isLoading: isSearching } = trpc.blog.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 2 }
  );

  const articles = searchQuery.length > 2 ? searchResults : articlesData?.articles;
  const total = articlesData?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
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
              <Link href="/studio">
                <Button className="bg-lime-400 hover:bg-lime-500 text-black font-semibold">
                  LAUNCH APP
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-b from-zinc-900 to-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              AI Influencer <span className="text-lime-400">Blog</span>
            </h1>
            <p className="text-lg text-white/60 mb-8">
              Learn how to create, grow, and monetize your AI influencer. 
              Tutorials, guides, and industry insights.
            </p>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 h-12"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-6 border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant={!category ? "default" : "outline"}
              size="sm"
              onClick={() => { setCategory(undefined); setPage(0); }}
              className={!category ? "bg-lime-400 text-black hover:bg-lime-500" : "border-white/20 text-white/70"}
            >
              All
            </Button>
            {categories?.map((cat) => (
              <Button
                key={cat}
                variant={category === cat ? "default" : "outline"}
                size="sm"
                onClick={() => { setCategory(cat); setPage(0); }}
                className={category === cat ? "bg-lime-400 text-black hover:bg-lime-500" : "border-white/20 text-white/70"}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Articles Grid */}
            <div className="lg:col-span-2">
              {isLoading || isSearching ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-2xl bg-white/5 animate-pulse">
                      <div className="aspect-video bg-white/10" />
                      <div className="p-6 space-y-3">
                        <div className="h-4 bg-white/10 rounded w-1/4" />
                        <div className="h-6 bg-white/10 rounded w-3/4" />
                        <div className="h-4 bg-white/10 rounded w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : articles && articles.length > 0 ? (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
                    {articles.map((article) => (
                      <Link key={article.id} href={`/blog/${article.slug}`}>
                        <article className="group rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-lime-400/50 transition-all">
                          {/* Featured Image */}
                          <div className="aspect-video bg-zinc-800 overflow-hidden">
                            {article.featuredImageUrl ? (
                              <img loading="lazy"
                                src={article.featuredImageUrl}
                                alt={article.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Sparkles className="w-12 h-12 text-white/20" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-6">
                            {/* Category */}
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs font-medium text-lime-400 uppercase">
                                {article.category}
                              </span>
                            </div>

                            {/* Title */}
                            <h2 className="text-xl font-semibold mb-2 group-hover:text-lime-400 transition-colors line-clamp-2">
                              {article.title}
                            </h2>

                            {/* Excerpt */}
                            <p className="text-white/60 text-sm mb-4 line-clamp-2">
                              {article.excerpt}
                            </p>

                            {/* Meta */}
                            <div className="flex items-center gap-4 text-xs text-white/40">
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
                                {article.viewCount}
                              </div>
                            </div>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && !searchQuery && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="border-white/20"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-white/60">
                        Page {page + 1} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                        disabled={page >= totalPages - 1}
                        className="border-white/20"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60">No articles found</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Recent Articles */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <h3 className="font-semibold mb-4">Recent Articles</h3>
                <div className="space-y-4">
                  {recentArticles?.map((article) => (
                    <Link key={article.id} href={`/blog/${article.slug}`}>
                      <div className="flex gap-3 group">
                        <div className="w-16 h-16 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0">
                          {article.featuredImageUrl ? (
                            <img loading="lazy"
                              src={article.featuredImageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Sparkles className="w-6 h-6 text-white/20" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium line-clamp-2 group-hover:text-lime-400 transition-colors">
                            {article.title}
                          </h4>
                          <p className="text-xs text-white/40 mt-1">
                            {article.readTimeMinutes} min read
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="rounded-2xl bg-gradient-to-br from-lime-400/20 to-lime-600/20 border border-lime-400/30 p-6 text-center">
                <h3 className="font-semibold mb-2">Ready to Create?</h3>
                <p className="text-sm text-white/60 mb-4">
                  Start generating AI influencers today
                </p>
                <Button asChild className="bg-lime-400 hover:bg-lime-500 text-black w-full">
                  <Link href="/studio">
                    Get Started Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
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
