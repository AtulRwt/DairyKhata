const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security headers
app.use(helmet());

// CORS — allow configured CLIENT_URL, all Vercel preview domains, and localhost (any port)
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      // Allow if it's in the explicit list
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow any localhost / 127.0.0.1 port (e.g. 5173, 5174, etc.)
      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
      // Allow any *.vercel.app domain (preview deployments)
      if (/\.vercel\.app$/.test(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'DairyKhata API is running', timestamp: new Date() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/milk', require('./routes/milk'));
