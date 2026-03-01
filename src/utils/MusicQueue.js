const {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType,
} = require('@discordjs/voice');
const playdl = require('play-dl');
const { spawn } = require('child_process');
const { PassThrough } = require('stream');
const path = require('path');
const fs = require('fs');

// Path ke binary yt-dlp — cross-platform (Windows: yt-dlp.exe, Linux: yt-dlp)
const YTDLP_BINARY = (() => {
  const base = path.join(__dirname, '..', '..', 'node_modules', 'yt-dlp-exec', 'bin');
  const win = path.join(base, 'yt-dlp.exe');
  const unix = path.join(base, 'yt-dlp');
  if (fs.existsSync(win)) return win;
  if (fs.existsSync(unix)) return unix;
  // Fallback: pakai yt-dlp dari PATH sistem
  return process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
})();

// Konversi browser cookie string (format: "name=val; name2=val2")
// ke format Netscape yang dipakai yt-dlp
function browserCookiesToNetscape(cookieStr) {
  const lines = [
    '# Netscape HTTP Cookie File',
    '# Generated from YOUTUBE_COOKIE env var',
    '',
  ];
  for (const pair of cookieStr.split(';').map(s => s.trim()).filter(Boolean)) {
    const eq = pair.indexOf('=');
    if (eq === -1) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    // domain  includeSubdomains  path  secure  expiry  name  value
    lines.push(`.youtube.com\tTRUE\t/\tTRUE\t0\t${name}\t${value}`);
  }
  return lines.join('\n') + '\n';
}

// Tentukan path cookies yang akan digunakan
const COOKIES_PATH = (() => {
  // 1. Prioritas: env var YOUTUBE_COOKIE (untuk Railway/server tanpa file system persisten)
  const envCookie = process.env.YOUTUBE_COOKIE;
  if (envCookie && envCookie.trim()) {
    const tmpPath = path.join(require('os').tmpdir(), 'yt_cookies.txt');
    try {
      fs.writeFileSync(tmpPath, browserCookiesToNetscape(envCookie), 'utf-8');
      console.log('[YouTube] Cookies dimuat dari env var YOUTUBE_COOKIE →', tmpPath);
      return tmpPath;
    } catch (e) {
      console.warn('[YouTube] Gagal tulis cookies dari env var:', e.message);
    }
  }
  // 2. Fallback: cookies.txt lokal
  return path.join(__dirname, '..', '..', 'cookies.txt');
})();

// Validasi cookies yang akan dipakai
const COOKIES_VALID = (() => {
  try {
    if (!fs.existsSync(COOKIES_PATH)) return false;
    const firstLine = fs.readFileSync(COOKIES_PATH, 'utf-8').split('\n')[0] || '';
    return firstLine.startsWith('# Netscape HTTP Cookie File') || firstLine.startsWith('# HTTP Cookie File');
  } catch { return false; }
})();
if (!COOKIES_VALID) {
  if (fs.existsSync(COOKIES_PATH)) {
    console.warn('[YouTube] cookies.txt ditemukan tapi bukan format Netscape — diabaikan.');
  } else {
    console.warn('[YouTube] Tidak ada cookies — bot mungkin kena bot-check YouTube.');
  }
}

class MusicQueue {
  constructor(guildId, client) {
    this.guildId = guildId;
    this.client = client;
    this.tracks = [];
    this.currentTrack = null;
    this.connection = null;
    this.player = createAudioPlayer();
    this.volume = 1.0;
    this.loop = false;      // loop lagu saat ini
    this.loopQueue = false; // loop seluruh queue
    this.textChannel = null;

    this._leaveTimeout = null; // timer "queue kosong", dibatalkan jika lagu baru masuk

    this.player.on(AudioPlayerStatus.Idle, () => {
      this._onTrackEnd();
    });

    this.player.on('error', (err) => {
      console.error(`[Player Error] ${err.message}`);
      this._onTrackEnd();
    });
  }

  /** Sambungkan ke voice channel */
  async connect(voiceChannel) {
    this.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    try {
      await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);
    } catch {
      this.connection.destroy();
      throw new Error('Gagal terhubung ke voice channel.');
    }

    this.connection.subscribe(this.player);

    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        this.destroy();
      }
    });
  }

  /** Tambahkan lagu ke queue */
  addTrack(track) {
    // Batalkan timer keluar jika antrian sempat kosong
    if (this._leaveTimeout) {
      clearTimeout(this._leaveTimeout);
      this._leaveTimeout = null;
    }
    this.tracks.push(track);
  }

  /** Mulai memutar lagu berikutnya */
  async playNext() {
    if (this.tracks.length === 0) {
      this.currentTrack = null;
      if (this.textChannel) {
        this.textChannel.send('✅ Queue kosong. Bot akan keluar dari voice channel dalam 30 detik...');
      }
      // Simpan timer agar bisa dibatalkan jika lagu baru masuk
      this._leaveTimeout = setTimeout(() => {
        if (this.tracks.length === 0) {
          this.destroy();
        }
        this._leaveTimeout = null;
      }, 30_000);
      return;
    }

    // Ada lagu baru — batalkan timer keluar jika masih berjalan
    if (this._leaveTimeout) {
      clearTimeout(this._leaveTimeout);
      this._leaveTimeout = null;
    }

    this.currentTrack = this.tracks.shift();

    // Tentukan URL YouTube yang akan distream
    // yt-dlp bisa handle URL apapun (youtube.com, youtu.be + tracking params, dll)
    // hanya Spotify yang perlu dicari dulu di YouTube
    let ytUrl = null;
    const rawUrl = this.currentTrack.url || '';
    const isYouTube = rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be');
    const isSpotify = rawUrl.includes('spotify.com');

    if (isYouTube) {
      ytUrl = rawUrl;
    } else if (isSpotify) {
      try {
        const query = `${this.currentTrack.title} ${this.currentTrack.artist || ''}`.trim();
        const results = await this._searchYT(query);
        ytUrl = results[0].url;
      } catch {
        if (this.textChannel) {
          this.textChannel.send(`❌ Lagu Spotify tidak ditemukan di YouTube: **${this.currentTrack?.title}**. Melewati...`);
        }
        return this.playNext();
      }
    } else {
      // Query teks biasa — cari di YouTube
      try {
        const results = await this._searchYT(rawUrl || this.currentTrack.title);
        ytUrl = results[0].url;
      } catch {
        if (this.textChannel) {
          this.textChannel.send(`❌ Gagal mencari lagu: **${this.currentTrack?.title}**. Melewati...`);
        }
        return this.playNext();
      }
    }

    // Stream via yt-dlp (paling andal)
    try {
      const resource = await this._ytdlpStream(ytUrl);
      resource.volume.setVolume(this.volume);
      this.player.play(resource);

      if (this.textChannel) {
        this.textChannel.send(
          `🎵 Sedang memutar: **${this.currentTrack.title}** | Durasi: \`${this.currentTrack.duration}\` | Diminta oleh: ${this.currentTrack.requestedBy}`
        );
      }
    } catch (err) {
      console.error(`[playNext yt-dlp Error] ${err.message}`);
      if (this.textChannel) {
        this.textChannel.send(`❌ Gagal memutar: **${this.currentTrack?.title}**. Melewati ke lagu berikutnya...`);
      }
      this.playNext();
    }
  }

  /** Stream audio via yt-dlp menggunakan PassThrough */
  _ytdlpStream(url) {
    return new Promise((resolve, reject) => {
      const args = [
        url,
        '-f', 'bestaudio/best',
        '-o', '-',
        '--no-playlist',
        '--no-warnings',
        '--quiet',
        '-N', '4',
        // Gunakan iOS client agar lolos bot-check YouTube
        '--extractor-args', 'youtube:player_client=ios,web',
      ];

      if (COOKIES_VALID) {
        args.push('--cookies', COOKIES_PATH);
      }

      const proc = spawn(YTDLP_BINARY, args);
      const passThrough = new PassThrough();

      let settled = false;
      let gotFirstChunk = false;

      const doReject = (err) => {
        if (!settled) {
          settled = true;
          passThrough.destroy();
          try { proc.kill(); } catch {}
          reject(err);
        }
      };

      proc.on('error', doReject);
      proc.stdout.on('error', doReject);
      passThrough.on('error', () => {}); // abaikan error passThrough setelah resolve

      proc.stderr.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg) console.error(`[yt-dlp] ${msg}`);
      });

      // Tunggu chunk pertama sebagai konfirmasi stream berjalan
      proc.stdout.once('data', (firstChunk) => {
        if (settled) return;
        gotFirstChunk = true;
        settled = true;
        clearTimeout(timeout);

        passThrough.write(firstChunk);
        proc.stdout.pipe(passThrough);

        const resource = createAudioResource(passThrough, {
          inputType: StreamType.Arbitrary,
          inlineVolume: true,
        });
        resource._ytdlpProc = proc;
        resolve(resource);
      });

      proc.once('close', (code) => {
        clearTimeout(timeout);
        if (!gotFirstChunk) {
          doReject(new Error(`yt-dlp keluar dengan kode ${code ?? 1} sebelum data diterima`));
        }
      });

      const timeout = setTimeout(() => {
        doReject(new Error('yt-dlp timeout: tidak ada data setelah 30 detik'));
      }, 30_000);
    });
  }

  /** Search YouTube via play-dl dan kembalikan URL pertama */
  async _searchYT(query) {
    const results = await playdl.search(
      query,
      { source: { youtube: 'video' }, limit: 5 }
    );
    if (!results.length) throw new Error(`Tidak ada hasil YouTube untuk: ${query}`);
    return results;
  }

  /** Coba stream dengan fallback quality (legacy, sebagai cadangan) */
  async _tryStream(url) {
    const qualities = [2, 1, 0];
    let lastErr;
    for (const quality of qualities) {
      try {
        return await playdl.stream(url, { quality });
      } catch (err) {
        lastErr = err;
      }
    }
    try {
      return await playdl.stream(url);
    } catch (err) {
      throw lastErr || err;
    }
  }

  /** Dipanggil saat lagu selesai */
  _onTrackEnd() {
    if (this.loop && this.currentTrack) {
      // Loop lagu saat ini
      this.tracks.unshift(this.currentTrack);
    } else if (this.loopQueue && this.currentTrack) {
      // Loop queue: taruh lagu yang selesai ke akhir queue
      this.tracks.push(this.currentTrack);
    }
    this.playNext();
  }

  /** Skip lagu */
  skip() {
    // Kill yt-dlp proses jika ada
    if (this.player.state?.resource?._ytdlpProc) {
      try { this.player.state.resource._ytdlpProc.kill(); } catch {}
    }
    this.player.stop(true);
  }

  /** Pause */
  pause() {
    return this.player.pause();
  }

  /** Resume */
  resume() {
    return this.player.unpause();
  }

  /** Set volume (0.0 - 2.0) */
  setVolume(vol) {
    this.volume = vol;
    if (this.player.state.resource?.volume) {
      this.player.state.resource.volume.setVolume(vol);
    }
  }

  /** Shuffle queue */
  shuffle() {
    for (let i = this.tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
    }
  }

  /** Hancurkan queue dan tinggalkan channel */
  destroy() {
    if (this._leaveTimeout) {
      clearTimeout(this._leaveTimeout);
      this._leaveTimeout = null;
    }
    this.tracks = [];
    this.currentTrack = null;
    // Kill yt-dlp proses jika ada
    if (this.player.state?.resource?._ytdlpProc) {
      try { this.player.state.resource._ytdlpProc.kill(); } catch {}
    }
    this.player.stop(true);
    if (this.connection) {
      try { this.connection.destroy(); } catch {}
      this.connection = null;
    }
    this.client.queues.delete(this.guildId);
  }

  /** Cek apakah sedang Paused */
  get isPaused() {
    return this.player.state.status === AudioPlayerStatus.Paused;
  }

  /** Cek apakah sedang Playing */
  get isPlaying() {
    return this.player.state.status === AudioPlayerStatus.Playing;
  }
}

module.exports = MusicQueue;
