/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GLOBAL NAVIGATION & MOVABLE DOCKBAR SYSTEM (MASTER COMPONENT)
 * Dr. B. R. Ambedkar Digital Heritage Archive
 * Single Source of Truth for Navbar, Movable Floating Dock, and Drawer
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function(window, document) {
  'use strict';

  const STORAGE_KEY = 'ambedkar_dock_snap';
  const DEFAULT_SNAP = 'snap-bottom-center';

  // 1. Master Configuration
  const NAV_CONFIG = {
    brand: {
      title: 'AMBEDKAR ARCHIVE',
      sub: 'Digital Heritage Platform',
      icon: '⚜️',
      href: 'index.html'
    },
    topLinks: [
      { href: 'index.html', label: 'Home', id: 'home' },
      { href: 'archive.html', label: 'Complete Works (60 Vol)', id: 'archive' },
      { href: 'letters.html', label: 'Letters (361)', id: 'letters' },
      { href: 'vows.html', label: '22 Vows', id: 'vows' },
      { href: 'timeline.html', label: 'Timeline', id: 'timeline' },
      { href: 'assistant.html', label: 'AI Assistant', id: 'assistant' }
    ],
    dockItems: [
      { href: 'memorials.html', label: 'Memorials', icon: '🏛️', page: 'memorials', title: 'National Memorials & Heritage' },
      { href: 'debates.html', label: 'Debates', icon: '⚖️', page: 'debates', title: 'Political Thought & Historical Debates' },
      { href: 'kiosk.html', label: 'Kiosk', icon: '🖥️', page: 'kiosk', title: 'Institutional Kiosk Mode' },
      { href: 'exhibition.html', label: 'Display', icon: '📺', page: 'exhibition', title: 'Smart Display Ambient Mode' },
      { href: 'slides.html', label: 'Deck 16:9', icon: '📽️', page: 'slides', title: 'Visual Exhibition Deck (16:9)', badge: '16:9' },
      { href: 'constitution.html', label: 'Constitution', icon: '📜', page: 'constitution', title: 'Constitution of India' },
      { href: 'ideas.html', label: 'Ideas', icon: '💡', page: 'ideas', title: 'Thematic Ideas & Philosophy' },
      { href: 'media.html', label: 'Speeches', icon: '🎬', page: 'media', title: 'Speeches & Audio-Visual Archive' },
      { href: 'ocr.html', label: 'OCR', icon: '📜', page: 'ocr', title: 'Manuscript OCR Visualizer' },
      { href: 'about.html', label: 'About', icon: '✨', page: 'about', title: 'About the Creator & Vision' }
    ],
    bottomTabs: [
      { href: 'index.html', label: 'Home', icon: '🏠', id: 'home' },
      { href: 'archive.html', label: 'Volumes', icon: '📚', id: 'archive' },
      { href: 'media.html', label: 'Speeches', icon: '🎬', id: 'media' },
      { href: 'timeline.html', label: 'Timeline', icon: '📅', id: 'timeline' },
      { href: 'assistant.html', label: 'AI', icon: '🤖', id: 'assistant' }
    ],
    drawerLinks: [
      { href: 'index.html', label: 'Home', icon: '🏠', id: 'home' },
      { href: 'archive.html', label: 'Complete Works (60 Volumes)', icon: '📚', id: 'archive' },
      { href: 'memorials.html', label: 'Memorials & Heritage', icon: '🏛️', id: 'memorials' },
      { href: 'debates.html', label: 'Historical Debates', icon: '⚖️', id: 'debates' },
      { href: 'letters.html', label: 'Letters & Correspondence (361)', icon: '📜', id: 'letters' },
      { href: 'vows.html', label: 'The 22 Vows (२२ प्रतिज्ञा)', icon: '☸️', id: 'vows' },
      { href: 'constitution.html', label: 'Constitution', icon: '📜', id: 'constitution' },
      { href: 'ideas.html', label: 'Thematic Ideas', icon: '💡', id: 'ideas' },
      { href: 'learning.html', label: 'Learning Center', icon: '🎓', id: 'learning' },
      { href: 'quotes.html', label: 'Verified Quotes', icon: '💬', id: 'quotes' },
      { href: 'media.html', label: 'Speeches & Audio-Visual', icon: '🎬', id: 'media' },
      { href: 'timeline.html', label: 'Chronological Timeline', icon: '📅', id: 'timeline' },
      { href: 'kiosk.html', label: 'Kiosk Mode', icon: '🖥️', id: 'kiosk' },
      { href: 'exhibition.html', label: 'Smart Display', icon: '📺', id: 'exhibition' },
      { href: 'slides.html', label: 'Visual Exhibition Deck', icon: '📽️', id: 'slides', badge: '16:9' },
      { href: 'assistant.html', label: 'AI Research Assistant', icon: '🤖', id: 'assistant' },
      { href: 'ocr.html', label: 'Manuscript OCR', icon: '📜', id: 'ocr' },
      { href: 'dashboard.html', label: 'My Research Dashboard', icon: '👤', id: 'dashboard' },
      { href: 'compare.html', label: 'Comparative Reader', icon: '⚖️', id: 'compare' },
      { href: 'transparency.html', label: 'Archive Transparency', icon: '🛡️', id: 'transparency' },
      { href: 'about.html', label: 'About the Creator', icon: '✨', id: 'about' }
    ]
  };

  const SNAP_CLASSES = [
    'snap-bottom-center',
    'snap-bottom-left',
    'snap-bottom-right',
    'snap-middle-left',
    'snap-middle-right'
  ];

  function getCurrentPath() {
    let p = window.location.pathname.toLowerCase().split('/').pop() || 'index.html';
    if (!p || p === '') p = 'index.html';
    return p;
  }

  // ── 2. Master Navbar Component ──────────────────────────
  function renderOrSyncNavbar() {
    const currentPath = getCurrentPath();
    let nav = document.querySelector('.nav');

    const navHtml = `
      <div class="nav-inner">
        <a href="${NAV_CONFIG.brand.href}" class="nav-logo" aria-label="Ambedkar Archive Home">
          <div class="nav-logo-icon" aria-hidden="true">${NAV_CONFIG.brand.icon}</div>
          <div class="nav-logo-text">
            <span>${NAV_CONFIG.brand.title}</span>
            <span class="nav-logo-sub">${NAV_CONFIG.brand.sub}</span>
          </div>
        </a>

        <div class="nav-links" role="list">
          ${NAV_CONFIG.topLinks.map(link => {
            const isAct = currentPath === link.href ||
              (link.id === 'archive' && ['archive.html', 'reader.html', 'learning.html', 'quotes.html'].includes(currentPath)) ||
              (link.id === 'assistant' && currentPath === 'assistant.html');
            return `<a href="${link.href}" class="nav-link ${isAct ? 'active' : ''}" role="listitem">${link.label}</a>`;
          }).join('')}
        </div>

        <div class="nav-actions">
          <!-- Reading Atmosphere Switcher -->
          <div class="nav-theme" role="group" aria-label="Atmosphere selection">
            <button class="theme-toggle-btn active" data-theme="dark" title="Dark Slate Atmosphere" aria-label="Dark Slate Atmosphere">🌙</button>
            <button class="theme-toggle-btn" data-theme="paper" title="Ivory Paper Sanctuary" aria-label="Ivory Paper Sanctuary">📜</button>
            <button class="theme-toggle-btn" data-theme="sepia" title="Historical Sepia Sanctuary" aria-label="Historical Sepia Sanctuary">🏺</button>
          </div>

          <!-- Language Selection -->
          <div class="nav-lang" role="group" aria-label="Language selection">
            <button class="lang-btn active" data-lang="en" aria-pressed="true">EN</button>
            <button class="lang-btn" data-lang="hi" aria-pressed="false">हिन्दी</button>
            <button class="lang-btn" data-lang="mr" aria-pressed="false">मराठी</button>
          </div>

          <!-- Quick Search & Command Palette Trigger -->
          <button type="button" class="btn btn-outline btn-sm nav-cmd-search" title="Open Command Palette (Ctrl+K or ⌘K)" aria-label="Open Command Palette (Press Ctrl+K)">
            <span>🔍 Search</span>
            <kbd class="kbd-badge" style="font-size:0.65rem;padding:2px 5px;border-radius:4px;background:var(--surface-2);border:1px solid var(--border);color:var(--text-muted);font-family:var(--font-mono);font-weight:600;margin-left:2px;">⌘K</kbd>
          </button>

          <!-- Auth State Actions -->
          <a id="nav-login-btn" href="login.html" class="btn btn-primary btn-sm">Sign In</a>

          <div id="nav-user-menu" style="display:none;" class="flex gap-2 items-center">
            <a href="dashboard.html" class="btn btn-secondary btn-sm">
              <span>👤</span> <span id="nav-user-name">User</span>
            </a>
            <button data-action="logout" class="btn btn-ghost btn-sm">Logout</button>
          </div>

          <!-- Mobile Hamburger Toggle -->
          <button id="hamburger" class="hamburger" aria-label="Open menu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    `;

    // Remove obsolete custom site-header if present
    const legacyHeader = document.querySelector('header.site-header');
    if (legacyHeader) legacyHeader.remove();

    if (!nav) {
      nav = document.createElement('nav');
      nav.className = 'nav';
      nav.setAttribute('role', 'navigation');
      nav.setAttribute('aria-label', 'Main navigation');
      nav.innerHTML = navHtml;
      document.body.insertBefore(nav, document.body.firstChild);
    } else {
      nav.innerHTML = navHtml;
    }
  }

  // ── 3. Master Mobile Menu Component ─────────────────────
  function renderOrSyncMobileMenu() {
    const currentPath = getCurrentPath();
    let menu = document.getElementById('mobile-menu');

    // Detect user auth state
    const isLoggedIn = (window.AppState && AppState.isLoggedIn && AppState.isLoggedIn()) || !!localStorage.getItem('auth_token');
    let userName = 'Researcher';
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && u.name) userName = u.name.split(' ')[0];
      }
    } catch (_) {}

    const menuHtml = `
      <div class="mobile-drawer-header flex-between items-center">
        <span class="mobile-drawer-title">
          <span>🏛️</span> <span>Menu Navigation</span>
        </span>
        <button id="mobile-menu-close-btn" class="btn btn-ghost btn-sm" type="button" aria-label="Close menu" style="padding:4px 8px;font-size:1.1rem;cursor:pointer;color:var(--text-muted);line-height:1;">✕</button>
      </div>

      <!-- Atmosphere Selection -->
      <div class="mobile-drawer-section">
        <span class="mobile-drawer-label">Atmosphere</span>
        <div class="nav-theme" role="group" aria-label="Atmosphere selection">
          <button class="theme-toggle-btn active" data-theme="dark" title="Dark Slate">🌙</button>
          <button class="theme-toggle-btn" data-theme="paper" title="Ivory Paper">📜</button>
          <button class="theme-toggle-btn" data-theme="sepia" title="Historical Sepia">🏺</button>
        </div>
      </div>

      <!-- Language Selection -->
      <div class="mobile-drawer-section">
        <span class="mobile-drawer-label">Language</span>
        <div class="nav-lang" role="group" aria-label="Language selection">
          <button class="lang-btn active" data-lang="en">EN</button>
          <button class="lang-btn" data-lang="hi">हिन्दी</button>
          <button class="lang-btn" data-lang="mr">मराठी</button>
        </div>
      </div>

      <!-- Quick Spotlight Search -->
      <div style="margin-bottom:var(--space-3);margin-top:2px;">
        <button type="button" class="btn btn-secondary btn-full nav-cmd-search flex-between items-center" style="font-size:0.88rem;padding:10px 14px;border-radius:var(--radius-lg);width:100%;">
          <span style="display:flex;align-items:center;gap:8px;"><span>🔍</span> <span>Quick Spotlight Search</span></span>
          <kbd class="kbd-badge" style="font-size:0.65rem;padding:2px 6px;border-radius:4px;background:var(--surface-3);border:1px solid var(--border);color:var(--text-muted);font-family:var(--font-mono);font-weight:600;">⌘K</kbd>
        </button>
      </div>

      <!-- Scrollable Navigation Links -->
      <div class="mobile-drawer-links">
        ${NAV_CONFIG.drawerLinks.map(link => {
          const isAct = currentPath === link.href ||
            (link.id === 'archive' && ['archive.html', 'reader.html', 'learning.html', 'quotes.html'].includes(currentPath)) ||
            (link.id === 'assistant' && currentPath === 'assistant.html');
          return `<a href="${link.href}" class="mobile-drawer-link ${isAct ? 'active' : ''}">
            <span class="drawer-link-icon">${link.icon}</span>
            <span class="drawer-link-label">${link.label}</span>
            ${link.badge ? `<span class="badge-16-9" style="margin-left:6px;">${link.badge}</span>` : ''}
            <span class="drawer-link-arrow">→</span>
          </a>`;
        }).join('')}
      </div>

      <div style="height:1px;background:var(--border);margin:var(--space-4) 0 var(--space-3);"></div>

      <button id="drawer-reset-dock-btn" class="btn btn-secondary btn-full btn-sm" style="margin-bottom:var(--space-3);display:flex;align-items:center;justify-content:center;gap:6px;width:100%;">
        <span>↺</span> <span>Reset Dock Position</span>
      </button>

      ${isLoggedIn ? `
        <div style="display:flex;gap:8px;align-items:center;">
          <a href="dashboard.html" class="btn btn-primary btn-sm" style="flex:1;border-radius:var(--radius-full);justify-content:center;">
            <span>👤</span> <span>Dashboard (${userName})</span>
          </a>
          <button data-action="logout" class="btn btn-secondary btn-sm" style="white-space:nowrap;border-radius:var(--radius-full);">Logout</button>
        </div>
      ` : `
        <a href="login.html" class="btn btn-primary btn-full" style="border-radius:var(--radius-full);justify-content:center;">Sign In to Archive →</a>
      `}
    `;

    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'mobile-menu';
      menu.className = 'mobile-menu';
      menu.setAttribute('role', 'dialog');
      menu.setAttribute('aria-label', 'Mobile navigation');
      menu.innerHTML = menuHtml;
      document.body.appendChild(menu);
    } else {
      menu.innerHTML = menuHtml;
    }

    const drawerResetBtn = menu.querySelector('#drawer-reset-dock-btn');
    if (drawerResetBtn) {
      drawerResetBtn.addEventListener('click', () => {
        NavigationSystem.resetDockPosition();
        if (window.showToast) window.showToast('Dockbar repositioned to default Bottom-Center');
      });
    }
  }

  // ── 4. Master Mobile Bottom Bar Component ────────────────
  function renderOrSyncBottomBar() {
    const currentPath = getCurrentPath();
    let bar = document.querySelector('.bottom-bar');

    const barHtml = NAV_CONFIG.bottomTabs.map(tab => {
      const isAct = currentPath === tab.href ||
        (tab.id === 'archive' && ['archive.html', 'reader.html', 'learning.html', 'quotes.html'].includes(currentPath)) ||
        (tab.id === 'assistant' && currentPath === 'assistant.html');
      return `
        <a href="${tab.href}" class="tab-item ${isAct ? 'active' : ''}" aria-label="${tab.label}">
          <span class="tab-icon" aria-hidden="true">${tab.icon}</span>
          <span>${tab.label}</span>
        </a>
      `;
    }).join('');

    if (!bar) {
      bar = document.createElement('nav');
      bar.className = 'bottom-bar';
      bar.setAttribute('role', 'navigation');
      bar.setAttribute('aria-label', 'Mobile navigation');
      bar.innerHTML = barHtml;
      document.body.appendChild(bar);
    } else {
      bar.innerHTML = barHtml;
    }
  }

  const POS_STORAGE_KEY = 'ambedkar_dock_float_pos';
  const LEGACY_STORAGE_KEY = 'ambedkar_dock_snap';
  const DEFAULT_POS = { left: 20, top: 160, mode: 'vertical' };

  function snapToCoords(snapClass) {
    const viewW = (typeof window !== 'undefined' && window.innerWidth) || 1200;
    const viewH = (typeof window !== 'undefined' && window.innerHeight) || 800;
    switch (snapClass) {
      case 'snap-bottom-left':
        return { left: 24, top: Math.max(10, viewH - 90), mode: 'horizontal', snap: 'snap-bottom-left' };
      case 'snap-bottom-right':
        return { left: Math.max(10, viewW - 650), top: Math.max(10, viewH - 90), mode: 'horizontal', snap: 'snap-bottom-right' };
      case 'snap-middle-left':
        return { left: 20, top: Math.max(10, Math.round((viewH - 450) / 2)), mode: 'vertical', snap: 'snap-middle-left' };
      case 'snap-middle-right':
        return { left: Math.max(10, viewW - 192), top: Math.max(10, Math.round((viewH - 450) / 2)), mode: 'vertical', snap: 'snap-middle-right' };
      case 'snap-bottom-center':
      default:
        return { left: Math.max(10, Math.round((viewW - 650) / 2)), top: Math.max(10, viewH - 90), mode: 'horizontal', snap: 'snap-bottom-center' };
    }
  }

  function getStoredPosition() {
    try {
      const rawFloat = localStorage.getItem(POS_STORAGE_KEY);
      if (rawFloat) {
        return JSON.parse(rawFloat);
      }
      const legacySnap = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacySnap) {
        return snapToCoords(legacySnap);
      }
    } catch (e) {}
    return null;
  }

  // ── 5. Master Movable / Floating Dockbar System ──────────
  function renderOrSyncFloatingDock() {
    const currentPath = getCurrentPath();
    let dock = document.getElementById('global-floating-dock');

    // Remove obsolete legacy static side-docks if present
    document.querySelectorAll('.side-dock, #side-dock, #deckSideDock').forEach(el => el.remove());

    const saved = getStoredPosition();
    const initialMode = (saved && saved.mode) ? saved.mode : DEFAULT_POS.mode;

    const dockHtml = `
      <div class="dock-shell" id="dock-shell">
        <div class="dock-header" id="dock-header">
          <div class="dock-handle-bar" id="dock-drag-handle" role="button" aria-grabbed="false" tabindex="0" title="Drag to float dock anywhere on screen (Press Arrow keys to move, 'T' to toggle layout, 'R' to reset)">
            <span class="dock-handle-grip" aria-hidden="true">⠿</span>
            <span class="dock-badge">Curated Hubs</span>
          </div>
          <div class="dock-header-actions">
            <button class="dock-action-btn" id="dock-orient-btn" title="Toggle Layout (Vertical / Horizontal)" aria-label="Toggle layout">⇄</button>
            <button class="dock-action-btn" id="dock-reset-btn" title="Reset dock to default position" aria-label="Reset dock position">↺</button>
            <button class="dock-action-btn dock-close-btn" id="dock-collapse-btn" title="Collapse Hubs" aria-label="Collapse hubs">✕</button>
          </div>
        </div>

        <div class="dock-items" role="list">
          ${NAV_CONFIG.dockItems.map(item => {
            const isAct = currentPath === item.href;
            return `
              <a href="${item.href}" class="dock-item ${isAct ? 'active' : ''}" data-page="${item.page}" title="${item.title}" role="listitem">
                <span class="dock-icon">${item.icon}</span>
                <span class="dock-label">
                  ${item.label}
                  ${item.badge ? `<span class="badge-16-9">${item.badge}</span>` : ''}
                </span>
              </a>
            `;
          }).join('')}
        </div>
      </div>
    `;

    if (!dock) {
      dock = document.createElement('aside');
      dock.id = 'global-floating-dock';
      dock.className = `floating-dock dock-${initialMode}`;
      dock.setAttribute('role', 'navigation');
      dock.setAttribute('aria-label', 'Curated exploration hubs');
      dock.innerHTML = dockHtml;
      document.body.appendChild(dock);
    } else {
      dock.className = `floating-dock dock-${initialMode}`;
      dock.innerHTML = dockHtml;
    }

    // Apply saved coordinates or default position
    applyInitialPosition(dock, saved);

    initDockFloatingAndDrag(dock);
  }

  function applyInitialPosition(dock, saved) {
    const margin = 8;
    const viewW = (typeof window !== 'undefined' && window.innerWidth) || 1200;
    const viewH = (typeof window !== 'undefined' && window.innerHeight) || 800;

    let left = DEFAULT_POS.left;
    let top = DEFAULT_POS.top;
    let mode = DEFAULT_POS.mode;
    let snap = null;

    if (saved) {
      if (typeof saved.left === 'number') left = saved.left;
      if (typeof saved.top === 'number') top = saved.top;
      if (saved.mode) mode = saved.mode;
      if (saved.snap) snap = saved.snap;
    }

    dock.classList.toggle('dock-horizontal', mode === 'horizontal');
    dock.classList.toggle('dock-vertical', mode === 'vertical');

    SNAP_CLASSES.forEach(c => dock.classList.remove(c));
    if (snap) {
      dock.classList.add(snap);
    }

    const dockW = dock.offsetWidth || (mode === 'horizontal' ? 620 : 172);
    const dockH = dock.offsetHeight || (mode === 'horizontal' ? 60 : 450);

    left = Math.max(margin, Math.min(left, viewW - dockW - margin));
    top = Math.max(margin, Math.min(top, viewH - dockH - margin));

    if (viewW <= 768) {
      dock.classList.add('mobile-collapsed');
      dock.style.left = '';
      dock.style.top = '';
      dock.style.right = '';
      dock.style.bottom = '';
      dock.style.transform = '';
    } else {
      dock.style.left = `${left}px`;
      dock.style.top = `${top}px`;
      dock.style.right = 'auto';
      dock.style.bottom = 'auto';
      dock.style.transform = 'none';
    }
  }

  // ── 6. Free-Floating Drag & Placement Engine ─────────────
  function initDockFloatingAndDrag(dock) {
    const handle = dock.querySelector('#dock-drag-handle');
    const resetBtn = dock.querySelector('#dock-reset-btn');
    const orientBtn = dock.querySelector('#dock-orient-btn');
    const collapseBtn = dock.querySelector('#dock-collapse-btn');
    if (!handle) return;

    // Mobile Tap-to-Expand / Collapse Handlers
    dock.addEventListener('click', (e) => {
      if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        if (dock.classList.contains('mobile-collapsed')) {
          dock.classList.remove('mobile-collapsed');
          dock.classList.add('mobile-expanded');
          e.stopPropagation();
        }
      }
    });

    if (collapseBtn) {
      collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dock.classList.remove('mobile-expanded');
        dock.classList.add('mobile-collapsed');
      });
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('click', (e) => {
        if (typeof window !== 'undefined' && window.innerWidth <= 768) {
          if (dock.classList.contains('mobile-expanded') && !dock.contains(e.target)) {
            dock.classList.remove('mobile-expanded');
            dock.classList.add('mobile-collapsed');
          }
        }
      });
    }

    dock.querySelectorAll('.dock-item').forEach(item => {
      item.addEventListener('click', () => {
        if (typeof window !== 'undefined' && window.innerWidth <= 768) {
          dock.classList.remove('mobile-expanded');
          dock.classList.add('mobile-collapsed');
        }
      });
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
          if (!dock.classList.contains('mobile-expanded')) {
            dock.classList.add('mobile-collapsed');
          }
        } else {
          dock.classList.remove('mobile-collapsed', 'mobile-expanded');
        }
      });
    }

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;
    let dragThresholdPassed = false;

    // Reset button logic
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        NavigationSystem.resetDockPosition();
      });
    }

    // Orientation toggle logic (Vertical Rail vs Horizontal Pill)
    if (orientBtn) {
      orientBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleOrientation();
      });
    }

    function toggleOrientation() {
      const isHoriz = dock.classList.contains('dock-horizontal');
      const newMode = isHoriz ? 'vertical' : 'horizontal';
      dock.classList.toggle('dock-horizontal', newMode === 'horizontal');
      dock.classList.toggle('dock-vertical', newMode === 'vertical');

      clampInsideViewport();

      const rect = dock.getBoundingClientRect();
      savePosition(rect.left, rect.top, newMode);
    }

    function clampInsideViewport() {
      const margin = 8;
      const dockW = dock.offsetWidth || 172;
      const dockH = dock.offsetHeight || 300;
      const viewW = window.innerWidth;
      const viewH = window.innerHeight;

      const rect = dock.getBoundingClientRect();
      let left = Math.max(margin, Math.min(rect.left, viewW - dockW - margin));
      let top = Math.max(margin, Math.min(rect.top, viewH - dockH - margin));

      dock.style.left = `${left}px`;
      dock.style.top = `${top}px`;
    }

    function savePosition(left, top, mode) {
      const currentMode = mode || (dock.classList.contains('dock-horizontal') ? 'horizontal' : 'vertical');
      const data = {
        left: Math.round(left),
        top: Math.round(top),
        mode: currentMode
      };
      localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(data));
    }

    // Keyboard accessibility support on handle
    handle.addEventListener('keydown', (e) => {
      const step = 24;
      const rect = dock.getBoundingClientRect();

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        NavigationSystem.resetDockPosition();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        toggleOrientation();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        dock.style.left = `${Math.min(window.innerWidth - dock.offsetWidth - 8, rect.left + step)}px`;
        savePosition(dock.getBoundingClientRect().left, rect.top);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        dock.style.left = `${Math.max(8, rect.left - step)}px`;
        savePosition(dock.getBoundingClientRect().left, rect.top);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        dock.style.top = `${Math.min(window.innerHeight - dock.offsetHeight - 8, rect.top + step)}px`;
        savePosition(rect.left, dock.getBoundingClientRect().top);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        dock.style.top = `${Math.max(8, rect.top - step)}px`;
        savePosition(rect.left, dock.getBoundingClientRect().top);
      }
    });

    // Pointer events (Desktop mouse & Touch screens)
    function onPointerDown(e) {
      // Don't drag if clicking buttons inside header actions
      if (e.target.closest('#dock-reset-btn') || e.target.closest('#dock-orient-btn')) return;

      isDragging = true;
      dragThresholdPassed = false;
      startX = e.clientX;
      startY = e.clientY;

      const rect = dock.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      handle.setAttribute('aria-grabbed', 'true');

      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    }

    function onPointerMove(e) {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      if (!dragThresholdPassed && Math.hypot(deltaX, deltaY) > 4) {
        dragThresholdPassed = true;
        dock.classList.add('is-dragging');
        dock.style.transform = 'none';
        dock.style.transition = 'none';
      }

      if (dragThresholdPassed) {
        e.preventDefault();

        const dockWidth = dock.offsetWidth;
        const dockHeight = dock.offsetHeight;
        const viewW = window.innerWidth;
        const viewH = window.innerHeight;

        let newLeft = initialLeft + deltaX;
        let newTop = initialTop + deltaY;

        // Viewport boundaries containment (keep safely on screen)
        const margin = 8;
        newLeft = Math.max(margin, Math.min(newLeft, viewW - dockWidth - margin));
        newTop = Math.max(margin, Math.min(newTop, viewH - dockHeight - margin));

        dock.style.left = `${newLeft}px`;
        dock.style.top = `${newTop}px`;
        dock.style.right = 'auto';
        dock.style.bottom = 'auto';
      }
    }

    function onPointerUp(e) {
      if (!isDragging) return;
      isDragging = false;
      handle.setAttribute('aria-grabbed', 'false');
      dock.classList.remove('is-dragging');

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      if (!dragThresholdPassed) {
        return;
      }

      const rect = dock.getBoundingClientRect();
      savePosition(rect.left, rect.top);
    }

    handle.addEventListener('pointerdown', onPointerDown);

    // Window resize safeguard
    window.addEventListener('resize', () => {
      clampInsideViewport();
    }, { passive: true });

    // Reading Mode Priority: Subtle compacting during rapid downward scroll
    let lastScrollY = window.scrollY;
    let scrollTimeout = null;

    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 150 && currentScrollY > lastScrollY) {
        dock.classList.add('dock-compact');
      } else {
        dock.classList.remove('dock-compact');
      }
      lastScrollY = currentScrollY;

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        dock.classList.remove('dock-compact');
      }, 900);
    }, { passive: true });
  }

  // ── 7. Core Interactivity Wiring (Self-contained) ────────
  function wireCoreNavActions() {
    // 1. Mobile Hamburger Toggle with Backdrop
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    let backdrop = document.getElementById('mobile-menu-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'mobile-menu-backdrop';
      backdrop.className = 'mobile-menu-backdrop';
      document.body.appendChild(backdrop);
    }

    const setMenuOpen = (open) => {
      if (!mobileMenu) return;
      mobileMenu.classList.toggle('open', open);
      if (backdrop) backdrop.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      if (hamburger) hamburger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    };

    if (hamburger && mobileMenu && !hamburger.__navWired) {
      hamburger.__navWired = true;
      hamburger.addEventListener('click', (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const isOpen = mobileMenu.classList.contains('open');
        setMenuOpen(!isOpen);
      });

      // Close on backdrop click
      backdrop.addEventListener('click', () => setMenuOpen(false));

      // Close on navigation link click
      mobileMenu.querySelectorAll('a').forEach((el) => {
        el.addEventListener('click', () => setMenuOpen(false));
      });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
          setMenuOpen(false);
        }
      });

      // Close on dedicated close button click
      const menuCloseBtn = mobileMenu.querySelector('#mobile-menu-close-btn');
      if (menuCloseBtn) {
        menuCloseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          setMenuOpen(false);
        });
      }

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (mobileMenu.classList.contains('open') && !mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
          setMenuOpen(false);
        }
      });
    }

    // 1.5 Quick Search Command Palette Trigger
    document.querySelectorAll('.nav-cmd-search').forEach((btn) => {
      if (!btn.__navCmdWired) {
        btn.__navCmdWired = true;
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const drawer = document.getElementById('mobile-menu');
          if (drawer && drawer.classList.contains('open')) {
            drawer.classList.remove('open');
            document.body.style.overflow = '';
          }
          if (window.CommandPalette && typeof window.CommandPalette.open === 'function') {
            window.CommandPalette.open();
          } else {
            window.location.href = 'archive.html#search';
          }
        });
      }
    });

    // 2. Reading Atmosphere Buttons
    document.querySelectorAll('.theme-toggle-btn').forEach((btn) => {
      if (!btn.__navWired) {
        btn.__navWired = true;
        btn.addEventListener('click', () => {
          const theme = btn.dataset.theme;
          if (window.AppState && typeof window.AppState.setSiteTheme === 'function') {
            window.AppState.setSiteTheme(theme, true);
          } else {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('site_theme', theme);
            document.querySelectorAll('.theme-toggle-btn').forEach(b => {
              b.classList.toggle('active', b.dataset.theme === theme);
            });
          }
        });
      }
    });

    // 3. Multilingual Archival Dictionary & Synchronization
    const I18N_NAV = {
      en: {
        home: 'Home',
        archive: 'Complete Works (60 Vol)',
        letters: 'Letters (361)',
        vows: '22 Vows',
        timeline: 'Timeline',
        assistant: 'AI Assistant',
        memorials: 'Memorials',
        debates: 'Debates',
        kiosk: 'Kiosk',
        exhibition: 'Display',
        slides: 'Deck 16:9',
        constitution: 'Constitution',
        ideas: 'Ideas',
        media: 'Speeches',
        ocr: 'OCR',
        about: 'About',
        curatedHubs: 'Curated Hubs'
      },
      hi: {
        home: 'मुखपृष्ठ',
        archive: 'समग्र साहित्य (६० खंड)',
        letters: 'पत्र (३६१)',
        vows: '२२ प्रतिज्ञा',
        timeline: 'कालक्रम',
        assistant: 'एआई सहायक',
        memorials: 'स्मारक',
        debates: 'संविधान वाद-विवाद',
        kiosk: 'कियोस्क',
        exhibition: 'डिस्प्ले',
        slides: 'प्रदर्शनी डेक',
        constitution: 'संविधान',
        ideas: 'विचार',
        media: 'भाषण',
        ocr: 'ओसीआर',
        about: 'परिचय',
        curatedHubs: 'विशेष संग्रह'
      },
      mr: {
        home: 'मुख्यपृष्ठ',
        archive: 'संपूर्ण साहित्य (६० खंड)',
        letters: 'पत्रे (३६१)',
        vows: '२२ प्रतिज्ञा',
        timeline: 'घटनाक्रम',
        assistant: 'एआय सहाय्यक',
        memorials: 'स्मारके',
        debates: 'घटनात्मक वाद-संवाद',
        kiosk: 'किऑस्क',
        exhibition: 'डिस्प्ले',
        slides: 'प्रदर्शन डेक',
        constitution: 'संविधान',
        ideas: 'विचारधारा',
        media: 'भाषणे',
        ocr: 'ओसीआर',
        about: 'परिचय',
        curatedHubs: 'विशेष दालने'
      }
    };

    function syncNavigationLanguage(lang) {
      if (!I18N_NAV[lang]) lang = 'en';
      const dict = I18N_NAV[lang];

      // Sync button active states
      document.querySelectorAll('.lang-btn').forEach(b => {
        const match = b.dataset.lang === lang;
        b.classList.toggle('active', match);
        b.setAttribute('aria-pressed', String(match));
      });

      // Top navigation links
      document.querySelectorAll('.nav-links .nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === 'index.html' && dict.home) link.textContent = dict.home;
        else if (href === 'archive.html' && dict.archive) link.textContent = dict.archive;
        else if (href === 'letters.html' && dict.letters) link.textContent = dict.letters;
        else if (href === 'vows.html' && dict.vows) link.textContent = dict.vows;
        else if (href === 'timeline.html' && dict.timeline) link.textContent = dict.timeline;
        else if (href === 'assistant.html' && dict.assistant) link.textContent = dict.assistant;
      });

      // Curated Hubs Dock Items
      document.querySelectorAll('.dock-item').forEach(item => {
        const page = item.getAttribute('data-page');
        const labelEl = item.querySelector('.dock-label');
        if (page && dict[page] && labelEl) {
          const badge = item.querySelector('.badge-16-9');
          labelEl.textContent = dict[page];
          if (badge) labelEl.appendChild(badge);
        }
      });

      const dockBadge = document.querySelector('.dock-badge');
      if (dockBadge && dict.curatedHubs) {
        dockBadge.textContent = dict.curatedHubs;
      }

      document.documentElement.setAttribute('lang', lang);
      localStorage.setItem('lang', lang);
    }

    // Language Selector Buttons
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      if (!btn.__navWired) {
        btn.__navWired = true;
        btn.addEventListener('click', () => {
          const lang = btn.dataset.lang;
          syncNavigationLanguage(lang);
          if (window.AppState && typeof window.AppState.setLanguage === 'function') {
            window.AppState.setLanguage(lang);
          } else {
            document.dispatchEvent(new CustomEvent('languageChange', { detail: { lang } }));
          }
        });
      }
    });

    // Listen for languageChange from Command Palette or other modules
    if (!document.__navLangListening) {
      document.__navLangListening = true;
      document.addEventListener('languageChange', (e) => {
        if (e && e.detail && e.detail.lang) {
          syncNavigationLanguage(e.detail.lang);
        }
      });
    }

    // Apply saved language on startup
    const savedLang = localStorage.getItem('lang') || 'en';
    if (savedLang && savedLang !== 'en') {
      syncNavigationLanguage(savedLang);
    }
  }

  // ── 7B. Lenis Inertial Smooth Scrolling & GSAP Scrollytelling ─
  function initSmoothMotion() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (!document.head || typeof document.head.appendChild !== 'function') return;

    const path = getCurrentPath();
    // Exclude specialized kiosk / ambient fullscreen exhibition modes
    if (path === 'kiosk.html' || path === 'exhibition.html' || path === 'slides.html') {
      return;
    }

    // Respect reduced motion preference for accessibility
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    function loadScript(src, cb) {
      if (document.querySelector(`script[src="${src}"]`)) {
        if (cb) cb();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = cb;
      s.onerror = () => { /* graceful degradation */ };
      document.head.appendChild(s);
    }

    function setupSmoothEngine() {
      if (typeof window.Lenis === 'undefined') return;

      const lenis = new window.Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        smoothTouch: false, // Keep native 120Hz ProMotion on mobile touch screens
        touchMultiplier: 1.5,
        prevent: (node) => {
          if (!node) return false;
          return !!(node.closest && node.closest('.floating-dock, .modal, .chat-messages, .reader-panel, #mobile-menu, [data-lenis-prevent], .cmd-backdrop, .cmd-palette-backdrop, .cmd-dialog, .cmd-palette-modal, .dialog, .drawer, #reader-content, pre, code, .overflow-y-auto, .terminal-body'));
        }
      });

      window.lenis = lenis;

      // Keep Lenis scroll dimensions synced whenever dynamic content loads via API/DOM
      if (typeof window.ResizeObserver !== 'undefined' && document.body) {
        const ro = new ResizeObserver(() => {
          lenis.resize();
          if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === 'function') {
            window.ScrollTrigger.refresh();
          }
        });
        ro.observe(document.body);
      }

      window.refreshLenis = () => {
        if (lenis && typeof lenis.resize === 'function') {
          lenis.resize();
        }
        if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === 'function') {
          window.ScrollTrigger.refresh();
        }
      };

      // Handle anchor hash smooth jumps
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          const targetId = anchor.getAttribute('href');
          if (targetId && targetId !== '#' && targetId.length > 1) {
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
              e.preventDefault();
              lenis.scrollTo(targetEl, { offset: -80 });
            }
          }
        });
      });

      if (window.gsap && window.ScrollTrigger) {
        window.gsap.registerPlugin(window.ScrollTrigger);

        lenis.on('scroll', window.ScrollTrigger.update);

        window.gsap.ticker.add((time) => {
          lenis.raf(time * 1000);
        });
        window.gsap.ticker.lagSmoothing(0);

        setupChoreography();
      } else {
        function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
      }

      initReadingProgressBar(lenis);
    }

    function setupChoreography() {
      if (!window.gsap || !window.ScrollTrigger) return;
      const gsap = window.gsap;

      // Subtle staggered entrance for stats bar
      const statItems = document.querySelectorAll('.stat-item');
      if (statItems.length > 0) {
        gsap.from(statItems, {
          y: 20,
          opacity: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.stats-bar',
            start: 'top 90%',
            toggleActions: 'play none none none'
          }
        });
      }

      // Foundational Treatises bento cards
      const bentoCards = document.querySelectorAll('.bento-grid .card');
      if (bentoCards.length > 0) {
        gsap.from(bentoCards, {
          y: 28,
          opacity: 0,
          duration: 0.75,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.bento-grid',
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        });
      }

      // Feature cards / generic cards across archive
      const featureCards = document.querySelectorAll('.feature-card, .collection-card');
      if (featureCards.length > 0) {
        gsap.from(featureCards, {
          y: 20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: featureCards[0].parentElement || featureCards[0],
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        });
      }
    }

    // Attach fallback progress bar immediately
    initReadingProgressBar(null);

    // Load vendor libraries sequentially
    loadScript('js/vendor/lenis.min.js', () => {
      loadScript('js/vendor/gsap.min.js', () => {
        loadScript('js/vendor/ScrollTrigger.min.js', () => {
          setupSmoothEngine();
        });
      });
    });
  }

  // ── 7C. Luxury Reading Progress Bar ───────────────────────
  function initReadingProgressBar(lenis) {
    let bar = document.getElementById('reading-progress-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'reading-progress-bar';
      bar.setAttribute('aria-hidden', 'true');
      document.body.appendChild(bar);
    }
    const updateProgress = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docH > 0 ? (window.scrollY / docH) * 100 : 0;
      bar.style.width = Math.min(100, Math.max(0, progress)) + '%';
    };
    if (lenis && typeof lenis.on === 'function') {
      lenis.on('scroll', (e) => {
        const p = (e.progress !== undefined ? e.progress * 100 : (e.scroll / Math.max(1, e.limit)) * 100);
        bar.style.width = Math.min(100, Math.max(0, p)) + '%';
      });
    } else {
      window.addEventListener('scroll', updateProgress, { passive: true });
    }
    updateProgress();
  }

  // ── 7D. Apple Glass Command Palette (Cmd+K Trigger) ───────
  function initCommandPalette() {
    // If the dedicated Spotlight Command Palette (command-palette.js) is active, defer to it
    if (window.CommandPalette || document.getElementById('cmd-palette-backdrop')) return;
    if (document.getElementById('command-palette-backdrop')) return;

    const COMMAND_ITEMS = [
      { id: 'search', title: 'Search Archive (Press /)', badge: 'Catalog', icon: '🔍', action: () => window.location.href = 'archive.html#search' },
      { id: 'volumes', title: 'Complete Works (60 Volumes)', badge: 'Archive', icon: '📚', action: () => window.location.href = 'archive.html' },
      { id: 'assistant', title: 'Ask AI Research Assistant', badge: 'Intelligence', icon: '🤖', action: () => window.location.href = 'assistant.html' },
      { id: 'debates', title: 'Constituent Assembly Debates', badge: 'History', icon: '⚖️', action: () => window.location.href = 'debates.html' },
      { id: 'letters', title: 'Letters & Correspondence (361)', badge: 'Writings', icon: '📜', action: () => window.location.href = 'letters.html' },
      { id: 'vows', title: 'The 22 Vows (२२ प्रतिज्ञा)', badge: 'Philosophy', icon: '☸️', action: () => window.location.href = 'vows.html' },
      { id: 'timeline', title: 'Historical Life Timeline', badge: 'Chronology', icon: '📅', action: () => window.location.href = 'timeline.html' },
      { id: 'memorials', title: 'National Memorials & Heritage', badge: 'Memorials', icon: '🏛️', action: () => window.location.href = 'memorials.html' },
      { id: 'constitution', title: 'Constitution of India', badge: 'Republic', icon: '📜', action: () => window.location.href = 'constitution.html' },
      { id: 'ideas', title: 'Thematic Ideas & Philosophical Core', badge: 'Ideas', icon: '💡', action: () => window.location.href = 'ideas.html' },
      { id: 'media', title: 'Historic Speeches & Audio-Visual Media', badge: 'Media', icon: '🎬', action: () => window.location.href = 'media.html' },
      { id: 'ocr', title: 'Manuscript OCR Visualizer', badge: 'Technology', icon: '📜', action: () => window.location.href = 'ocr.html' },
      { id: 'slides', title: 'Visual Exhibition Deck (16:9)', badge: 'Deck', icon: '📽️', action: () => window.location.href = 'slides.html' },
      { id: 'learning', title: 'Learning Center & Curricula', badge: 'Education', icon: '🎓', action: () => window.location.href = 'learning.html' },
      { id: 'theme-dark', title: 'Atmosphere: Switch to Dark Slate', badge: 'Theme', icon: '🌙', action: () => setSiteTheme('dark') },
      { id: 'theme-paper', title: 'Atmosphere: Switch to Ivory Paper', badge: 'Theme', icon: '📜', action: () => setSiteTheme('paper') },
      { id: 'theme-sepia', title: 'Atmosphere: Switch to Historical Sepia', badge: 'Theme', icon: '🏺', action: () => setSiteTheme('sepia') },
      { id: 'lang-en', title: 'Language: English (EN)', badge: 'Language', icon: '🌐', action: () => setSiteLanguage('en') },
      { id: 'lang-hi', title: 'Language: हिन्दी (Hindi)', badge: 'Language', icon: '🌐', action: () => setSiteLanguage('hi') },
      { id: 'lang-mr', title: 'Language: मराठी (Marathi)', badge: 'Language', icon: '🌐', action: () => setSiteLanguage('mr') }
    ];

    function setSiteTheme(theme) {
      if (window.AppState && typeof window.AppState.setSiteTheme === 'function') {
        window.AppState.setSiteTheme(theme, true);
      } else {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.className = 'mode-' + theme;
        localStorage.setItem('site_theme', theme);
        document.querySelectorAll('.theme-toggle-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.theme === theme);
        });
      }
    }

    function setSiteLanguage(lang) {
      if (window.AppState && typeof window.AppState.setLanguage === 'function') {
        window.AppState.setLanguage(lang);
      } else {
        localStorage.setItem('site_lang', lang);
        document.querySelectorAll('.lang-btn').forEach(b => {
          const match = b.dataset.lang === lang;
          b.classList.toggle('active', match);
          b.setAttribute('aria-pressed', String(match));
        });
      }
    }

    const backdrop = document.createElement('div');
    backdrop.id = 'command-palette-backdrop';
    backdrop.className = 'command-palette-backdrop';
    backdrop.innerHTML = `
      <div class="command-palette-modal" role="dialog" aria-modal="true" aria-label="Command Palette">
        <div class="command-palette-header">
          <span class="command-palette-icon">⌘</span>
          <input type="text" id="command-palette-input" class="command-palette-input" placeholder="Type a destination, volume, or atmosphere..." autocomplete="off" spellcheck="false" />
          <kbd class="command-palette-kbd">ESC</kbd>
          <button id="nav-cmd-close-btn" class="btn btn-ghost btn-sm" type="button" aria-label="Close command palette" style="padding:2px 8px;font-size:1.1rem;cursor:pointer;color:var(--text-muted);border-radius:var(--radius-sm);line-height:1;margin-left:4px;">✕</button>
        </div>
        <div id="command-palette-results" class="command-palette-results" role="listbox"></div>
        <div class="command-palette-footer">
          <span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>ESC</kbd> dismiss</span>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    const input = backdrop.querySelector('#command-palette-input');
    const results = backdrop.querySelector('#command-palette-results');
    let selectedIndex = 0;
    let currentMatches = [];

    function renderResults(filterText) {
      const q = (filterText || '').toLowerCase().trim();
      currentMatches = COMMAND_ITEMS.filter(item => {
        if (!q) return true;
        return item.title.toLowerCase().includes(q) || item.badge.toLowerCase().includes(q);
      });

      if (selectedIndex >= currentMatches.length) selectedIndex = 0;

      if (currentMatches.length === 0) {
        results.innerHTML = '<div style="padding:18px;text-align:center;color:var(--text-muted);font-size:0.88rem;">No matching commands found. Press ESC to dismiss.</div>';
        return;
      }

      results.innerHTML = currentMatches.map((item, idx) => `
        <div class="command-palette-item ${idx === selectedIndex ? 'active' : ''}" data-index="${idx}" role="option" aria-selected="${idx === selectedIndex}">
          <div class="command-palette-item-left">
            <span class="command-palette-item-icon">${item.icon}</span>
            <span class="command-palette-item-title">${item.title}</span>
          </div>
          <span class="command-palette-item-badge">${item.badge}</span>
        </div>
      `).join('');

      // Wire clicks
      results.querySelectorAll('.command-palette-item').forEach(el => {
        el.addEventListener('click', () => {
          const idx = parseInt(el.dataset.index, 10);
          if (currentMatches[idx]) {
            closePalette();
            currentMatches[idx].action();
          }
        });
      });
    }

    function openPalette() {
      backdrop.classList.add('open');
      input.value = '';
      selectedIndex = 0;
      renderResults('');
      setTimeout(() => input.focus(), 60);
    }

    function closePalette() {
      backdrop.classList.remove('open');
      input.blur();
    }

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closePalette();
    });

    const navCloseBtn = backdrop.querySelector('#nav-cmd-close-btn');
    if (navCloseBtn) {
      navCloseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closePalette();
      });
    }

    input.addEventListener('input', () => {
      selectedIndex = 0;
      renderResults(input.value);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentMatches.length > 0) {
          selectedIndex = (selectedIndex + 1) % currentMatches.length;
          renderResults(input.value);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentMatches.length > 0) {
          selectedIndex = (selectedIndex - 1 + currentMatches.length) % currentMatches.length;
          renderResults(input.value);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentMatches[selectedIndex]) {
          closePalette();
          currentMatches[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closePalette();
      }
    });

    // Global shortcut listener
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop.classList.contains('open')) {
        closePalette();
        return;
      }
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);

      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (backdrop.classList.contains('open')) closePalette();
        else openPalette();
      }
    });

    window.openCommandPalette = openPalette;
  }

  // ── 8. Public API & Auto-Initialization ───────────────────
  const NavigationSystem = {
    init: function() {
      // Don't render general navigation on specialized kiosk/ambient exhibition modes
      const path = getCurrentPath();
      if (path === 'kiosk.html' || path === 'exhibition.html') {
        return;
      }

      renderOrSyncNavbar();
      renderOrSyncMobileMenu();
      renderOrSyncBottomBar();
      renderOrSyncFloatingDock();
      wireCoreNavActions();
      initSmoothMotion();
      initCommandPalette();
    },
    resetDockPosition: function() {
      const def = { ...DEFAULT_POS, snap: 'snap-bottom-center' };
      localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(def));
      localStorage.setItem(LEGACY_STORAGE_KEY, 'snap-bottom-center');
      const dock = document.getElementById('global-floating-dock');
      if (dock) {
        applyInitialPosition(dock, def);
      }
    },
    setDockPosition: function(arg1, arg2, arg3) {
      const dock = document.getElementById('global-floating-dock');
      let coords = null;
      if (typeof arg1 === 'string') {
        coords = snapToCoords(arg1);
        coords.snap = arg1;
        localStorage.setItem(LEGACY_STORAGE_KEY, arg1);
      } else if (typeof arg1 === 'object' && arg1 !== null) {
        coords = {
          left: Number(arg1.left) || DEFAULT_POS.left,
          top: Number(arg1.top) || DEFAULT_POS.top,
          mode: arg1.mode || DEFAULT_POS.mode,
          snap: arg1.snap || null
        };
      } else if (typeof arg1 === 'number' && typeof arg2 === 'number') {
        coords = {
          left: arg1,
          top: arg2,
          mode: arg3 || 'horizontal',
          snap: null
        };
      }

      if (coords) {
        localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(coords));
        if (coords.snap) {
          localStorage.setItem(LEGACY_STORAGE_KEY, coords.snap);
        } else {
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
        if (dock) {
          applyInitialPosition(dock, coords);
        }
      }
    },
    getDockPosition: function() {
      return getStoredPosition() || { ...DEFAULT_POS };
    }
  };

  // Expose globally
  window.NavigationSystem = NavigationSystem;

  // Run automatically when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', NavigationSystem.init);
  } else {
    NavigationSystem.init();
  }

})(window, document);
