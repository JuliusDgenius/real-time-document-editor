import { createServer } from 'node:http';
import { app } from './app.js';
import { initializeSocket } from './socket.js';

const httpServer = createServer(app); // Create a HTTP server
export const io = initializeSocket(httpServer);

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'http://localhost';
httpServer.listen(PORT, () => {
    console.log(`Server running at ${HOST}:${PORT}`);
});

// Graceful shut down mech
process.on('SIGTERM', () => {
    httpServer.close(() => {
        console.log('Server closed');
    });
});