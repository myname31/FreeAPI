const axios = require("axios");
const cheerio = require("cheerio");

const client = axios.create({
  baseURL: "https://id.pinterest.com",
  headers: {
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "cache-control": "no-cache",
    pragma: "no-cache",
    referer: "https://id.pinterest.com/",
    "sec-ch-ua": '"Chromium";v="148", "Google Chrome";v="148", "Not:A-Brand";v="99"',
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-origin",
    "upgrade-insecure-requests": "1",
    "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36"
  }
});

async function pinterestScraper(query) {
  try {
    if (!query) throw new Error("Query wajib diisi");

    const { data: html, headers } = await client.get("/search/pins/?q=" + encodeURIComponent(query) + "&rs=typed");

    const cookies = headers["set-cookie"];
    if (cookies?.length) {
      client.defaults.headers.cookie = cookies.map(v => v.split(";")[0]).join("; ");
    }

    const csrf = cookies?.find(v => v.includes("csrftoken="))?.match(/csrftoken=([^;]+)/)?.[1];
    if (csrf) client.defaults.headers["x-csrftoken"] = csrf;

    const dollar = cheerio.load(html);
    const results = [];
    const used = new Set();

    dollar("img").each((_, el) => {
      let image = dollar(el).attr("src") || dollar(el).attr("srcset")?.split(" ")[0];

      if (!image) return;
      if (image.includes("/60x60/") || image.includes("avatar")) return;
      if (!image.includes("pinimg.com")) return;

      let title = dollar(el).attr("alt") || dollar(el).parent().attr("title") || null;
      let link = dollar(el).closest("a").attr("href") || null;

      if (link && !link.startsWith("http")) {
        link = "https://id.pinterest.com" + link;
      }

      let id = null;
      if (link) {
        const match = link.match(/\/pin\/(\d+)/);
        if (match) id = match[1];
      }

      if (used.has(image)) return;
      used.add(image);

      results.push({ id, title, image, link });
    });

    return {
      success: true,
      result: { query, total: results.length, pins: results.slice(0, 20) }
    };
  } catch (e) {
    return {
      success: false,
      message: e.response?.data?.message || e.message || "Unknown error",
      response: e.response?.data || null
    };
  }
}

// EKSPOR FUNGSI AGAR BISA DI-IMPORT DI SERVER.JS
module.exports = { pinterestScraper };
