import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

interface VideoGenerationOptions {
  prompt: string;
  firstFrameImage?: string; // URL or path to image for I2V
  model?: "T2V-01" | "T2V-01-Director" | "I2V-01" | "I2V-01-Director" | "I2V-01-live" | "MiniMax-Hailuo-02";
  duration?: 6 | 10; // Only for MiniMax-Hailuo-02
  resolution?: "768P" | "1080P"; // Only for MiniMax-Hailuo-02
  cameraMovement?: string; // For Director models
}

interface VideoGenerationResult {
  videoUrl: string;
  taskId?: string;
  status: "completed" | "pending" | "failed";
}

/**
 * Camera movement instructions for Director models
 */
export const CAMERA_MOVEMENTS = {
  truckLeft: "[Truck left]",
  truckRight: "[Truck right]",
  panLeft: "[Pan left]",
  panRight: "[Pan right]",
  pushIn: "[Push in]",
  pullOut: "[Pull out]",
  pedestalUp: "[Pedestal up]",
  pedestalDown: "[Pedestal down]",
  tiltUp: "[Tilt up]",
  tiltDown: "[Tilt down]",
  zoomIn: "[Zoom in]",
  zoomOut: "[Zoom out]",
  shake: "[Shake]",
  trackingShot: "[Tracking shot]",
  staticShot: "[Static shot]",
};

/**
 * Generate video from text prompt or image using MiniMax MCP
 */
export async function generateVideo(options: VideoGenerationOptions): Promise<VideoGenerationResult> {
  const {
    prompt,
    firstFrameImage,
    model = firstFrameImage ? "I2V-01" : "T2V-01",
    duration = 6,
    resolution = "768P",
    cameraMovement,
  } = options;

  // Build the final prompt with camera movement if specified
  let finalPrompt = prompt;
  if (cameraMovement && model.includes("Director")) {
    finalPrompt = `${cameraMovement} ${prompt}`;
  }

  // Prepare output directory
  const outputDir = "/home/ubuntu/ai-influencer-generator/generated-videos";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Build MCP command arguments
  const args: Record<string, any> = {
    prompt: finalPrompt,
    model,
    output_directory: outputDir,
    async_mode: true, // Always use async for video generation
  };

  // Add image for I2V models
  if (firstFrameImage && model.startsWith("I2V")) {
    args.first_frame_image = firstFrameImage;
  }

  // Add duration/resolution for Hailuo-02
  if (model === "MiniMax-Hailuo-02") {
    args.duration = duration;
    args.resolution = resolution;
  }

  try {
    // Call MiniMax MCP generate_video tool
    const command = `manus-mcp-cli tool call generate_video --server minimax --input '${JSON.stringify(args)}'`;
    console.log("[VideoGen] Executing:", command);
    
    const { stdout, stderr } = await execAsync(command, { timeout: 60000 });
    
    if (stderr && !stderr.includes("Tool call result")) {
      console.error("[VideoGen] MCP stderr:", stderr);
    }

    // Parse the response
    const result = parseVideoGenerationResponse(stdout);
    
    return result;
  } catch (error) {
    console.error("[VideoGen] Error:", error);
    throw new Error(`Video generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Query video generation task status
 */
export async function queryVideoStatus(taskId: string): Promise<VideoGenerationResult> {
  try {
    const command = `manus-mcp-cli tool call query_video_generation --server minimax --input '{"task_id": "${taskId}"}'`;
    const { stdout, stderr } = await execAsync(command, { timeout: 30000 });
    
    if (stderr && !stderr.includes("Tool call result")) {
      console.error("[VideoGen] Query stderr:", stderr);
    }

    return parseVideoGenerationResponse(stdout);
  } catch (error) {
    console.error("[VideoGen] Query error:", error);
    throw new Error(`Failed to query video status: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Parse MCP response for video generation
 */
function parseVideoGenerationResponse(output: string): VideoGenerationResult {
  // Try to extract task_id for async mode
  const taskIdMatch = output.match(/task_id[:\s]+["']?([a-zA-Z0-9_-]+)["']?/i);
  const taskId = taskIdMatch ? taskIdMatch[1] : undefined;

  // Try to extract video URL/path
  const pathMatch = output.match(/(?:path|url|file)[:\s]+["']?([^\s"']+\.mp4)["']?/i);
  const videoPath = pathMatch ? pathMatch[1] : undefined;

  // Determine status
  let status: "completed" | "pending" | "failed" = "pending";
  
  if (output.toLowerCase().includes("completed") || output.toLowerCase().includes("success") || videoPath) {
    status = "completed";
  } else if (output.toLowerCase().includes("failed") || output.toLowerCase().includes("error")) {
    status = "failed";
  }

  return {
    videoUrl: videoPath || "",
    taskId,
    status,
  };
}

/**
 * Build video prompt for AI influencer
 */
export function buildVideoPrompt(characterDescription: string, action: string, cameraMovement?: keyof typeof CAMERA_MOVEMENTS): string {
  const basePrompt = `${characterDescription}. ${action}. Professional quality, smooth motion, realistic lighting.`;
  
  if (cameraMovement && CAMERA_MOVEMENTS[cameraMovement]) {
    return `${CAMERA_MOVEMENTS[cameraMovement]} ${basePrompt}`;
  }
  
  return basePrompt;
}
