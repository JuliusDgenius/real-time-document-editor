import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import documentRouter from './routes/document.js';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import userRouter from './routes/users.js';
import prisma from './prismaClient.js';

const app = express();
const httpServer = createServer(app); // Create a HTTP server
export const io = new Server(httpServer, {
    cors: { engine: '*' // Allow all origins for now
    }
});

// Handle document rooms and real-time updates
io.on('connection', (socket) => {
    console.log("Client connected:", socket.id);
    
    // join a document room
    socket.on('join-document', (documentId) => {
        socket.join(documentId);
        console.log(`Client ${socket.id} joined document ${documentId}`);;
    });

    // Listen for document edits
    socket.on('document-edit', async ({ documentId, content, version }) => {
      try {
        // Validate version to handle conflict (A basic conflict resolution)
        const document = await prisma.document.findUnique({
            where: { id: documentId }
        });

        // Reject stale updates
        if (document.version !== version) {
            socket.emit("conflict-error, document has been updated elsewhere");
            return;
        }

        // Update document in DB
        const updatedDoc = await prisma.document.update({
            where: { id: documentId },
            data: { content, version: version + 1 }
        });

        // Broadcast changes to all clients in the room, except the sender
        socket.to(documentId).emit('document-update', {
            content: updatedDoc.content,
            version: updatedDoc.version
        });
      } catch (error) {
        socket.emit('error', 'Failed to sync changes', error.message);
      }
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