import express from 'express';
import { Role } from '@prisma/client';
import prisma from '../prismaClient.js';
import { validateEmail } from '../utils/validate-email.js';
import {
    comparePassword,
    generateToken,
    hashPassword
} from '../utils/auth.js';

const authRouter = express.Router();

// Register user
authRouter.post('/register', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!password) {
        return res.status(400).json({ error: "Password required" });
      }

    // validate email
    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Email missing or invalid format" });
    }

    // check if email already exist in the system
      const existingUser = await prisma.user.findFirst({ where: {email} });
      if (existingUser) {
        res.status(409).json({ error: "Email already exists" });
      }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // create the user
    const user = await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        role: Role.USER // default to USER role
      },
    });

     const {password_hash, ...userNoPass} = user;

    res.status(201).json(userNoPass);
    } catch (error) {
      res.status(400).json({ error: "Registration failed." })
    }
});

// Login user
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password required" })
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: "Email missing or invalid format" })
  }

// Find user
const user = await prisma.user.findUnique({
    where: { email }
});

if (!user) {
  return res.status(401).json({ error: "Invalid credentials." });
}

// Verify password, if user is presnt
const isValid = await comparePassword(password, user.password_hash);
if (!isValid) {
    return res.status(401).json({ error: "Invalid credentials."});
}

// Generate token
const token = await generateToken(user);
res.json({ token });
});

export default authRouter;