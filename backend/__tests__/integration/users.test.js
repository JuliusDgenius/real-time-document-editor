import { request, setupTestDB, teardownTestDB } from '../fixtures/test-utils.js';
import { mockUsers, generateTestToken } from '../fixtures/mock-data.js';
import prisma from '../../prismaClient.js';

describe('User Routes', () => {
  let adminToken, userToken;
  
  beforeAll(async () => {
    await setupTestDB();
    
    // Generate tokens for test users
    adminToken = generateTestToken(mockUsers[0]); // admin@example.com
    userToken = generateTestToken(mockUsers[1]); // user@example.com
  });
  
  afterAll(async () => {
    await teardownTestDB();
  });

  describe('GET /users', () => {
    it('should return all users if admin', async () => {
      const response = await request
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Verify user data structure
      const user = response.body[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).not.toHaveProperty('password_hash');
    });

    it('should return 403 if not admin', async () => {
      await request
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 401 if not authenticated', async () => {
      await request
        .get('/users')
        .expect(401);
    });
  });

  describe('GET /users/:id', () => {
    it('should return user by ID if admin', async () => {
      const response = await request
        .get(`/users/${mockUsers[1].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(mockUsers[1].id);
      expect(response.body.email).toBe(mockUsers[1].email);
      expect(response.body).not.toHaveProperty('password_hash');
    });

    it('should allow users to fetch their own data', async () => {
      const response = await request
        .get(`/users/${mockUsers[1].id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.id).toBe(mockUsers[1].id);
      expect(response.body.email).toBe(mockUsers[1].email);
    });

    it('should return 403 if regular user tries to access other user data', async () => {
      await request
        .get(`/users/${mockUsers[0].id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 404 if user not found', async () => {
      await request
        .get('/users/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete user if admin', async () => {
      // Create a user to delete
      const newUser = await prisma.user.create({
        data: {
          email: 'todelete@example.com',
          password_hash: 'hashedpassword',
          role: 'USER'
        }
      });

      await request
        .delete(`/users/${newUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Verify user was deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: newUser.id }
      });
      expect(deletedUser).toBeNull();
    });

    it('should return 403 if not admin', async () => {
      await request
        .delete(`/users/${mockUsers[0].id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 404 if user not found', async () => {
      await request
        .delete('/users/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should cascade delete user documents and shares', async () => {
      // Create a user with a document and share
      const testUser = await prisma.user.create({
        data: {
          email: 'cascade@example.com',
          password_hash: 'hashedpassword',
          role: 'USER'
        }
      });

      // Create a document owned by the user
      const doc = await prisma.document.create({
        data: {
          title: 'Test Document',
          content: 'Content to be deleted',
          owner_id: testUser.id,
          version: 1
        }
      });

      // Share the document with another user
      await prisma.documentShare.create({
        data: {
          document_id: doc.id,
          user_id: mockUsers[1].id,
          permission: 'view'
        }
      });

      // Delete the user
      await request
        .delete(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Verify cascade deletion
      const deletedDoc = await prisma.document.findUnique({
        where: { id: doc.id }
      });
      expect(deletedDoc).toBeNull();

      const deletedShare = await prisma.documentShare.findFirst({
        where: {
          document_id: doc.id,
          user_id: mockUsers[1].id
        }
      });
      expect(deletedShare).toBeNull();
    });
  });
});
