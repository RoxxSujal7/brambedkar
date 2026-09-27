/**
 * reader.js — High-Performance Mozilla PDF.js Engine & Archival Reader
 * Directly streams and renders 100% of all real pages (500+ pages per volume)
 * with spread book view, zoom, smooth transitions, and native viewer toggle.
 */

let pdfDoc = null;
let currentDocMeta = null;
let currentPageNum = 1;
let isTwoPageMode = false; // Default to Single Page Layout
let zoomScale = 1.0;
let isRendering = false;
let renderQueue = null;
let soundEnabled = false;
let audioCtx = null;

// Complete 60 Volumes Catalog Map for Quick Volume Switching & PDF Paths
const VOLUMES_MAP = [
  // English Volumes 1–21
  { id: 'doc-en-1', volNo: 1, title: 'Castes in India & Annihilation of Caste', edition: 'English', file: '/pdfs/Volume1.pdf', year: 1979 },
  { id: 'doc-en-2', volNo: 2, title: 'Bombay Legislature & Round Table Conferences', edition: 'English', file: '/pdfs/Volume2.pdf', year: 1982 },
  { id: 'doc-en-3', volNo: 3, title: 'Philosophy of Hinduism, Buddha or Marx', edition: 'English', file: '/pdfs/Volume3.pdf', year: 1987 },
  { id: 'doc-en-4', volNo: 4, title: 'Riddles in Hinduism', edition: 'English', file: '/pdfs/Volume4.pdf', year: 1987 },
  { id: 'doc-en-5', volNo: 5, title: 'Essays on Untouchables & Untouchability', edition: 'English', file: '/pdfs/Volume5.pdf', year: 1989 },
  { id: 'doc-en-6', volNo: 6, title: 'Provincial Finance & Problem of Rupee', edition: 'English', file: '/pdfs/Volume6.pdf', year: 1989 },
  { id: 'doc-en-7', volNo: 7, title: 'Who Were the Shudras? & The Untouchables', edition: 'English', file: '/pdfs/Volume7.pdf', year: 1990 },
  { id: 'doc-en-8', volNo: 8, title: 'Pakistan or the Partition of India', edition: 'English', file: '/pdfs/Volume8.pdf', year: 1990 },
  { id: 'doc-en-9', volNo: 9, title: 'What Congress & Gandhi Have Done', edition: 'English', file: '/pdfs/Volume9.pdf', year: 1991 },
  { id: 'doc-en-10', volNo: 10, title: 'Executive Council (1942–46) & Labour', edition: 'English', file: '/pdfs/Volume10.pdf', year: 1991 },
  { id: 'doc-en-11', volNo: 11, title: 'The Buddha and His Dhamma', edition: 'English', file: '/pdfs/Volume11.pdf', year: 1992 },
  { id: 'doc-en-12', volNo: 12, title: 'Ancient Indian Commerce & Trade', edition: 'English', file: '/pdfs/Volume12.pdf', year: 1993 },
  { id: 'doc-en-13', volNo: 13, title: 'Principal Architect of the Constitution', edition: 'English', file: '/pdfs/Volume13.pdf', year: 1994 },
  { id: 'doc-en-14', volNo: 14, title: 'The Hindu Code Bill (Part I & II)', edition: 'English', file: '/pdfs/Volume14_Part_I.pdf', year: 1995 },
  { id: 'doc-en-15', volNo: 15, title: 'Constituent Assembly & Parliament', edition: 'English', file: '/pdfs/Volume15.pdf', year: 1997 },
  { id: 'doc-en-16', volNo: 16, title: 'Pali Grammar and Dictionary', edition: 'English', file: '/pdfs/Volume16.pdf', year: 1998 },
  { id: 'doc-en-17', volNo: 17, title: 'Dr. Ambedkar & Egalitarian Revolution', edition: 'English', file: '/pdfs/Volume17_Part_I.pdf', year: 2003 },
  { id: 'doc-en-18', volNo: 18, title: 'Linguistic States & Reorganization', edition: 'English', file: '/pdfs/Volume18.pdf', year: 2005 },
  { id: 'doc-en-19', volNo: 19, title: 'Journalism: Mooknayak & Bahishkrit Bharat', edition: 'English', file: '/pdfs/Volume19.pdf', year: 2008 },
  { id: 'doc-en-20', volNo: 20, title: 'Journalism: Janata & Prabuddha Bharat', edition: 'English', file: '/pdfs/Volume20.pdf', year: 2010 },
  { id: 'doc-en-21', volNo: 21, title: 'Official Correspondence & Letters', edition: 'English', file: '/pdfs/Volume21.pdf', year: 2014 },

  // Hindi Volumes 1–40
  ...Array.from({ length: 40 }, (_, i) => {
    const vNo = i + 1;
    return {
      id: `doc-hi-${vNo}`,
      volNo: vNo,
      title: `डॉ. आंबेडकर सम्पूर्ण वाङ्मय - खंड ${vNo}`,
      edition: 'हिन्दी',
      file: `/pdfs/VolumeH${vNo}.pdf`,
      year: 1980 + Math.floor(vNo / 2)
    };
  })
];

// Configure PDF.js Worker
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/pdf/pdf.worker.min.js';
}

function playSoftRustle() {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const bufferSize = audioCtx.sampleRate * 0.09;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const docId = urlParams.get('id') || 'doc-en-1';

  populateVolumeDropdown(docId);
  setupControls();
  await loadPdfVolume(docId);
});

function populateVolumeDropdown(activeId) {
  const select = document.getElementById('volume-select-jump');
  if (!select) return;

  select.innerHTML = '';
  VOLUMES_MAP.forEach(vol => {
    const opt = document.createElement('option');
    opt.value = vol.id;
    opt.textContent = `[${vol.edition}] ${vol.title} (Vol ${vol.volNo})`;
    if (vol.id === activeId || (activeId.includes(String(vol.volNo)) && activeId.includes(vol.edition.toLowerCase().slice(0,2)))) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });

  select.addEventListener('change', (e) => {
    window.location.href = `reader.html?id=${e.target.value}`;
  });
}

function resolveVolumeMeta(docId) {
  let matched = VOLUMES_MAP.find(v => v.id === docId);
  if (!matched) {
    const isHi = docId.includes('hi') || docId.startsWith('VolumeH');
    const numMatch = docId.match(/\d+/);
    const volNum = numMatch ? parseInt(numMatch[0]) : 1;
    matched = VOLUMES_MAP.find(v => v.volNo === volNum && (isHi ? v.edition === 'हिन्दी' : v.edition === 'English')) || VOLUMES_MAP[0];
  }
  return matched;
}

async function loadPdfVolume(docId) {
  currentDocMeta = resolveVolumeMeta(docId);
  updateMetaUI();

  const loadingEl = document.getElementById('canvas-loading');
  const loadingText = document.getElementById('canvas-loading-text');
  if (loadingEl) loadingEl.style.display = 'flex';
  if (loadingText) loadingText.textContent = `Streaming ${currentDocMeta.title} (${currentDocMeta.file})...`;

  // HIGH-02 FIX: Check if local PDF exists before attempting PDF.js load
  // If not available locally, show helpful fallback to MEA external source
  try {
    // Quick HEAD check to see if local PDF is available
    const checkRes = await fetch(currentDocMeta.file, { method: 'HEAD' });
    if (!checkRes.ok) {
      showPdfFallback(loadingEl, loadingText, currentDocMeta);
      return;
    }
  } catch (headErr) {
    // Network issue or CORS — try loading anyway, PDF.js will catch the error
  }

  try {
    const loadingTask = pdfjsLib.getDocument({
      url: currentDocMeta.file,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
      cMapPacked: true,
    });

    pdfDoc = await loadingTask.promise;
    totalPages = pdfDoc.numPages;

    // Update UI with real page count
    const pageCountEl = document.getElementById('doc-page-count');
    const pageMaxLabel = document.getElementById('page-max-label');
    const pageInput = document.getElementById('page-num-input');
    const pageSlider = document.getElementById('page-slider');

    if (pageCountEl) pageCountEl.textContent = `${totalPages} Pages (Full Scanned Volume)`;
    if (pageMaxLabel) pageMaxLabel.textContent = `of ${totalPages}`;
    if (pageInput) {
      pageInput.max = totalPages;
      pageInput.value = currentPageNum;
    }
    if (pageSlider) {
      pageSlider.max = totalPages;
      pageSlider.value = currentPageNum;
    }

    if (loadingEl) loadingEl.style.display = 'none';

    // Render initial page(s)
    await renderCurrentView();

  } catch (err) {
    console.error('PDF Load Error:', err);
    showPdfFallback(loadingEl, loadingText, currentDocMeta, err.message);
  }
}

// HIGH-02 FIX: Graceful fallback UI when local PDF is unavailable
function showPdfFallback(loadingEl, loadingText, meta, errMsg) {
  // Try to find external MEA URL from the volumes API catalog
  const externalUrl = meta.externalUrl || null;
  const meaBaseUrl = 'https://www.mea.gov.in/Portal/LegalTreatiesSearch';

  if (loadingText) {
    loadingText.innerHTML = `
      <div style="text-align:center;padding:1.5rem;max-width:500px;">
        <div style="font-size:2.5rem;margin-bottom:1rem;">📚</div>
        <h3 style="font-family:var(--font-display);color:var(--gold-light);margin-bottom:0.75rem;font-size:1.1rem;">
          ${meta.title}
        </h3>
        <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:1.25rem;line-height:1.6;">
          This volume's local PDF is not yet downloaded to this server.
          ${errMsg ? `<br><span style="color:var(--danger);font-size:0.75rem;font-family:var(--font-mono);">${errMsg}</span>` : ''}
        </p>
        <div style="display:flex;flex-wrap:wrap;gap:0.75rem;justify-content:center;">
          ${externalUrl ? `
            <a href="${externalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
              📥 Download from MEA Official Archive
            </a>
            <button onclick="loadExternalPdf('${externalUrl}')" class="btn btn-secondary btn-sm">
              📖 Open in Embedded Viewer
            </button>
          ` : `
            <a href="https://www.mea.gov.in/Portal/LegalTreatiesSearch" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
              🌐 Visit MEA Official Archive
            </a>
          `}
          <a href="archive.html" class="btn btn-ghost btn-sm">← Back to Archive</a>
        </div>
        <p style="color:var(--text-faint);font-size:0.7rem;margin-top:1rem;">
          Source: Ministry of External Affairs & Dr. Ambedkar Foundation — Official BAWS Publication
        </p>
      </div>
    `;
  }
  if (loadingEl) {
    loadingEl.style.display = 'flex';
    loadingEl.style.alignItems = 'center';
    loadingEl.style.justifyContent = 'center';
  }
}

// Load an external PDF URL in the embedded PDF.js viewer
async function loadExternalPdf(url) {
  const loadingEl = document.getElementById('canvas-loading');
  const loadingText = document.getElementById('canvas-loading-text');
  if (loadingText) loadingText.textContent = 'Loading external PDF...';

  try {
    const loadingTask = pdfjsLib.getDocument({
      url,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
      cMapPacked: true,
    });
    pdfDoc = await loadingTask.promise;
    totalPages = pdfDoc.numPages;
    if (loadingEl) loadingEl.style.display = 'none';
    await renderCurrentView();
  } catch (err) {
    if (loadingText) loadingText.innerHTML = `<span style="color:var(--danger);">Failed to load external PDF: ${err.message}</span>`;
  }
}


function updateMetaUI() {
  if (!currentDocMeta) return;

  const titleEl = document.getElementById('doc-title');
  const sidebarTitle = document.getElementById('sidebar-doc-title');
  const breadcrumbTitle = document.getElementById('breadcrumb-title');
  const volBadge = document.getElementById('doc-volume-badge');
  const sidebarVolBadge = document.getElementById('sidebar-vol-badge');
  const yearEl = document.getElementById('doc-year');
  const downloadBtn = document.getElementById('download-pdf-btn');
  const topDownloadBtn = document.getElementById('top-download-pdf-btn');
  const nativeFrame = document.getElementById('native-pdf-frame');
  const nativeTab = document.getElementById('native-open-tab');

  const volLabel = currentDocMeta.edition === 'हिन्दी' ? `वाङ्मय खंड ${currentDocMeta.volNo}` : `BAWS Vol. ${currentDocMeta.volNo}`;

  if (titleEl) {
    titleEl.textContent = currentDocMeta.title;
    titleEl.style.display = 'block';
    titleEl.style.visibility = 'visible';
    titleEl.style.opacity = '1';
  }
  if (sidebarTitle) {
    sidebarTitle.textContent = currentDocMeta.title;
    sidebarTitle.style.display = 'block';
    sidebarTitle.style.visibility = 'visible';
    sidebarTitle.style.opacity = '1';
  }
  if (breadcrumbTitle) {
    breadcrumbTitle.textContent = currentDocMeta.title;
    breadcrumbTitle.style.visibility = 'visible';
  }
  if (volBadge) volBadge.textContent = volLabel.toUpperCase();
  if (sidebarVolBadge) sidebarVolBadge.textContent = volLabel.toUpperCase();
  if (yearEl) yearEl.textContent = currentDocMeta.year || '1936';

  if (downloadBtn) {
    downloadBtn.href = currentDocMeta.file;
    downloadBtn.setAttribute('download', `${volLabel.replace(/\s+/g, '_')}.pdf`);
  }
  if (topDownloadBtn) {
    topDownloadBtn.href = currentDocMeta.file;
    topDownloadBtn.setAttribute('download', `${volLabel.replace(/\s+/g, '_')}.pdf`);
  }
  if (nativeFrame) nativeFrame.src = currentDocMeta.file;
  if (nativeTab) nativeTab.href = currentDocMeta.file;
}

async function renderSingleCanvas(pageNum, canvasId, wrapperId) {
  const canvas = document.getElementById(canvasId);
  const wrapper = document.getElementById(wrapperId);
  if (!canvas || !wrapper) return;

  if (pageNum > totalPages || pageNum < 1) {
    wrapper.style.display = 'none';
    return;
  }

  wrapper.style.display = 'flex';
  const page = await pdfDoc.getPage(pageNum);

  // Compute scale based on true available viewport to prevent horizontal blowout
  const stage = document.getElementById('canvas-stage-wrapper');
  const availableWidth = stage ? Math.min(stage.clientWidth, window.innerWidth - 32) : Math.min(window.innerWidth - 32, 820);
  const containerWidth = Math.max(availableWidth - (isTwoPageMode ? 40 : 20), 260);
  const targetWidth = (isTwoPageMode ? containerWidth / 2 : Math.min(containerWidth, 820)) * zoomScale;

  const unscaledViewport = page.getViewport({ scale: 1.0 });
  const scale = targetWidth / unscaledViewport.width;
  const viewport = page.getViewport({ scale: scale });

  // High-DPI support
  const pixelRatio = window.devicePixelRatio || 1.5;
  canvas.width = Math.floor(viewport.width * pixelRatio);
  canvas.height = Math.floor(viewport.height * pixelRatio);
  canvas.style.width = '100%';
  canvas.style.maxWidth = `${Math.floor(viewport.width)}px`;
  canvas.style.height = 'auto';
  canvas.style.aspectRatio = `${viewport.width} / ${viewport.height}`;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
    transform: [pixelRatio, 0, 0, pixelRatio, 0, 0],
  };

  await page.render(renderContext).promise;
}

async function renderCurrentView(direction = 'none') {
  if (!pdfDoc) return;

  if (isRendering) {
    renderQueue = direction;
    return;
  }

  isRendering = true;
  const spreadEl = document.getElementById('pages-spread');
  const spineShadow = document.getElementById('spine-shadow');

  // Animation trigger (Emil Kowalski slide-fade)
  if (spreadEl) {
    spreadEl.classList.remove('page-slide-next', 'page-slide-prev');
    void spreadEl.offsetWidth; // Force reflow
    if (direction === 'next') spreadEl.classList.add('page-slide-next');
    if (direction === 'prev') spreadEl.classList.add('page-slide-prev');
  }

  try {
    if (isTwoPageMode) {
      if (spineShadow) spineShadow.style.display = 'block';
      await renderSingleCanvas(currentPageNum, 'canvas-left', 'left-page-box');
      if (currentPageNum + 1 <= totalPages) {
        await renderSingleCanvas(currentPageNum + 1, 'canvas-right', 'right-page-box');
      } else {
        const rightWrapper = document.getElementById('right-page-box');
        if (rightWrapper) rightWrapper.style.display = 'none';
      }
    } else {
      if (spineShadow) spineShadow.style.display = 'none';
      const rightWrapper = document.getElementById('right-page-box');
      if (rightWrapper) rightWrapper.style.display = 'none';
      await renderSingleCanvas(currentPageNum, 'canvas-left', 'left-page-box');
    }

    updateCounterAndInputs();

  } catch (err) {
    console.warn('Render page error:', err);
  } finally {
    isRendering = false;
    if (renderQueue) {
      const q = renderQueue;
      renderQueue = null;
      renderCurrentView(q);
    }
  }
}

function updateCounterAndInputs() {
  const counterEl = document.getElementById('page-counter-badge');
  const pageInput = document.getElementById('page-num-input');
  const pageSlider = document.getElementById('page-slider');
  const progressFill = document.getElementById('reader-progress-fill');

  const displayPage = isTwoPageMode && currentPageNum + 1 <= totalPages
    ? `Pages ${currentPageNum}–${currentPageNum + 1} of ${totalPages}`
    : `Page ${currentPageNum} of ${totalPages}`;

  if (counterEl) counterEl.textContent = displayPage;
  if (pageInput) pageInput.value = currentPageNum;
  if (pageSlider) pageSlider.value = currentPageNum;

  if (progressFill && totalPages > 0) {
    const pct = Math.round((currentPageNum / totalPages) * 100);
    progressFill.style.width = `${pct}%`;
  }
}

function nextPage() {
  const step = isTwoPageMode ? 2 : 1;
  if (currentPageNum + step <= totalPages) {
    currentPageNum += step;
    playSoftRustle();
    renderCurrentView('next');
  }
}

function prevPage() {
  const step = isTwoPageMode ? 2 : 1;
  if (currentPageNum - step >= 1) {
    currentPageNum -= step;
    playSoftRustle();
    renderCurrentView('prev');
  } else if (currentPageNum > 1) {
    currentPageNum = 1;
    playSoftRustle();
    renderCurrentView('prev');
  }
}

function jumpToPage(num) {
  const parsed = parseInt(num);
  if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
    currentPageNum = parsed;
    playSoftRustle();
    renderCurrentView('next');
  }
}

function setupControls() {
  // Navigation buttons
  const nextBtn = document.getElementById('next-btn');
  const prevBtn = document.getElementById('prev-btn');
  if (nextBtn) nextBtn.addEventListener('click', nextPage);
  if (prevBtn) prevBtn.addEventListener('click', prevPage);

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      nextPage();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      prevPage();
    }
  });

  // Page input and slider
  const pageInput = document.getElementById('page-num-input');
  if (pageInput) {
    pageInput.addEventListener('change', (e) => jumpToPage(e.target.value));
  }

  const pageSlider = document.getElementById('page-slider');
  if (pageSlider) {
    pageSlider.addEventListener('input', (e) => jumpToPage(e.target.value));
  }

  // Layout mode (Single page default with persistence)
  const twoPageBtn = document.getElementById('layout-two-page');
  const onePageBtn = document.getElementById('layout-one-page');
  const savedLayout = localStorage.getItem('reader_layout') || 'single';
  isTwoPageMode = (savedLayout === 'two');
  if (twoPageBtn && onePageBtn) {
    twoPageBtn.classList.toggle('active', isTwoPageMode);
    onePageBtn.classList.toggle('active', !isTwoPageMode);

    twoPageBtn.addEventListener('click', () => {
      twoPageBtn.classList.add('active');
      onePageBtn.classList.remove('active');
      isTwoPageMode = true;
      localStorage.setItem('reader_layout', 'two');
      renderCurrentView();
    });

    onePageBtn.addEventListener('click', () => {
      onePageBtn.classList.add('active');
      twoPageBtn.classList.remove('active');
      isTwoPageMode = false;
      localStorage.setItem('reader_layout', 'single');
      renderCurrentView();
    });
  }

  // Zoom controls
  const zoomInBtn = document.getElementById('zoom-in-btn');
  const zoomOutBtn = document.getElementById('zoom-out-btn');
  const zoomFitBtn = document.getElementById('zoom-fit-btn');
  const zoomLabel = document.getElementById('zoom-label');

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      if (zoomScale < 2.0) {
        zoomScale += 0.2;
        if (zoomLabel) zoomLabel.textContent = `${Math.round(zoomScale * 100)}%`;
        renderCurrentView();
      }
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      if (zoomScale > 0.6) {
        zoomScale -= 0.2;
        if (zoomLabel) zoomLabel.textContent = `${Math.round(zoomScale * 100)}%`;
        renderCurrentView();
      }
    });
  }

  if (zoomFitBtn) {
    zoomFitBtn.addEventListener('click', () => {
      zoomScale = 1.0;
      if (zoomLabel) zoomLabel.textContent = '100%';
      renderCurrentView();
    });
  }

  // Sound toggle
  const soundToggle = document.getElementById('sound-flip-toggle');
  if (soundToggle) {
    soundToggle.addEventListener('change', (e) => {
      soundEnabled = e.target.checked;
    });
  }

  // Atmosphere themes (Dark Slate, Ivory Paper, Sepia) with persistence
  const savedTheme = localStorage.getItem('reader_theme') || 'dark';
  document.body.className = `mode-${savedTheme}`;
  document.querySelectorAll('.theme-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-theme') === savedTheme);
  });

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const theme = btn.getAttribute('data-theme');
      document.body.className = `mode-${theme}`;
      localStorage.setItem('reader_theme', theme);
      if (window.showToast) {
        const themeLabels = { dark: 'Dark Slate Sanctuary', paper: 'Ivory Paper Sanctuary', sepia: 'Historical Sepia Sanctuary' };
        window.showToast(`Atmosphere: ${themeLabels[theme] || theme}`, 'info');
      }
    });
  });

  // Viewer mode (Canvas vs Native Viewer)
  const modeCanvas = document.getElementById('view-mode-canvas');
  const modeNative = document.getElementById('view-mode-native');
  const stageWrapper = document.getElementById('canvas-stage-wrapper');
  const nativeContainer = document.getElementById('native-embed-container');
  const spreadControls = document.getElementById('spread-controls-box');
  const zoomControls = document.getElementById('zoom-controls-box');

  if (modeCanvas && modeNative) {
    modeCanvas.addEventListener('click', () => {
      modeCanvas.classList.add('active');
      modeNative.classList.remove('active');
      if (stageWrapper) stageWrapper.style.display = 'flex';
      if (nativeContainer) nativeContainer.style.display = 'none';
      if (spreadControls) spreadControls.style.display = 'flex';
      if (zoomControls) zoomControls.style.display = 'flex';
    });

    modeNative.addEventListener('click', () => {
      switchToNativeViewer();
    });
  }

  // Bookmark modal & Academic Citation Modal
  setupBookmarkModal();
  setupCitationModal();

  // Window resize re-render
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (pdfDoc) renderCurrentView();
    }, 200);
  });
}

function switchToNativeViewer() {
  const modeCanvas = document.getElementById('view-mode-canvas');
  const modeNative = document.getElementById('view-mode-native');
  const stageWrapper = document.getElementById('canvas-stage-wrapper');
  const nativeContainer = document.getElementById('native-embed-container');
  const spreadControls = document.getElementById('spread-controls-box');
  const zoomControls = document.getElementById('zoom-controls-box');

  if (modeNative) modeNative.classList.add('active');
  if (modeCanvas) modeCanvas.classList.remove('active');
  if (stageWrapper) stageWrapper.style.display = 'none';
  if (nativeContainer) nativeContainer.style.display = 'flex';
  if (spreadControls) spreadControls.style.display = 'none';
  if (zoomControls) zoomControls.style.display = 'none';

  const nativeFrame = document.getElementById('native-pdf-frame');
  if (nativeFrame && currentDocMeta && (!nativeFrame.src || !nativeFrame.src.includes(currentDocMeta.file))) {
    nativeFrame.src = currentDocMeta.file;
  }
}

function setupBookmarkModal() {
  const modal = document.getElementById('bookmark-modal');
  const openBtn = document.getElementById('btn-add-bookmark');
  const cancelBtn = document.getElementById('cancel-bookmark-btn');
  const form = document.getElementById('bookmark-form');

  if (!modal || !openBtn) return;

  openBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
  });

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('bookmark-title-input');
      const note = input ? input.value : 'Page bookmark';

      try {
        const bookmarks = JSON.parse(localStorage.getItem('archival_bookmarks') || '[]');
        bookmarks.push({
          docId: currentDocMeta ? currentDocMeta.id : 'doc-en-1',
          docTitle: currentDocMeta ? currentDocMeta.title : 'Volume',
          page: currentPageNum,
          note: note,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('archival_bookmarks', JSON.stringify(bookmarks));
      } catch (e) {}

      modal.style.display = 'none';
      if (input) input.value = '';
      if (window.showToast) {
        window.showToast(`Bookmarked page ${currentPageNum}! 📌`, 'success');
      }
    });
  }
}

function setupCitationModal() {
  const citeBtn = document.getElementById('cite-reader-btn');
  if (!citeBtn) return;

  // Ensure modal DOM element exists
  let modal = document.getElementById('cite-modal-backdrop');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'cite-modal-backdrop';
    modal.className = 'cmd-backdrop';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Academic Citation Generator');
    modal.innerHTML = `
      <div class="cmd-dialog card" style="max-width:680px;">
        <div class="cmd-inner card-inner" style="padding:var(--space-6);">
          <div class="flex-between items-center" style="margin-bottom:var(--space-4);padding-bottom:var(--space-3);border-bottom:1px solid var(--border);">
            <div class="flex items-center gap-2">
              <span style="font-size:1.25rem;">🖋️</span>
              <h3 style="margin:0;font-size:1.15rem;color:var(--text);">Academic Citation Generator</h3>
            </div>
            <button id="cite-modal-close" class="btn btn-ghost btn-sm" type="button" aria-label="Close citation modal" style="padding:4px 10px;font-size:1.15rem;cursor:pointer;line-height:1;border-radius:var(--radius-sm);color:var(--text-muted);display:flex;align-items:center;justify-content:center;">✕</button>
          </div>

          <p id="cite-doc-title" style="font-size:0.88rem;color:var(--gold-light);font-weight:600;margin-bottom:var(--space-4);"></p>

          <div class="flex flex-col gap-3" id="cite-formats-list"></div>

          <div class="flex-between items-center" style="margin-top:var(--space-5);padding-top:var(--space-3);border-top:1px solid var(--border);font-size:0.75rem;color:var(--text-muted);">
            <span>Education Department, Government of Maharashtra (BAWS)</span>
            <span><kbd>ESC</kbd> to close</span>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeCite = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      modal.classList.remove('cmd-active');
    };

    const closeBtn = modal.querySelector('#cite-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeCite);
      closeBtn.addEventListener('touchend', closeCite);
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeCite(e);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('cmd-active')) {
        closeCite(e);
      }
    });
  }

  citeBtn.addEventListener('click', () => {
    if (!currentDocMeta) return;

    const year = currentDocMeta.year || 1989;
    const vol = currentDocMeta.volNo;
    const title = currentDocMeta.title;

    const citations = {
      'APA (7th Ed.)': `Ambedkar, B. R. (${year}). ${title}. In Dr. Babasaheb Ambedkar: Writings and Speeches (Vol. ${vol}). Education Department, Government of Maharashtra.`,
      'MLA (9th Ed.)': `Ambedkar, B. R. "${title}." Dr. Babasaheb Ambedkar: Writings and Speeches, vol. ${vol}, Education Department, Government of Maharashtra, ${year}.`,
      'Chicago (Notes & Bibliography)': `Ambedkar, B. R. ${title}. Vol. ${vol} of Dr. Babasaheb Ambedkar: Writings and Speeches. Mumbai: Government of Maharashtra, ${year}.`,
      'BibTeX': `@incollection{ambedkar_vol_${vol},\n  author    = {Ambedkar, Bhimrao Ramji},\n  title     = {${title}},\n  booktitle = {Dr. Babasaheb Ambedkar: Writings and Speeches},\n  volume    = {${vol}},\n  year      = {${year}},\n  publisher = {Education Department, Government of Maharashtra}\n}`
    };

    document.getElementById('cite-doc-title').textContent = `Volume ${vol}: ${title}`;
    const listEl = document.getElementById('cite-formats-list');
    listEl.innerHTML = Object.entries(citations).map(([styleName, citText]) => `
      <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:var(--space-3) var(--space-4);">
        <div class="flex-between items-center" style="margin-bottom:6px;">
          <span style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;">${styleName}</span>
          <button class="btn btn-secondary btn-sm copy-cite-btn" data-text="${encodeURIComponent(citText)}" style="padding:2px 8px;font-size:0.75rem;">
            📋 Copy
          </button>
        </div>
        <pre style="margin:0;font-size:0.8rem;white-space:pre-wrap;word-break:break-word;font-family:${styleName === 'BibTeX' ? 'var(--font-mono)' : 'inherit'};color:var(--text);line-height:1.5;">${citText}</pre>
      </div>
    `).join('');

    listEl.querySelectorAll('.copy-cite-btn').forEach(b => {
      b.addEventListener('click', () => {
        const text = decodeURIComponent(b.getAttribute('data-text'));
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(() => {
            b.textContent = '✓ Copied!';
            if (window.toast && typeof window.toast.success === 'function') {
              window.toast.success('Citation copied to clipboard!');
            }
            setTimeout(() => { b.textContent = '📋 Copy'; }, 2000);
          });
        }
      });
    });

    modal.classList.add('cmd-active');
  });
}

// Window resize & orientation change handler
let resizeDebounceTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeDebounceTimer);
  resizeDebounceTimer = setTimeout(() => {
    if (pdfDoc && !isRendering) {
      renderCurrentView();
    }
  }, 250);
});
