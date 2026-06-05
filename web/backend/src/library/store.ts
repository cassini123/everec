import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { v4 as uuidv4 } from "uuid";
import type { SoundAsset } from "@everec/shared";

interface LibraryManifest {
  version: number;
  sounds: SoundAsset[];
}

function dataRoot(): string {
  return process.env.LIBRARY_DATA_DIR ?? path.join(process.cwd(), "data", "library");
}

function manifestPath(root: string): string {
  return path.join(root, "library.json");
}

function soundsDir(root: string): string {
  return path.join(root, "sounds");
}

export function ensureLibrary(): string {
  const root = dataRoot();
  fs.mkdirSync(soundsDir(root), { recursive: true });
  const mp = manifestPath(root);
  if (!fs.existsSync(mp)) {
    const manifest: LibraryManifest = { version: 1, sounds: [] };
    fs.writeFileSync(mp, JSON.stringify(manifest, null, 2));
  }
  return root;
}

function readManifest(root: string): LibraryManifest {
  ensureLibrary();
  return JSON.parse(fs.readFileSync(manifestPath(root), "utf8")) as LibraryManifest;
}

function writeManifest(root: string, manifest: LibraryManifest): void {
  fs.writeFileSync(manifestPath(root), JSON.stringify(manifest, null, 2));
}

function chronoNow(): string {
  return Math.floor(Date.now() / 1000).toString();
}

export function listSounds(): SoundAsset[] {
  const root = ensureLibrary();
  return readManifest(root).sounds.map((s) => ({
    ...s,
    audioUrl: `/api/library/sounds/${s.id}/audio`,
  }));
}

export function getSound(id: string): SoundAsset | undefined {
  return readManifest(ensureLibrary()).sounds.find((s) => s.id === id);
}

export function getSoundFilePath(id: string): string | null {
  const root = ensureLibrary();
  const asset = getSound(id);
  if (!asset) return null;
  const fp = path.join(soundsDir(root), asset.fileName);
  return fs.existsSync(fp) ? fp : null;
}

export function importFile(
  sourcePath: string,
  name?: string,
  tags: string[] = [],
  category = "music",
  source = "import",
): SoundAsset {
  const root = ensureLibrary();
  if (!fs.existsSync(sourcePath)) throw new Error(`file not found: ${sourcePath}`);

  const ext = path.extname(sourcePath).slice(1).toLowerCase() || "mp3";
  const id = uuidv4();
  const fileName = `${id}.${ext}`;
  const dest = path.join(soundsDir(root), fileName);
  fs.copyFileSync(sourcePath, dest);

  const asset: SoundAsset = {
    id,
    name: name ?? path.basename(sourcePath, path.extname(sourcePath)),
    fileName,
    format: ext,
    durationMs: 0,
    tags,
    category,
    createdAt: chronoNow(),
    source,
    audioUrl: `/api/library/sounds/${id}/audio`,
  };

  const manifest = readManifest(root);
  manifest.sounds.push(asset);
  writeManifest(root, manifest);
  return asset;
}

export function importBuffer(
  buffer: Buffer,
  ext: string,
  name: string,
  tags: string[] = [],
  category = "music",
  source = "upload",
): SoundAsset {
  const root = ensureLibrary();
  const id = uuidv4();
  const fileName = `${id}.${ext}`;
  const dest = path.join(soundsDir(root), fileName);
  fs.writeFileSync(dest, buffer);

  const asset: SoundAsset = {
    id,
    name,
    fileName,
    format: ext,
    durationMs: 0,
    tags,
    category,
    createdAt: chronoNow(),
    source,
    audioUrl: `/api/library/sounds/${id}/audio`,
  };

  const manifest = readManifest(root);
  manifest.sounds.push(asset);
  writeManifest(root, manifest);
  return asset;
}

export function deleteSound(id: string): void {
  const root = ensureLibrary();
  const manifest = readManifest(root);
  const idx = manifest.sounds.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error("sound not found");
  const asset = manifest.sounds.splice(idx, 1)[0];
  const fp = path.join(soundsDir(root), asset.fileName);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
  writeManifest(root, manifest);
}

export function downloadHttp(url: string, dest: string, referer?: string): void {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const args = [
    "-L",
    "-s",
    "-f",
    "-o",
    dest,
    url,
    "-H",
    "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  ];
  if (referer) args.push("-H", `Referer: ${referer}`);
  const result = spawnSync("curl", args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || "curl 下载失败");
  }
  if (!fs.existsSync(dest) || fs.statSync(dest).size === 0) {
    throw new Error("下载失败: 文件为空");
  }
}

export function downloadWithYtDlp(url: string, destDir: string): string {
  fs.mkdirSync(destDir, { recursive: true });
  const template = path.join(destDir, "download.%(ext)s");
  const result = spawnSync(
    "yt-dlp",
    ["-x", "--audio-format", "mp3", "--audio-quality", "0", "-o", template, "--no-playlist", url],
    { encoding: "utf8" },
  );
  if (result.status !== 0) throw new Error(result.stderr || "yt-dlp 下载失败");

  const exts = [".mp3", ".m4a", ".aac", ".wav", ".flac", ".ogg"];
  const files = fs
    .readdirSync(destDir)
    .map((f) => path.join(destDir, f))
    .filter((f) => fs.statSync(f).isFile() && exts.includes(path.extname(f).toLowerCase()))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  if (!files.length) throw new Error("下载完成但未找到音频文件");
  return files[0];
}

export function tempDir(): string {
  const dir = path.join(ensureLibrary(), "temp");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function cleanupTemp(): void {
  const dir = path.join(ensureLibrary(), "temp");
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}
