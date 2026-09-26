/**
 * app.js — Global application state, auth check, language switcher, nav dynamics, toasts
 * Upgraded with Apple Design fluid response and Emil Kowalski micro-interactions
 */

// ── Language State & Full i18n Localization Engine ─────────
const LANGUAGES = { en: 'English', hi: 'हिंदी', mr: 'मराठी' };
let currentLang = localStorage.getItem('lang') || 'en';

const SITE_I18N = {
  en: {
    nav_home: 'Home',
    nav_archive: 'Complete Works (60 Vol)',
    nav_media: 'Speeches & Media',
    nav_timeline: 'Timeline',
    nav_assistant: 'AI Assistant',
    nav_ocr: 'Manuscript OCR',
    nav_signin: 'Sign In',
    nav_logout: 'Logout',
    nav_dashboard: 'My Research Dashboard',
    search_placeholder: "Search 60 volumes, speeches, ideas (e.g. 'caste', 'constitution', 'rupee')...",
    hero_eyebrow: 'National Heritage Preservation • MEA & Dr. Ambedkar Foundation',
    hero_title: '<span class="text-gradient">Dr. Babasaheb Ambedkar</span><br />Digital Heritage Archive',
    hero_desc: 'An immersive, museum-grade knowledge repository uniting <strong>60 official volumes</strong> (20 English & 40 Hindi BAWS volumes), rare audio-visual broadcasts, constituent assembly debates, and intelligent multilingual semantic search.',
    hero_explore: 'Explore Archive',
    hero_browse_vols: 'Browse All 60 Volumes',
    hero_listen_media: '🎬 Listen to Speeches & Media',
    hero_ask_ai: '🤖 Ask AI Assistant',
    stat_vols: 'Official Volumes (20 EN + 40 HI)',
    stat_pages: 'Archival Pages Digitized',
    stat_speeches: 'Historic Speeches & Radio',
    stat_access: 'Open Public Domain Access',
    filter_all_media: 'All Media',
    filter_speech: 'Historic Speeches',
    filter_video: 'Video & Archives',
    filter_hindi: 'Hindi Playlist & Works',
    filter_interview: 'Interviews & Debates',
    filter_all_editions: 'All Editions (60 Vol)',
    filter_en_editions: 'English BAWS (Vol 1–21)',
    filter_hi_editions: 'Hindi BAWS (Vol 1–40)',
    filter_all_cats: 'All Categories',
    filter_books: 'Books & Monographs',
    filter_speeches: 'Speeches & Addresses',
    filter_manuscripts: 'Manuscripts & Unpublished',
    filter_debates: 'Constituent Assembly',
    filter_reports: 'Reports & Documents',
    sec_works_title: '60 Volumes of Dr. Ambedkar’s Complete Writings',
    sec_works_desc: 'Searchable, high-fidelity digitized volumes with chapter breakdowns and instant local PDF access.',
    sec_media_title: 'Historic Audio-Visual Recordings',
    sec_media_desc: 'Listen to authentic audio recordings of Dr. Ambedkar\'s speeches, landmark Constituent Assembly radio broadcasts, and historical documentary footage with synchronized transcripts.',
    words_title: 'Words of Dr. Ambedkar:'
  },
  hi: {
    nav_home: 'मुखपृष्ठ',
    nav_archive: 'समग्र साहित्य (६० खंड)',
    nav_media: 'भाषण एवं मीडिया',
    nav_timeline: 'कालक्रम',
    nav_assistant: 'एआई शोध सहायक',
    nav_ocr: 'हस्तलिखित ओसीआर',
    nav_signin: 'साइन इन',
    nav_logout: 'लॉग आउट',
    nav_dashboard: 'शोध डैशबोर्ड',
    search_placeholder: "६० खंड, भाषण, विचार खोजें (उदा. 'जाति', 'संविधान', 'रुपया')...",
    hero_eyebrow: 'राष्ट्रीय धरोहर संरक्षण • विदेश मंत्रालय एवं डॉ. आंबेडकर प्रतिष्ठान',
    hero_title: '<span class="text-gradient">डॉ. बाबासाहेब आंबेडकर</span><br />डिजिटल धरोहर अभिलेखागार',
    hero_desc: '<strong>६० आधिकारिक खंडों</strong> (२० अंग्रेजी एवं ४० हिंदी वाङ्मय खंड), दुर्लभ ऑडियो-विजुअल प्रसारण, संविधान सभा वाद-विवाद और बहुभाषी ज्ञान खोज को समर्पित एक समृद्ध राष्ट्रीय डिजिटल संग्रह।',
    hero_explore: 'संग्रह खोजें',
    hero_browse_vols: 'सभी ६० खंड देखें',
    hero_listen_media: '🎬 भाषण एवं मीडिया सुनें',
    hero_ask_ai: '🤖 एआई सहायक से पूछें',
    stat_vols: 'आधिकारिक खंड (२० अंग्रेजी + ४० हिंदी)',
    stat_pages: 'डिजिटाइज्ड ऐतिहासिक पृष्ठ',
    stat_speeches: 'ऐतिहासिक भाषण एवं रेडियो प्रसारण',
    stat_access: 'निःशुल्क सार्वजनिक राष्ट्रीय धरोहर',
    filter_all_media: 'सभी मीडिया',
    filter_speech: 'ऐतिहासिक भाषण',
    filter_video: 'वीडियो एवं अभिलेख',
    filter_hindi: 'हिंदी वाङ्मय एवं प्लेलिस्ट',
    filter_interview: 'साक्षात्कार एवं चर्चा',
    filter_all_editions: 'सभी संस्करण (६० खंड)',
    filter_en_editions: 'अंग्रेजी वाङ्मय (खंड १–२१)',
    filter_hi_editions: 'हिंदी वाङ्मय (खंड १–४०)',
    filter_all_cats: 'सभी श्रेणियाँ',
    filter_books: 'पुस्तकें एवं ग्रंथ',
    filter_speeches: 'भाषण एवं संबोधन',
    filter_manuscripts: 'हस्तलिखित व अप्रकाशित सामग्री',
    filter_debates: 'संविधान सभा वाद-विवाद',
    filter_reports: 'रिपोर्ट एवं दस्तावेज',
    sec_works_title: 'डॉ. आंबेडकर के संपूर्ण वाङ्मय के ६० खंड',
    sec_works_desc: 'अध्यायवार अनुक्रमणिका, तीव्र खोज और स्थानीय आधिकारिक पीडीएफ डाउनलोड के साथ संपूर्ण संकलन।',
    sec_media_title: 'ऐतिहासिक ऑडियो-विजुअल रिकॉर्डिंग्स',
    sec_media_desc: 'डॉ. आंबेडकर के मूल भाषण, ऐतिहासिक संविधान सभा रेडियो प्रसारण और समकालिक प्रतिलेखों के साथ दुर्लभ वृत्तचित्र देखें व सुनें।',
    words_title: 'डॉ. आंबेडकर के अनमोल विचार:'
  },
  mr: {
    nav_home: 'मुख्यपृष्ठ',
    nav_archive: 'संपूर्ण साहित्य (६० खंड)',
    nav_media: 'भाषणे आणि मीडिया',
    nav_timeline: 'घटनाक्रम',
    nav_assistant: 'एआय सहाय्यक',
    nav_ocr: 'हस्तलिखित ओसीआर',
    nav_signin: 'लॉग इन',
    nav_logout: 'बाहेर पडा',
    nav_dashboard: 'माझे संशोधन डॅशबोर्ड',
    search_placeholder: "६० खंड, भाषणे, विचार शोधा (उदा. 'जाती', 'संविधान', 'रुपया')...",
    hero_eyebrow: 'राष्ट्रीय वारसा जतन • परराष्ट्र मंत्रालय व डॉ. आंबेडकर फाउंडेशन',
    hero_title: '<span class="text-gradient">डॉ. बाबासाहेब आंबेडकर</span><br />डिजिटल हेरिटेज अर्काईव्ह',
    hero_desc: '<strong>६० अधिकृत खंड</strong> (२० इंग्रजी व ४० हिंदी साहित्य खंड), दुर्मिळ ध्वनी व चित्रफिती, संविधान सभा वादविवाद आणि बहुभाषिक शोध प्रणालीसह समृद्ध राष्ट्रीय ज्ञान भांडार.',
    hero_explore: 'संग्रह पहा',
    hero_browse_vols: 'सर्व ६० खंड वाचा',
    hero_listen_media: '🎬 भाषणे व मीडिया ऐका',
    hero_ask_ai: '🤖 एआय सहाय्यकास विचारा',
    stat_vols: 'अधिकृत खंड (२० इंग्रजी + ४० हिंदी)',
    stat_pages: 'डिजिटाइझ केलेली ऐतिहासिक पाने',
    stat_speeches: 'ऐतिहासिक भाषणे व नभोवाणी',
    stat_access: 'मुक्त सार्वजनिक राष्ट्रीय वारसा',
    filter_all_media: 'सर्व मीडिया',
    filter_speech: 'ऐतिहासिक भाषणे',
    filter_video: 'व्हिडिओ आणि अर्काईव्ह',
    filter_hindi: 'हिंदी साहित्य व ऑडिओ',
    filter_interview: 'मुलाखती व चर्चा',
    filter_all_editions: 'सर्व आवृत्त्या (६० खंड)',
    filter_en_editions: 'इंग्रजी साहित्य (खंड १–२१)',
    filter_hi_editions: 'हिंदी साहित्य (खंड १–४०)',
    filter_all_cats: 'सर्व वर्ग',
    filter_books: 'पुस्तके व ग्रंथ',
    filter_speeches: 'भाषणे व विचार',
    filter_manuscripts: 'हस्तलिखिते व अप्रकाशित सामग्री',
    filter_debates: 'संविधान सभा वादविवाद',
    filter_reports: 'अहवाल व कागदपत्रे',
    sec_works_title: 'डॉ. आंबेडकरांच्या संपूर्ण साहित्याचे ६० खंड',
    sec_works_desc: 'प्रकरणानुसार विभागणी, जलद शोध आणि अधिकृत स्थानिक पीडीएफ डाऊनलोडसह उपलब्ध.',
    sec_media_title: 'ऐतिहासिक ध्वनी व चित्रफिती',
    sec_media_desc: 'डॉ. आंबेडकरांची मूळ भाषणे, संविधान सभेचे ऐतिहासिक नभोवाणी प्रक्षेपण आणि समक्रमित मजकुरासह दुर्मिळ व्हिडिओ पहा व ऐका.',
    words_title: 'डॉ. बाबासाहेबांचे प्रेरक विचार:'
  }
};

function applyTranslations(lang) {
  const dict = SITE_I18N[lang] || SITE_I18N.en;

  // 1. Navigation links
  const navMap = [
    { href: 'index.html', key: 'nav_home', icon: '🏠' },
    { href: 'archive.html', key: 'nav_archive', icon: '📚' },
    { href: 'media.html', key: 'nav_media', icon: '🎬' },
    { href: 'timeline.html', key: 'nav_timeline', icon: '📅' },
    { href: 'assistant.html', key: 'nav_assistant', icon: '🤖' },
    { href: 'ocr.html', key: 'nav_ocr', icon: '📜' },
    { href: 'dashboard.html', key: 'nav_dashboard', icon: '👤' }
  ];

  navMap.forEach(({ href, key, icon }) => {
    document.querySelectorAll(`.nav-link[href="${href}"]`).forEach(link => {
      // Check if it's in mobile menu (which has icons)
      if (link.closest('.mobile-menu')) {
        link.textContent = `${icon} ${dict[key]}`;
      } else {
        link.textContent = dict[key];
      }
    });
  });

  const loginBtn = document.getElementById('nav-login-btn');
  if (loginBtn) loginBtn.textContent = dict.nav_signin;

  document.querySelectorAll('[data-action="logout"]').forEach(btn => {
    btn.textContent = dict.nav_logout;
  });

  // 2. Search inputs placeholder
  document.querySelectorAll('#hero-search-input, #archive-search, #search-input, input[type="search"]').forEach(input => {
    input.setAttribute('placeholder', dict.search_placeholder);
  });

  // 3. Hero Section
  const heroEyebrow = document.querySelector('.hero-eyebrow span:last-child');
  if (heroEyebrow) heroEyebrow.textContent = dict.hero_eyebrow;

  const heroTitle = document.getElementById('hero-title');
  if (heroTitle) heroTitle.innerHTML = dict.hero_title;

  const heroSubtitle = document.querySelector('.hero-subtitle');
  if (heroSubtitle) heroSubtitle.innerHTML = dict.hero_desc;

  const heroExploreBtn = document.querySelector('button[type="submit"] span:first-child');
  if (heroExploreBtn) heroExploreBtn.textContent = dict.hero_explore;

  const heroBrowseBtn = document.querySelector('.hero-actions a[href="archive.html"] span:first-child');
  if (heroBrowseBtn) heroBrowseBtn.textContent = dict.hero_browse_vols;

  const heroMediaBtn = document.querySelector('.hero-actions a[href="media.html"] span:first-child');
  if (heroMediaBtn) heroMediaBtn.textContent = dict.hero_listen_media;

  const heroAiBtn = document.querySelector('.hero-actions a[href="assistant.html"] span:first-child');
  if (heroAiBtn) heroAiBtn.textContent = dict.hero_ask_ai;

  // 4. Stats bar
  const statLabels = document.querySelectorAll('.stat-label');
  if (statLabels.length >= 4) {
    statLabels[0].textContent = dict.stat_vols;
    statLabels[1].textContent = dict.stat_pages;
    statLabels[2].textContent = dict.stat_speeches;
    statLabels[3].textContent = dict.stat_access;
  }

  // 5. Media filter tabs
  const mediaFilterMap = {
    'all': dict.filter_all_media,
    'speech': dict.filter_speech,
    'video': dict.filter_video,
    'hindi': dict.filter_hindi,
    'interview': dict.filter_interview
  };
  document.querySelectorAll('.filter-tabs .filter-btn').forEach(btn => {
    const f = btn.getAttribute('data-filter');
    if (f && mediaFilterMap[f]) {
      btn.textContent = mediaFilterMap[f];
    }
  });

  // 6. Archive filter tabs
  const editionMap = {
    'all': dict.filter_all_editions,
    'english': dict.filter_en_editions,
    'hindi': dict.filter_hi_editions
  };
  document.querySelectorAll('#edition-tabs .filter-tab').forEach(tab => {
    const ed = tab.dataset.edition;
    if (ed && editionMap[ed]) tab.textContent = editionMap[ed];
  });

  const catMap = {
    'all': dict.filter_all_cats,
    'book': dict.filter_books,
    'speech': dict.filter_speeches,
    'manuscript': dict.filter_manuscripts,
    'debate': dict.filter_debates,
    'report': dict.filter_reports
  };
  document.querySelectorAll('#category-tabs .filter-tab').forEach(tab => {
    const cat = tab.dataset.filter;
    if (cat && catMap[cat]) tab.textContent = catMap[cat];
  });

  // 7. Words of Dr. Ambedkar label
  const wordsLabel = document.querySelector('.flex.items-center.gap-3 span:last-child');
  if (wordsLabel && wordsLabel.textContent.includes('Ambedkar')) {
    wordsLabel.textContent = dict.words_title;
  }
}

function setLanguage(lang) {
  if (!LANGUAGES[lang]) return;
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.setAttribute('lang', lang);
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  
  // Apply full translation in DOM
  applyTranslations(lang);

  // Trigger re-render if page has language-aware content (archive, media, timeline)
  document.dispatchEvent(new CustomEvent('languageChange', { detail: { lang } }));
}

function getCurrentLang() { return currentLang; }

// ── Global Atmosphere Theme State ─────────────────────
const THEMES = ['dark', 'paper', 'sepia'];
const THEME_LABELS = {
  dark: 'Dark Slate Atmosphere',
  paper: 'Ivory Paper Sanctuary',
  sepia: 'Historical Sepia Sanctuary'
};
let currentTheme = localStorage.getItem('site_theme') || localStorage.getItem('reader_theme') || 'dark';

function setSiteTheme(theme, notify = false) {
  if (!THEMES.includes(theme)) return;
  currentTheme = theme;
  localStorage.setItem('site_theme', theme);
  localStorage.setItem('reader_theme', theme);

  document.documentElement.setAttribute('data-theme', theme);
  document.body.classList.remove('mode-dark', 'mode-paper', 'mode-sepia');
  document.body.classList.add(`mode-${theme}`);

  // Sync nav theme buttons
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });

  // Sync reader theme buttons if on reader page
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });

  // Sync with Apple Bottom Sheet active buttons if initialized
  if (window.AppleSheet && typeof window.AppleSheet.updateActiveThemeButtons === 'function') {
    window.AppleSheet.updateActiveThemeButtons();
  }

  if (notify && typeof showToast === 'function') {
    showToast(`Atmosphere: ${THEME_LABELS[theme] || theme}`, 'info');
  }

  document.dispatchEvent(new CustomEvent('themeChange', { detail: { theme } }));
}

function getCurrentTheme() { return currentTheme; }

// ── Auth State ────────────────────────────────────────
let currentUser = null;

function getStoredUser() {
  try {
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setAuthSession(token, user) {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
  currentUser = user;
  updateNavAuth();
}

function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  currentUser = null;
  updateNavAuth();
  showToast('Logged out successfully', 'info');
  setTimeout(() => { window.location.href = 'index.html'; }, 600);
}

function isLoggedIn() {
  return !!(localStorage.getItem('auth_token') && getStoredUser());
}

function requireAuth() {
  if (!isLoggedIn()) {
    sessionStorage.setItem('redirect_after_login', window.location.href);
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// ── Nav Auth UI ───────────────────────────────────────
function updateNavAuth() {
  const user = getStoredUser();
  const loginBtn = document.getElementById('nav-login-btn');
  const userMenu = document.getElementById('nav-user-menu');
  const userNameEl = document.getElementById('nav-user-name');
  const userRoleEl = document.getElementById('nav-user-role');

  if (user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (userMenu) {
      userMenu.style.display = 'flex';
      if (userNameEl) userNameEl.textContent = user.name.split(' ')[0];
      if (userRoleEl) userRoleEl.textContent = user.role;
    }
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-flex';
    if (userMenu) userMenu.style.display = 'none';
  }
}

// ── Toast System (Sonner Bridge) ──────────────────────
function showToast(message, type = 'info', duration = 3500) {
  if (window.toast && typeof window.toast.show === 'function') {
    window.toast.show(message, type, duration);
    return;
  }

  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✦', error: '✕', info: '⚜️', warning: '▲' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '⚜️'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'sonnerToastOut 0.22s cubic-bezier(0.77, 0, 0.175, 1) forwards';
    setTimeout(() => toast.remove(), 220);
  }, duration);
}

// ── Mobile Hamburger & Morph ──────────────────────────
function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!hamburger || !mobileMenu) return;

  // Single Source of Truth: if handled by NavigationSystem, prevent duplicate click listeners
  if (hamburger.__navWired || window.NavigationSystem) return;
  hamburger.__navWired = true;

  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = mobileMenu.classList.contains('open');
    const nextState = !isOpen;
    hamburger.setAttribute('aria-expanded', String(nextState));
    mobileMenu.classList.toggle('open', nextState);
    document.body.style.overflow = nextState ? 'hidden' : '';
  });

  // Close on navigation link click (keep open on theme/lang toggles for fluid UX)
  mobileMenu.querySelectorAll('a').forEach((el) => {
    el.addEventListener('click', () => {
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close on Escape key (Emil: keyboard interactions should be instant)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

// ── Floating Nav Scroll Dynamics (Apple Fluidity) ─────
function initNavScrollDynamics() {
  const navEl = document.querySelector('.nav, .navbar');
  const navInner = document.querySelector('.nav-inner, .nav-container');
  if (!navInner) return;

  let lastScrollY = window.pageYOffset || 0;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const currentScroll = window.pageYOffset || 0;
        navInner.classList.toggle('scrolled', currentScroll > 30);

        if (navEl) {
          const mobileMenu = document.getElementById('mobile-menu');
          const isMenuOpen = mobileMenu && mobileMenu.classList.contains('open');

          if (isMenuOpen || currentScroll < 80) {
            navEl.classList.remove('nav-hidden');
          } else if (currentScroll > lastScrollY + 8 && currentScroll > 120) {
            // Scrolling down — hide navbar so it never covers or obstructs headings
            navEl.classList.add('nav-hidden');
          } else if (currentScroll < lastScrollY - 6) {
            // Scrolling up — smoothly reveal navbar
            navEl.classList.remove('nav-hidden');
          }
        }

        lastScrollY = Math.max(0, currentScroll);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ── Active Nav Link ───────────────────────────────────
function setActiveNavLink() {
  const path = window.location.pathname.toLowerCase();
  const isHome = path === '' || path.endsWith('/') || path.endsWith('/index.html') || path.endsWith('\\index.html');

  document.querySelectorAll('.nav-link, .tab-item').forEach((link) => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    if (!href) return;
    const base = href.replace('../', '').replace('./', '');
    if (isHome) {
      link.classList.toggle('active', base === 'index.html' || base === 'index');
    } else {
      const matchKey = base.replace('.html', '');
      link.classList.toggle('active', matchKey !== 'index' && path.includes(matchKey));
    }
  });
}

// ── Global Keyboard Shortcuts (Emil: Instant, no delay) ─
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Press '/' to trigger Spotlight HUD if available, else focus search input
    if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
      e.preventDefault();
      if (window.CommandPalette && typeof window.CommandPalette.open === 'function') {
        window.CommandPalette.open();
        return;
      }
      const searchInput = document.querySelector('input[type="search"], #hero-search-input, #search-input');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      } else if (!window.location.pathname.includes('archive.html')) {
        window.location.href = 'archive.html#search';
      }
    }
  });
}

// ── Emil Kowalski Animated Stat Counters ─────────────────
function initStatCounters() {
  const statElements = document.querySelectorAll('.stat-val, .stat-value, .num-tabular');
  if (!statElements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const text = el.textContent.trim();
        const match = text.match(/([0-9,]+)(\+?)/);
        if (match && !el.dataset.animated) {
          el.dataset.animated = 'true';
          const targetNum = parseInt(match[1].replace(/,/g, ''), 10);
          const suffix = match[2] || '';
          if (isNaN(targetNum) || targetNum <= 0) return;

          let start = 0;
          const duration = Math.min(1600, Math.max(600, targetNum * 20));
          const startTime = performance.now();

          function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out quintic: 1 - pow(1 - progress, 5)
            const ease = 1 - Math.pow(1 - progress, 5);
            const current = Math.floor(ease * targetNum);
            el.textContent = current.toLocaleString('en-IN') + suffix;

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            } else {
              el.textContent = targetNum.toLocaleString('en-IN') + suffix;
            }
          }
          requestAnimationFrame(updateCounter);
        }
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.2 });

  statElements.forEach(el => observer.observe(el));
}

// ── Kiosk Mode ────────────────────────────────────────
function toggleKioskMode() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen().catch((err) => {
      showToast(`Fullscreen unavailable: ${err.message}`, 'warning');
    });
  }
}

// ── Format helpers ────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getCategoryEmoji(category) {
  const map = { book: '📖', speech: '🎤', debate: '🏛️', manuscript: '📜', report: '📋', article: '📰', letter: '✉️' };
  return map[category] || '📄';
}

function truncate(text, max = 120) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

// ── Global Side Dock & Clean Top Nav Engine ──────────────
// ── Global Navigation & Movable Dockbar System (Master Integration) ──
function initGlobalNavigation() {
  if (window.NavigationSystem && typeof window.NavigationSystem.init === 'function') {
    window.NavigationSystem.init();
  } else {
    const existing = document.querySelector('script[src*="navigation-system.js"]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'js/navigation-system.js';
      script.onload = () => {
        if (window.NavigationSystem) window.NavigationSystem.init();
      };
      document.head.appendChild(script);
    }
  }
}

// ── Init ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Set language & theme
  setLanguage(currentLang);
  setSiteTheme(currentTheme);

  // Initialize Global Single Source of Truth Navigation & Movable Dockbar
  initGlobalNavigation();

  // Language buttons
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });

  // Theme toggle buttons (Navbar capsule, mobile drawer, and reader sidebar)
  document.querySelectorAll('.theme-toggle-btn, .theme-btn').forEach((btn) => {
    btn.addEventListener('click', () => setSiteTheme(btn.dataset.theme, true));
  });

  // Auth state
  currentUser = getStoredUser();
  updateNavAuth();

  // Mobile menu & Nav dynamics
  initHamburger();
  initNavScrollDynamics();
  setActiveNavLink();
  initKeyboardShortcuts();
  initStatCounters();

  // Logout button
  document.querySelectorAll('[data-action="logout"]').forEach((btn) => {
    btn.addEventListener('click', logout);
  });

  // Kiosk button
  document.querySelectorAll('[data-action="kiosk"]').forEach((btn) => {
    btn.addEventListener('click', toggleKioskMode);
  });

  // Register Service Worker for Mobile PWA and Offline Speed
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.debug('ServiceWorker registration skipped:', err.message);
      });
    });
  }
});

// ── Exports (global) ──────────────────────────────────
window.AppState = {
  getCurrentLang,
  setLanguage,
  getCurrentTheme,
  setSiteTheme,
  isLoggedIn,
  getStoredUser,
  setAuthSession,
  logout,
  requireAuth,
  showToast,
  formatDate,
  formatDuration,
  getCategoryEmoji,
  truncate,
  get ApplePhysics() { return window.ApplePhysics; },
  get AppleSheet() { return window.AppleSheet; },
};
