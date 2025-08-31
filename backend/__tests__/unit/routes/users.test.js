import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { request, mockPrisma as prisma } from '../../fixtures/test-utils.js';
import jwt from 'jsonwebtoken';

describe('User Routes', () => {
  const mockAdminUser = {
    id: 1,
    email: 'admin@test.com',
    role: 'ADMIN'
  };

  const mockRegularUser = {
    id: 2,
    email: 'user@test.com',
    role: 'USER'
  };

  const mockUsersList = [
    { id: 1, email: 'admin@test.com', role: 'ADMIN', createdAt: new Date() },
    { id: 2, email: 'user@test.com', role: 'USER', createdAt: new Date() }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock admin user for authorization
    jest.spyOn(jwt, 'verify').mockReturnValue(mockAdminUser);
    // Reset all prisma mocks
    Object.values(prisma).forEach(model => {
      Object.values(model).forEach(method => {
        if (typeof method.mockReset === 'function') {
          method.mockReset();
        }
      });
    });
  });

  describe('GET /users/users', () => {
    it('should return users list for admin', async () => {
      prisma.user.findMany.mockResolvedValue(mockUsersList);
      prisma.user.count.mockResolvedValue(2);

      const res = await request
        .get('/users/users')
        .set('Authorization', 'Bearer valid_token');

      expect(res.statusCode).toBe(200);
      expect(res.body.users).toHaveLength(2);
      expect(res.body.count).toBe(2);
    });

    it('should return 403 for non-admin users', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue(mockRegularUser);

      const res = await request
        .get('/users/users')
        .set('Authorization', 'Bearer user_token');

      expect(res.statusCode).toBe(403);
    });

    it('should handle database errors', async () => {
      prisma.user.findMany.mockRejectedValue(new Error('DB Error'));
      prisma.user.count.mockRejectedValue(new Error('DB Error'));

      const res = await request
        .get('/users/users')
        .set('Authorization', 'Bearer valid_token');

      expect(res.statusCode).toBe(500);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete user successfully', async () => {
      // Mock that user exists
      prisma.user.findUnique.mockResolvedValue(mockRegularUser);
      // Mock successful deletion
      prisma.user.delete.mockResolvedValue(mockRegularUser);

      const res = await request
        .delete('/users/2')
        .set('Authorization', 'Bearer valid_token');

      expect(res.statusCode).toBe(204);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 2 }
      });
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 2 }
      });
    });

    it('should prevent self-deletion', async () => {
      const res = await request
        .delete('/users/1') // Same as admin user ID
        .set('Authorization', 'Bearer valid_token');

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toMatch(/cannot delete themselves/i);
    });

    it('should handle non-existent user', async () => {
      // Mock that user doesn't exist
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request
        .delete('/users/999')
        .set('Authorization', 'Bearer valid_token');

      expect(res.statusCode).toBe(404);
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('should validate user ID format', async () => {
      const res = await request
        .delete('/users/invalid')
        .set('Authorization', 'Bearer valid_token');

      expect(res.statusCode).toBe(400);
    });

    it('should handle database errors', async () => {
      // Mock that user exists
      prisma.user.findUnique.mockResolvedValue(mockRegularUser);
      // Mock database error
      prisma.user.delete.mockRejectedValue(new Error('DB Error'));

      const res = await request
        .delete('/users/2')
        .set('Authorization', 'Bearer valid_token');

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });
});