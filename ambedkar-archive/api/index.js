// Vercel Serverless Function entrypoint
const app = require('../backend/server');
const connectDB = require('../backend/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    // connectDB already handles logging and fallbacks
  }
  return app(req, res);
};
