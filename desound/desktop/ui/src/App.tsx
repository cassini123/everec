import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { TransportBar } from "./components/layout/TransportBar";
import { BottomToolBar } from "./components/layout/BottomToolBar";
import { ExportDialog } from "./components/export/ExportDialog";
import { LibraryView } from "./views/LibraryView";
import { FoleyView } from "./views/FoleyView";
import { ComposeView } from "./views/ComposeView";
import { DesignView } from "./views/DesignView";
import { ProcessingView } from "./views/ProcessingView";
import { api, beatToSec } from "./lib/api";
import type {
  BottomPanel,
  DubSettings,
  EffectSettings,
  InstrumentInfo,
  SoundAsset,
  TrackInfo,
  Workspace,
} from "./types";

const DEFAULT_EFFECTS: EffectSettings = {
  reverb: 20,
  delay: 10,
  eqHigh: 0,
  eqLow: 0,
  compress: 30,
};

const DEFAULT_DUB: DubSettings = {
  script: "",
  speed: 1,
  pitch: 0,
  volume: 0.85,
};

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace>("compose");
  const [instruments, setInstruments] = useState<InstrumentInfo[]>([]);
  const [tracks, setTracks] = useState<TrackInfo[]>([]);
  const [sounds, setSounds] = useState<SoundAsset[]>([]);
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [position, setPosition] = useState(0);
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState("");
  const [bottomPanel, setBottomPanel] = useState<BottomPanel>("effects");
  const [effects, setEffects] = useState<EffectSettings>(DEFAULT_EFFECTS);
  const [dub, setDub] = useState<DubSettings>(DEFAULT_DUB);
  const [exportOpen, setExportOpen] = useState(false);
  const [projectTags, setProjectTags] = useState<string[]>([]);
  const [activeFxPreset, setActiveFxPreset] = useState<string | null>(null);

  const refreshTracks = useCallback(async () => {
    try {
      setTracks(await api.listTracks());
    } catch {
      /* audio not ready */
    }
  }, []);

  const refreshLibrary = useCallback(async () => {
    try {
      setSounds(await api.listLibrarySounds());
    } catch {
      /* library not ready */
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setInstruments(await api.listInstruments());
        await api.initAudio();
        await refreshTracks();
        await refreshLibrary();
        setReady(true);
      } catch (err) {
        const msg = String(err);
        if (!msg.includes("NOT_IN_DESKTOP_APP")) {
          setInitError(msg);
        }
        setReady(true);
      }
    })();
  }, [refreshTracks, refreshLibrary]);

  useEffect(() => {
    if (!playing) return;
    const beatDur = (60 / bpm) * 250;
    const id = window.setInterval(() => {
      setPosition((p) => (p >= 31 ? 0 : p + 1));
    }, beatDur);
    return () => window.clearInterval(beatDur > 0 ? id : 0);
  }, [playing, bpm]);

  const handleStop = async () => {
    setPlaying(false);
    setPosition(0);
    try {
      await api.allNotesOff();
    } catch {
      /* ignore */
    }
  };

  const showBottomBar =
    workspace === "compose" ||
    workspace === "foley" ||
    workspace === "processing" ||
    workspace === "design";
  const showTransport =
    workspace === "compose" || workspace === "foley" || workspace === "processing";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-ds-bg">
      <TopBar workspace={workspace} projectTags={projectTags} />
      <div className="flex min-h-0 flex-1">
        <Sidebar workspace={workspace} onChange={setWorkspace} />
        <main className="flex min-w-0 flex-1 flex-col">
          {!ready ? (
            <div className="flex flex-1 items-center justify-center text-ds-muted">
              Initializing desound…
            </div>
          ) : workspace === "library" ? (
            <LibraryView
              sounds={sounds}
              onRefresh={refreshLibrary}
              onExport={() => setExportOpen(true)}
            />
          ) : workspace === "foley" ? (
            <FoleyView sounds={sounds} onSaved={refreshLibrary} />
          ) : workspace === "processing" ? (
            <ProcessingView
              activePresetId={activeFxPreset}
              effects={effects}
              onApplyPreset={(id, fx) => {
                setActiveFxPreset(id);
                setEffects(fx);
                setBottomPanel("effects");
              }}
            />
          ) : workspace === "design" ? (
            <DesignView
              onApplyKeywords={(keywords) =>
                setProjectTags((prev) => [...new Set([...prev, ...keywords])])
              }
            />
          ) : (
            <ComposeView
              instruments={instruments}
              tracks={tracks}
              bpm={bpm}
              position={position}
              playing={playing}
              onTracksChange={refreshTracks}
              onExport={() => setExportOpen(true)}
            />
          )}
        </main>
      </div>

      {showBottomBar && (
        <BottomToolBar
          panel={bottomPanel}
          onPanelChange={setBottomPanel}
          effects={effects}
          onEffectsChange={setEffects}
          dub={dub}
          onDubChange={setDub}
        />
      )}

      <TransportBar
        workspace={workspace}
        playing={playing}
        bpm={bpm}
        position={position}
        positionSec={beatToSec(position, bpm)}
        showTransport={showTransport}
        onPlay={() => setPlaying(true)}
        onStop={handleStop}
        onBpmChange={setBpm}
        onExport={() => setExportOpen(true)}
      />

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        sounds={sounds}
      />

      {initError && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 rounded bg-red-950/90 px-4 py-2 text-xs text-red-300">
          音频初始化: {initError}
        </div>
      )}
    </div>
  );
}
