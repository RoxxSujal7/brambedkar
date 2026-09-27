/**
 * command-palette.js — Apple Spotlight-style Quick Command HUD (Cmd+K / Ctrl+K)
 * Double-bezel architecture, instant fuzzy navigation across all 60 volumes,
 * media records, milestones, reader routes, atmosphere switches, and academic citation generator.
 * Fully compliant with WAI-ARIA 1.2 Combobox / Modal Dialog pattern.
 */

(function initCommandPalette() {
  // Pre-compiled search index for instantaneous response
  const PALETTE_ITEMS = [
    // Atmosphere & Theme Quick Actions
    {
      title: 'Atmosphere: Dark Slate Sanctuary (OLED Black)',
      category: 'Quick Action',
      action: 'theme:dark',
      icon: '🌙',
      badge: 'Theme',
      keywords: 'theme dark night mode slate atmosphere'
    },
    {
      title: 'Atmosphere: Ivory Paper Sanctuary (Warm Cream)',
      category: 'Quick Action',
      action: 'theme:paper',
      icon: '📜',
      badge: 'Theme',
      keywords: 'theme light paper cream day mode atmosphere'
    },
    {
      title: 'Atmosphere: Historical Sepia Sanctuary (Amber Parchment)',
      category: 'Quick Action',
      action: 'theme:sepia',
      icon: '🏺',
      badge: 'Theme',
      keywords: 'theme sepia vintage parchment brown warm atmosphere'
    },

    // Language Quick Actions
    {
      title: 'Switch Interface Language: English',
      category: 'Quick Action',
      action: 'lang:en',
      icon: '🌐',
      badge: 'Language',
      keywords: 'language english en translate'
    },
    {
      title: 'इंटरफ़ेस भाषा बदलें: हिन्दी (Hindi)',
      category: 'Quick Action',
      action: 'lang:hi',
      icon: '🌐',
      badge: 'Language',
      keywords: 'language hindi hindi हिन्दी भाषा translate'
    },
    {
      title: 'इंटरफेस भाषा बदला: मराठी (Marathi)',
      category: 'Quick Action',
      action: 'lang:mr',
      icon: '🌐',
      badge: 'Language',
      keywords: 'language marathi marathi मराठी भाषा translate'
    },

    // Academic Citation Quick Generators (APA 7th Edition)
    {
      title: 'Copy Citation: Annihilation of Caste (Ambedkar, 1936)',
      category: 'Citation',
      citation: 'Ambedkar, B. R. (1936). Annihilation of Caste: With a Reply to Mahatma Gandhi. In Dr. Babasaheb Ambedkar: Writings and Speeches (Vol. 1, pp. 23-96). Education Department, Government of Maharashtra.',
      icon: '🖋️',
      badge: 'Cite APA',
      keywords: 'cite citation apa reference annihilation of caste baws vol 1'
    },
    {
      title: 'Copy Citation: The Problem of the Rupee (Ambedkar, 1923)',
      category: 'Citation',
      citation: 'Ambedkar, B. R. (1923). The Problem of the Rupee: Its Origin and Its Solution. P. S. King & Son, Ltd. [Reprinted in BAWS Vol. 6, Government of Maharashtra].',
      icon: '🖋️',
      badge: 'Cite APA',
      keywords: 'cite citation apa reference problem of the rupee economics rbi baws vol 6'
    },
    {
      title: 'Copy Citation: The Constitution of India (Ambedkar et al., 1950)',
      category: 'Citation',
      citation: 'Constituent Assembly of India. (1949). The Constitution of India (B. R. Ambedkar, Chairman, Drafting Committee). Government of India Press.',
      icon: '🖋️',
      badge: 'Cite APA',
      keywords: 'cite citation apa reference constitution of india constituent assembly drafting committee'
    },
    {
      title: 'Copy Citation: The Buddha and His Dhamma (Ambedkar, 1957)',
      category: 'Citation',
      citation: 'Ambedkar, B. R. (1957). The Buddha and His Dhamma. Siddharth College Publication. [Reprinted in BAWS Vol. 11, Government of Maharashtra].',
      icon: '🖋️',
      badge: 'Cite APA',
      keywords: 'cite citation apa reference buddha and his dhamma buddhism baws vol 11'
    },
    {
      title: 'Copy Citation: Who Were the Shudras? (Ambedkar, 1946)',
      category: 'Citation',
      citation: 'Ambedkar, B. R. (1946). Who Were the Shudras? How they came to be the Fourth Varna in the Indo-Aryan Society. Thacker & Co. [Reprinted in BAWS Vol. 7].',
      icon: '🖋️',
      badge: 'Cite APA',
      keywords: 'cite citation apa reference who were the shudras baws vol 7'
    },

    // Navigation
    { title: 'Archive Catalog — Complete 60 BAWS Volumes', category: 'Navigation', url: 'archive.html', icon: '📚', badge: 'Browse' },
    { title: 'Reader Sanctuary — Distraction-Free Archival Study', category: 'Navigation', url: 'reader.html', icon: '📖', badge: 'Reader' },
    { title: 'Historical Audio-Visual Player & Speeches', category: 'Navigation', url: 'media.html', icon: '🎙️', badge: 'Media' },
    { title: 'Milestone Chronology (1891–1956)', category: 'Navigation', url: 'timeline.html', icon: '⏳', badge: 'History' },
    { title: 'Constitutional Debates Explorer', category: 'Navigation', url: 'debates.html', icon: '⚖️', badge: 'Debates' },
    { title: 'Historical Correspondence (361 Archival Letters)', category: 'Navigation', url: 'letters.html', icon: '📜', badge: 'Letters' },
    { title: 'The 22 Vows (22 प्रतिज्ञा) — Deekshabhoomi 1956', category: 'Navigation', url: 'vows.html', icon: '☸️', badge: 'Vows' },
    { title: 'AI Scholarly Research Assistant', category: 'Navigation', url: 'assistant.html', icon: '✨', badge: 'AI' },
    { title: 'Manuscript OCR Visualizer', category: 'Navigation', url: 'ocr.html', icon: '🔍', badge: 'Tools' },
    { title: 'National Memorials & Heritage Sanctuaries', category: 'Navigation', url: 'memorials.html', icon: '🏛️', badge: 'Heritage' },
    { title: 'Research Workspace & Dashboard', category: 'Navigation', url: 'dashboard.html', icon: '📊', badge: 'User' },
    { title: 'Institutional Transparency & SHA-256 Audit Log', category: 'Navigation', url: 'transparency.html', icon: '🛡️', badge: 'Security' },

    // Landmark Books & Treatises
    { title: 'Annihilation of Caste (1936)', category: 'Treatise', url: 'archive.html?search=Annihilation%20of%20Caste', icon: '⚡', badge: 'Vol 1' },
    { title: 'Castes in India: Mechanism, Genesis & Development (1916)', category: 'Treatise', url: 'archive.html?search=Castes%20in%20India', icon: '📜', badge: 'Vol 1' },
    { title: 'The Problem of the Rupee: Its Origin and Solution (1923)', category: 'Treatise', url: 'archive.html?search=Problem%20of%20the%20Rupee', icon: '🪙', badge: 'Vol 6' },
    { title: 'Who Were the Shudras? (1948)', category: 'Treatise', url: 'archive.html?search=Who%20Were%20the%20Shudras', icon: '🏛️', badge: 'Vol 7' },
    { title: 'The Untouchables: Who Were They? (1948)', category: 'Treatise', url: 'archive.html?search=The%20Untouchables', icon: '🔍', badge: 'Vol 7' },
    { title: 'The Buddha and His Dhamma (1957)', category: 'Treatise', url: 'archive.html?search=Buddha%20and%20His%20Dhamma', icon: '☸️', badge: 'Vol 11' },
    { title: 'Buddha or Karl Marx (1956)', category: 'Treatise', url: 'assistant.html?q=Buddha%20or%20Karl%20Marx', icon: '⚖️', badge: 'Vol 3' },
    { title: 'Riddles in Hinduism (1987)', category: 'Treatise', url: 'archive.html?search=Riddles%20in%20Hinduism', icon: '❓', badge: 'Vol 4' },
    { title: 'States and Minorities (1947 Draft Constitution)', category: 'Treatise', url: 'archive.html?search=States%20and%20Minorities', icon: '🇮🇳', badge: 'Vol 1' },
    { title: 'Pakistan or the Partition of India (1940)', category: 'Treatise', url: 'archive.html?search=Pakistan%20or%20the%20Partition', icon: '🗺️', badge: 'Vol 8' },
    { title: 'What Congress and Gandhi Have Done (1945)', category: 'Treatise', url: 'archive.html?search=What%20Congress%20and%20Gandhi', icon: '📑', badge: 'Vol 9' },
    { title: 'Constituent Assembly Debates (Drafting Speeches)', category: 'Constitutional', url: 'archive.html?search=Constitution', icon: '🏛️', badge: 'Vol 13' },
    { title: 'Hindu Code Bill Debates & Resignation (1951)', category: 'Constitutional', url: 'archive.html?search=Hindu%20Code%20Bill', icon: '⚖️', badge: 'Vol 14' },

    // Key Historic Milestones
    { title: 'Mahad Satyagraha & Chavadar Water Tank (1927)', category: 'Milestone', url: 'timeline.html#1927', icon: '💧', badge: '1927' },
    { title: 'Manusmriti Dahan Din (December 25, 1927)', category: 'Milestone', url: 'timeline.html#1927', icon: '🔥', badge: '1927' },
    { title: 'Kalaram Temple Entry Satyagraha (1930)', category: 'Milestone', url: 'timeline.html#1930', icon: '🚪', badge: '1930' },
    { title: 'Round Table Conferences in London (1930–1932)', category: 'Milestone', url: 'timeline.html#1930', icon: '👑', badge: '1930' },
    { title: 'Poona Pact with Gandhi at Yerwada (1932)', category: 'Milestone', url: 'timeline.html#1932', icon: '✍️', badge: '1932' },
    { title: 'Yeola Declaration — "I will not die a Hindu" (1935)', category: 'Milestone', url: 'timeline.html#1935', icon: '⚡', badge: '1935' },
    { title: 'Constitution Adopted by Constituent Assembly (1949)', category: 'Milestone', url: 'timeline.html#1949', icon: '📜', badge: '1949' },
    { title: 'Nagpur Historic Conversion to Buddhism (1956)', category: 'Milestone', url: 'timeline.html#1956', icon: '☸️', badge: '1956' }
  ];

  // Add all 21 English BAWS Volumes
  for (let i = 1; i <= 21; i++) {
    PALETTE_ITEMS.push({
      title: `BAWS Volume ${i}: Official Writings & Speeches`,
      category: 'BAWS Volume',
      url: `archive.html?search=Volume%20${i}`,
      icon: '📖',
      badge: `Vol ${i}`,
      keywords: `volume ${i} baws english writings speeches book`
    });
  }

  // Add Hindi Volumes highlights (Vols 1 to 40)
  for (let i = 1; i <= 40; i++) {
    PALETTE_ITEMS.push({
      title: `बाबासाहेब संपूर्ण वाङ्मय — खंड ${i} (Hindi BAWS Vol. ${i})`,
      category: 'Hindi BAWS',
      url: `archive.html?lang=hi&search=Vol%20${i}`,
      icon: '📙',
      badge: `खंड ${i}`,
      keywords: `hindi baws volume ${i} khand ${i} vangmaya संपूर्ण वाङ्मय`
    });
  }

  // Inject Command Palette HTML with full WAI-ARIA combobox/modal attributes
  const paletteEl = document.createElement('div');
  paletteEl.id = 'cmd-palette-backdrop';
  paletteEl.className = 'cmd-backdrop';
  paletteEl.setAttribute('role', 'presentation');
  paletteEl.innerHTML = `
    <div class="cmd-dialog card" role="dialog" aria-modal="true" aria-labelledby="cmd-palette-title">
      <h2 id="cmd-palette-title" class="sr-only" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">Archive Command Palette</h2>
      <div class="cmd-inner card-inner">
        <div class="cmd-search-bar" role="search">
          <svg class="cmd-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            type="text"
            id="cmd-input"
            placeholder="Search 60 volumes, cite treatises, change atmosphere, or jump to route..."
            autocomplete="off"
            spellcheck="false"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="false"
            aria-controls="cmd-results"
            aria-activedescendant=""
          />
          <div class="cmd-esc-badge"><kbd>ESC</kbd></div>
          <button id="cmd-close-btn" class="btn btn-ghost btn-sm" type="button" aria-label="Close command palette" style="padding:4px 8px;font-size:1.1rem;cursor:pointer;border-radius:var(--radius-sm);color:var(--text-muted);line-height:1;margin-left:4px;display:flex;align-items:center;justify-content:center;">✕</button>
        </div>
        <div class="sr-only" aria-live="polite" id="cmd-status" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;"></div>
        <div class="cmd-results" id="cmd-results" role="listbox" aria-label="Search results"></div>
        <div class="cmd-footer">
          <div class="cmd-shortcut-hint">
            <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
            <span><kbd>↵</kbd> select</span>
            <span><kbd>esc</kbd> close</span>
          </div>
          <div class="cmd-corpus-badge">60 BAWS Volumes • Instant Citation</div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(paletteEl);

  const input = document.getElementById('cmd-input');
  const resultsContainer = document.getElementById('cmd-results');
  const statusAnnouncer = document.getElementById('cmd-status');
  let selectedIndex = 0;
  let currentMatches = [];

  // Lightweight Fuzzy Matcher with Multi-Factor Scoring
  function scoreMatch(item, query) {
    if (!query) return 1;
    const q = query.toLowerCase();
    const title = item.title.toLowerCase();
    const cat = item.category.toLowerCase();
    const badge = (item.badge || '').toLowerCase();
    const keywords = (item.keywords || '').toLowerCase();
    const allText = `${title} ${cat} ${badge} ${keywords}`;

    // 1. Exact match on title or badge
    if (title === q || badge === q) return 1000;

    // 2. Starts with query
    if (title.startsWith(q)) return 500;
    if (badge.startsWith(q)) return 400;

    // 3. Word boundary match
    const regexWord = new RegExp(`\\b${escapeRegExp(q)}`, 'i');
    if (regexWord.test(title)) return 300;
    if (regexWord.test(keywords)) return 250;

    // 4. Substring match
    if (title.includes(q)) return 150;
    if (badge.includes(q)) return 120;
    if (keywords.includes(q)) return 100;
    if (cat.includes(q)) return 80;

    // 5. Acronym / Initialism check (e.g. "aoc" -> "Annihilation of Caste")
    const words = title.split(/\s+/).filter(w => w.length > 0);
    const initials = words.map(w => w[0]).join('').toLowerCase();
    if (initials.includes(q)) return 70;

    // 6. Subsequence fuzzy match (handles slight typos or omissions)
    let qIdx = 0;
    let score = 0;
    let consecutive = 0;
    for (let i = 0; i < allText.length && qIdx < q.length; i++) {
      if (allText[i] === q[qIdx]) {
        score += 5 + (consecutive * 3);
        consecutive++;
        qIdx++;
      } else {
        consecutive = 0;
      }
    }
    if (qIdx === q.length) {
      return score;
    }

    return 0;
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function openPalette() {
    if (window.ApplePhysics && typeof window.ApplePhysics.haptic === 'function') {
      window.ApplePhysics.haptic('selection');
    }
    paletteEl.classList.add('cmd-active');
    input.setAttribute('aria-expanded', 'true');
    input.value = '';
    selectedIndex = 0;
    renderMatches('');
    setTimeout(() => input.focus(), 60);
  }

  function closePalette() {
    paletteEl.classList.remove('cmd-active');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-activedescendant', '');
  }

  function renderMatches(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
      // Default curated recommendations
      currentMatches = PALETTE_ITEMS.slice(0, 10);
    } else {
      const scored = [];
      for (let i = 0; i < PALETTE_ITEMS.length; i++) {
        const item = PALETTE_ITEMS[i];
        const sc = scoreMatch(item, q);
        if (sc > 0) {
          scored.push({ item, score: sc });
        }
      }
      scored.sort((a, b) => b.score - a.score);
      currentMatches = scored.slice(0, 12).map(s => s.item);
    }

    // Announce for Screen Readers
    if (statusAnnouncer) {
      statusAnnouncer.textContent = `${currentMatches.length} archival items available.`;
    }

    if (currentMatches.length === 0) {
      resultsContainer.innerHTML = `
        <div class="cmd-empty-state">
          <p style="color:var(--text-muted);font-size:0.88rem;">No archival records matching "<strong>${escapeHtml(query)}</strong>"</p>
          <p style="font-size:0.75rem;color:var(--accent-light);margin-top:0.4rem;">Try searching "Vol 1", "Annihilation", "Rupee", "Theme", "Cite", or "Constitution"</p>
        </div>
      `;
      input.setAttribute('aria-activedescendant', '');
      return;
    }

    if (selectedIndex >= currentMatches.length) {
      selectedIndex = 0;
    }

    resultsContainer.innerHTML = currentMatches.map((item, idx) => {
      const isSelected = idx === selectedIndex;
      const optId = `cmd-opt-${idx}`;
      return `
        <div
          id="${optId}"
          class="cmd-item ${isSelected ? 'cmd-item-selected' : ''}"
          data-idx="${idx}"
          role="option"
          aria-selected="${isSelected ? 'true' : 'false'}"
        >
          <span class="cmd-item-icon" aria-hidden="true">${item.icon}</span>
          <div class="cmd-item-body">
            <div class="cmd-item-title">${highlightMatch(item.title, q)}</div>
            <div class="cmd-item-cat">${item.category}${item.citation ? ' • Click to Copy Formatted Citation' : ''}</div>
          </div>
          <span class="cmd-item-badge">${item.badge}</span>
        </div>
      `;
    }).join('');

    input.setAttribute('aria-activedescendant', `cmd-opt-${selectedIndex}`);

    // Click listeners
    resultsContainer.querySelectorAll('.cmd-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-idx'), 10);
        executeItem(currentMatches[idx]);
      });
    });
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }

  function highlightMatch(text, query) {
    if (!query) return escapeHtml(text);
    const words = query.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return escapeHtml(text);
    const pattern = `(${words.map(w => escapeRegExp(w)).join('|')})`;
    const regex = new RegExp(pattern, 'gi');
    return escapeHtml(text).replace(regex, '<mark class="cmd-mark">$1</mark>');
  }

  function executeItem(item) {
    if (!item) return;

    // 1. Citation copy action
    if (item.citation) {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(item.citation).then(() => {
          if (window.toast && typeof window.toast.success === 'function') {
            window.toast.success('APA Citation copied to clipboard!');
          }
        }).catch(() => {
          fallbackCopyText(item.citation);
        });
      } else {
        fallbackCopyText(item.citation);
      }
      closePalette();
      return;
    }

    // 2. Theme switch action
    if (item.action && item.action.startsWith('theme:')) {
      const theme = item.action.split(':')[1];
      if (window.AppState && typeof window.AppState.setSiteTheme === 'function') {
        window.AppState.setSiteTheme(theme, true);
      } else {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('site_theme', theme);
        document.querySelectorAll('.theme-toggle-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.theme === theme);
        });
      }
      if (window.toast && typeof window.toast.success === 'function') {
        window.toast.success(`Atmosphere switched to ${theme.toUpperCase()}`);
      }
      closePalette();
      return;
    }

    // 3. Language switch action
    if (item.action && item.action.startsWith('lang:')) {
      const lang = item.action.split(':')[1];
      if (window.AppState && typeof window.AppState.setLanguage === 'function') {
        window.AppState.setLanguage(lang);
      } else {
        document.querySelectorAll('.lang-btn').forEach(b => {
          const match = b.dataset.lang === lang;
          b.classList.toggle('active', match);
          b.setAttribute('aria-pressed', String(match));
        });
      }
      if (window.toast && typeof window.toast.info === 'function') {
        window.toast.info(`Language set to ${lang.toUpperCase()}`);
      }
      closePalette();
      return;
    }

    // 4. Standard Navigation
    if (item.url) {
      closePalette();
      window.location.href = item.url;
    }
  }

  function fallbackCopyText(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      ta.remove();
      if (window.toast && typeof window.toast.success === 'function') {
        window.toast.success('APA Citation copied to clipboard!');
      }
    } catch (e) {
      console.warn('Clipboard copy failed', e);
    }
  }

  // Keyboard navigation & Focus Trapping inside modal
  input.addEventListener('input', () => {
    selectedIndex = 0;
    renderMatches(input.value);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentMatches.length > 0) {
        selectedIndex = (selectedIndex + 1) % currentMatches.length;
        updateSelectedUI();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentMatches.length > 0) {
        selectedIndex = (selectedIndex - 1 + currentMatches.length) % currentMatches.length;
        updateSelectedUI();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentMatches[selectedIndex]) {
        executeItem(currentMatches[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
    } else if (e.key === 'Tab') {
      // Focus trap within the command palette
      e.preventDefault();
    }
  });

  function updateSelectedUI() {
    resultsContainer.querySelectorAll('.cmd-item').forEach((el, idx) => {
      const isSelected = idx === selectedIndex;
      el.classList.toggle('cmd-item-selected', isSelected);
      el.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      if (isSelected) {
        el.scrollIntoView({ block: 'nearest' });
        input.setAttribute('aria-activedescendant', `cmd-opt-${idx}`);
      }
    });
  }

  // Close button and Backdrop click close palette
  const cmdCloseBtn = paletteEl.querySelector('#cmd-close-btn');
  if (cmdCloseBtn) {
    cmdCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closePalette();
    });
  }

  paletteEl.addEventListener('click', (e) => {
    if (e.target === paletteEl) {
      closePalette();
    }
  });

  // Global hotkeys: Cmd+K, Ctrl+K, or pressing '/' while not typing in an input
  document.addEventListener('keydown', (e) => {
    const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
    const isSlash = e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) && !document.activeElement?.isContentEditable;

    if (isCmdK || isSlash) {
      e.preventDefault();
      if (paletteEl.classList.contains('cmd-active')) {
        closePalette();
      } else {
        openPalette();
      }
    }
  });

  // Expose API
  window.CommandPalette = {
    open: openPalette,
    close: closePalette,
    items: PALETTE_ITEMS
  };
})();
