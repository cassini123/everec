import {
  analyzeImageLocal,
  analyzeVideoLocal,
  buildStyleGuideLocal,
  type ImageAnalysis,
  type VideoAnalysis,
} from "@everec/shared";

async function callOpenAiVision(
  apiKey: string,
  imageBase64: string,
  mimeType: string,
  prompt: string,
): Promise<Record<string, unknown>> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
          ],
        },
      ],
      max_tokens: 1500,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI Vision 失败: ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return JSON.parse(data.choices[0].message.content) as Record<string, unknown>;
}

const IMAGE_PROMPT = `你是视觉风格分析专家。分析这张图片，返回 JSON：
{
  "subject": "主体描述",
  "composition": "构图分析",
  "colorPalette": ["#hex", ...],
  "artStyle": "艺术风格名称",
  "mood": "情绪",
  "techniques": ["技法1", "技法2"],
  "implementation": {
    "summary": "实现概述",
    "tools": ["工具"],
    "steps": ["步骤"],
    "difficulty": "easy|medium|hard"
  }
}`;

export async function analyzeImage(
  captureId: string,
  imageBuffer: Buffer,
  mimeType: string,
  hint: string,
  apiKey?: string,
): Promise<ImageAnalysis> {
  if (apiKey) {
    try {
      const parsed = await callOpenAiVision(
        apiKey,
        imageBuffer.toString("base64"),
        mimeType,
        IMAGE_PROMPT,
      );
      return {
        captureId,
        subject: String(parsed.subject ?? ""),
        composition: String(parsed.composition ?? ""),
        colorPalette: Array.isArray(parsed.colorPalette)
          ? parsed.colorPalette.map(String)
          : [],
        artStyle: String(parsed.artStyle ?? ""),
        mood: String(parsed.mood ?? ""),
        techniques: Array.isArray(parsed.techniques)
          ? parsed.techniques.map(String)
          : [],
        implementation: {
          summary: String((parsed.implementation as Record<string, unknown>)?.summary ?? ""),
          tools: Array.isArray((parsed.implementation as Record<string, unknown>)?.tools)
            ? ((parsed.implementation as Record<string, unknown>).tools as unknown[]).map(String)
            : [],
          steps: Array.isArray((parsed.implementation as Record<string, unknown>)?.steps)
            ? ((parsed.implementation as Record<string, unknown>).steps as unknown[]).map(String)
            : [],
          difficulty: (["easy", "medium", "hard"].includes(
            String((parsed.implementation as Record<string, unknown>)?.difficulty),
          )
            ? String((parsed.implementation as Record<string, unknown>)?.difficulty)
            : "medium") as "easy" | "medium" | "hard",
        },
        source: "llm",
      };
    } catch (err) {
      console.warn("[knowgo] Vision fallback:", err);
    }
  }
  return analyzeImageLocal(captureId, hint);
}

export async function analyzeVideo(
  captureId: string,
  durationSec: number,
  hint: string,
  apiKey?: string,
): Promise<VideoAnalysis> {
  if (apiKey && hint.length > 10) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "user",
              content: `基于以下视频描述，生成短片风格分析与分镜表 JSON。时长 ${durationSec} 秒。
描述：${hint}
返回格式：
{
  "filmStyle": "",
  "pacing": "",
  "narrativeStructure": "",
  "colorGrading": "",
  "cameraLanguage": "",
  "overallKeywords": [],
  "shots": [{"index":1,"startSec":0,"endSec":5,"durationSec":5,"shotType":"","description":"","cameraMovement":"","implementation":"","thumbnailHint":""}]
}`,
            },
          ],
          max_tokens: 2000,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          choices: { message: { content: string } }[];
        };
        const parsed = JSON.parse(data.choices[0].message.content) as Record<string, unknown>;
        const local = analyzeVideoLocal(captureId, durationSec, hint);
        return {
          ...local,
          filmStyle: String(parsed.filmStyle ?? local.filmStyle),
          pacing: String(parsed.pacing ?? local.pacing),
          narrativeStructure: String(parsed.narrativeStructure ?? local.narrativeStructure),
          colorGrading: String(parsed.colorGrading ?? local.colorGrading),
          cameraLanguage: String(parsed.cameraLanguage ?? local.cameraLanguage),
          overallKeywords: Array.isArray(parsed.overallKeywords)
            ? parsed.overallKeywords.map(String)
            : local.overallKeywords,
          shots: Array.isArray(parsed.shots)
            ? (parsed.shots as VideoAnalysis["shots"])
            : local.shots,
          source: "llm",
        };
      }
    } catch (err) {
      console.warn("[knowgo] Video LLM fallback:", err);
    }
  }
  return analyzeVideoLocal(captureId, durationSec, hint);
}

export function buildStyleGuide(hint: string, keywords: string[]) {
  return buildStyleGuideLocal(hint, keywords);
}
