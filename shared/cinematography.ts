/**
 * Nano Banana Pro Style Cinematography System
 * Professional camera gear, lighting, and film style presets
 * for achieving cinematic consistency in AI image generation
 */

// Camera Body Presets
export interface CameraPreset {
  id: string;
  name: string;
  brand: string;
  type: "mirrorless" | "cinema" | "medium_format" | "film";
  sensorSize: string;
  characteristics: string;
  promptAddition: string;
}

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: "sony_a7iv",
    name: "Sony A7 IV",
    brand: "Sony",
    type: "mirrorless",
    sensorSize: "Full Frame",
    characteristics: "Natural colors, excellent dynamic range",
    promptAddition: "shot on Sony A7IV, natural color science, excellent dynamic range"
  },
  {
    id: "canon_r5",
    name: "Canon EOS R5",
    brand: "Canon",
    type: "mirrorless",
    sensorSize: "Full Frame",
    characteristics: "Warm skin tones, Canon color science",
    promptAddition: "shot on Canon EOS R5, warm skin tones, Canon color science"
  },
  {
    id: "red_komodo",
    name: "RED Komodo",
    brand: "RED",
    type: "cinema",
    sensorSize: "Super 35",
    characteristics: "Cinematic look, high dynamic range",
    promptAddition: "shot on RED Komodo 6K, cinematic look, high dynamic range, film-like quality"
  },
  {
    id: "arri_alexa",
    name: "ARRI Alexa Mini",
    brand: "ARRI",
    type: "cinema",
    sensorSize: "Super 35",
    characteristics: "Hollywood standard, organic film look",
    promptAddition: "shot on ARRI Alexa Mini, Hollywood cinematic quality, organic film look, industry standard"
  },
  {
    id: "blackmagic_pocket",
    name: "Blackmagic Pocket 6K",
    brand: "Blackmagic",
    type: "cinema",
    sensorSize: "Super 35",
    characteristics: "Rich colors, film-like texture",
    promptAddition: "shot on Blackmagic Pocket 6K, rich colors, film-like texture, cinematic"
  },
  {
    id: "hasselblad_x2d",
    name: "Hasselblad X2D",
    brand: "Hasselblad",
    type: "medium_format",
    sensorSize: "Medium Format",
    characteristics: "Exceptional detail, medium format look",
    promptAddition: "shot on Hasselblad X2D 100C, medium format, exceptional detail, shallow depth of field"
  },
  {
    id: "leica_m11",
    name: "Leica M11",
    brand: "Leica",
    type: "mirrorless",
    sensorSize: "Full Frame",
    characteristics: "Classic Leica rendering, timeless look",
    promptAddition: "shot on Leica M11, classic Leica rendering, timeless aesthetic, beautiful bokeh"
  },
  {
    id: "film_35mm",
    name: "35mm Film Camera",
    brand: "Analog",
    type: "film",
    sensorSize: "35mm Film",
    characteristics: "Film grain, organic colors",
    promptAddition: "shot on 35mm film, film grain, organic colors, analog photography aesthetic"
  }
];

// Lens Presets
export interface LensPreset {
  id: string;
  name: string;
  focalLength: string;
  aperture: string;
  type: "wide" | "standard" | "portrait" | "telephoto";
  characteristics: string;
  bestFor: string;
  promptAddition: string;
}

export const LENS_PRESETS: LensPreset[] = [
  {
    id: "24mm_wide",
    name: "24mm Wide",
    focalLength: "24mm",
    aperture: "f/1.4",
    type: "wide",
    characteristics: "Environmental portraits, dramatic perspective",
    bestFor: "Full body, environmental shots",
    promptAddition: "24mm wide angle lens, environmental portrait, dramatic perspective, slight distortion"
  },
  {
    id: "35mm_street",
    name: "35mm Street",
    focalLength: "35mm",
    aperture: "f/1.4",
    type: "standard",
    characteristics: "Natural perspective, versatile",
    bestFor: "Street photography, documentary",
    promptAddition: "35mm lens, natural perspective, street photography style, versatile framing"
  },
  {
    id: "50mm_standard",
    name: "50mm Standard",
    focalLength: "50mm",
    aperture: "f/1.2",
    type: "standard",
    characteristics: "Classic look, natural field of view",
    bestFor: "General portraits, natural look",
    promptAddition: "50mm lens f/1.2, classic portrait, natural field of view, beautiful bokeh"
  },
  {
    id: "85mm_portrait",
    name: "85mm Portrait",
    focalLength: "85mm",
    aperture: "f/1.4",
    type: "portrait",
    characteristics: "Flattering compression, creamy bokeh",
    bestFor: "Headshots, beauty portraits",
    promptAddition: "85mm portrait lens f/1.4, flattering facial compression, creamy bokeh, professional portrait"
  },
  {
    id: "105mm_beauty",
    name: "105mm Beauty",
    focalLength: "105mm",
    aperture: "f/1.4",
    type: "portrait",
    characteristics: "Maximum compression, isolated subject",
    bestFor: "Beauty, fashion close-ups",
    promptAddition: "105mm lens f/1.4, maximum compression, isolated subject, beauty photography"
  },
  {
    id: "135mm_telephoto",
    name: "135mm Telephoto",
    focalLength: "135mm",
    aperture: "f/1.8",
    type: "telephoto",
    characteristics: "Strong compression, background separation",
    bestFor: "Fashion, editorial",
    promptAddition: "135mm telephoto lens f/1.8, strong compression, extreme background separation, fashion editorial"
  },
  {
    id: "200mm_compressed",
    name: "200mm Compressed",
    focalLength: "200mm",
    aperture: "f/2.0",
    type: "telephoto",
    characteristics: "Extreme compression, dreamy background",
    bestFor: "Artistic portraits, sports",
    promptAddition: "200mm telephoto f/2.0, extreme compression, dreamy blurred background, artistic"
  }
];

// Aperture/Depth of Field Presets
export interface AperturePreset {
  id: string;
  name: string;
  fStop: string;
  dofDescription: string;
  characteristics: string;
  promptAddition: string;
}

export const APERTURE_PRESETS: AperturePreset[] = [
  {
    id: "f1_2_dreamy",
    name: "f/1.2 Dreamy",
    fStop: "f/1.2",
    dofDescription: "Ultra shallow",
    characteristics: "Extreme bokeh, dreamy atmosphere",
    promptAddition: "f/1.2 aperture, ultra shallow depth of field, extreme bokeh, dreamy atmosphere"
  },
  {
    id: "f1_4_portrait",
    name: "f/1.4 Portrait",
    fStop: "f/1.4",
    dofDescription: "Very shallow",
    characteristics: "Beautiful subject separation",
    promptAddition: "f/1.4 aperture, shallow depth of field, beautiful bokeh, subject isolation"
  },
  {
    id: "f2_balanced",
    name: "f/2 Balanced",
    fStop: "f/2",
    dofDescription: "Shallow",
    characteristics: "Good separation with more in focus",
    promptAddition: "f/2 aperture, shallow depth of field, balanced bokeh, good subject separation"
  },
  {
    id: "f2_8_editorial",
    name: "f/2.8 Editorial",
    fStop: "f/2.8",
    dofDescription: "Moderate",
    characteristics: "Professional editorial look",
    promptAddition: "f/2.8 aperture, moderate depth of field, editorial style, professional look"
  },
  {
    id: "f4_environmental",
    name: "f/4 Environmental",
    fStop: "f/4",
    dofDescription: "Medium",
    characteristics: "Subject and environment visible",
    promptAddition: "f/4 aperture, medium depth of field, environmental portrait, context visible"
  },
  {
    id: "f8_sharp",
    name: "f/8 Sharp",
    fStop: "f/8",
    dofDescription: "Deep",
    characteristics: "Maximum sharpness throughout",
    promptAddition: "f/8 aperture, deep depth of field, sharp throughout, maximum detail"
  },
  {
    id: "f11_landscape",
    name: "f/11 Landscape",
    fStop: "f/11",
    dofDescription: "Very deep",
    characteristics: "Everything in focus",
    promptAddition: "f/11 aperture, very deep depth of field, everything in focus, landscape style"
  }
];

// Film Stock / Color Science Presets
export interface FilmStockPreset {
  id: string;
  name: string;
  brand: string;
  type: "color_negative" | "slide" | "bw" | "cinema" | "digital";
  characteristics: string;
  colorProfile: string;
  promptAddition: string;
}

export const FILM_STOCK_PRESETS: FilmStockPreset[] = [
  {
    id: "kodak_portra_400",
    name: "Kodak Portra 400",
    brand: "Kodak",
    type: "color_negative",
    characteristics: "Warm skin tones, pastel highlights",
    colorProfile: "Warm, soft, natural",
    promptAddition: "Kodak Portra 400 film look, warm skin tones, pastel highlights, soft colors, film grain"
  },
  {
    id: "kodak_portra_800",
    name: "Kodak Portra 800",
    brand: "Kodak",
    type: "color_negative",
    characteristics: "Slightly grainier, warmer tones",
    colorProfile: "Warm, grainy, nostalgic",
    promptAddition: "Kodak Portra 800 film look, warm tones, visible grain, nostalgic feel"
  },
  {
    id: "fuji_pro_400h",
    name: "Fuji Pro 400H",
    brand: "Fuji",
    type: "color_negative",
    characteristics: "Cool shadows, pastel colors",
    colorProfile: "Cool, pastel, ethereal",
    promptAddition: "Fuji Pro 400H film look, cool shadows, pastel colors, ethereal atmosphere"
  },
  {
    id: "fuji_superia",
    name: "Fuji Superia 400",
    brand: "Fuji",
    type: "color_negative",
    characteristics: "Punchy colors, green tint",
    colorProfile: "Vibrant, punchy, green tint",
    promptAddition: "Fuji Superia 400 film look, punchy colors, slight green tint, consumer film aesthetic"
  },
  {
    id: "cinestill_800t",
    name: "CineStill 800T",
    brand: "CineStill",
    type: "cinema",
    characteristics: "Tungsten balanced, halation glow",
    colorProfile: "Cinematic, blue shadows, red halation",
    promptAddition: "CineStill 800T film look, tungsten balanced, red halation around highlights, cinematic night look"
  },
  {
    id: "kodak_ektar",
    name: "Kodak Ektar 100",
    brand: "Kodak",
    type: "color_negative",
    characteristics: "Ultra saturated, fine grain",
    colorProfile: "Saturated, vivid, sharp",
    promptAddition: "Kodak Ektar 100 film look, ultra saturated colors, fine grain, vivid and sharp"
  },
  {
    id: "kodak_gold",
    name: "Kodak Gold 200",
    brand: "Kodak",
    type: "color_negative",
    characteristics: "Warm, nostalgic, consumer film",
    colorProfile: "Golden warm, nostalgic",
    promptAddition: "Kodak Gold 200 film look, warm golden tones, nostalgic, vintage consumer film aesthetic"
  },
  {
    id: "ilford_hp5",
    name: "Ilford HP5 Plus",
    brand: "Ilford",
    type: "bw",
    characteristics: "Classic B&W, medium contrast",
    colorProfile: "Black and white, classic",
    promptAddition: "Ilford HP5 Plus black and white film, medium contrast, classic grain, timeless monochrome"
  },
  {
    id: "kodak_trix",
    name: "Kodak Tri-X 400",
    brand: "Kodak",
    type: "bw",
    characteristics: "High contrast B&W, gritty",
    colorProfile: "Black and white, contrasty",
    promptAddition: "Kodak Tri-X 400 black and white, high contrast, gritty grain, documentary style"
  },
  {
    id: "digital_clean",
    name: "Digital Clean",
    brand: "Digital",
    type: "digital",
    characteristics: "No grain, clean modern look",
    colorProfile: "Clean, modern, neutral",
    promptAddition: "clean digital photography, no grain, modern look, neutral color science"
  },
  {
    id: "digital_vibrant",
    name: "Digital Vibrant",
    brand: "Digital",
    type: "digital",
    characteristics: "Enhanced saturation, punchy",
    colorProfile: "Vibrant, saturated, punchy",
    promptAddition: "vibrant digital photography, enhanced saturation, punchy colors, modern commercial look"
  }
];

// Lighting Setup Presets
export interface LightingPreset {
  id: string;
  name: string;
  category: "studio" | "natural" | "cinematic" | "creative";
  description: string;
  keyLight: string;
  fillLight: string;
  mood: string;
  promptAddition: string;
}

export const LIGHTING_PRESETS: LightingPreset[] = [
  // Studio Lighting
  {
    id: "rembrandt",
    name: "Rembrandt",
    category: "studio",
    description: "Classic portrait lighting with triangle on cheek",
    keyLight: "45° above and to side",
    fillLight: "Minimal fill for drama",
    mood: "Classic, dramatic, artistic",
    promptAddition: "Rembrandt lighting, triangle of light on cheek, dramatic shadows, classic portrait lighting"
  },
  {
    id: "butterfly",
    name: "Butterfly/Paramount",
    category: "studio",
    description: "Glamorous Hollywood lighting from above",
    keyLight: "Directly above camera",
    fillLight: "Reflector below",
    mood: "Glamorous, elegant, beauty",
    promptAddition: "butterfly lighting, paramount lighting, glamorous Hollywood style, shadow under nose, beauty lighting"
  },
  {
    id: "split",
    name: "Split Lighting",
    category: "studio",
    description: "Half face lit, half in shadow",
    keyLight: "90° to side",
    fillLight: "None",
    mood: "Dramatic, mysterious, edgy",
    promptAddition: "split lighting, half face illuminated, dramatic shadows, mysterious mood, high contrast"
  },
  {
    id: "loop",
    name: "Loop Lighting",
    category: "studio",
    description: "Soft shadow from nose, versatile",
    keyLight: "30-45° to side, slightly above",
    fillLight: "Soft fill opposite",
    mood: "Natural, flattering, versatile",
    promptAddition: "loop lighting, soft shadow from nose, flattering portrait lighting, natural look"
  },
  {
    id: "broad",
    name: "Broad Lighting",
    category: "studio",
    description: "Face turned away from light",
    keyLight: "Illuminates wider side of face",
    fillLight: "Soft fill",
    mood: "Open, friendly, commercial",
    promptAddition: "broad lighting, face turned from light, wider side illuminated, friendly commercial look"
  },
  {
    id: "clamshell",
    name: "Clamshell Beauty",
    category: "studio",
    description: "Two lights above and below for beauty",
    keyLight: "Large softbox above",
    fillLight: "Reflector or light below",
    mood: "Beauty, fashion, flawless",
    promptAddition: "clamshell lighting, beauty lighting, two light sources, flawless skin, fashion photography"
  },
  
  // Natural Lighting
  {
    id: "golden_hour",
    name: "Golden Hour",
    category: "natural",
    description: "Warm sunset/sunrise light",
    keyLight: "Low sun, warm tones",
    fillLight: "Natural bounce",
    mood: "Romantic, warm, magical",
    promptAddition: "golden hour lighting, warm sunset light, soft shadows, romantic atmosphere, magic hour"
  },
  {
    id: "blue_hour",
    name: "Blue Hour",
    category: "natural",
    description: "Cool twilight ambient light",
    keyLight: "Ambient sky light",
    fillLight: "City lights, practical",
    mood: "Moody, cool, atmospheric",
    promptAddition: "blue hour lighting, twilight, cool ambient light, moody atmosphere, cinematic"
  },
  {
    id: "overcast",
    name: "Overcast Soft",
    category: "natural",
    description: "Giant softbox effect from clouds",
    keyLight: "Diffused sky",
    fillLight: "Even ambient",
    mood: "Soft, even, flattering",
    promptAddition: "overcast lighting, soft diffused light, no harsh shadows, even illumination, flattering"
  },
  {
    id: "harsh_noon",
    name: "Harsh Midday",
    category: "natural",
    description: "Direct overhead sun",
    keyLight: "Direct sun above",
    fillLight: "Reflector needed",
    mood: "Contrasty, editorial, bold",
    promptAddition: "harsh midday sun, high contrast, strong shadows, editorial style, bold look"
  },
  {
    id: "window_light",
    name: "Window Light",
    category: "natural",
    description: "Soft directional natural light",
    keyLight: "Large window",
    fillLight: "Room bounce",
    mood: "Natural, intimate, soft",
    promptAddition: "natural window light, soft directional lighting, intimate atmosphere, beautiful falloff"
  },
  {
    id: "backlit",
    name: "Backlit/Rim",
    category: "natural",
    description: "Light from behind subject",
    keyLight: "Behind subject",
    fillLight: "Reflector front",
    mood: "Dreamy, ethereal, glowing",
    promptAddition: "backlit, rim light, glowing edges, dreamy atmosphere, ethereal look, lens flare"
  },
  
  // Cinematic Lighting
  {
    id: "noir",
    name: "Film Noir",
    category: "cinematic",
    description: "High contrast, dramatic shadows",
    keyLight: "Hard light from side/above",
    fillLight: "Minimal",
    mood: "Mysterious, dramatic, vintage",
    promptAddition: "film noir lighting, high contrast, dramatic shadows, venetian blind shadows, mysterious"
  },
  {
    id: "neon",
    name: "Neon Glow",
    category: "cinematic",
    description: "Colorful neon light sources",
    keyLight: "Colored neon signs",
    fillLight: "Ambient neon bounce",
    mood: "Urban, cyberpunk, vibrant",
    promptAddition: "neon lighting, colorful neon glow, pink and blue neon, cyberpunk atmosphere, urban night"
  },
  {
    id: "practical",
    name: "Practical Lighting",
    category: "cinematic",
    description: "Using visible light sources in scene",
    keyLight: "Lamps, candles, screens",
    fillLight: "Ambient from practicals",
    mood: "Realistic, immersive, cinematic",
    promptAddition: "practical lighting, visible light sources, realistic illumination, cinematic, motivated lighting"
  },
  {
    id: "motivated",
    name: "Motivated Lighting",
    category: "cinematic",
    description: "Light appears to come from scene sources",
    keyLight: "Matches scene logic",
    fillLight: "Subtle fill",
    mood: "Natural, cinematic, believable",
    promptAddition: "motivated lighting, light source visible in scene, natural looking, cinematic realism"
  },
  {
    id: "chiaroscuro",
    name: "Chiaroscuro",
    category: "cinematic",
    description: "Renaissance-style dramatic contrast",
    keyLight: "Single strong source",
    fillLight: "Deep shadows",
    mood: "Artistic, dramatic, painterly",
    promptAddition: "chiaroscuro lighting, strong contrast, Renaissance painting style, dramatic, artistic"
  },
  
  // Creative Lighting
  {
    id: "ring_light",
    name: "Ring Light",
    category: "creative",
    description: "Even front lighting, catchlights",
    keyLight: "Ring around lens",
    fillLight: "Self-filling",
    mood: "Modern, social media, clean",
    promptAddition: "ring light, even illumination, circular catchlights in eyes, modern social media look"
  },
  {
    id: "color_gel",
    name: "Color Gel Creative",
    category: "creative",
    description: "Colored gels for artistic effect",
    keyLight: "Colored gel on main",
    fillLight: "Complementary color",
    mood: "Artistic, editorial, bold",
    promptAddition: "colored gel lighting, creative color contrast, artistic editorial, bold color scheme"
  },
  {
    id: "silhouette",
    name: "Silhouette",
    category: "creative",
    description: "Subject in complete shadow",
    keyLight: "Behind subject only",
    fillLight: "None",
    mood: "Mysterious, artistic, dramatic",
    promptAddition: "silhouette lighting, subject in shadow, bright background, mysterious, artistic"
  }
];

// Director/Photographer Style Presets
export interface DirectorStylePreset {
  id: string;
  name: string;
  type: "director" | "photographer";
  knownFor: string;
  visualStyle: string;
  colorPalette: string;
  promptAddition: string;
}

export const DIRECTOR_STYLE_PRESETS: DirectorStylePreset[] = [
  // Film Directors
  {
    id: "wes_anderson",
    name: "Wes Anderson",
    type: "director",
    knownFor: "Symmetrical compositions, pastel colors",
    visualStyle: "Centered framing, whimsical, detailed production design",
    colorPalette: "Pastel pink, yellow, mint green, coral",
    promptAddition: "Wes Anderson style, symmetrical composition, pastel color palette, whimsical, centered framing, detailed mise-en-scène"
  },
  {
    id: "christopher_nolan",
    name: "Christopher Nolan",
    type: "director",
    knownFor: "IMAX cinematography, practical effects",
    visualStyle: "Grand scale, desaturated, realistic",
    colorPalette: "Desaturated, blue-gray, cold tones",
    promptAddition: "Christopher Nolan style, IMAX quality, grand scale, desaturated colors, realistic, cold blue tones"
  },
  {
    id: "denis_villeneuve",
    name: "Denis Villeneuve",
    type: "director",
    knownFor: "Atmospheric, minimalist, epic scale",
    visualStyle: "Vast landscapes, fog, muted colors",
    colorPalette: "Orange, teal, desaturated earth tones",
    promptAddition: "Denis Villeneuve style, atmospheric, epic scale, fog and haze, orange and teal, minimalist composition"
  },
  {
    id: "ridley_scott",
    name: "Ridley Scott",
    type: "director",
    knownFor: "Atmospheric lighting, detailed worlds",
    visualStyle: "Smoke, shafts of light, textured",
    colorPalette: "Dark, moody, atmospheric haze",
    promptAddition: "Ridley Scott style, atmospheric smoke, shafts of light, detailed production design, moody"
  },
  {
    id: "david_fincher",
    name: "David Fincher",
    type: "director",
    knownFor: "Dark, desaturated, precise",
    visualStyle: "Low key lighting, green/yellow tint",
    colorPalette: "Desaturated, sickly green, dark",
    promptAddition: "David Fincher style, dark desaturated, green tint, low key lighting, precise composition"
  },
  {
    id: "wong_kar_wai",
    name: "Wong Kar-wai",
    type: "director",
    knownFor: "Romantic, neon-lit, motion blur",
    visualStyle: "Saturated colors, step printing, intimate",
    colorPalette: "Neon red, green, blue, saturated",
    promptAddition: "Wong Kar-wai style, romantic atmosphere, neon colors, motion blur, intimate, saturated"
  },
  {
    id: "terrence_malick",
    name: "Terrence Malick",
    type: "director",
    knownFor: "Natural light, magic hour",
    visualStyle: "Ethereal, golden light, nature",
    colorPalette: "Golden, warm, natural tones",
    promptAddition: "Terrence Malick style, magic hour, natural light, ethereal, golden tones, poetic"
  },
  {
    id: "sofia_coppola",
    name: "Sofia Coppola",
    type: "director",
    knownFor: "Dreamy, feminine, soft focus",
    visualStyle: "Pastel, soft, melancholic beauty",
    colorPalette: "Soft pink, cream, muted pastels",
    promptAddition: "Sofia Coppola style, dreamy soft focus, feminine aesthetic, pastel colors, melancholic beauty"
  },
  
  // Photographers
  {
    id: "annie_leibovitz",
    name: "Annie Leibovitz",
    type: "photographer",
    knownFor: "Dramatic portraits, conceptual",
    visualStyle: "Theatrical, elaborate setups, storytelling",
    colorPalette: "Rich, saturated, dramatic",
    promptAddition: "Annie Leibovitz style, dramatic portrait, theatrical lighting, conceptual, elaborate setup"
  },
  {
    id: "peter_lindbergh",
    name: "Peter Lindbergh",
    type: "photographer",
    knownFor: "Natural beauty, black and white",
    visualStyle: "Minimal retouching, authentic, emotional",
    colorPalette: "Black and white, high contrast",
    promptAddition: "Peter Lindbergh style, natural beauty, minimal retouching, black and white, emotional, authentic"
  },
  {
    id: "mario_testino",
    name: "Mario Testino",
    type: "photographer",
    knownFor: "Glamorous, sun-drenched",
    visualStyle: "High fashion, golden light, sensual",
    colorPalette: "Warm, golden, vibrant",
    promptAddition: "Mario Testino style, glamorous, sun-drenched, high fashion, golden light, sensual"
  },
  {
    id: "helmut_newton",
    name: "Helmut Newton",
    type: "photographer",
    knownFor: "Provocative, powerful women",
    visualStyle: "High contrast, architectural, bold",
    colorPalette: "Black and white, high contrast",
    promptAddition: "Helmut Newton style, provocative, powerful, high contrast black and white, architectural, bold"
  },
  {
    id: "steven_meisel",
    name: "Steven Meisel",
    type: "photographer",
    knownFor: "Transformative, editorial",
    visualStyle: "Chameleon-like, diverse styles",
    colorPalette: "Varies by concept",
    promptAddition: "Steven Meisel style, high fashion editorial, transformative, Vogue quality, sophisticated"
  },
  {
    id: "richard_avedon",
    name: "Richard Avedon",
    type: "photographer",
    knownFor: "White background, movement",
    visualStyle: "Clean, dynamic, emotional",
    colorPalette: "White background, B&W or color",
    promptAddition: "Richard Avedon style, clean white background, dynamic movement, emotional expression, iconic"
  },
  {
    id: "tim_walker",
    name: "Tim Walker",
    type: "photographer",
    knownFor: "Fantastical, surreal, whimsical",
    visualStyle: "Fairy tale, elaborate sets, dreamlike",
    colorPalette: "Saturated, fantastical, varied",
    promptAddition: "Tim Walker style, fantastical, surreal, whimsical, fairy tale aesthetic, elaborate dreamlike"
  }
];

// Color Grading Presets
export interface ColorGradePreset {
  id: string;
  name: string;
  description: string;
  shadows: string;
  midtones: string;
  highlights: string;
  promptAddition: string;
}

export const COLOR_GRADE_PRESETS: ColorGradePreset[] = [
  {
    id: "teal_orange",
    name: "Teal & Orange",
    description: "Hollywood blockbuster look",
    shadows: "Teal/cyan",
    midtones: "Neutral",
    highlights: "Orange/warm",
    promptAddition: "teal and orange color grading, Hollywood blockbuster look, complementary colors"
  },
  {
    id: "vintage_warm",
    name: "Vintage Warm",
    description: "Nostalgic, faded look",
    shadows: "Lifted, brown",
    midtones: "Warm, desaturated",
    highlights: "Creamy, yellow",
    promptAddition: "vintage warm color grading, nostalgic faded look, lifted shadows, creamy highlights"
  },
  {
    id: "moody_desaturated",
    name: "Moody Desaturated",
    description: "Dark, atmospheric",
    shadows: "Deep, crushed",
    midtones: "Desaturated",
    highlights: "Muted",
    promptAddition: "moody desaturated color grading, dark atmospheric, crushed blacks, muted colors"
  },
  {
    id: "vibrant_pop",
    name: "Vibrant Pop",
    description: "Punchy, saturated colors",
    shadows: "Rich blacks",
    midtones: "Saturated",
    highlights: "Bright, clean",
    promptAddition: "vibrant pop color grading, punchy saturated colors, rich blacks, bright highlights"
  },
  {
    id: "cool_blue",
    name: "Cool Blue",
    description: "Cold, clinical feel",
    shadows: "Blue/cyan",
    midtones: "Cool neutral",
    highlights: "Cool white",
    promptAddition: "cool blue color grading, cold clinical feel, blue shadows, cool tones throughout"
  },
  {
    id: "warm_golden",
    name: "Warm Golden",
    description: "Sunny, inviting",
    shadows: "Warm brown",
    midtones: "Golden",
    highlights: "Warm white/yellow",
    promptAddition: "warm golden color grading, sunny inviting feel, golden tones, warm throughout"
  },
  {
    id: "cross_process",
    name: "Cross Process",
    description: "Film cross-processing effect",
    shadows: "Green/cyan shift",
    midtones: "Color shift",
    highlights: "Magenta/yellow",
    promptAddition: "cross process color grading, film effect, color shifts, experimental look"
  },
  {
    id: "bleach_bypass",
    name: "Bleach Bypass",
    description: "Desaturated, high contrast",
    shadows: "Deep, contrasty",
    midtones: "Desaturated",
    highlights: "Silvery",
    promptAddition: "bleach bypass color grading, desaturated high contrast, silvery highlights, film look"
  }
];

// Helper function to build cinematography prompt
export function buildCinematographyPrompt(options: {
  camera?: string;
  lens?: string;
  aperture?: string;
  filmStock?: string;
  lighting?: string;
  directorStyle?: string;
  colorGrade?: string;
}): string {
  const parts: string[] = [];
  
  if (options.camera) {
    const preset = CAMERA_PRESETS.find(p => p.id === options.camera);
    if (preset) parts.push(preset.promptAddition);
  }
  
  if (options.lens) {
    const preset = LENS_PRESETS.find(p => p.id === options.lens);
    if (preset) parts.push(preset.promptAddition);
  }
  
  if (options.aperture) {
    const preset = APERTURE_PRESETS.find(p => p.id === options.aperture);
    if (preset) parts.push(preset.promptAddition);
  }
  
  if (options.filmStock) {
    const preset = FILM_STOCK_PRESETS.find(p => p.id === options.filmStock);
    if (preset) parts.push(preset.promptAddition);
  }
  
  if (options.lighting) {
    const preset = LIGHTING_PRESETS.find(p => p.id === options.lighting);
    if (preset) parts.push(preset.promptAddition);
  }
  
  if (options.directorStyle) {
    const preset = DIRECTOR_STYLE_PRESETS.find(p => p.id === options.directorStyle);
    if (preset) parts.push(preset.promptAddition);
  }
  
  if (options.colorGrade) {
    const preset = COLOR_GRADE_PRESETS.find(p => p.id === options.colorGrade);
    if (preset) parts.push(preset.promptAddition);
  }
  
  return parts.join(", ");
}

// Export all preset arrays for UI
export const CINEMATOGRAPHY_CATEGORIES = {
  camera: CAMERA_PRESETS,
  lens: LENS_PRESETS,
  aperture: APERTURE_PRESETS,
  filmStock: FILM_STOCK_PRESETS,
  lighting: LIGHTING_PRESETS,
  directorStyle: DIRECTOR_STYLE_PRESETS,
  colorGrade: COLOR_GRADE_PRESETS,
};
