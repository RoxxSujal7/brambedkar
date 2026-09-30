const mongoose = require('mongoose');

let lastDbError = null;
let connPromise = null;

const connectDB = async () => {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (connPromise) {
    return connPromise;
  }

  let uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ambedkar_archive';

  // Hard safety guard: Test execution must NEVER use production database ambedkar_archive
  const isTest = process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true';
  if (isTest) {
    if (process.env.MONGO_TEST_URI) {
      uri = process.env.MONGO_TEST_URI;
    } else if (uri.includes('/ambedkar_archive?') || uri.endsWith('/ambedkar_archive')) {
      // Safely switch to isolated test database ambedkar_archive_test
      uri = uri.replace(/\/ambedkar_archive(\?|$)/, '/ambedkar_archive_test$1');
      console.log('🔒 Test isolation active: Redirected to isolated test database ambedkar_archive_test');
    }

    // Verify hard safety guard
    if (uri.includes('/ambedkar_archive?') || uri.endsWith('/ambedkar_archive')) {
      throw new Error("🚨 HARD SAFETY GUARD: Test mode attempted to connect to production database 'ambedkar_archive'! Tests must use an isolated test database ('ambedkar_archive_test').");
    }
  }

  connPromise = (async () => {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      lastDbError = null;
      console.log(`✅ MongoDB Connected: ${conn.connection.host} [db: ${conn.connection.name}]`);
      return conn;
    } catch (err) {
      connPromise = null;
      lastDbError = err.message;
      mongoose.set('bufferCommands', false);
      if (process.env.NODE_ENV === 'production') {
        console.error(`🚨 FATAL: Persistent database connection (MongoDB) failed in PRODUCTION mode: ${err.message}`);
        console.error('Production requirements violated: Real users and authentication events must not depend on in-memory storage.');
      } else {
        console.warn(`⚠️ MongoDB not connected (${err.message}). API running in Instant Offline / Development Mode.`);
      }
      return null;
    }
  })();

  return connPromise;
};

function isDbConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

function getDbStatus() {
  const connected = isDbConnected();
  const isProd = process.env.NODE_ENV === 'production';
  return {
    connected,
    status: connected ? 'HEALTHY' : (isProd ? 'UNAVAILABLE' : 'OFFLINE_FALLBACK'),
    mode: connected ? 'MongoDB Persistent Cluster' : (isProd ? 'DATABASE_OFFLINE_ERROR' : 'Local JSON Persistence'),
    host: connected ? mongoose.connection.host : 'Local JSON Persistence',
    error: lastDbError,
  };
}

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.isDbConnected = isDbConnected;
module.exports.getDbStatus = getDbStatus;
