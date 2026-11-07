const axios = require("axios");
const { readFileSync, writeFileSync, existsSync, unlinkSync } = require("fs");
const { homedir } = require("os");
const { join } = require("path");

const BASE = "https://chatai.org";
const CACHE_PATH = join(homedir(), ".chatai-session.json");
const SESSION_TTL = 2 * 60 * 60 * 1000;
const MAX_RETRIES = 3;
const REFRESH_THRESHOLD = 5;

const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

const MODELS = {
  chatgpt:   "openai/gpt-4o-mini",
  claude:    "anthropic/claude-haiku-4-5",
  gemini:    "google/gemini-2.0-flash-001",
  grok:      "x-ai/grok-3-mini-beta",
  deepseek:  "deepseek/deepseek-chat-v3-0324",
  qwen:      "qwen/qwen-2.5-72b-instruct",
  kimi:      "moonshotai/moonlight-16k",
  perplexity:"perplexity/sonar",
};

// Fungsi mengambil model secara acak dari list
function getRandomModel() {
  const keys = Object.keys(MODELS);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return MODELS[randomKey];
}

function resolveModel(input) {
  if (!input || input.toLowerCase() === "random") {
    return getRandomModel(); // Otomatis pilih acak jika kosong atau bernilai "random"
  }
  const lower = input.toLowerCase();
  if (MODELS[lower]) return MODELS[lower];
  const values = Object.values(MODELS);
  if (values.includes(input)) return input;
  return getRandomModel(); // Fallback ke acak jika input tidak dikenal
}

function parseCookieHeaders(headers) {
  const raw = headers["set-cookie"] ?? [];
  const jar = {};
  for (const entry of raw) {
    const [pair] = entry.split(";");
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    jar[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
  }
  return jar;
}

function cookieString(jar) {
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");
}

function extractCsrf(jar) {
  const raw = decodeURIComponent(jar["XSRF-TOKEN"] ?? "");
  try {
    return JSON.parse(Buffer.from(raw.split(".")[0], "base64").toString("utf8"))?.mac ?? raw;
  } catch {
    return raw;
  }
}

function loadCache() {
  try {
    if (!existsSync(CACHE_PATH)) return null;
    const rawData = readFileSync(CACHE_PATH, "utf8");
    if (!rawData) return null;
    const data = JSON.parse(rawData);
    if (Date.now() > data.expiresAt) return null;
    return data;
  } catch {
    return null;
  }
}

function saveCache(jar, csrfToken, remaining = null) {
  try {
    const prev = loadCache();
    const dataToSave = {
      jar,
      csrfToken,
      expiresAt: Date.now() + SESSION_TTL,
      remaining: remaining ?? prev?.remaining ?? null,
    };
    writeFileSync(CACHE_PATH, JSON.stringify(dataToSave, null, 2), "utf8");
  } catch (err) {
    // Abaikan error penulisan cache jika direktori read-only / terlarang
  }
}

function updateCacheRemaining(remaining) {
  try {
    // PERBAIKAN: Cek dulu keberadaan file sebelum membaca (readFileSync)
    if (!existsSync(CACHE_PATH)) return;
    
    const rawData = readFileSync(CACHE_PATH, "utf8");
    if (!rawData) return;
    
    const data = JSON.parse(rawData);
    data.remaining = remaining;
    writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    // Abaikan error jika terjadi masalah membaca/menulis cache
  }
}

function clearCache() {
  try {
    if (existsSync(CACHE_PATH)) unlinkSync(CACHE_PATH);
  } catch {}
}

async function fetchSession(force = false) {
  if (!force) {
    const cached = loadCache();
    if (cached) {
      if (cached.remaining === null || cached.remaining > REFRESH_THRESHOLD) {
        return cached;
      }
    }
  }

  const res = await axios.get(`${BASE}/chat`, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    maxRedirects: 5,
  });

  const jar = parseCookieHeaders(res.headers);
  const csrfToken = extractCsrf(jar);
  saveCache(jar, csrfToken, null);
  return { jar, csrfToken, remaining: null };
}

function buildHeaders(jar, csrfToken) {
  return {
    "Content-Type": "application/json",
    Accept: "*/*",
    Origin: BASE,
    Referer: `${BASE}/chat`,
    "X-CSRF-TOKEN": csrfToken,
    Cookie: cookieString(jar),
    "User-Agent": UA,
    "sec-ch-ua": '"Chromium";v="140", "Not?A_Brand";v="8"',
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };
}

function parseSSE(raw) {
  return raw
    .split("\n")
    .filter((l) => l.startsWith("data: ") && l !== "data: [DONE]")
    .map((l) => { try { return JSON.parse(l.slice(6)); } catch { return null; } })
    .filter(Boolean);
}

function extractText(chunks) {
  return chunks.flatMap((c) => c.choices ?? []).map((ch) => ch.delta?.content ?? "").join("");
}

function isQuotaError(status) {
  return [419, 422, 429, 401, 403].includes(status);
}

async function chat({ messages, model, jar, csrfToken }) {
  const res = await axios.post(
    `${BASE}/api/chat`,
    { model, messages },
    { headers: buildHeaders(jar, csrfToken), responseType: "text" }
  );

  const remaining = parseInt(res.headers["x-ratelimit-remaining"] ?? "-1", 10);
  if (remaining >= 0) updateCacheRemaining(remaining);

  const chunks = parseSSE(res.data);
  const last = chunks.at(-1);

  return {
    id: last?.id ?? null,
    model: last?.model ?? model,
    provider: last?.provider ?? null,
    content: extractText(chunks),
    usage: last?.usage ?? null,
    quota: { remaining, limit: parseInt(res.headers["x-ratelimit-limit"] ?? "-1", 10) },
  };
}

async function runWithRetry({ messages, model, attempt = 0 }) {
  const forceRefresh = attempt > 0;
  if (forceRefresh) {
    clearCache();
    // Jika percobaan sebelumnya gagal karena limit, otomatis ganti model secara acak pada retry berikutnya!
    model = getRandomModel();
  }

  const session = await fetchSession(forceRefresh);
  const payload = { messages, model, jar: session.jar, csrfToken: session.csrfToken };

  try {
    return await chat(payload);
  } catch (err) {
    const status = err.response?.status;
    if (isQuotaError(status) && attempt < MAX_RETRIES - 1) {
      return runWithRetry({ messages, model, attempt: attempt + 1 });
    }
    throw err;
  }
}

/**
 * Main AI function for API usage
 */
async function askChatAi(prompt, modelAlias = "random") {
  try {
    if (!prompt) {
      return { status: false, message: 'Parameter "prompt" wajib diisi.' };
    }

    const selectedModel = resolveModel(modelAlias);
    const messages = [{ role: "user", content: prompt }];

    const result = await runWithRetry({ messages, model: selectedModel });

    return {
      status: true,
      data: {
        model: result.model,
        prompt: prompt,
        response: result.content,
        usage: result.usage,
        quota: result.quota
      }
    };
  } catch (error) {
    return {
      status: false,
      message: error.response?.data?.message || error.message || "Gagal memproses respon AI."
    };
  }
}

module.exports = { askChatAi, MODELS };
