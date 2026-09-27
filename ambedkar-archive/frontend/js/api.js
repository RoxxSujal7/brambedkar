/**
 * API Client — fetch wrapper with JWT auth headers & offline resilient fallbacks
 * All API calls go through this module
 */

const getApiBase = () => {
  if (typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null' && window.location.protocol.startsWith('http')) {
    // If running on backend port 5000 directly
    if (window.location.port === '5000' || window.location.port === '') {
      return `${window.location.origin}/api`;
    }
    // If running under dev live-server / vite (e.g. port 5500, 3000, 5173), default to backend at 5000
    return 'http://localhost:5000/api';
  }
  return 'http://localhost:5000/api';
};

const API_BASE = getApiBase();

const getToken = () => localStorage.getItem('auth_token') || localStorage.getItem('token');
window.getToken = getToken;

const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthSession();
      }
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (err) {
    // Attempt fallback to local express port 5000 if different base failed
    if (API_BASE !== 'http://localhost:5000/api' && !endpoint.startsWith('http')) {
      try {
        const altResponse = await fetch(`http://localhost:5000/api${endpoint}`, {
          ...options,
          headers,
        });
        if (altResponse.ok) {
          return await altResponse.json();
        }
      } catch (altErr) {
        // Continue to re-throw original error so callers can trigger local data fallbacks
      }
    }
    throw err;
  }
};

const clearAuthSession = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
};

// ── Local dataset helpers for offline/static resilience ──
let _localLettersCache = null;
async function fetchLocalLetters() {
  if (_localLettersCache && _localLettersCache.length > 0) return _localLettersCache;
  const paths = ['data/letters.json', '/data/letters.json', '../data/letters.json'];
  for (const p of paths) {
    try {
      const res = await fetch(p);
      if (res.ok) {
        _localLettersCache = await res.json();
        return _localLettersCache;
      }
    } catch (e) {}
  }
  return [];
}

let _localVowsCache = null;
async function fetchLocalVows() {
  if (_localVowsCache && _localVowsCache.length > 0) return _localVowsCache;
  const paths = ['data/vows.json', '/data/vows.json', '../data/vows.json'];
  for (const p of paths) {
    try {
      const res = await fetch(p);
      if (res.ok) {
        _localVowsCache = await res.json();
        return _localVowsCache;
      }
    } catch (e) {}
  }
  return [];
}

let _localVolumesCache = null;
async function fetchLocalVolumes() {
  if (_localVolumesCache && _localVolumesCache.length > 0) return _localVolumesCache;
  const paths = ['data/volumes.json', '/data/volumes.json', '../data/volumes.json'];
  for (const p of paths) {
    try {
      const res = await fetch(p);
      if (res.ok) {
        _localVolumesCache = await res.json();
        return _localVolumesCache;
      }
    } catch (e) {}
  }
  return [];
}

async function filterLocalLetters(params = {}) {
  const letters = await fetchLocalLetters();
  let { q = '', to = '', from = '', year = '', page = 1, limit = 24 } = params;
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit) || 24));

  let filtered = letters;
  if (q && q.trim()) {
    const term = q.trim().toLowerCase();
    filtered = filtered.filter((l) => {
      const fromStr = (l.from || '').toLowerCase();
      const toStr = (l.to || '').toLowerCase();
      const textEn = (l.text && l.text.English ? l.text.English : '').toLowerCase();
      const textMr = (l.text && l.text.Marathi ? l.text.Marathi : '').toLowerCase();
      return fromStr.includes(term) || toStr.includes(term) || textEn.includes(term) || textMr.includes(term);
    });
  }
  if (to && to.trim()) {
    const toTerm = to.trim().toLowerCase();
    filtered = filtered.filter((l) => (l.to || '').toLowerCase().includes(toTerm));
  }
  if (from && from.trim()) {
    const fromTerm = from.trim().toLowerCase();
    filtered = filtered.filter((l) => (l.from || '').toLowerCase().includes(fromTerm));
  }
  if (year && year.trim()) {
    filtered = filtered.filter((l) => (l.date || '').startsWith(year.trim()));
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  return {
    success: true,
    total,
    page,
    totalPages,
    limit,
    letters: paginated,
  };
}

async function getLocalLetter(id) {
  const letters = await fetchLocalLetters();
  const letter = letters.find((l) => l.letter_id === id || String(l.id) === String(id));
  if (!letter) {
    throw new Error('Letter not found in historical record');
  }
  return { success: true, letter };
}

async function getLocalVowsLanguages() {
  const allVows = await fetchLocalVows();
  const languages = allVows.map((v) => ({
    id: v.id,
    name: v.name,
    title: v.title,
    description: v.description,
    vowCount: (v.vows || []).length,
  }));
  return {
    success: true,
    languages,
    totalLanguages: languages.length,
    defaultLanguage: 'mr',
  };
}

async function getLocalVowsByLang(lang = 'mr') {
  const allVows = await fetchLocalVows();
  const targetLang = (lang || 'mr').toLowerCase().trim();
  let entry = allVows.find(
    (v) => (v.id || '').toLowerCase() === targetLang || (v.name || '').toLowerCase() === targetLang
  );
  if (!entry) {
    entry = allVows.find((v) => v.id === 'en') || allVows[0];
  }
  return { success: true, data: entry };
}

// ── API Module Object ──────────────────────────────
const api = {
  // ── Auth ──────────────────────────────────────────
  auth: {
    register: (body) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    googleLogin: (body) => apiFetch('/auth/google', { method: 'POST', body: JSON.stringify(body) }),
    sendOtp: (body) => apiFetch('/auth/send-otp', { method: 'POST', body: JSON.stringify(body) }),
    verifyOtp: (body) => apiFetch('/auth/verify-otp', { method: 'POST', body: JSON.stringify(body) }),
    forgotPassword: (body) => apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),
    resetPassword: (body) => apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
    me: () => apiFetch('/auth/me'),
    updateProfile: (body) => apiFetch('/auth/profile', { method: 'PATCH', body: JSON.stringify(body) }),
  },

  // ── Documents ─────────────────────────────────
  documents: {
    list: (params = {}) => apiFetch('/documents?' + new URLSearchParams(params)),
    get: (id) => apiFetch(`/documents/${id}`),
    search: (q, params = {}) => apiFetch('/documents/search?' + new URLSearchParams({ q, ...params })),
    featured: () => apiFetch('/documents/featured'),
  },

  // ── Progress ──────────────────────────────────
  progress: {
    getAll: () => apiFetch('/progress'),
    get: (docId) => apiFetch(`/progress/${docId}`),
    save: (docId, body) => apiFetch(`/progress/${docId}`, { method: 'POST', body: JSON.stringify(body) }),
    reset: (docId) => apiFetch(`/progress/${docId}`, { method: 'DELETE' }),
  },

  // ── Bookmarks ─────────────────────────────────
  bookmarks: {
    getAll: () => apiFetch('/bookmarks'),
    add: (body) => apiFetch('/bookmarks', { method: 'POST', body: JSON.stringify(body) }),
    remove: (id) => apiFetch(`/bookmarks/${id}`, { method: 'DELETE' }),
  },

  // ── Media ─────────────────────────────────────
  media: {
    list: (params = {}) => apiFetch('/media?' + new URLSearchParams(params)),
    featured: () => apiFetch('/media/featured'),
    get: (id) => apiFetch(`/media/${id}`),
  },

  // ── Letters (361 Historical Letters) ──────────
  letters: {
    list: async (params = {}) => {
      try {
        return await apiFetch('/letters?' + new URLSearchParams(params));
      } catch (err) {
        console.warn('API /letters unreachable, utilizing local archive dataset:', err.message);
        return await filterLocalLetters(params);
      }
    },
    get: async (id) => {
      try {
        return await apiFetch(`/letters/${id}`);
      } catch (err) {
        console.warn(`API /letters/${id} unreachable, utilizing local archive dataset:`, err.message);
        return await getLocalLetter(id);
      }
    },
  },

  // ── 22 Vows (11 Languages) ────────────────────
  vows: {
    languages: async () => {
      try {
        return await apiFetch('/vows');
      } catch (err) {
        console.warn('API /vows unreachable, utilizing local dataset:', err.message);
        return await getLocalVowsLanguages();
      }
    },
    get: async (lang) => {
      try {
        return await apiFetch(`/vows/${lang}`);
      } catch (err) {
        console.warn(`API /vows/${lang} unreachable, utilizing local dataset:`, err.message);
        return await getLocalVowsByLang(lang);
      }
    },
  },

  // ── BAWS 20 Volumes & Writings ────────────────
  volumes: {
    list: async () => {
      try {
        return await apiFetch('/volumes');
      } catch (err) {
        console.warn('API /volumes unreachable, utilizing local dataset:', err.message);
        const data = await fetchLocalVolumes();
        return { success: true, volumes: data };
      }
    },
    writings: (params = {}) => apiFetch('/volumes/writings?' + new URLSearchParams(params)),
    getDownloadUrl: (code) => `/books/${code}.pdf`,
  },

  // ── Search (unified) ──────────────────────────────
  search: (q, params = {}) => apiFetch('/search?' + new URLSearchParams({ q, ...params })),

  // ── Health ────────────────────────────────────────
  health: () => apiFetch('/health'),
};

window.api = api;
window.clearAuthSession = clearAuthSession;
window.apiFetch = apiFetch;
