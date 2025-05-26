// Database service for job operations
// Update the import path below if your appwrite-client file is located elsewhere
import { databases } from '$lib/appwrite/appwrite-client';
// If the file is in a different location, adjust the path accordingly.
import { APPWRITE_CONFIG, PAGINATION } from '../constants';
import { Query, ID } from 'appwrite';
import type { 
  Job, 
  JobWithDetails, 
  CreateJobRequest, 
  UpdateJobRequest, 
  JobSearchRequest,
  ApiResponse,
  PaginatedResponse 
} from '../types';

export class JobService {
  private static readonly databaseId = APPWRITE_CONFIG.databaseId;
  private static readonly collectionId = 'jobs';

  // Create a new job
  static async createJob(jobData: CreateJobRequest): Promise<ApiResponse<Job>> {
    try {
      const job = await databases.createDocument(
        this.databaseId,
        this.collectionId,
        ID.unique(),
        {
          ...jobData,
          status: 'open',
          postedAt: new Date().toISOString(),
          isFeatured: false
        }
      );

      return {
        success: true,
        data: job as Job
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create job'
      };
    }
  }

  // Get job by ID with related data
  static async getJobById(jobId: string): Promise<ApiResponse<JobWithDetails>> {
    try {
      const job = await databases.getDocument(
        this.databaseId,
        this.collectionId,
        jobId
      );

      // TODO: Fetch related data (employer, category, applications)
      const jobWithDetails: JobWithDetails = {
        ...job as Job,
        // employer: await ProfileService.getProfileById(job.employerProfileId),
        // category: await CategoryService.getCategoryById(job.categoryId),
        // applications: await ApplicationService.getApplicationsByJobId(jobId)
      };

      return {
        success: true,
        data: jobWithDetails
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get job'
      };
    }
  }

  // Search and filter jobs
  static async searchJobs(searchParams: JobSearchRequest): Promise<ApiResponse<PaginatedResponse<Job>>> {
    try {
      const queries: string[] = [];
      
      if (searchParams.query) {
        queries.push(Query.search('title', searchParams.query));
      }
      
      if (searchParams.categoryId) {
        queries.push(Query.equal('categoryId', searchParams.categoryId));
      }
      
      if (searchParams.location) {
        queries.push(Query.equal('location', searchParams.location));
      }
      
      if (searchParams.minBudget) {
        queries.push(Query.greaterThanEqual('budget', searchParams.minBudget));
      }
      
      if (searchParams.maxBudget) {
        queries.push(Query.lessThanEqual('budget', searchParams.maxBudget));
      }
      
      if (searchParams.status) {
        queries.push(Query.equal('status', searchParams.status));
      }

      // Add pagination
      const limit = Math.min(searchParams.limit || PAGINATION.defaultLimit, PAGINATION.maxLimit);
      const offset = ((searchParams.page || 1) - 1) * limit;
      
      queries.push(Query.limit(limit));
      queries.push(Query.offset(offset));
      queries.push(Query.orderDesc('postedAt'));

      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        queries
      );

      return {
        success: true,
        data: {
          documents: response.documents as Job[],
          total: response.total,
          limit,
          offset
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to search jobs'
      };
    }
  }

  // Update job
  static async updateJob(jobId: string, updates: UpdateJobRequest): Promise<ApiResponse<Job>> {
    try {
      const job = await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        jobId,
        updates
      );

      return {
        success: true,
        data: job as Job
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update job'
      };
    }
  }

  // Delete job
  static async deleteJob(jobId: string): Promise<ApiResponse<void>> {
    try {
      await databases.deleteDocument(
        this.databaseId,
        this.collectionId,
        jobId
      );

      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete job'
      };
    }
  }

  // Get jobs by employer
  static async getJobsByEmployer(employerProfileId: string): Promise<ApiResponse<Job[]>> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal('employerProfileId', employerProfileId),
          Query.orderDesc('postedAt')
        ]
      );

      return {
        success: true,
        data: response.documents as Job[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get employer jobs'
      };
    }
  }

  // Get jobs by status
  static async getJobsByStatus(status: string): Promise<ApiResponse<Job[]>> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal('status', status),
          Query.orderDesc('postedAt')
        ]
      );

      return {
        success: true,
        data: response.documents as Job[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get jobs by status'
      };
    }
  }

  // Assign job to provider
  static async assignJob(jobId: string, providerProfileId: string): Promise<ApiResponse<Job>> {
    try {
      const job = await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        jobId,
        {
          status: 'assigned',
          assignedProviderProfileId: providerProfileId
        }
      );

      return {
        success: true,
        data: job as Job
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to assign job'
      };
    }
  }

  // Complete job
  static async completeJob(jobId: string): Promise<ApiResponse<Job>> {
    try {
      const job = await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        jobId,
        {
          status: 'completed'
        }
      );

      return {
        success: true,
        data: job as Job
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to complete job'
      };
    }
  }

  // Feature/unfeature job (admin)
  static async toggleFeatureJob(jobId: string, featured: boolean): Promise<ApiResponse<Job>> {
    try {
      const job = await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        jobId,
        {
          isFeatured: featured
        }
      );

      return {
        success: true,
        data: job as Job
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to toggle job feature'
      };
    }
  }

  // Get featured jobs
  static async getFeaturedJobs(limit: number = 10): Promise<ApiResponse<Job[]>> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal('isFeatured', true),
          Query.equal('status', 'open'),
          Query.orderDesc('postedAt'),
          Query.limit(limit)
        ]
      );

      return {
        success: true,
        data: response.documents as Job[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get featured jobs'
      };
    }
  }

  // Get recent jobs
  static async getRecentJobs(limit: number = 20): Promise<ApiResponse<Job[]>> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal('status', 'open'),
          Query.orderDesc('postedAt'),
          Query.limit(limit)
        ]
      );

      return {
        success: true,
        data: response.documents as Job[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get recent jobs'
      };
    }
  }
}
