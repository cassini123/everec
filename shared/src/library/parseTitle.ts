function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** 从搜索词拆分歌手与歌名，如「窦靖童 dont break my heart」 */
export function splitQuery(query: string): { title: string; artist: string } {
  const q = query.trim();
  if (!q) return { title: "", artist: "" };

  const titleWithLatinArtist = q.match(/^([\u4e00-\u9fff·]{2,10})\s+([\u4e00-\u9fffA-Za-z·]+)$/);
  if (titleWithLatinArtist && /[A-Za-z]/.test(titleWithLatinArtist[2]!)) {
    return { title: titleWithLatinArtist[1]!.trim(), artist: titleWithLatinArtist[2]!.trim() };
  }

  const cnFirst = q.match(/^([\u4e00-\u9fff·][\u4e00-\u9fffA-Za-z·]{0,12})\s+(.+)$/);
  if (cnFirst) return { artist: cnFirst[1]!.trim(), title: cnFirst[2]!.trim() };

  const titleFirst = q.match(/^([\u4e00-\u9fff·]{2,10})\s+([\u4e00-\u9fffA-Za-z·]{2,})$/);
  if (titleFirst) return { title: titleFirst[1]!.trim(), artist: titleFirst[2]!.trim() };

  const enLast = q.match(/^(.+?)\s+([\u4e00-\u9fff·][\u4e00-\u9fffA-Za-z·]{1,12})$/);
  if (enLast) return { artist: enLast[2]!.trim(), title: enLast[1]!.trim() };

  return { title: q, artist: "" };
}

export function cleanRawTitle(raw: string): string {
  return decodeHtmlEntities(raw)
    .replace(/<[^>]+>/g, "")
    .replace(/【[^】]*】/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/^[^|｜]*[|｜]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanSongTitle(title: string): string {
  return title
    .replace(/^[\s《》「」"']+|[\s《》「」"']+$/g, "")
    .replace(/^\d{4,}\s*/, "")
    .replace(/\s*[\-—–|·]\s*[\u4e00-\u9fff]{6,}.*$/, "")
    .replace(/\s*\([^)]*$/, "")
    .replace(/\s*（[^）]*$/, "")
    .replace(/\s*(live|Live|LIVE|现场|版|cover|Cover).*$/, "")
    .trim();
}

export function cleanArtist(artist: string): string {
  const a = artist
    .replace(/^[\s《》「」"'@]+|[\s《》「」"'@]+$/g, "")
    .split(/[,、/|]/)[0]!
    .trim();
  return a || "未知歌手";
}

export function parseSongFromText(
  raw: string,
  queryHint?: { title: string; artist: string },
): { title: string; artist: string } {
  const cleaned = cleanRawTitle(raw);

  const book = cleaned.match(/《([^》]+)》/);
  if (book) {
    const title = cleanSongTitle(book[1]!);
    const tail = cleaned.replace(book[0], "").replace(/^[\s\-—–·|：:]+/, "");
    const artist = tail ? cleanArtist(tail.split(/[\-—–|·]/)[0]!) : queryHint?.artist || "未知歌手";
    return { title, artist: artist || queryHint?.artist || "未知歌手" };
  }

  const dash = cleaned.match(/^(.+?)\s*[\-—–]\s*(.+)$/);
  if (dash) {
    const left = dash[1]!.trim();
    const right = dash[2]!.trim();
    if (/^\d{6,8}\s/.test(left) && queryHint?.title) {
      return { title: cleanSongTitle(queryHint.title), artist: cleanArtist(right) };
    }
    if (queryHint?.artist && (left.includes(queryHint.artist) || right.includes(queryHint.artist))) {
      return {
        title: cleanSongTitle(queryHint.title || left.replace(/^\d{4,}\s*/, "")),
        artist: cleanArtist(queryHint.artist),
      };
    }
    if (
      queryHint?.title &&
      (left.toLowerCase().includes(queryHint.title.toLowerCase()) ||
        right.toLowerCase().includes(queryHint.title.toLowerCase()))
    ) {
      return {
        title: cleanSongTitle(queryHint.title),
        artist: queryHint.artist ? cleanArtist(queryHint.artist) : cleanArtist(right),
      };
    }
    return { title: cleanSongTitle(left), artist: cleanArtist(right) };
  }

  if (queryHint?.title && cleaned.toLowerCase().includes(queryHint.title.toLowerCase())) {
    const artistPart = queryHint.artist ? cleanArtist(queryHint.artist) : "未知歌手";
    return {
      title: cleanSongTitle(queryHint.title),
      artist: artistPart,
    };
  }

  return { title: cleanSongTitle(cleaned), artist: queryHint?.artist ? cleanArtist(queryHint.artist) : "未知歌手" };
}

export function normalizeSongTitle(title: string): string {
  return cleanSongTitle(title)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]/g, "")
    .trim();
}

export function songKey(
  title: string,
  artist: string,
  hint?: { title: string; artist: string },
): string {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]/g, "")
      .trim();
  const t = normalizeSongTitle(title);
  if (hint?.title && normalizeSongTitle(hint.title) === t) return t;
  const a = norm(cleanArtist(artist));
  return `${t}|${a}`;
}

export function isRemixOrLive(title: string): boolean {
  return (
    /\bdj\b/i.test(title) ||
    /remix/i.test(title) ||
    /\(.*版.*\)/.test(title) ||
    /（.*版.*）/.test(title) ||
    /\blive\b/i.test(title) ||
    /现场/.test(title) ||
    /cover/i.test(title)
  );
}

export function formatResultLabel(title: string, artist: string): string {
  return `${cleanSongTitle(title)} — ${cleanArtist(artist)}`;
}
