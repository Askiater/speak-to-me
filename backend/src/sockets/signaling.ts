import { Server as SocketServer, Socket } from 'socket.io';
import Room from '../models/Room';
import { authenticateSocket } from '../utils/socketAuth';
import { pgPool } from '../config/database';

export const setupSignaling = (io: SocketServer) => {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    const user = authenticateSocket(socket);

    socket.on('join:room', async (data: { roomId: string }) => {
      try {
        const { roomId } = data;
        let room = await Room.findOne({ roomId });

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        socket.join(roomId);

        const participant = {
          socketId: socket.id,
          userId: user?.id,
          username: user?.username || 'Guest',
          joinedAt: new Date()
        };

        room.participants.push(participant);
        room.lastActivityAt = new Date();
        await room.save();

        const sessionResult = await pgPool.query(
          'SELECT id FROM sessions WHERE room_id = $1',
          [roomId]
        );

        if (sessionResult.rows.length > 0) {
          await pgPool.query(
            'INSERT INTO session_participants (session_id, user_id, username) VALUES ($1, $2, $3)',
            [sessionResult.rows[0].id, user?.id, user?.username || 'Guest']
          );
        }

        const otherParticipants = room.participants
          .filter(p => p.socketId !== socket.id)
          .map(p => ({
            socketId: p.socketId,
            username: p.username
          }));

        socket.emit('room:joined', {
          roomId,
          participants: otherParticipants
        });

        socket.to(roomId).emit('user:joined', {
          socketId: socket.id,
          username: participant.username
        });

        io.emit('admin:update');

        console.log(`User ${participant.username} joined room ${roomId}`);
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    socket.on('signal:offer', (data: { roomId: string; to: string; offer: any }) => {
      socket.to(data.to).emit('signal:offer', {
        from: socket.id,
        offer: data.offer
      });
    });

    socket.on('signal:answer', (data: { roomId: string; to: string; answer: any }) => {
      socket.to(data.to).emit('signal:answer', {
        from: socket.id,
        answer: data.answer
      });
    });

    socket.on('signal:ice-candidate', (data: { roomId: string; to: string; candidate: any }) => {
      socket.to(data.to).emit('signal:ice-candidate', {
        from: socket.id,
        candidate: data.candidate
      });
    });

    socket.on('disconnect', async () => {
      try {
        const room = await Room.findOne({ 'participants.socketId': socket.id });

        if (room) {
          const participant = room.participants.find(p => p.socketId === socket.id);

          room.participants = room.participants.filter(p => p.socketId !== socket.id);

          if (room.participants.length === 0) {
            await Room.deleteOne({ roomId: room.roomId });
            await pgPool.query(
              'UPDATE sessions SET ended_at = NOW() WHERE room_id = $1',
              [room.roomId]
            );
            console.log(`Room ${room.roomId} closed - all users left`);
          } else {
            room.lastActivityAt = new Date();
            await room.save();
          }

          socket.to(room.roomId).emit('user:left', {
            socketId: socket.id
          });

          if (participant) {
            const sessionResult = await pgPool.query(
              'SELECT id FROM sessions WHERE room_id = $1',
              [room.roomId]
            );

            if (sessionResult.rows.length > 0) {
              await pgPool.query(
                'UPDATE session_participants SET left_at = NOW() WHERE session_id = $1 AND username = $2 AND left_at IS NULL',
                [sessionResult.rows[0].id, participant.username]
              );
            }
          }

          io.emit('admin:update');
        }

        console.log('Client disconnected:', socket.id);
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });

    socket.on('admin:terminate', async (data: { roomId: string }) => {
      if (!user?.isAdmin) {
        return;
      }

      try {
        const room = await Room.findOne({ roomId: data.roomId });

        if (room) {
          room.participants.forEach(p => {
            io.to(p.socketId).emit('room:terminated');
            io.sockets.sockets.get(p.socketId)?.disconnect();
          });

          await Room.deleteOne({ roomId: data.roomId });
          await pgPool.query(
            'UPDATE sessions SET ended_at = NOW() WHERE room_id = $1',
            [data.roomId]
          );

          io.emit('admin:update');

          console.log(`Admin terminated room: ${data.roomId}`);
        }
      } catch (error) {
        console.error('Admin terminate error:', error);
      }
    });
  });
};
