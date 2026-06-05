import type { ColorAnalysisResult, ColorSwatch } from "../types";

function classifyColor(r: number, g: number, b: number): string {
  if (r > 200 && g > 200 && b > 200) return "高光";
  if (r < 40 && g < 40 && b < 40) return "暗部";
  if (r > g && r > b) return "暖色";
  if (b > r && b > g) return "冷色";
  if (g > r && g > b) return "自然";
  return "中性";
}

function deriveMoodTags(temp: number, contrast: number, sat: number): string[] {
  const tags: string[] = [];
  if (temp > 0.15) tags.push("温暖");
  if (temp < -0.15) tags.push("清冷");
  if (contrast > 0.5) tags.push("戏剧");
  if (sat < 0.3) tags.push("文艺");
  if (sat > 0.5) tags.push("鲜活");
  if (tags.length === 0) tags.push("自然");
  return tags;
}

function generateLutCube(
  palette: ColorSwatch[],
  temperature: number,
  contrast: number,
  saturation: number,
): string {
  let cube = 'TITLE "Simcut Adaptive LUT"\nLUT_3D_SIZE 17\n\n';
  for (let b = 0; b < 17; b++) {
    for (let g = 0; g < 17; g++) {
      for (let r = 0; r < 17; r++) {
        let rr = r / 16;
        let gg = g / 16;
        let bb = b / 16;
        rr += temperature * 0.08;
        bb -= temperature * 0.08;
        const mid = 0.5;
        rr = mid + (rr - mid) * (1 + contrast * 0.3);
        gg = mid + (gg - mid) * (1 + contrast * 0.3);
        bb = mid + (bb - mid) * (1 + contrast * 0.3);
        const primary = palette[0];
        if (primary) {
          const pr = parseInt(primary.hex.slice(1, 3), 16) / 255;
          const pg = parseInt(primary.hex.slice(3, 5), 16) / 255;
          const pb = parseInt(primary.hex.slice(5, 7), 16) / 255;
          const blend = saturation * 0.15;
          rr = rr * (1 - blend) + pr * blend;
          gg = gg * (1 - blend) + pg * blend;
          bb = bb * (1 - blend) + pb * blend;
        }
        cube += `${Math.min(1, Math.max(0, rr)).toFixed(6)} ${Math.min(1, Math.max(0, gg)).toFixed(6)} ${Math.min(1, Math.max(0, bb)).toFixed(6)}\n`;
      }
    }
  }
  return cube;
}

export function analyzePixels(pixels: { r: number; g: number; b: number }[]): ColorAnalysisResult {
  const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();
  for (const { r, g, b } of pixels) {
    const qr = Math.floor(r / 64) * 64;
    const qg = Math.floor(g / 64) * 64;
    const qb = Math.floor(b / 64) * 64;
    const key = `${qr},${qg},${qb}`;
    const bkt = buckets.get(key);
    if (bkt) bkt.count++;
    else buckets.set(key, { r: qr, g: qg, b: qb, count: 1 });
  }

  const sorted = [...buckets.values()].sort((a, b) => b.count - a.count);
  const total = pixels.length || 1;
  const dominant: ColorSwatch[] = sorted.slice(0, 5).map((b) => ({
    hex: `#${b.r.toString(16).padStart(2, "0")}${b.g.toString(16).padStart(2, "0")}${b.b.toString(16).padStart(2, "0")}`,
    weight: b.count / total,
    label: classifyColor(b.r, b.g, b.b),
  }));

  const avgR = pixels.reduce((s, p) => s + p.r, 0) / total;
  const avgB = pixels.reduce((s, p) => s + p.b, 0) / total;
  const temperature = Math.max(-1, Math.min(1, (avgR - avgB) / 255));
  const lum = pixels.map((p) => 0.299 * p.r + 0.587 * p.g + 0.114 * p.b);
  const contrast = (Math.max(...lum) - Math.min(...lum)) / 255;
  let satSum = 0;
  for (const p of pixels) {
    const rf = p.r / 255;
    const gf = p.g / 255;
    const bf = p.b / 255;
    const max = Math.max(rf, gf, bf);
    const min = Math.min(rf, gf, bf);
    satSum += max > 0 ? (max - min) / max : 0;
  }
  const saturation = satSum / total;

  const systemName =
    temperature > 0.15
      ? "暖调电影感"
      : temperature < -0.15
        ? "冷调清冷感"
        : saturation < 0.25
          ? "低饱和文艺"
          : "自然写实";

  const colorSystem = {
    name: systemName,
    description: `色温 ${(6500 + temperature * 2000).toFixed(0)}K 倾向，对比度 ${(contrast * 100).toFixed(0)}%，饱和度 ${(saturation * 100).toFixed(0)}%`,
    palette: dominant,
    temperature,
    contrast,
    saturation,
  };

  const moodTags = deriveMoodTags(temperature, contrast, saturation);
  const lutCube = generateLutCube(dominant, temperature, contrast, saturation);

  return {
    dominantColors: dominant,
    colorSystem,
    suggestedLut: {
      id: `lut-${Date.now().toString(16)}`,
      name: `${systemName} 自适应 LUT`,
      source: "photo-analysis",
      colorSystem,
      lutCube,
    },
    moodTags,
  };
}

export function analyzeImageFile(file: File): Promise<ColorAnalysisResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 256 / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.floor(img.width * scale));
      canvas.height = Math.max(1, Math.floor(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas 不可用"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const pixels: { r: number; g: number; b: number }[] = [];
      for (let i = 0; i < data.length; i += 16) {
        pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
      }
      URL.revokeObjectURL(url);
      resolve(analyzePixels(pixels));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("无法加载图片"));
    };
    img.src = url;
  });
}
