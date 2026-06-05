import { USER_AGENT } from "../constants";
import type { UrlParseResult } from "./types";

function detectPlatform(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("bilibili")) return "bilibili";
    if (host.includes("douyin") || host.includes("tiktok")) return "douyin";
    if (host.includes("xiaohongshu") || host.includes("xhslink")) return "xiaohongshu";
    if (host.includes("youtube") || host.includes("youtu.be")) return "youtube";
    if (host.includes("vimeo")) return "vimeo";
    if (host.includes("behance")) return "behance";
    if (host.includes("pinterest")) return "pinterest";
    if (host.includes("instagram")) return "instagram";
    return host;
  } catch {
    return "unknown";
  }
}

function extractMeta(html: string, property: string): string | undefined {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHtmlEntities(m[1].trim());
  }
  return undefined;
}

function extractTitle(html: string): string | undefined {
  const og = extractMeta(html, "og:title");
  if (og) return og;
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1] ? decodeHtmlEntities(m[1].trim()) : undefined;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function parseWebUrl(url: string): Promise<UrlParseResult> {
  const platform = detectPlatform(url);

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return fallbackUrlParse(url, platform);
    }

    const html = await res.text();
    const title =
      extractTitle(html) ??
      extractMeta(html, "twitter:title") ??
      "未命名页面";
    const description =
      extractMeta(html, "og:description") ??
      extractMeta(html, "description") ??
      extractMeta(html, "twitter:description") ??
      "";
    const imageUrl =
      extractMeta(html, "og:image") ?? extractMeta(html, "twitter:image");
    const siteName = extractMeta(html, "og:site_name");

    return { url, title, description, imageUrl, siteName, platform };
  } catch {
    return fallbackUrlParse(url, platform);
  }
}

function fallbackUrlParse(url: string, platform: string): UrlParseResult {
  let title = url;
  try {
    const u = new URL(url);
    title = u.hostname + u.pathname.slice(0, 40);
  } catch {
    /* keep url */
  }
  return {
    url,
    title,
    description: "无法抓取页面详情，已保存链接供后续分析",
    platform,
  };
}
