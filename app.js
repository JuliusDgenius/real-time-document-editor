import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import documentRouter from './routes/document.js';
import { io } from './server.js';
import userRouter from './routes/users.js';
import prisma from './prismaClient.js';
import { swaggerUi, specs } from './swagger.js';

export const app = express();

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Serve OpenAPI spec as JSON
app.get('/api-docs-json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

// Middleware
app.use(cors());
app.use(express.json());

// Auth Routes
app.use('/auth', authRouter);

// Document routes
app.use('/documents', documentRouter);

// Users routes 
app.use('/users', userRouter);
