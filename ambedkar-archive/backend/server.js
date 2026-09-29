require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const progressRoutes = require('./routes/progress');
const bookmarkRoutes = require('./routes/bookmarks');
const mediaRoutes = require('./routes/media');
const searchRoutes = require('./routes/search');
const ocrRoutes = require('./routes/ocr');
const letterRoutes = require('./routes/letters');
const vowRoutes = require('./routes/vows');
const volumeRoutes = require('./routes/volumes');
const chatRoutes = require('./routes/chat');
const memorialRoutes = require('./routes/memorials');
const debateRoutes = require('./routes/debates');
const preservationRoutes = require('./routes/preservation');
const adminRoutes = require('./routes/admin');
const workspaceRoutes = require('./routes/workspace');

const app = express();

// Connect to MongoDB
connectDB();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://apis.google.com", "https://cdn.jsdelivr.net"],
      workerSrc: ["'self'", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com/gsi/style"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://accounts.google.com", "https://accounts.google.com/gsi/", "https://www.googleapis.com", "https://oauth2.googleapis.com", "https://generativelanguage.googleapis.com", "https://cdn.jsdelivr.net", "https://tessdata.projectnaptha.com"],
      frameSrc: ["'self'", "https://accounts.google.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  frameguard: { action: 'sameorigin' },
}));

// Permissions-Policy (disables unused browser sensor/hardware APIs)
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), payment=()');
  next();
});

// CORS with strict origin validation
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://ambedkar-archive.vercel.app',
  'https://ambedkar-digital-archive.onrender.com',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    // Strict whitelist check
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Permit any Vercel deployment preview / subdomain for ambedkar-archive
    try {
      const parsed = new URL(origin);
      if (parsed.hostname === 'ambedkar-archive.vercel.app' || parsed.hostname.endsWith('.vercel.app')) {
        return callback(null, true);
      }
    } catch (e) {}

    // Development local origins only permitted in non-production
    if (process.env.NODE_ENV !== 'production') {
      try {
        const parsed = new URL(origin);
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
          return callback(null, true);
        }
      } catch (e) {}
    }

    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Global rate limiter (generous — tighter limits per sensitive route)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 500 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/letters', letterRoutes);
app.use('/api/vows', vowRoutes);
app.use('/api/volumes', volumeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/memorials', memorialRoutes);
app.use('/api/debates', debateRoutes);
app.use('/api/preservation', preservationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/workspace', workspaceRoutes);


// Serve volume PDFs directly from canonical frontend/pdfs
app.use(['/books', '/pdfs'], express.static(path.join(__dirname, '../frontend/pdfs'), {
  maxAge: '7d',
  setHeaders: (res) => { res.setHeader('Cache-Control', 'public, max-age=604800'); }
}));


// Health check
app.get('/api/health', async (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  const mongoose = require('mongoose');
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (_) {}
  }
  const dbConnected = mongoose.connection && mongoose.connection.readyState === 1;
  const dbStatus = dbConnected
    ? 'connected'
    : (isProd ? 'unavailable' : 'offline_fallback');

  const healthy = isProd ? dbConnected : true;

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? 'running' : 'degraded',
    message: 'Ambedkar Digital Heritage Archive API',
    database: {
      status: dbStatus,
      mode: dbConnected ? 'MongoDB' : (isProd ? 'none' : 'JSON_Storage_Fallback'),
    },
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Serve frontend static files with optimized Cache-Control headers (Phase 6.1)
app.use(express.static(path.join(__dirname, '../frontend'), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.match(/\.(html|css|js)$/i)) {
      // HTML, CSS, JS always re-validate — ensures fresh content on deploy
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    } else if (filePath.match(/\.(woff2?|ttf|eot|png|jpg|jpeg|gif|svg|ico|webp)$/i)) {
      // Media and fonts cached for 1 day
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// Fallback for non-API routes to index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

const { AppError, NotFoundError } = require('./errors/AppError');

// 404 handler
app.use((req, res, next) => {
  next(new NotFoundError('Route', req.originalUrl));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.name} (${err.code || 500}): ${err.message}`);

  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 422 : err.code === 11000 ? 409 : err.name === 'CastError' ? 400 : 500);
  const code = err.code || (err.name === 'ValidationError' ? 'VALIDATION_ERROR' : err.name === 'CastError' ? 'INVALID_ID' : 'INTERNAL_ERROR');

  const isProd = process.env.NODE_ENV === 'production';
  const safeMessage = (isProd && statusCode >= 500)
    ? 'Internal server error'
    : (err.message || 'Internal server error');

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: safeMessage,
      details: isProd ? null : (err.details || null),
      timestamp: err.timestamp || new Date().toISOString(),
    },
  });
});

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 Ambedkar Digital Heritage Archive — API ready`);
    console.log(`🔑 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
