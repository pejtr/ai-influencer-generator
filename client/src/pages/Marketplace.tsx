import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { 
  Search, 
  Filter, 
  Users, 
  Heart, 
  MessageCircle, 
  Star,
  TrendingUp,
  Clock,
  DollarSign,
  SlidersHorizontal,
  X
} from "lucide-react";

// Categories for filtering
const CATEGORIES = [
  { id: "lifestyle", label: "Lifestyle", icon: "🌟" },
  { id: "fashion", label: "Fashion", icon: "👗" },
  { id: "fitness", label: "Fitness", icon: "💪" },
  { id: "beauty", label: "Beauty", icon: "💄" },
  { id: "travel", label: "Travel", icon: "✈️" },
  { id: "gaming", label: "Gaming", icon: "🎮" },
  { id: "art", label: "Art", icon: "🎨" },
  { id: "music", label: "Music", icon: "🎵" },
];

// Follower ranges
const FOLLOWER_RANGES = [
  { id: "0-100", label: "0 - 100", min: 0, max: 100 },
  { id: "100-1k", label: "100 - 1K", min: 100, max: 1000 },
  { id: "1k-10k", label: "1K - 10K", min: 1000, max: 10000 },
  { id: "10k+", label: "10K+", min: 10000, max: Infinity },
];

// Price ranges
const PRICE_RANGES = [
  { id: "free", label: "Free", min: 0, max: 0 },
  { id: "1-10", label: "$1 - $10", min: 1, max: 10 },
  { id: "10-50", label: "$10 - $50", min: 10, max: 50 },
  { id: "50+", label: "$50+", min: 50, max: Infinity },
];

// Sort options
const SORT_OPTIONS = [
  { id: "popularity", label: "Most Popular", icon: TrendingUp },
  { id: "newest", label: "Newest", icon: Clock },
  { id: "price-low", label: "Price: Low to High", icon: DollarSign },
  { id: "price-high", label: "Price: High to Low", icon: DollarSign },
  { id: "rating", label: "Highest Rated", icon: Star },
];

// Mock influencer data
const MOCK_INFLUENCERS = [
  { id: 1, name: "Luna Starlight", category: "lifestyle", followers: 15200, rating: 4.9, avgPrice: 25, avatar: "🌙", bio: "Living my best digital life", isVerified: true },
  { id: 2, name: "Sophia Grace", category: "fashion", followers: 8500, rating: 4.8, avgPrice: 35, avatar: "👑", bio: "Fashion forward AI model", isVerified: true },
  { id: 3, name: "Emma Fitness", category: "fitness", followers: 12000, rating: 4.7, avgPrice: 15, avatar: "💪", bio: "Your virtual fitness coach", isVerified: false },
  { id: 4, name: "Aria Beauty", category: "beauty", followers: 6800, rating: 4.6, avgPrice: 20, avatar: "💋", bio: "Beauty tips and tutorials", isVerified: true },
  { id: 5, name: "Maya Travels", category: "travel", followers: 9200, rating: 4.8, avgPrice: 30, avatar: "🌍", bio: "Exploring the world virtually", isVerified: false },
  { id: 6, name: "Pixel Princess", category: "gaming", followers: 18500, rating: 4.9, avgPrice: 10, avatar: "🎮", bio: "Gaming content creator", isVerified: true },
  { id: 7, name: "Aurora Art", category: "art", followers: 4200, rating: 4.5, avgPrice: 45, avatar: "🎨", bio: "Digital art and creativity", isVerified: false },
  { id: 8, name: "Melody Vibes", category: "music", followers: 7800, rating: 4.7, avgPrice: 0, avatar: "🎵", bio: "Music and good vibes", isVerified: true },
  { id: 9, name: "Zara Luxe", category: "fashion", followers: 22000, rating: 4.9, avgPrice: 55, avatar: "💎", bio: "Luxury lifestyle content", isVerified: true },
  { id: 10, name: "Jade Wellness", category: "lifestyle", followers: 5500, rating: 4.4, avgPrice: 12, avatar: "🧘", bio: "Mindfulness and wellness", isVerified: false },
  { id: 11, name: "Nova Gaming", category: "gaming", followers: 31000, rating: 4.8, avgPrice: 8, avatar: "⚡", bio: "Pro gamer vibes", isVerified: true },
  { id: 12, name: "Bella Rose", category: "beauty", followers: 14500, rating: 4.7, avgPrice: 28, avatar: "🌹", bio: "Beauty and skincare", isVerified: true },
];

export default function Marketplace() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFollowerRanges, setSelectedFollowerRanges] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("popularity");
  const [showFilters, setShowFilters] = useState(false);

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Toggle follower range selection
  const toggleFollowerRange = (rangeId: string) => {
    setSelectedFollowerRanges(prev => 
      prev.includes(rangeId) 
        ? prev.filter(r => r !== rangeId)
        : [...prev, rangeId]
    );
  };

  // Toggle price range selection
  const togglePriceRange = (rangeId: string) => {
    setSelectedPriceRanges(prev => 
      prev.includes(rangeId) 
        ? prev.filter(r => r !== rangeId)
        : [...prev, rangeId]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedFollowerRanges([]);
    setSelectedPriceRanges([]);
    setSearchQuery("");
    setSortBy("popularity");
  };

  // Count active filters
  const activeFilterCount = selectedCategories.length + selectedFollowerRanges.length + selectedPriceRanges.length;

  // Filter and sort influencers
  const filteredInfluencers = useMemo(() => {
    let result = [...MOCK_INFLUENCERS];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(inf => 
        inf.name.toLowerCase().includes(query) || 
        inf.bio.toLowerCase().includes(query) ||
        inf.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter(inf => selectedCategories.includes(inf.category));
    }

    // Follower range filter
    if (selectedFollowerRanges.length > 0) {
      result = result.filter(inf => {
        return selectedFollowerRanges.some(rangeId => {
          const range = FOLLOWER_RANGES.find(r => r.id === rangeId);
          if (!range) return false;
          return inf.followers >= range.min && inf.followers <= range.max;
        });
      });
    }

    // Price range filter
    if (selectedPriceRanges.length > 0) {
      result = result.filter(inf => {
        return selectedPriceRanges.some(rangeId => {
          const range = PRICE_RANGES.find(r => r.id === rangeId);
          if (!range) return false;
          if (rangeId === "free") return inf.avgPrice === 0;
          return inf.avgPrice >= range.min && inf.avgPrice <= range.max;
        });
      });
    }

    // Sort
    switch (sortBy) {
      case "popularity":
        result.sort((a, b) => b.followers - a.followers);
        break;
      case "newest":
        result.sort((a, b) => b.id - a.id);
        break;
      case "price-low":
        result.sort((a, b) => a.avgPrice - b.avgPrice);
        break;
      case "price-high":
        result.sort((a, b) => b.avgPrice - a.avgPrice);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
    }

    return result;
  }, [searchQuery, selectedCategories, selectedFollowerRanges, selectedPriceRanges, sortBy]);

  // Format follower count
  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-2">Influencer Marketplace</h1>
          <p className="text-muted-foreground">
            Discover and connect with AI influencers created by our community
          </p>
        </div>
      </div>

      <div className="container py-6">
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search influencers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={option.id} value={option.id}>
                  <div className="flex items-center gap-2">
                    <option.icon className="w-4 h-4" />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter Button (Mobile) */}
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" className="sm:hidden">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-2" variant="secondary">{activeFilterCount}</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Refine your search results
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Categories */}
                <div>
                  <h4 className="font-medium mb-3">Categories</h4>
                  <div className="space-y-2">
                    {CATEGORIES.map(cat => (
                      <div key={cat.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`cat-${cat.id}`}
                          checked={selectedCategories.includes(cat.id)}
                          onCheckedChange={() => toggleCategory(cat.id)}
                        />
                        <Label htmlFor={`cat-${cat.id}`} className="flex items-center gap-2 cursor-pointer">
                          <span>{cat.icon}</span>
                          {cat.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Followers */}
                <div>
                  <h4 className="font-medium mb-3">Followers</h4>
                  <div className="space-y-2">
                    {FOLLOWER_RANGES.map(range => (
                      <div key={range.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`followers-${range.id}`}
                          checked={selectedFollowerRanges.includes(range.id)}
                          onCheckedChange={() => toggleFollowerRange(range.id)}
                        />
                        <Label htmlFor={`followers-${range.id}`} className="cursor-pointer">
                          {range.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Price */}
                <div>
                  <h4 className="font-medium mb-3">Content Price</h4>
                  <div className="space-y-2">
                    {PRICE_RANGES.map(range => (
                      <div key={range.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`price-${range.id}`}
                          checked={selectedPriceRanges.includes(range.id)}
                          onCheckedChange={() => togglePriceRange(range.id)}
                        />
                        <Label htmlFor={`price-${range.id}`} className="cursor-pointer">
                          {range.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <Button variant="outline" className="w-full" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Clear All Filters
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-6">
          {/* Desktop Sidebar Filters */}
          <div className="hidden sm:block w-64 flex-shrink-0">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Filters</CardTitle>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Categories */}
                <div>
                  <h4 className="font-medium mb-3 text-sm">Categories</h4>
                  <div className="space-y-2">
                    {CATEGORIES.map(cat => (
                      <div key={cat.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`desktop-cat-${cat.id}`}
                          checked={selectedCategories.includes(cat.id)}
                          onCheckedChange={() => toggleCategory(cat.id)}
                        />
                        <Label htmlFor={`desktop-cat-${cat.id}`} className="flex items-center gap-2 cursor-pointer text-sm">
                          <span>{cat.icon}</span>
                          {cat.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Followers */}
                <div>
                  <h4 className="font-medium mb-3 text-sm">Followers</h4>
                  <div className="space-y-2">
                    {FOLLOWER_RANGES.map(range => (
                      <div key={range.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`desktop-followers-${range.id}`}
                          checked={selectedFollowerRanges.includes(range.id)}
                          onCheckedChange={() => toggleFollowerRange(range.id)}
                        />
                        <Label htmlFor={`desktop-followers-${range.id}`} className="cursor-pointer text-sm">
                          {range.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Price */}
                <div>
                  <h4 className="font-medium mb-3 text-sm">Content Price</h4>
                  <div className="space-y-2">
                    {PRICE_RANGES.map(range => (
                      <div key={range.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`desktop-price-${range.id}`}
                          checked={selectedPriceRanges.includes(range.id)}
                          onCheckedChange={() => togglePriceRange(range.id)}
                        />
                        <Label htmlFor={`desktop-price-${range.id}`} className="cursor-pointer text-sm">
                          {range.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Active Filters */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedCategories.map(catId => {
                  const cat = CATEGORIES.find(c => c.id === catId);
                  return cat ? (
                    <Badge key={catId} variant="secondary" className="cursor-pointer" onClick={() => toggleCategory(catId)}>
                      {cat.icon} {cat.label}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ) : null;
                })}
                {selectedFollowerRanges.map(rangeId => {
                  const range = FOLLOWER_RANGES.find(r => r.id === rangeId);
                  return range ? (
                    <Badge key={rangeId} variant="secondary" className="cursor-pointer" onClick={() => toggleFollowerRange(rangeId)}>
                      <Users className="w-3 h-3 mr-1" />
                      {range.label}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ) : null;
                })}
                {selectedPriceRanges.map(rangeId => {
                  const range = PRICE_RANGES.find(r => r.id === rangeId);
                  return range ? (
                    <Badge key={rangeId} variant="secondary" className="cursor-pointer" onClick={() => togglePriceRange(rangeId)}>
                      <DollarSign className="w-3 h-3 mr-1" />
                      {range.label}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ) : null;
                })}
              </div>
            )}

            {/* Results Count */}
            <p className="text-sm text-muted-foreground mb-4">
              {filteredInfluencers.length} influencer{filteredInfluencers.length !== 1 ? 's' : ''} found
            </p>

            {/* Influencer Grid */}
            {filteredInfluencers.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-medium mb-2">No influencers found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search query
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInfluencers.map(influencer => (
                  <Card key={influencer.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-3xl flex-shrink-0">
                          {influencer.avatar}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{influencer.name}</h3>
                            {influencer.isVerified && (
                              <Badge variant="secondary" className="text-xs">✓</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{influencer.bio}</p>
                          
                          {/* Stats */}
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Users className="w-3 h-3" />
                              {formatFollowers(influencer.followers)}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Star className="w-3 h-3 text-yellow-500" />
                              {influencer.rating}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <DollarSign className="w-3 h-3" />
                              {influencer.avgPrice === 0 ? 'Free' : `$${influencer.avgPrice}`}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Category Badge */}
                      <div className="mt-3">
                        <Badge variant="outline" className="text-xs">
                          {CATEGORIES.find(c => c.id === influencer.category)?.icon}{' '}
                          {CATEGORIES.find(c => c.id === influencer.category)?.label}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link href={`/chat/${influencer.id}`}>
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Chat
                          </Link>
                        </Button>
                        <Button size="sm" className="flex-1">
                          <Heart className="w-4 h-4 mr-1" />
                          Follow
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
