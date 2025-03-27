import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import documentRouter from './routes/document.js';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import userRouter from './routes/users.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { engine: '*' } });

io.on('connection', (socket) => {
    socket.on('join-document', () => {
        socket.join(documentId);
    });

    socket.on('document-update', ({ documentId, content }) => {
        // Broadcast the updates to all clients in the document room
        socket.to(documentId).emit('document-update', content);
    });
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

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'http://localhost';
httpServer.listen(PORT, () => {
    console.log(`Server running at ${HOST}:${PORT}`);
});