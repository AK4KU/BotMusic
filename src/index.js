require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const playdl = require('play-dl');
const fs = require('fs');
const path = require('path');

// Tangkap semua error yang tidak di-handle agar bot tidak crash
process.on('unhandledRejection', (err) => {
  console.error('[UnhandledRejection]', err?.message || err);
});
process.on('uncaughtException', (err) => {
  console.error('[UncaughtException]', err?.message || err);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();   // Slash commands
client.prefixCommands = new Collection(); // Prefix commands
client.queues = new Map();            // Music queues per guild

/**
 * Parse Netscape cookies.txt format menjadi cookie string untuk play-dl.
 */
function parseNetscapeCookies(content) {
  return content
    .split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const parts = line.split('\t');
      if (parts.length >= 7) return `${parts[5]}=${parts[6]}`;
      return null;
    })
    .filter(Boolean)
    .join('; ');
}

// Setup YouTube cookies & Spotify credentials
(async () => {
  // ── YouTube Cookies ──────────────────────────────────────────────────────
  let youtubeCookie = '';

  // Prioritas 1: env var YOUTUBE_COOKIE (untuk Railway)
  if (process.env.YOUTUBE_COOKIE) {
    youtubeCookie = process.env.YOUTUBE_COOKIE;
    console.log('[YouTube] Cookie dimuat dari environment variable.');
  } else {
    // Prioritas 2: file cookies.txt lokal
    const cookiesPath = path.join(__dirname, '..', 'cookies.txt');
    if (fs.existsSync(cookiesPath)) {
      const raw = fs.readFileSync(cookiesPath, 'utf-8');
      youtubeCookie = parseNetscapeCookies(raw);
      console.log('[YouTube] Cookie dimuat dari cookies.txt.');
    } else {
      console.warn('[YouTube] Tidak ada cookie — YouTube mungkin memblokir request.');
    }
  }

  if (youtubeCookie) {
    await playdl.setToken({ youtube: { cookie: youtubeCookie } });
  }

  // ── Spotify credentials (opsional) ──────────────────────────────────────
  if (
    process.env.SPOTIFY_CLIENT_ID &&
    process.env.SPOTIFY_CLIENT_SECRET &&
    !process.env.SPOTIFY_CLIENT_ID.startsWith('your_') &&
    !process.env.SPOTIFY_CLIENT_SECRET.startsWith('your_')
  ) {
    await playdl.setToken({
      spotify: {
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
        refresh_token: '',
        market: 'ID',
      },
    });
    console.log('[Spotify] Credentials berhasil dimuat.');
  }
})();

loadCommands(client);
loadEvents(client);

client.login(process.env.DISCORD_TOKEN);
