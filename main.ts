// news-image-20261118 round 3 — "THE WORLD TODAY"
// One-day world news front page for Wednesday 18 November 2026.
// Pure Node 22 stdlib: draws a 1024x1024 PNG with a hand-written
// bitmap font and a hand-written PNG encoder (zlib). No network,
// no randomness, no clock: two runs write identical bytes.

import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

// ---------------------------------------------------------------- font 5x7
// Each glyph: 7 rows of 5 cells, "#" = ink. Uppercase only; all copy in
// the image is set in capitals, newspaper style.
const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11100", "10010", "10001", "10001", "10001", "10010", "11100"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  '"': ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "%": ["10001", "10010", "00010", "00100", "01000", "01001", "10001"],
  $: ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "+": ["00000", "00100", "00100", "01110", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  "*": ["00000", "10101", "01110", "11111", "01110", "10101", "00000"],
  "#": ["01010", "01010", "11111", "01010", "11111", "01010", "01010"],
  _: ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
  "@": ["01110", "10001", "10111", "10101", "10110", "10000", "01110"],
  "\u00b7": ["00000", "00000", "01100", "01100", "01100", "00000", "00000"],
  "\u00d7": ["00000", "10001", "01010", "00100", "01010", "10001", "00000"],
};

// ---------------------------------------------------------------- raster
const W = 1024;
const H = 1024;
const img = Buffer.alloc(W * H * 3);

type RGB = [number, number, number];

const PAPER: RGB = [247, 243, 234];
const INK: RGB = [17, 24, 39];
const NAVY: RGB = [13, 32, 56];
const NAVY2: RGB = [21, 48, 80];
const GOLD: RGB = [212, 160, 23];
const RED: RGB = [185, 28, 28];
const GREY: RGB = [107, 114, 128];
const LIGHTGREY: RGB = [209, 213, 219];
const WHITE: RGB = [255, 255, 255];
const CARD: RGB = [255, 255, 255];

function px(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  img[i] = c[0];
  img[i + 1] = c[1];
  img[i + 2] = c[2];
}

function rect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) px(xx, yy, c);
  }
}

function hline(x0: number, x1: number, y: number, c: RGB): void {
  for (let x = x0; x <= x1; x++) px(x, y, c);
}

function vline(x: number, y0: number, y1: number, c: RGB): void {
  for (let y = y0; y <= y1; y++) px(x, y, c);
}

// Bresenham line.
function line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    px(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

function disc(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y));
    for (let x = -half; x <= half; x++) px(cx + x, cy + y, c);
  }
}

function ring(cx: number, cy: number, r: number, t: number, c: RGB): void {
  for (let a = 0; a < 360; a += 1) {
    const rad = (a * Math.PI) / 180;
    for (let k = 0; k < t; k++) {
      px(Math.round(cx + (r - k) * Math.cos(rad)), Math.round(cy + (r - k) * Math.sin(rad)), c);
    }
  }
}

function ellipse(cx: number, cy: number, rx: number, ry: number, c: RGB): void {
  for (let y = -ry; y <= ry; y++) {
    const half = Math.floor((rx * Math.sqrt(ry * ry - y * y)) / ry);
    for (let x = -half; x <= half; x++) px(cx + x, cy + y, c);
  }
}

// ---------------------------------------------------------------- text
function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}

function drawText(s: string, x: number, y: number, scale: number, c: RGB): number {
  let cx = x;
  for (const ch of s.toUpperCase()) {
    const g = FONT[ch] ?? FONT["?"];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === "1") rect(cx + col * scale, y + r * scale, scale, scale, c);
      }
    }
    cx += 6 * scale;
  }
  return cx - x;
}

function drawTextCentered(s: string, cx: number, y: number, scale: number, c: RGB): void {
  drawText(s, cx - Math.floor(textWidth(s, scale) / 2), y, scale, c);
}

function wrap(s: string, maxW: number, scale: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? cur + " " + w : w;
    if (textWidth(next, scale) <= maxW || !cur) {
      cur = next;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawBlock(lines: string[], x: number, y: number, scale: number, c: RGB, gap = 2): number {
  let yy = y;
  for (const ln of lines) {
    drawText(ln, x, yy, scale, c);
    yy += 7 * scale + gap;
  }
  return yy;
}

// ---------------------------------------------------------------- icons
// Each icon is drawn inside a square of side s at (x, y), in white on a
// coloured tile (the tile is drawn by the caller).

function iconShip(x: number, y: number, s: number, c: RGB): void {
  const u = s / 48;
  // hull
  const pts: [number, number][] = [];
  for (let i = 0; i <= 10; i++) pts.push([x + 6 * u + i * 3.6 * u, y + 30 * u + (i < 5 ? i * 1.2 * u : (10 - i) * 1.2 * u)]);
  for (let i = 0; i < pts.length - 1; i++) line(Math.round(pts[i][0]), Math.round(pts[i][1]), Math.round(pts[i + 1][0]), Math.round(pts[i + 1][1]), c);
  rect(Math.round(x + 8 * u), Math.round(y + 30 * u), Math.round(32 * u), Math.round(2 * u), c);
  // cabin + funnel
  rect(Math.round(x + 18 * u), Math.round(y + 20 * u), Math.round(12 * u), Math.round(10 * u), c);
  rect(Math.round(x + 30 * u), Math.round(y + 14 * u), Math.round(5 * u), Math.round(16 * u), c);
  // missile arc above
  line(Math.round(x + 10 * u), Math.round(y + 12 * u), Math.round(x + 26 * u), Math.round(y + 4 * u), c);
  line(Math.round(x + 26 * u), Math.round(y + 4 * u), Math.round(x + 40 * u), Math.round(y + 10 * u), c);
  disc(Math.round(x + 40 * u), Math.round(y + 10 * u), Math.max(2, Math.round(2 * u)), c);
  // waves
  for (let k = 0; k < 3; k++) {
    const wy = Math.round(y + (38 + k * 3) * u);
    line(Math.round(x + 6 * u + k * 4 * u), wy, Math.round(x + 42 * u - k * 4 * u), wy, c);
  }
}

function iconBridge(x: number, y: number, s: number, c: RGB): void {
  const u = s / 48;
  // two towers
  rect(Math.round(x + 8 * u), Math.round(y + 10 * u), Math.round(5 * u), Math.round(28 * u), c);
  rect(Math.round(x + 35 * u), Math.round(y + 10 * u), Math.round(5 * u), Math.round(28 * u), c);
  // cables
  line(Math.round(x + 10 * u), Math.round(y + 12 * u), Math.round(x + 24 * u), Math.round(y + 30 * u), c);
  line(Math.round(x + 38 * u), Math.round(y + 12 * u), Math.round(x + 24 * u), Math.round(y + 30 * u), c);
  // deck, broken in the middle: left half and right half, gap + sag
  rect(Math.round(x + 2 * u), Math.round(y + 30 * u), Math.round(18 * u), Math.round(3 * u), c);
  rect(Math.round(x + 28 * u), Math.round(y + 30 * u), Math.round(18 * u), Math.round(3 * u), c);
  line(Math.round(x + 20 * u), Math.round(y + 31 * u), Math.round(x + 24 * u), Math.round(y + 40 * u), c);
  line(Math.round(x + 28 * u), Math.round(y + 31 * u), Math.round(x + 24 * u), Math.round(y + 40 * u), c);
  // water
  line(Math.round(x + 4 * u), Math.round(y + 43 * u), Math.round(x + 44 * u), Math.round(y + 43 * u), c);
}

function iconBallot(x: number, y: number, s: number, c: RGB): void {
  const u = s / 48;
  rect(Math.round(x + 10 * u), Math.round(y + 18 * u), Math.round(28 * u), Math.round(22 * u), c);
  rect(Math.round(x + 8 * u), Math.round(y + 14 * u), Math.round(32 * u), Math.round(4 * u), c);
  // slot
  rect(Math.round(x + 19 * u), Math.round(y + 15 * u), Math.round(10 * u), Math.round(2 * u), INK);
  // ballot paper going in
  rect(Math.round(x + 20 * u), Math.round(y + 4 * u), Math.round(9 * u), Math.round(12 * u), c);
  // check mark on the box
  line(Math.round(x + 16 * u), Math.round(y + 30 * u), Math.round(x + 21 * u), Math.round(y + 35 * u), WHITE);
  line(Math.round(x + 21 * u), Math.round(y + 35 * u), Math.round(x + 32 * u), Math.round(y + 23 * u), WHITE);
  // star above
  disc(Math.round(x + 38 * u), Math.round(y + 8 * u), Math.max(2, Math.round(2.5 * u)), c);
}

function iconVirus(x: number, y: number, s: number, c: RGB): void {
  const u = s / 48;
  const cx = x + 24 * u;
  const cy = y + 24 * u;
  for (let a = 0; a < 8; a++) {
    const rad = (a * Math.PI) / 4;
    const x1 = Math.round(cx + 12 * u * Math.cos(rad));
    const y1 = Math.round(cy + 12 * u * Math.sin(rad));
    const x2 = Math.round(cx + 18 * u * Math.cos(rad));
    const y2 = Math.round(cy + 18 * u * Math.sin(rad));
    line(x1, y1, x2, y2, c);
    disc(x2, y2, Math.max(2, Math.round(2 * u)), c);
  }
  disc(Math.round(cx), Math.round(cy), Math.round(12 * u), c);
  disc(Math.round(cx - 4 * u), Math.round(cy - 4 * u), Math.max(2, Math.round(3 * u)), WHITE);
  disc(Math.round(cx + 5 * u), Math.round(cy + 4 * u), Math.max(1, Math.round(2 * u)), WHITE);
}

function iconCyclone(x: number, y: number, s: number, c: RGB): void {
  const u = s / 48;
  const cx = x + 24 * u;
  const cy = y + 24 * u;
  // spiral arms: concentric arcs of increasing radius
  for (let r = 4; r <= 18; r += 4) {
    const start = (r * 40) % 360;
    for (let a = start; a < start + 200; a += 2) {
      const rad = (a * Math.PI) / 180;
      px(Math.round(cx + r * u * Math.cos(rad)), Math.round(cy + r * u * Math.sin(rad)), c);
      px(Math.round(cx + r * u * Math.cos(rad)) + 1, Math.round(cy + r * u * Math.sin(rad)), c);
    }
  }
  disc(Math.round(cx), Math.round(cy), Math.max(2, Math.round(3 * u)), c);
}

function iconSatellite(x: number, y: number, s: number, c: RGB): void {
  const u = s / 48;
  // dish
  line(Math.round(x + 8 * u), Math.round(y + 26 * u), Math.round(x + 20 * u), Math.round(y + 14 * u), c);
  line(Math.round(x + 20 * u), Math.round(y + 14 * u), Math.round(x + 32 * u), Math.round(y + 26 * u), c);
  line(Math.round(x + 8 * u), Math.round(y + 26 * u), Math.round(x + 32 * u), Math.round(y + 26 * u), c);
  // body + antenna
  rect(Math.round(x + 18 * u), Math.round(y + 26 * u), Math.round(4 * u), Math.round(8 * u), c);
  line(Math.round(x + 20 * u), Math.round(y + 26 * u), Math.round(x + 20 * u), Math.round(y + 38 * u), c);
  disc(Math.round(x + 20 * u), Math.round(y + 40 * u), Math.max(2, Math.round(2 * u)), c);
  // signal arcs
  ring(Math.round(x + 40 * u), Math.round(y + 10 * u), Math.round(5 * u), 1, c);
  ring(Math.round(x + 40 * u), Math.round(y + 10 * u), Math.round(9 * u), 1, c);
  // stars
  disc(Math.round(x + 6 * u), Math.round(y + 8 * u), 1, c);
  disc(Math.round(x + 42 * u), Math.round(y + 36 * u), 1, c);
  disc(Math.round(x + 34 * u), Math.round(y + 4 * u), 1, c);
}

function iconChip(x: number, y: number, s: number, c: RGB): void {
  const u = s / 48;
  rect(Math.round(x + 14 * u), Math.round(y + 14 * u), Math.round(20 * u), Math.round(20 * u), c);
  rect(Math.round(x + 19 * u), Math.round(y + 19 * u), Math.round(10 * u), Math.round(10 * u), WHITE);
  for (let k = 0; k < 4; k++) {
    const off = (16 + k * 5) * u;
    line(Math.round(x + off), Math.round(y + 8 * u), Math.round(x + off), Math.round(y + 14 * u), c);
    line(Math.round(x + off), Math.round(y + 34 * u), Math.round(x + off), Math.round(y + 40 * u), c);
    line(Math.round(x + 8 * u), Math.round(y + off), Math.round(x + 14 * u), Math.round(y + off), c);
    line(Math.round(x + 34 * u), Math.round(y + off), Math.round(x + 40 * u), Math.round(y + off), c);
  }
}

function iconPlane(x: number, y: number, s: number, c: RGB): void {
  const u = s / 48;
  // fuselage
  line(Math.round(x + 4 * u), Math.round(y + 24 * u), Math.round(x + 42 * u), Math.round(y + 24 * u), c);
  line(Math.round(x + 42 * u), Math.round(y + 24 * u), Math.round(x + 46 * u), Math.round(y + 22 * u), c);
  // wings
  line(Math.round(x + 20 * u), Math.round(y + 24 * u), Math.round(x + 14 * u), Math.round(y + 36 * u), c);
  line(Math.round(x + 20 * u), Math.round(y + 24 * u), Math.round(x + 28 * u), Math.round(y + 12 * u), c);
  // tail
  line(Math.round(x + 8 * u), Math.round(y + 24 * u), Math.round(x + 4 * u), Math.round(y + 14 * u), c);
  // engines
  disc(Math.round(x + 26 * u), Math.round(y + 28 * u), Math.max(2, Math.round(2.5 * u)), c);
  disc(Math.round(x + 32 * u), Math.round(y + 28 * u), Math.max(2, Math.round(2.5 * u)), c);
  // ground line
  line(Math.round(x + 4 * u), Math.round(y + 42 * u), Math.round(x + 44 * u), Math.round(y + 42 * u), c);
}

function iconShield(x: number, y: number, s: number, c: RGB): void {
  const u = s / 48;
  // shield outline
  line(Math.round(x + 12 * u), Math.round(y + 6 * u), Math.round(x + 36 * u), Math.round(y + 6 * u), c);
  line(Math.round(x + 12 * u), Math.round(y + 6 * u), Math.round(x + 12 * u), Math.round(y + 26 * u), c);
  line(Math.round(x + 36 * u), Math.round(y + 6 * u), Math.round(x + 36 * u), Math.round(y + 26 * u), c);
  line(Math.round(x + 12 * u), Math.round(y + 26 * u), Math.round(x + 24 * u), Math.round(y + 42 * u), c);
  line(Math.round(x + 36 * u), Math.round(y + 26 * u), Math.round(x + 24 * u), Math.round(y + 42 * u), c);
  // cross cut out (drawn in white)
  rect(Math.round(x + 22 * u), Math.round(y + 14 * u), Math.round(4 * u), Math.round(16 * u), WHITE);
  rect(Math.round(x + 16 * u), Math.round(y + 20 * u), Math.round(16 * u), Math.round(4 * u), WHITE);
  // small x mark: shield broken
  line(Math.round(x + 30 * u), Math.round(y + 12 * u), Math.round(x + 36 * u), Math.round(y + 18 * u), c);
  line(Math.round(x + 36 * u), Math.round(y + 12 * u), Math.round(x + 30 * u), Math.round(y + 18 * u), c);
}

function iconWave(x: number, y: number, s: number, c: RGB): void {
  const u = s / 48;
  // cloud
  disc(Math.round(x + 18 * u), Math.round(y + 16 * u), Math.round(8 * u), c);
  disc(Math.round(x + 28 * u), Math.round(y + 14 * u), Math.round(10 * u), c);
  disc(Math.round(x + 34 * u), Math.round(y + 20 * u), Math.round(7 * u), c);
  rect(Math.round(x + 12 * u), Math.round(y + 18 * u), Math.round(28 * u), Math.round(6 * u), c);
  // rain
  for (let k = 0; k < 4; k++) {
    const rx = Math.round(x + (14 + k * 7) * u);
    line(rx, Math.round(y + 28 * u), rx - 2, Math.round(y + 34 * u), c);
  }
  // waves
  for (let k = 0; k < 2; k++) {
    const wy = Math.round(y + (38 + k * 4) * u);
    for (let xx = 0; xx <= 36; xx += 2) {
      const yy = wy + Math.round(Math.sin((xx / 36) * Math.PI * 2 + k) * 2 * u);
      px(Math.round(x + 6 * u) + xx, yy, c);
    }
  }
}

// ---------------------------------------------------------------- flags
function flagUS(x: number, y: number, w: number, h: number): void {
  const stripe = h / 13;
  for (let i = 0; i < 13; i++) {
    rect(x, Math.round(y + i * stripe), w, Math.max(1, Math.ceil(stripe)), i % 2 === 0 ? RED : WHITE);
  }
  const cw = Math.round(w * 0.4);
  const ch = Math.round(h * (7 / 13));
  rect(x, y, cw, ch, NAVY2);
  for (let r = 0; r < 3; r++) {
    for (let col = 0; col < 4; col++) {
      px(x + 3 + col * 4, y + 2 + r * 3, WHITE);
    }
  }
}

function flagCN(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, RED);
  disc(x + Math.round(w * 0.18), y + Math.round(h * 0.25), 3, GOLD);
  disc(x + Math.round(w * 0.36), y + Math.round(h * 0.14), 2, GOLD);
  disc(x + Math.round(w * 0.44), y + Math.round(h * 0.28), 2, GOLD);
  disc(x + Math.round(w * 0.4), y + Math.round(h * 0.44), 2, GOLD);
  disc(x + Math.round(w * 0.28), y + Math.round(h * 0.5), 2, GOLD);
}

function flagRU(x: number, y: number, w: number, h: number): void {
  const third = Math.round(h / 3);
  rect(x, y, w, third, WHITE);
  rect(x, y + third, w, third, [0, 57, 166]);
  rect(x, y + 2 * third, w, h - 2 * third, RED);
}

// ---------------------------------------------------------------- layout
function fillPaper(): void {
  for (let i = 0; i < W * H; i++) {
    img[i * 3] = PAPER[0];
    img[i * 3 + 1] = PAPER[1];
    img[i * 3 + 2] = PAPER[2];
  }
}

function masthead(): void {
  rect(0, 0, W, 118, NAVY);
  rect(0, 114, W, 4, GOLD);
  drawTextCentered("THE WORLD TODAY", W / 2, 16, 6, WHITE);
  drawTextCentered("WEDNESDAY  \u00b7  18 NOVEMBER 2026", W / 2, 68, 3, GOLD);
  drawTextCentered("ONE DAY  \u00b7  ONE PAGE  \u00b7  THE WORLD'S NEWS", W / 2, 94, 2, [176, 190, 208]);
}

function hero(): void {
  const x = 24;
  const y = 132;
  const w = 976;
  const h = 306;
  rect(x, y, w, h, CARD);
  // border
  rect(x, y, w, 3, INK);
  rect(x, y + h - 3, w, 3, INK);
  rect(x, y, 3, h, INK);
  rect(x + w - 3, y, 3, h, INK);

  // --- scene band: Shenzhen sky at dusk, skyline, three flags
  const sx = x + 3;
  const sy = y + 3;
  const sw = w - 6;
  const sh = 118;
  rect(sx, sy, sw, sh, NAVY2);
  // sun
  disc(sx + sw - 90, sy + 34, 18, GOLD);
  // skyline silhouettes (deterministic heights)
  const heights = [52, 78, 44, 92, 60, 100, 48, 84, 56, 96, 40, 70, 88, 50, 76, 46, 64, 90, 58, 72];
  let bx = sx + 8;
  const bw = Math.floor((sw - 16) / heights.length);
  for (let i = 0; i < heights.length; i++) {
    const bh = heights[i];
    rect(bx, sy + sh - bh - 14, bw - 3, bh, NAVY);
    // lit windows: fixed pattern, no randomness
    for (let wy = sy + sh - bh - 8; wy < sy + sh - 18; wy += 9) {
      for (let wx = bx + 3; wx < bx + bw - 6; wx += 8) {
        if ((wx * 7 + wy * 13) % 11 < 4) px(wx, wy, GOLD);
      }
    }
    bx += bw;
  }
  // ground strip
  rect(sx, sy + sh - 14, sw, 14, [10, 22, 40]);
  // three flag poles with US / China / Russia flags
  const flagW = 64;
  const flagH = 40;
  const poleY0 = sy + 26;
  const poleY1 = sy + sh - 14;
  const centres = [sx + 150, sx + sw / 2, sx + sw - 150];
  const flags = [flagUS, flagCN, flagRU];
  const names = ["U.S.A.", "CHINA", "RUSSIA"];
  for (let i = 0; i < 3; i++) {
    const cx = centres[i];
    vline(cx, poleY0, poleY1, [200, 200, 200]);
    disc(cx, poleY0 - 3, 3, GOLD);
    flags[i](cx + 2, poleY0 + 2, flagW, flagH);
    drawTextCentered(names[i], cx + 2 + flagW / 2, poleY0 + flagH + 8, 2, WHITE);
  }

  // --- text under the scene
  const ty = y + 134;
  drawTextCentered("APEC  \u00b7  SHENZHEN, CHINA  -  THE DAY'S BIG PICTURE", W / 2, ty, 2, RED);
  drawTextCentered("THREE LEADERS, ONE TABLE", W / 2, ty + 30, 5, INK);
  drawTextCentered("XI GREETS TRUMP ON THE TARMAC;", W / 2, ty + 88, 2, [31, 41, 55]);
  drawTextCentered("THE FIRST TRUMP-XI-PUTIN SUMMIT IS SET FOR THURSDAY.", W / 2, ty + 110, 2, [31, 41, 55]);
  drawTextCentered(
    "XI AND PUTIN OPEN APEC TALKS AND DENOUNCE PROTECTIONISM AND SANCTIONS.",
    W / 2,
    ty + 132,
    2,
    [31, 41, 55],
  );
}

interface Card {
  tag: string;
  color: RGB;
  headline: string;
  summary: string;
  icon: (x: number, y: number, s: number, c: RGB) => void;
}

function gridCard(x: number, y: number, w: number, h: number, card: Card): void {
  rect(x, y, w, h, CARD);
  rect(x, y, w, 1, LIGHTGREY);
  rect(x, y + h - 1, w, 1, LIGHTGREY);
  rect(x, y, 1, h, LIGHTGREY);
  rect(x + w - 1, y, 1, h, LIGHTGREY);
  // region tag bar
  rect(x, y, w, 26, card.color);
  drawText(card.tag, x + 10, y + 6, 2, WHITE);
  // icon tile on the left
  const tile = 56;
  const ix = x + 10;
  const iy = y + 38;
  rect(ix, iy, tile, tile, card.color);
  card.icon(ix + 4, iy + 4, tile - 8, WHITE);
  // headline + summary to the right of the tile
  const tx = ix + tile + 10;
  const tw = x + w - 10 - tx;
  const headLines = wrap(card.headline, tw, 3);
  drawBlock(headLines, tx, y + 38, 3, INK, 1);
  const sumY = y + 38 + headLines.length * 23 + 6;
  const sumLines = wrap(card.summary, tw, 2);
  drawBlock(sumLines.slice(0, 4), tx, sumY, 2, [55, 65, 81], 2);
}

function grid(): void {
  const cards: Card[] = [
    {
      tag: "MIDDLE EAST",
      color: RED,
      headline: "U.S. STRIKES QESHM ISLAND",
      summary: "Iran fires drones at Bahrain and Kuwait in reply to the U.S. strike.",
      icon: iconShip,
    },
    {
      tag: "EUROPE",
      color: [30, 64, 175],
      headline: "KERCH BRIDGE HIT AGAIN",
      summary: "Ukraine strikes the Crimea link again; part of the road span falls.",
      icon: iconBridge,
    },
    {
      tag: "AMERICAS",
      color: [13, 148, 136],
      headline: "PELTOLA WINS ALASKA",
      summary: "Democrat beats Sullivan; Senate goes 56-44, the party's ninth flip.",
      icon: iconBallot,
    },
    {
      tag: "AFRICA",
      color: [126, 34, 206],
      headline: "EBOLA PASSES 11,000",
      summary: "DR Congo outbreak doubles in 3 months; 5,400 dead, children worst hit.",
      icon: iconVirus,
    },
    {
      tag: "PACIFIC",
      color: [234, 88, 12],
      headline: "XAVIER HITS CAT 5",
      summary: "Winds of 220 km/h lash the Northern Cook Islands; no deaths reported.",
      icon: iconCyclone,
    },
    {
      tag: "SPACE",
      color: [67, 56, 202],
      headline: "ONE LIGHT-DAY FROM EARTH",
      summary: "NASA probe reaches 16 billion miles, a first for a human-made object.",
      icon: iconSatellite,
    },
  ];
  const gx = 24;
  const gy = 452;
  const cw = 316;
  const ch = 196;
  const gap = 14;
  for (let i = 0; i < 6; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    gridCard(gx + col * (cw + gap), gy + row * (ch + gap), cw, ch, cards[i]);
  }
}

function alsoToday(): void {
  const x = 24;
  const y = 872;
  const w = 976;
  const h = 128;
  rect(x, y, w, h, CARD);
  rect(x, y, w, 1, LIGHTGREY);
  rect(x, y + h - 1, w, 1, LIGHTGREY);
  rect(x, y, 1, h, LIGHTGREY);
  rect(x + w - 1, y, 1, h, LIGHTGREY);
  drawText("ALSO TODAY", x + 12, y + 8, 2, RED);
  hline(x + 12, x + w - 12, y + 28, LIGHTGREY);

  const items: { tag: string; color: RGB; text: string; icon: (x: number, y: number, s: number, c: RGB) => void }[] = [
    {
      tag: "HEALTH",
      color: [190, 24, 93],
      text: "U.S. loses measles-free status; 5,412 cases in 2026.",
      icon: iconShield,
    },
    {
      tag: "MARKETS",
      color: [21, 128, 61],
      text: "Nvidia revenue doubles to $115.8bn after Huang exit.",
      icon: iconChip,
    },
    {
      tag: "RUSSIA",
      color: [55, 65, 81],
      text: "An-12 plane crashes in Siberia; all 19 aboard killed.",
      icon: iconPlane,
    },
    {
      tag: "WEATHER",
      color: [2, 132, 199],
      text: "Cyclone Akvan nears India's coast, landfall Friday.",
      icon: iconWave,
    },
  ];
  const colW = (w - 24) / 4;
  for (let i = 0; i < 4; i++) {
    const cx = x + 12 + i * colW;
    const it = items[i];
    rect(cx, y + 40, 30, 30, it.color);
    it.icon(cx + 3, y + 43, 24, WHITE);
    drawText(it.tag, cx + 38, y + 40, 2, it.color);
    const lines = wrap(it.text, colW - 12, 2);
    drawBlock(lines.slice(0, 3), cx, y + 78, 2, [31, 41, 55], 2);
    if (i < 3) vline(Math.round(cx + colW - 6), y + 38, y + h - 12, LIGHTGREY);
  }
  // sources line sits on the paper below the strip card, clear of the text
  drawTextCentered(
    "SOURCES: REUTERS  \u00b7  AFP  \u00b7  AP  \u00b7  NASA  \u00b7  PAHO  \u00b7  WHO  \u00b7  FIJI MET SERVICE",
    W / 2,
    y + h + 6,
    2,
    GREY,
  );
}

// ---------------------------------------------------------------- PNG encode
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    img.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const comp = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", comp),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- main
function main(): void {
  fillPaper();
  masthead();
  hero();
  grid();
  alsoToday();
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "entry.png");
  fs.writeFileSync(outPath, encodePng());
}

main();
