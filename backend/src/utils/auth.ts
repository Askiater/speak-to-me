import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pgPool } from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export interface User {
  id: number;
  username: string;
  password?: string;
  is_admin: boolean;
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (user: User): string => {
  return jwt.sign(
    { id: user.id, username: user.username, isAdmin: user.is_admin },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

export const verifyToken = (token: string): User | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      username: decoded.username,
      is_admin: decoded.isAdmin
    };
  } catch (error) {
    return null;
  }
};

export const createUser = async (username: string, password: string, isAdmin: boolean = false): Promise<User> => {
  const hashedPassword = await hashPassword(password);
  const result = await pgPool.query(
    'INSERT INTO users (username, password, is_admin) VALUES ($1, $2, $3) RETURNING id, username, is_admin',
    [username, hashedPassword, isAdmin]
  );
  return result.rows[0];
};

export const findUserByUsername = async (username: string): Promise<User | null> => {
  const result = await pgPool.query(
    'SELECT id, username, password, is_admin FROM users WHERE username = $1',
    [username]
  );
  return result.rows[0] || null;
};

export const getAllUsers = async (): Promise<User[]> => {
  const result = await pgPool.query(
    'SELECT id, username, is_admin FROM users ORDER BY created_at DESC'
  );
  return result.rows;
};

export const deleteUser = async (userId: number): Promise<void> => {
  await pgPool.query('DELETE FROM users WHERE id = $1', [userId]);
};

export const updateUser = async (userId: number, username: string, password?: string): Promise<void> => {
  if (password) {
    const hashedPassword = await hashPassword(password);
    await pgPool.query(
      'UPDATE users SET username = $1, password = $2 WHERE id = $3',
      [username, hashedPassword, userId]
    );
  } else {
    await pgPool.query(
      'UPDATE users SET username = $1 WHERE id = $2',
      [username, userId]
    );
  }
};

export const initializeAdminUser = async () => {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const existingAdmin = await findUserByUsername(adminUsername);

  if (!existingAdmin) {
    await createUser(adminUsername, adminPassword, true);
    console.log(`Admin user created: ${adminUsername}`);
  } else {
    console.log(`Admin user already exists: ${adminUsername}`);
  }
};
