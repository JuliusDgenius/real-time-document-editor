import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import documentRouter from './routes/document.js';
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Auth Routes
app.use('/auth', authRouter);

// Users routes
app.get('/users', () => {});
app.delete('/users/:id', () => {});

// Document routes
app.use('/documents', documentRouter);

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'http://localhost';
app.listen(PORT, () => {
    console.log(`Server running at ${HOST}:${PORT}`);
});