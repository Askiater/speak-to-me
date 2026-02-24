import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const login = async (username: string, password: string) => {
  const response = await api.post('/api/auth/login', { username, password });
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/api/auth/logout');
  return response.data;
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/api/auth/me');
    return response.data.user;
  } catch (error) {
    return null;
  }
};

export const createRoom = async () => {
  const response = await api.post('/api/rooms/create');
  return response.data;
};

export const checkRoom = async (roomId: string) => {
  const response = await api.get(`/api/rooms/${roomId}`);
  return response.data;
};

export const getTurnCredentials = async () => {
  const response = await api.get('/api/turn-credentials');
  return response.data;
};

export const getUsers = async () => {
  const response = await api.get('/api/auth/users');
  return response.data.users;
};

export const createUser = async (username: string, password: string) => {
  const response = await api.post('/api/auth/users', { username, password });
  return response.data;
};

export const updateUser = async (id: number, username: string, password?: string) => {
  const response = await api.put(`/api/auth/users/${id}`, { username, password });
  return response.data;
};

export const deleteUser = async (id: number) => {
  const response = await api.delete(`/api/auth/users/${id}`);
  return response.data;
};

export const getSessions = async () => {
  const response = await api.get('/api/rooms/admin/sessions');
  return response.data.sessions;
};
