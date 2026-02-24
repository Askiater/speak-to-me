'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface JoinRoomModalProps {
  onClose: () => void;
}

export default function JoinRoomModal({ onClose }: JoinRoomModalProps) {
  const [roomId, setRoomId] = useState('');
  const router = useRouter();

  const handleJoin = () => {
    if (roomId.trim()) {
      router.push(`/room/${roomId.trim()}`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#333' }}>
          Join Room
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>
              Room ID
            </label>
            <input
              type="text"
              className="input"
              placeholder="Paste room ID here"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              className="btn-primary"
              onClick={handleJoin}
              disabled={!roomId.trim()}
              style={{ flex: 1 }}
            >
              Join Room
            </button>
            <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
