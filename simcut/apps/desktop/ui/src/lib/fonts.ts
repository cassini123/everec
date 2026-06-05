export interface FontPreset {
  id: string;
  family: string;
  googleSpec: string;
  label: string;
  desc: string;
  category: string;
  sample: string;
  weight: number;
}

/** 10 款真实 Web 字体（Google Fonts 加载） */
export const FONT_PRESETS: FontPreset[] = [
  {
    id: "noto-sans",
    family: "Noto Sans SC",
    googleSpec: "Noto+Sans+SC:wght@400;700",
    label: "思源黑体",
    desc: "中文 UI 正文",
    category: "中文无衬线",
    sample: "超短篇，轻量出片",
    weight: 700,
  },
  {
    id: "noto-serif",
    family: "Noto Serif SC",
    googleSpec: "Noto+Serif+SC:wght@400;700",
    label: "思源宋体",
    desc: "文艺衬线",
    category: "中文衬线",
    sample: "胶片质感，叙事剪辑",
    weight: 700,
  },
  {
    id: "ma-shan",
    family: "Ma Shan Zheng",
    googleSpec: "Ma+Shan+Zheng",
    label: "马善政楷",
    desc: "书法韵味",
    category: "中文书法",
    sample: "古风短片字幕",
    weight: 400,
  },
  {
    id: "zcool",
    family: "ZCOOL KuaiLe",
    googleSpec: "ZCOOL+KuaiLe",
    label: "站酷快乐体",
    desc: "活泼标题",
    category: "中文标题",
    sample: "Vlog 片头标题",
    weight: 400,
  },
  {
    id: "inter",
    family: "Inter",
    googleSpec: "Inter:wght@400;700",
    label: "Inter",
    desc: "现代西文 UI",
    category: "西文无衬线",
    sample: "Quick Cut Export",
    weight: 700,
  },
  {
    id: "playfair",
    family: "Playfair Display",
    googleSpec: "Playfair+Display:wght@400;700",
    label: "Playfair",
    desc: "高端衬线",
    category: "西文衬线",
    sample: "Cinematic Story",
    weight: 700,
  },
  {
    id: "oswald",
    family: "Oswald",
    googleSpec: "Oswald:wght@400;700",
    label: "Oswald",
    desc: "窄体标题",
    category: "西文标题",
    sample: "BREAKING NEWS",
    weight: 700,
  },
  {
    id: "bebas",
    family: "Bebas Neue",
    googleSpec: "Bebas+Neue",
    label: "Bebas Neue",
    desc: "全大写冲击",
    category: "西文强调",
    sample: "EPISODE 01",
    weight: 400,
  },
  {
    id: "jetbrains",
    family: "JetBrains Mono",
    googleSpec: "JetBrains+Mono:wght@400;700",
    label: "JetBrains Mono",
    desc: "等宽字幕",
    category: "等宽",
    sample: "00:01:23:12",
    weight: 400,
  },
  {
    id: "dancing",
    family: "Dancing Script",
    googleSpec: "Dancing+Script:wght@400;700",
    label: "Dancing Script",
    desc: "手写花体",
    category: "手写",
    sample: "Sweet Moments",
    weight: 700,
  },
];

let fontsLoaded = false;

export async function loadWebFonts(): Promise<void> {
  if (fontsLoaded) return;

  const families = FONT_PRESETS.map((f) => f.googleSpec).join("&family=");
  const href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;

  await new Promise<void>((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error("字体加载失败"));
    document.head.appendChild(link);
  });

  await Promise.all(
    FONT_PRESETS.map((f) =>
      document.fonts.load(`${f.weight} 32px "${f.family}"`).catch(() => undefined),
    ),
  );

  fontsLoaded = true;
}

export function resolvePreviewKind(
  media: { kind?: string; mimeType?: string; fileName: string },
): "video" | "image" {
  if (media.kind === "image") return "image";
  if (media.kind === "video") return "video";
  const mime = media.mimeType ?? "";
  if (mime.startsWith("image/")) return "image";
  const ext = media.fileName.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "webp", "gif", "bmp"].includes(ext)) return "image";
  if (ext === "heic" || ext === "heif") return "image";
  return "video";
}
