import { describe, expect, it } from "vitest";
import { QUOTES, quoteForDate } from "./quotes";

describe("quoteForDate", () => {
  it("gives the same quote all day", () => {
    expect(quoteForDate("2026-09-24")).toEqual(quoteForDate("2026-09-24"));
  });

  it("moves to the next quote the next day", () => {
    const today = quoteForDate("2026-09-24");
    const tomorrow = quoteForDate("2026-09-25");
    expect(tomorrow).not.toEqual(today);
  });

  it("wraps around the list instead of running out", () => {
    const first = quoteForDate("2026-09-24");
    const afterOneLap = quoteForDate(
      new Date(Date.UTC(2026, 8, 24) + QUOTES.length * 86400000).toISOString().slice(0, 10),
    );
    expect(afterOneLap).toEqual(first);
  });

  it("credits a character and an anime for every quote", () => {
    for (const quote of QUOTES) {
      expect(quote.text.length).toBeGreaterThan(0);
      expect(quote.character.length).toBeGreaterThan(0);
      expect(quote.anime.length).toBeGreaterThan(0);
    }
  });
});
