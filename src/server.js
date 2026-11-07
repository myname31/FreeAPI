const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;

// Tracker Uptime & Request Status
const startTime = Date.now();
let totalRequests = 0;
let successfulRequests = 0;

// IMPORT FUNGSI SCRAPER & MENU
const { pinterestScraper } = require("./services/pinterestScraper");
const { stalkML } = require("./services/stalkerML");
const { geniusSearch, geniusDetail } = require("./services/geniusScraper");
const { downloaderIg } = require("./services/igScraper");
const { searchTracks, downloadDirect } = require("./services/soundcloudScraper");
const { askChatAi } = require("./services/chatAiScraper");
const { geminiChat } = require("./services/geminiWebScraper");
const ytMusic = require("./services/ytMusic");
const { getStalkerMenu, getSearchMenu, getMusicMenu, getGeniusMenu } = require("./menuService");

app.use(express.json());

// 1. DAFTARKAN FOLDER PUBLIC
app.use(express.static(path.join(process.cwd(), "public")));

// Middleware Logging Request
app.use((req, res, next) => {
  const path = req.path;
  const isStaticFile = path.includes(".") || path === "/" || path.startsWith("/css") || path.startsWith("/js");
  
  if (!isStaticFile) {
    totalRequests++;
    
    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        successfulRequests++;
      }
    });

    fetch("https://countapi.mileshilliard.com/api/v1/hit/zansky-api-requests")
      .catch(() => {});
  }
  next();
});

// Endpoint System Status Dashboard
app.get("/api/system-status", (req, res) => {
  const successRate = totalRequests > 0 
    ? Math.round((successfulRequests / totalRequests) * 100) 
    : 100;

  res.json({
    startTime: startTime,
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    totalRequests: totalRequests,
    successfulRequests: successfulRequests,
    successRate: successRate
  });
});

// ==========================================
// 📌 MENU INDEX ENDPOINTS (Hanya /api)
// ==========================================
app.get("/api/stalk", (req, res) => {
  res.status(200).json(getStalkerMenu());
});
app.get("/api/search", (req, res) => {
  res.status(200).json(getSearchMenu());
});
app.get("/api/music", (req, res) => {
  res.status(200).json(getMusicMenu());
});
app.get("/api/genius", (req, res) => {
  res.status(200).json(getGeniusMenu());
});
// ==========================================
// 📌 SERVICE API ENDPOINTS (Hanya /api)
// ==========================================

// Search Pinterest
app.get("/api/search/pinterest", async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ success: false, message: "Parameter query wajib diisi." });
  }
  const data = await pinterestScraper(query);
  if (data.success) {
    res.status(200).json(data);
  } else {
    res.status(500).json(data);
  }
});

// Stalk ML
app.get("/api/stalk/ml", async (req, res) => {
  const { userId, serverId } = req.query;

  if (!userId || !serverId) {
    return res.status(400).json({
      status: "failed",
      code: 400,
      message: "Parameter 'userId' dan 'serverId' wajib diisi."
    });
  }
  const result = await stalkML(userId, serverId);
  return res.status(result.code).json(result);
});

// YouTube Music Search
app.get("/api/ytmusic/search", async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ status: false, message: 'Parameter "query" wajib diisi.' });
  }
  const data = await ytMusic.search(query);
  res.json({
    status: !data.error,
    data: data
  });
});

// YouTube Music Get Lyrics
app.get("/api/ytmusic/lyrics", async (req, res) => {
  const { videoId } = req.query;
  if (!videoId) {
    return res.status(400).json({ status: false, message: 'Parameter "videoId" wajib diisi.' });
  }
  const data = await ytMusic.getLyrics(videoId);
  res.json({
    status: !data.error,
    data: data
  });
});

// Endpoint Genius Search (/api/genius/search)
app.get("/api/genius/search", async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ status: false, message: 'Parameter "query" wajib diisi.' });
  }
  const result = await geniusSearch(query);
  res.status(result.status ? 200 : 500).json(result);
});

// Endpoint Genius Detail & Lyrics (/api/genius/detail)
app.get("/api/genius/detail", async (req, res) => {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ status: false, message: 'Parameter "id" lagu wajib diisi.' });
  }
  const result = await geniusDetail(id);
  res.status(result.status ? 200 : 500).json(result);
});

// Endpoint IG Downloader
app.get("/api/download/instagram", async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ 
            status: false, 
            message: 'Parameter "url" Instagram wajib diisi.' 
        });
    }
    const result = await downloaderIg(url);
    res.status(result.status ? 200 : 500).json(result);
});

// Endpoint Pencarian SoundCloud
app.get("/api/search/soundcloud", async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ status: false, message: 'Parameter "query" wajib diisi.' });
    }
    const result = await searchTracks(query);
    res.status(result.status ? 200 : 500).json(result);
});

// Endpoint Downloader SoundCloud
app.get("/api/download/soundcloud", async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ status: false, message: 'Parameter "url" SoundCloud wajib diisi.' });
    }
    const result = await downloadDirect(url);
    res.status(result.status ? 200 : 500).json(result);
});

// Endpoint API Chat AI Multi-Model (Support Random & Manual)
app.get("/api/ai/chatai", async (req, res) => {
    const { prompt, model } = req.query;
    // Validasi parameter prompt
    if (!prompt) {
        return res.status(400).json({ 
            status: false, 
            message: 'Parameter "prompt" wajib diisi.' 
        });
    }
    // Jika model tidak dikirim oleh pengguna, otomatis bernilai "random"
    const selectedModel = model ? model.toLowerCase() : "random";
    // Panggil fungsi askChatAi
    const result = await askChatAi(prompt, selectedModel);
    // Kembalikan response JSON
    res.status(result.status ? 200 : 500).json(result);
});

// Endpoint API Gemini Web
app.get("/api/ai/gemini-web", async (req, res) => {
    const { prompt, sessionId } = req.query;

    if (!prompt) {
        return res.status(400).json({ status: false, message: 'Parameter "prompt" wajib diisi.' });
    }

    const result = await geminiChat(prompt, sessionId || null);
    res.status(result.status ? 200 : 500).json(result);
});

// 2. FALLBACK ROUTE UNTUK FRONTEND DASHBOARD
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

// Expose Server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server Backend berjalan di http://localhost:${PORT}`);
  });
}

module.exports = app;
