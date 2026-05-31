import type { StyleMatch } from "../types";

export const STYLE_LIBRARY: StyleMatch[] = [
  {
    name: "Blade Runner 2049",
    nameZh: "银翼杀手 2049",
    similarity: 0,
    tags: ["synth", "ambient", "dystopian", "reverb", "low-end"],
    reference: "Hans Zimmer · atmospheric drone",
  },
  {
    name: "Ghibli Nature",
    nameZh: "吉卜力自然系",
    similarity: 0,
    tags: ["organic", "wind", "piano", "gentle", "field-recording"],
    reference: "Joe Hisaishi · soft orchestral",
  },
  {
    name: "A24 Horror",
    nameZh: "A24 恐怖片",
    similarity: 0,
    tags: ["tension", "silence", "low drone", "foley", "minimal"],
    reference: "Hereditary · negative space",
  },
  {
    name: "Cyberpunk Neon",
    nameZh: "赛博朋克霓虹",
    similarity: 0,
    tags: ["electronic", "bass", "glitch", "city", "night"],
    reference: "Cyberpunk 2077 · synthwave hybrid",
  },
  {
    name: "Documentary Intimate",
    nameZh: "纪录片亲密感",
    similarity: 0,
    tags: ["voiceover", "room tone", "warm", "close-mic", "narrative"],
    reference: "Planet Earth · whispered narration",
  },
  {
    name: "Action Trailer",
    nameZh: "动作预告片",
    similarity: 0,
    tags: ["impact", "brass", "percussion", "rise", "hit"],
    reference: "Epic trailer · boom + stinger",
  },
  {
    name: "Lo-fi Study",
    nameZh: "Lo-fi 学习",
    similarity: 0,
    tags: ["vinyl", "mellow", "rhodes", "dust", "slow"],
    reference: "Chillhop · tape saturation",
  },
  {
    name: "Wong Kar-wai",
    nameZh: "王家卫",
    similarity: 0,
    tags: ["melancholy", "jazz", "reverb", "lonely", "slow"],
    reference: "In the Mood for Love · nostalgic",
  },
];

export function matchStyles(keywords: string[]): StyleMatch[] {
  const lower = keywords.map((k) => k.toLowerCase());
  return STYLE_LIBRARY.map((style) => {
    let score = 0;
    for (const tag of style.tags) {
      const t = tag.trim().toLowerCase();
      if (lower.some((k) => k.includes(t) || t.includes(k))) score += 1;
    }
    for (const kw of lower) {
      if (style.name.toLowerCase().includes(kw)) score += 0.5;
      if (style.nameZh.includes(kw)) score += 0.5;
    }
    const max = style.tags.length + 1;
    return { ...style, similarity: Math.min(score / max, 1) };
  })
    .filter((s) => s.similarity > 0.1)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);
}

export function extractKeywordsLocal(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .split(/[\s,，。！？、；：""''（）()\n]+/)
    .filter((t) => t.length >= 2);
  const dict = [
    "雨", "脚步", "城市", "夜晚", "恐怖", "温暖", "电子", "钢琴",
    "配音", "预告", "纪录片", "赛博", "复古", "紧张", "ambient",
    "rain", "footstep", "city", "night", "horror", "warm", "synth",
    "piano", "voice", "trailer", "documentary", "cyber", "vintage",
  ];
  const found = dict.filter((d) => text.toLowerCase().includes(d.toLowerCase()));
  return [...new Set([...found, ...tokens])].slice(0, 12);
}
