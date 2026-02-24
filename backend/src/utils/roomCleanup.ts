import Room from '../models/Room';
import { pgPool } from '../config/database';
import { Server as SocketServer } from 'socket.io';

const ROOM_TIMEOUT_MS = parseInt(process.env.ROOM_TIMEOUT_MINUTES || '10') * 60 * 1000;

export const checkRoomTimeouts = async (io: SocketServer) => {
  try {
    const rooms = await Room.find({});
    const now = new Date();

    for (const room of rooms) {
      if (room.participants.length === 0) {
        await Room.deleteOne({ roomId: room.roomId });
        await pgPool.query(
          'UPDATE sessions SET ended_at = NOW() WHERE room_id = $1',
          [room.roomId]
        );
        console.log(`Removed empty room: ${room.roomId}`);
        continue;
      }

      if (room.participants.length === 1) {
        const timeAlone = now.getTime() - room.lastActivityAt.getTime();

        if (timeAlone > ROOM_TIMEOUT_MS) {
          const socketId = room.participants[0].socketId;
          io.to(socketId).emit('room:kicked', { reason: 'timeout' });
          io.sockets.sockets.get(socketId)?.disconnect();

          await Room.deleteOne({ roomId: room.roomId });
          await pgPool.query(
            'UPDATE sessions SET ended_at = NOW() WHERE room_id = $1',
            [room.roomId]
          );

          console.log(`Kicked user from room ${room.roomId} due to timeout`);
        }
      }
    }
  } catch (error) {
    console.error('Room cleanup error:', error);
  }
};

export const startRoomCleanupScheduler = (io: SocketServer) => {
  setInterval(() => {
    checkRoomTimeouts(io);
  }, 30000); // Check every 30 seconds
};
