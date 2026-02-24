'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getUsers, createUser, updateUser, deleteUser, getSessions } from '@/lib/api';
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket';

interface User {
  id: number;
  username: string;
  is_admin: boolean;
}

interface Session {
  roomId: string;
  creatorId?: number;
  creatorUsername?: string;
  participants: Array<{ username: string; joinedAt: Date }>;
  createdAt: Date;
  lastActivityAt: Date;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sessions' | 'users'>('sessions');

  const [sessions, setSessions] = useState<Session[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user?.isAdmin) {
      connectSocket();
      const socket = getSocket();

      socket.on('admin:update', () => {
        loadSessions();
      });

      return () => {
        socket.off('admin:update');
        disconnectSocket();
      };
    }
  }, [user]);

  const checkAuth = async () => {
    const currentUser = await getCurrentUser();

    if (!currentUser || !currentUser.isAdmin) {
      router.push('/');
      return;
    }

    setUser(currentUser);
    setLoading(false);

    await loadSessions();
    await loadUsers();
  };

  const loadSessions = async () => {
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleCreateUser = async () => {
    if (!newUsername || !newPassword) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await createUser(newUsername, newPassword);
      setShowCreateUser(false);
      setNewUsername('');
      setNewPassword('');
      await loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !newUsername) {
      alert('Please fill in username');
      return;
    }

    try {
      await updateUser(editingUser.id, newUsername, newPassword || undefined);
      setShowEditUser(false);
      setEditingUser(null);
      setNewUsername('');
      setNewPassword('');
      await loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await deleteUser(userId);
      await loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleTerminateSession = (roomId: string) => {
    if (!confirm('Are you sure you want to terminate this session?')) {
      return;
    }

    const socket = getSocket();
    socket.emit('admin:terminate', { roomId });
  };

  const startEditUser = (user: User) => {
    setEditingUser(user);
    setNewUsername(user.username);
    setNewPassword('');
    setShowEditUser(true);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ color: 'white', fontSize: '20px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '20px' }}>
      <div className="container">
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>Admin Panel</h1>
            <button
              className="btn-secondary"
              onClick={() => router.push('/')}
            >
              Back to Home
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '2px solid #e5e7eb' }}>
            <button
              onClick={() => setActiveTab('sessions')}
              style={{
                padding: '12px 24px',
                background: 'none',
                color: activeTab === 'sessions' ? '#667eea' : '#666',
                fontWeight: '600',
                borderBottom: activeTab === 'sessions' ? '3px solid #667eea' : 'none',
                marginBottom: '-2px'
              }}
            >
              Active Sessions ({sessions.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              style={{
                padding: '12px 24px',
                background: 'none',
                color: activeTab === 'users' ? '#667eea' : '#666',
                fontWeight: '600',
                borderBottom: activeTab === 'users' ? '3px solid #667eea' : 'none',
                marginBottom: '-2px'
              }}
            >
              User Management
            </button>
          </div>

          {activeTab === 'sessions' && (
            <div>
              {sessions.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
                  No active sessions
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {sessions.map((session) => (
                    <div
                      key={session.roomId}
                      style={{
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '20px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#333' }}>Room ID:</strong>
                            <span style={{ color: '#666', fontSize: '14px', marginLeft: '8px', fontFamily: 'monospace' }}>
                              {session.roomId}
                            </span>
                          </div>

                          {session.creatorUsername && (
                            <div style={{ marginBottom: '12px' }}>
                              <strong style={{ color: '#333' }}>Creator:</strong>
                              <span style={{ color: '#666', marginLeft: '8px' }}>
                                {session.creatorUsername}
                              </span>
                            </div>
                          )}

                          <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#333' }}>Participants ({session.participants.length}):</strong>
                            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {session.participants.map((p, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    background: '#f3f4f6',
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    color: '#666'
                                  }}
                                >
                                  {p.username}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div style={{ fontSize: '14px', color: '#888' }}>
                            Created: {new Date(session.createdAt).toLocaleString()}
                          </div>
                        </div>

                        <button
                          className="btn-danger"
                          onClick={() => handleTerminateSession(session.roomId)}
                        >
                          Terminate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <button
                  className="btn-primary"
                  onClick={() => setShowCreateUser(true)}
                >
                  Create New User
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>
                        Username
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>
                        Role
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontWeight: '600' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px', color: '#333' }}>
                          {u.username}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span
                            style={{
                              background: u.is_admin ? '#fef3c7' : '#f3f4f6',
                              color: u.is_admin ? '#92400e' : '#666',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '14px'
                            }}
                          >
                            {u.is_admin ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            {!u.is_admin && (
                              <>
                                <button
                                  className="btn-secondary"
                                  onClick={() => startEditUser(u)}
                                  style={{ padding: '6px 12px', fontSize: '14px' }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn-danger"
                                  onClick={() => handleDeleteUser(u.id)}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateUser && (
        <div className="modal-overlay" onClick={() => setShowCreateUser(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#333' }}>
              Create New User
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>
                  Username
                </label>
                <input
                  type="text"
                  className="input"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>
                  Password
                </label>
                <input
                  type="password"
                  className="input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  className="btn-primary"
                  onClick={handleCreateUser}
                  style={{ flex: 1 }}
                >
                  Create
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowCreateUser(false);
                    setNewUsername('');
                    setNewPassword('');
                  }}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditUser && editingUser && (
        <div className="modal-overlay" onClick={() => setShowEditUser(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#333' }}>
              Edit User
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>
                  Username
                </label>
                <input
                  type="text"
                  className="input"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555' }}>
                  Password (leave empty to keep current)
                </label>
                <input
                  type="password"
                  className="input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave empty to keep current password"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  className="btn-primary"
                  onClick={handleUpdateUser}
                  style={{ flex: 1 }}
                >
                  Update
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowEditUser(false);
                    setEditingUser(null);
                    setNewUsername('');
                    setNewPassword('');
                  }}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
