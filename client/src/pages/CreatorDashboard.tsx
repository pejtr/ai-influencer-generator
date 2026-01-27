import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Plus, Sparkles, Users, DollarSign, MessageCircle, 
  TrendingUp, Edit, Trash2, Eye, EyeOff, Image as ImageIcon,
  Heart, Lock
} from "lucide-react";

const PERSONALITY_TYPES = [
  { value: "flirty", label: "Flirty 💋", description: "Playful and romantic" },
  { value: "friendly", label: "Friendly 😊", description: "Warm and approachable" },
  { value: "mysterious", label: "Mysterious 🔮", description: "Intriguing and enigmatic" },
  { value: "playful", label: "Playful 🎭", description: "Fun and entertaining" },
  { value: "sophisticated", label: "Sophisticated 👑", description: "Elegant and refined" },
  { value: "bold", label: "Bold 🔥", description: "Confident and daring" },
];

const CHAT_STYLES = [
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
  { value: "romantic", label: "Romantic" },
  { value: "witty", label: "Witty" },
  { value: "seductive", label: "Seductive" },
];

const RESPONSE_LENGTHS = [
  { value: "short", label: "Short (1-2 sentences)" },
  { value: "medium", label: "Medium (2-4 sentences)" },
  { value: "long", label: "Long (4+ sentences)" },
];

export default function CreatorDashboard() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showContentDialog, setShowContentDialog] = useState(false);
  const [editingPersonality, setEditingPersonality] = useState<number | null>(null);
  
  // Form state for personality
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    avatarUrl: "",
    personalityType: "friendly" as const,
    chatStyle: "casual" as const,
    responseLength: "medium" as const,
    welcomeMessage: "",
    interests: [] as string[],
    customTraits: [] as string[],
  });

  // Form state for content
  const [contentForm, setContentForm] = useState({
    title: "",
    description: "",
    contentType: "image" as const,
    previewUrl: "",
    fullUrl: "",
    price: 9.99,
    personalityId: undefined as number | undefined,
  });

  // Queries
  const { data: personalities, refetch: refetchPersonalities } = trpc.creator.getMyPersonalities.useQuery();
  const { data: content, refetch: refetchContent } = trpc.creator.getMyContent.useQuery();
  const { data: earnings } = trpc.creator.getEarnings.useQuery();
  const { data: stats } = trpc.creator.getConversationStats.useQuery();

  // Mutations
  const createPersonality = trpc.creator.createPersonality.useMutation({
    onSuccess: () => {
      toast.success("AI Companion created! 🎉");
      setShowCreateDialog(false);
      resetForm();
      refetchPersonalities();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updatePersonality = trpc.creator.updatePersonality.useMutation({
    onSuccess: () => {
      toast.success("Companion updated!");
      setEditingPersonality(null);
      resetForm();
      refetchPersonalities();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deletePersonality = trpc.creator.deletePersonality.useMutation({
    onSuccess: () => {
      toast.success("Companion deleted");
      refetchPersonalities();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createContent = trpc.creator.createContent.useMutation({
    onSuccess: () => {
      toast.success("Content created! 🎉");
      setShowContentDialog(false);
      resetContentForm();
      refetchContent();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      bio: "",
      avatarUrl: "",
      personalityType: "friendly",
      chatStyle: "casual",
      responseLength: "medium",
      welcomeMessage: "",
      interests: [],
      customTraits: [],
    });
  };

  const resetContentForm = () => {
    setContentForm({
      title: "",
      description: "",
      contentType: "image",
      previewUrl: "",
      fullUrl: "",
      price: 9.99,
      personalityId: undefined,
    });
  };

  const handleCreatePersonality = () => {
    createPersonality.mutate(formData);
  };

  const handleUpdatePersonality = () => {
    if (!editingPersonality) return;
    updatePersonality.mutate({
      id: editingPersonality,
      ...formData,
    });
  };

  const handleCreateContent = () => {
    createContent.mutate({
      ...contentForm,
      price: contentForm.price,
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
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
            <CardTitle>Creator Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              Sign in to create and manage your AI companions
            </p>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check tier
  if (user.tier === "free") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Upgrade Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              Upgrade to Pro or Creator to create AI companions and start earning
            </p>
            <Button onClick={() => setLocation("/pricing")} className="w-full">
              View Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your AI companions and track earnings
              </p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Companion
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create AI Companion</DialogTitle>
                  <DialogDescription>
                    Design a unique AI personality that will chat with your fans
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Luna"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avatarUrl">Avatar URL</Label>
                      <Input
                        id="avatarUrl"
                        value={formData.avatarUrl}
                        onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="A brief description of your AI companion..."
                      rows={3}
                    />
                  </div>

                  {/* Personality Settings */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Personality Type</Label>
                      <Select
                        value={formData.personalityType}
                        onValueChange={(v) => setFormData({ ...formData, personalityType: v as typeof formData.personalityType })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PERSONALITY_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Chat Style</Label>
                      <Select
                        value={formData.chatStyle}
                        onValueChange={(v) => setFormData({ ...formData, chatStyle: v as typeof formData.chatStyle })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CHAT_STYLES.map((style) => (
                            <SelectItem key={style.value} value={style.value}>
                              {style.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Response Length</Label>
                      <Select
                        value={formData.responseLength}
                        onValueChange={(v) => setFormData({ ...formData, responseLength: v as typeof formData.responseLength })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RESPONSE_LENGTHS.map((len) => (
                            <SelectItem key={len.value} value={len.value}>
                              {len.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="welcomeMessage">Welcome Message</Label>
                    <Textarea
                      id="welcomeMessage"
                      value={formData.welcomeMessage}
                      onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                      placeholder="Hey there! I'm so happy you're here... 💕"
                      rows={2}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreatePersonality}
                    disabled={!formData.name || createPersonality.isPending}
                  >
                    Create Companion
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">
                    ${earnings?.earnings?.totalEarnings || "0.00"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Fans</p>
                  <p className="text-2xl font-bold">
                    {earnings?.earnings?.totalFans || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-500/10">
                  <MessageCircle className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conversations</p>
                  <p className="text-2xl font-bold">
                    {stats?.totalConversations || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-pink-500/10">
                  <Heart className="w-6 h-6 text-pink-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tips Received</p>
                  <p className="text-2xl font-bold">
                    ${earnings?.earnings?.earningsFromTips || "0.00"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="companions">
          <TabsList className="mb-6">
            <TabsTrigger value="companions" className="gap-2">
              <Sparkles className="w-4 h-4" />
              AI Companions
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Exclusive Content
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Companions Tab */}
          <TabsContent value="companions">
            {personalities?.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold mb-2">No Companions Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first AI companion to start chatting with fans
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Companion
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {personalities?.map((p) => (
                  <Card key={p.id}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-14 h-14 border-2 border-primary/20">
                          <AvatarImage src={p.avatarUrl || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {p.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{p.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {p.personalityType}
                          </Badge>
                        </div>
                        <Switch
                          checked={p.isActive}
                          onCheckedChange={(checked) => {
                            updatePersonality.mutate({ id: p.id, isActive: checked });
                          }}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {p.bio || "No bio set"}
                      </p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {p.totalConversations}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ${p.totalRevenue || "0"}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setEditingPersonality(p.id);
                          setFormData({
                            name: p.name,
                            bio: p.bio || "",
                            avatarUrl: p.avatarUrl || "",
                            personalityType: p.personalityType as typeof formData.personalityType,
                            chatStyle: p.chatStyle as typeof formData.chatStyle,
                            responseLength: p.responseLength as typeof formData.responseLength,
                            welcomeMessage: p.welcomeMessage || "",
                            interests: p.interests || [],
                            customTraits: p.customTraits || [],
                          });
                          setShowCreateDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("Delete this companion?")) {
                            deletePersonality.mutate({ id: p.id });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <div className="flex justify-end mb-6">
              <Dialog open={showContentDialog} onOpenChange={setShowContentDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Content
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Exclusive Content</DialogTitle>
                    <DialogDescription>
                      Add content that fans can unlock during conversations
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={contentForm.title}
                        onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                        placeholder="Exclusive Photo Set"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Content Type</Label>
                      <Select
                        value={contentForm.contentType}
                        onValueChange={(v) => setContentForm({ ...contentForm, contentType: v as typeof contentForm.contentType })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="gallery">Gallery</SelectItem>
                          <SelectItem value="message">Message</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Preview URL (blurred)</Label>
                      <Input
                        value={contentForm.previewUrl}
                        onChange={(e) => setContentForm({ ...contentForm, previewUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Full Content URL *</Label>
                      <Input
                        value={contentForm.fullUrl}
                        onChange={(e) => setContentForm({ ...contentForm, fullUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Price ($)</Label>
                      <Input
                        type="number"
                        value={contentForm.price}
                        onChange={(e) => setContentForm({ ...contentForm, price: parseFloat(e.target.value) || 0 })}
                        min={1}
                        max={1000}
                        step={0.01}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowContentDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateContent}
                      disabled={!contentForm.title || !contentForm.fullUrl || createContent.isPending}
                    >
                      Create Content
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {content?.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold mb-2">No Content Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Add exclusive content that fans can unlock during chats
                  </p>
                  <Button onClick={() => setShowContentDialog(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Content
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {content?.map((c) => (
                  <Card key={c.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{c.contentType}</Badge>
                        <span className="text-lg font-bold text-primary">${c.price}</span>
                      </div>
                      <CardTitle className="text-lg">{c.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{c.totalSales || 0} sales</span>
                        <span>${c.totalRevenue || "0"} earned</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Companion Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.personalityStats?.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <span className="font-medium">{p.name}</span>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{p.conversations} chats</span>
                        <span>{p.messages} msgs</span>
                        <span className="text-primary">${p.revenue || "0"}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  {earnings?.recentTips?.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No tips yet
                    </p>
                  ) : (
                    earnings?.recentTips?.map((tip, i) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div>
                          <p className="font-medium">${tip.amount}</p>
                          {tip.message && (
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              "{tip.message}"
                            </p>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(tip.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
