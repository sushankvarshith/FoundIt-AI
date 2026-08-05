import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiLimiter } from './middleware/rateLimiter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Route imports
import authRoutes from './routes/auth.js';
import itemRoutes from './routes/items.js';
import searchRoutes from './routes/search.js';
import notificationRoutes from './routes/notifications.js';
import claimRoutes from './routes/claims.js';
import bookmarkRoutes from './routes/bookmarks.js';
import messageRoutes from './routes/messages.js';
import adminRoutes from './routes/admin.js';

const app = express();

// ======================
// MIDDLEWARE
// ======================

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use('/api', apiLimiter);

// ======================
// ROUTES
// ======================

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Delete comment route (needs to be separate since it's /api/comments/:id)
import { deleteComment } from './controllers/commentController.js';
import { authenticate } from './middleware/auth.js';
app.delete('/api/comments/:id', authenticate, deleteComment);

// ======================
// SERVE REACT CLIENT (Production)
// ======================
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// All non-API routes → React app (SPA fallback)
app.get(/^\/(?!api).*/, (req, res, next) => {
  // Only serve HTML for requests that accept HTML (not WebSocket upgrades or other types)
  if (req.accepts('html')) {
    res.sendFile(path.join(clientDist, 'index.html'));
  } else {
    next();
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error.'
      : err.message,
  });
});

export default app;
