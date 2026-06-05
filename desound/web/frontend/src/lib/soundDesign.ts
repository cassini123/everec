import type { SoundDesignResult } from "../types";
import { extractKeywordsLocal, matchStyles } from "./styles";

const API_KEY_STORAGE = "desound_openai_key";

export function getStoredApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) ?? "";
}

export function setStoredApiKey(key: string) {
  if (key) localStorage.setItem(API_KEY_STORAGE, key);
  else localStorage.removeItem(API_KEY_STORAGE);
}

async function analyzeWithLlm(
  description: string,
  apiKey: string,
): Promise<SoundDesignResult> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            '你是专业声音设计师。根据用户描述，输出 JSON：{"keywords":["..."],"mood":"...","suggestions":["..."],"styleHints":["..."]}。keywords 5-10 个，中英文均可。',
        },
        { role: "user", content: description },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM 请求失败: ${res.status} ${err}`);
  }

  const data = await res.json();
  const content = JSON.parse(data.choices[0].message.content) as {
    keywords: string[];
    mood: string;
    suggestions: string[];
    styleHints?: string[];
  };

  const keywords = [...content.keywords, ...(content.styleHints ?? [])];
  return {
    keywords,
    mood: content.mood,
    similarStyles: matchStyles(keywords),
    suggestions: content.suggestions,
    source: "llm",
  };
}

export async function analyzeSoundDesign(
  description: string,
  apiKey?: string,
): Promise<SoundDesignResult> {
  const key = apiKey?.trim() || getStoredApiKey();

  if (key && description.trim().length >= 4) {
    try {
      return await analyzeWithLlm(description, key);
    } catch (err) {
      console.warn("LLM fallback to local:", err);
    }
  }

  const keywords = extractKeywordsLocal(description);
  return {
    keywords,
    mood: keywords.includes("恐怖") || keywords.includes("horror")
      ? "tense / dark"
      : keywords.includes("温暖") || keywords.includes("warm")
        ? "warm / intimate"
        : "neutral",
    similarStyles: matchStyles(keywords),
    suggestions: [
      "从素材库导入参考音频建立 mood board",
      "在拟声模块中匹配环境音预设",
      "调整响度轨至 -14 LUFS 作为流媒体参考",
    ],
    source: "local",
  };
}
