import { request, setupTestDB, teardownTestDB } from '../fixtures/test-utils.js';
import prisma from '../../prismaClient.js';
import jwt from 'jsonwebtoken';

describe('Auth Routes', () => {
  // Set up and tear down the test database before and after tests
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('POST /auth/register', () => {
    it('should register a new user and return token', async () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'password123'
      };

      const response = await request
        .post('/auth/register')
        .send(newUser)
        .expect(201);

      // Verify response structure
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(newUser.email);
      expect(response.body.user.password_hash).toBeUndefined(); // Should not return password

      // Verify token is valid
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.id).toBeDefined();
      expect(decoded.role).toBe('USER');

      // Verify user was created in DB
      const createdUser = await prisma.user.findUnique({
        where: { email: newUser.email }
      });
      expect(createdUser).toBeDefined();
    });

    it('should reject registration with invalid email', async () => {
      const invalidUser = {
        email: 'notanemail',
        password: 'password123'
      };

      const response = await request
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should reject registration with existing email', async () => {
      const existingUser = {
        email: 'user@example.com', // This email is already in the mock data
        password: 'password123'
      };

      const response = await request
        .post('/auth/register')
        .send(existingUser)
        .expect(409);

      expect(response.body.error).toBeDefined();
    });

    it('should reject registration without password', async () => {
      const userWithoutPassword = {
        email: 'valid@example.com'
      };

      const response = await request
        .post('/auth/register')
        .send(userWithoutPassword)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /auth/login', () => {
    it('should login existing user and return token', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'password123'
      };

      const response = await request
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.token).toBeDefined();

      // Verify token is valid
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(2); // From our mock data
      expect(decoded.role).toBe('USER');
    });

    it('should reject login with wrong password', async () => {
      const wrongPassword = {
        email: 'user@example.com',
        password: 'wrongpassword'
      };

      const response = await request
        .post('/auth/login')
        .send(wrongPassword)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should reject login with non-existent email', async () => {
      const nonExistentUser = {
        email: 'doesnotexist@example.com',
        password: 'password123'
      };

      const response = await request
        .post('/auth/login')
        .send(nonExistentUser)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should reject login with invalid email format', async () => {
      const invalidEmail = {
        email: 'notemail',
        password: 'password123'
      };

      const response = await request
        .post('/auth/login')
        .send(invalidEmail)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });
});