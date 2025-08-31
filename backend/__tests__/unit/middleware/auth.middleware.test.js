import { jest, describe, it, expect } from '@jest/globals';
import { authenticateToken, authorizeRole } from '../../../middleware/auth.js';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
  describe('authenticateToken', () => {
    it('should call next() with valid token', () => {
      // Create a valid token
      const user = { id: 1, role: 'USER' };
      const token = jwt.sign(user, process.env.JWT_SECRET);
      
      const req = {
        header: jest.fn().mockReturnValue(`Bearer ${token}`)
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      authenticateToken(req, res, next);
      
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(user.id);
      expect(req.user.role).toBe(user.role);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 if no token provided', () => {
      const req = {
        header: jest.fn().mockReturnValue(null)
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String)
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid token', () => {
      const req = {
        header: jest.fn().mockReturnValue('Bearer invalidtoken')
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String)
      }));
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorizeRole', () => {
    it('should call next() if user has required role', () => {
      const req = {
        user: { id: 1, role: 'ADMIN' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      const middleware = authorizeRole('ADMIN');
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 if user lacks required role', () => {
      const req = {
        user: { id: 1, role: 'USER' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      const middleware = authorizeRole('ADMIN');
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String)
      }));
      expect(next).not.toHaveBeenCalled();
    });
  });
});