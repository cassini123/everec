use thiserror::Error;

#[derive(Debug, Error)]
pub enum AudioError {
    #[error("no audio output device available")]
    NoOutputDevice,
    #[error("failed to query default output device: {0}")]
    DefaultDevice(String),
    #[error("failed to build audio stream: {0}")]
    StreamBuild(String),
    #[error("failed to play audio stream: {0}")]
    StreamPlay(String),
    #[error("audio engine is already running")]
    AlreadyRunning,
    #[error("audio engine is not running")]
    NotRunning,
}
