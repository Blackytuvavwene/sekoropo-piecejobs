// Dispute service for managing job disputes and resolutions
import { databases } from '$lib/appwrite/appwrite-client';
import type { 
  Dispute, 
  CreateDisputeRequest, 
  UpdateDisputeRequest,
  ApiResponse,
  PaginatedResponse 
} from '$lib/utils/types';
import { ID, Query } from 'appwrite';
import { DATABASE_ID, COLLECTIONS } from '$lib/utils/constants';

export class DisputeService {
  // Create new dispute
  static async create(disputeData: CreateDisputeRequest): Promise<ApiResponse<Dispute>> {
    try {
      const dispute = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.DISPUTES,
        ID.unique(),
        {
          job_id: disputeData.jobId,
          complainant_id: disputeData.complainantId,
          respondent_id: disputeData.respondentId,
          dispute_type: disputeData.disputeType,
          description: disputeData.description,
          evidence_urls: disputeData.evidenceUrls || [],
          amount_in_dispute: disputeData.amountInDispute,
          status: 'open',
          priority: disputeData.priority || 'medium',
          created_at: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: dispute as Dispute
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create dispute'
      };
    }
  }

  // Get dispute by ID
  static async getById(disputeId: string): Promise<ApiResponse<Dispute>> {
    try {
      const dispute = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.DISPUTES,
        disputeId
      );

      return {
        success: true,
        data: dispute as Dispute
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch dispute'
      };
    }
  }

  // Get all disputes with filters
  static async getAll(
    filters: {
      status?: Dispute['status'];
      priority?: Dispute['priority'];
      disputeType?: Dispute['dispute_type'];
      userId?: string; // Filter by complainant or respondent
    } = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<PaginatedResponse<Dispute>>> {
    try {
      const queries = [
        Query.orderDesc('created_at'),
        Query.limit(limit),
        Query.offset(offset)
      ];

      if (filters.status) {
        queries.push(Query.equal('status', filters.status));
      }

      if (filters.priority) {
        queries.push(Query.equal('priority', filters.priority));
      }

      if (filters.disputeType) {
        queries.push(Query.equal('dispute_type', filters.disputeType));
      }

      let response;

      if (filters.userId) {
        // Need to get disputes where user is either complainant or respondent
        const [complainantDisputes, respondentDisputes] = await Promise.all([
          databases.listDocuments(DATABASE_ID, COLLECTIONS.DISPUTES, [
            ...queries,
            Query.equal('complainant_id', filters.userId)
          ]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.DISPUTES, [
            ...queries,
            Query.equal('respondent_id', filters.userId)
          ])
        ]);

        // Combine and remove duplicates
        const allDisputes = [...complainantDisputes.documents, ...respondentDisputes.documents];
        const uniqueDisputes = allDisputes.filter((dispute, index, self) => 
          index === self.findIndex(d => d.$id === dispute.$id)
        );

        response = {
          documents: uniqueDisputes.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ).slice(offset, offset + limit),
          total: uniqueDisputes.length
        };
      } else {
        response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.DISPUTES,
          queries
        );
      }

      return {
        success: true,
        data: {
          documents: response.documents as Dispute[],
          total: response.total
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch disputes'
      };
    }
  }

  // Get disputes for a specific job
  static async getByJobId(jobId: string): Promise<ApiResponse<Dispute[]>> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DISPUTES,
        [
          Query.equal('job_id', jobId),
          Query.orderDesc('created_at')
        ]
      );

      return {
        success: true,
        data: response.documents as Dispute[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch job disputes'
      };
    }
  }

  // Get user disputes (as complainant or respondent)
  static async getUserDisputes(
    userId: string,
    role: 'complainant' | 'respondent' | 'all' = 'all',
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<PaginatedResponse<Dispute>>> {
    try {
      const queries = [
        Query.orderDesc('created_at'),
        Query.limit(limit),
        Query.offset(offset)
      ];

      let response;

      if (role === 'complainant') {
        queries.push(Query.equal('complainant_id', userId));
        response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.DISPUTES, queries);
      } else if (role === 'respondent') {
        queries.push(Query.equal('respondent_id', userId));
        response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.DISPUTES, queries);
      } else {
        // Get all disputes where user is involved
        const [complainantDisputes, respondentDisputes] = await Promise.all([
          databases.listDocuments(DATABASE_ID, COLLECTIONS.DISPUTES, [
            ...queries,
            Query.equal('complainant_id', userId)
          ]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.DISPUTES, [
            ...queries,
            Query.equal('respondent_id', userId)
          ])
        ]);

        const allDisputes = [...complainantDisputes.documents, ...respondentDisputes.documents]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(offset, offset + limit);

        response = {
          documents: allDisputes,
          total: complainantDisputes.total + respondentDisputes.total
        };
      }

      return {
        success: true,
        data: {
          documents: response.documents as Dispute[],
          total: response.total
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch user disputes'
      };
    }
  }

  // Update dispute status
  static async updateStatus(
    disputeId: string,
    status: Dispute['status'],
    adminId?: string,
    resolution?: string
  ): Promise<ApiResponse<Dispute>> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };      if (status === 'under_review' && adminId) {
        updateData.assigned_admin_id = adminId;
        updateData.review_started_at = new Date().toISOString();
      } else if ((status === 'resolved_in_favor_of_seeker' || status === 'resolved_in_favor_of_provider') && resolution) {
        updateData.resolution = resolution;
        updateData.resolved_at = new Date().toISOString();
      } else if (status === 'cancelled') {
        updateData.closed_at = new Date().toISOString();
      }

      const dispute = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.DISPUTES,
        disputeId,
        updateData
      );

      return {
        success: true,
        data: dispute as Dispute
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update dispute status'
      };
    }
  }

  // Assign dispute to admin
  static async assignToAdmin(
    disputeId: string,
    adminId: string
  ): Promise<ApiResponse<Dispute>> {
    try {
      const dispute = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.DISPUTES,
        disputeId,
        {
          assigned_admin_id: adminId,
          status: 'under_review',
          review_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: dispute as Dispute
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to assign dispute to admin'
      };
    }
  }

  // Update dispute priority
  static async updatePriority(
    disputeId: string,
    priority: Dispute['priority']
  ): Promise<ApiResponse<Dispute>> {
    try {
      const dispute = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.DISPUTES,
        disputeId,
        {
          priority,
          updated_at: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: dispute as Dispute
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update dispute priority'
      };
    }
  }

  // Add evidence to dispute
  static async addEvidence(
    disputeId: string,
    evidenceUrls: string[]
  ): Promise<ApiResponse<Dispute>> {
    try {
      // Get current dispute to append to existing evidence
      const currentDispute = await this.getById(disputeId);
      if (!currentDispute.success) {
        return currentDispute;
      }

      const existingEvidence = currentDispute.data!.evidence_urls || [];
      const updatedEvidence = [...existingEvidence, ...evidenceUrls];

      const dispute = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.DISPUTES,
        disputeId,
        {
          evidence_urls: updatedEvidence,
          updated_at: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: dispute as Dispute
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to add evidence to dispute'
      };
    }
  }

  // Update dispute details
  static async update(
    disputeId: string,
    updateData: UpdateDisputeRequest
  ): Promise<ApiResponse<Dispute>> {
    try {
      const dispute = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.DISPUTES,
        disputeId,
        {
          ...updateData,
          updated_at: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: dispute as Dispute
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update dispute'
      };
    }
  }

  // Delete dispute (admin only)
  static async delete(disputeId: string): Promise<ApiResponse<void>> {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.DISPUTES,
        disputeId
      );

      return {
        success: true,
        data: undefined
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete dispute'
      };
    }
  }

  // Get dispute statistics
  static async getStats(dateRange?: { start: string; end: string }): Promise<ApiResponse<{
    totalDisputes: number;
    openDisputes: number;
    inReviewDisputes: number;
    resolvedDisputes: number;
    closedDisputes: number;
    averageResolutionTime: number; // in hours
    disputesByType: { [key: string]: number };
    disputesByPriority: { [key: string]: number };
  }>> {
    try {
      const queries = [Query.orderDesc('created_at')];
      
      if (dateRange) {
        queries.push(Query.greaterThanEqual('created_at', dateRange.start));
        queries.push(Query.lessThanEqual('created_at', dateRange.end));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DISPUTES,
        queries
      );

      const disputes = response.documents as Dispute[];
      
      const stats = disputes.reduce((acc, dispute) => {
        acc.totalDisputes++;
        
        // Count by status
        if (dispute.status === 'open') acc.openDisputes++;
        else if (dispute.status === 'under_review') acc.inReviewDisputes++;
        else if (dispute.status === 'resolved_in_favor_of_seeker' || dispute.status === 'resolved_in_favor_of_provider') acc.resolvedDisputes++;
        else if (dispute.status === 'cancelled') acc.closedDisputes++;

        // Count by type
        acc.disputesByType[dispute.dispute_type] = (acc.disputesByType[dispute.dispute_type] || 0) + 1;

        // Count by priority
        acc.disputesByPriority[dispute.priority] = (acc.disputesByPriority[dispute.priority] || 0) + 1;

        // Calculate resolution time for resolved disputes
        if (dispute.status === 'resolved' && dispute.resolved_at) {
          const createdTime = new Date(dispute.created_at).getTime();
          const resolvedTime = new Date(dispute.resolved_at).getTime();
          const resolutionHours = (resolvedTime - createdTime) / (1000 * 60 * 60);
          acc.totalResolutionTime += resolutionHours;
          acc.resolvedCount++;
        }

        return acc;
      }, {
        totalDisputes: 0,
        openDisputes: 0,
        inReviewDisputes: 0,
        resolvedDisputes: 0,
        closedDisputes: 0,
        totalResolutionTime: 0,
        resolvedCount: 0,
        disputesByType: {} as { [key: string]: number },
        disputesByPriority: {} as { [key: string]: number }
      });

      const averageResolutionTime = stats.resolvedCount > 0 
        ? stats.totalResolutionTime / stats.resolvedCount 
        : 0;

      return {
        success: true,
        data: {
          totalDisputes: stats.totalDisputes,
          openDisputes: stats.openDisputes,
          inReviewDisputes: stats.inReviewDisputes,
          resolvedDisputes: stats.resolvedDisputes,
          closedDisputes: stats.closedDisputes,
          averageResolutionTime: Math.round(averageResolutionTime * 100) / 100,
          disputesByType: stats.disputesByType,
          disputesByPriority: stats.disputesByPriority
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch dispute statistics'
      };
    }
  }

  // Get admin workload (disputes assigned to specific admin)
  static async getAdminWorkload(adminId: string): Promise<ApiResponse<{
    totalAssigned: number;
    inReview: number;
    resolved: number;
    averageResolutionTime: number;
  }>> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DISPUTES,
        [
          Query.equal('assigned_admin_id', adminId),
          Query.orderDesc('created_at')
        ]
      );

      const disputes = response.documents as Dispute[];
      
      const stats = disputes.reduce((acc, dispute) => {
        acc.totalAssigned++;
          if (dispute.status === 'under_review') {
          acc.inReview++;
        } else if ((dispute.status === 'resolved_in_favor_of_seeker' || dispute.status === 'resolved_in_favor_of_provider') && dispute.resolved_at) {
          acc.resolved++;
          const createdTime = new Date(dispute.created_at).getTime();
          const resolvedTime = new Date(dispute.resolved_at).getTime();
          const resolutionHours = (resolvedTime - createdTime) / (1000 * 60 * 60);
          acc.totalResolutionTime += resolutionHours;
        }

        return acc;
      }, {
        totalAssigned: 0,
        inReview: 0,
        resolved: 0,
        totalResolutionTime: 0
      });

      const averageResolutionTime = stats.resolved > 0 
        ? stats.totalResolutionTime / stats.resolved 
        : 0;

      return {
        success: true,
        data: {
          totalAssigned: stats.totalAssigned,
          inReview: stats.inReview,
          resolved: stats.resolved,
          averageResolutionTime: Math.round(averageResolutionTime * 100) / 100
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch admin workload'
      };
    }
  }
}
