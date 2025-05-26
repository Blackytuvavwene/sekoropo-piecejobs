// File service for handling uploads and storage
import { storage } from '$lib/appwrite/appwrite-client';
import type { ApiResponse } from '$lib/utils/types';
import { ID } from 'appwrite';

const BUCKETS = {
  AVATARS: 'avatars',
  JOB_IMAGES: 'job_images',
  DOCUMENTS: 'documents',
  EVIDENCE: 'evidence'
} as const;

export class FileService {
  // Upload avatar image
  static async uploadAvatar(file: File, userId: string): Promise<ApiResponse<{ fileId: string; url: string }>> {
    try {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return {
          success: false,
          error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.'
        };
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        return {
          success: false,
          error: 'File size too large. Please upload an image smaller than 5MB.'
        };
      }

      const fileId = `avatar_${userId}_${Date.now()}`;
      const uploadedFile = await storage.createFile(BUCKETS.AVATARS, fileId, file);
      
      // Get file URL
      const url = storage.getFileView(BUCKETS.AVATARS, uploadedFile.$id);

      return {
        success: true,
        data: { fileId: uploadedFile.$id, url: url.href }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload avatar'
      };
    }
  }

  // Upload job image
  static async uploadJobImage(file: File, jobId: string): Promise<ApiResponse<{ fileId: string; url: string }>> {
    try {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return {
          success: false,
          error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.'
        };
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit for job images
        return {
          success: false,
          error: 'File size too large. Please upload an image smaller than 10MB.'
        };
      }

      const fileId = `job_${jobId}_${Date.now()}`;
      const uploadedFile = await storage.createFile(BUCKETS.JOB_IMAGES, fileId, file);
      
      const url = storage.getFileView(BUCKETS.JOB_IMAGES, uploadedFile.$id);

      return {
        success: true,
        data: { fileId: uploadedFile.$id, url: url.href }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload job image'
      };
    }
  }

  // Upload multiple job images
  static async uploadJobImages(files: File[], jobId: string): Promise<ApiResponse<Array<{ fileId: string; url: string }>>> {
    try {
      if (files.length > 5) {
        return {
          success: false,
          error: 'Maximum 5 images allowed per job'
        };
      }

      const uploadPromises = files.map(file => this.uploadJobImage(file, jobId));
      const results = await Promise.all(uploadPromises);

      const failures = results.filter(result => !result.success);
      if (failures.length > 0) {
        return {
          success: false,
          error: `Failed to upload ${failures.length} image(s): ${failures.map(f => f.error).join(', ')}`
        };
      }

      return {
        success: true,
        data: results.map(result => result.data!).filter(Boolean)
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload job images'
      };
    }
  }

  // Upload document (CV, portfolio, etc.)
  static async uploadDocument(file: File, userId: string, type: 'cv' | 'portfolio' | 'certificate' | 'other'): Promise<ApiResponse<{ fileId: string; url: string }>> {
    try {
      // Validate file type and size
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        return {
          success: false,
          error: 'Invalid file type. Please upload a PDF, Word document, or image.'
        };
      }

      if (file.size > 25 * 1024 * 1024) { // 25MB limit for documents
        return {
          success: false,
          error: 'File size too large. Please upload a document smaller than 25MB.'
        };
      }

      const fileId = `doc_${type}_${userId}_${Date.now()}`;
      const uploadedFile = await storage.createFile(BUCKETS.DOCUMENTS, fileId, file);
      
      const url = storage.getFileView(BUCKETS.DOCUMENTS, uploadedFile.$id);

      return {
        success: true,
        data: { fileId: uploadedFile.$id, url: url.href }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload document'
      };
    }
  }

  // Upload evidence file for dispute
  static async uploadEvidence(file: File, disputeId: string): Promise<ApiResponse<{ fileId: string; url: string }>> {
    try {
      // Validate file type and size
      const validTypes = [
        'image/jpeg', 'image/png', 'image/webp',
        'application/pdf',
        'video/mp4', 'video/webm',
        'audio/mp3', 'audio/wav'
      ];
      
      if (!validTypes.includes(file.type)) {
        return {
          success: false,
          error: 'Invalid file type. Please upload an image, PDF, video, or audio file.'
        };
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB limit for evidence
        return {
          success: false,
          error: 'File size too large. Please upload a file smaller than 50MB.'
        };
      }

      const fileId = `evidence_${disputeId}_${Date.now()}`;
      const uploadedFile = await storage.createFile(BUCKETS.EVIDENCE, fileId, file);
      
      const url = storage.getFileView(BUCKETS.EVIDENCE, uploadedFile.$id);

      return {
        success: true,
        data: { fileId: uploadedFile.$id, url: url.href }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload evidence'
      };
    }
  }

  // Delete file
  static async deleteFile(bucketId: string, fileId: string): Promise<ApiResponse<void>> {
    try {
      await storage.deleteFile(bucketId, fileId);
      return {
        success: true,
        data: undefined
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete file'
      };
    }
  }

  // Get file info
  static async getFileInfo(bucketId: string, fileId: string): Promise<ApiResponse<{
    id: string;
    name: string;
    size: number;
    mimeType: string;
    createdAt: string;
  }>> {
    try {
      const file = await storage.getFile(bucketId, fileId);
      return {
        success: true,
        data: {
          id: file.$id,
          name: file.name,
          size: file.sizeOriginal,
          mimeType: file.mimeType,
          createdAt: file.$createdAt
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get file info'
      };
    }
  }

  // Get file preview URL
  static getFilePreview(bucketId: string, fileId: string, width?: number, height?: number): string {
    return storage.getFilePreview(bucketId, fileId, width, height).href;
  }

  // Get file download URL
  static getFileDownload(bucketId: string, fileId: string): string {
    return storage.getFileDownload(bucketId, fileId).href;
  }

  // Helper method to get appropriate bucket for file type
  static getBucketForType(type: 'avatar' | 'job_image' | 'document' | 'evidence'): string {
    switch (type) {
      case 'avatar':
        return BUCKETS.AVATARS;
      case 'job_image':
        return BUCKETS.JOB_IMAGES;
      case 'document':
        return BUCKETS.DOCUMENTS;
      case 'evidence':
        return BUCKETS.EVIDENCE;
      default:
        return BUCKETS.DOCUMENTS;
    }
  }

  // Validate file for type and size
  static validateFile(file: File, type: 'image' | 'document' | 'video' | 'audio', maxSizeMB: number): { valid: boolean; error?: string } {
    const typeValidation = {
      image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      video: ['video/mp4', 'video/webm', 'video/quicktime'],
      audio: ['audio/mp3', 'audio/wav', 'audio/ogg']
    };

    if (!typeValidation[type].includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Expected ${type} file.`
      };
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${maxSizeMB}MB.`
      };
    }

    return { valid: true };
  }

  // Batch upload files
  static async uploadBatch(
    files: Array<{ file: File; bucketId: string; fileId?: string }>,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<Array<{ fileId: string; url: string; error?: string }>>> {
    try {
      const results: Array<{ fileId: string; url: string; error?: string }> = [];
      let completed = 0;

      for (const { file, bucketId, fileId } of files) {
        try {
          const id = fileId || ID.unique();
          const uploadedFile = await storage.createFile(bucketId, id, file);
          const url = storage.getFileView(bucketId, uploadedFile.$id);
          
          results.push({ fileId: uploadedFile.$id, url: url.href });
        } catch (error: any) {
          results.push({ 
            fileId: '', 
            url: '', 
            error: error.message || 'Upload failed' 
          });
        }

        completed++;
        if (onProgress) {
          onProgress((completed / files.length) * 100);
        }
      }

      return {
        success: true,
        data: results
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Batch upload failed'
      };
    }
  }
}
