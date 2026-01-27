import { describe, it, expect } from "vitest";
import {
  CAMERA_PRESETS,
  LENS_PRESETS,
  APERTURE_PRESETS,
  FILM_STOCK_PRESETS,
  LIGHTING_PRESETS,
  DIRECTOR_STYLE_PRESETS,
  COLOR_GRADE_PRESETS,
  buildCinematographyPrompt,
} from "../shared/cinematography";

describe("Cinematography System", () => {
  describe("Camera Presets", () => {
    it("should have valid camera presets", () => {
      expect(CAMERA_PRESETS.length).toBeGreaterThan(0);
      
      CAMERA_PRESETS.forEach((preset) => {
        expect(preset.id).toBeTruthy();
        expect(preset.name).toBeTruthy();
        expect(preset.brand).toBeTruthy();
        expect(preset.type).toMatch(/^(mirrorless|cinema|medium_format|film)$/);
        expect(preset.promptAddition).toBeTruthy();
      });
    });

    it("should include major camera brands", () => {
      const brands = CAMERA_PRESETS.map(p => p.brand);
      expect(brands).toContain("Sony");
      expect(brands).toContain("Canon");
      expect(brands).toContain("RED");
      expect(brands).toContain("ARRI");
    });
  });

  describe("Lens Presets", () => {
    it("should have valid lens presets", () => {
      expect(LENS_PRESETS.length).toBeGreaterThan(0);
      
      LENS_PRESETS.forEach((preset) => {
        expect(preset.id).toBeTruthy();
        expect(preset.name).toBeTruthy();
        expect(preset.focalLength).toBeTruthy();
        expect(preset.type).toMatch(/^(wide|standard|portrait|telephoto)$/);
        expect(preset.promptAddition).toBeTruthy();
      });
    });

    it("should cover all focal length ranges", () => {
      const types = LENS_PRESETS.map(p => p.type);
      expect(types).toContain("wide");
      expect(types).toContain("standard");
      expect(types).toContain("portrait");
      expect(types).toContain("telephoto");
    });
  });

  describe("Aperture Presets", () => {
    it("should have valid aperture presets", () => {
      expect(APERTURE_PRESETS.length).toBeGreaterThan(0);
      
      APERTURE_PRESETS.forEach((preset) => {
        expect(preset.id).toBeTruthy();
        expect(preset.name).toBeTruthy();
        expect(preset.fStop).toMatch(/^f\/\d+(\.\d+)?$/);
        expect(preset.dofDescription).toBeTruthy();
        expect(preset.promptAddition).toBeTruthy();
      });
    });
  });

  describe("Film Stock Presets", () => {
    it("should have valid film stock presets", () => {
      expect(FILM_STOCK_PRESETS.length).toBeGreaterThan(0);
      
      FILM_STOCK_PRESETS.forEach((preset) => {
        expect(preset.id).toBeTruthy();
        expect(preset.name).toBeTruthy();
        expect(preset.brand).toBeTruthy();
        expect(preset.type).toMatch(/^(color_negative|slide|bw|cinema|digital)$/);
        expect(preset.promptAddition).toBeTruthy();
      });
    });

    it("should include classic film stocks", () => {
      const names = FILM_STOCK_PRESETS.map(p => p.name);
      expect(names.some(n => n.includes("Portra"))).toBe(true);
      expect(names.some(n => n.includes("CineStill"))).toBe(true);
    });
  });

  describe("Lighting Presets", () => {
    it("should have valid lighting presets", () => {
      expect(LIGHTING_PRESETS.length).toBeGreaterThan(0);
      
      LIGHTING_PRESETS.forEach((preset) => {
        expect(preset.id).toBeTruthy();
        expect(preset.name).toBeTruthy();
        expect(preset.category).toMatch(/^(studio|natural|cinematic|creative)$/);
        expect(preset.keyLight).toBeTruthy();
        expect(preset.promptAddition).toBeTruthy();
      });
    });

    it("should cover all lighting categories", () => {
      const categories = LIGHTING_PRESETS.map(p => p.category);
      expect(categories).toContain("studio");
      expect(categories).toContain("natural");
      expect(categories).toContain("cinematic");
      expect(categories).toContain("creative");
    });

    it("should include classic lighting setups", () => {
      const names = LIGHTING_PRESETS.map(p => p.name);
      expect(names).toContain("Rembrandt");
      expect(names).toContain("Butterfly/Paramount");
      expect(names).toContain("Golden Hour");
    });
  });

  describe("Director Style Presets", () => {
    it("should have valid director/photographer presets", () => {
      expect(DIRECTOR_STYLE_PRESETS.length).toBeGreaterThan(0);
      
      DIRECTOR_STYLE_PRESETS.forEach((preset) => {
        expect(preset.id).toBeTruthy();
        expect(preset.name).toBeTruthy();
        expect(preset.type).toMatch(/^(director|photographer)$/);
        expect(preset.knownFor).toBeTruthy();
        expect(preset.promptAddition).toBeTruthy();
      });
    });

    it("should include famous directors", () => {
      const names = DIRECTOR_STYLE_PRESETS.map(p => p.name);
      expect(names).toContain("Wes Anderson");
      expect(names).toContain("Christopher Nolan");
      expect(names).toContain("Denis Villeneuve");
    });

    it("should include famous photographers", () => {
      const names = DIRECTOR_STYLE_PRESETS.map(p => p.name);
      expect(names).toContain("Annie Leibovitz");
      expect(names).toContain("Peter Lindbergh");
    });
  });

  describe("Color Grade Presets", () => {
    it("should have valid color grade presets", () => {
      expect(COLOR_GRADE_PRESETS.length).toBeGreaterThan(0);
      
      COLOR_GRADE_PRESETS.forEach((preset) => {
        expect(preset.id).toBeTruthy();
        expect(preset.name).toBeTruthy();
        expect(preset.shadows).toBeTruthy();
        expect(preset.midtones).toBeTruthy();
        expect(preset.highlights).toBeTruthy();
        expect(preset.promptAddition).toBeTruthy();
      });
    });

    it("should include popular color grades", () => {
      const names = COLOR_GRADE_PRESETS.map(p => p.name);
      expect(names).toContain("Teal & Orange");
      expect(names).toContain("Vintage Warm");
    });
  });

  describe("buildCinematographyPrompt", () => {
    it("should return empty string when no options provided", () => {
      const result = buildCinematographyPrompt({});
      expect(result).toBe("");
    });

    it("should build prompt with single camera option", () => {
      const result = buildCinematographyPrompt({ camera: "sony_a7iv" });
      expect(result).toContain("Sony A7IV");
    });

    it("should build prompt with single lens option", () => {
      const result = buildCinematographyPrompt({ lens: "85mm_portrait" });
      expect(result).toContain("85mm");
      expect(result).toContain("portrait");
    });

    it("should build prompt with multiple options", () => {
      const result = buildCinematographyPrompt({
        camera: "arri_alexa",
        lens: "50mm_standard",
        lighting: "golden_hour",
      });
      expect(result).toContain("ARRI");
      expect(result).toContain("50mm");
      expect(result).toContain("golden hour");
    });

    it("should combine all cinematography options", () => {
      const result = buildCinematographyPrompt({
        camera: "canon_r5",
        lens: "85mm_portrait",
        aperture: "f1_4_portrait",
        filmStock: "kodak_portra_400",
        lighting: "rembrandt",
        directorStyle: "wes_anderson",
        colorGrade: "teal_orange",
      });
      
      expect(result).toContain("Canon");
      expect(result).toContain("85mm");
      expect(result).toContain("f/1.4");
      expect(result).toContain("Portra");
      expect(result).toContain("Rembrandt");
      expect(result).toContain("Wes Anderson");
      expect(result).toContain("teal");
    });

    it("should handle invalid preset IDs gracefully", () => {
      const result = buildCinematographyPrompt({
        camera: "invalid_camera",
        lens: "invalid_lens",
      });
      expect(result).toBe("");
    });
  });
});
