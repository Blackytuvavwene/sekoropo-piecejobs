// Application service for managing job applications
import { databases } from '$lib/appwrite/appwrite-client';
import type { 
  Application, 
  CreateApplicationRequest, 
  UpdateApplicationRequest,
  ApiResponse,
  PaginatedResponse 
} from '$lib/utils/types';
import { ID, Query } from 'appwrite';
import { DATABASE_ID, COLLECTIONS } from '$lib/utils/constants';

export class ApplicationService {
  // Create new application
  static async create(applicationData: CreateApplicationRequest): Promise<ApiResponse<Application>> {
    try {
      const application = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.APPLICATIONS,
        ID.unique(),
        {
          job_id: applicationData.jobId,
          applicant_id: applicationData.applicantId,
          cover_letter: applicationData.coverLetter,
          proposed_price: applicationData.proposedPrice,
          estimated_completion: applicationData.estimatedCompletion,
          status: 'pending',
          applied_at: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: application as Application
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create application'
      };
    }
  }

  // Get application by ID
  static async getById(applicationId: string): Promise<ApiResponse<Application>> {
    try {
      const application = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.APPLICATIONS,
        applicationId
      );

      return {
        success: true,
        data: application as Application
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch application'
      };
    }
  }

  // Get applications for a specific job
  static async getByJobId(
    jobId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<PaginatedResponse<Application>>> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.APPLICATIONS,
        [
          Query.equal('job_id', jobId),
          Query.orderDesc('applied_at'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      );

      return {
        success: true,
        data: {
          documents: response.documents as Application[],
          total: response.total
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch applications'
      };
    }
  }

  // Get applications by user ID
  static async getByUserId(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<PaginatedResponse<Application>>> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.APPLICATIONS,
        [
          Query.equal('applicant_id', userId),
          Query.orderDesc('applied_at'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      );

      return {
        success: true,
        data: {
          documents: response.documents as Application[],
          total: response.total
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch user applications'
      };
    }
  }

  // Update application status
  static async updateStatus(
    applicationId: string,
    status: Application['status'],
    userId: string
  ): Promise<ApiResponse<Application>> {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };

      // Add status-specific fields
      if (status === 'accepted') {
        updateData.accepted_at = new Date().toISOString();
      } else if (status === 'rejected') {
        updateData.rejected_at = new Date().toISOString();
      }

      const application = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.APPLICATIONS,
        applicationId,
        updateData
      );

      return {
        success: true,
        data: application as Application
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update application status'
      };
    }
  }

  // Update application details
  static async update(
    applicationId: string,
    updateData: UpdateApplicationRequest
  ): Promise<ApiResponse<Application>> {
    try {
      const application = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.APPLICATIONS,
        applicationId,
        {
          ...updateData,
          updated_at: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: application as Application
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update application'
      };
    }
  }

  // Delete application
  static async delete(applicationId: string): Promise<ApiResponse<void>> {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.APPLICATIONS,
        applicationId
      );

      return {
        success: true,
        data: undefined
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete application'
      };
    }
  }

  // Get application statistics for a job
  static async getJobStats(jobId: string): Promise<ApiResponse<{
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
  }>> {
    try {
      const [totalRes, pendingRes, acceptedRes, rejectedRes] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.APPLICATIONS, [
          Query.equal('job_id', jobId),
          Query.limit(1)
        ]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.APPLICATIONS, [
          Query.equal('job_id', jobId),
          Query.equal('status', 'pending'),
          Query.limit(1)
        ]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.APPLICATIONS, [
          Query.equal('job_id', jobId),
          Query.equal('status', 'accepted'),
          Query.limit(1)
        ]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.APPLICATIONS, [
          Query.equal('job_id', jobId),
          Query.equal('status', 'rejected'),
          Query.limit(1)
        ])
      ]);

      return {
        success: true,
        data: {
          total: totalRes.total,
          pending: pendingRes.total,
          accepted: acceptedRes.total,
          rejected: rejectedRes.total
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch application statistics'
      };
    }
  }
}
