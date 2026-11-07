/*
Genius Scraper + Lyrics Formatter
Base : https://play.google.com/store/apps/details?id=com.genius.android
Author : ZennzXD
*/

const headers = {
  'Accept-Encoding': 'gzip',
  'x-genius-app-background-request': '0',
  'x-genius-logged-out': 'true',
  'x-genius-android-version': '8.1.1',
  'user-agent': 'Genius/8.1.1 (Android; Android 13; ZN/Android)'
};

function parselirik(node) {
  if (typeof node === 'string') return node;
  if (!node || !node.children) return '';
  if (node.tag === 'br') return '\n';
  return node.children.map(parselirik).join('');
}

async function detail(id) {
  try {
    const res = await fetch(`https://api.genius.com/songs/${id}`, { headers });
    const data = await res.json();
    const song = data.response.song;

    const rawLyrics = song.lyrics ? parselirik(song.lyrics.dom).trim() : null;

    return {
      status: true,
      data: {
        id: song.id,
        title: song.title,
        artist: song.artist_names,
        header_image_url: song.header_image_url,
        song_art_image_url: song.song_art_image_url,
        instrumental: song.instrumental,
        is_music: song.is_music,
        hidden: song.hidden,
        explicit: song.explicit,
        release_date: song.release_date_for_display,
        url: song.url,
        lyrics: rawLyrics,
        lyrics_formatted: rawLyrics ? formatLyrics(rawLyrics) : null
      }
    };
  } catch (error) {
    return { status: false, message: error.message };
  }
}

async function search(query) {
  try {
    const res = await fetch(`https://api.genius.com/search/multi?q=${encodeURIComponent(query)}`, { headers });
    const data = await res.json();

    const songs = [];
    const seenIds = new Set();

    for (const section of data.response.sections) {
      if (section.type === 'song' || section.type === 'top_hit') {
        for (const hit of section.hits) {
          if (hit.type === 'song') {
            const song = hit.result;

            if (seenIds.has(song.id)) continue;
            seenIds.add(song.id);

            songs.push({
              id: song.id,
              title: song.title,
              artist: song.artist_names,
              header_image_url: song.header_image_url,
              url: song.url
            });
          }
        }
      }
    }

    return { status: true, data: songs };
  } catch (error) {
    return { status: false, message: error.message };
  }
}

function formatLyrics(raw) {
  let text = raw.trim();
  let result = "";

  const titleMatch = text.match(/^\[Lirik[^\]]*\]/i);
  if (titleMatch) {
    result += titleMatch[0] + "\n\n";
    text = text.slice(titleMatch[0].length).trim();
  }

  const parts = text.split(/(\[[^\]]+\])/g).filter((p) => p.trim() !== "");

  for (const part of parts) {
    if (/^\[[^\]]+\]$/.test(part)) {
      result += `\n${part}\n`;
    } else {
      const lines = splitIntoLines(part);
      result += lines.join("\n") + "\n";
    }
  }

  return result.trim();
}

function splitIntoLines(text) {
  let spaced = text
    .replace(/([a-z0-9\?\!\.\,\)])([A-Z])/g, "$1\n$2")
    .replace(/[ \t]+/g, " ")
    .trim();

  return spaced
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

// Menggunakan exports langsung
exports.geniusSearch = search;
exports.geniusDetail = detail;
exports.formatLyrics = formatLyrics;
