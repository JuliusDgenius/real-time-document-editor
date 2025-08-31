import { hashPassword, comparePassword, generateToken } from '../../../utils/auth.js';
import jwt from 'jsonwebtoken';

describe('Auth utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'password123';
      const hashedPassword = await hashPassword(password);
      
      // Hash should be a string and different from original
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'password123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      // Bcrypt should use random salts
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'password123';
      const hashedPassword = await hashPassword(password);
      
      const isMatch = await comparePassword(password, hashedPassword);
      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'password123';
      const wrongPassword = 'wrongpassword';
      const hashedPassword = await hashPassword(password);
      
      const isMatch = await comparePassword(wrongPassword, hashedPassword);
      expect(isMatch).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', async () => {
      const user = { id: 1, role: 'USER' };
      const token = await generateToken(user);
      
      // Token should be a string
      expect(typeof token).toBe('string');
      
      // Should be verifiable
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(user.id);
      expect(decoded.role).toBe(user.role);
    });

    it('should include the correct user data in token', async () => {
      const user = { id: 5, role: 'ADMIN' };
      const token = await generateToken(user);
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(5);
      expect(decoded.role).toBe('ADMIN');
    });
  });
});