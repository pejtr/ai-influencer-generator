/**
 * Scene Generator for Storyboard Mode
 * Generates multiple images of the same character from different angles
 * and with varied actions, maintaining consistency across shots
 */

// Scene shot types for storyboarding
export interface SceneShot {
  id: string;
  name: string;
  description: string;
  cameraAngle: string;
  framing: string;
  action: string;
  promptModifier: string;
}

// Pre-defined shot types for storyboarding
export const SHOT_TYPES: SceneShot[] = [
  // Establishing shots
  {
    id: "wide_establishing",
    name: "Wide Establishing",
    description: "Full environment with character",
    cameraAngle: "eye level, wide",
    framing: "extreme wide shot",
    action: "standing in environment",
    promptModifier: "extreme wide shot, full environment visible, establishing shot, character in context"
  },
  {
    id: "full_body",
    name: "Full Body",
    description: "Complete figure head to toe",
    cameraAngle: "eye level",
    framing: "full shot",
    action: "standing naturally",
    promptModifier: "full body shot, head to toe visible, natural standing pose"
  },
  
  // Medium shots
  {
    id: "medium_wide",
    name: "Medium Wide",
    description: "Waist up with some environment",
    cameraAngle: "eye level",
    framing: "medium wide shot",
    action: "casual pose",
    promptModifier: "medium wide shot, waist up, some environment visible, casual pose"
  },
  {
    id: "medium",
    name: "Medium Shot",
    description: "Waist up, standard conversation",
    cameraAngle: "eye level",
    framing: "medium shot",
    action: "engaged expression",
    promptModifier: "medium shot, waist up, conversational framing, engaged expression"
  },
  {
    id: "medium_close",
    name: "Medium Close-Up",
    description: "Chest up, emotional connection",
    cameraAngle: "eye level",
    framing: "medium close-up",
    action: "emotional expression",
    promptModifier: "medium close-up, chest up, emotional connection, intimate framing"
  },
  
  // Close-ups
  {
    id: "close_up",
    name: "Close-Up",
    description: "Face fills frame",
    cameraAngle: "eye level",
    framing: "close-up",
    action: "direct gaze",
    promptModifier: "close-up shot, face filling frame, direct eye contact, detailed features"
  },
  {
    id: "extreme_close",
    name: "Extreme Close-Up",
    description: "Eyes or specific feature",
    cameraAngle: "eye level",
    framing: "extreme close-up",
    action: "intense gaze",
    promptModifier: "extreme close-up, eyes detail, intense gaze, macro detail"
  },
  
  // Angle variations
  {
    id: "low_angle",
    name: "Low Angle",
    description: "Looking up at subject, powerful",
    cameraAngle: "low angle, looking up",
    framing: "medium shot",
    action: "confident pose",
    promptModifier: "low angle shot, looking up at subject, powerful presence, heroic framing"
  },
  {
    id: "high_angle",
    name: "High Angle",
    description: "Looking down, vulnerable",
    cameraAngle: "high angle, looking down",
    framing: "medium shot",
    action: "looking up",
    promptModifier: "high angle shot, looking down at subject, vulnerable, diminished"
  },
  {
    id: "dutch_angle",
    name: "Dutch Angle",
    description: "Tilted frame, tension",
    cameraAngle: "dutch angle, tilted",
    framing: "medium shot",
    action: "dynamic pose",
    promptModifier: "dutch angle, tilted frame, tension, dynamic, unsettling"
  },
  
  // Profile and 3/4 views
  {
    id: "profile_left",
    name: "Profile Left",
    description: "Side view facing left",
    cameraAngle: "profile, left side",
    framing: "medium close-up",
    action: "looking left",
    promptModifier: "profile view, left side of face, side portrait, looking left"
  },
  {
    id: "profile_right",
    name: "Profile Right",
    description: "Side view facing right",
    cameraAngle: "profile, right side",
    framing: "medium close-up",
    action: "looking right",
    promptModifier: "profile view, right side of face, side portrait, looking right"
  },
  {
    id: "three_quarter_left",
    name: "3/4 View Left",
    description: "Classic portrait angle left",
    cameraAngle: "three-quarter, left",
    framing: "medium close-up",
    action: "slight turn left",
    promptModifier: "three-quarter view, turned slightly left, classic portrait angle"
  },
  {
    id: "three_quarter_right",
    name: "3/4 View Right",
    description: "Classic portrait angle right",
    cameraAngle: "three-quarter, right",
    framing: "medium close-up",
    action: "slight turn right",
    promptModifier: "three-quarter view, turned slightly right, classic portrait angle"
  },
  
  // Over the shoulder
  {
    id: "over_shoulder",
    name: "Over the Shoulder",
    description: "POV from behind subject",
    cameraAngle: "over the shoulder",
    framing: "medium shot",
    action: "looking at something",
    promptModifier: "over the shoulder shot, back of head visible, looking at scene"
  },
  {
    id: "back_view",
    name: "Back View",
    description: "Subject from behind",
    cameraAngle: "from behind",
    framing: "medium shot",
    action: "walking away",
    promptModifier: "back view, from behind, walking away, mysterious"
  }
];

// Action/Pose variations
export interface ActionPose {
  id: string;
  name: string;
  description: string;
  bodyPosition: string;
  hands: string;
  expression: string;
  promptModifier: string;
}

export const ACTION_POSES: ActionPose[] = [
  {
    id: "standing_neutral",
    name: "Standing Neutral",
    description: "Relaxed standing pose",
    bodyPosition: "standing straight",
    hands: "at sides",
    expression: "neutral",
    promptModifier: "standing naturally, relaxed posture, hands at sides, neutral expression"
  },
  {
    id: "standing_confident",
    name: "Standing Confident",
    description: "Power pose",
    bodyPosition: "standing tall",
    hands: "on hips",
    expression: "confident",
    promptModifier: "standing confidently, hands on hips, powerful stance, confident expression"
  },
  {
    id: "walking_forward",
    name: "Walking Forward",
    description: "Mid-stride walking",
    bodyPosition: "walking",
    hands: "natural swing",
    expression: "focused",
    promptModifier: "walking forward, mid-stride, natural arm swing, purposeful"
  },
  {
    id: "walking_casual",
    name: "Walking Casual",
    description: "Leisurely stroll",
    bodyPosition: "casual walk",
    hands: "relaxed",
    expression: "relaxed",
    promptModifier: "casual walking, leisurely stroll, relaxed body language"
  },
  {
    id: "sitting_relaxed",
    name: "Sitting Relaxed",
    description: "Comfortable seated position",
    bodyPosition: "sitting",
    hands: "in lap",
    expression: "relaxed",
    promptModifier: "sitting comfortably, relaxed posture, hands in lap"
  },
  {
    id: "sitting_elegant",
    name: "Sitting Elegant",
    description: "Poised seated position",
    bodyPosition: "sitting elegantly",
    hands: "gracefully placed",
    expression: "poised",
    promptModifier: "sitting elegantly, poised posture, graceful hand placement"
  },
  {
    id: "leaning",
    name: "Leaning",
    description: "Leaning against surface",
    bodyPosition: "leaning",
    hands: "supporting",
    expression: "casual",
    promptModifier: "leaning against wall, casual pose, relaxed body language"
  },
  {
    id: "turning",
    name: "Turning Around",
    description: "Mid-turn motion",
    bodyPosition: "turning",
    hands: "in motion",
    expression: "surprised",
    promptModifier: "turning around, mid-motion, dynamic pose, looking back"
  },
  {
    id: "looking_up",
    name: "Looking Up",
    description: "Gazing upward",
    bodyPosition: "standing",
    hands: "relaxed",
    expression: "wonder",
    promptModifier: "looking up, gazing upward, expression of wonder"
  },
  {
    id: "looking_down",
    name: "Looking Down",
    description: "Gazing downward",
    bodyPosition: "standing",
    hands: "relaxed",
    expression: "contemplative",
    promptModifier: "looking down, gazing downward, contemplative expression"
  },
  {
    id: "hand_on_face",
    name: "Hand on Face",
    description: "Thoughtful pose",
    bodyPosition: "standing or sitting",
    hands: "touching face",
    expression: "thoughtful",
    promptModifier: "hand touching face, thoughtful pose, contemplative"
  },
  {
    id: "arms_crossed",
    name: "Arms Crossed",
    description: "Defensive or confident",
    bodyPosition: "standing",
    hands: "arms crossed",
    expression: "determined",
    promptModifier: "arms crossed, confident stance, determined expression"
  },
  {
    id: "reaching",
    name: "Reaching Out",
    description: "Extending hand",
    bodyPosition: "standing",
    hands: "reaching forward",
    expression: "inviting",
    promptModifier: "reaching out, hand extended, inviting gesture"
  },
  {
    id: "dancing",
    name: "Dancing",
    description: "Dance movement",
    bodyPosition: "dynamic dance pose",
    hands: "expressive",
    expression: "joyful",
    promptModifier: "dancing, dynamic pose, expressive movement, joyful"
  },
  {
    id: "running",
    name: "Running",
    description: "Mid-run motion",
    bodyPosition: "running",
    hands: "pumping",
    expression: "determined",
    promptModifier: "running, mid-stride, dynamic motion, determined"
  }
];

// Storyboard layout options
export interface StoryboardLayout {
  id: string;
  name: string;
  rows: number;
  cols: number;
  totalShots: number;
}

export const STORYBOARD_LAYOUTS: StoryboardLayout[] = [
  { id: "2x1", name: "2 Shots (1x2)", rows: 1, cols: 2, totalShots: 2 },
  { id: "2x2", name: "4 Shots (2x2)", rows: 2, cols: 2, totalShots: 4 },
  { id: "3x2", name: "6 Shots (2x3)", rows: 2, cols: 3, totalShots: 6 },
  { id: "3x3", name: "9 Shots (3x3)", rows: 3, cols: 3, totalShots: 9 },
  { id: "4x3", name: "12 Shots (3x4)", rows: 3, cols: 4, totalShots: 12 },
  { id: "4x4", name: "16 Shots (4x4)", rows: 4, cols: 4, totalShots: 16 },
];

// Scene sequence templates
export interface SceneSequence {
  id: string;
  name: string;
  description: string;
  shots: string[]; // Shot type IDs
}

export const SCENE_SEQUENCES: SceneSequence[] = [
  {
    id: "intro_sequence",
    name: "Character Introduction",
    description: "Classic character reveal sequence",
    shots: ["wide_establishing", "full_body", "medium", "close_up"]
  },
  {
    id: "conversation",
    name: "Conversation Coverage",
    description: "Standard dialogue coverage",
    shots: ["medium", "close_up", "over_shoulder", "medium_close"]
  },
  {
    id: "action_sequence",
    name: "Action Sequence",
    description: "Dynamic action coverage",
    shots: ["wide_establishing", "medium", "low_angle", "dutch_angle", "close_up", "back_view"]
  },
  {
    id: "portrait_series",
    name: "Portrait Series",
    description: "Multiple portrait angles",
    shots: ["close_up", "three_quarter_left", "profile_left", "three_quarter_right", "profile_right"]
  },
  {
    id: "emotional_arc",
    name: "Emotional Arc",
    description: "Building emotional intensity",
    shots: ["medium_wide", "medium", "medium_close", "close_up", "extreme_close"]
  },
  {
    id: "reveal_sequence",
    name: "Dramatic Reveal",
    description: "Building to character reveal",
    shots: ["back_view", "over_shoulder", "profile_left", "three_quarter_right", "close_up"]
  },
  {
    id: "power_sequence",
    name: "Power/Hero Shots",
    description: "Heroic character presentation",
    shots: ["low_angle", "full_body", "medium", "close_up"]
  },
  {
    id: "vulnerability",
    name: "Vulnerability Sequence",
    description: "Intimate, vulnerable moments",
    shots: ["high_angle", "medium_close", "close_up", "extreme_close"]
  }
];

// Generate scene prompts for a sequence
export function generateScenePrompts(
  baseCharacterPrompt: string,
  sequence: SceneSequence,
  actionPose?: string
): { shotId: string; prompt: string }[] {
  const action = actionPose 
    ? ACTION_POSES.find(a => a.id === actionPose)?.promptModifier || ""
    : "";
  
  return sequence.shots.map(shotId => {
    const shot = SHOT_TYPES.find(s => s.id === shotId);
    if (!shot) return { shotId, prompt: baseCharacterPrompt };
    
    const prompt = `${baseCharacterPrompt}, ${shot.promptModifier}${action ? `, ${action}` : ""}`;
    return { shotId, prompt };
  });
}

// Generate custom storyboard with selected shots
export function generateCustomStoryboard(
  baseCharacterPrompt: string,
  selectedShots: string[],
  selectedActions: string[]
): { shotId: string; actionId: string; prompt: string }[] {
  return selectedShots.map((shotId, index) => {
    const shot = SHOT_TYPES.find(s => s.id === shotId);
    const actionId = selectedActions[index] || "standing_neutral";
    const action = ACTION_POSES.find(a => a.id === actionId);
    
    const shotModifier = shot?.promptModifier || "";
    const actionModifier = action?.promptModifier || "";
    
    const prompt = `${baseCharacterPrompt}, ${shotModifier}, ${actionModifier}`;
    return { shotId, actionId, prompt };
  });
}

// Character consistency prompt additions
export const CONSISTENCY_MODIFIERS = {
  sameCharacter: "same person, consistent identity, exact same face, identical features",
  sameLighting: "consistent lighting, same light direction, matching shadows",
  sameStyle: "consistent art style, same visual aesthetic, matching color palette",
  sameQuality: "consistent quality, same level of detail, matching resolution"
};

// Build full storyboard prompt with consistency
export function buildStoryboardPrompt(
  basePrompt: string,
  shot: SceneShot,
  action: ActionPose,
  includeConsistency: boolean = true
): string {
  const parts = [basePrompt];
  
  parts.push(shot.promptModifier);
  parts.push(action.promptModifier);
  
  if (includeConsistency) {
    parts.push(CONSISTENCY_MODIFIERS.sameCharacter);
  }
  
  return parts.join(", ");
}
