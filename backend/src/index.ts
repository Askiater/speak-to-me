import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectMongoDB, initPostgres } from './config/database';
import { initializeAdminUser } from './utils/auth';
import authRoutes from './routes/auth';
import roomRoutes from './routes/rooms';
import { setupSignaling } from './sockets/signaling';
import { startRoomCleanupScheduler } from './utils/roomCleanup';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

app.get('/api/turn-credentials', (req, res) => {
  res.json({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: `turn:${process.env.COTURN_HOST || 'localhost'}:${process.env.COTURN_PORT || '3478'}`,
        username: process.env.TURN_USERNAME || 'turn_user',
        credential: process.env.TURN_PASSWORD || 'turn_password'
      }
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

setupSignaling(io);

const PORT = process.env.BACKEND_PORT || 3001;

const startServer = async () => {
  try {
    await connectMongoDB();
    await initPostgres();
    await initializeAdminUser();

    startRoomCleanupScheduler(io);

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
