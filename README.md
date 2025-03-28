# Real-Time Collaborative Document Editor

## Project Overview

This project is a Backend Developer Take-Home Assessment designed to build a real-time collaborative document editing system. The system allows multiple users to simultaneously edit documents, focusing on scalability, concurrency handling, and secure API design.

## Duration

- Project Duration: 3 Days

## Objective

The primary objective of this project is to create a backend system that supports real-time collaborative editing of documents. Key focus areas include:

- Scalability: Ensure the system can handle a large number of concurrent users and document edits.
- Concurrency Handling: Implement mechanisms to manage simultaneous edits by multiple users without conflicts.
- Secure API Design: Design APIs that are secure and protect user data and document integrity.

## Features

- Real-time document editing with multiple users.
- User authentication and authorization.
- Secure API endpoints for document operations.
- Admin only user manaagement endpoints
- Efficient concurrency management to handle simultaneous edits.

## Technologies Used

- Node.js: NodeJS runtime for building the server-side application.
- Express.js: Web framework for handling HTTP requests and routing.
- Socket.io: Library for enabling real-time, bidirectional communication between clients and server.
- Prisma: ORM for database management and operations.
- JSON Web Tokens (JWT): For secure user authentication.
- Bcrypt: For password hashing and security.

## Getting Started

### Prerequisites

- Node.js and npm installed on your machine.
- A database setup (PostgreSQL) for storing user and document data.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/JuliusDgenius/real-time-collab-docu-editor.git
   cd real-time-collab-docu-editor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory.
   - Add necessary environment variables (e.g., database connection string, JWT secret).

4. Run the application:
   ```bash
   npm start
   ```

### API Endpoints

- POST /auth/register: Register a new user.
- POST /auth/login: Authenticate a user and return a JWT.
- GET /users: Retrieve a list of users.
- DELETE /users/:id: Delete a user by ID.

- POST /documents/create-document: Creates a document.
- POST /documents/:id/share: Share a document with another user
- GET /documents/documents: Gets all documents.
- GET /documents/:id: Get a single document by document id.
- PUT /documents/edit/:id: Edit a document.
- DELETE /document/:id: Deletes a document by id, owned by user

## WebSocket Endpoints
- Test with Postman or nodeJS script with socket.io-client

- **Connection URL**: `http://localhost:3000`
- **Required Headers**:
  ```json
  { "Authorization": "Bearer <JWT_TOKEN>" }

## API Documentation
- Interactive Docs: [Live Swagger UI](http://localhost:3000/api-docs)
- OpenAPI Spec: [openapi.json](./openapi.json)

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the ISC License.

## Author

- Julius Ibe

## Contact
[LinkedIn](https://www.linkedin.com/in/julius-ibe)