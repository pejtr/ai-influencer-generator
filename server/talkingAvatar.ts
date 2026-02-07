import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

const execAsync = promisify(exec);

export interface TalkingAvatarOptions {
  script: string;
  voiceId?: string;
  emotion?: "happy" | "sad" | "angry" | "fearful" | "disgusted" | "surprised" | "neutral";
  speed?: number; // 0.5 - 2.0
  language?: string;
  imageUrl?: string; // Character image for video generation
}

export interface TalkingAvatarResult {
  audioUrl: string;
  videoTaskId?: string;
  videoStatus?: "pending" | "completed" | "failed";
  videoUrl?: string;
  duration?: number;
}

export interface VoiceInfo {
  voiceId: string;
  name: string;
  type: "system" | "cloned";
}

// Pre-defined voice presets for AI influencers
export const VOICE_PRESETS = [
  { id: "Charming_Lady", name: "Charming Lady", gender: "female", style: "Warm & Engaging" },
  { id: "audiobook_female_1", name: "Storyteller Female", gender: "female", style: "Professional Narrator" },
  { id: "cute_boy", name: "Cute Boy", gender: "male", style: "Youthful & Energetic" },
  { id: "male-qn-qingse", name: "Gentle Male", gender: "male", style: "Calm & Soothing" },
  { id: "narrator_female_1", name: "News Anchor", gender: "female", style: "Clear & Authoritative" },
  { id: "narrator_male_1", name: "Deep Voice", gender: "male", style: "Deep & Commanding" },
  { id: "friendly_female", name: "Friendly Girl", gender: "female", style: "Casual & Fun" },
  { id: "professional_male", name: "Business Pro", gender: "male", style: "Corporate & Polished" },
];

export const SUPPORTED_LANGUAGES = [
  { code: "English", label: "English" },
  { code: "Chinese", label: "Chinese (Mandarin)" },
  { code: "Spanish", label: "Spanish" },
  { code: "French", label: "French" },
  { code: "German", label: "German" },
  { code: "Japanese", label: "Japanese" },
  { code: "Korean", label: "Korean" },
  { code: "Portuguese", label: "Portuguese" },
  { code: "Italian", label: "Italian" },
  { code: "Russian", label: "Russian" },
  { code: "Arabic", label: "Arabic" },
  { code: "Hindi", label: "Hindi" },
  { code: "Thai", label: "Thai" },
  { code: "Turkish", label: "Turkish" },
  { code: "Dutch", label: "Dutch" },
  { code: "Czech", label: "Czech" },
];

/**
 * Generate talking avatar audio from script using MiniMax TTS
 */
export async function generateTalkingAudio(options: TalkingAvatarOptions): Promise<TalkingAvatarResult> {
  const {
    script,
    voiceId = "Charming_Lady",
    emotion = "happy",
    speed = 1.0,
    language = "English",
  } = options;

  const outputDir = "/tmp/talking-avatar-audio";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // Build MCP command for text_to_audio
    const args: Record<string, any> = {
      text: script,
      voice_id: voiceId,
      emotion: emotion,
      speed: speed,
      language_boost: language,
      output_directory: outputDir,
      format: "mp3",
    };

    const command = `manus-mcp-cli tool call text_to_audio --server minimax --input '${JSON.stringify(args).replace(/'/g, "'\\''")}'`;
    console.log("[TalkingAvatar] Generating audio...");

    const { stdout, stderr } = await execAsync(command, { timeout: 120000 });

    if (stderr && !stderr.includes("Tool call result")) {
      console.error("[TalkingAvatar] MCP stderr:", stderr);
    }

    // Extract the file path from output
    const pathMatch = stdout.match(/(?:path|file|saved)[:\s]+["']?([^\s"']+\.mp3)["']?/i) ||
                      stdout.match(/([\/][^\s"']+\.mp3)/);
    
    let audioUrl = "";

    if (pathMatch && pathMatch[1]) {
      const localPath = pathMatch[1];
      // Upload to S3
      if (fs.existsSync(localPath)) {
        const audioBuffer = fs.readFileSync(localPath);
        const key = `talking-avatar/${nanoid()}.mp3`;
        const { url } = await storagePut(key, audioBuffer, "audio/mpeg");
        audioUrl = url;
        // Clean up local file
        fs.unlinkSync(localPath);
      }
    }

    if (!audioUrl) {
      // Try to find any mp3 file in the output directory
      const files = fs.readdirSync(outputDir).filter(f => f.endsWith(".mp3"));
      if (files.length > 0) {
        const latestFile = files.sort().pop()!;
        const localPath = path.join(outputDir, latestFile);
        const audioBuffer = fs.readFileSync(localPath);
        const key = `talking-avatar/${nanoid()}.mp3`;
        const { url } = await storagePut(key, audioBuffer, "audio/mpeg");
        audioUrl = url;
        fs.unlinkSync(localPath);
      }
    }

    if (!audioUrl) {
      throw new Error("Failed to generate audio - no output file found");
    }

    console.log("[TalkingAvatar] Audio generated:", audioUrl);

    return {
      audioUrl,
    };
  } catch (error) {
    console.error("[TalkingAvatar] Error:", error);
    throw new Error(`Talking avatar generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Generate talking video by combining audio with character image
 * Uses MiniMax video generation with the character image as first frame
 */
export async function generateTalkingVideo(
  imageUrl: string,
  audioUrl: string,
  script: string
): Promise<{ taskId: string; status: string }> {
  const outputDir = "/tmp/talking-avatar-video";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // Use I2V model with the character image to create a talking video
    const videoPrompt = `A person speaking naturally, lip movements synchronized with speech, natural facial expressions, professional lighting, social media content creator style. The person is saying: "${script.substring(0, 200)}"`;

    const args: Record<string, any> = {
      prompt: videoPrompt,
      first_frame_image: imageUrl,
      model: "I2V-01",
      output_directory: outputDir,
      async_mode: true,
    };

    const command = `manus-mcp-cli tool call generate_video --server minimax --input '${JSON.stringify(args).replace(/'/g, "'\\''")}'`;
    console.log("[TalkingAvatar] Generating video...");

    const { stdout } = await execAsync(command, { timeout: 60000 });

    // Extract task ID
    const taskIdMatch = stdout.match(/task_id[:\s]+["']?([a-zA-Z0-9_-]+)["']?/i);
    const taskId = taskIdMatch ? taskIdMatch[1] : nanoid();

    return {
      taskId,
      status: "pending",
    };
  } catch (error) {
    console.error("[TalkingAvatar] Video error:", error);
    throw new Error(`Talking video generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * List available voices from MiniMax
 */
export async function listVoices(): Promise<VoiceInfo[]> {
  try {
    const command = `manus-mcp-cli tool call list_voices --server minimax --input '{"voice_type": "all"}'`;
    const { stdout } = await execAsync(command, { timeout: 30000 });

    // Parse voice list from output
    const voices: VoiceInfo[] = [];
    const lines = stdout.split("\n");
    
    for (const line of lines) {
      const match = line.match(/(?:voice_id|id)[:\s]+["']?([^\s"',]+)["']?/i);
      if (match) {
        voices.push({
          voiceId: match[1],
          name: match[1].replace(/_/g, " ").replace(/[-]/g, " "),
          type: line.toLowerCase().includes("clone") ? "cloned" : "system",
        });
      }
    }

    // If parsing fails, return presets
    if (voices.length === 0) {
      return VOICE_PRESETS.map(p => ({
        voiceId: p.id,
        name: p.name,
        type: "system" as const,
      }));
    }

    return voices;
  } catch (error) {
    console.error("[TalkingAvatar] List voices error:", error);
    // Return presets as fallback
    return VOICE_PRESETS.map(p => ({
      voiceId: p.id,
      name: p.name,
      type: "system" as const,
    }));
  }
}
