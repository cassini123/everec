import { useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { TransportBar } from "./components/layout/TransportBar";
import { BottomToolBar } from "./components/layout/BottomToolBar";
import { LibraryView } from "./views/LibraryView";
import { FoleyView } from "./views/FoleyView";
import { ComposeView } from "./views/ComposeView";
import { DesignView } from "./views/DesignView";
import { ProcessingView } from "./views/ProcessingView";
import { ProjectsView } from "./views/ProjectsView";
import { api, beatToSec } from "./lib/api";
import {
  ensureDefaultProject,
  getActiveProjectId,
  getProject,
  listProjectSummaries,
  setActiveProjectId,
} from "./lib/projects";
import type {
  BottomPanel,
  DesoundProject,
  DesoundProjectSummary,
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

const TOTAL_BEATS = 32;

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace>("library");
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
  const [projectTags, setProjectTags] = useState<string[]>([]);
  const [activeFxPreset, setActiveFxPreset] = useState<string | null>(null);
  const [projects, setProjects] = useState<DesoundProjectSummary[]>([]);
  const [activeProject, setActiveProject] = useState<DesoundProject | null>(null);

  const refreshProjects = useCallback(() => {
    setProjects(listProjectSummaries());
    const activeId = getActiveProjectId();
    if (activeId) {
      const project = getProject(activeId);
      if (project) setActiveProject(project);
    }
  }, []);

  const handleSelectProject = useCallback((project: DesoundProject) => {
    setActiveProjectId(project.id);
    setActiveProject(project);
    refreshProjects();
    setWorkspace("library");
  }, [refreshProjects]);

  const handleProjectPickerSelect = useCallback((id: string) => {
    setActiveProjectId(id);
    const project = getProject(id);
    if (project) setActiveProject(project);
    refreshProjects();
  }, [refreshProjects]);

  const positionRef = useRef(position);
  positionRef.current = position;
  const playAnchorRef = useRef({ beat: 0, time: 0 });

  const refreshLibrary = useCallback(async () => {
    try {
      setSounds(await api.listLibrarySounds());
    } catch (err) {
      setInitError(String(err));
    }
  }, []);

  const refreshTracks = useCallback(async () => {
    try {
      setTracks(await api.listTracks());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const project = ensureDefaultProject();
        setActiveProject(project);
        refreshProjects();
        setInstruments(await api.listInstruments());
        await api.initAudio();
        await refreshTracks();
        await refreshLibrary();
        setReady(true);
      } catch (err) {
        setInitError(String(err));
        setReady(true);
      }
    })();
  }, [refreshLibrary, refreshTracks, refreshProjects]);

  useEffect(() => {
    if (!playing) return;

    playAnchorRef.current = { beat: positionRef.current, time: performance.now() };
    const beatDurMs = (60 / bpm) * 1000;

    const id = window.setInterval(() => {
      const elapsed = performance.now() - playAnchorRef.current.time;
      const beatsPassed = Math.floor(elapsed / beatDurMs);
      const next = (playAnchorRef.current.beat + beatsPassed) % TOTAL_BEATS;
      setPosition(next);
    }, Math.min(beatDurMs, 50));

    return () => window.clearInterval(id);
  }, [playing, bpm]);

  const handlePositionChange = useCallback(
    (beat: number) => {
      const clamped = Math.max(0, Math.min(TOTAL_BEATS - 1, beat));
      setPosition(clamped);
      if (playing) {
        playAnchorRef.current = { beat: clamped, time: performance.now() };
      }
    },
    [playing],
  );

  const handlePlay = useCallback(async () => {
    await api.initAudio();
    playAnchorRef.current = { beat: positionRef.current, time: performance.now() };
    setPlaying(true);
  }, []);

  const handleStop = useCallback(async () => {
    setPlaying(false);
    setPosition(0);
    try {
      await api.allNotesOff();
    } catch {
      /* ignore */
    }
  }, []);

  const showBottomBar =
    workspace === "compose" ||
    workspace === "foley" ||
    workspace === "processing" ||
    workspace === "design";
  const showTransport =
    workspace === "compose" || workspace === "foley" || workspace === "processing";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-ds-bg">
      <TopBar
        workspace={workspace}
        projectName={activeProject?.name}
        projectTags={projectTags}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar workspace={workspace} onChange={setWorkspace} />
        <main className="flex min-w-0 flex-1 flex-col">
          {!ready ? (
            <div className="flex flex-1 items-center justify-center text-ds-muted">
              加载 everec Web 端…
            </div>
          ) : workspace === "projects" ? (
            <ProjectsView
              projects={projects}
              activeProjectId={activeProject?.id ?? null}
              onRefresh={refreshProjects}
              onSelect={handleSelectProject}
            />
          ) : workspace === "library" ? (
            <LibraryView
              sounds={sounds}
              projects={projects}
              activeProjectId={activeProject?.id ?? null}
              onProjectSelect={handleProjectPickerSelect}
              onGoToProjects={() => setWorkspace("projects")}
              onRefresh={refreshLibrary}
            />
          ) : workspace === "foley" ? (
            <FoleyView
              sounds={sounds}
              projects={projects}
              activeProjectId={activeProject?.id ?? null}
              onProjectSelect={handleProjectPickerSelect}
              onGoToProjects={() => setWorkspace("projects")}
              onSaved={refreshLibrary}
            />
          ) : workspace === "processing" ? (
            <ProcessingView
              projects={projects}
              activeProjectId={activeProject?.id ?? null}
              onProjectSelect={handleProjectPickerSelect}
              onGoToProjects={() => setWorkspace("projects")}
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
              projects={projects}
              activeProjectId={activeProject?.id ?? null}
              onProjectSelect={handleProjectPickerSelect}
              onGoToProjects={() => setWorkspace("projects")}
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
              onPositionChange={handlePositionChange}
              projects={projects}
              activeProjectId={activeProject?.id ?? null}
              onProjectSelect={handleProjectPickerSelect}
              onGoToProjects={() => setWorkspace("projects")}
              onTracksChange={refreshTracks}
              onExport={() => {}}
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
        totalBeats={TOTAL_BEATS}
        positionSec={beatToSec(position, bpm)}
        showTransport={showTransport}
        onPlay={handlePlay}
        onStop={handleStop}
        onBpmChange={setBpm}
        onExport={() => {}}
      />

      {initError && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 rounded bg-red-950/90 px-4 py-2 text-xs text-red-300">
          {initError}
        </div>
      )}
    </div>
  );
}
