import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import app from './app.js';
import { initNotificationService } from './services/notificationService.js';
import { preloadModel } from './services/embeddingService.js';
import jwt from 'jsonwebtoken';

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = createServer(app);

// ======================
// SOCKET.IO SETUP
// ======================
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.userId}`);

  // Join personal room for targeted notifications
  socket.join(`user:${socket.userId}`);

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.userId}`);
  });
});

// Initialize notification service with Socket.io
initNotificationService(io);

// ======================
// START SERVER
// ======================
server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║                                           ║
  ║   🔍 FindIt AI Server                    ║
  ║   Running on port ${PORT}                    ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}            ║
  ║                                           ║
  ╚═══════════════════════════════════════════╝
  `);

  // Preload AI model in background (don't block startup)
  preloadModel().catch(() => {
    console.log('⚠️ AI model will load on first search request');
  });
});

export default server;
