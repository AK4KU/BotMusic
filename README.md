# 🎵 BotMusic - Discord Music Bot

Bot musik Discord untuk server pribadi. Support YouTube & Spotify, slash commands, dan prefix commands.

---

## ✅ Fitur

- ▶️ Putar lagu dari **YouTube** (URL / search) dan **Spotify** (track, playlist, album)
- 📋 Queue management lengkap
- ⏭️ Skip, ⏸️ Pause, ▶️ Resume, ⏹️ Stop
- 🔀 Shuffle queue
- 🔂 Loop lagu / 🔁 Loop queue
- 🔊 Kontrol volume (0–200%)
- 🎛️ Slash commands (`/play`) **dan** Prefix commands (`!play`)

---

## 🚀 Cara Setup

### 1. Prasyarat

- [Node.js](https://nodejs.org/) v18 atau lebih baru
- [FFmpeg](https://ffmpeg.org/) — sudah disertakan via `ffmpeg-static`
- Akun Discord Developer

### 2. Clone / Download

```
cd "c:\Bengkel\BotMUsic"
```

### 3. Install dependencies

```bash
npm install
```

### 4. Buat Discord Bot

1. Buka https://discord.com/developers/applications
2. Klik **New Application** → beri nama
3. Buka tab **Bot** → klik **Reset Token** → copy token
4. Di tab **Bot**, aktifkan:
   - `SERVER MEMBERS INTENT`
   - `MESSAGE CONTENT INTENT`
5. Buka tab **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Connect`, `Speak`, `Send Messages`, `Read Message History`, `View Channels`
6. Copy URL-nya dan buka di browser untuk invite bot ke server

### 5. Isi file `.env`

Buka file `.env` dan isi dengan nilai yang benar:

```env
DISCORD_TOKEN=token_bot_kamu
CLIENT_ID=id_aplikasi_kamu
GUILD_ID=id_server_kamu

PREFIX=!

# Opsional - untuk support Spotify
SPOTIFY_CLIENT_ID=spotify_client_id
SPOTIFY_CLIENT_SECRET=spotify_client_secret
```

**Cara mendapatkan ID:**
- **CLIENT_ID**: Di halaman aplikasi Discord Developer → General Information → Application ID
- **GUILD_ID**: Klik kanan nama server di Discord (Developer Mode harus aktif) → Copy Server ID

**Setup Spotify (opsional):**
1. Buka https://developer.spotify.com/dashboard
2. Buat app baru → copy Client ID & Client Secret

### 6. Deploy Slash Commands

```bash
npm run deploy
```

Ini mendaftarkan slash commands ke server kamu (langsung aktif dalam beberapa detik).

### 7. Jalankan Bot

```bash
npm start
```

Untuk development dengan auto-restart:
```bash
npm run dev
```

---

## 🎮 Daftar Command

| Slash Command | Prefix Command | Alias | Deskripsi |
|---|---|---|---|
| `/play <input>` | `!play <input>` | `!p` | Putar lagu (URL/nama/playlist) |
| `/skip` | `!skip` | `!s` | Lewati lagu saat ini |
| `/stop` | `!stop` | — | Hentikan musik & kosongkan queue |
| `/pause` | `!pause` | — | Pause lagu |
| `/resume` | `!resume` | `!r` | Lanjutkan lagu |
| `/queue` | `!queue` | `!q` | Tampilkan queue |
| `/nowplaying` | `!nowplaying` | `!np` | Info lagu saat ini |
| `/volume <0-200>` | `!volume <0-200>` | `!vol` | Atur volume |
| `/shuffle` | `!shuffle` | `!sh` | Acak urutan queue |
| `/loop [mode]` | `!loop [mode]` | `!repeat` | Loop: `track` / `queue` / `off` |
| `/leave` | `!leave` | `!dc` | Bot keluar dari voice channel |

### Contoh penggunaan

```
/play Never Gonna Give You Up
/play https://www.youtube.com/watch?v=dQw4w9WgXcQ
/play https://open.spotify.com/track/...
/play https://open.spotify.com/playlist/...
/volume 80
/loop track
!play linkin park numb
!skip
!queue
```

---

## 📁 Struktur Proyek

```
BotMUsic/
├── src/
│   ├── commands/
│   │   └── music/
│   │       ├── play.js
│   │       ├── skip.js
│   │       ├── stop.js
│   │       ├── pause.js
│   │       ├── resume.js
│   │       ├── queue.js
│   │       ├── nowplaying.js
│   │       ├── volume.js
│   │       ├── leave.js
│   │       ├── shuffle.js
│   │       └── loop.js
│   ├── events/
│   │   ├── ready.js
│   │   ├── interactionCreate.js
│   │   └── messageCreate.js
│   ├── handlers/
│   │   ├── commandHandler.js
│   │   └── eventHandler.js
│   ├── utils/
│   │   ├── MusicQueue.js
│   │   └── trackResolver.js
│   ├── deploy-commands.js
│   └── index.js
├── .env
├── .env.example
├── package.json
└── README.md
```

---

## ⚠️ Catatan

- Bot ini hanya untuk **penggunaan server pribadi**
- Pastikan Node.js v18+
- Jika ada masalah dengan `@discordjs/opus`, coba install: `npm install @discordjs/opus --ignore-scripts`
- Spotify hanya sebagai pencari metadata; audio tetap diambil dari YouTube
