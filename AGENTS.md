# AGENTS.md

## Cursor Cloud specific instructions

### Product

**desound** is a Tauri 2 desktop app (React + Rust) under `desound/`. Dev entrypoint: `desound/apps/desktop`.

### One-time system packages (Linux)

Tauri and `cpal` need distro libraries. If `cargo build` or `tauri dev` fails on missing `pkg-config` deps, install:

```bash
sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential libssl-dev \
  libayatana-appindicator3-dev librsvg2-dev pkg-config libasound2-dev
```

### Rust toolchain

Tauri 2.x dependencies require **Rust 1.85+** (1.96 stable works). Use `rustup default stable` and `rustup update stable` if `edition2024` or similar Cargo errors appear.

### Running the app

From `desound/apps/desktop`:

- **Full app:** `npm run dev` (`tauri dev` — starts Vite on port **1420** and the native window)
- **UI only:** `npm run ui:dev` (no Tauri `invoke`; APIs fail without the shell)

Requires a display (`DISPLAY` is usually set in Cloud Agent VMs). Use tmux for long-running `tauri dev` sessions.

### Lint / test / build

| Check | Command (from repo root or noted path) |
|-------|----------------------------------------|
| Rust tests | `cd desound && cargo test` |
| Rust build | `cd desound && cargo build -p desound-desktop` |
| UI production build | `cd desound/apps/desktop && npm run ui:build` |
| Full release build | `cd desound/apps/desktop && npm run build` |

There is no ESLint/Prettier config in the repo today.

### Audio in Cloud VMs

`cpal` needs a default ALSA/Pulse output device. Headless VMs often log `audio init failed` / `Unknown PCM default`; the UI still works. Compose playback and real-time audio need a sound device or virtual sink (e.g. PulseAudio null sink) if you must test audio output.

### Optional

- **ffmpeg** on `PATH` for library export transcoding (WAV/MP3/FLAC/AAC).
- **OpenAI API key** in the Design workspace UI only for cloud LLM analysis; local Rust analysis works without it.

### Monorepo layout

- `desound/apps/desktop` — npm root + Tauri crate
- `desound/apps/desktop/ui` — Vite/React (separate `package.json`)
- `desound/crates/audio-engine`, `desound/crates/instruments` — Rust workspace members
