/** Style Dataset — global style knowledge seed (Everec PRD §5.5) */
export type StyleDatasetCategory =
  | "director"
  | "film"
  | "color_grade"
  | "shot_language"
  | "font"
  | "vfx"
  | "mood";

export interface StyleDatasetEntry {
  id: string;
  category: StyleDatasetCategory;
  name: string;
  nameZh: string;
  tags: string[];
  description: string;
  implementation: string;
  tools: string[];
}

export interface StyleDatasetMatch {
  entry: StyleDatasetEntry;
  score: number;
}

export const STYLE_DATASET: StyleDatasetEntry[] = [
  {
    id: "dir-wkw",
    category: "director",
    name: "Wong Kar-wai",
    nameZh: "王家卫",
    tags: ["怀旧", "暖色", "慢节奏", "手持", "step print"],
    description: "step printing 拖影、暖黄/绿色调、慢快门情绪",
    implementation: "降帧拍摄 +  step print 或后期帧混合；暖色 LUT + 轻微拖影",
    tools: ["DaVinci Resolve", "After Effects"],
  },
  {
    id: "dir-villeneuve",
    category: "director",
    name: "Denis Villeneuve",
    nameZh: "丹尼斯·维伦纽瓦",
    tags: ["极简", "大构图", "低饱和", "对称", "科幻"],
    description: "大面积留白、对称构图、低饱和冷调",
    implementation: "宽银幕裁切 + 低饱和调色 + 对称构图取景",
    tools: ["DaVinci Resolve", "Premiere Pro"],
  },
  {
    id: "film-blade-runner",
    category: "film",
    name: "Blade Runner 2049",
    nameZh: "银翼杀手 2049",
    tags: ["赛博朋克", "霓虹", "冷色调", "大远景", "Roger Deakins"],
    description: "橙雾与冷蓝对比、巨大负空间、霓虹点缀",
    implementation: "Teal/Orange 分离 + 体积光 + 大广角建立镜头",
    tools: ["DaVinci Resolve", "Nuke"],
  },
  {
    id: "film-in-mood",
    category: "film",
    name: "In the Mood for Love",
    nameZh: "花样年华",
    tags: ["怀旧", "旗袍", "暖色", "慢镜", "孤独"],
    description: "窄走廊构图、暖黄灯光、慢节奏叙事",
    implementation: "长焦压缩空间 + 暖色钨丝灯还原 + 慢推镜",
    tools: ["DaVinci Resolve", "Lightroom"],
  },
  {
    id: "film-a24",
    category: "film",
    name: "A24 aesthetic",
    nameZh: "A24 美学",
    tags: ["独立电影", "自然光", "低预算感", "情绪", "留白"],
    description: "自然光为主、浅景深、情绪驱动、非常规构图",
    implementation: "可用光拍摄 + 轻微降饱和 + 手持微晃",
    tools: ["DaVinci Resolve", "Capture One"],
  },
  {
    id: "color-teal-orange",
    category: "color_grade",
    name: "Teal & Orange",
    nameZh: "青橙对比",
    tags: ["商业", "好莱坞", "对比", "暖色", "冷色"],
    description: "肤色偏橙、阴影偏青的经典商业调色",
    implementation: "Lift/Gamma/Gain 分离肤色与背景；或加载 TealOrange LUT",
    tools: ["DaVinci Resolve", "FilmConvert"],
  },
  {
    id: "color-bleach-bypass",
    category: "color_grade",
    name: "Bleach Bypass",
    nameZh: "跳漂",
    tags: ["高对比", "低饱和", "战争", "硬核", "胶片"],
    description: "保留银盐感、低饱和高对比、颗粒明显",
    implementation: "Resolve 色彩空间跳漂预设 + 35mm 颗粒叠加",
    tools: ["DaVinci Resolve", "FilmConvert"],
  },
  {
    id: "color-film-cold",
    category: "color_grade",
    name: "Film Cold",
    nameZh: "胶片冷调",
    tags: ["冷色调", "胶片", "低饱和", "纪录片"],
    description: "偏蓝绿阴影、柔和高光、轻微颗粒",
    implementation: "降低色温 + 阴影加青 + 曲线柔化高光",
    tools: ["DaVinci Resolve", "Lightroom"],
  },
  {
    id: "shot-match-cut",
    category: "shot_language",
    name: "Match Cut",
    nameZh: "匹配剪辑",
    tags: ["转场", "叙事", "形状", "节奏"],
    description: "形状/动作/构图匹配的两镜头硬切",
    implementation: "前期拍摄时规划匹配元素；后期切点对齐动作峰值",
    tools: ["Premiere Pro", "Final Cut Pro"],
  },
  {
    id: "shot-speed-ramp",
    category: "shot_language",
    name: "Speed Ramp",
    nameZh: "速度曲线",
    tags: ["卡点", "节奏", "MV", "运动"],
    description: "慢动作与常速/快切交替强化节拍",
    implementation: "120fps 升格 + 时间重映射曲线对齐音乐节拍",
    tools: ["Premiere Pro", "DaVinci Resolve", "After Effects"],
  },
  {
    id: "shot-dolly-zoom",
    category: "shot_language",
    name: "Dolly Zoom",
    nameZh: "滑动变焦",
    tags: ["眩晕", "心理", "希区柯克", "张力"],
    description: "推轨与变焦反向运动造成空间扭曲感",
    implementation: "滑轨推近同时 zoom out（或反之），保持主体大小不变",
    tools: ["滑轨", "电动变焦镜头", "Premiere Pro"],
  },
  {
    id: "shot-halation",
    category: "shot_language",
    name: "Halation / Bloom",
    nameZh: "光晕溢出",
    tags: ["胶片", "梦幻", "高光", "复古"],
    description: "高光边缘柔和溢出，胶片/梦幻感",
    implementation: "高光模糊叠加 + 暖色 glow；或 FilmConvert halation",
    tools: ["DaVinci Resolve", "After Effects", "FilmConvert"],
  },
  {
    id: "font-futura",
    category: "font",
    name: "Futura",
    nameZh: "Futura",
    tags: ["几何", "现代", "Apple", "广告", "无衬线"],
    description: "几何无衬线，Apple 广告常用",
    implementation: "大字号标题 + 宽字距 + 大量留白",
    tools: ["Figma", "After Effects", "Premiere Pro"],
  },
  {
    id: "font-helvetica",
    category: "font",
    name: "Helvetica Neue",
    nameZh: "Helvetica Neue",
    tags: ["瑞士", "中性", "纪录片", "字幕"],
    description: "中性经典，适合字幕与正文",
    implementation: "Medium 字重字幕 + 底部安全区留白",
    tools: ["Figma", "Premiere Pro"],
  },
  {
    id: "vfx-neon-glow",
    category: "vfx",
    name: "Neon Glow",
    nameZh: "霓虹光晕",
    tags: ["赛博朋克", "夜景", "霓虹", "城市"],
    description: "高饱和边缘发光，适合赛博朋克夜景",
    implementation: "Duplicate 层 + 高斯模糊 + Add 混合模式",
    tools: ["After Effects", "DaVinci Resolve Fusion"],
  },
  {
    id: "vfx-film-grain",
    category: "vfx",
    name: "Film Grain",
    nameZh: "胶片颗粒",
    tags: ["胶片", "复古", "质感", "35mm"],
    description: "叠加 35mm 颗粒增加有机质感",
    implementation: "颗粒 overlay 15–25%，随亮度变化",
    tools: ["FilmConvert", "DaVinci Resolve", "Dehancer"],
  },
  {
    id: "mood-neon-loneliness",
    category: "mood",
    name: "Neon Loneliness",
    nameZh: "霓虹孤独",
    tags: ["赛博朋克", "孤独", "雨夜", "城市", "冷峻"],
    description: "雨夜城市中的孤独与霓虹反射",
    implementation: "冷调主色 + 局部霓虹点缀 + 慢节奏剪辑",
    tools: ["DaVinci Resolve", "Premiere Pro"],
  },
  {
    id: "mood-melancholy",
    category: "mood",
    name: "Melancholy",
    nameZh: "忧郁",
    tags: ["慢节奏", "低饱和", "怀旧", "情绪"],
    description: "低饱和、慢节奏、内省叙事",
    implementation: "降饱和 + 长镜头 + 环境音主导",
    tools: ["DaVinci Resolve"],
  },
  {
    id: "film-apple-ad",
    category: "film",
    name: "Apple Product Film",
    nameZh: "Apple 产品片",
    tags: ["商业", "极简", "产品", "自然光", "手持"],
    description: "干净背景、产品特写、自然光、极简字幕",
    implementation: "柔光产品布光 + 浅景深 + Futura/Helvetica 字幕",
    tools: ["DaVinci Resolve", "Cinema 4D"],
  },
  {
    id: "color-neon-pop",
    category: "color_grade",
    name: "Neon Pop",
    nameZh: "霓虹波普",
    tags: ["高饱和", "赛博朋克", "波普", "霓虹"],
    description: "高饱和洋红/青色、强对比",
    implementation: "饱和度提升 + 分离色调阴影偏青高光偏品红",
    tools: ["DaVinci Resolve", "Lightroom"],
  },
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,，、·/|]+/)
    .filter((t) => t.length > 1);
}

export function matchStyleDataset(
  queries: string[],
  limit = 6,
): StyleDatasetMatch[] {
  const queryTokens = new Set(
    queries.flatMap((q) => [...tokenize(q), ...q.toLowerCase().split("")].filter((t) => t.length > 1)),
  );

  const scored = STYLE_DATASET.map((entry) => {
    let score = 0;
    const corpus = [
      entry.name,
      entry.nameZh,
      entry.description,
      entry.implementation,
      ...entry.tags,
    ]
      .join(" ")
      .toLowerCase();

    for (const tag of entry.tags) {
      if (queries.some((q) => q.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(q.toLowerCase()))) {
        score += 3;
      }
    }

    for (const token of queryTokens) {
      if (corpus.includes(token)) score += 1;
    }

    for (const q of queries) {
      if (q.length > 2 && (corpus.includes(q.toLowerCase()) || entry.nameZh.includes(q))) {
        score += 2;
      }
    }

    return { entry, score: score / Math.max(entry.tags.length, 1) };
  })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  const maxScore = scored[0]?.score ?? 1;
  return scored.slice(0, limit).map((m) => ({
    ...m,
    score: Math.min(0.98, 0.55 + (m.score / maxScore) * 0.43),
  }));
}

export function getStyleDatasetEntry(id: string): StyleDatasetEntry | undefined {
  return STYLE_DATASET.find((e) => e.id === id);
}

export function listStyleDataset(category?: StyleDatasetCategory): StyleDatasetEntry[] {
  if (!category) return STYLE_DATASET;
  return STYLE_DATASET.filter((e) => e.category === category);
}
