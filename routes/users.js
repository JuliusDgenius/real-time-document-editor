import express from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import prisma from '../prismaClient.js';
import { Role } from '@prisma/client';

const userRouter = express.Router();

// Get all users (Admin only)
userRouter.get(
    '/users',
    authenticateToken,
    authorizeRole('ADMIN'),
    async (req, res) => {
      try {
        const users = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true
          }
        });
        res.json(users);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch users", details: error.message })
      }
});

// Delete a user (Admin only)
userRouter.delete(
    '/:id',
    authenticateToken, authorizeRole('ADMIN'),
    async (req, res) => {
      try {
        const userId = parseInt(req.params.id);
        if (!userId) return res.status(400).json({ error: "userId is required" });

        // Check that user is not admin
        if (userId === req.user.id) {
          return res.status(403).json({ error: "Admins cannot delete themselves" });
        }

        const deletedUser = await prisma.user.delete({
          where: { id: userId }
        });
        res.status(204).end();
      } catch (error) {
        if (error.code === 'P2025') {
          return res.status(404).json({ error: "User not found" });
        }
        res.status(500).json({ error: "Failed to delete user", details: error.message });
      }
  }); 

export default userRouter;