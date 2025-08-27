import api from './api';
import {
  Document,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  ShareDocumentRequest,
} from '@/types/document';

export const documentService = {
  async createDocument(data: CreateDocumentRequest): Promise<Document> {
    const response = await api.post('/documents/create-document', data);
    return response.data;
  },

  async getDocuments(): Promise<Document[]> {
    const response = await api.get('/documents/documents');
    return response.data;
  },

  async getDocument(id: number): Promise<Document> {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  async updateDocument(id: number, data: UpdateDocumentRequest): Promise<Document> {
    const response = await api.put(`/documents/edit/${id}`, data);
    return response.data;
  },

  async deleteDocument(id: number): Promise<void> {
    await api.delete(`/documents/${id}`);
  },

  async shareDocument(id: number, data: ShareDocumentRequest): Promise<{ message: string }> {
    const response = await api.post(`/documents/${id}/share`, data);
    return response.data;
  },
};
