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

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User registration and login
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
  *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123!
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Token'
 *       400:
 *         description: Invalid input
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login existing user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Token'
 *       401:
 *         description: Invalid credentials
 */
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

        // check if email already exists in the system
        const existingUser = await prisma.user.findFirst({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: "Email already exists" });
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

        const { password_hash, ...userNoPass } = user;

        res.status(201).json(userNoPass);
    } catch (error) {
        res.status(400).json({ error: "Registration failed." });
    }
});

authRouter.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!password) {
        return res.status(400).json({ error: "Password required" });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({ error: "Email missing or invalid format" });
    }

    // Find user
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        return res.status(401).json({ error: "Invalid credentials." });
    }

    // Verify password, if user is present
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials." });
    }

    // Generate token
    const token = await generateToken(user);
    res.json({ token });
});

export default authRouter;