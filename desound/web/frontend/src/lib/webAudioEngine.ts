import type { WebInstrumentSlug } from "@everec/shared";

let ctx: AudioContext | null = null;

interface Adsr {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

interface OscLayer {
  type: OscillatorType | "noise";
  detuneCents: number;
  level: number;
}

interface InstrumentPreset {
  layers: OscLayer[];
  adsr: Adsr;
  gain: number;
  filterCutoff?: number;
  isPercussion?: boolean;
}

interface VoiceHandle {
  gain: GainNode;
  filter?: BiquadFilterNode;
  oscillators: OscillatorNode[];
  noise?: AudioBufferSourceNode;
  releaseSec: number;
}

const active = new Map<string, VoiceHandle>();

const PRESETS: Record<WebInstrumentSlug, InstrumentPreset> = {
  grand_piano: {
    layers: [
      { type: "triangle", detuneCents: 0, level: 0.55 },
      { type: "sine", detuneCents: 3, level: 0.3 },
      { type: "sine", detuneCents: -4, level: 0.25 },
    ],
    adsr: { attack: 0.002, decay: 0.35, sustain: 0.25, release: 0.25 },
    gain: 0.85,
    filterCutoff: 4000,
  },
  electric_piano: {
    layers: [
      { type: "sine", detuneCents: 0, level: 0.7 },
      { type: "sine", detuneCents: 7, level: 0.35 },
      { type: "triangle", detuneCents: -2, level: 0.2 },
    ],
    adsr: { attack: 0.001, decay: 0.5, sustain: 0.35, release: 0.3 },
    gain: 0.8,
    filterCutoff: 3500,
  },
  synth_bass: {
    layers: [
      { type: "sawtooth", detuneCents: 0, level: 0.75 },
      { type: "square", detuneCents: 0, level: 0.15 },
    ],
    adsr: { attack: 0.005, decay: 0.15, sustain: 0.7, release: 0.12 },
    gain: 0.9,
    filterCutoff: 800,
  },
  synth_lead: {
    layers: [
      { type: "sawtooth", detuneCents: 0, level: 0.65 },
      { type: "square", detuneCents: 5, level: 0.25 },
      { type: "sawtooth", detuneCents: -5, level: 0.2 },
    ],
    adsr: { attack: 0.01, decay: 0.1, sustain: 0.85, release: 0.08 },
    gain: 0.75,
    filterCutoff: 5000,
  },
  warm_pad: {
    layers: [
      { type: "sine", detuneCents: 0, level: 0.45 },
      { type: "sine", detuneCents: 8, level: 0.35 },
      { type: "triangle", detuneCents: -6, level: 0.25 },
    ],
    adsr: { attack: 0.4, decay: 0.3, sustain: 0.75, release: 0.8 },
    gain: 0.7,
    filterCutoff: 2200,
  },
  strings: {
    layers: [
      { type: "sawtooth", detuneCents: -4, level: 0.35 },
      { type: "sawtooth", detuneCents: 0, level: 0.35 },
      { type: "sawtooth", detuneCents: 4, level: 0.35 },
    ],
    adsr: { attack: 0.25, decay: 0.2, sustain: 0.85, release: 0.5 },
    gain: 0.65,
    filterCutoff: 3000,
  },
  organ: {
    layers: [
      { type: "sine", detuneCents: 0, level: 0.5 },
      { type: "sine", detuneCents: 0, level: 0.35 },
      { type: "sine", detuneCents: 12, level: 0.2 },
    ],
    adsr: { attack: 0.01, decay: 0.05, sustain: 1.0, release: 0.05 },
    gain: 0.75,
    filterCutoff: 4500,
  },
  drum_kit: {
    layers: [{ type: "sine", detuneCents: 0, level: 1 }],
    adsr: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 },
    gain: 1.0,
    isPercussion: true,
  },
  acoustic_guitar: {
    layers: [
      { type: "triangle", detuneCents: 0, level: 0.55 },
      { type: "sawtooth", detuneCents: 2, level: 0.25 },
      { type: "sine", detuneCents: -3, level: 0.15 },
    ],
    adsr: { attack: 0.003, decay: 0.45, sustain: 0.15, release: 0.35 },
    gain: 0.8,
    filterCutoff: 3200,
  },
  synthesizer: {
    layers: [
      { type: "sawtooth", detuneCents: 0, level: 0.5 },
      { type: "square", detuneCents: 7, level: 0.3 },
      { type: "sawtooth", detuneCents: -7, level: 0.25 },
    ],
    adsr: { attack: 0.02, decay: 0.2, sustain: 0.75, release: 0.25 },
    gain: 0.78,
    filterCutoff: 4200,
  },
};

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function detunedHz(base: number, cents: number): number {
  return base * Math.pow(2, cents / 1200);
}

function scheduleAdsr(
  gain: GainNode,
  adsr: Adsr,
  peak: number,
  now: number,
  holdSec?: number,
): number {
  const { attack, decay, sustain, release } = adsr;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), now + attack);
  gain.gain.exponentialRampToValueAtTime(
    Math.max(peak * sustain, 0.0001),
    now + attack + decay,
  );
  const hold = holdSec ?? attack + decay + 0.5;
  gain.gain.setValueAtTime(Math.max(peak * sustain, 0.0001), now + hold);
  return release;
}

function releaseVoice(voice: VoiceHandle, when: number): void {
  const { gain, releaseSec, oscillators, noise } = voice;
  gain.gain.cancelScheduledValues(when);
  gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), when);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + releaseSec);
  const stopAt = when + releaseSec + 0.05;
  for (const osc of oscillators) {
    try {
      osc.stop(stopAt);
    } catch {
      /* already stopped */
    }
  }
  if (noise) {
    try {
      noise.stop(stopAt);
    } catch {
      /* ignore */
    }
  }
}

function makeNoiseBuffer(audio: AudioContext, durationSec: number): AudioBuffer {
  const length = Math.floor(audio.sampleRate * durationSec);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }
  return buffer;
}

type DrumKind = "kick" | "snare" | "hihat" | "clap";

function drumKindForNote(note: number): DrumKind {
  switch (note) {
    case 36:
      return "kick";
    case 38:
      return "snare";
    case 39:
      return "clap";
    case 42:
    case 44:
    case 46:
      return "hihat";
    default:
      return "hihat";
  }
}

function playDrum(note: number, velocity: number, destination: AudioNode): void {
  const audio = getCtx();
  const now = audio.currentTime;
  const kind = drumKindForNote(note);
  const gain = audio.createGain();
  gain.connect(destination);
  const peak = velocity * 0.45;

  if (kind === "kick") {
    const osc = audio.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
    gain.gain.setValueAtTime(peak, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.36);
    return;
  }

  if (kind === "snare") {
    const tone = audio.createOscillator();
    tone.type = "triangle";
    tone.frequency.value = 180;
    const toneGain = audio.createGain();
    toneGain.gain.value = peak * 0.35;
    tone.connect(toneGain);
    toneGain.connect(gain);

    const noiseSrc = audio.createBufferSource();
    noiseSrc.buffer = makeNoiseBuffer(audio, 0.15);
    const noiseGain = audio.createGain();
    noiseGain.gain.setValueAtTime(peak * 0.65, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    noiseSrc.connect(noiseGain);
    noiseGain.connect(gain);

    gain.gain.setValueAtTime(1, now);
    tone.start(now);
    tone.stop(now + 0.2);
    noiseSrc.start(now);
    noiseSrc.stop(now + 0.2);
    return;
  }

  const noiseSrc = audio.createBufferSource();
  noiseSrc.buffer = makeNoiseBuffer(audio, kind === "clap" ? 0.12 : 0.06);
  const filter = audio.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = kind === "clap" ? 800 : 6000;
  gain.gain.setValueAtTime(peak * (kind === "clap" ? 0.7 : 0.55), now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "clap" ? 0.14 : 0.05));
  noiseSrc.connect(filter);
  filter.connect(gain);
  noiseSrc.start(now);
  noiseSrc.stop(now + 0.15);
}

function startVoice(
  preset: InstrumentPreset,
  note: number,
  velocity: number,
  destination: AudioNode,
  holdSec?: number,
): VoiceHandle {
  const audio = getCtx();
  const now = audio.currentTime;
  const peak = velocity * preset.gain;

  const gain = audio.createGain();
  let output: AudioNode = gain;

  if (preset.filterCutoff) {
    const filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = preset.filterCutoff;
    filter.Q.value = 0.7;
    gain.connect(filter);
    output = filter;
  }

  output.connect(destination);
  const releaseSec = scheduleAdsr(gain, preset.adsr, peak, now, holdSec);

  const baseHz = midiToFreq(note);
  const oscillators: OscillatorNode[] = [];

  for (const layer of preset.layers) {
    if (layer.level <= 0) continue;
    const osc = audio.createOscillator();
    osc.type = layer.type === "noise" ? "sine" : layer.type;
    osc.frequency.value = detunedHz(baseHz, layer.detuneCents);
    const layerGain = audio.createGain();
    layerGain.gain.value = layer.level;
    osc.connect(layerGain);
    layerGain.connect(gain);
    osc.start(now);
    oscillators.push(osc);
  }

  return { gain, filter: undefined, oscillators, releaseSec };
}

export async function initWebAudio(): Promise<void> {
  const audio = getCtx();
  if (audio.state === "suspended") await audio.resume();
}

export function playWebNote(
  track: number,
  note: number,
  velocity: number,
  instrument: WebInstrumentSlug,
  durationSec?: number,
): void {
  const audio = getCtx();
  const destination = audio.destination;
  const key = `${track}:${note}`;
  const preset = PRESETS[instrument] ?? PRESETS.grand_piano;

  stopWebNote(track, note);

  if (preset.isPercussion || instrument === "drum_kit") {
    playDrum(note, velocity, destination);
    return;
  }

  const hold = durationSec ?? preset.adsr.attack + preset.adsr.decay + 2;
  const voice = startVoice(preset, note, velocity, destination, hold);
  active.set(key, voice);

  if (durationSec) {
    const now = audio.currentTime;
    releaseVoice(voice, now + durationSec);
    voice.oscillators.forEach((osc) => {
      osc.onended = () => {
        if (active.get(key) === voice) active.delete(key);
      };
    });
  }
}

export function stopWebNote(track: number, note: number): void {
  const key = `${track}:${note}`;
  const voice = active.get(key);
  if (!voice) return;
  releaseVoice(voice, getCtx().currentTime);
  active.delete(key);
}

export function stopAllWebNotes(): void {
  const now = getCtx().currentTime;
  for (const [key, voice] of active) {
    releaseVoice(voice, now);
    active.delete(key);
  }
}
