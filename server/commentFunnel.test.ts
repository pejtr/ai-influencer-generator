import { describe, it, expect } from "vitest";
import { matchesKeyword, renderMessage } from "./commentFunnelRouter";

describe("Comment-to-DM Funnel - Keyword Matching", () => {
  describe("matchesKeyword - contains", () => {
    it("matches when comment contains keyword (case-insensitive)", () => {
      expect(matchesKeyword("FIRE 🔥 great video!", "fire", "contains", false)).toBe(true);
    });

    it("matches when keyword is in middle of comment", () => {
      expect(matchesKeyword("I need the guide please", "guide", "contains", false)).toBe(true);
    });

    it("does not match when keyword is absent", () => {
      expect(matchesKeyword("awesome content!", "fire", "contains", false)).toBe(false);
    });

    it("respects case-sensitive flag", () => {
      expect(matchesKeyword("FIRE 🔥", "fire", "contains", true)).toBe(false);
      expect(matchesKeyword("FIRE 🔥", "FIRE", "contains", true)).toBe(true);
    });
  });

  describe("matchesKeyword - exact", () => {
    it("matches exact comment", () => {
      expect(matchesKeyword("FIRE", "FIRE", "exact", false)).toBe(true);
    });

    it("does not match partial comment", () => {
      expect(matchesKeyword("FIRE 🔥", "FIRE", "exact", false)).toBe(false);
    });

    it("exact match is case-insensitive by default", () => {
      expect(matchesKeyword("fire", "FIRE", "exact", false)).toBe(true);
    });
  });

  describe("matchesKeyword - starts_with", () => {
    it("matches when comment starts with keyword", () => {
      expect(matchesKeyword("LINK please send me", "link", "starts_with", false)).toBe(true);
    });

    it("does not match when keyword is in middle", () => {
      expect(matchesKeyword("please send LINK", "link", "starts_with", false)).toBe(false);
    });

    it("starts_with is case-insensitive by default", () => {
      expect(matchesKeyword("YES I want it", "yes", "starts_with", false)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles empty comment", () => {
      expect(matchesKeyword("", "fire", "contains", false)).toBe(false);
    });

    it("handles single character keyword", () => {
      expect(matchesKeyword("Y", "y", "exact", false)).toBe(true);
    });

    it("handles emoji in comment", () => {
      expect(matchesKeyword("🔥 FIRE 🔥", "fire", "contains", false)).toBe(true);
    });
  });
});

describe("Comment-to-DM Funnel - Message Rendering", () => {
  it("replaces {name} placeholder", () => {
    const result = renderMessage("Hey {name}! Thanks for commenting.", { name: "Alice" });
    expect(result).toBe("Hey Alice! Thanks for commenting.");
  });

  it("replaces {keyword} placeholder", () => {
    const result = renderMessage("You commented {keyword}!", { keyword: "FIRE" });
    expect(result).toBe("You commented FIRE!");
  });

  it("replaces {link} placeholder", () => {
    const result = renderMessage("Here's your guide: {link}", { link: "https://example.com/guide" });
    expect(result).toBe("Here's your guide: https://example.com/guide");
  });

  it("replaces all placeholders at once", () => {
    const result = renderMessage(
      "Hey {name}! You commented {keyword} — here's your link: {link} 🔥",
      { name: "Bob", keyword: "FIRE", link: "https://example.com" }
    );
    expect(result).toBe("Hey Bob! You commented FIRE — here's your link: https://example.com 🔥");
  });

  it("uses default 'there' when name is not provided", () => {
    const result = renderMessage("Hey {name}!", {});
    expect(result).toBe("Hey there!");
  });

  it("replaces multiple occurrences of same placeholder", () => {
    const result = renderMessage("{name} is great! Thanks {name}!", { name: "Carol" });
    expect(result).toBe("Carol is great! Thanks Carol!");
  });

  it("handles missing link gracefully", () => {
    const result = renderMessage("Check out {link}", {});
    expect(result).toBe("Check out ");
  });

  it("handles template with no placeholders", () => {
    const result = renderMessage("Thanks for your comment!", { name: "Dave" });
    expect(result).toBe("Thanks for your comment!");
  });
});

describe("Comment-to-DM Funnel - Funnel Logic", () => {
  it("first matching keyword wins", () => {
    const keywords = [
      { keyword: "fire", matchType: "contains" as const, caseSensitive: false },
      { keyword: "link", matchType: "contains" as const, caseSensitive: false },
    ];
    const comment = "FIRE and link please";
    const matched = keywords.find((kw) =>
      matchesKeyword(comment, kw.keyword, kw.matchType, kw.caseSensitive)
    );
    expect(matched?.keyword).toBe("fire");
  });

  it("no match returns undefined", () => {
    const keywords = [
      { keyword: "fire", matchType: "contains" as const, caseSensitive: false },
    ];
    const comment = "great video!";
    const matched = keywords.find((kw) =>
      matchesKeyword(comment, kw.keyword, kw.matchType, kw.caseSensitive)
    );
    expect(matched).toBeUndefined();
  });

  it("conversion rate calculation", () => {
    const triggers = 100;
    const conversions = 15;
    const rate = triggers > 0 ? Math.round((conversions / triggers) * 1000) / 10 : 0;
    expect(rate).toBe(15);
  });

  it("handles zero triggers gracefully", () => {
    const triggers = 0;
    const conversions = 0;
    const rate = triggers > 0 ? Math.round((conversions / triggers) * 1000) / 10 : 0;
    expect(rate).toBe(0);
  });
});
