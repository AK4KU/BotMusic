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

// Setup Spotify credentials (jika ada)
(async () => {
  // Cek cookies.txt untuk yt-dlp (info saja, yt-dlp loads it langsung via --cookies flag)
  const cookiesPath = path.join(__dirname, '..', 'cookies.txt');
  if (fs.existsSync(cookiesPath)) {
    console.log('[YouTube] cookies.txt ditemukan — akan digunakan oleh yt-dlp untuk stream.');
  } else {
    console.warn('[YouTube] cookies.txt tidak ditemukan. Stream YouTube mungkin lebih lambat/gagal.');
  }

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
