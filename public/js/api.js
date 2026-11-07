/**
 * System endpoint structural definitions and modular contracts mappings
 */
const ApiEndpoints = [
    {
        id: "pinterest",
        category: "SEARCHING",
        method: "GET",
        path: "/api/search/pinterest", // 👈 Sudah disesuaikan dengan prefix /api
        description: "Mencari ide gambar, referensi visual, dan metadata langsung dari engine Pinterest via Engine Scraper terenkripsi.",
        params: [
            { name: "query", required: true, type: "text", placeholder: "Contoh: Lofi cozy bedroom setup" }
        ],
        mockResponse: {
            success: true,
            result: {
                query: "Lofi cozy bedroom setup",
                total: 1,
                pins: [
                    {
                        id: "8397732430293",
                        title: "Aesthetic Lofi Room Neon Light glow Idea",
                        image: "https://i.pinimg.com/originals/ab/cd/ef/abcdef123.jpg",
                        link: "https://id.pinterest.com/pin/8397732430293/"
                    }
                ]
            }
        }
    },
    {
        id: "stalker-ml",
        category: "STALKER",
        method: "GET",
        path: "/api/stalk/ml", // 👈 Sudah disesuaikan dengan prefix /api
        description: "Mengecek validitas ID & Server Mobile Legends serta menampilkan Nickname dan Region akun.",
        params: [
            { name: "userId", required: true, type: "text", placeholder: "Contoh: 12345678" },
            { name: "serverId", required: true, type: "text", placeholder: "Contoh: 1234" }
        ],
        mockResponse: {
            status: "success",
            code: 200,
            data: {
                id: "12345678",
                server: "1234",
                username: "Xcalibur",
                region: "Indonesia"
            }
        }
    },
    {
        id: "ytmusic-search",
        category: "MUSIC", // 👈 Kategori Baru: MUSIC
        method: "GET",
        path: "/api/ytmusic/search",
        description: "Mencari lagu, musik, artis, atau album langsung dari YouTube Music.",
        params: [
            { name: "query", required: true, type: "text", placeholder: "Contoh: Jatuh Suka Tulus" }
        ],
        mockResponse: {
            status: true,
            data: {
                query: "Jatuh Suka Tulus",
                results: [
                    {
                        type: "item",
                        category: "Song",
                        title: "Jatuh Suka",
                        videoId: "abc123xyz",
                        playUrl: "https://music.youtube.com/watch?v=abc123xyz",
                        artists: "Tulus",
                        album: "Manusia",
                        playsOrDuration: "3:54",
                        thumbnail: "https://lh3.googleusercontent.com/..."
                    }
                ]
            }
        }
    },
    {
        id: "ytmusic-lyrics",
        category: "MUSIC",
        method: "GET",
        path: "/api/ytmusic/lyrics",
        description: "Mengambil lirik lagu dari YouTube Music berdasarkan videoId / track ID.",
        params: [
            { name: "videoId", required: true, type: "text", placeholder: "Contoh: abc123xyz" }
        ],
        mockResponse: {
            status: true,
            data: {
                videoId: "abc123xyz",
                lyrics: "Lirik lagu akan tampil di sini...",
                source: "Musixmatch"
            }
        }
    },
    {
        id: "genius-search",
        category: "MUSIC",
        method: "GET",
        path: "/api/genius/search",
        description: "Mencari lagu/lirik dari platform Genius berdasarkan judul atau artis.",
        params: [
            { name: "query", required: true, type: "text", placeholder: "Contoh: Pesan Terakhir Lydora" }
        ],
        mockResponse: {
            status: true,
            data: [
                {
                    id: 7021148,
                    title: "Pesan Terakhir",
                    artist: "Lydora",
                    header_image_url: "https://images.genius.com/...",
                    url: "https://genius.com/Lyodra-pesan-terakhir-lyrics"
                }
            ]
        }
    },
    {
        id: "genius-detail",
        category: "MUSIC",
        method: "GET",
        path: "/api/genius/detail",
        description: "Mengambil detail lagu beserta lirik yang sudah terformat rapi dari Genius menggunakan Song ID.",
        params: [
            { name: "id", required: true, type: "text", placeholder: "Contoh: 7021148" }
        ],
        mockResponse: {
            status: true,
            data: {
                id: 7021148,
                title: "Pesan Terakhir",
                artist: "Lyodra",
                lyrics_formatted: "[Intro]\n...\n\n[Verse 1]\n..."
            }
        }
    },
    {
        id: "ig-downloader",
        category: "DOWNLOADER",
        method: "GET",
        path: "/api/download/instagram",
        description: "Mendownload media Instagram (Foto, Video, Reels, & Carousel/Slide) menggunakan URL postingan.",
        params: [
            { name: "url", required: true, type: "text", placeholder: "https://www.instagram.com/p/..." }
        ],
        mockResponse: {
            status: true,
            data: [
                {
                    url: "https://instagram.fsub1-1.fna.fbcdn.net/...",
                    type: "video" // atau "image"
                }
            ]
        }
    },
    {
        id: "soundcloud-search",
        category: "SEARCHING",
        method: "GET",
        path: "/api/search/soundcloud",
        description: "Mencari daftar lagu/track audio di SoundCloud berdasarkan kata kunci.",
        params: [
            { name: "query", required: true, type: "text", placeholder: "misal: Alan Walker Faded" }
        ],
        mockResponse: {
            status: true,
            data: [
                {
                    id: 12345678,
                    title: "Faded",
                    artist: "Alan Walker",
                    cover: "https://...-t500x500.jpg",
                    url: "https://soundcloud.com/alanwalker/faded"
                }
            ]
        }
    },
    {
        id: "soundcloud-downloader",
        category: "DOWNLOADER",
        method: "GET",
        path: "/api/download/soundcloud",
        description: "Mendownload lagu/audio MP3 dari SoundCloud menggunakan URL postingan lagu.",
        params: [
            { name: "url", required: true, type: "text", placeholder: "https://soundcloud.com/..." }
        ],
        mockResponse: {
            status: true,
            data: {
                id: 12345678,
                title: "Faded",
                artist: "Alan Walker",
                cover: "https://...-t500x500.jpg",
                url: "https://soundcloud.com/alanwalker/faded",
                streamUrl: "https://cf-media.sndcdn.com/...",
                format: "progressive"
            }
        }
    },
    {
        id: "chatai-multi-model",
        category: "AI",
        method: "GET",
        path: "/api/ai/chatai",
        description: "Layanan Multi-Model AI (ChatGPT, Claude, Gemini, Grok, DeepSeek, dll) dengan rotasi model otomatis/acak dan sistem anti-limit.",
        params: [
            { 
                name: "prompt", 
                required: true, 
                type: "text", 
                placeholder: "misal: Buatkan puisi tentang hujan" 
            },
            { 
                name: "model", 
                required: false, 
                type: "select",
                placeholder: "misal: chatgpt",
                options: [
                    { label: "🔀 Otomatis / Acak (Rekomendasi)", value: "random" },
                    { label: "ChatGPT (GPT-4o Mini)", value: "chatgpt" },
                    { label: "Claude Haiku", value: "claude" },
                    { label: "Google Gemini 2.0", value: "gemini" },
                    { label: "X-AI Grok 3", value: "grok" },
                    { label: "DeepSeek V3", value: "deepseek" },
                    { label: "Qwen 2.5", value: "qwen" },
                    { label: "Kimi Moonlight", value: "kimi" },
                    { label: "Perplexity Sonar", value: "perplexity" }
                ]
            }
        ],
        mockResponse: {
            status: true,
            data: {
                model: "openai/gpt-40-mini",
                prompt: "Buatkan puisi tentang hujan",
                response: "Rintik menari di atas genting...",
                usage: { prompt_tokens: 12, completion_tokens: 45 },
                quota: { remaining: 98, limit: 100 }
            }
        }
    },
    {
        id: "gemini-web-direct",
        category: "AI",
        method: "GET",
        path: "/api/ai/gemini-web",
        description: "Layanan Google Gemini Web Direct Scraper dengan fitur pencatatan memori / sesi percakapan (sessionId).",
        params: [
            { 
                name: "prompt", 
                required: true, 
                type: "text", 
                placeholder: "misal: Siapa nama Presiden Indonesia?" 
            },
            { 
                name: "sessionId", 
                required: false, 
                type: "text", 
                placeholder: "Opsional: Tempel sessionId dari respon sebelumnya untuk melanjutkan percakapan" 
            }
        ],
        mockResponse: {
            status: true,
            data: {
                prompt: "Siapa nama Presiden Indonesia?",
                response: "Presiden Republik Indonesia saat ini adalah...",
                sessionId: "eyJjb29raWUiOiJOSUQ9NTEx...",
            }
        }
    }
];

// Share global configuration state variables
window.ApiEndpoints = ApiEndpoints;
