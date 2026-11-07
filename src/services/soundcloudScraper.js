const fs = require('fs');
const path = require('path');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const CACHE_FILE = path.join(__dirname, '.client_id');

function getCachedClientId() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const id = fs.readFileSync(CACHE_FILE, 'utf8').trim();
      if (id && id.length === 32) return id;
    }
  } catch (e) {}
  return null;
}

function saveCachedClientId(id) {
  try {
    fs.writeFileSync(CACHE_FILE, id, 'utf8');
  } catch (e) {}
}

async function scrapeClientId() {
  const res = await fetch('https://soundcloud.com', {
    headers: { 'User-Agent': USER_AGENT }
  });
  if (!res.ok) throw new Error('Gagal mengakses SoundCloud untuk mencari client_id.');
  
  const html = await res.text();
  const scriptRegex = /<script\s+[^>]*src="([^"]+)"/gi;
  let match;
  const scriptUrls = [];
  while ((match = scriptRegex.exec(html)) !== null) {
    scriptUrls.push(match[1]);
  }
  
  for (const url of scriptUrls.reverse()) {
    try {
      const scriptRes = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!scriptRes.ok) continue;
      const code = await scriptRes.text();
      
      const clientIdMatch = code.match(/client_id[:=]"([a-zA-Z0-9]{32})"/i) || 
                            code.match(/client_id=([a-zA-Z0-9]{32})/i) ||
                            code.match(/client_id:"([a-zA-Z0-9]{32})"/i);
      if (clientIdMatch) {
        const id = clientIdMatch[1];
        saveCachedClientId(id);
        return id;
      }
    } catch (e) {}
  }
  throw new Error('Tidak dapat menemukan client_id di script SoundCloud.');
}

async function getClientId(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = getCachedClientId();
    if (cached) return cached;
  }
  return await scrapeClientId();
}

async function callApi(urlBuilder) {
  let clientId = await getClientId();
  try {
    const res = await fetch(urlBuilder(clientId), { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.status === 401) {
      clientId = await getClientId(true);
      const retryRes = await fetch(urlBuilder(clientId), { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!retryRes.ok) throw new Error(`API gagal dengan status: ${retryRes.status}`);
      return await retryRes.json();
    }
    if (!res.ok) throw new Error(`API gagal dengan status: ${res.status}`);
    return await res.json();
  } catch (err) {
    clientId = await getClientId(true);
    const retryRes = await fetch(urlBuilder(clientId), { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!retryRes.ok) throw new Error(`API gagal setelah refresh client_id: ${retryRes.status}`);
    return await retryRes.json();
  }
}

function getHighResCover(url) {
  if (!url) return 'https://soundcloud.com/images/default_album.png';
  return url.replace('-large.', '-t500x500.');
}

async function search(queryOrUrl) {
  if (!queryOrUrl || typeof queryOrUrl !== 'string') {
    throw new Error('Parameter query atau URL wajib diisi.');
  }

  const isUrl = queryOrUrl.startsWith('http://') || queryOrUrl.startsWith('https://');

  if (isUrl) {
    const trackInfo = await callApi((clientId) => 
      `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(queryOrUrl)}&client_id=${clientId}`
    );
    
    if (trackInfo.kind === 'playlist') {
      const playlistTracks = (trackInfo.tracks || []).map(t => ({
        id: t.id,
        title: t.title,
        artist: t.user?.username || 'Unknown Artist',
        cover: getHighResCover(t.artwork_url || trackInfo.artwork_url),
        url: t.permalink_url,
        media: t.media
      }));
      return { tracks: playlistTracks, clientId: await getClientId() };
    }

    return {
      tracks: [{
        id: trackInfo.id,
        title: trackInfo.title,
        artist: trackInfo.user?.username || 'Unknown Artist',
        cover: getHighResCover(trackInfo.artwork_url),
        url: trackInfo.permalink_url,
        media: trackInfo.media
      }],
      clientId: await getClientId()
    };
  } else {
    const searchResult = await callApi((clientId) => 
      `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(queryOrUrl)}&client_id=${clientId}&limit=15`
    );
    
    const tracks = (searchResult.collection || []).map(t => ({
      id: t.id,
      title: t.title,
      artist: t.user?.username || 'Unknown Artist',
      cover: getHighResCover(t.artwork_url),
      url: t.permalink_url,
      media: t.media
    }));

    return { tracks, clientId: await getClientId() };
  }
}

async function getDownloadLinks(trackMedia, clientId) {
  if (!trackMedia || !trackMedia.transcodings) {
    throw new Error('Track tidak memiliki informasi transcoding.');
  }

  const transcodings = trackMedia.transcodings;
  const progressive = transcodings.find(t => t.format.protocol === 'progressive');
  const hls = transcodings.find(t => t.format.protocol === 'hls');
  
  const targetTranscoding = progressive || hls;
  if (!targetTranscoding) {
    throw new Error('Format audio tidak didukung untuk lagu ini.');
  }

  const cid = clientId || await getClientId();
  const res = await fetch(`${targetTranscoding.url}?client_id=${cid}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  
  if (!res.ok) {
    throw new Error(`Gagal mengambil URL audio stream. Status: ${res.status}`);
  }

  const data = await res.json();
  
  return {
    streamUrl: data.url || null,
    protocol: targetTranscoding.format.protocol,
    mimeType: targetTranscoding.format.mime_type
  };
}

async function downloadDirect(soundCloudUrl) {
  try {
    const result = await search(soundCloudUrl);
    if (!result.tracks || result.tracks.length === 0) {
      return { status: false, message: 'Lagu tidak ditemukan dari URL SoundCloud tersebut.' };
    }
    const track = result.tracks[0];
    const streamData = await getDownloadLinks(track.media, result.clientId);
    
    return {
      status: true,
      data: {
        id: track.id,
        title: track.title,
        artist: track.artist,
        cover: track.cover,
        url: track.url,
        streamUrl: streamData.streamUrl,
        format: streamData.protocol
      }
    };
  } catch (err) {
    return { status: false, message: err.message || 'Gagal memproses SoundCloud.' };
  }
}

async function searchTracks(query) {
  try {
    const result = await search(query);
    return {
      status: true,
      data: result.tracks.map(t => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        cover: t.cover,
        url: t.url
      }))
    };
  } catch (err) {
    return { status: false, message: err.message || 'Gagal mencari lagu di SoundCloud.' };
  }
}

module.exports = {
  searchTracks,
  downloadDirect
};
