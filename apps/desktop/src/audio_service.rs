use std::sync::mpsc::{self, Receiver, Sender};
use std::thread::{self, JoinHandle};
use std::time::Duration;

use audio_engine::AudioEngine;
use instruments::{find, InstrumentId};

#[derive(Debug)]
pub enum AudioRequest {
    Init,
    AddTrack {
        name: String,
        instrument: InstrumentId,
        reply: Sender<usize>,
    },
    ListTracks {
        reply: Sender<Vec<(usize, String, InstrumentId, f32, f32, bool, bool)>>,
    },
    SelectInstrument {
        track: usize,
        instrument: InstrumentId,
    },
    SetVolume {
        track: usize,
        volume: f32,
    },
    NoteOn {
        track: usize,
        note: u8,
        velocity: f32,
    },
    NoteOff {
        track: usize,
        note: u8,
    },
    AllNotesOff {
        track: Option<usize>,
    },
    Shutdown,
}

pub struct AudioService {
    tx: Sender<AudioRequest>,
    _handle: JoinHandle<()>,
}

impl AudioService {
    pub fn start() -> Result<Self, String> {
        let (tx, rx) = mpsc::channel();
        let handle = thread::spawn(move || audio_thread(rx));
        Ok(Self { tx, _handle: handle })
    }

    pub fn send(&self, request: AudioRequest) -> Result<(), String> {
        self.tx
            .send(request)
            .map_err(|_| "audio thread unavailable".into())
    }

    pub fn init(&self) -> Result<(), String> {
        self.send(AudioRequest::Init)
    }

    pub fn add_track(&self, name: String, instrument: InstrumentId) -> Result<usize, String> {
        let (reply_tx, reply_rx) = mpsc::channel();
        self.send(AudioRequest::AddTrack {
            name,
            instrument,
            reply: reply_tx,
        })?;
        reply_rx
            .recv_timeout(Duration::from_secs(2))
            .map_err(|_| "audio response timeout".into())
    }

    pub fn list_tracks(
        &self,
    ) -> Result<Vec<(usize, String, InstrumentId, f32, f32, bool, bool)>, String> {
        let (reply_tx, reply_rx) = mpsc::channel();
        self.send(AudioRequest::ListTracks { reply: reply_tx })?;
        reply_rx
            .recv_timeout(Duration::from_secs(2))
            .map_err(|_| "audio response timeout".into())
    }
}

impl Drop for AudioService {
    fn drop(&mut self) {
        let _ = self.send(AudioRequest::Shutdown);
    }
}

fn audio_thread(rx: Receiver<AudioRequest>) {
    let mut engine: Option<AudioEngine> = None;

    loop {
        match rx.recv_timeout(Duration::from_millis(16)) {
            Ok(request) => match request {
                AudioRequest::Shutdown => break,
                AudioRequest::Init => {
                    if engine.is_none() {
                        match AudioEngine::new() {
                            Ok(e) => {
                                let track0 = e.add_track("Melody", InstrumentId::GrandPiano);
                                let track1 = e.add_track("Bass", InstrumentId::SynthBass);
                                let track2 = e.add_track("Drums", InstrumentId::DrumKit);
                                let _ = (track0, track1, track2);
                                engine = Some(e);
                            }
                            Err(err) => eprintln!("audio init failed: {err}"),
                        }
                    }
                }
                AudioRequest::AddTrack {
                    name,
                    instrument,
                    reply,
                } => {
                    if let Some(e) = engine.as_ref() {
                        let idx = e.add_track(name, instrument);
                        let _ = reply.send(idx);
                    }
                }
                AudioRequest::ListTracks { reply } => {
                    if let Some(e) = engine.as_ref() {
                        let mixer = e.mixer().lock();
                        let tracks = (0..mixer.track_count())
                            .filter_map(|index| {
                                mixer.track(index).map(|track| {
                                    (
                                        index,
                                        track.name().to_string(),
                                        track.instrument_id(),
                                        track.volume(),
                                        track.pan(),
                                        track.is_muted(),
                                        track.is_solo(),
                                    )
                                })
                            })
                            .collect();
                        let _ = reply.send(tracks);
                    }
                }
                AudioRequest::SelectInstrument { track, instrument } => {
                    if let Some(e) = engine.as_ref() {
                        e.select_instrument(track, instrument);
                    }
                }
                AudioRequest::SetVolume { track, volume } => {
                    if let Some(e) = engine.as_ref() {
                        e.set_volume(track, volume);
                    }
                }
                AudioRequest::NoteOn {
                    track,
                    note,
                    velocity,
                } => {
                    if let Some(e) = engine.as_ref() {
                        e.note_on(track, note, velocity);
                    }
                }
                AudioRequest::NoteOff { track, note } => {
                    if let Some(e) = engine.as_ref() {
                        e.note_off(track, note);
                    }
                }
                AudioRequest::AllNotesOff { track } => {
                    if let Some(e) = engine.as_ref() {
                        e.all_notes_off(track);
                    }
                }
            },
            Err(mpsc::RecvTimeoutError::Timeout) => {
                if let Some(e) = engine.as_ref() {
                    e.process_commands();
                }
            }
            Err(mpsc::RecvTimeoutError::Disconnected) => break,
        }
    }
}

pub fn instrument_slug(id: InstrumentId) -> String {
    find(id)
        .map(|def| def.slug.to_string())
        .unwrap_or_else(|| format!("{:?}", id).to_lowercase())
}

pub fn resolve_instrument(slug: &str) -> Result<InstrumentId, String> {
    InstrumentId::from_slug(slug).ok_or_else(|| format!("unknown instrument: {slug}"))
}
