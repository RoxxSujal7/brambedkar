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

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ambedkar_archive';

  connPromise = (async () => {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      lastDbError = null;
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
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
