import express from 'express';
import prisma from '../prismaClient.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js'
import { Permission } from '@prisma/client';
import { getIO } from '../socket.js';
import { version } from '@babel/core';

const documentRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Document management
 */

/**
 * @swagger
 * /documents/create-document:
 *  post:
 *     summary: Create new document
 *     tags: [Documents]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentCreate'
 *     responses:
 *       201:
 *         description: Document created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 */
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

/**
 * @swagger
 * /documents/documents:
 *   get:
 *     summary: Get all accessible documents
 *     tags: [Documents]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of documents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Document'
 */
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

/**
 * @swagger
 * /documents/{id}:
 *   get:
 *     summary: Get document by ID
 *     tags: [Documents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Document details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 *       403:
 *         description: Unauthorized access
 */
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

  /**
  * @swagger
  * /documents/edit/{id}:
 *   put:
 *     summary: Update document content
 *     tags: [Documents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentUpdate'
 *     responses:
 *       200:
 *         description: Updated document
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 *       409:
 *         description: Version conflict
 * 
 */
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
    const io = getIO();
    const userId = req.user.id;
    io.to(parseInt(req.params.id))
    .except(`user_${userId}`) // exclude user from getting own broadcast
    .emit('document-update', {
      title: updatedDoc.title,
      content: updatedDoc.content,
      version: updatedDoc.version
    });

    res.json(updatedDoc);
  });

  /**
 * @swagger
 * /documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     tags: [Documents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the document to delete
 *     responses:
 *       204:
 *         description: Document deleted successfully
 *       403:
 *         description: Not document owner
 *       404:
 *         description: Document not found
 */
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

  /**
 * @swagger
 * /documents/{id}/share:
 *   post:
 *     summary: Share document with another user via email
 *     tags: [Documents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the document to share
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShareRequest'
 *     responses:
 *       201:
 *         description: Document shared successfully
 *       400:
 *         description: Invalid input (e.g., invalid permission)
 *       403:
 *         description: User is not the document owner
 *       404:
 *         description: Target user not found
 */
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

    if (targetUser.id === req.user.id) {
      return res.status(400).json({ error: "You cannot share a document with yourself." });
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