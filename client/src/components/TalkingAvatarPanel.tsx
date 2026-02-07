import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Mic, Play, Loader2, Volume2, Download, Film,
  Sparkles, Globe, Smile
} from "lucide-react";

// Voice presets
const VOICE_PRESETS = [
  { id: "Charming_Lady", name: "Charming Lady", gender: "Female", style: "Warm & Engaging" },
  { id: "audiobook_female_1", name: "Storyteller", gender: "Female", style: "Professional Narrator" },
  { id: "cute_boy", name: "Cute Boy", gender: "Male", style: "Youthful & Energetic" },
  { id: "male-qn-qingse", name: "Gentle Male", gender: "Male", style: "Calm & Soothing" },
  { id: "narrator_female_1", name: "News Anchor", gender: "Female", style: "Clear & Authoritative" },
  { id: "narrator_male_1", name: "Deep Voice", gender: "Male", style: "Deep & Commanding" },
  { id: "friendly_female", name: "Friendly Girl", gender: "Female", style: "Casual & Fun" },
  { id: "professional_male", name: "Business Pro", gender: "Male", style: "Corporate & Polished" },
];

const EMOTIONS = [
  { id: "happy", label: "Happy", emoji: "😊" },
  { id: "neutral", label: "Neutral", emoji: "😐" },
  { id: "sad", label: "Sad", emoji: "😢" },
  { id: "angry", label: "Angry", emoji: "😠" },
  { id: "surprised", label: "Surprised", emoji: "😲" },
  { id: "fearful", label: "Fearful", emoji: "😨" },
];

const LANGUAGES = [
  { code: "English", label: "English" },
  { code: "Chinese", label: "Chinese" },
  { code: "Spanish", label: "Spanish" },
  { code: "French", label: "French" },
  { code: "German", label: "German" },
  { code: "Japanese", label: "Japanese" },
  { code: "Korean", label: "Korean" },
  { code: "Czech", label: "Czech" },
  { code: "Portuguese", label: "Portuguese" },
  { code: "Italian", label: "Italian" },
  { code: "Russian", label: "Russian" },
  { code: "Arabic", label: "Arabic" },
  { code: "Hindi", label: "Hindi" },
];

// Script templates
const SCRIPT_TEMPLATES = [
  {
    label: "Product Review",
    text: "Hey everyone! I just tried this amazing product and I have to share my honest review with you. Let me tell you what I loved about it and what could be improved.",
  },
  {
    label: "Daily Vlog",
    text: "Good morning beautiful people! Today I'm taking you through my daily routine. Let's start with my morning skincare and then head out for some adventures.",
  },
  {
    label: "Brand Promo",
    text: "I'm so excited to partner with this incredible brand! They've been kind enough to send me their latest collection, and I can't wait to show you everything.",
  },
  {
    label: "Tutorial",
    text: "In today's tutorial, I'm going to show you step by step how to achieve this look. It's actually easier than you think, so let's get started!",
  },
  {
    label: "Motivational",
    text: "Remember, every day is a new opportunity to become the best version of yourself. Don't let anyone tell you that you can't achieve your dreams.",
  },
];

interface TalkingAvatarPanelProps {
  imageUrl?: string;
  characterName?: string;
}

export default function TalkingAvatarPanel({ imageUrl, characterName }: TalkingAvatarPanelProps) {
  const [script, setScript] = useState("");
  const [voiceId, setVoiceId] = useState("Charming_Lady");
  const [emotion, setEmotion] = useState("happy");
  const [speed, setSpeed] = useState([1.0]);
  const [language, setLanguage] = useState("English");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  const talkingAvatarMutation = trpc.talkingAvatar.generateAudio.useMutation({
    onSuccess: (data) => {
      setAudioUrl(data.audioUrl);
      toast.success("Audio generated successfully!");
      setIsGenerating(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate audio");
      setIsGenerating(false);
    },
  });

  const videoMutation = trpc.talkingAvatar.generateVideo.useMutation({
    onSuccess: (data) => {
      toast.success("Video generation started! Check your gallery for results.");
      setIsGeneratingVideo(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate video");
      setIsGeneratingVideo(false);
    },
  });

  const handleGenerateAudio = () => {
    if (!script.trim()) {
      toast.error("Please enter a script first");
      return;
    }
    setIsGenerating(true);
    talkingAvatarMutation.mutate({
      script: script.trim(),
      voiceId,
      emotion: emotion as any,
      speed: speed[0],
      language,
    });
  };

  const handleGenerateVideo = () => {
    if (!imageUrl) {
      toast.error("Please generate a character image first");
      return;
    }
    if (!script.trim()) {
      toast.error("Please enter a script first");
      return;
    }
    setIsGeneratingVideo(true);
    videoMutation.mutate({
      imageUrl,
      script: script.trim(),
    });
  };

  const selectedVoice = VOICE_PRESETS.find(v => v.id === voiceId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
          <Mic className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Talking Avatar</h3>
          <p className="text-xs text-muted-foreground">Generate speech & video from script</p>
        </div>
      </div>

      {/* Script Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Script</Label>
          <span className="text-xs text-muted-foreground">{script.length}/500</span>
        </div>
        <Textarea
          value={script}
          onChange={(e) => setScript(e.target.value.slice(0, 500))}
          placeholder="Enter what your AI influencer should say..."
          className="min-h-[100px] text-sm resize-none"
        />
        {/* Script Templates */}
        <div className="flex flex-wrap gap-1">
          {SCRIPT_TEMPLATES.map((template) => (
            <button
              key={template.label}
              onClick={() => setScript(template.text)}
              className="px-2 py-1 rounded-md bg-secondary/50 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {template.label}
            </button>
          ))}
        </div>
      </div>

      {/* Voice Selection */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Voice</Label>
        <Select value={voiceId} onValueChange={setVoiceId}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Select voice" />
          </SelectTrigger>
          <SelectContent>
            {VOICE_PRESETS.map((voice) => (
              <SelectItem key={voice.id} value={voice.id}>
                <span className="flex items-center gap-2">
                  <span>{voice.name}</span>
                  <span className="text-xs text-muted-foreground">({voice.gender} - {voice.style})</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedVoice && (
          <p className="text-xs text-muted-foreground">
            {selectedVoice.style} voice - {selectedVoice.gender}
          </p>
        )}
      </div>

      {/* Emotion */}
      <div className="space-y-2">
        <Label className="text-xs font-medium flex items-center gap-1">
          <Smile className="w-3 h-3" /> Emotion
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {EMOTIONS.map((em) => (
            <button
              key={em.id}
              onClick={() => setEmotion(em.id)}
              className={`px-2 py-2 rounded-lg border text-xs transition-all ${
                emotion === em.id
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-border bg-card/50 text-muted-foreground hover:border-border/80"
              }`}
            >
              <span className="text-base">{em.emoji}</span>
              <span className="block mt-1">{em.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="space-y-2">
        <Label className="text-xs font-medium flex items-center gap-1">
          <Globe className="w-3 h-3" /> Language
        </Label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Speed */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Speed</Label>
          <span className="text-xs text-muted-foreground">{speed[0].toFixed(1)}x</span>
        </div>
        <Slider
          value={speed}
          onValueChange={setSpeed}
          min={0.5}
          max={2.0}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0.5x Slow</span>
          <span>2.0x Fast</span>
        </div>
      </div>

      {/* Generate Audio Button */}
      <Button
        onClick={handleGenerateAudio}
        disabled={isGenerating || !script.trim()}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating Audio...
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4" />
            Generate Audio (2 credits)
          </>
        )}
      </Button>

      {/* Audio Preview */}
      {audioUrl && (
        <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-500/20 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-purple-400">
            <Volume2 className="w-4 h-4" />
            Audio Generated
          </div>
          <audio controls className="w-full h-8" src={audioUrl}>
            Your browser does not support the audio element.
          </audio>
          <div className="flex gap-2">
            <a href={audioUrl} download className="flex-1">
              <Button variant="outline" size="sm" className="w-full gap-1 text-xs">
                <Download className="w-3 h-3" />
                Download MP3
              </Button>
            </a>
          </div>
        </div>
      )}

      {/* Generate Video Button */}
      {imageUrl && (
        <Button
          onClick={handleGenerateVideo}
          disabled={isGeneratingVideo || !script.trim()}
          variant="outline"
          className="w-full gap-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
        >
          {isGeneratingVideo ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Video...
            </>
          ) : (
            <>
              <Film className="w-4 h-4" />
              Generate Talking Video (5 credits)
            </>
          )}
        </Button>
      )}

      {/* Info */}
      <div className="p-3 rounded-lg bg-secondary/30 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">How it works:</p>
        <p>1. Write a script for your AI influencer to say</p>
        <p>2. Choose a voice, emotion, and language</p>
        <p>3. Generate audio to preview the speech</p>
        <p>4. Generate a talking video with lip-sync (requires character image)</p>
      </div>
    </div>
  );
}
