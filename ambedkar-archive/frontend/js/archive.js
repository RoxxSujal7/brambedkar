/**
 * archive.js — Comprehensive 60-Volume Archival Catalog Controller
 * Handles live multi-collection filtering (English BAWS & Hindi BAWS),
 * instant debounced search, responsive pagination, and local PDF downloads.
 */

let allLoadedDocs = [];
let currentEdition = 'all'; // 'all', 'english', 'hindi'
let currentCategory = 'all';
let currentTopic = 'all';
let currentSearch = '';
let currentPage = 1;
const itemsPerPage = 18;
let searchDebounce = null;
let userProgressCache = {};

const TOPIC_KEYWORDS = {
  caste: ['caste', 'untouchab', 'shudra', 'dalit', 'अस्पृश्य', 'जाति', 'social justice', 'वर्ण', 'annihilation', 'poona pact', 'mahad', 'चवदार', 'महाड', 'पूना पैक्ट', 'बहिष्कृत', 'सत्याग्रह'],
  constitution: ['constitution', 'fundamental rights', 'parliament', 'states and minorities', 'assembly', 'संविधान', 'विधान', 'अधिकार', 'कानून', 'विधि', 'debates', 'drafting', 'architect of the constitution', 'drafting committee', 'विधिक', 'संसदीय', 'धारा', 'अनुच्छेद'],
  economics: ['rupee', 'finance', 'economics', 'provincial', 'rbi', 'currency', 'मुद्रा', 'वित्त', 'रुपये', 'अर्थशास्त्र', 'gold standard', 'commerce', 'वाणिज्य', 'व्यापारिक', 'आर्थिक', 'राजस्व'],
  buddhism: ['buddha', 'dhamma', 'buddhism', 'religion', 'philosophy', 'बुद्ध', 'धम्म', 'धर्म', 'दर्शन', 'navayana', 'morality', 'conversion', 'pali', 'पालि', 'दीक्षा', 'नागपुर', 'त्रिपिटक'],
  women: ['women', 'hindu code', 'marriage', 'divorce', 'inheritance', 'स्त्री', 'महिला', 'कोड बिल', 'विवाह', 'gender', 'नारी', 'मातृ', 'उत्तराधिकार'],
  labour: ['labour', 'damodar', 'hirakud', 'water', 'executive council', 'workers', 'मजदूर', 'श्रम', 'जल', 'welfare', 'कर्मकार', 'सिंचाई', 'कार्यकारी परिषद'],
  journalism: ['mooknayak', 'bahishkrit', 'janata', 'prabuddha', 'periodical', 'editorial', 'मूकनायक', 'बहिष्कृत', 'जनता', 'प्रबुद्ध', 'पत्रकारिता', 'संपादकीय', 'प्रेस', 'वृत्तपत्र']
};

// Complete static client-side catalog of 60 Volumes (20 English + 40 Hindi)
// Guarantees zero downtime even if the backend is initializing
const CLIENT_BAWS_CATALOG = [
  // ── ENGLISH VOLUMES (1–21) ──────────────────────────────────
  {
    _id: 'doc-en-1',
    volumeNo: 1,
    title: 'Castes in India, Annihilation of Caste, and Other Essays',
    titleHi: 'डॉ. आंबेडकर वाङ्मय - खंड १: भारत में जातियाँ, जाति का विनाश',
    category: 'book',
    edition: 'English BAWS',
    year: 1979,
    localPdf: '/pdfs/Volume1.pdf',
    summary: 'Contains Castes in India, Annihilation of Caste, Maharashtra as a Linguistic Province, States and Minorities, Ranade Gandhi and Jinnah, and Communal Deadlock.',
    tags: ['Caste System', 'Annihilation of Caste', 'Social Democracy', 'Constitutional Law'],
    isFeatured: true
  },
  {
    _id: 'doc-en-2',
    volumeNo: 2,
    title: 'Dr. Ambedkar in Bombay Legislature, Simon Commission & Round Table Conferences',
    titleHi: 'बॉम्बे विधान परिषद, साइमन कमीशन और गोलमेज सम्मेलन (१९२७-१९३९)',
    category: 'speech',
    edition: 'English BAWS',
    year: 1982,
    localPdf: '/pdfs/Volume2.pdf',
    summary: 'Proceedings of Dr. Ambedkar in Bombay Legislative Council (1927-1939), evidence before Simon Commission, and historic speeches at the 3 London Round Table Conferences.',
    tags: ['Round Table Conference', 'Bombay Legislature', 'Simon Commission'],
    isFeatured: true
  },
  {
    _id: 'doc-en-3',
    volumeNo: 3,
    title: 'Philosophy of Hinduism, Revolution & Counter-Revolution in Ancient India, Buddha or Karl Marx',
    titleHi: 'हिंदू धर्म का दर्शन, प्राचीन भारत में क्रांति और प्रति-क्रांति, बुद्ध या कार्ल मार्क्स',
    category: 'manuscript',
    edition: 'English BAWS',
    year: 1987,
    localPdf: '/pdfs/Volume3.pdf',
    summary: 'Philosophical essays dissecting moral foundations of Hinduism, ancient Indian social upheavals, and comparative study between Buddhist philosophy and Marxism.',
    tags: ['Philosophy', 'Buddha or Karl Marx', 'Ancient History'],
    isFeatured: true
  },
  {
    _id: 'doc-en-4',
    volumeNo: 4,
    title: 'Riddles in Hinduism: An Exposition to Enlighten the Masses',
    titleHi: 'हिंदू धर्म की पहेलियाँ',
    category: 'manuscript',
    edition: 'English BAWS',
    year: 1987,
    localPdf: '/pdfs/Volume4.pdf',
    summary: 'Critical investigation of contradictions and theological enigmas embedded within Vedic literature, Smritis, and epics.',
    tags: ['Riddles in Hinduism', 'Vedas', 'Philosophy'],
    isFeatured: false
  },
  {
    _id: 'doc-en-5',
    volumeNo: 5,
    title: 'Essays on Untouchables and Untouchability: Social, Political, Religious',
    titleHi: 'अस्पृश्य और अस्पृश्यता पर निबंध',
    category: 'book',
    edition: 'English BAWS',
    year: 1989,
    localPdf: '/pdfs/Volume5.pdf',
    summary: 'Exhaustive examination of human rights violations, origin of untouchability, and struggle for social emancipation in India.',
    tags: ['Untouchability', 'Human Rights', 'Social Justice'],
    isFeatured: false
  },
  {
    _id: 'doc-en-6',
    volumeNo: 6,
    title: 'Babasaheb’s Writings on Economics: Provincial Finance & Problem of the Rupee',
    titleHi: 'ब्रिटिश भारत में प्रांतीय वित्त का अभ्युदय एवं रुपये की समस्या',
    category: 'book',
    edition: 'English BAWS',
    year: 1989,
    localPdf: '/pdfs/Volume6.pdf',
    summary: 'Dr. Ambedkar’s seminal doctoral dissertations from Columbia University and the London School of Economics on currency and fiscal federalism.',
    tags: ['Economics', 'Problem of the Rupee', 'Fiscal Policy'],
    isFeatured: true
  },
  {
    _id: 'doc-en-7',
    volumeNo: 7,
    title: 'Who Were the Shudras? & The Untouchables',
    titleHi: 'शूद्र कौन थे? और अछूत: वे कौन थे और वे अछूत क्यों बने?',
    category: 'book',
    edition: 'English BAWS',
    year: 1990,
    localPdf: '/pdfs/Volume7.pdf',
    summary: 'Historical inquiry establishing Shudras as fallen Kshatriyas and tracing the historical emergence of untouchability around 400 CE.',
    tags: ['Who Were the Shudras', 'Ancient History', 'Caste Origin'],
    isFeatured: true
  },
  {
    _id: 'doc-en-8',
    volumeNo: 8,
    title: 'Pakistan or the Partition of India',
    titleHi: 'पाकिस्तान अथवा भारत का विभाजन',
    category: 'book',
    edition: 'English BAWS',
    year: 1990,
    localPdf: '/pdfs/Volume8.pdf',
    summary: 'Rigorous strategic, political, and demographic assessment of the Muslim League demand for Pakistan prior to 1947.',
    tags: ['Partition of India', 'Politics', 'Geopolitics'],
    isFeatured: false
  },
  {
    _id: 'doc-en-9',
    volumeNo: 9,
    title: 'What Congress and Gandhi Have Done to the Untouchables & Mr. Gandhi and the Emancipation',
    titleHi: 'कांग्रेस और गांधी ने अछूतों के लिए क्या किया?',
    category: 'book',
    edition: 'English BAWS',
    year: 1991,
    localPdf: '/pdfs/Volume9.pdf',
    summary: 'Detailed critique of the Poona Pact (1932), separate electorates, and differences between Ambedkar and Gandhi on social emancipation.',
    tags: ['Poona Pact', 'Gandhi and Ambedkar', 'Electoral Safeguards'],
    isFeatured: true
  },
  {
    _id: 'doc-en-10',
    volumeNo: 10,
    title: 'Dr. Ambedkar as Member of the Governor General’s Executive Council (1942–46)',
    titleHi: 'वायसराय की कार्यकारी परिषद के सदस्य (१९४२-४६)',
    category: 'report',
    edition: 'English BAWS',
    year: 1991,
    localPdf: '/pdfs/Volume10.pdf',
    summary: 'Speeches and policy papers on labour rights, coal mining, Central Waterways Commission, and the 8-hour workday.',
    tags: ['Labour Ministry', 'Damodar Valley', 'Workers Rights'],
    isFeatured: false
  },
  {
    _id: 'doc-en-11',
    volumeNo: 11,
    title: 'The Buddha and His Dhamma',
    titleHi: 'भगवान बुद्ध और उनका धम्म',
    category: 'book',
    edition: 'English BAWS',
    year: 1992,
    localPdf: '/pdfs/Volume11.pdf',
    summary: 'Master treatise on Buddha’s life, gospel, and the rational, ethical philosophy of Navayana Buddhism.',
    tags: ['Buddha and His Dhamma', 'Buddhism', 'Navayana', 'Morality'],
    isFeatured: true
  },
  {
    _id: 'doc-en-12',
    volumeNo: 12,
    title: 'Ancient Indian Commerce & Commercial Relations with the Middle East',
    titleHi: 'प्राचीन भारतीय वाणिज्य और व्यापारिक संबंध',
    category: 'book',
    edition: 'English BAWS',
    year: 1993,
    localPdf: '/pdfs/Volume12.pdf',
    summary: 'Historical and economic investigation of early Indian sea routes, currency, and international trade networks.',
    tags: ['Ancient Commerce', 'Economic History'],
    isFeatured: false
  },
  {
    _id: 'doc-en-13',
    volumeNo: 13,
    title: 'Dr. Ambedkar: The Principal Architect of the Constitution of India',
    titleHi: 'भारतीय संविधान के मुख्य शिल्पी: संविधान सभा के वाद-विवाद',
    category: 'debate',
    edition: 'English BAWS',
    year: 1994,
    localPdf: '/pdfs/Volume13.pdf',
    summary: 'Debates and clause-by-clause defense of the Draft Constitution in the Constituent Assembly from 1947 to 1949.',
    tags: ['Constitution of India', 'Drafting Committee', 'Fundamental Rights'],
    isFeatured: true
  },
  {
    _id: 'doc-en-14',
    volumeNo: 14,
    title: 'Dr. Ambedkar and the Hindu Code Bill (Part I & II)',
    titleHi: 'हिंदू कोड बिल और महिला अधिकार (भाग १ एवं २)',
    category: 'debate',
    edition: 'English BAWS',
    year: 1995,
    localPdf: '/pdfs/Volume14_Part_I.pdf',
    summary: 'Parliamentary debates on women’s rights, marriage, divorce, and inheritance reform leading to his resignation as Law Minister.',
    tags: ['Hindu Code Bill', 'Women Rights', 'Law Minister'],
    isFeatured: true
  },
  {
    _id: 'doc-en-15',
    volumeNo: 15,
    title: 'Dr. Ambedkar in the Constituent Assembly and Parliament (1947–1956)',
    titleHi: 'संविधान सभा और संसद में भाषण (१९४७-१९५६)',
    category: 'debate',
    edition: 'English BAWS',
    year: 1997,
    localPdf: '/pdfs/Volume15.pdf',
    summary: 'Parliamentary speeches on foreign policy, representation of minorities, and constitutional amendments.',
    tags: ['Parliament Debates', 'Foreign Policy'],
    isFeatured: false
  },
  {
    _id: 'doc-en-16',
    volumeNo: 16,
    title: 'Dr. B. R. Ambedkar’s Pali Grammar and Dictionary',
    titleHi: 'पालि व्याकरण एवं शब्दकोश',
    category: 'manuscript',
    edition: 'English BAWS',
    year: 1998,
    localPdf: '/pdfs/Volume16.pdf',
    summary: 'Grammatical treatise and dictionary compiled for scholars and practitioners studying Tipitaka canonical texts.',
    tags: ['Pali Language', 'Linguistics', 'Grammar'],
    isFeatured: false
  },
  {
    _id: 'doc-en-17',
    volumeNo: 17,
    title: 'Dr. B. R. Ambedkar and His Egalitarian Revolution (Part I, II, III)',
    titleHi: 'डॉ. आंबेडकर और उनकी समतावादी क्रांति',
    category: 'speech',
    edition: 'English BAWS',
    year: 2003,
    localPdf: '/pdfs/Volume17_Part_I.pdf',
    summary: 'Three-part collection of Ambedkar’s public speeches, personal memoirs, and organizational addresses across India.',
    tags: ['Egalitarian Revolution', 'Speeches', 'Movement'],
    isFeatured: true
  },
  {
    _id: 'doc-en-18',
    volumeNo: 18,
    title: 'Dr. Ambedkar on Linguistic States and Reorganization of Indian States',
    titleHi: 'भाषायी राज्य और भारतीय राज्यों का पुनर्गठन',
    category: 'book',
    edition: 'English BAWS',
    year: 2005,
    localPdf: '/pdfs/Volume18.pdf',
    summary: 'Proposals on the division of large states, federal stability, and linguistic reorganization submitted to the States Reorganisation Commission.',
    tags: ['Linguistic States', 'State Reorganization'],
    isFeatured: false
  },
  {
    _id: 'doc-en-19',
    volumeNo: 19,
    title: 'Dr. Babasaheb Ambedkar’s Journalism: Mooknayak & Bahishkrit Bharat',
    titleHi: 'पत्रकारिता: मूकनायक (१९२०) एवं बहिष्कृत भारत (१९२७-२९)',
    category: 'periodical',
    edition: 'English BAWS',
    year: 2008,
    localPdf: '/pdfs/Volume19.pdf',
    summary: 'Historic editorials that ignited the Dalit rights movement, challenging colonial and orthodox hegemony.',
    tags: ['Mooknayak', 'Bahishkrit Bharat', 'Journalism'],
    isFeatured: true
  },
  {
    _id: 'doc-en-20',
    volumeNo: 20,
    title: 'Dr. Babasaheb Ambedkar’s Journalism: Janata & Prabuddha Bharat',
    titleHi: 'पत्रकारिता: जनता (१९३०-५६) एवं प्रबुद्ध भारत (१९५६)',
    category: 'periodical',
    edition: 'English BAWS',
    year: 2010,
    localPdf: '/pdfs/Volume20.pdf',
    summary: 'Editorials spanning the Round Table conferences, the Mahad Satyagraha, and the historic conversion to Buddhism at Nagpur.',
    tags: ['Janata', 'Prabuddha Bharat', 'Journalism'],
    isFeatured: false
  },
  {
    _id: 'doc-en-21',
    volumeNo: 21,
    title: 'Dr. B. R. Ambedkar’s Official Correspondence & Letters (1913–1956)',
    titleHi: 'पत्राचार एवं आधिकारिक पत्र (१९१३-१९५६)',
    category: 'manuscript',
    edition: 'English BAWS',
    year: 2014,
    localPdf: '/pdfs/Volume21.pdf',
    summary: 'Personal and official correspondence of Dr. Ambedkar with Mahatma Gandhi, Jawaharlal Nehru, and international universities.',
    tags: ['Correspondence', 'Letters', 'History'],
    isFeatured: true
  },

  // ── HINDI VOLUMES (1–40) ───────────────────────────────────
  ...Array.from({ length: 40 }, (_, idx) => {
    const vNo = idx + 1;
    const specialHindiTitles = {
      1: { title: 'Dr. Ambedkar Vangmay Vol. 1: Castes in India & Annihilation of Caste', titleHi: 'डॉ. आंबेडकर वाङ्मय - खंड १: भारत में जातियाँ, जाति का विनाश', cat: 'book' },
      2: { title: 'Dr. Ambedkar Vangmay Vol. 2: Bombay Legislature & Round Table', titleHi: 'डॉ. आंबेडकर वाङ्मय - खंड २: बॉम्बे विधान परिषद, साइमन कमीशन और गोलमेज सम्मेलन', cat: 'speech' },
      3: { title: 'Dr. Ambedkar Vangmay Vol. 3: Philosophy of Hinduism, Buddha or Marx', titleHi: 'डॉ. आंबेडकर वाङ्मय - खंड ३: हिंदू धर्म का दर्शन, क्रांति और प्रति-क्रांति', cat: 'manuscript' },
      4: { title: 'Dr. Ambedkar Vangmay Vol. 4: Riddles in Hinduism', titleHi: 'डॉ. आंबेडकर वाङ्मय - खंड ४: हिंदू धर्म की पहेलियाँ', cat: 'manuscript' },
      5: { title: 'Dr. Ambedkar Vangmay Vol. 5: Untouchables and India\'s Ghetto', titleHi: 'डॉ. आंबेडकर वाङ्मय - खंड ५: अछूत अथवा भारत के बहिष्कृत', cat: 'book' },
      6: { title: 'Dr. Ambedkar Vangmay Vol. 6: Provincial Finance & Problem of Rupee', titleHi: 'डॉ. आंबेडकर वाङ्मय - खंड ६: ब्रिटिश भारत में प्रांतीय वित्त एवं रुपये की समस्या', cat: 'book' },
      7: { title: 'Dr. Ambedkar Vangmay Vol. 7: Who Were the Shudras? & Untouchables', titleHi: 'डॉ. आंबेडकर वाङ्मय - खंड ७: शूद्र कौन थे? और अछूत: वे कौन थे?', cat: 'book' },
      8: { title: 'Dr. Ambedkar Vangmay Vol. 8: Pakistan or the Partition of India', titleHi: 'डॉ. आंबेडकर वाङ्मय - खंड ८: पाकिस्तान अथवा भारत का विभाजन', cat: 'book' },
      9: { title: 'Dr. Ambedkar Vangmay Vol. 9: What Congress & Gandhi Did to Untouchables', titleHi: 'डॉ. आंबेडकर वाङ्मय - खंड ९: कांग्रेस और गांधी ने अछूतों के लिए क्या किया?', cat: 'book' },
      10: { title: 'Dr. Ambedkar Vangmay Vol. 10: Executive Council (1942–46)', titleHi: 'डॉ. आंबेडकर वाङ्मय - खंड १०: वायसराय की कार्यकारी परिषद (१९४२-४६)', cat: 'report' },
      11: { title: 'Dr. Ambedkar Vangmay Vol. 11: The Buddha and His Dhamma', titleHi: 'डॉ. आंबेडकर वाङ्मय - खंड ११: भगवान बुद्ध और उनका धम्म', cat: 'book' },
      12: { title: 'Dr. Ambedkar Vangmay Vol. 12: Ancient Indian Commerce', titleHi: 'डॉ. आंबेडकर वाङ्मय - खंड १२: प्राचीन भारतीय वाणिज्य और व्यापारिक संबंध', cat: 'book' },
      13: { title: 'Dr. Ambedkar Vangmay Vol. 13: Chief Architect of the Constitution', titleHi: 'डॉ. आंबेडकर वाङ्मय - खंड १३: भारतीय संविधान के मुख्य शिल्पी', cat: 'debate' },
      14: { title: 'Dr. Ambedkar Vangmay Vol. 14: The Hindu Code Bill', titleHi: 'डॉ. आंबेडकर वाङ्मय - खंड १४: हिंदू कोड बिल और महिला अधिकार', cat: 'debate' },
      15: { title: 'Dr. Ambedkar Vangmay Vol. 15: Constituent Assembly Debates', titleHi: 'डॉ. आंबेडकर वाङ्मय - खंड १५: संविधान सभा में वाद-विवाद', cat: 'debate' },
      16: { title: 'Dr. Ambedkar Vangmay Vol. 16: Pali Grammar & Dictionary', titleHi: 'डॉ. आंबेडकर वाङ्मय - खंड १६: पालि व्याकरण एवं शब्दकोश', cat: 'manuscript' },
      17: { title: 'Dr. Ambedkar Vangmay Vol. 17: Speeches & Interviews', titleHi: 'डॉ. आंबेडकर वाङ्मय - खंड १७: भाषण, साक्षात्कार और ऐतिहासिक टिप्पणियाँ', cat: 'speech' },
      18: { title: 'Dr. Ambedkar Vangmay Vol. 18: Maharashtra Linguistic Province', titleHi: 'डॉ. आंबेडकर वाङ्मय - खंड १८: भाषायी राज्य के रूप में महाराष्ट्र', cat: 'book' },
      19: { title: 'Dr. Ambedkar Vangmay Vol. 19: Journalism: Mooknayak & Bahishkrit Bharat', titleHi: 'डॉ. आंबेडकर वाङ्मय - खंड १९: पत्रकारिता: मूकनायक एवं बहिष्कृत भारत', cat: 'periodical' },
      20: { title: 'Dr. Ambedkar Vangmay Vol. 20: Journalism: Janata & Prabuddha Bharat', titleHi: 'डॉ. आंबेडकर वाङ्मय - खंड २०: पत्रकारिता: जनता एवं प्रबुद्ध भारत', cat: 'periodical' }
    };

    const info = specialHindiTitles[vNo] || {
      title: `Dr. Ambedkar Vangmay Vol. ${vNo}: Collected Papers (Part ${vNo})`,
      titleHi: `डॉ. आंबेडकर वाङ्मय - खंड ${vNo}: संकलित अभिलेख, भाषण एवं दस्तावेज`,
      cat: vNo % 3 === 0 ? 'debate' : vNo % 2 === 0 ? 'speech' : 'manuscript'
    };

    return {
      _id: `doc-hi-${vNo}`,
      volumeNo: vNo,
      title: info.title,
      titleHi: info.titleHi,
      category: info.cat,
      edition: 'Hindi BAWS',
      year: 1980 + Math.floor(vNo / 2),
      localPdf: `/pdfs/VolumeH${vNo}.pdf`,
      summary: `डॉ. बाबासाहेब आंबेडकर के विविध सामाजिक, राजनीतिक, विधिक एवं आर्थिक लेखों, भाषणों और दस्तावेजों का आधिकारिक हिंदी खंड ${vNo}।`,
      tags: [`वाङ्मय खंड ${vNo}`, 'हिंदी संकलन', 'MEA आधिकारिक'],
      isFeatured: vNo <= 3 || vNo === 11 || vNo === 13 || vNo === 14
    };
  })
];

async function fetchUserProgress() {
  try {
    // Check localStorage first
    for (let i = 1; i <= 60; i++) {
      const stored = localStorage.getItem(`reader_progress_vol_${i}`) || localStorage.getItem(`reader_progress_doc-en-${i}`) || localStorage.getItem(`reader_progress_doc-hi-${i}`);
      if (stored) {
        userProgressCache[`vol-${i}`] = parseInt(stored, 10);
      }
    }
    // If logged in, fetch from API
    if (window.AppState && window.AppState.isLoggedIn && window.AppState.isLoggedIn()) {
      const res = await window.api.progress.getAll();
      if (res && res.progress) {
        res.progress.forEach(p => {
          if (p.documentId) {
            userProgressCache[p.documentId._id || p.documentId] = Math.round(p.percentComplete || 0);
          }
        });
      }
    }
  } catch (err) {
    // Ignore offline/unauthenticated error
  }
}

function renderDocCard(doc) {
  const lang = (window.AppState && typeof window.AppState.getCurrentLang === 'function') ? window.AppState.getCurrentLang() : (localStorage.getItem('lang') || 'en');
  const preferIndic = lang === 'hi' || lang === 'mr' || doc.edition === 'Hindi BAWS';
  const displayTitle = preferIndic ? (doc.titleHi || doc.title) : doc.title;
  const subTitle = preferIndic ? (doc.titleHi ? doc.title : '') : (doc.titleHi || '');
  const volumePill = preferIndic ? `खंड ${doc.volumeNo}` : `BAWS Vol. ${doc.volumeNo}`;
  const vNumStr = String(doc.volumeNo).padStart(2, '0');
  let pdfUrl = doc.edition === 'English BAWS'
    ? `/books/Volume_${vNumStr}.pdf`
    : (doc.localPdf || `/pdfs/Volume${doc.volumeNo}.pdf`);
  if (doc.volumeNo === 14 && doc.edition === 'English BAWS') pdfUrl = '/books/Volume_14_01.pdf';
  if (doc.volumeNo === 17 && doc.edition === 'English BAWS') pdfUrl = '/books/Volume_17_01.pdf';
  const readLabel = lang === 'hi' ? 'खंड पढ़ें' : lang === 'mr' ? 'खंड वाचा' : 'Read Online';

  // Check progress
  const progressPct = userProgressCache[doc._id] || userProgressCache[`vol-${doc.volumeNo}`] || 0;

  return `
    <article class="card animate-fade-up">
      <div class="card-inner">
        <!-- Top Card Header -->
        <div style="padding:var(--space-4) var(--space-5);background:rgba(255,255,255,0.03);border-bottom:1px solid var(--border);">
          <div class="flex-between items-center" style="margin-bottom:var(--space-2);gap:var(--space-2);flex-wrap:wrap;">
            <div class="flex gap-2 items-center">
              <span class="badge badge-gold">${volumePill}</span>
              <span class="badge badge-${doc.category}">${doc.category}</span>
              ${doc.year ? `<span class="badge" style="background:rgba(255,255,255,0.04);border:1px solid var(--border);">${doc.year}</span>` : ''}
            </div>
            <span class="badge badge-local" title="Stored directly on local server">⚡ Local PDF</span>
          </div>

          <h2 style="font-size:1.02rem;font-weight:700;margin-bottom:3px;color:var(--text);line-height:1.35;font-family:var(--font-display);">
            ${displayTitle}
          </h2>

          ${subTitle ? `<p style="font-size:0.78rem;color:var(--gold-light);line-height:1.3;font-weight:500;">${subTitle}</p>` : ''}
        </div>

        <!-- Card Body -->
        <div class="card-body" style="flex:1;display:flex;flex-direction:column;justify-content:space-between;">
          <p style="font-size:0.85rem;line-height:1.65;margin-bottom:var(--space-4);color:var(--text-muted);">
            ${doc.summary}
          </p>

          <div>
            ${progressPct > 0 ? `
              <div style="margin-bottom:var(--space-3);background:rgba(212,175,55,0.04);padding:6px 10px;border-radius:var(--radius-md);border:1px solid rgba(212,175,55,0.15);">
                <div class="flex-between items-center" style="font-size:0.68rem;font-family:var(--font-mono);margin-bottom:3px;">
                  <span style="color:var(--gold-light);">Reading Progress</span>
                  <span style="color:var(--gold);font-weight:600;">${progressPct}%</span>
                </div>
                <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:var(--radius-full);overflow:hidden;">
                  <div style="height:100%;width:${progressPct}%;background:linear-gradient(90deg, var(--gold), var(--gold-light));border-radius:var(--radius-full);"></div>
                </div>
              </div>
            ` : ''}

            <div class="flex gap-2 items-center flex-wrap" style="margin-bottom:var(--space-4);">
              ${(doc.tags || []).slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('')}
            </div>

            <div class="flex gap-2 items-center">
              <a href="reader.html?id=${doc._id}" class="btn btn-primary btn-sm" style="flex:1;">
                <span>${readLabel}</span>
                <span class="btn-icon-bubble">📖</span>
              </a>
              <button type="button" class="btn btn-secondary btn-sm btn-cite" data-id="${doc._id}" title="Generate Citation (APA, MLA, Chicago, BibTeX)" style="padding:6px 12px;font-size:0.8rem;">
                🖋️ Cite
              </button>
              <a href="${pdfUrl}" download class="btn btn-secondary btn-sm" title="Download Local Official PDF" style="padding:6px 12px;">
                📥
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

async function loadDocuments(reset = false) {
  if (reset) {
    currentPage = 1;
    allLoadedDocs = [];
  }

  const grid = document.getElementById('docs-grid');
  const meta = document.getElementById('results-meta');
  const loadMoreBtn = document.getElementById('load-more-btn');

  if (reset) {
    grid.innerHTML = `
      <div class="card" style="height:260px;"><div class="skeleton" style="height:100%;"></div></div>
      <div class="card" style="height:260px;"><div class="skeleton" style="height:100%;"></div></div>
      <div class="card" style="height:260px;"><div class="skeleton" style="height:100%;"></div></div>
      <div class="card" style="height:260px;"><div class="skeleton" style="height:100%;"></div></div>
      <div class="card" style="height:260px;"><div class="skeleton" style="height:100%;"></div></div>
      <div class="card" style="height:260px;"><div class="skeleton" style="height:100%;"></div></div>
    `;
  }

  // Filter the full client dataset
  let filtered = [...CLIENT_BAWS_CATALOG];

  // 1. Edition filter
  if (currentEdition === 'english') {
    filtered = filtered.filter(d => d.edition === 'English BAWS');
  } else if (currentEdition === 'hindi') {
    filtered = filtered.filter(d => d.edition === 'Hindi BAWS');
  }

  // 2. Category filter
  if (currentCategory !== 'all') {
    filtered = filtered.filter(d => d.category.toLowerCase() === currentCategory.toLowerCase());
  }

  // 3. Thematic Topic filter
  if (currentTopic !== 'all' && TOPIC_KEYWORDS[currentTopic]) {
    const kws = TOPIC_KEYWORDS[currentTopic];
    filtered = filtered.filter(d => {
      const txt = `${d.title || ''} ${d.titleHi || ''} ${d.summary || ''} ${(d.tags || []).join(' ')}`.toLowerCase();
      return kws.some(kw => txt.includes(kw));
    });
  }

  // 4. Search query filter
  if (currentSearch.trim().length > 0) {
    const q = currentSearch.toLowerCase();
    filtered = filtered.filter(d => {
      const matchTitle = (d.title && d.title.toLowerCase().includes(q));
      const matchTitleHi = (d.titleHi && d.titleHi.toLowerCase().includes(q));
      const matchSummary = (d.summary && d.summary.toLowerCase().includes(q));
      const matchVol = `vol ${d.volumeNo}`.includes(q) || `volume ${d.volumeNo}`.includes(q) || `खंड ${d.volumeNo}`.includes(q);
      const matchTags = d.tags && d.tags.some(t => t.toLowerCase().includes(q));
      return matchTitle || matchTitleHi || matchSummary || matchVol || matchTags;
    });
  }

  // Update meta count
  const totalCount = filtered.length;
  meta.innerHTML = `Showing <strong>${Math.min(currentPage * itemsPerPage, totalCount)}</strong> of <strong>${totalCount}</strong> official volumes${currentSearch ? ` matching "<em>${currentSearch}</em>"` : ''}`;

  // Paginate
  const pagedItems = filtered.slice(0, currentPage * itemsPerPage);

  if (pagedItems.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;padding:var(--space-16) 0;text-align:center;">
        <span style="font-size:3.5rem;display:block;margin-bottom:var(--space-4);">🔍</span>
        <h3 style="font-size:1.4rem;margin-bottom:var(--space-2);color:var(--text);">No matching volumes found</h3>
        <p style="color:var(--text-muted);margin-bottom:var(--space-4);">Explore these core subjects or reset all filters:</p>
        <div class="flex gap-2 justify-center flex-wrap" style="margin-bottom:var(--space-6);">
          <button type="button" class="tag search-suggest-btn" data-query="caste" style="cursor:pointer;background:var(--surface-2);border:1px solid var(--border);padding:6px 14px;">🏷️ Caste</button>
          <button type="button" class="tag search-suggest-btn" data-query="constitution" style="cursor:pointer;background:var(--surface-2);border:1px solid var(--border);padding:6px 14px;">📜 Constitution</button>
          <button type="button" class="tag search-suggest-btn" data-query="buddhism" style="cursor:pointer;background:var(--surface-2);border:1px solid var(--border);padding:6px 14px;">☸️ Buddhism</button>
          <button type="button" class="tag search-suggest-btn" data-query="economics" style="cursor:pointer;background:var(--surface-2);border:1px solid var(--border);padding:6px 14px;">💰 Economics</button>
        </div>
        <button id="reset-filters-btn" class="btn btn-primary">Reset Filters</button>
      </div>
    `;
    const resetBtn = document.getElementById('reset-filters-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        document.getElementById('search-input').value = '';
        currentSearch = '';
        currentEdition = 'all';
        currentCategory = 'all';
        currentTopic = 'all';
        syncUIFilters();
        loadDocuments(true);
      });
    }
    grid.querySelectorAll('.search-suggest-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const q = btn.dataset.query;
        const input = document.getElementById('search-input');
        if (input) input.value = q;
        currentSearch = q;
        currentTopic = 'all';
        currentCategory = 'all';
        syncUIFilters();
        loadDocuments(true);
      });
    });
    loadMoreBtn.style.display = 'none';
    return;
  }

  // Render cards
  grid.innerHTML = pagedItems.map(renderDocCard).join('');

  // Load more visibility
  if (currentPage * itemsPerPage < totalCount) {
    loadMoreBtn.style.display = 'inline-flex';
  } else {
    loadMoreBtn.style.display = 'none';
  }
}

function syncUIFilters() {
  // Edition tabs
  document.querySelectorAll('#edition-tabs .filter-tab').forEach(tab => {
    const isAct = tab.dataset.edition === currentEdition;
    tab.classList.toggle('active', isAct);
    tab.setAttribute('aria-selected', isAct ? 'true' : 'false');
  });

  // Category tabs
  document.querySelectorAll('#category-tabs .filter-tab').forEach(tab => {
    const isAct = tab.dataset.filter === currentCategory;
    tab.classList.toggle('active', isAct);
    tab.setAttribute('aria-selected', isAct ? 'true' : 'false');
  });

  // Topic tabs
  document.querySelectorAll('#topic-tabs .filter-tab').forEach(tab => {
    const isAct = tab.dataset.topic === currentTopic;
    tab.classList.toggle('active', isAct);
    tab.setAttribute('aria-selected', isAct ? 'true' : 'false');
  });

  // Update physical sliding pill position
  updateSlidingPills();
}

function updateSlidingPills() {
  // Clean up any stray sliders that could cover button text
  document.querySelectorAll('.tab-pill-slider').forEach(el => el.remove());
}

document.addEventListener('DOMContentLoaded', async () => {
  // Read URL params (e.g. ?edition=hindi or ?q=caste or ?topic=constitution or ?subtopic=caste)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('edition')) {
    const ed = urlParams.get('edition');
    if (['all', 'english', 'hindi'].includes(ed)) currentEdition = ed;
  }
  if (urlParams.has('topic') || urlParams.has('subtopic')) {
    const tp = urlParams.get('topic') || urlParams.get('subtopic');
    if (Object.keys(TOPIC_KEYWORDS).includes(tp) || tp === 'all') currentTopic = tp;
  }
  if (urlParams.has('category') || urlParams.has('genre')) {
    const cat = urlParams.get('category') || urlParams.get('genre');
    if (cat) currentCategory = cat;
  }
  if (urlParams.has('q') || urlParams.has('search')) {
    currentSearch = urlParams.get('q') || urlParams.get('search');
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = currentSearch;
  }
  syncUIFilters();

  // Search input with debounce
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchDebounce);
      currentSearch = searchInput.value.trim();
      searchDebounce = setTimeout(() => loadDocuments(true), 250);
    });
  }

  // Keyboard shortcut '/' to jump to search
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // Edition Tabs
  document.querySelectorAll('#edition-tabs .filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentEdition = tab.dataset.edition;
      syncUIFilters();
      loadDocuments(true);
    });
  });

  // Category Tabs
  document.querySelectorAll('#category-tabs .filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentCategory = tab.dataset.filter;
      syncUIFilters();
      loadDocuments(true);
    });
  });

  // Topic Tabs (Subtopic Selection)
  document.querySelectorAll('#topic-tabs .filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentTopic = tab.dataset.topic;
      // If a specific topic is selected and current genre yields 0, reset genre to 'all'
      if (currentTopic !== 'all' && currentCategory !== 'all') {
        currentCategory = 'all';
      }
      syncUIFilters();
      loadDocuments(true);
    });
  });

  // Load More Button
  const loadMoreBtn = document.getElementById('load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      currentPage++;
      loadDocuments(false);
    });
  }

  // In-Page Academic Citation Generator Modal
  function initCitationModal() {
    let modal = document.getElementById('cite-modal-backdrop');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'cite-modal-backdrop';
      modal.className = 'cmd-backdrop';
      modal.setAttribute('role', 'presentation');
      modal.innerHTML = `
        <div class="cmd-dialog card" role="dialog" aria-modal="true" aria-labelledby="cite-modal-title" style="max-width:620px;">
          <div class="cmd-inner card-inner" style="padding:var(--space-6);">
            <div class="flex-between items-center" style="margin-bottom:var(--space-4);border-bottom:1px solid var(--border);padding-bottom:var(--space-3);">
              <div class="flex gap-2 items-center">
                <span style="font-size:1.3rem;">🖋️</span>
                <h3 id="cite-modal-title" style="font-size:1.1rem;font-weight:700;color:var(--text);font-family:var(--font-display);margin:0;">
                  Academic Citation Generator
                </h3>
              </div>
              <button id="cite-modal-close" class="btn btn-ghost btn-sm" style="padding:4px 8px;" aria-label="Close citation modal">✕</button>
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

      const closeArchiveCite = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        modal.classList.remove('cmd-active');
      };

      const closeBtn = modal.querySelector('#cite-modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', closeArchiveCite);
        closeBtn.addEventListener('touchend', closeArchiveCite);
      }

      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeArchiveCite(e);
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('cmd-active')) {
          closeArchiveCite(e);
        }
      });
    }

    // Event delegation for .btn-cite clicks
    document.addEventListener('click', (e) => {
      const citeBtn = e.target.closest('.btn-cite');
      if (!citeBtn) return;
      const docId = citeBtn.getAttribute('data-id');
      const doc = CLIENT_BAWS_CATALOG.find(d => d._id === docId);
      if (!doc) return;

      const year = doc.year || 1989;
      const vol = doc.volumeNo;
      const title = doc.title;

      // 4 Citation Styles
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

      // Wire copy buttons
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

  // Fetch progress and do initial render
  initCitationModal();
  await fetchUserProgress();
  loadDocuments(true);
});
