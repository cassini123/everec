import type { WaveformData } from "../../types";

interface Props {
  waveform: WaveformData;
  title?: string;
}

const W = 280;
const H = 72;

function renderBars(data: number[], color: string, yOffset: number, height: number) {
  const max = Math.max(...data, 0.001);
  const barW = W / data.length;
  return data.map((v, i) => {
    const barH = (v / max) * height;
    return (
      <rect
        key={`${color}-${i}`}
        x={i * barW}
        y={yOffset + height - barH}
        width={Math.max(1, barW - 0.5)}
        height={barH}
        fill={color}
        opacity={0.85}
      />
    );
  });
}

export function WaveformChart({ waveform, title = "色彩波形" }: Props) {
  return (
    <div className="rounded-lg border border-sc-border bg-sc-track p-3">
      <div className="mb-2 text-xs font-medium text-sc-muted">{title}</div>
      <svg viewBox={`0 0 ${W} ${H * 4}`} className="w-full" preserveAspectRatio="none">
        <text x={0} y={10} fill="#8a8a96" fontSize={8}>
          Luma
        </text>
        {renderBars(waveform.luma, "#e8e8ed", 12, H)}
        <text x={0} y={H + 22} fill="#f87171" fontSize={8}>
          R
        </text>
        {renderBars(waveform.r, "#f87171", H + 24, H)}
        <text x={0} y={H * 2 + 32} fill="#4ade80" fontSize={8}>
          G
        </text>
        {renderBars(waveform.g, "#4ade80", H * 2 + 34, H)}
        <text x={0} y={H * 3 + 42} fill="#60a5fa" fontSize={8}>
          B
        </text>
        {renderBars(waveform.b, "#60a5fa", H * 3 + 44, H)}
      </svg>
    </div>
  );
}
