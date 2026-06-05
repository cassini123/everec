use std::sync::Arc;
use std::thread;
use std::time::Duration;

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{SampleFormat, Stream, StreamConfig};
use crossbeam_channel::{Receiver, Sender, TryRecvError};
use instruments::InstrumentId;
use parking_lot::Mutex;
use tracing::{info, warn};

mod error;
mod mixer;

pub use error::AudioError;
pub use mixer::{Mixer, Track};

use mixer::SharedMixer;

#[derive(Debug, Clone)]
pub enum EngineCommand {
    SelectInstrument {
        track: usize,
        instrument: InstrumentId,
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
    SetVolume {
        track: usize,
        volume: f32,
    },
    Shutdown,
}

pub struct AudioEngine {
    mixer: Arc<SharedMixer>,
    command_tx: Sender<EngineCommand>,
    command_rx: Receiver<EngineCommand>,
    stream: Option<Stream>,
    sample_rate: f32,
    channels: u16,
}

impl AudioEngine {
    pub fn new() -> Result<Self, AudioError> {
        let host = cpal::default_host();
        let device = host
            .default_output_device()
            .ok_or(AudioError::NoOutputDevice)?;

        let supported = device
            .default_output_config()
            .map_err(|err| AudioError::DefaultDevice(err.to_string()))?;

        let sample_rate = supported.sample_rate().0 as f32;
        let channels = supported.channels();
        let sample_format = supported.sample_format();
        let config: StreamConfig = supported.into();

        info!(
            device = %device.name().unwrap_or_else(|_| "unknown".into()),
            sample_rate,
            channels,
            format = ?sample_format,
            "initializing audio engine"
        );

        let mixer = Arc::new(Mutex::new(Mixer::new()));
        let (command_tx, command_rx) = crossbeam_channel::unbounded();

        let stream_state = StreamState {
            mixer: Arc::clone(&mixer),
            mono_scratch: Vec::new(),
        };
        let stream_commands = command_rx.clone();
        let stream = build_output_stream(
            &device,
            &config,
            sample_format,
            stream_state,
            stream_commands,
            sample_rate,
        )?;

        stream
            .play()
            .map_err(|err| AudioError::StreamPlay(err.to_string()))?;

        Ok(Self {
            mixer,
            command_tx,
            command_rx,
            stream: Some(stream),
            sample_rate,
            channels,
        })
    }

    pub fn sample_rate(&self) -> f32 {
        self.sample_rate
    }

    pub fn channels(&self) -> u16 {
        self.channels
    }

    pub fn mixer(&self) -> &SharedMixer {
        &self.mixer
    }

    pub fn add_track(&self, name: impl Into<String>, instrument: InstrumentId) -> usize {
        self.mixer.lock().add_track(name, instrument)
    }

    pub fn send(&self, command: EngineCommand) {
        let _ = self.command_tx.send(command);
    }

    pub fn select_instrument(&self, track: usize, instrument: InstrumentId) {
        self.send(EngineCommand::SelectInstrument { track, instrument });
    }

    pub fn note_on(&self, track: usize, note: u8, velocity: f32) {
        self.send(EngineCommand::NoteOn {
            track,
            note,
            velocity,
        });
    }

    pub fn note_off(&self, track: usize, note: u8) {
        self.send(EngineCommand::NoteOff { track, note });
    }

    pub fn all_notes_off(&self, track: Option<usize>) {
        self.send(EngineCommand::AllNotesOff { track });
    }

    pub fn set_volume(&self, track: usize, volume: f32) {
        self.send(EngineCommand::SetVolume { track, volume });
    }

    pub fn process_commands(&self) {
        loop {
            match self.command_rx.try_recv() {
                Ok(command) => self.handle_command(command),
                Err(TryRecvError::Empty) => break,
                Err(TryRecvError::Disconnected) => break,
            }
        }
    }

    fn handle_command(&self, command: EngineCommand) {
        match command {
            EngineCommand::Shutdown => {}
            EngineCommand::SelectInstrument { track, instrument } => {
                self.mixer.lock().set_track_instrument(track, instrument);
            }
            EngineCommand::NoteOn {
                track,
                note,
                velocity,
            } => {
                if let Some(track) = self.mixer.lock().track_mut(track) {
                    track.note_on(note, velocity);
                }
            }
            EngineCommand::NoteOff { track, note } => {
                if let Some(track) = self.mixer.lock().track_mut(track) {
                    track.note_off(note);
                }
            }
            EngineCommand::AllNotesOff { track } => {
                let mut mixer = self.mixer.lock();
                match track {
                    Some(index) => {
                        if let Some(track) = mixer.track_mut(index) {
                            track.all_notes_off();
                        }
                    }
                    None => {
                        for idx in 0..mixer.track_count() {
                            if let Some(track) = mixer.track_mut(idx) {
                                track.all_notes_off();
                            }
                        }
                    }
                }
            }
            EngineCommand::SetVolume { track, volume } => {
                if let Some(track) = self.mixer.lock().track_mut(track) {
                    track.set_volume(volume);
                }
            }
        }
    }

    pub fn sleep(&self, duration: Duration) {
        let step = Duration::from_millis(5);
        let mut elapsed = Duration::ZERO;
        while elapsed < duration {
            self.process_commands();
            thread::sleep(step);
            elapsed += step;
        }
    }
}

impl Drop for AudioEngine {
    fn drop(&mut self) {
        let _ = self.command_tx.send(EngineCommand::Shutdown);
        if let Some(stream) = self.stream.take() {
            let _ = stream.pause();
        }
    }
}

struct StreamState {
    mixer: Arc<SharedMixer>,
    mono_scratch: Vec<f32>,
}

fn build_output_stream(
    device: &cpal::Device,
    config: &StreamConfig,
    sample_format: SampleFormat,
    mut state: StreamState,
    commands: Receiver<EngineCommand>,
    sample_rate: f32,
) -> Result<Stream, AudioError> {
    let channels = config.channels as usize;
    let err_fn = |err| warn!(?err, "audio stream error");

    let stream = match sample_format {
        SampleFormat::F32 => device.build_output_stream(
            config,
            move |output: &mut [f32], _| {
                drain_commands(&commands, &state.mixer);
                render_f32(&mut state, sample_rate, output, channels);
            },
            err_fn,
            None,
        ),
        SampleFormat::I16 => device.build_output_stream(
            config,
            move |output: &mut [i16], _| {
                drain_commands(&commands, &state.mixer);
                render_i16(output, channels, &mut state, sample_rate);
            },
            err_fn,
            None,
        ),
        SampleFormat::U16 => device.build_output_stream(
            config,
            move |output: &mut [u16], _| {
                drain_commands(&commands, &state.mixer);
                render_u16(output, channels, &mut state, sample_rate);
            },
            err_fn,
            None,
        ),
        other => {
            return Err(AudioError::StreamBuild(format!(
                "unsupported sample format: {other:?}"
            )));
        }
    }
    .map_err(|err| AudioError::StreamBuild(err.to_string()))?;

    Ok(stream)
}

fn drain_commands(commands: &Receiver<EngineCommand>, mixer: &SharedMixer) {
    while let Ok(command) = commands.try_recv() {
        match command {
            EngineCommand::Shutdown => break,
            EngineCommand::SelectInstrument { track, instrument } => {
                mixer.lock().set_track_instrument(track, instrument);
            }
            EngineCommand::NoteOn {
                track,
                note,
                velocity,
            } => {
                if let Some(track) = mixer.lock().track_mut(track) {
                    track.note_on(note, velocity);
                }
            }
            EngineCommand::NoteOff { track, note } => {
                if let Some(track) = mixer.lock().track_mut(track) {
                    track.note_off(note);
                }
            }
            EngineCommand::AllNotesOff { track } => {
                let mut guard = mixer.lock();
                match track {
                    Some(index) => {
                        if let Some(track) = guard.track_mut(index) {
                            track.all_notes_off();
                        }
                    }
                    None => {
                        for idx in 0..guard.track_count() {
                            if let Some(track) = guard.track_mut(idx) {
                                track.all_notes_off();
                            }
                        }
                    }
                }
            }
            EngineCommand::SetVolume { track, volume } => {
                if let Some(track) = mixer.lock().track_mut(track) {
                    track.set_volume(volume);
                }
            }
        }
    }
}

fn render_f32(state: &mut StreamState, sample_rate: f32, output: &mut [f32], channels: usize) {
    if channels <= 1 {
        state.mixer.lock().render(sample_rate, output);
        return;
    }

    let frames = output.len() / channels;
    if state.mono_scratch.len() != frames {
        state.mono_scratch.resize(frames, 0.0);
    }
    state.mixer.lock().render(sample_rate, &mut state.mono_scratch);
    for (frame_idx, sample) in state.mono_scratch.iter().enumerate() {
        for channel in 0..channels {
            output[frame_idx * channels + channel] = *sample;
        }
    }
}

fn render_i16(
    output: &mut [i16],
    channels: usize,
    state: &mut StreamState,
    sample_rate: f32,
) {
    let frames = output.len() / channels;
    if state.mono_scratch.len() != frames {
        state.mono_scratch.resize(frames, 0.0);
    }
    state.mixer.lock().render(sample_rate, &mut state.mono_scratch);
    for (frame_idx, sample) in state.mono_scratch.iter().enumerate() {
        let value = (sample.clamp(-1.0, 1.0) * i16::MAX as f32) as i16;
        for channel in 0..channels {
            output[frame_idx * channels + channel] = value;
        }
    }
}

fn render_u16(
    output: &mut [u16],
    channels: usize,
    state: &mut StreamState,
    sample_rate: f32,
) {
    let frames = output.len() / channels;
    if state.mono_scratch.len() != frames {
        state.mono_scratch.resize(frames, 0.0);
    }
    state.mixer.lock().render(sample_rate, &mut state.mono_scratch);
    for (frame_idx, sample) in state.mono_scratch.iter().enumerate() {
        let normalized = (sample.clamp(-1.0, 1.0) + 1.0) * 0.5;
        let value = (normalized * u16::MAX as f32) as u16;
        for channel in 0..channels {
            output[frame_idx * channels + channel] = value;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mixer_tracks_instruments() {
        let mut mixer = Mixer::new();
        let track = mixer.add_track("Lead", InstrumentId::SynthLead);
        assert_eq!(track, 0);
        assert_eq!(
            mixer.track(0).unwrap().instrument_id(),
            InstrumentId::SynthLead
        );
    }
}
