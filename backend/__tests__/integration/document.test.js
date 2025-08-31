import {
  jest, describe,
  it, expect, beforeAll,
  afterAll
} from '@jest/globals';
import {
  request, setupTestDB,
  teardownTestDB
} from '../fixtures/test-utils.js';
import {
  mockUsers,
  generateTestToken
} from '../fixtures/mock-data.js';
import prisma from '../../prismaClient.js';
import * as socketModule from '../../socket.js';

// Mock the socket.io functionality
const mockIO = {
  to: jest.fn().mockReturnThis(),
  except: jest.fn().mockReturnThis(),
  emit: jest.fn()
};

const mockGetIO = jest.fn().mockReturnValue(mockIO);

// Mock the socket module
jest.unstable_mockModule('../../socket.js', () => ({
  getIO: mockGetIO
}));

describe('Document Routes', () => {
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
  
  describe('POST /documents/create-document', () => {
    it('should create a new document for authenticated user', async () => {
      const newDocument = {
        title: 'New Test Document',
        content: 'This is a test document content'
      };
      
      const response = await request
        .post('/documents/create-document')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newDocument)
        .expect(201);
      
      expect(response.body.title).toBe(newDocument.title);
      expect(response.body.content).toBe(newDocument.content);
      expect(response.body.owner_id).toBe(mockUsers[1].id);
      
      // Verify document was created in DB
      const createdDoc = await prisma.document.findUnique({
        where: { id: response.body.id }
      });
      expect(createdDoc).toBeDefined();
    });
    
    it('should reject document creation with duplicate title', async () => {
      const duplicateDocument = {
        title: 'Test Document 1', // Already exists in mock data
        content: 'This is a duplicate document'
      };
      
      await request
        .post('/documents/create-document')
        .set('Authorization', `Bearer ${userToken}`)
        .send(duplicateDocument)
        .expect(409);
    });
    
    it('should reject unauthenticated requests', async () => {
      const newDocument = {
        title: 'Unauthenticated Document',
        content: 'This should not be created'
      };
      
      await request
        .post('/documents/create-document')
        .send(newDocument)
        .expect(401);
    });
  });
  
  describe('GET /documents/documents', () => {
    it('should return all documents accessible to the user', async () => {
      const response = await request
        .get('/documents/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      // Admin should see documents they own plus any shared with them
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Verify owned document is in the list
      const ownedDoc = response.body.find(doc => doc.id === 1);
      expect(ownedDoc).toBeDefined();
      
      // Verify shared document is in the list
      const sharedDoc = response.body.find(doc => doc.id === 2);
      expect(sharedDoc).toBeDefined();
    });
    
    it('should only return documents the user has access to', async () => {
      const response = await request
        .get('/documents/documents')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      // Regular user should only see their own documents
      expect(Array.isArray(response.body)).toBe(true);
      
      // Should only see documents they own
      const docsOwnedByUser = response.body.filter(doc => doc.owner_id === mockUsers[1].id);
      expect(docsOwnedByUser.length).toBe(response.body.length);
    });
  });
  
  describe('GET /documents/:id', () => {
    it('should return a document by ID if user has access', async () => {
      const response = await request
        .get('/documents/1') // Admin's document
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.id).toBe(1);
      expect(response.body.title).toBe('Test Document 1');
    });
    
    it('should include sharing information in the response', async () => {
      const response = await request
        .get('/documents/2') // User's document shared with admin
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.sharedWith).toBeDefined();
      expect(response.body.sharedWith.length).toBeGreaterThan(0);
    });
    
    it('should return 404 for non-existent document', async () => {
      await request
        .get('/documents/999') // Non-existent document
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
    
    it('should return 404 if user does not have access', async () => {
      await request
        .get('/documents/1') // Admin's document
        .set('Authorization', `Bearer ${userToken}`) // Regular user token
        .expect(404);
    });
  });
  
  describe('PUT /documents/edit/:id', () => {
    it('should update document if user has edit permission', async () => {
      const updatedContent = {
        title: 'Updated Test Document',
        content: 'This is updated content',
        version: 1 // Current version in mock data
      };
      
      const response = await request
        .put('/documents/edit/1') // Admin's document
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedContent)
        .expect(200);
      
      expect(response.body.title).toBe(updatedContent.title);
      expect(response.body.content).toBe(updatedContent.content);
      expect(response.body.version).toBe(2); // Version should increment
      
      // Verify WebSocket was called to broadcast changes
      expect(socketModule.getIO).toHaveBeenCalled();
    });
    
    it('should return 409 if version mismatch', async () => {
      const wrongVersion = {
        title: 'Wrong Version Document',
        content: 'This should fail',
        version: 999 // Wrong version
      };
      
      await request
        .put('/documents/edit/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(wrongVersion)
        .expect(409);
    });
    
    it('should return 403 if user lacks edit permission', async () => {
      // Document 2 is shared with admin but only with view permission
      const updateAttempt = {
        title: 'Unauthorized Update',
        content: 'This should not update',
        version: 1
      };
      
      await request
        .put('/documents/edit/2')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateAttempt)
        .expect(403);
    });
  });
  
  describe('POST /documents/:id/share', () => {
    it('should share a document with another user', async () => {
      const shareData = {
        email: 'user@example.com', // Share with regular user
        permission: 'edit'
      };
      
      await request
        .post('/documents/1/share') // Admin's document
        .set('Authorization', `Bearer ${adminToken}`)
        .send(shareData)
        .expect(201);
      
      // Verify share was created in DB
      const share = await prisma.documentShare.findUnique({
        where: {
          document_id_user_id: {
            document_id: 1,
            user_id: 2 // User ID from mock data
          }
        }
      });
      
      expect(share).toBeDefined();
      expect(share.permission).toBe(shareData.permission);
    });
    
    it('should return 404 if target user not found', async () => {
      const invalidShare = {
        email: 'nonexistent@example.com',
        permission: 'view'
      };
      
      await request
        .post('/documents/1/share')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidShare)
        .expect(404);
    });
    
    it('should return 404 if document not found or not owned', async () => {
      const shareData = {
        email: 'admin@example.com',
        permission: 'view'
      };
      
      await request
        .post('/documents/999/share') // Non-existent document
        .set('Authorization', `Bearer ${adminToken}`)
        .send(shareData)
        .expect(404);
      
      // User trying to share admin's document
      await request
        .post('/documents/1/share')
        .set('Authorization', `Bearer ${userToken}`)
        .send(shareData)
        .expect(404);
    });
  });
  
  describe('DELETE /documents/:id', () => {
    it('should delete a document if user is the owner', async () => {
      // Create a document to delete
      const newDoc = await prisma.document.create({
        data: {
          title: 'Document to Delete',
          content: 'This document will be deleted',
          owner_id: mockUsers[1].id,
          version: 1
        }
      });
      
      await request
        .delete(`/documents/${newDoc.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(204);
      
      // Verify document was deleted
      const deletedDoc = await prisma.document.findUnique({
        where: { id: newDoc.id }
      });
      
      expect(deletedDoc).toBeNull();
    });
    
    it('should return 404 if document not found', async () => {
      await request
        .delete('/documents/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
    
    it('should return 404 if user is not the owner', async () => {
      // Try to delete admin's document as regular user
      await request
        .delete('/documents/1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });
});