require('dotenv').config({ path: require('path').join(__dirname, '../server/.env') });
const connectDB = require('../server/src/config/db');
const app = require('../server/src/app');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (error) {
