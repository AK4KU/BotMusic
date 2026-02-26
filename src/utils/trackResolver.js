const playdl = require('play-dl');

/**
 * Resolve input (URL atau query) menjadi array track object.
 * Support: YouTube video, YouTube playlist, Spotify track, Spotify playlist, Spotify album.
 */
async function resolveTracks(input, requestedBy) {
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

  // ── Spotify: Single track ────────────────────────────────────────────────
  if (type === 'sp_track') {
    const sp = await playdl.spotify(input);
    return [{
      url: input,
      title: sp.name,
      duration: msToTime(sp.durationInMs),
      thumbnail: sp.thumbnail?.url,
      artist: sp.artists?.map(a => a.name).join(', '),
      requestedBy,
    }];
  }

  // ── Spotify: Playlist atau Album ─────────────────────────────────────────
  if (type === 'sp_playlist' || type === 'sp_album') {
    const sp = await playdl.spotify(input);
    const tracks = await sp.all_tracks();
    return tracks.map(t => ({
      url: t.url,
      title: t.name,
      duration: msToTime(t.durationInMs),
      thumbnail: t.thumbnail?.url,
      artist: t.artists?.map(a => a.name).join(', '),
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
