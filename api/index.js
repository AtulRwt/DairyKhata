// Vercel serverless entry point for the Express app.
// Vercel expects a default export of an Express app (not app.listen).
// The server/src/app.js already exports `app` without starting it — perfect.

require('dotenv').config({ path: require('path').join(__dirname, '../server/.env') });
const app = require('../server/src/app');

module.exports = app;
