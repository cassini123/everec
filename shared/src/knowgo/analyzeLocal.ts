import type {
  FontRecommendation,
  ImageAnalysis,
  PosterStyleGuide,
  SimilarShort,
  StoryboardShot,
  StyleGuide,
  VfxRecommendation,
  VideoAnalysis,
} from "./types";

const ART_STYLES = [
  "赛博朋克霓虹",
  "极简主义",
  "胶片复古",
  "高饱和波普",
  "低饱和莫兰迪",
  "纪录片手持",
  "商业广告精致",
  "日系清新",
  "黑色电影",
  "超现实主义",
];

const FILM_STYLES = [
  "叙事型品牌短片",
  "节奏型卡点 MV",
  "纪录片观察式",
  "实验影像",
  "产品展示广告",
  "情绪氛围片",
  "Vlog 叙事",
  "动画混合实拍",
];

const SHOT_TYPES = [
  "大远景 EWS",
  "远景 WS",
  "全景 FS",
  "中景 MS",
  "近景 CU",
  "特写 ECU",
  "过肩 OTS",
  "航拍 Aerial",
];

const SIMILAR_SHORTS: SimilarShort[] = [
  {
    id: "s1",
    title: "Her",
    director: "Spike Jonze",
    year: "2013",
    styleTags: ["极简", "暖色调", "近景叙事"],
    previewUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop",
    linkUrl: "https://www.youtube.com/results?search_query=Her+2013+trailer",
    similarity: 0.88,
  },
  {
    id: "s2",
    title: "Blade Runner 2049",
    director: "Denis Villeneuve",
    year: "2017",
    styleTags: ["赛博朋克", "低饱和", "大构图"],
    previewUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=225&fit=crop",
    linkUrl: "https://www.youtube.com/results?search_query=Blade+Runner+2049+cinematography",
    similarity: 0.82,
  },
  {
    id: "s3",
    title: "Apple — Shot on iPhone",
    director: "Various",
    year: "2024",
    styleTags: ["商业广告", "手持", "自然光"],
    previewUrl: "https://images.unsplash.com/photo-1611162617474-5b21e939e071?w=400&h=225&fit=crop",
    linkUrl: "https://www.youtube.com/results?search_query=Apple+Shot+on+iPhone+commercial",
    similarity: 0.79,
  },
  {
    id: "s4",
    title: "Everything Everywhere All at Once",
    director: "Daniels",
    year: "2022",
    styleTags: ["超现实", "快切", "高饱和"],
    previewUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=225&fit=crop",
    linkUrl: "https://www.youtube.com/results?search_query=Everything+Everywhere+trailer",
    similarity: 0.75,
  },
];

const FONT_POOL: FontRecommendation[] = [
  {
    name: "Inter",
    category: "无衬线 / 现代",
    usage: "标题与 UI，清晰专业",
    previewText: "KNOWGO 灵感分析",
    googleFontUrl: "https://fonts.google.com/specimen/Inter",
    cssFamily: "'Inter', sans-serif",
  },
  {
    name: "Playfair Display",
    category: "衬线 / 优雅",
    usage: "品牌标题、海报主标题",
    previewText: "Creative Vision",
    googleFontUrl: "https://fonts.google.com/specimen/Playfair+Display",
    cssFamily: "'Playfair Display', serif",
  },
  {
    name: "Space Grotesk",
    category: "无衬线 / 科技",
    usage: "赛博/科技风格标题",
    previewText: "NEON DISTRICT",
    googleFontUrl: "https://fonts.google.com/specimen/Space+Grotesk",
    cssFamily: "'Space Grotesk', sans-serif",
  },
  {
    name: "Noto Sans SC",
    category: "无衬线 / 中文",
    usage: "中文正文与字幕",
    previewText: "每刻创作 · 风格解析",
    googleFontUrl: "https://fonts.google.com/noto/specimen/Noto+Sans+SC",
    cssFamily: "'Noto Sans SC', sans-serif",
  },
];

const VFX_POOL: VfxRecommendation[] = [
  {
    name: "胶片颗粒 + 暗角",
    description: "叠加 35mm 颗粒与轻微暗角，营造复古胶片质感",
    tools: ["DaVinci Resolve", "After Effects", "FilmConvert"],
    referenceImageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=250&fit=crop",
    difficulty: "easy",
  },
  {
    name: "霓虹光晕",
    description: "高饱和边缘发光，适合赛博朋克/夜景城市",
    tools: ["After Effects", "Blender Compositor"],
    referenceImageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=250&fit=crop",
    difficulty: "medium",
  },
  {
    name: "速度 ramp 卡点",
    description: "配合音乐节拍的速度曲线变速，强化节奏感",
    tools: ["Premiere Pro", "DaVinci Resolve", "Final Cut Pro"],
    referenceImageUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=250&fit=crop",
    difficulty: "medium",
  },
  {
    name: "遮罩转场",
    description: "图形遮罩或物体运动驱动的创意转场",
    tools: ["After Effects", "CapCut Pro"],
    referenceImageUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=250&fit=crop",
    difficulty: "hard",
  },
];

function hashSeed(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

function pick<T>(arr: T[], seed: number, offset = 0): T {
  return arr[(seed + offset) % arr.length];
}

export function analyzeImageLocal(captureId: string, hint = ""): ImageAnalysis {
  const seed = hashSeed(hint || captureId);
  const artStyle = pick(ART_STYLES, seed);
  const palettes = [
    ["#1a1a2e", "#16213e", "#0f3460", "#e94560"],
    ["#2d3436", "#636e72", "#b2bec3", "#dfe6e9"],
    ["#ff6b6b", "#feca57", "#48dbfb", "#1dd1a1"],
    ["#2c003e", "#512b58", "#fe346e", "#ffdde1"],
  ];

  return {
    captureId,
    subject: hint.includes("人") ? "人物主体与情绪表达" : "场景构图与视觉焦点",
    composition: pick(
      ["三分法构图", "中心对称", "引导线构图", "框中框", "负空间留白"],
      seed,
      1,
    ),
    colorPalette: pick(palettes, seed, 2),
    artStyle,
    mood: pick(["忧郁", "活力", "神秘", "温暖", "冷峻", "梦幻"], seed, 3),
    techniques: [
      pick(["自然光", "侧逆光", "霓虹补光", "柔光箱"], seed, 4),
      pick(["浅景深", "深景深", "长曝光", "高速快门"], seed, 5),
      pick(["低角度", "俯拍", "荷兰角", "平视"], seed, 6),
    ],
    implementation: {
      summary: `以 ${artStyle} 为基调，通过色彩与构图传达情绪`,
      tools: ["DaVinci Resolve", "Lightroom", "Photoshop", "Capture One"],
      steps: [
        "分析参考图色温与对比度曲线",
        "建立 LUT 或色彩节点匹配主色调",
        "调整构图裁切比例（16:9 / 2.39:1）",
        "添加颗粒/锐化完成胶片或商业质感",
      ],
      difficulty: seed % 3 === 0 ? "hard" : seed % 2 === 0 ? "medium" : "easy",
    },
    source: "local",
  };
}

export function analyzeVideoLocal(
  captureId: string,
  durationSec = 60,
  hint = "",
): VideoAnalysis {
  const seed = hashSeed(hint || captureId);
  const filmStyle = pick(FILM_STYLES, seed);
  const shotCount = Math.min(8, Math.max(3, Math.floor(durationSec / 8)));
  const shots: StoryboardShot[] = [];

  for (let i = 0; i < shotCount; i++) {
    const startSec = Math.round((durationSec / shotCount) * i);
    const endSec = Math.round((durationSec / shotCount) * (i + 1));
    shots.push({
      index: i + 1,
      startSec,
      endSec,
      durationSec: endSec - startSec,
      shotType: pick(SHOT_TYPES, seed, i),
      description: pick(
        [
          "建立环境氛围",
          "展示主体细节",
          "情绪特写",
          "动作/产品展示",
          "转场过渡",
          "高潮视觉",
          "收尾留白",
        ],
        seed,
        i + 2,
      ),
      cameraMovement: pick(
        ["固定", "缓慢推镜", "横移", "手持跟拍", "航拍下降", "环绕"],
        seed,
        i + 3,
      ),
      implementation: pick(
        [
          "三脚架固定 + 自然光",
          "滑轨 50cm 缓推",
          "稳定器手持跟拍",
          "无人机航拍建立镜头",
          "升格 120fps 慢动作",
        ],
        seed,
        i + 4,
      ),
      thumbnailHint: `镜头 ${i + 1} · ${startSec}s–${endSec}s`,
    });
  }

  const keywords = [
    filmStyle.split(" ")[0],
    pick(["暖色调", "冷色调", "高对比", "低饱和"], seed),
    pick(["快切", "长镜头", "混合节奏"], seed, 1),
    pick(["手持", "稳定", "航拍"], seed, 2),
  ];

  return {
    captureId,
    filmStyle,
    pacing: pick(["快节奏卡点", "中等叙事", "慢节奏氛围"], seed),
    narrativeStructure: pick(
      ["三幕式", "环形结构", "平行剪辑", "单场景情绪递进"],
      seed,
      1,
    ),
    colorGrading: pick(
      ["Teal & Orange 商业风", "低饱和胶片", "高饱和波普", "黑白高对比"],
      seed,
      2,
    ),
    cameraLanguage: pick(
      ["以近景情绪为主", "大构图建立空间", "混合景别叙事"],
      seed,
      3,
    ),
    shots,
    overallKeywords: keywords,
    source: "local",
  };
}

export function buildStyleGuideLocal(hint = "", keywords: string[] = []): StyleGuide {
  const seed = hashSeed(hint + keywords.join(","));
  const mergedKeywords =
    keywords.length > 0
      ? keywords
      : [
          pick(ART_STYLES, seed).slice(0, 4),
          pick(["情绪", "叙事", "商业", "实验"], seed, 1),
          pick(["暖色", "冷色", "高饱和", "低饱和"], seed, 2),
        ];

  const posterStyle: PosterStyleGuide = {
    layout: pick(
      ["中心主体 + 大标题", "三分法 + 底部字幕区", "全出血背景 + 小字标题"],
      seed,
    ),
    colorScheme: pick(
      [
        ["#0d0d0d", "#ff6b2c", "#e8e8ed"],
        ["#1a1a2e", "#4da3ff", "#3dd68c"],
        ["#2d3436", "#dfe6e9", "#636e72"],
      ],
      seed,
      1,
    ),
    typography: `${pick(FONT_POOL, seed).name} + ${pick(FONT_POOL, seed, 1).name}`,
    composition: pick(["留白呼吸感", "满构图冲击", "对角线动态"], seed, 2),
    referenceDescription: "参考主视觉的色块比例与字体层级，保持品牌一致性",
  };

  return {
    keywords: mergedKeywords,
    moodTags: [
      pick(["温暖", "冷峻", "神秘", "活力"], seed),
      pick(["怀旧", "未来", "自然", "都市"], seed, 1),
    ],
    fonts: [pick(FONT_POOL, seed), pick(FONT_POOL, seed, 1), pick(FONT_POOL, seed, 2)],
    posterStyle,
    vfxRecommendations: [pick(VFX_POOL, seed), pick(VFX_POOL, seed, 1), pick(VFX_POOL, seed, 2)],
    similarShorts: SIMILAR_SHORTS.map((s, i) => ({
      ...s,
      similarity: Math.max(0.6, s.similarity - i * 0.03 + (seed % 10) * 0.01),
    })).sort((a, b) => b.similarity - a.similarity),
  };
}

export { SIMILAR_SHORTS, FONT_POOL, VFX_POOL };
