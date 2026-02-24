import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Room from '../models/Room';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { pgPool } from '../config/database';

const router = express.Router();

router.post('/create', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const roomId = uuidv4();
    const user = req.user!;

    const room = new Room({
      roomId,
      creatorId: user.id,
      creatorUsername: user.username,
      participants: [],
      createdAt: new Date(),
      lastActivityAt: new Date()
    });

    await room.save();

    await pgPool.query(
      'INSERT INTO sessions (room_id, creator_id) VALUES ($1, $2)',
      [roomId, user.id]
    );

    res.json({ roomId });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({
      roomId: room.roomId,
      exists: true
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/admin/sessions', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const rooms = await Room.find({});

    const sessions = rooms.map(room => ({
      roomId: room.roomId,
      creatorId: room.creatorId,
      creatorUsername: room.creatorUsername,
      participants: room.participants.map(p => ({
        username: p.username,
        joinedAt: p.joinedAt
      })),
      createdAt: room.createdAt,
      lastActivityAt: room.lastActivityAt
    }));

    res.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
