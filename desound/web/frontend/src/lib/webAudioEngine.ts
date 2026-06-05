type InstrumentSlug =
  | "grand_piano"
  | "electric_piano"
  | "synth_bass"
  | "strings"
  | "drum_kit";

let ctx: AudioContext | null = null;
const active = new Map<string, OscillatorNode>();

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function playDrum(note: number, velocity: number, destination: AudioNode) {
  const audio = getCtx();
  const now = audio.currentTime;
  const gain = audio.createGain();
  gain.connect(destination);
  gain.gain.value = velocity * 0.4;

  if (note % 12 === 0) {
    const osc = audio.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.22);
    return;
  }

  const buffer = audio.createBuffer(1, audio.sampleRate * 0.08, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = audio.createBufferSource();
  src.buffer = buffer;
  src.connect(gain);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  src.start(now);
}

export async function initWebAudio(): Promise<void> {
  const audio = getCtx();
  if (audio.state === "suspended") await audio.resume();
}

export function playWebNote(track: number, note: number, velocity: number, instrument: InstrumentSlug): void {
  const audio = getCtx();
  const destination = audio.destination;
  const key = `${track}:${note}`;

  if (instrument === "drum_kit") {
    playDrum(note, velocity, destination);
    return;
  }

  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.connect(gain);
  gain.connect(destination);

  const freq = midiToFreq(note);
  osc.frequency.value = freq;

  switch (instrument) {
    case "synth_bass":
      osc.type = "sawtooth";
      gain.gain.value = velocity * 0.25;
      break;
    case "strings":
      osc.type = "triangle";
      gain.gain.value = velocity * 0.18;
      break;
    case "electric_piano":
      osc.type = "triangle";
      gain.gain.value = velocity * 0.22;
      osc.detune.value = 3;
      break;
    default:
      osc.type = "sine";
      gain.gain.value = velocity * 0.2;
  }

  const now = audio.currentTime;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(gain.gain.value, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.start(now);
  osc.stop(now + 0.4);
  active.set(key, osc);
  osc.onended = () => active.delete(key);
}

export function stopWebNote(track: number, note: number): void {
  const key = `${track}:${note}`;
  const osc = active.get(key);
  if (osc) {
    try {
      osc.stop();
    } catch {
      /* already stopped */
    }
    active.delete(key);
  }
}

export function stopAllWebNotes(): void {
  for (const [key, osc] of active) {
    try {
      osc.stop();
    } catch {
      /* ignore */
    }
    active.delete(key);
  }
}
