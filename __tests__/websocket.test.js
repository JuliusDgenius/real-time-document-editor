import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import io from 'socket.io-client';
import { app } from '../app.js';
import jwt from 'jsonwebtoken';
import { mockUsers } from './fixtures/mock-data.js';
import { mockPrisma as prisma } from './fixtures/test-utils.js';

// Increase test timeout for WebSocket tests
jest.setTimeout(60000);

// Keep track of active clients for cleanup
let activeClients = [];

let httpServer;
let validToken;

beforeAll(async () => {
  validToken = jwt.sign({ id: mockUsers[0].id, role: mockUsers[0].role }, process.env.JWT_SECRET);
  
  return new Promise((resolve) => {
    httpServer = app.listen(3001, () => {
      console.log('Test server started on port 3001');
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise((resolve) => {
    // Clean up any remaining clients
    activeClients.forEach(client => {
      if (client.connected) {
        client.disconnect();
      }
    });
    activeClients = [];

    // Close server
    httpServer.close(() => {
      console.log('Test server closed');
      resolve();
    });
  });
});

beforeEach(async () => {
  // Reset mocks
  jest.clearAllMocks();
  prisma.document.findUnique.mockResolvedValue({ id: 'test-doc-1', version: 1 });
  prisma.document.update.mockImplementation(async ({ data }) => ({ ...data }));
});

describe('WebSocket Connections', () => {
  afterEach(() => {
    // Clean up all active clients
    activeClients.forEach(client => {
      if (client.connected) {
        client.disconnect();
      }
    });
    activeClients = [];
  });
  test('should connect with valid token', (done) => {
    const client = io('http://localhost:3001', {
      forceNew: true,
      auth: { token: validToken },
      reconnection: false,
      timeout: 5000
    });

    activeClients.push(client);
    client.on('connect', () => {
      expect(client.connected).toBe(true);
      client.disconnect();
      done();
    });

    client.on('connect_error', (error) => {
      done(error);
    });
  });

  test('should reject connection with invalid token', (done) => {
    const client = io('http://localhost:3001', {
      forceNew: true,
      auth: { token: 'invalid-token' },
      reconnection: false,
      timeout: 5000
    });

    client.on('connect_error', (error) => {
      expect(error.message).toBe('Authentication error');
      client.disconnect();
      done();
    });

    client.on('connect', () => {
      client.disconnect();
      done(new Error('Should not connect with invalid token'));
    });
  });
});

describe('Document Collaboration', () => {
  test('should handle real-time document updates', (done) => {
    const client = io('http://localhost:3001', {
      forceNew: true,
      auth: { token: validToken },
      reconnection: false,
      timeout: 5000
    });

    activeClients.push(client);
    client.on('connect', () => {
      client.emit('join-document', 'test-doc-1');
      client.emit('document-edit', {
        documentId: 'test-doc-1',
        content: 'Test content',
        version: 1
      });
    });

    client.on('document-update', (data) => {
      expect(data.content).toBe('Test content');
      expect(data.version).toBe(2);
      client.disconnect();
      done();
    });

    client.on('connect_error', (error) => {
      client.disconnect();
      done(error);
    });

    client.on('error', (error) => {
      client.disconnect();
      done(error);
    });
  });

  test('should handle document version conflicts', (done) => {
    const client = io('http://localhost:3001', {
      forceNew: true,
      auth: { token: validToken },
      reconnection: false,
      timeout: 5000
    });

    activeClients.push(client);
    client.on('connect', () => {
      client.emit('join-document', 'test-doc-2');
      client.emit('document-edit', {
        documentId: 'test-doc-2',
        content: 'Conflicting content',
        version: 999 // Wrong version
      });
    });

    client.on('error', (error) => {
      expect(error.message).toContain('Version conflict');
      client.disconnect();
      done();
    });

    client.on('connect_error', (error) => {
      client.disconnect();
      done(error);
    });
  });

  test('should notify other clients when a user joins', (done) => {
    const client1 = io('http://localhost:3001', {
      forceNew: true,
      auth: { token: validToken }
    });

    const client2 = io('http://localhost:3001', {
      forceNew: true,
      auth: { token: validToken }
    });

    activeClients.push(client1);
    client1.on('connect', () => {
      client1.emit('join-document', 'test-doc-3');
    });

    client2.on('user-joined', (data) => {
      expect(data.documentId).toBe('test-doc-3');
      expect(data.userId).toBeDefined();
      client1.disconnect();
      client2.disconnect();
      done();
    });

    activeClients.push(client2);
    client2.on('connect', () => {
      client2.emit('join-document', 'test-doc-3');
    });
  });

  test('should handle disconnection gracefully', (done) => {
    const client1 = io('http://localhost:3001', {
      forceNew: true,
      auth: { token: validToken }
    });

    const client2 = io('http://localhost:3001', {
      forceNew: true,
      auth: { token: validToken }
    });

    activeClients.push(client1);
    client1.on('connect', () => {
      client1.emit('join-document', 'test-doc-4');
    });

    client2.on('user-left', (data) => {
      expect(data.documentId).toBe('test-doc-4');
      expect(data.userId).toBeDefined();
      client2.disconnect();
      done();
    });

    activeClients.push(client2);
    client2.on('connect', () => {
      client2.emit('join-document', 'test-doc-4');
      // Once both clients are in the room, disconnect client1
      setTimeout(() => client1.disconnect(), 100);
    });
  });
});