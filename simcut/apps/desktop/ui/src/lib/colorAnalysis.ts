import type { ColorAnalysisResult, Pixel, WaveformScope } from "../types";
import { analyzeWithWaveformMatch, loadImagePixels } from "./waveformMatch";

export type { Pixel };

export function analyzePixels(
  pixels: Pixel[],
  scope?: WaveformScope,
): ColorAnalysisResult {
  return analyzeWithWaveformMatch({ referencePixels: pixels, referenceScope: scope });
}

export function analyzeImageFile(file: File): Promise<ColorAnalysisResult> {
  return loadImagePixels(file).then(({ pixels, scope }) => analyzePixels(pixels, scope));
}

export function analyzeWaveformMatch(
  referenceFile: File,
  sourcePixels?: Pixel[],
): Promise<ColorAnalysisResult> {
  return loadImagePixels(referenceFile).then(({ pixels, scope }) =>
    analyzeWithWaveformMatch({ referencePixels: pixels, sourcePixels, referenceScope: scope }),
  );
}
