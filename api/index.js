// Vercel serverless entry point for the Express app.
// Vercel expects a default export of an Express app (not app.listen).
// The server/src/app.js already exports `app` without starting it.

require('dotenv').config({ path: require('path').join(__dirname, '../server/.env') });
const app = require('../server/src/app');
const connectDB = require('../server/src/config/db');

// ---------------------------------------------------------------------------
// MongoDB connection cache
// In serverless environments each Lambda invocation may reuse an existing
// Node process. We cache the mongoose connection so we only connect once per
// warm instance instead of opening a new connection on every request.
// ---------------------------------------------------------------------------
let isConnected = false;

const ensureDB = async () => {
  if (isConnected) return;
  await connectDB();
  isConnected = true;
};

// Wrap the app so every request triggers the DB check before Express handles it.
module.exports = async (req, res) => {
  await ensureDB();
  return app(req, res);
};
