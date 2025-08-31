import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import { mockPrisma } from '../__tests__/fixtures/test-utils.js';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set up global jest object
global.jest = jest;

// Set a fixed JWT secret for testing
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

// Reset all mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});

// Mock prisma
await jest.isolateModules(async () => {
  await import('../prismaClient.js');
});
