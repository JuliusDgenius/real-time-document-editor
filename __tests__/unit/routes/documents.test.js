import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { request, mockPrisma as prisma } from '../../fixtures/test-utils.js';
import jwt from 'jsonwebtoken';

describe('Document Routes', () => {
  const mockDocument = {
    id: 1,
    title: 'Test Doc',
    content: 'Content',
    owner_id: 1,
    version: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock authenticated user
    jest.spyOn(jwt, 'verify').mockReturnValue({ id: 1, role: 'USER' });
    // Reset all prisma mocks
    Object.values(prisma).forEach(model => {
      Object.values(model).forEach(method => {
        if (typeof method.mockReset === 'function') {
          method.mockReset();
        }
      });
    });
  });

  describe('POST /documents/create-document', () => {
    it('should create new document', async () => {
      // Mock document doesn't exist yet
      prisma.document.findUnique.mockResolvedValue(null);
      
      // Mock successful document creation
      prisma.document.create.mockResolvedValue({
        ...mockDocument,
        owner_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      });

      const res = await request
        .post('/documents/create-document')
        .set('Authorization', 'Bearer valid_token')
        .send({ title: 'Test Doc' });

      expect(res.statusCode).toBe(201);
      expect(prisma.document.create).toHaveBeenCalledWith({
        data: {
          title: 'Test Doc',
          content: '',
          owner_id: 1,
          version: 1
        }
      });
    });
  });

  describe('PUT /documents/edit/:id', () => {
    it('should handle version conflict', async () => {
      // Mock document exists with a newer version
      prisma.document.findUnique.mockResolvedValue({
        ...mockDocument,
        version: 2,
        owner_id: 1
      });

      const res = await request
        .put('/documents/edit/1')
        .set('Authorization', 'Bearer valid_token')
        .send({
          content: 'Updated content',
          version: 1
        });

      expect(res.statusCode).toBe(409);
      expect(prisma.document.update).not.toHaveBeenCalled();
    });
  });
});