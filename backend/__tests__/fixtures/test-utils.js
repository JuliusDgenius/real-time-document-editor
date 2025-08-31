import { jest } from '@jest/globals';
import { app } from '../../app.js';
import supertest from 'supertest';
import { mockUsers, mockDocuments, mockShares } from './mock-data.js';
import bcrypt from 'bcrypt';

// Create mock functions
export const mockPrisma = {
  user: {
    create: jest.fn(),
    deleteMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    delete: jest.fn()
  },
  document: {
    create: jest.fn(),
    deleteMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  documentShare: {
    create: jest.fn(),
    deleteMany: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn()
  }
};

// Export request helper
export const request = supertest(app);

// Setup the test database with mock data
export const setupTestDB = async () => {
  // Reset all mock implementations
  Object.values(mockPrisma).forEach(model => {
    Object.values(model).forEach(method => {
      method.mockReset();
    });
  });

  // Setup default mock implementations
  mockPrisma.user.findFirst.mockResolvedValue(null);
  mockPrisma.user.findUnique.mockResolvedValue(null);
  mockPrisma.user.findMany.mockResolvedValue([]);
  mockPrisma.user.count.mockResolvedValue(0);
  mockPrisma.user.delete.mockResolvedValue(null);

  mockPrisma.document.findFirst.mockResolvedValue(null);
  mockPrisma.document.findUnique.mockResolvedValue(null);
  mockPrisma.document.findMany.mockResolvedValue([]);
  mockPrisma.document.update.mockResolvedValue(null);
  mockPrisma.document.delete.mockResolvedValue(null);

  mockPrisma.documentShare.findFirst.mockResolvedValue(null);
  mockPrisma.documentShare.findMany.mockResolvedValue([]);
  mockPrisma.documentShare.delete.mockResolvedValue(null);

  // Mock successful deletions
  mockPrisma.documentShare.deleteMany.mockResolvedValue({ count: 0 });
  mockPrisma.document.deleteMany.mockResolvedValue({ count: 0 });
  mockPrisma.user.deleteMany.mockResolvedValue({ count: 0 });

  // Create test users with properly hashed passwords
  for (const user of mockUsers) {
    mockPrisma.user.create.mockResolvedValueOnce({
      id: user.id,
      email: user.email,
      password_hash: await bcrypt.hash(user.password, 10),
      role: user.role
    });
  }

  // Create test documents
  for (const doc of mockDocuments) {
    mockPrisma.document.create.mockResolvedValueOnce(doc);
  }

  // Create test document shares
  for (const share of mockShares) {
    mockPrisma.documentShare.create.mockResolvedValueOnce(share);
  }
};

// Tear down the test database
export const teardownTestDB = async () => {
  // Reset all mock implementations
  Object.values(mockPrisma).forEach(model => {
    Object.values(model).forEach(method => {
      method.mockReset();
    });
  });

  // Mock successful deletions
  mockPrisma.documentShare.deleteMany.mockResolvedValue({ count: 0 });
  mockPrisma.document.deleteMany.mockResolvedValue({ count: 0 });
  mockPrisma.user.deleteMany.mockResolvedValue({ count: 0 });
};

// Mock the socket.io instance
export const mockIO = {
  to: jest.fn().mockReturnThis(),
  except: jest.fn().mockReturnThis(),
  emit: jest.fn()
};