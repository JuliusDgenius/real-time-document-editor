import { create } from 'zustand';
import { Document, CreateDocumentRequest, UpdateDocumentRequest, ShareDocumentRequest } from '@/types/document';
import { documentService } from '@/services/documents';

interface DocumentState {
  documents: Document[];
  currentDocument: Document | null;
  isLoading: boolean;
  error: string | null;
}

interface DocumentActions {
  fetchDocuments: () => Promise<void>;
  getDocument: (id: number) => Promise<Document>;
  createDocument: (data: CreateDocumentRequest) => Promise<Document>;
  updateDocument: (id: number, data: UpdateDocumentRequest) => Promise<Document>;
  deleteDocument: (id: number) => Promise<void>;
  shareDocument: (id: number, data: ShareDocumentRequest) => Promise<void>;
  setCurrentDocument: (document: Document | null) => void;
  clearError: () => void;
  clearDocuments: () => void;
}

type DocumentStore = DocumentState & DocumentActions;

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  // State
  documents: [],
  currentDocument: null,
  isLoading: false,
  error: null,

  // Actions
  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const documents = await documentService.getDocuments();
      set({ documents, isLoading: false });
    } catch (error: any) {
      set({
        error: error.error || 'Failed to fetch documents',
        isLoading: false,
      });
      throw error;
    }
  },

  getDocument: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const document = await documentService.getDocument(id);
      set({ currentDocument: document, isLoading: false });
      return document;
    } catch (error: any) {
      set({
        error: error.error || 'Failed to fetch document',
        isLoading: false,
      });
      throw error;
    }
  },

  createDocument: async (data: CreateDocumentRequest) => {
    set({ isLoading: true, error: null });
    try {
      const newDocument = await documentService.createDocument(data);
      set((state) => ({
        documents: [newDocument, ...state.documents],
        isLoading: false,
      }));
      return newDocument;
    } catch (error: any) {
      set({
        error: error.error || 'Failed to create document',
        isLoading: false,
      });
      throw error;
    }
  },

  updateDocument: async (id: number, data: UpdateDocumentRequest) => {
    set({ isLoading: true, error: null });
    try {
      const updatedDocument = await documentService.updateDocument(id, data);
      set((state) => ({
        documents: state.documents.map((doc) =>
          doc.id === id ? updatedDocument : doc
        ),
        currentDocument: state.currentDocument?.id === id ? updatedDocument : state.currentDocument,
        isLoading: false,
      }));
      return updatedDocument;
    } catch (error: any) {
      set({
        error: error.error || 'Failed to update document',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteDocument: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await documentService.deleteDocument(id);
      set((state) => ({
        documents: state.documents.filter((doc) => doc.id !== id),
        currentDocument: state.currentDocument?.id === id ? null : state.currentDocument,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.error || 'Failed to delete document',
        isLoading: false,
      });
      throw error;
    }
  },

  shareDocument: async (id: number, data: ShareDocumentRequest) => {
    set({ isLoading: true, error: null });
    try {
      await documentService.shareDocument(id, data);
      // After successfully sharing, re-fetch the document to get updated sharing details
      await get().getDocument(id); 
    } catch (error: any) {
      set({
        error: error.error || 'Failed to share document',
        isLoading: false,
      });
      throw error;
    }
  },

  setCurrentDocument: (document: Document | null) => {
    set({ currentDocument: document });
  },

  clearError: () => set({ error: null }),

  clearDocuments: () => set({ documents: [], currentDocument: null }),
}));
