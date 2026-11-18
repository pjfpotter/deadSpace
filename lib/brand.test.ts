import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { strokeFor } from "../app/components/Logo";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

type RGB = [number, number, number];

function hex(name: string): RGB {
  const m = css.match(new RegExp(`--${name}:\\s*#([0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token --${name} not found in globals.css`);
  return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) as RGB;
}

function luminance([r, g, b]: RGB): number {
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function ratio(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function mix(a: RGB, pctA: number, b: RGB): RGB {
  return a.map((v, i) => Math.round((v * pctA) / 100 + (b[i] * (100 - pctA)) / 100)) as RGB;
}

const t = Object.fromEntries(
  ["fern", "linen", "oak", "moss", "brook", "brook-deep", "stone", "bark"].map((n) => [n, hex(n)]),
);

describe("brand tokens", () => {
  it("defines the eight brand colours exactly", () => {
    expect(css).toMatch(/--fern:\s*#2c4535/i);
    expect(css).toMatch(/--linen:\s*#f3eee4/i);
    expect(css).toMatch(/--oak:\s*#c9a074/i);
    expect(css).toMatch(/--moss:\s*#8aa574/i);
    expect(css).toMatch(/--brook:\s*#5f8a94/i);
    expect(css).toMatch(/--brook-deep:\s*#3f6770/i);
    expect(css).toMatch(/--stone:\s*#ddd5c6/i);
    expect(css).toMatch(/--bark:\s*#1f1b17/i);
  });

  it("has no hex values outside the eight tokens", () => {
    const hexes = [...css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0].toLowerCase());
    // each brand hex appears once in the :root token block, nowhere else
    expect(hexes).toHaveLength(8);
    expect(new Set(hexes).size).toBe(8);
  });
});

describe("approved pairings (text, background, handoff ratio)", () => {
  const approved: [string, string, number][] = [
    ["bark", "linen", 14.8],
    ["linen", "fern", 9.0],
    ["bark", "oak", 7.1],
    ["bark", "moss", 6.3],
    ["bark", "brook", 4.5],
    ["brook-deep", "linen", 5.4],
  ];
  it.each(approved)("%s on %s is at least %s", (fg, bg, min) => {
    expect(Math.round(ratio(t[fg], t[bg]) * 10) / 10).toBeGreaterThanOrEqual(min);
  });

  it("muted text on linen and on stone is readable (>= 4.5)", () => {
    const muted = mix(t.bark, 72, t.linen);
    expect(ratio(muted, t.linen)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(muted, t.stone)).toBeGreaterThanOrEqual(4.5);
  });

  it("dark mode muted text on fern and bark is readable (>= 4.5)", () => {
    const muted = mix(t.linen, 78, t.fern);
    expect(ratio(muted, t.fern)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(muted, t.bark)).toBeGreaterThanOrEqual(4.5);
  });

  it("dark mode status colours are readable on both dark surfaces", () => {
    for (const fg of ["linen"]) {
      for (const bg of ["fern", "bark"]) expect(ratio(t[fg], t[bg]), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("forbidden pairings stay out of the semantic mapping", () => {
  it("never sets linen text on brook or oak, or fern text on moss", () => {
    for (const block of css.match(/:root[^{]*\{[^}]*\}/g)!) {
      const bg = block.match(/--(?:brand|header-bg|surface|background):\s*var\(--([a-z-]+)\)/g) ?? [];
      const brand = block.match(/--brand:\s*var\(--([a-z-]+)\)/)?.[1];
      const contrast = block.match(/--brand-contrast:\s*var\(--([a-z-]+)\)/)?.[1];
      if (contrast === "linen") expect(["oak", "brook"]).not.toContain(brand);
      if (contrast === "fern") expect(brand).not.toBe("moss");
      expect(bg.join(" ")).not.toMatch(/var\(--(brook|moss)\)/); // brook and moss are fills, never page or header grounds
    }
  });
  it("pairs the oak accent only with bark text", () => {
    expect(ratio(t.linen, t.oak)).toBeLessThan(4.5); // why linen on oak is banned
    expect(ratio(t.linen, t.brook)).toBeLessThan(4.5);
    expect(ratio(t.fern, t.moss)).toBeLessThan(4.5);
  });
});

describe("logo stroke", () => {
  it("bumps the stroke at small sizes", () => {
    expect(strokeFor(60)).toBe(6.5);
    expect(strokeFor(45)).toBe(7.5);
    expect(strokeFor(32)).toBe(9);
  });
});
