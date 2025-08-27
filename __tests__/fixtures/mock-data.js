import { Role, Permission } from '@prisma/client';
import jwt from 'jsonwebtoken';

export const mockUsers = [
  {
    id: 1,
    email: 'admin@example.com',
    password: 'password123',
    hashedPassword: '$2b$10$abcdefghijklmnopqrstuvwxyz123456789',
    role: Role.ADMIN
  },
  {
    id: 2,
    email: 'user@example.com',
    password: 'password123',
    hashedPassword: '$2b$10$abcdefghijklmnopqrstuvwxyz123456789',
    role: Role.USER
  }
];

export const mockDocuments = [
  {
    id: 1,
    title: 'Test Document 1',
    content: 'This is test content for document 1',
    version: 1,
    owner_id: 1
  },
  {
    id: 2,
    title: 'Test Document 2',
    content: 'This is test content for document 2',
    version: 1,
    owner_id: 2
  }
];

export const mockShares = [
  {
    document_id: 2,
    user_id: 1,
    permission: Permission.view
  }
];

// Helper to generate a valid JWT token for tests
export const generateTestToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};