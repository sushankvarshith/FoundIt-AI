import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import app from './app.js';
import { initNotificationService } from './services/notificationService.js';
import { initDB } from './db/init.js';
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

  // Auto-initialize DB schema if tables do not exist
  initDB().catch((err) => {
    console.log('ℹ️ DB init notice:', err.message);
  });
});

// ======================
// CRASH HANDLERS
// ======================
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  // Give the server time to finish pending requests, then exit
  setTimeout(() => process.exit(1), 1000);
});

// ======================
// GRACEFUL SHUTDOWN
// ======================
const gracefulShutdown = (signal) => {
  console.log(`\n📴 ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('✅ HTTP server closed.');
    process.exit(0);
  });
  // Force close after 10s
  setTimeout(() => {
    console.error('⚠️ Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
