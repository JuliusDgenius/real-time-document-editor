import { Server } from 'socket.io';
import jwt from 'jsonwebtoken'
import prisma from './prismaClient.js';

let io;

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  // Socket.io middleware for auth
  io.use((socket, next) => {
    // Extract token from query params
    const token = socket.handshake.query.token;

    if (!token) {
      socket.emit("auth-error", "No token provided");
      return next(new Error("Authentication error: No token provided"));
    }

    // Verify JWT token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        socket.emit("auth-error", "Invalid token")
        return next(new Error("Authentication error: Invalid token"));
      }

      // Attach the user to the socket object
      socket.user = decoded;
      next() // Hand control to connection
    });
  });

  io.on('connection', (socket) => {
    console.log("Client connected:", socket.id);

    // Add a user to a room named after their userId, to allow me
    // exclude the user from getting own update in HTTP context.
    socket.join(`user_${socket.user.id}`);

    socket.on('disconnect', (reason) => {
      console.log("Client: disconnected", socket.id, "reason", reason);
    });
  
    socket.on('error', (error) => {
      console.log("Socket error:", error);
    });
    
    // join a document room
    socket.on('join-document', (documentId) => {
      socket.join(documentId);
      console.log(`Client ${socket.id} joined document ${documentId}`);
    });

    // Listen for document edits
    socket.on('document-edit', async ({ documentId, title, content, version }) => {
      try {
        // Validate version to handle conflict (A basic conflict resolution)
        const document = await prisma.document.findUnique({
            where: { id: documentId }
        });

        // Reject stale updates
        if (document.version !== version) {
            socket.emit("conflict-error", "document has been updated elsewhere");
            return;
        }

        // Update document in DB
        const updatedDoc = await prisma.document.update({
            where: { id: documentId },
            data: { title, content, version: version + 1 }
        });

        // Broadcast changes to all clients in the room, except the sender
        socket.to(documentId).emit('document-update', {
            title: updatedDoc.title,
            content: updatedDoc.content,
            version: updatedDoc.version
        });
      } catch (error) {
        socket.emit('error', 'Failed to sync changes', error.message);
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
};