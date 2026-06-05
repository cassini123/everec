export interface AspectPreset {
  id: string;
  label: string;
  width: number;
  height: number;
}

export const ASPECT_PRESETS: AspectPreset[] = [
  { id: "16:9", label: "16:9 横屏", width: 1920, height: 1080 },
  { id: "9:16", label: "9:16 竖屏", width: 1080, height: 1920 },
  { id: "4:3", label: "4:3 标准", width: 1440, height: 1080 },
  { id: "1:1", label: "1:1 方形", width: 1080, height: 1080 },
  { id: "21:9", label: "21:9 超宽", width: 2560, height: 1080 },
];

export function aspectCssRatio(resolution: [number, number]): string {
  return `${resolution[0]} / ${resolution[1]}`;
}

export function findPresetByResolution(resolution: [number, number]): AspectPreset | null {
  return (
    ASPECT_PRESETS.find((p) => p.width === resolution[0] && p.height === resolution[1]) ?? null
  );
}
