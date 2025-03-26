import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Auth Routes
app.use('/auth', authRouter);
app.use('/', (req, res) => {
    res.send('Welcome to real-time document editor.')
});

// Users routes
app.get('/users', () => {});
app.delete('/users/:id', () => {});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'http://localhost';
app.listen(PORT, () => {
    console.log(`Server running at ${HOST}:${PORT}`);
});