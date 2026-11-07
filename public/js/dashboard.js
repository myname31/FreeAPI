// ==========================================
// REAL-TIME COUNTER SYSTEM (COUNTAPI & STATUS)
// ==========================================
const COUNT_API_BASE = "https://countapi.mileshilliard.com/api/v1";
const VISITOR_KEY = "zansky-api-visitor";
const REQUEST_KEY = "zansky-api-requests";

// Variable global untuk menyimpan waktu mulai server
let serverStartTime = Date.now();

// Fungsi Uptime Dinamis (Detik di kiri, Menit/Jam/Hari bertambah ke kanan)
function formatUptime(totalSeconds) {
    if (isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0;

    const d = Math.floor(totalSeconds / (3600 * 24));
    const h = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);

    const pad = (num) => String(num).padStart(2, '0');

    // 1. Jika sudah 1 hari ke atas
    if (d > 0) {
        return `${pad(s)}s ${pad(m)}m ${pad(h)}h ${d}d`;
    }
    // 2. Jika sudah 1 jam ke atas
    if (h > 0) {
        return `${pad(s)}s ${pad(m)}m ${h}h`;
    }
    // 3. Jika sudah 1 menit ke atas
    if (m > 0) {
        return `${pad(s)}s ${m}m`;
    }
    // 4. Di bawah 1 menit (hanya detik)
    return `${pad(s)}s`;
}

// 1. Ambil & Tambah Hit Visitor saat Web Dibuka
async function loadVisitorCounter() {
    try {
        const response = await fetch(`${COUNT_API_BASE}/hit/${VISITOR_KEY}`);
        const data = await response.json();
        
        const visitorElem = document.getElementById("visitor-val");
        if (visitorElem && data.value !== undefined) {
            visitorElem.textContent = data.value.toLocaleString("id-ID");
        }
    } catch (error) {
        console.error("Visitor Counter Error:", error);
        const visitorElem = document.getElementById("visitor-val");
        if (visitorElem) visitorElem.textContent = "N/A";
    }
}

// 2. Ambil Jumlah Total API Requests
async function loadRequestCounter() {
    try {
        const response = await fetch(`${COUNT_API_BASE}/get/${REQUEST_KEY}`);
        const data = await response.json();
        
        const requestElem = document.getElementById("request-val");
        if (requestElem && data.value !== undefined) {
            requestElem.textContent = data.value.toLocaleString("id-ID");
        }
    } catch (error) {
        console.error("Request Counter Error:", error);
        const requestElem = document.getElementById("request-val");
        if (requestElem) requestElem.textContent = "0";
    }
}

// 3. Tambah Hit API Request (+1)
async function incrementRequestCounter() {
    try {
        const response = await fetch(`${COUNT_API_BASE}/hit/${REQUEST_KEY}`);
        const data = await response.json();
        
        const requestElem = document.getElementById("request-val");
        if (requestElem && data.value !== undefined) {
            requestElem.textContent = data.value.toLocaleString("id-ID");
        }
    } catch (error) {
        console.error("Increment Request Error:", error);
    }
}

// 4. Ambil Status Sistem (Uptime Waktu & Success Rate)
async function loadSystemStatus() {
    try {
        const response = await fetch('/api/system-status');
        if (!response.ok) return;
        const data = await response.json();

        if (data.startTime) {
            serverStartTime = data.startTime;
        }

        const successElem = document.getElementById("success-val");
        if (successElem && data.successRate !== undefined) {
            successElem.textContent = `${data.successRate}%`;
        }
    } catch (e) {
        console.warn("System status fetch passive error:", e);
    }
}

/**
 * Core interface runtime application controller module
 */
document.addEventListener("DOMContentLoaded", () => {
    const appContainer = document.getElementById("app");
    const skeletonLoader = document.getElementById("skeleton-loader");
    const realtimeClock = document.getElementById("realtime-clock");
    const realtimeDate = document.getElementById("realtime-date");
    const statusBadge = document.getElementById("api-status-badge");
    const consoleOutput = document.getElementById("live-console-output");

    // Inisialisasi awal aplikasi dengan transisi halus
    setTimeout(() => {
        skeletonLoader.classList.add("fade-out-loader");
        appContainer.classList.remove("hidden");
        
        buildStatsCards();
        buildExplorerAccordion();
        buildStaticDocs();

        function getDeploymentPlatform() {
            const host = window.location.hostname;
            if (host === "localhost" || host === "127.0.0.1") return "Local Environment";
            if (host.endsWith(".vercel.app")) return "Vercel Edge Network";
            if (host.endsWith(".netlify.app")) return "Netlify Edge Network";
            if (host.endsWith(".onrender.com")) return "Render Cloud Engine";
            return `Production Cloud (${host})`;
        }

        const totalEndpoints = (window.ApiEndpoints && Array.isArray(window.ApiEndpoints)) 
            ? window.ApiEndpoints.length 
            : 0;

        pushLog("SYSTEM", "Initializing API Gateway Core Engine...");
        pushLog("INFO", `API successfully deployed on [${getDeploymentPlatform()}]`);
        pushLog("SUCCESS", "Environment variables & security protocols active.");

        setTimeout(async () => {
            try {
                const health = await fetch('/api/system-status', { cache: 'no-store' });
                if (!health.ok) throw new Error(`HTTP ${health.status}`);
                statusBadge.className = "badge badge-online";
                statusBadge.textContent = "Online";
                pushLog("SUCCESS", `Loaded ${totalEndpoints} API endpoints into the explorer.`);
                pushLog("READY", "Public API is responding. No authentication required.");
            } catch (error) {
                statusBadge.className = "badge badge-offline";
                statusBadge.textContent = "Unavailable";
                pushLog("ERROR", `API health check failed: ${error.message}`);
            }
        }, 900);
        
    }, 1600);
    
    // Timer Realtime Clock & Uptime Counter (Berdetak setiap detik)
    setInterval(() => {
        const now = new Date();
        realtimeClock.textContent = now.toTimeString().split(' ')[0];
        realtimeDate.textContent = now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

        // Update tampilan Uptime secara live
        const uptimeElem = document.getElementById("uptime-val");
        if (uptimeElem) {
            const elapsedSeconds = Math.floor((now.getTime() - serverStartTime) / 1000);
            uptimeElem.textContent = formatUptime(elapsedSeconds);
        }
    }, 1000);

    // Navigasi Section
    document.querySelectorAll(".nav-item").forEach(navLink => {
        navLink.addEventListener("click", function(e) {
            e.preventDefault();
            document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
            this.classList.add("active");
            const targetSectionId = this.getAttribute("data-target");
            document.querySelectorAll(".content-section").forEach(sec => sec.classList.add("hidden"));
            const target = document.getElementById(targetSectionId);
            if (target) target.classList.remove("hidden");
            document.getElementById("main-sidebar").classList.remove("open");
            window.location.hash = this.getAttribute("href").slice(1);
        });
    });

    document.getElementById("sidebar-toggle").addEventListener("click", () => {
        document.getElementById("main-sidebar").classList.toggle("open");
    });

    // Generator Kartu Statistik Dashboard
    function buildStatsCards() {
        const container = document.getElementById("stats-container");
        const statsData = [
            { id: "visitor-val", label: "Visits", value: "0", icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>' },
            { id: "request-val", label: "API Requests", value: "0", icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>' },
            { id: "uptime-val", label: "Uptime", value: "—", icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>' },
            { id: "success-val", label: "Success Rate", value: "—", icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' }
        ];

        container.innerHTML = '';
        statsData.forEach(item => {
            const card = document.createElement("div");
            card.className = "stat-card slide-up";
            card.innerHTML = `
                <div class="stat-card-header">
                    <span>${item.label}</span>
                    <span class="text-muted">${item.icon}</span>
                </div>
                <div class="stat-card-value" id="${item.id}">${item.value}</div>
            `;
            container.appendChild(card);
        });

        // Jalankan pemanggilan counter real-time
        loadVisitorCounter();
        loadRequestCounter();
        loadSystemStatus();
    }

    // Modern Terminal Logger
    function pushLog(level, message) {
        const oldCursor = consoleOutput.querySelector(".terminal-cursor");
        if (oldCursor) oldCursor.remove();

        const line = document.createElement("div");
        line.className = "log-line fade-in";
        const timeStamp = new Date().toTimeString().split(' ')[0];
        
        const time = document.createElement("span");
        time.className = "log-time";
        time.textContent = `[${timeStamp}]`;
        const tag = document.createElement("span");
        tag.className = `log-level-${String(level).toLowerCase()}`;
        tag.textContent = `[${level}]`;
        const msg = document.createElement("span");
        msg.className = "log-msg";
        msg.textContent = message;
        line.append(time, tag, msg);
        consoleOutput.appendChild(line);
        const history = document.getElementById("logs-history-output");
        if (history) {
            history.appendChild(line.cloneNode(true));
            while (history.children.length > 200) history.firstElementChild.remove();
        }

        const cursor = document.createElement("span");
        cursor.className = "terminal-cursor";
        consoleOutput.appendChild(cursor);

        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    // Console Action Triggers
    document.getElementById("btn-clear-console").addEventListener("click", () => consoleOutput.innerHTML = '');
    document.getElementById("btn-copy-console").addEventListener("click", () => {
        if (navigator.clipboard?.writeText) navigator.clipboard.writeText(consoleOutput.innerText).catch(() => {});
    });
    document.getElementById("btn-copy-logs")?.addEventListener("click", () => {
        const history = document.getElementById("logs-history-output");
        if (history) navigator.clipboard?.writeText(history.innerText).catch(() => {});
    });
    document.getElementById("btn-export-console").addEventListener("click", () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(consoleOutput.innerText));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "api_gateway_system_logs.txt");
        downloadAnchor.click();
    });

    // Component Explorer Generator with Filter & Search Support
    function buildExplorerAccordion() {
        const accordion = document.getElementById("explorer-accordion");
        accordion.innerHTML = '';

        if (!window.ApiEndpoints) return;
        const countLabel = document.getElementById("endpoint-count");
        if (countLabel) countLabel.textContent = `${window.ApiEndpoints.length} endpoints`;

        const grouped = window.ApiEndpoints.reduce((acc, ep) => {
            const cat = ep.category || 'OTHER';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(ep);
            return acc;
        }, {});

        Object.keys(grouped).forEach(categoryName => {
            const catHeader = document.createElement("div");
            catHeader.className = "category-group-header";
            // Tag kelompok kategori dengan data attribute untuk fitur filter
            catHeader.setAttribute("data-category-group", categoryName);
            catHeader.style.cssText = `
                display: flex;
                align-items: center;
                gap: 12px;
                margin: 36px 0 18px 0;
                padding: 10px 16px;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid var(--card-border);
                border-left: 4px solid var(--accent);
                border-radius: 10px;
                width: fit-content;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            `;

            catHeader.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent); opacity: 0.9;">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                <span style="font-size: 14px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--foreground);">${categoryName}</span>
            `;
            accordion.appendChild(catHeader);

            grouped[categoryName].forEach(ep => {
                const item = document.createElement("div");
                item.className = "accordion-item";
                item.setAttribute("data-method", ep.method);
                // Tag atribut pencarian agar mudah difilter
                item.setAttribute("data-category-parent", categoryName);
                item.setAttribute("data-search-keywords", `${ep.path} ${ep.description || ''} ${ep.category || ''}`.toLowerCase());
                
                let inputsHtml = ep.params.map(p => {
                    const required = p.required ? 'required' : '';
                    if (p.type === 'textarea') return `<div class="form-group"><label>${p.name} ${p.required ? '<span>*</span>' : ''}</label><textarea class="form-input" name="${p.name}" placeholder="${p.placeholder || ''}" ${required}></textarea></div>`;
                    if (p.type === 'select') return `<div class="form-group"><label>${p.name} ${p.required ? '<span>*</span>' : ''}</label><select class="form-input" name="${p.name}" ${required}>${(p.options || []).map(option => `<option value="${option.value}">${option.label}</option>`).join('')}</select></div>`;
                    return `<div class="form-group"><label>${p.name} ${p.required ? '<span>*</span>' : ''}</label><input type="${p.type || 'text'}" class="form-input" name="${p.name}" placeholder="${p.placeholder || ''}" ${required}/></div>`;
                }).join('');

                item.innerHTML = `
                    <button class="accordion-trigger ripple-surface">
                        <div class="endpoint-badge-container">
                            <span class="method-badge">${ep.method}</span>
                            <span class="path-text">${ep.path}</span>
                        </div>
                        <svg class="accordion-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <div class="accordion-content-wrapper">
                        <div class="accordion-content">
                            <div class="accordion-content-inner">
                                <p class="text-muted" style="font-size: 13px; margin: 12px 0;">${ep.description}</p>
                                <form class="endpoint-form">
                                    ${inputsHtml || '<p class="text-muted" style="font-size:12px;">Endpoint ini tidak memerlukan parameter input.</p>'}
                                    <div class="explorer-actions">
                                        <button type="submit" class="btn btn-primary ripple-surface">Execute Request</button>
                                    </div>
                                </form>
                                <div class="explorer-response-container hidden"></div>
                            </div>
                        </div>
                    </div>
                `;

                accordion.appendChild(item);

                const trigger = item.querySelector(".accordion-trigger");
                trigger.addEventListener("click", (e) => {
                    if (window.Utils?.createRipple) window.Utils.createRipple(e, trigger);
                    const isOpen = item.classList.contains("open");
                    document.querySelectorAll(".accordion-item").forEach(i => i.classList.remove("open"));
                    if (!isOpen) item.classList.add("open");
                });

                const form = item.querySelector(".endpoint-form");
                form.addEventListener("submit", function(e) {
                    e.preventDefault();
                    const submitBtn = form.querySelector('button[type="submit"]');
                    const responseContainer = item.querySelector(".explorer-response-container");
                    
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = `<span class="spinner"></span> Executing...`;
                    responseContainer.classList.add("hidden");

                    const formData = new FormData(form);
                    let requestUrl = ep.path;
                    let fetchOptions = { method: ep.method };

                    if (ep.method === "GET") {
                        const params = new URLSearchParams();
                        for (let [key, value] of formData.entries()) {
                            params.append(key, value);
                        }
                        if([...params].length) requestUrl += `?${params.toString()}`;
                    } else {
                        const bodyData = {};
                        for (let [key, value] of formData.entries()) {
                            bodyData[key] = value;
                        }
                        fetchOptions.headers = { 'Content-Type': 'application/json' };
                        fetchOptions.body = JSON.stringify(bodyData);
                    }

                    const startTime = performance.now();

                    fetch(requestUrl, fetchOptions)
                        .then(res => {
                            const statusText = `HTTP ${res.status} ${res.statusText}`;
                            return res.text().then(text => {
                                let data;
                                try { data = text ? JSON.parse(text) : {}; }
                                catch (_) { data = { response: text || "(empty response)" }; }
                                return { statusText, data };
                            });
                        })
                        .then(({ statusText, data }) => {
                            const duration = (performance.now() - startTime).toFixed(1);
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = `Execute Request`;
                            
                            responseContainer.innerHTML = `
                                <div class="response-meta-header">
                                    <div>${statusText}</div>
                                    <div class="meta-badges-group">
                                        <span>Time: ${duration}ms</span>
                                        <span>Size: ${JSON.stringify(data).length} B</span>
                                    </div>
                                </div>
                                <pre class="response-body-pre">${window.Utils?.syntaxHighlightJson ? window.Utils.syntaxHighlightJson(data) : JSON.stringify(data, null, 2)}</pre>
                                <div class="console-actions" style="padding: 8px; background: var(--secondary-bg); justify-content: flex-end; border-top: 1px solid var(--secondary-border);">
                                    <button type="button" class="btn btn-secondary btn-sm btn-copy-res">Copy Payload</button>
                                    <button type="button" class="btn btn-danger btn-sm btn-clear-res">Clear</button>
                                </div>
                            `;
                            responseContainer.classList.remove("hidden");
                            
                            pushLog("SUCCESS", `Successfully retrieved live data from: [${ep.method}] ${ep.path}`);
                            loadSystemStatus();

                            responseContainer.querySelector(".btn-copy-res").addEventListener("click", () => {
                                navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                                pushLog("INFO", "Payload response data copied.");
                            });
                            responseContainer.querySelector(".btn-clear-res").addEventListener("click", () => {
                                responseContainer.classList.add("hidden");
                                responseContainer.innerHTML = '';
                            });
                        })
                        .catch(err => {
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = `Execute Request`;
                            responseContainer.innerHTML = `<div class="response-meta-header"><strong>Request failed</strong><span>Network / parsing error</span></div><pre class="response-body-pre"></pre>`;
                            responseContainer.querySelector("pre").textContent = err.message || "Unable to complete request.";
                            responseContainer.classList.remove("hidden");
                            pushLog("ERROR", `API request failed on ${ep.path}: ${err.message}`);
                            loadSystemStatus();
                        });
                });
            });
        });

        // Event Handler untuk Input Search Realtime
        const searchInput = document.getElementById("search-endpoint-input");
        if (searchInput) {
            searchInput.addEventListener("input", function() {
                const keyword = this.value.trim().toLowerCase();
                const accordionItems = accordion.querySelectorAll(".accordion-item");
                const categoryHeaders = accordion.querySelectorAll(".category-group-header");

                // Menyimpan jumlah endpoint aktif per kategori
                const activeCategoryCounts = {};

                accordionItems.forEach(item => {
                    const searchKeywords = item.getAttribute("data-search-keywords") || "";
                    const categoryParent = item.getAttribute("data-category-parent");

                    if (!activeCategoryCounts[categoryParent]) {
                        activeCategoryCounts[categoryParent] = 0;
                    }

                    if (searchKeywords.includes(keyword)) {
                        item.style.display = "";
                        activeCategoryCounts[categoryParent]++;
                    } else {
                        item.style.display = "none";
                    }
                });

                // Sembunyikan header kategori jika tidak ada endpoint yang cocok
                categoryHeaders.forEach(header => {
                    const groupName = header.getAttribute("data-category-group");
                    if (activeCategoryCounts[groupName] && activeCategoryCounts[groupName] > 0) {
                        header.style.display = "flex";
                    } else {
                        header.style.display = "none";
                    }
                });
            });
        }
    }

    // Static Documentation Compiler
    function buildStaticDocs() {
        const container = document.getElementById("docs-container");
        container.innerHTML = '';

        if (!window.ApiEndpoints) return;

        const grouped = window.ApiEndpoints.reduce((acc, ep) => {
            const cat = ep.category || 'OTHER';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(ep);
            return acc;
        }, {});

        Object.keys(grouped).forEach(categoryName => {
            const catHeader = document.createElement("div");
            catHeader.className = "category-group-header";
            catHeader.style.cssText = `
                display: flex;
                align-items: center;
                gap: 12px;
                margin: 36px 0 18px 0;
                padding: 10px 16px;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid var(--card-border);
                border-left: 4px solid var(--accent);
                border-radius: 10px;
                width: fit-content;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            `;

            catHeader.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent); opacity: 0.9;">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                <span style="font-size: 14px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--foreground);">${categoryName}</span>
            `;
            container.appendChild(catHeader);

            grouped[categoryName].forEach(ep => {
                const card = document.createElement("div");
                card.className = "docs-card slide-up";
                card.innerHTML = `
                    <div class="docs-header">
                        <span class="method-badge">${ep.method}</span>
                        <strong style="font-family:monospace; font-size:16px;">${ep.path}</strong>
                    </div>
                    <p class="text-muted" style="font-size: 14px; margin: 8px 0;">${ep.description}</p>
                    <div class="docs-grid">
                        <div style="overflow: hidden; width: 100%;">
                            <div class="docs-block-title">Example Structured Request</div>
                            <pre class="response-body-pre" style="border: 1px solid var(--secondary-border); border-radius:8px;">${ep.method} ${ep.path} HTTP/1.1\nHost: ${window.location.host}\nContent-Type: application/json\n\n${JSON.stringify(ep.params.reduce((acc, p) => ({...acc, [p.name]: p.placeholder}), {}), null, 2)}</pre>
                        </div>
                        <div style="overflow: hidden; width: 100%;">
                            <div class="docs-block-title">Example JSON Contract Response</div>
                            <pre class="response-body-pre" style="border: 1px solid var(--secondary-border); border-radius:8px;">${window.Utils?.syntaxHighlightJson ? window.Utils.syntaxHighlightJson(ep.mockResponse) : JSON.stringify(ep.mockResponse, null, 2)}</pre>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        });
    }
});
