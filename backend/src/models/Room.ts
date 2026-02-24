import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
  roomId: string;
  creatorId?: number;
  creatorUsername?: string;
  participants: Array<{
    socketId: string;
    userId?: number;
    username: string;
    joinedAt: Date;
  }>;
  createdAt: Date;
  lastActivityAt: Date;
}

const RoomSchema: Schema = new Schema({
  roomId: { type: String, required: true, unique: true },
  creatorId: { type: Number },
  creatorUsername: { type: String },
  participants: [{
    socketId: { type: String, required: true },
    userId: { type: Number },
    username: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now }
});

export default mongoose.model<IRoom>('Room', RoomSchema);
