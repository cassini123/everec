import type { FoleyPreset } from "../types";

export const FOLEY_PRESETS: FoleyPreset[] = [
  {
    id: "footstep",
    name: "Footstep",
    nameZh: "脚步声",
    category: "ambient",
    icon: "👣",
    params: [
      { id: "weight", label: "Weight", min: 0, max: 1, default: 0.5, step: 0.01 },
      { id: "surface", label: "Surface", min: 0, max: 1, default: 0.3, step: 0.01 },
      { id: "speed", label: "Speed", min: 0.2, max: 2, default: 1, step: 0.01 },
    ],
  },
  {
    id: "door",
    name: "Door",
    nameZh: "开关门",
    category: "interior",
    icon: "🚪",
    params: [
      { id: "mass", label: "Mass", min: 0, max: 1, default: 0.6, step: 0.01 },
      { id: "creak", label: "Creak", min: 0, max: 1, default: 0.2, step: 0.01 },
      { id: "reverb", label: "Room", min: 0, max: 1, default: 0.4, step: 0.01 },
    ],
  },
  {
    id: "rain",
    name: "Rain",
    nameZh: "雨声",
    category: "weather",
    icon: "🌧",
    params: [
      { id: "intensity", label: "Intensity", min: 0, max: 1, default: 0.5, step: 0.01 },
      { id: "wind", label: "Wind", min: 0, max: 1, default: 0.1, step: 0.01 },
      { id: "distance", label: "Distance", min: 0, max: 1, default: 0.3, step: 0.01 },
    ],
  },
  {
    id: "impact",
    name: "Impact",
    nameZh: "撞击",
    category: "action",
    icon: "💥",
    params: [
      { id: "force", label: "Force", min: 0, max: 1, default: 0.7, step: 0.01 },
      { id: "material", label: "Material", min: 0, max: 1, default: 0.5, step: 0.01 },
      { id: "decay", label: "Decay", min: 0.1, max: 2, default: 0.6, step: 0.01 },
    ],
  },
  {
    id: "whoosh",
    name: "Whoosh",
    nameZh: "呼啸",
    category: "motion",
    icon: "💨",
    params: [
      { id: "speed", label: "Speed", min: 0.2, max: 3, default: 1.2, step: 0.01 },
      { id: "turbulence", label: "Turbulence", min: 0, max: 1, default: 0.4, step: 0.01 },
      { id: "pitch", label: "Pitch", min: 0.5, max: 2, default: 1, step: 0.01 },
    ],
  },
  {
    id: "water",
    name: "Water",
    nameZh: "水流",
    category: "ambient",
    icon: "💧",
    params: [
      { id: "flow", label: "Flow", min: 0, max: 1, default: 0.5, step: 0.01 },
      { id: "splash", label: "Splash", min: 0, max: 1, default: 0.2, step: 0.01 },
      { id: "depth", label: "Depth", min: 0, max: 1, default: 0.4, step: 0.01 },
    ],
  },
];

export function synthesizeFoley(
  ctx: AudioContext,
  presetId: string,
  params: Record<string, number>,
): AudioBufferSourceNode {
  const duration = 1.5;
  const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < left.length; i++) {
    const t = i / ctx.sampleRate;
    let sample = 0;

    switch (presetId) {
      case "footstep": {
        const env = Math.exp(-t * (8 + params.weight * 12));
        const thump = Math.sin(2 * Math.PI * (60 + params.weight * 40) * t) * env;
        const noise = (Math.random() * 2 - 1) * params.surface * env * 0.3;
        sample = thump * 0.7 + noise;
        break;
      }
      case "door": {
        const env = Math.exp(-t * (2 + params.mass * 4));
        const creak = Math.sin(2 * Math.PI * (200 + params.creak * 400) * t * (1 + t * 0.5)) * env * params.creak;
        const thud = Math.sin(2 * Math.PI * 80 * t) * Math.exp(-t * 20) * params.mass;
        sample = creak * 0.4 + thud * 0.6;
        break;
      }
      case "rain": {
        const env = 1 - Math.exp(-t * 3);
        sample = (Math.random() * 2 - 1) * params.intensity * env * 0.15;
        sample += Math.sin(2 * Math.PI * (300 + params.wind * 200) * t) * params.wind * 0.02;
        break;
      }
      case "impact": {
        const env = Math.exp(-t * (4 / params.decay));
        const tone = Math.sin(2 * Math.PI * (100 + params.material * 300) * t) * env;
        const click = (Math.random() * 2 - 1) * Math.exp(-t * 40) * params.force * 0.5;
        sample = tone * params.force + click;
        break;
      }
      case "whoosh": {
        const env = Math.sin(Math.PI * Math.min(t / 0.8, 1)) * Math.exp(-t * 0.5);
        const sweep = Math.sin(2 * Math.PI * (200 + t * 800 * params.speed) * params.pitch) * env;
        const turb = (Math.random() * 2 - 1) * params.turbulence * env * 0.2;
        sample = sweep * 0.5 + turb;
        break;
      }
      case "water": {
        const env = 1 - Math.exp(-t * 2);
        sample = (Math.random() * 2 - 1) * params.flow * env * 0.12;
        if (Math.random() < params.splash * 0.002) {
          sample += Math.sin(2 * Math.PI * 600 * t) * 0.3;
        }
        break;
      }
      default:
        sample = (Math.random() * 2 - 1) * Math.exp(-t * 5) * 0.2;
    }

    const reverb = params.reverb ?? params.distance ?? params.depth ?? 0;
    const delayed = i > 800 ? left[i - 800] * reverb * 0.3 : 0;
    left[i] = Math.tanh(sample + delayed) * 0.8;
    right[i] = left[i] * (0.9 + reverb * 0.1);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  return source;
}
