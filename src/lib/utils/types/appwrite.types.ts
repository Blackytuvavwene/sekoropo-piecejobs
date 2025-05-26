// Appwrite client and service types

import type { Models } from 'appwrite';

// Extended User type combining Appwrite user with profile
export interface AppwriteUser extends Models.User<Models.Preferences> {
  profile?: import('./database.types').Profile;
}

// Authentication state
export interface AuthState {
  isAuthenticated: boolean;
  user: AppwriteUser | null;
  profile: import('./database.types').Profile | null;
  loading: boolean;
  error: string | null;
}

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  documents: T[];
  total: number;
  limit: number;
  offset: number;
}

// Query options
export interface QueryOptions {
  queries?: string[];
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

// File upload options
export interface FileUploadOptions {
  file: File;
  fileId?: string;
  onProgress?: (progress: number) => void;
}

export interface FileUploadResult {
  $id: string;
  name: string;
  signature: string;
  mimeType: string;
  sizeOriginal: number;
}
