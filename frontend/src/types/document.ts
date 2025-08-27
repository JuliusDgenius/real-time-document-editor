export interface Document {
  id: number;
  title: string;
  content: string;
  version: number;
  createdAt: string;
  owner_id: number;
  owner?: User;
  sharedWith?: DocumentShare[];
}

export interface DocumentShare {
  document_id: number;
  user_id: number;
  permission: 'view' | 'edit';
  user?: User;
}

export interface CreateDocumentRequest {
  title: string;
  content?: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
  version: number;
}

export interface ShareDocumentRequest {
  email: string;
  permission: 'view' | 'edit';
}

export enum Permission {
  VIEW = 'view',
  EDIT = 'edit'
}

export interface DocumentUpdate {
  title: string;
  content: string;
  version: number;
}

// Re-export User type to avoid circular dependencies
import { User } from './user';
