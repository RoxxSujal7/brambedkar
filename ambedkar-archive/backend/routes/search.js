const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');

// Rate limit: max 120 search queries per minute per IP
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { success: false, message: 'Search rate limit exceeded. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper to safely load JSON files
function loadJsonData(relPath) {
  try {
    const full = path.join(__dirname, relPath);
    if (fs.existsSync(full)) {
      return JSON.parse(fs.readFileSync(full, 'utf8'));
    }
  } catch (e) {
    console.error(`[SEARCH ROUTE] Could not load ${relPath}:`, e.message);
  }
  return [];
}

/**
 * GET /api/search/suggestions?q=prefix
 * Instant query autocomplete and related concept suggestion
 */
router.get('/suggestions', (req, res) => {
  const query = (req.query.q || '').toLowerCase().trim();
  if (!query || query.length < 2) {
    return res.json({ success: true, suggestions: [] });
  }

  const SUGGESTION_CORPUS = [
    'Annihilation of Caste',
    'Castes in India: Their Mechanism, Genesis and Development',
    'The Problem of the Rupee: Its Origin and Its Solution',
    'Constituent Assembly Debates',
    'Article 32 Fundamental Rights',
    'Poona Pact 1932',
    'Mahad Satyagraha Chavdar Tale',
    'Who Were the Shudras?',
    'The Buddha and His Dhamma',
    '22 Vows of Deeksha Bhoomi',
    'States and Minorities',
    'Ranade, Gandhi and Jinnah',
    'Pakistan or the Partition of India',
    'Dr. Ambedkar International Centre (DAIC)',
    'Chaitya Bhoomi Memorial Mumbai',
    'Social Democracy and Constitutional Morality'
  ];

  const matched = SUGGESTION_CORPUS.filter(s => s.toLowerCase().includes(query)).slice(0, 6);

  res.json({
    success: true,
    query,
    suggestions: matched
  });
});

/**
 * GET /api/search?q=query&type=all|volumes|memorials|debates|letters|vows
 * Cross-archive unified search across documents, memorials, debates, letters, and vows
 */
router.get('/', searchLimiter, async (req, res, next) => {
  try {
    const query = (req.query.q || '').trim();
    const filterType = (req.query.type || 'all').toLowerCase();
    const targetVol = req.query.volume ? parseInt(req.query.volume, 10) : null;
    const targetEdition = req.query.edition || req.query.language || null;

    if (!query) {
      return res.json({ success: true, count: 0, data: { results: [] } });
    }

    // HIGH-04 FIX: Validate query length to prevent ReDoS and performance attacks
    if (query.length > 200) {
      return res.status(400).json({ success: false, message: 'Search query must be 200 characters or fewer.' });
    }

    const qLower = query.toLowerCase();
    const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let results = [];

    // 1. Search Volumes / Documents
    if (filterType === 'all' || filterType === 'volumes' || filterType === 'documents') {
      try {
        let docs = [];
        try {
          docs = await Document.find(
            { $text: { $search: query } },
            { score: { $meta: 'textScore' } }
          )
            .sort({ score: { $meta: 'textScore' } })
            .limit(15);
        } catch (e) {
          const regex = new RegExp(sanitizedQuery, 'i');
          docs = await Document.find({
            $or: [{ title: regex }, { description: regex }, { category: regex }, { tags: regex }]
          }).limit(15);
        }

        docs.forEach(d => {
          results.push({
            id: d._id,
            type: 'Volume',
            title: d.title,
            titleHi: d.titleHi || '',
            category: d.category || 'book',
            year: d.year || null,
            volumeNo: d.volumeNo || null,
            excerpt: d.description || d.summary || '',
            link: d.volumeNo ? `reader.html?vol=${d.volumeNo}` : 'archive.html',
            score: (d._doc && d._doc.score) ? d._doc.score : 0.95
          });
        });
      } catch (err) {
        // Fallback to documentService
      }

      // If MongoDB yielded few or no results, search static document catalog
      if (results.length < 5) {
        const documentService = require('../services/documentService');
        const docsResult = await documentService.getDocuments({ limit: 120 });
        const matched = (docsResult.documents || []).filter(d => {
          const textMatch =
            (d.title && d.title.toLowerCase().includes(qLower)) ||
            (d.titleHi && d.titleHi.toLowerCase().includes(qLower)) ||
            (d.summary && d.summary.toLowerCase().includes(qLower)) ||
            (d.tags && d.tags.some(t => t.toLowerCase().includes(qLower))) ||
            `vol ${d.volumeNo}`.includes(qLower);

          const volMatch = !targetVol || d.volumeNo === targetVol;
          const edMatch = !targetEdition || (targetEdition === 'english' ? d.edition === 'English BAWS' : targetEdition === 'hindi' ? d.edition === 'Hindi BAWS' : true);

          return textMatch && volMatch && edMatch;
        }).slice(0, 15);

        matched.forEach(d => {
          if (!results.some(r => r.volumeNo === d.volumeNo && r.type === 'Volume')) {
            results.push({
              id: d._id || `vol-${d.volumeNo}`,
              type: d.edition || 'Volume',
              volumeNo: d.volumeNo,
              title: d.title,
              titleHi: d.titleHi || '',
              category: d.category || 'book',
              year: d.year,
              excerpt: d.summary,
              tags: d.tags || [],
              localPdf: d.localPdf,
              link: `reader.html?vol=${d.volumeNo}`,
              score: 0.92
            });
          }
        });
      }
    }

    // 2. Search Memorials
    if (filterType === 'all' || filterType === 'memorials') {
      const memorials = loadJsonData('../data/memorials.json');
      memorials.forEach(m => {
        const text = `${m.name} ${m.hindiName || ''} ${m.marathiName || ''} ${m.city} ${m.significance} ${m.historicalContext}`.toLowerCase();
        if (text.includes(qLower)) {
          results.push({
            id: m.id,
            type: 'Memorial',
            title: m.name,
            subtitle: `${m.city}, ${m.state}`,
            excerpt: m.significance,
            year: m.establishedYear,
            link: `memorials.html#${m.id}`,
            score: 0.94
          });
        }
      });
    }

    // 3. Search Historical Debates
    if (filterType === 'all' || filterType === 'debates') {
      const debates = loadJsonData('../data/debates.json');
      debates.forEach(d => {
        const text = `${d.title} ${(d.topicsCovered || []).join(' ')} ${d.historicalContext} ${d.ambedkarPosition ? d.ambedkarPosition.thesis : ''}`.toLowerCase();
        if (text.includes(qLower)) {
          results.push({
            id: d.id,
            type: 'Historical Debate',
            title: d.title,
            subtitle: d.period,
            excerpt: d.ambedkarPosition ? d.ambedkarPosition.thesis : d.historicalContext,
            link: `debates.html#${d.id}`,
            score: 0.96
          });
        }
      });
    }

    // 4. Search Letters (361 Correspondence Items)
    if (filterType === 'all' || filterType === 'letters') {
      const letters = loadJsonData('../data/letters.json');
      let letterMatches = 0;
      for (const l of letters) {
        if (letterMatches >= 10) break;
        const textEn = typeof l.text === 'string' ? l.text : (l.text && l.text.English ? l.text.English : (l.text && l.text.Marathi ? l.text.Marathi : ''));
        const text = `${l.title || ''} ${l.from || ''} ${l.to || ''} ${l.date || ''} ${l.summary || ''} ${textEn}`.toLowerCase();
        if (text.includes(qLower)) {
          results.push({
            id: l.id || `let-${letterMatches}`,
            type: 'Letter',
            title: l.title || `Letter to ${l.to || 'Unknown'}`,
            subtitle: `${l.date || ''} · From: ${l.from || 'Dr. B. R. Ambedkar'}`,
            excerpt: (typeof l.summary === 'string' ? l.summary : textEn).slice(0, 160) + '…',
            link: `letters.html?search=${encodeURIComponent(query)}`,
            score: 0.88
          });
          letterMatches++;
        }
      }
    }

    // 5. Search Vows
    if (filterType === 'all' || filterType === 'vows') {
      const vowsData = loadJsonData('../data/vows.json');
      const vowsList = Array.isArray(vowsData) ? vowsData : (vowsData.vows || []);
      vowsList.forEach((v, idx) => {
        const text = `${v.en || v.textEn || ''} ${v.hi || v.textHi || ''} ${v.mr || v.textMr || ''}`.toLowerCase();
        if (text.includes(qLower)) {
          results.push({
            id: `vow-${idx + 1}`,
            type: '22 Vows',
            title: `Vow #${v.number || (idx + 1)}`,
            excerpt: v.en || v.textEn || '',
            link: `vows.html#vow-${v.number || (idx + 1)}`,
            score: 0.89
          });
        }
      });
    }

    // Sort by score descending
    results.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Enrich with Hybrid Search Semantic Intelligence
    const hybridSearchService = require('../services/hybridSearchService');
    const hybridMatches = hybridSearchService.searchHybrid(query, { type: filterType, volume: targetVol, limit: 15 });

    // Merge hybrid findings that may not have matched raw substring
    hybridMatches.forEach(hm => {
      if (!results.some(r => r.id === hm.id || r.title === hm.title)) {
        results.push({
          id: hm.id,
          type: hm.type,
          title: hm.title,
          volumeNo: hm.volumeNo,
          year: hm.year,
          category: hm.category,
          source: hm.source,
          excerpt: hm.snippet.replace(/<\/?mark>/g, ''),
          link: hm.link,
          score: hm.score,
          matchType: hm.matchType
        });
      }
    });

    // Re-sort after hybrid inclusion
    results.sort((a, b) => (b.score || 0) - (a.score || 0));

    try {
      const adminService = require('../services/adminService');
      adminService.recordSearchTelemetry({
        query,
        resultsCount: results.length,
        filterType,
        language: req.query.lang || 'en',
        searchMode: 'hybrid',
      });
    } catch (_) {}

    res.json({
      success: true,
      count: results.length,
      searchMode: 'hybrid',
      data: {
        results: results.slice(0, 30),
        facets: {
          total: results.length,
          volumes: results.filter(r => String(r.type).includes('Volume')).length,
          memorials: results.filter(r => r.type === 'Memorial').length,
          debates: results.filter(r => r.type === 'Historical Debate' || r.type === 'Debate').length,
          letters: results.filter(r => r.type === 'Letter').length,
          vows: results.filter(r => r.type === '22 Vows').length
        }
      }
    });
  } catch (err) {
    next(err);
  }
});
module.exports = router;

