import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Lock, Sparkles, Zap, Image, CheckCircle, XCircle, Clock, Play } from "lucide-react";
import { Link } from "wouter";

const CHARACTER_TYPES = [
  { value: "realistic", label: "Realistic Human" },
  { value: "anime", label: "Anime Style" },
  { value: "3d", label: "3D Rendered" },
  { value: "artistic", label: "Artistic/Painterly" },
];

const GENDERS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non-binary", label: "Non-binary" },
];

const ETHNICITIES = [
  { value: "caucasian", label: "Caucasian" },
  { value: "asian", label: "Asian" },
  { value: "african", label: "African" },
  { value: "hispanic", label: "Hispanic" },
  { value: "middle-eastern", label: "Middle Eastern" },
  { value: "mixed", label: "Mixed" },
];

export default function BatchGeneration() {
  const { user, loading: authLoading } = useAuth();
  
  // Form state
  const [totalImages, setTotalImages] = useState(10);
  const [basePrompt, setBasePrompt] = useState("");
  const [characterType, setCharacterType] = useState("realistic");
  const [gender, setGender] = useState("female");
  const [ethnicity, setEthnicity] = useState("caucasian");
  const [eyeColor, setEyeColor] = useState("brown");
  const [skinTone, setSkinTone] = useState("medium");
  const [skinCondition, setSkinCondition] = useState("flawless");
  const [age, setAge] = useState(25);

  // Check if user has CREATOR tier (batch generation access)
  const isCreator = user?.tier === "creator";
  const userCredits = user?.credits ?? 0;

  // Fetch batch jobs
  const { data: batchJobs, isLoading: jobsLoading, refetch: refetchJobs } = trpc.batch.list.useQuery(
    undefined,
    { enabled: isCreator }
  );

  // Create batch mutation
  const createBatchMutation = trpc.batch.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Batch job created! Job ID: ${data.jobId}`);
      refetchJobs();
      // Reset form
      setBasePrompt("");
      setTotalImages(10);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreateBatch = () => {
    if (!basePrompt || basePrompt.length < 10) {
      toast.error("Please enter a base prompt (at least 10 characters)");
      return;
    }

    if (totalImages > userCredits) {
      toast.error(`Not enough credits. You need ${totalImages} but have ${userCredits}`);
      return;
    }

    createBatchMutation.mutate({
      totalImages,
      basePrompt,
      characterSettings: {
        type: characterType,
        gender,
        ethnicity,
        eyeColor,
        skinTone,
        skinCondition,
        age,
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
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
            <h1 className="text-4xl font-bold mb-4">Batch Generation</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Generate up to 30 AI influencer images at once with consistent character settings.
              Perfect for building a content library quickly.
            </p>
            
            <Card className="bg-card/50 border-[#c8ff00]/20 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#c8ff00]" />
                  VIP Feature
                </CardTitle>
                <CardDescription>
                  Upgrade to VIP to unlock Batch Generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-left space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#c8ff00]" />
                    <span>Generate up to 30 images at once</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-[#c8ff00]" />
                    <span>Consistent character across all images</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#c8ff00]" />
                    <span>Background processing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#c8ff00]" />
                    <span>1000 credits/month included</span>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="w-8 h-8 text-[#c8ff00]" />
            Batch Generation
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate multiple images with consistent character settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create New Batch */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Create New Batch</CardTitle>
              <CardDescription>
                Configure your batch generation settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Number of Images */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Number of Images</Label>
                  <span className="text-sm text-muted-foreground">
                    {totalImages} images ({totalImages} credits)
                  </span>
                </div>
                <Slider
                  value={[totalImages]}
                  onValueChange={(value) => setTotalImages(value[0])}
                  min={1}
                  max={30}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1</span>
                  <span>30</span>
                </div>
              </div>

              {/* Base Prompt */}
              <div>
                <Label htmlFor="basePrompt">Base Prompt</Label>
                <Textarea
                  id="basePrompt"
                  value={basePrompt}
                  onChange={(e) => setBasePrompt(e.target.value)}
                  placeholder="Describe the scene, pose, clothing, etc. The AI will generate variations..."
                  className="mt-1"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 10 characters. Each image will have slight variations.
                </p>
              </div>

              {/* Character Settings Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Character Type</Label>
                  <Select value={characterType} onValueChange={setCharacterType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHARACTER_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Ethnicity</Label>
                  <Select value={ethnicity} onValueChange={setEthnicity}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ETHNICITIES.map((e) => (
                        <SelectItem key={e.value} value={e.value}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Age</Label>
                  <Input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 25)}
                    min={18}
                    max={80}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Credits Info */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Your Credits</span>
                  <span className="font-bold">{userCredits}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm">Required</span>
                  <span className={`font-bold ${totalImages > userCredits ? "text-red-500" : "text-green-500"}`}>
                    {totalImages}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleCreateBatch}
                disabled={createBatchMutation.isPending || totalImages > userCredits || basePrompt.length < 10}
                className="w-full bg-[#c8ff00] text-black hover:bg-[#a8d600]"
              >
                {createBatchMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Batch...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Batch Generation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Batch Jobs List */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Recent Batch Jobs</CardTitle>
              <CardDescription>
                Track your batch generation progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#c8ff00]" />
                </div>
              ) : batchJobs && batchJobs.length > 0 ? (
                <div className="space-y-4">
                  {batchJobs.map((job) => {
                    const progress = job.totalImages > 0
                      ? Math.round(((job.completedImages + job.failedImages) / job.totalImages) * 100)
                      : 0;
                    
                    return (
                      <div
                        key={job.id}
                        className="p-4 rounded-lg bg-muted/30 border border-border/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Batch #{job.id}</span>
                          {getStatusBadge(job.status)}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {job.basePrompt}
                        </p>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span>
                              {job.completedImages}/{job.totalImages} completed
                              {job.failedImages > 0 && (
                                <span className="text-red-500 ml-1">
                                  ({job.failedImages} failed)
                                </span>
                              )}
                            </span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                          <span>
                            Created: {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                          {job.completedAt && (
                            <span>
                              Completed: {new Date(job.completedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No batch jobs yet</p>
                  <p className="text-sm mt-1">Create your first batch to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
