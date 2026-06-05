import type { ColorAnalysisResult, ColorSwatch, Pixel, WaveformData, WaveformScope } from "../types";
import { computeWaveformScope } from "./waveformScope";

const BINS = 256;

function luma(p: Pixel): number {
  return 0.299 * p.r + 0.587 * p.g + 0.114 * p.b;
}

/** 亮度波形：256 档归一化分布 */
export function computeLumaWaveform(pixels: Pixel[]): number[] {
  const hist = new Array(BINS).fill(0);
  for (const p of pixels) {
    const bin = Math.min(BINS - 1, Math.floor(luma(p)));
    hist[bin]++;
  }
  const total = pixels.length || 1;
  return hist.map((v) => v / total);
}

/** RGB Parade：三通道波形 */
export function computeRgbParade(pixels: Pixel[]): { r: number[]; g: number[]; b: number[] } {
  const rH = new Array(BINS).fill(0);
  const gH = new Array(BINS).fill(0);
  const bH = new Array(BINS).fill(0);
  for (const p of pixels) {
    rH[Math.min(BINS - 1, p.r)]++;
    gH[Math.min(BINS - 1, p.g)]++;
    bH[Math.min(BINS - 1, p.b)]++;
  }
  const total = pixels.length || 1;
  return {
    r: rH.map((v) => v / total),
    g: gH.map((v) => v / total),
    b: bH.map((v) => v / total),
  };
}

export function buildWaveformData(pixels: Pixel[], scope?: WaveformScope): WaveformData {
  const parade = computeRgbParade(pixels);
  return {
    luma: computeLumaWaveform(pixels),
    r: parade.r,
    g: parade.g,
    b: parade.b,
    scope,
  };
}

function buildCdf(hist: number[]): number[] {
  const cdf = new Array(BINS).fill(0);
  let sum = 0;
  for (let i = 0; i < BINS; i++) {
    sum += hist[i];
    cdf[i] = sum;
  }
  cdf[BINS - 1] = 1;
  return cdf;
}

/** 波形匹配：源 CDF → 目标 CDF 映射曲线 */
export function matchWaveform(sourceHist: number[], targetHist: number[]): number[] {
  const srcCdf = buildCdf(sourceHist);
  const tgtCdf = buildCdf(targetHist);
  const curve = new Array(BINS).fill(0);

  for (let i = 0; i < BINS; i++) {
    const s = srcCdf[i];
    let j = 0;
    while (j < BINS - 1 && tgtCdf[j] < s) j++;
    curve[i] = j;
  }
  return curve;
}

function uniformHist(): number[] {
  return new Array(BINS).fill(1 / BINS);
}

function applyCurve(v: number, curve: number[]): number {
  const idx = Math.min(BINS - 1, Math.max(0, Math.floor(v)));
  return curve[idx] / 255;
}

function dominantFromPixels(pixels: Pixel[]): ColorSwatch[] {
  const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();
  for (const p of pixels) {
    const qr = Math.floor(p.r / 48) * 48;
    const qg = Math.floor(p.g / 48) * 48;
    const qb = Math.floor(p.b / 48) * 48;
    const key = `${qr},${qg},${qb}`;
    const b = buckets.get(key);
    if (b) b.count++;
    else buckets.set(key, { r: qr, g: qg, b: qb, count: 1 });
  }
  const total = pixels.length || 1;
  return [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((b) => ({
      hex: `#${b.r.toString(16).padStart(2, "0")}${b.g.toString(16).padStart(2, "0")}${b.b.toString(16).padStart(2, "0")}`,
      weight: b.count / total,
      label: b.r > b.b ? "暖色" : b.b > b.r ? "冷色" : "中性",
    }));
}

function generateLutCubeFromCurves(
  lumaCurve: number[],
  rCurve: number[],
  gCurve: number[],
  bCurve: number[],
): string {
  let cube = 'TITLE "Simcut Waveform Matched LUT"\nLUT_3D_SIZE 33\n\n';
  for (let bi = 0; bi < 33; bi++) {
    for (let gi = 0; gi < 33; gi++) {
      for (let ri = 0; ri < 33; ri++) {
        let r = (ri / 32) * 255;
        let g = (gi / 32) * 255;
        let b = (bi / 32) * 255;

        const y = luma({ r, g, b });
        const yMapped = applyCurve(y, lumaCurve) * 255;
        if (y > 1) {
          const scale = yMapped / y;
          r = Math.min(255, r * scale);
          g = Math.min(255, g * scale);
          b = Math.min(255, b * scale);
        }

        r = applyCurve(r, rCurve) * 255;
        g = applyCurve(g, gCurve) * 255;
        b = applyCurve(b, bCurve) * 255;

        cube += `${(r / 255).toFixed(6)} ${(g / 255).toFixed(6)} ${(b / 255).toFixed(6)}\n`;
      }
    }
  }
  return cube;
}

export interface WaveformMatchOptions {
  referencePixels: Pixel[];
  sourcePixels?: Pixel[];
  referenceScope?: WaveformScope;
}

/** 色彩波形匹配解析 */
export function analyzeWithWaveformMatch(opts: WaveformMatchOptions): ColorAnalysisResult {
  const { referencePixels, sourcePixels, referenceScope } = opts;
  const refWf = buildWaveformData(referencePixels, referenceScope);
  const srcWf = sourcePixels
    ? buildWaveformData(sourcePixels)
    : { luma: uniformHist(), r: uniformHist(), g: uniformHist(), b: uniformHist() };

  const lumaCurve = matchWaveform(srcWf.luma, refWf.luma);
  const rCurve = matchWaveform(srcWf.r, refWf.r);
  const gCurve = matchWaveform(srcWf.g, refWf.g);
  const bCurve = matchWaveform(srcWf.b, refWf.b);

  const lutCube = generateLutCubeFromCurves(lumaCurve, rCurve, gCurve, bCurve);
  const dominant = dominantFromPixels(referencePixels);

  const avgR = referencePixels.reduce((s, p) => s + p.r, 0) / (referencePixels.length || 1);
  const avgB = referencePixels.reduce((s, p) => s + p.b, 0) / (referencePixels.length || 1);
  const temperature = Math.max(-1, Math.min(1, (avgR - avgB) / 255));

  let lumMin = 255;
  let lumMax = 0;
  for (const p of referencePixels) {
    const y = luma(p);
    if (y < lumMin) lumMin = y;
    if (y > lumMax) lumMax = y;
  }
  const contrast = (lumMax - lumMin) / 255;

  let satSum = 0;
  for (const p of referencePixels) {
    const rf = p.r / 255;
    const gf = p.g / 255;
    const bf = p.b / 255;
    const max = Math.max(rf, gf, bf);
    const min = Math.min(rf, gf, bf);
    satSum += max > 0 ? (max - min) / max : 0;
  }
  const saturation = satSum / (referencePixels.length || 1);

  const systemName = sourcePixels ? "波形匹配 LUT" : "参考波形 LUT";
  const colorSystem = {
    name: systemName,
    description: `亮度波形 + RGB Parade 匹配 · 色温 ${(6500 + temperature * 2000).toFixed(0)}K · 对比 ${(contrast * 100).toFixed(0)}%`,
    palette: dominant,
    temperature,
    contrast,
    saturation,
  };

  const moodTags: string[] = ["波形匹配"];
  if (temperature > 0.12) moodTags.push("暖调");
  if (temperature < -0.12) moodTags.push("冷调");
  if (contrast > 0.45) moodTags.push("高对比");
  if (saturation < 0.3) moodTags.push("低饱和");

  return {
    dominantColors: dominant,
    colorSystem,
    suggestedLut: {
      id: `lut-wf-${Date.now().toString(16)}`,
      name: `${systemName}`,
      source: sourcePixels ? "waveform-match" : "waveform-reference",
      colorSystem,
      lutCube,
    },
    moodTags,
    waveform: refWf,
    matchCurves: { luma: lumaCurve, r: rCurve, g: gCurve, b: bCurve },
  };
}

export interface ImagePixelData {
  pixels: Pixel[];
  scope: WaveformScope;
}

export function loadImagePixels(file: File): Promise<ImagePixelData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 512 / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.floor(img.width * scale));
      canvas.height = Math.max(1, Math.floor(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas 不可用"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const scope = computeWaveformScope(imageData.data, canvas.width, canvas.height);
      const pixels: Pixel[] = [];
      const step = Math.max(4, Math.floor((canvas.width * canvas.height) / 65536) * 4);
      for (let i = 0; i < imageData.data.length; i += step) {
        pixels.push({
          r: imageData.data[i],
          g: imageData.data[i + 1],
          b: imageData.data[i + 2],
        });
      }
      URL.revokeObjectURL(url);
      resolve({ pixels, scope });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("无法加载图片"));
    };
    img.src = url;
  });
}
