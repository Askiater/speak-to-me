'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginModal from '@/components/LoginModal';
import JoinRoomModal from '@/components/JoinRoomModal';
import { getCurrentUser, logout, createRoom } from '@/lib/api';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  const handleCreateRoom = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    try {
      const { roomId } = await createRoom();
      router.push(`/room/${roomId}`);
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create room');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ color: 'white', fontSize: '20px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>
              {user.username}
            </span>
            {user.isAdmin && (
              <button
                className="btn-secondary"
                onClick={() => router.push('/admin')}
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}
              >
                Admin Panel
              </button>
            )}
            <button
              className="btn-secondary"
              onClick={handleLogout}
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            className="btn-secondary"
            onClick={() => setShowLoginModal(true)}
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}
          >
            Login
          </button>
        )}
      </header>

      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '60px 80px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center',
          maxWidth: '600px'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '20px'
          }}>
            Speak To Me
          </h1>

          <p style={{ color: '#666', fontSize: '18px', marginBottom: '48px' }}>
            Connect face-to-face with secure video calls
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button
              className="btn-primary"
              onClick={handleCreateRoom}
              style={{ padding: '16px 32px', fontSize: '18px' }}
            >
              Create New Room
            </button>

            <button
              className="btn-secondary"
              onClick={() => setShowJoinModal(true)}
              style={{ padding: '16px 32px', fontSize: '18px' }}
            >
              Join Existing Room
            </button>
          </div>

          {!user && (
            <p style={{ marginTop: '24px', color: '#888', fontSize: '14px' }}>
              Note: You need to login to create a room
            </p>
          )}
        </div>
      </main>

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={checkAuth}
        />
      )}

      {showJoinModal && (
        <JoinRoomModal onClose={() => setShowJoinModal(false)} />
      )}
    </div>
  );
}
