const playdl = require('play-dl');
const { getTracks } = require('spotify-url-info');

/**
 * Cek apakah input adalah URL Spotify.
 */
function isSpotifyUrl(input) {
  return /open\.spotify\.com\/(track|playlist|album)\//.test(input);
}

/**
 * Cari YouTube berdasarkan judul + artist, kembalikan track object.
 */
async function searchYouTube(title, artist, duration, thumbnail, requestedBy) {
  const query = artist ? `${title} ${artist}` : title;
  const results = await playdl.search(query, { source: { youtube: 'video' }, limit: 1 });
  if (!results.length) return null;
  const v = results[0];
  return {
    url: v.url,
    title,
    duration: duration || v.durationRaw,
    thumbnail: thumbnail || v.thumbnails?.[0]?.url,
    artist,
    requestedBy,
  };
}

/**
 * Resolve input (URL atau query) menjadi array track object.
 * Support: YouTube video, YouTube playlist, Spotify track, Spotify playlist, Spotify album.
 */
async function resolveTracks(input, requestedBy) {
  // ── Spotify (tanpa API key) ──────────────────────────────────────────────
  if (isSpotifyUrl(input)) {
    const spTracks = await getTracks(input);
    if (!spTracks || spTracks.length === 0) throw new Error('Gagal mengambil info dari Spotify.');

    const resolved = [];
    for (const t of spTracks) {
      const title = t.name || t.title;
      const artist = Array.isArray(t.artists)
        ? t.artists.map(a => (typeof a === 'string' ? a : a.name)).join(', ')
        : (t.artist || '');
      const thumbnail = t.image || t.album?.images?.[0]?.url;
      const duration = t.duration_ms ? msToTime(t.duration_ms) : null;
      const track = await searchYouTube(title, artist, duration, thumbnail, requestedBy);
      if (track) resolved.push(track);
    }
    if (!resolved.length) throw new Error('Tidak ada lagu Spotify yang berhasil diproses.');
    return resolved;
  }

  const type = await playdl.validate(input);

  // ── YouTube: Single video ────────────────────────────────────────────────
  if (type === 'yt_video') {
    const info = await playdl.video_info(input);
    return [{
      url: input,
      title: info.video_details.title,
      duration: info.video_details.durationRaw,
      thumbnail: info.video_details.thumbnails?.[0]?.url,
      artist: info.video_details.channel?.name,
      requestedBy,
    }];
  }

  // ── YouTube: Playlist ────────────────────────────────────────────────────
  if (type === 'yt_playlist') {
    const playlist = await playdl.playlist_info(input, { incomplete: true });
    const videos = await playlist.all_videos();
    return videos.map(v => ({
      url: v.url,
      title: v.title,
      duration: v.durationRaw,
      thumbnail: v.thumbnails?.[0]?.url,
      artist: v.channel?.name,
      requestedBy,
    }));
  }

  // ── Fallback: Search YouTube ─────────────────────────────────────────────
  const results = await playdl.search(input, { source: { youtube: 'video' }, limit: 1 });
  if (!results.length) throw new Error(`Tidak ada hasil untuk: **${input}**`);
  const v = results[0];
  return [{
    url: v.url,
    title: v.title,
    duration: v.durationRaw,
    thumbnail: v.thumbnails?.[0]?.url,
    artist: v.channel?.name,
    requestedBy,
  }];
}

function msToTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

module.exports = { resolveTracks };
