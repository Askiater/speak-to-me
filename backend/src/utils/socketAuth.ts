import { Socket } from 'socket.io';
import { verifyToken } from './auth';
import cookie from 'cookie';

export interface SocketUser {
  id?: number;
  username: string;
  isAdmin: boolean;
}

export const authenticateSocket = (socket: Socket): SocketUser | null => {
  try {
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) {
      return { username: 'Guest', isAdmin: false };
    }

    const parsedCookies = cookie.parse(cookies);
    const token = parsedCookies.token;

    if (!token) {
      return { username: 'Guest', isAdmin: false };
    }

    const user = verifyToken(token);
    if (!user) {
      return { username: 'Guest', isAdmin: false };
    }

    return {
      id: user.id,
      username: user.username,
      isAdmin: user.is_admin
    };
  } catch (error) {
    console.error('Socket auth error:', error);
    return { username: 'Guest', isAdmin: false };
  }
};
