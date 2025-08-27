import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { request, mockPrisma as prisma } from '../../fixtures/test-utils.js';
import jwt from 'jsonwebtoken';

describe('Auth Routes', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password_hash: 'hashed_password',
    role: 'USER'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);

      const res = await request
        .post('/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
    });

    it('should return 409 for duplicate email', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);

      const res = await request
        .post('/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.statusCode).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(jwt, 'sign').mockReturnValue('fake_token');

      const res = await request
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token', 'fake_token');
    });

    it('should return 401 for invalid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request
        .post('/auth/login')
        .send({ email: 'wrong@example.com', password: 'wrong' });

      expect(res.statusCode).toBe(401);
    });
  });
});