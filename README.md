# 🏛️ Dr. B. R. Ambedkar Digital Heritage Archive
### *Museum-Grade Archival Engine · Grounded Scholarly AI · Cryptographic Preservation*

[![Framework: Express.js](https://img.shields.io/badge/FRAMEWORK-EXPRESS_4.18-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Runtime: Node.js](https://img.shields.io/badge/RUNTIME-NODE.JS_%3E%3D18-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Database: MongoDB](https://img.shields.io/badge/DATABASE-MONGODB_8.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Language: JavaScript ES6+](https://img.shields.io/badge/LANGUAGE-JAVASCRIPT_ES6%2B-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Styling: Vanilla CSS & Apple Tokens](https://img.shields.io/badge/STYLING-APPLE_DESIGN_SYSTEM-0071E3?style=for-the-badge&logo=apple&logoColor=white)](https://developer.apple.com/design/)
[![AI Engine: Google Gemini](https://img.shields.io/badge/AI_CORE-GOOGLE_GEMINI_1.5-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://aistudio.google.com/)
[![Voice: Web Speech STT/TTS](https://img.shields.io/badge/VOICE_ENGINE-SPEECH_STT%20%7C%20TTS-D4AF37?style=for-the-badge&logo=soundcharts&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
[![Security: Hardened & Verified](https://img.shields.io/badge/SECURITY-HELMET_CSP_%7C_BCRYPT-E11D48?style=for-the-badge&logo=securityscorecard&logoColor=white)](https://github.com/RoxxSujal7/brsih2026)
[![License: MIT](https://img.shields.io/badge/LICENSE-MIT-1E293B?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 📖 Overview

The **Dr. B. R. Ambedkar Digital Heritage Archive** is an open-source, institutional-grade digital preservation and research platform dedicated to the intellectual, philosophical, and constitutional legacy of **Bharat Ratna Dr. Bhimrao Ramji Ambedkar (1891–1956)**.

### The Problem
Dr. Ambedkar's voluminous corpus—spanning 60 official volumes of *Dr. Babasaheb Ambedkar: Writings and Speeches (BAWS)*, hundreds of historical correspondences, Parliamentary and Constituent Assembly debates, and liturgical manuscripts—is historically fragmented across dispersed publications, fragile paper editions, and inaccessible scans. Scholars, educators, and citizens often struggle to locate authentic citations, verify historical context, or cross-reference multilingual texts.

### The Solution
This platform centralizes, indexes, and semantically enriches this historic corpus through:
1. **High-Performance Full-Text & Semantic Search**: Instant discovery across 60 volumes, 361 letters, and legislative proceedings.
2. **Scholarly Grounded AI Assistant**: Natural language inquiry powered by Google Gemini 1.5 with deterministic fallback to in-memory TF-IDF vector retrieval, strictly constrained against hallucination with citation tracking.
3. **Hands-Free Multilingual Voice Engine**: Speech-to-Text (`en-IN`, `hi-IN`, `mr-IN`) and Text-to-Speech narration for universal accessibility.
4. **Cryptographic Bitstream Preservation**: PREMIS and Dublin Core ISO 15836-compliant SHA-256 digital fingerprinting to guarantee document integrity.
5. **Institutional Archival Workspaces**: Scholar annotations, cross-referencing, multi-standard citation exports (APA, MLA, Chicago, Harvard), and institutional role-based access control (RBAC).

---

## 🏛️ Architecture

The system is architected as a decoupled, multi-tier application designed for zero-latency client interactions, strict perimeter security, and resilient degradation when external services or databases are offline.

```text
User / Browser
   │
   ▼
Frontend Client (Zero-Framework PWA / Vanilla HTML5, CSS3, ES6+ JS)
   │  - Movable Floating Glass Dockbar (Apple Spring Physics)
   │  - Multilingual Web Speech STT / TTS Narration
   │  - Client-Side Tesseract.js Manuscript OCR
   │  - Responsive Mobile Sheets (390px Viewport Tested)
   │
   ▼
Perimeter Security & Gateway Tier
   │  - Helmet.js Content Security Policy (CSP) & Defensive Headers
   │  - Route-Specific Tiered Rate Limiting (express-rate-limit)
   │  - Input Sanitization & Express-Validator Guards
   │  - Stateless HS256 JWT Token Verification & RBAC Guards
   │
   ▼
Express.js Application Tier (Node.js 18+)
   │  - 16 High-Performance Modular REST Controllers
   │  - Grounded Gemini 1.5 AI Core + In-Memory TF-IDF Fallback
   │  - Multi-Channel OTP Dispatcher (Gmail SMTP / Resend / Telegram Bot)
   │  - PREMIS-Standard SHA-256 Cryptographic Bitstream Verifier
   │
   ▼
Persistence & Document Vault Tier
   ├── MongoDB 8.0 / Mongoose (Users, Notes, Bookmarks, Progress, Audit Logs)
   ├── In-Memory Map Fallback Store (Graceful offline/degraded operation)
   ├── Canonical JSON Archival Corpora (60 Volumes, 361 Letters, Debates)
   └── Static Document Vault (BAWS PDFs, Historic Audio & Imagery)
```

---

## 🌟 Key Features Breakdown

Features are strictly categorized according to their actual implementation state in the current repository:

### ✅ Implemented & Verified

- **60-Volume Complete Works Catalog**: Full catalog of *Writings and Speeches of Dr. B. R. Ambedkar* with volume metadata, dual English/Hindi records, and direct PDF streaming.
- **361 Historical Letters & Manuscripts**: Curated, searchable correspondence with dates, recipients, historical annotations, and primary source notes.
- **Constituent Assembly Debates (CAD)**: Comprehensive transcripts of Dr. Ambedkar's landmark legislative speeches, constitutional drafts, and Round Table Conference interventions.
- **22 Sacred Vows (Deekshabhoomi, 1956)**: Liturgical texts presented across 4 languages (English, Marathi, Hindi, Pali) with synchronized audio recitation.
- **Panchteerth National Memorials**: Interactive geographic and historical exploration of the 5 sacred sites associated with Dr. Ambedkar's life.
- **Grounded AI Research Assistant**: Interactive chat agent powered by Google Gemini 1.5, grounded in BAWS documents with source-cited responses, and guarded against prompt injection.
- **Offline TF-IDF Search Fallback**: Vector-space search engine capable of answering historical queries locally even without internet or API keys.
- **Multilingual Voice Engine**: Native hands-free speech recognition (STT) and synthesized speech readout (TTS) supporting English, Hindi, and Marathi.
- **Comparative Split-Screen Reader**: Side-by-side textual analysis tool allowing scholars to compare different volumes, speeches, or translations concurrently.
- **Client-Side Manuscript OCR**: In-browser OCR digitizer utilizing Tesseract.js to scan and extract editable text from primary document images.
- **Keyboard Command Palette (`Cmd/Ctrl + K` or `?`)**: Glassmorphism spotlight search modal for rapid keyboard-driven navigation across the entire archive.
- **Scholar Personal Workspace**: Persistent bookmarks, reading progress tracking, multi-volume reading lists, and automated citation generator (APA, MLA, Chicago, Harvard).
- **Institutional RBAC System**: Granular permission matrix enforcing role separation across `admin`, `archivist`, `content_editor`, `researcher`, `user`, and `visitor`.
- **Administrative CMS**: Content curation tools, document status tracking, and append-only cryptographic audit logging.
- **Multi-Channel Authentication**:
  - JWT HS256 stateless session management (7-day validity).
  - Google OAuth 2.0 GIS token verification via official Google public keys.
  - Email OTP delivery via Gmail SMTP (Nodemailer) or Resend API.
  - Telegram Bot OTP delivery via official Telegram Bot API ($0 cost, permanent availability).
  - Pre-hashed SHA-256 + 12-round Bcrypt password storage defeating the 72-byte truncation boundary.
  - In-memory fallback authentication store enabling continuous testing and operation when MongoDB is offline.
- **Cryptographic Preservation Engine**: Live SHA-256 manifest generator (`/api/preservation/manifest`) and bitstream verification endpoint (`/api/preservation/verify`) detecting data drift or bit rot.
- **Three Archival Atmospheres**: Obsidian Dark Slate, Tactile Ivory Paper, and Historical Sepia reading themes with WCAG 2.1 AAA contrast compliance.
- **Museum Kiosk & Exhibition Modes**: Specialized touch-screen museum kiosk interface and 16:9 ambient exhibition deck.

### 🟡 In Development

- **WhatsApp Cloud API OTP Delivery**: Meta WhatsApp Cloud API integration scaffolded and stubbed; pending production business account verification.
- **Automated Audio-Speech Alignment**: Real-time word-by-word karaoke synchronization for archival speech audio recordings.

### 🔮 Future Roadmap

- **Vector Database Integration**: Migration of the in-memory TF-IDF index to a production pgvector / Pinecone vector database for sub-10ms neural embeddings across millions of paragraphs.
- **Automated High-Resolution PDF Watermarking**: Dynamic institutional digital watermarking with scholar credentials for archival reproductions.
- **Decentralized Preservation Mirrors**: IPFS / Arweave immutable distributed archiving of BAWS PDFs.

---

## 💻 Technology Stack

| Layer | Technology | Version | Purpose & Architectural Rationale |
|---|---|:---:|---|
| **Backend Runtime** | **Node.js** | `>=18.0.0` | Asynchronous event-driven I/O engine |
| **API Framework** | **Express.js** | `4.18.2` | Robust, unopinionated routing engine |
| **Database** | **MongoDB / Mongoose** | `8.0.3` | Schema-driven document persistence with automated in-memory fallback |
| **Frontend Core** | **Vanilla HTML5 & ES6+** | Native | 0KB bundle penalty, instant Time-to-Interactive, long-term archival stability |
| **Design System** | **Vanilla CSS3** | Custom | Double-bezel enclosures, Apple spring physics, and fluid typography tokens |
| **AI Intelligence** | **Google Gemini 1.5 API** | v1 | Context-grounded historical research reasoning |
| **Local Search Engine**| **In-Memory TF-IDF** | Custom | Zero-dependency offline vector-space query fallback |
| **Voice Interface** | **Web Speech API** | Native | Browser-native SpeechRecognition (STT) and SpeechSynthesis (TTS) |
| **Optical Character Recognition** | **Tesseract.js** | `v5.0` | In-browser client-side optical character recognition |
| **Security Headers**| **Helmet.js** | `7.1.0` | Strict CSP, X-Frame-Options, HSTS, and Referrer-Policy |
| **Authentication** | **JWT & Bcryptjs** | `9.0.2` / `2.4.3` | HS256 signed bearer tokens + SHA-256/Bcrypt 12-round password hashing |
| **OAuth Integration**| **Google Auth Library** | `9.0.0` | Cryptographic GIS ID token verification against Google certificates |
| **Email Dispatch** | **Nodemailer / Resend** | `10.0.11` / `6.3.0` | Dual-provider OTP delivery (Gmail SMTP primary, Resend fallback) |
| **Smooth Motion** | **GSAP 3 & Lenis** | `3.12` / `1.1` | Hardware-accelerated scrollytelling and 60fps inertial scrolling |
| **Validation** | **Express-Validator** | `7.0.1` | Strict request parameter sanitization and payload assertion |

---

## 🛡️ Security Architecture

The platform enforces defense-in-depth across the entire application lifecycle:

- **Cryptographic Password Security**: Passwords undergo pre-hashing via SHA-256 before being salted and hashed with Bcrypt (12 rounds). This prevents the well-known 72-byte Bcrypt truncation vulnerability while ensuring high brute-force resistance.
- **Stateless Authentication & IDOR Protection**: User identity is encoded in cryptographically signed HS256 JWT tokens. All resource-mutating endpoints verify that requested entities strictly belong to the authenticated subject ID.
- **Institutional Role-Based Access Control (RBAC)**: All administrative, archival, and editor endpoints are protected by `requireRole()` middleware asserting permissions before execution.
- **Granular Content Security Policy (CSP)**: Strict Helmet policies prevent cross-site scripting (XSS), script injection, and clickjacking (`frame-ancestors: 'self'`).
- **Rate Limiting Perimeter**: Sensitive routes (authentication, OTP generation, password resets, and search) are throttled via route-specific `express-rate-limit` buckets to eliminate credential stuffing and API abuse.
- **Input Validation & Sanitization**: Every incoming request payload is inspected by `express-validator` rules, rejecting malformed emails, injection payloads, or unexpected schema keys.
- **Cryptographic Preservation Verification**: Publicly accessible SHA-256 bitstream manifest ensures researchers can independently confirm that archived digital records remain unaltered.
- **Zero Hardcoded Secrets**: All sensitive tokens, private keys, database URIs, and credentials are supplied strictly via environment variables.

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **MongoDB** *(Optional)*: Local daemon running at `mongodb://localhost:27017` or a MongoDB Atlas connection string. (If MongoDB is absent, the backend automatically activates its in-memory storage fallback for uninterrupted operation).

### 1. Clone the Repository
```bash
git clone https://github.com/RoxxSujal7/brsih2026.git
cd brsih2026
```

### 2. Install Dependencies
```bash
# Install workspace root dependencies and core application packages
npm install
```

### 3. Configure Environment Variables
```bash
# Copy the environment template
cp ambedkar-archive/.env.example ambedkar-archive/.env
```
Open `ambedkar-archive/.env` in your editor and configure the necessary parameters (refer to the Environment Variables section below).

### 4. Seed Archival Data (Optional)
```bash
# Populate initial volume catalogs, sample users, and metadata
npm run seed --prefix ambedkar-archive
```

### 5. Start the Development Server
```bash
# Run application with hot-reloading
npm run dev
```
> The application will be accessible at **`http://localhost:5000`**.

### 6. Run the Test Suites
```bash
# Run all verified institutional test suites
npm test
```

---

## 🔐 Environment Variables

Configure the following variable names in `ambedkar-archive/.env`. **Never commit secrets or actual credential values to source control.**

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/ambedkar-archive

# Authentication Secrets (Must be min 32 random characters in production)
JWT_SECRET=
JWT_EXPIRES_IN=7d

# Google OAuth2 (Google Identity Services)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Google Gemini AI API
GOOGLE_AI_API_KEY=

# CORS Whitelist
FRONTEND_URL=http://localhost:5000

# Email OTP Delivery (Option 1: Free Gmail SMTP)
GMAIL_USER=
GMAIL_APP_PASSWORD=

# Email OTP Delivery (Option 2: Resend API)
RESEND_API_KEY=
EMAIL_FROM=

# Telegram OTP Delivery (100% Free via @BotFather)
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=

# WhatsApp OTP Delivery (Optional / Meta Cloud API)
WHATSAPP_CLOUD_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_OTP_TEMPLATE_NAME=

# Safe Development Auth Mode (true = logs OTP codes to server console for testing)
DEV_AUTH_MODE=true
```

---

## 🧪 Testing & Verification

The codebase includes **14 deterministic test suites** providing exhaustive functional, security, and institutional verification:

| Test Suite | Purpose & Coverage |
|---|---|
| `security-remediation-suite.test.js` | Verification of CSRF, CSP headers, rate-limiting, and sanitized endpoints |
| `password-security.test.js` | SHA-256 pre-hashing, 12-round Bcrypt bounds, entropy assertions |
| `otp-auth.test.js` | Multi-channel OTP dispatch (Gmail SMTP, Resend, Telegram) and verification lifecycle |
| `rbac-authorization.test.js` | Institutional role privilege boundaries (Admin, Archivist, Researcher, Public) |
| `security-regression.test.js` | NoSQL injection, XSS mitigations, brute-force mitigations |
| `content-expansion-audit.test.js` | Integrity of 60 BAWS Volumes, 361 Letters, 22 Vows, and Debates |
| `institutional-audit.test.js` | Sourcing veracity, historical citation conformity, and metadata fidelity |
| `admin-cms.test.js` | Administrative actions, privilege escalation prevention, immutable audit log |
| `navigation-system.test.js` | Movable dockbar, edge-snapping coordinates, drawer synchronization |
| `research-workspace.test.js` | Scholar citations (APA, MLA, Chicago, Harvard) and IDOR isolation |
| `hybrid-search.test.js` | Keyword, transliterated, and vector ranking accuracy |
| `sha256-integrity.test.js` | Digital bitstream preservation hashing and drift detection |
| `theme-font-contrast.test.js` | WCAG 2.1 AAA contrast compliance across Dark Slate, Ivory Paper, and Sepia |
| `about-page.test.js` | Creator profile verification, disclosures, and institutional links |

---

## 🚀 Production Deployment

The project is structured for flexible production deployment across standard cloud providers:

- **Backend Web Service (Render)**:
  - Configuration defined in [`render.yaml`](render.yaml).
  - Deploys as a persistent Node.js web service with automatic deployment tracking and health checking at `/api/health`.
- **Frontend & Edge Routing (Vercel)**:
  - Configuration defined in [`vercel.json`](vercel.json).
  - Statically serves `ambedkar-archive/frontend` with rewrite rules directing `/api/*` to the serverless function at `api/index.js`.
- **Database (MongoDB Atlas)**:
  - Multi-region replica set connected via standard SRV connection string with automatic failover to the local in-memory fallback store if connectivity is interrupted.

---

## 👨‍💻 Author

**Sujal Roxx**<br/>
*Project Creator & Lead Architect*<br/>
Dr. B. R. Ambedkar Digital Heritage Archive

- **GitHub**: [@RoxxSujal7](https://github.com/RoxxSujal7)
- **LinkedIn**: [Sujal Roxx](https://www.linkedin.com/in/sujalroxx7/)
- **Instagram**: [@roxxsujal7](https://www.instagram.com/roxxsujal7/)

---

## 📜 Historical Sourcing & Academic Acknowledgements

All archival manuscripts, legislative debates, and volume texts indexed in this project are in the public domain and sourced from authoritative institutional archives:
- **Dr. Ambedkar Foundation**, Ministry of Social Justice and Empowerment, Government of India.
- **Ministry of External Affairs (MEA)**, Government of India (*Writings and Speeches of Dr. B. R. Ambedkar*).
- **Parliament of India**, Constituent Assembly Debates Official Records.

---

## ⚖️ License

This project is open-source software licensed under the **[MIT License](LICENSE)**.
