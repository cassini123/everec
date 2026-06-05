import type { ColorAnalysisResult, Pixel } from "../types";
import { analyzeWithWaveformMatch, loadImagePixels } from "./waveformMatch";

export type { Pixel };

export function analyzePixels(pixels: Pixel[]): ColorAnalysisResult {
  return analyzeWithWaveformMatch({ referencePixels: pixels });
}

export function analyzeImageFile(file: File): Promise<ColorAnalysisResult> {
  return loadImagePixels(file).then((pixels) => analyzePixels(pixels));
}

export function analyzeWaveformMatch(
  referenceFile: File,
  sourcePixels?: Pixel[],
): Promise<ColorAnalysisResult> {
  return loadImagePixels(referenceFile).then((refPixels) =>
    analyzeWithWaveformMatch({ referencePixels: refPixels, sourcePixels }),
  );
}
