const express = require('express');
const app = express();
const PORT = 3000;
const HOST = 'http://localhost'

// Middleware
app.use(express.json());

// Auth Routes
app.post('/auth/register', (req, res) => {
    res.send('You are registered');
});

app.post('/auth/login', (req, res) => {
    res.send('You are logged in');
});

// Users routes
app.get('/users', () => {});
app.delete('/users/:id', () => {});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at ${HOST}:${PORT}`);
});