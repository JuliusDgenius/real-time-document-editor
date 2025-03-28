import express from 'express';
import prisma from '../prismaClient.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js'
import { Permission } from '@prisma/client';
import { io } from '../app.js';

const documentRouter = express.Router();

// Create a document
documentRouter.post('/create-document', authenticateToken, async (req, res) => {
    try {
      const { title, content } = req.body;
      const existingDocument = await prisma.document.findFirst({
        where: {title}
      })

      if (existingDocument) {
        return res.status(409).json({ error: "Conflict: document already exist" });
      }

      const document = await prisma.document.create({
        data: {
          title: title,
          content: content || '',
          owner_id: req.user.id
        }
    });
    res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ error: "Document creation failed" });
    }   
});

// Get all documents, both owned and shared
documentRouter.get('/documents', authenticateToken, async (req, res) => {
  const documents = await prisma.document.findMany({
    where: {
        OR: [
            { owner_id: req.user.id },
            { sharedWith: { some: { user_id: req.user.id }} } // shared with user
        ]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
    }
  })
  res.status(200).json(documents);
});

// Get a single document
documentRouter.get('/:id', authenticateToken, async (req, res) => {
    const document = await prisma.document.findUnique({
        where: {
            id: parseInt(req.params.id),
            OR: [
              { owner_id: req.user.id },
              { sharedWith: { some: { user_id: req.user.id } } }
            ]
        },
        include: { sharedWith: true }, // This includes sharing detail
    });
    
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.status(200).json(document);
  });

  // Update a document (owner or edit-permission users)
  documentRouter.put('/edit/:id', authenticateToken, async (req, res) => {
    // Check permissin first
    const document = await prisma.document.findFirst({
      where: {
        id: parseInt(req.params.id),
        OR: [
          { owner_id: req.user.id },
          { sharedWith: { some: { user_id: req.user.id, permission: Permission.edit } } },
        ]
      }
    });

    if (!document) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Check version to help with basic conflict resolution
    if (document.version !== req.body.version) {
      return res.status(409).json({ error: "Document version mismatch" });
    }

    const updatedDoc = await prisma.document.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title: req.body.title,
        content: req.body.content,
        version: req.body.version + 1
      }
    });

    // Broadcast changes via WebSocket
    io.to(req.params.id).emit('document-update', updatedDoc.content);

    res.json(updatedDoc);
  });

  // Delete a document
  documentRouter.delete('/:id', authenticateToken, async (req, res) => {
    const document = await prisma.document.findFirst({
      where: { id: parseInt(req.params.id), owner_id: req.user.id }
    })
    if (!document) {
        return res.status(404).json({ error: "Document not found" });
    }

    const deletedTitle = document.title;

    await prisma.document.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.status(204).end();
  });

  // Share document with other users
  documentRouter.post('/:id/share', authenticateToken, async (req, res) => {
    const { email, permission } = req.body;
    if (!email || !permission) {
      return res.status(400).json({ error: "No email or permission provided" })
    }

    // Verify document ownership
    const document = await prisma.document.findFirst({
      where: {
        id: parseInt(req.params.id),
        owner_id: req.user.id
      }
    });
    if (!document) {
      return res.status(404).json({ error: "No document found" });
    }

    // Find the user to share to
    const targetUser = await prisma.user.findUnique({
      where: { email }
    });
    if (!targetUser) {
      return res.status(404).json({ error: "No user found" });
    }

    // Create share
    await prisma.documentShare.upsert({
      where: {
        document_id_user_id: { document_id: document.id, user_id: targetUser.id }
      },
      update: { permission },
      create: { document_id: document.id, user_id: targetUser.id, permission }
    });

    res.status(201).json({ message: "Document shared successfully" });
  });

  export default documentRouter;