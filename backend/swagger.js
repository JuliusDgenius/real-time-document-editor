import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Real-Time Document Editor API",
      version: "1.0.0",
      description: "API for collaborative document editing",
    },
    servers: [
      { url: "http://localhost:3000", description: "Local server" },
      { url: "https://my-live-demo.vercel.app", description: "Production server" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "integer" },
            email: { type: "string" },
            role: { type: "string", enum: ["ADMIN", "USER"] },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        Document: {
          type: "object",
          properties: {
            id: { type: "integer" },
            title: { type: "string" },
            content: { type: "string" },
            version: { type: "integer" },
            owner_id: { type: "integer" },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        Token: {
          type: "object",
          properties: {
            token: { type: "string" }
          }
        },
        Login: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", format: "password" }
          }
        },
        DocumentCreate: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string" },
            content: { type: "string" }
          }
        },
        DocumentUpdate: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            version: { type: "integer" }
          }
        },
        ShareRequest: {
          type: "object",
          required: ["email", "permission"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com"
            },
            permission: {
              type: "string",
              enum: ["view", "edit"],
              example: "edit"
            }
          }
        }
      }
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ["routes/*.js"], // Routes path
};

const specs = swaggerJSDoc(options);

export { swaggerUi, specs };