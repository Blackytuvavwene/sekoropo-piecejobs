// Admin service for managing platform administration tasks
import { databases } from '$lib/appwrite/appwrite-client';
import type { 
  PlatformSettings,
  User,
  Job,
  ApiResponse,
  PaginatedResponse 
} from '$lib/utils/types';
import { Query } from 'appwrite';
import { DATABASE_ID } from '$lib/utils/constants';
// TODO: Replace 'COLLECTIONS' below with the correct import if it has a different name or add the export in constants.ts
import { COLLECTIONS } from '$lib/utils/constants';

export class AdminService {
  // Platform Settings Management
  static async getPlatformSettings(): Promise<ApiResponse<PlatformSettings>> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PLATFORM_SETTINGS,
        [Query.limit(1)]
      );

      if (response.documents.length === 0) {
        // Return default settings if none exist
        return {
          success: true,
          data: {
            maintenance_mode: false,
            user_registration_enabled: true,
            job_posting_enabled: true,
            payment_processing_enabled: true,
            commission_rate: 0.05, // 5%
            min_job_price: 50,
            max_job_price: 50000,
            platform_currency: 'BWP',
            featured_job_price: 100,
            job_boost_price: 50,
            auto_job_expiry_days: 30,
            max_applications_per_job: 50,
            require_email_verification: true,
            require_phone_verification: false,
            allow_job_editing: true,
            allow_application_withdrawal: true,
            dispute_resolution_time_hours: 72,
            escrow_release_time_hours: 24,
            platform_name: 'Sekoropo',
            support_email: 'support@sekoropo.com',
            terms_url: '/terms',
            privacy_url: '/privacy',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as PlatformSettings
        };
      }

      return {
        success: true,
        data: response.documents[0] as PlatformSettings
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch platform settings'
      };
    }
  }

  static async updatePlatformSettings(
    settings: Partial<PlatformSettings>
  ): Promise<ApiResponse<PlatformSettings>> {
    try {
      const currentSettings = await this.getPlatformSettings();
      if (!currentSettings.success) {
        return currentSettings;
      }

      let updatedSettings;
      
      if (currentSettings.data.$id) {
        // Update existing settings
        updatedSettings = await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.PLATFORM_SETTINGS,
          currentSettings.data.$id,
          {
            ...settings,
            updated_at: new Date().toISOString()
          }
        );
      } else {
        // Create new settings document
        updatedSettings = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.PLATFORM_SETTINGS,
          'platform_settings',
          {
            ...currentSettings.data,
            ...settings,
            updated_at: new Date().toISOString()
          }
        );
      }

      return {
        success: true,
        data: updatedSettings as PlatformSettings
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update platform settings'
      };
    }
  }

  // User Management
  static async getAllUsers(
    filters: {
      isActive?: boolean;
      userType?: 'client' | 'freelancer' | 'both';
      isVerified?: boolean;
    } = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<PaginatedResponse<User>>> {
    try {
      const queries = [
        Query.orderDesc('$createdAt'),
        Query.limit(limit),
        Query.offset(offset)
      ];

      // Note: These filters would need to be implemented based on your User schema
      // if (filters.isActive !== undefined) {
      //   queries.push(Query.equal('is_active', filters.isActive));
      // }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS,
        queries
      );

      return {
        success: true,
        data: {
          documents: response.documents as User[],
          total: response.total
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch users'
      };
    }
  }

  static async getUserById(userId: string): Promise<ApiResponse<User>> {
    try {
      const user = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.USERS,
        userId
      );

      return {
        success: true,
        data: user as User
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch user'
      };
    }
  }

  static async updateUserStatus(
    userId: string,
    isActive: boolean,
    reason?: string
  ): Promise<ApiResponse<User>> {
    try {
      const user = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        userId,
        {
          is_active: isActive,
          status_reason: reason,
          updated_at: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: user as User
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update user status'
      };
    }
  }

  // Job Management
  static async getAllJobs(
    filters: {
      status?: Job['status'];
      isFeatured?: boolean;
      isPriorityBoosted?: boolean;
    } = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<PaginatedResponse<Job>>> {
    try {
      const queries = [
        Query.orderDesc('created_at'),
        Query.limit(limit),
        Query.offset(offset)
      ];

      if (filters.status) {
        queries.push(Query.equal('status', filters.status));
      }

      if (filters.isFeatured !== undefined) {
        queries.push(Query.equal('is_featured', filters.isFeatured));
      }

      if (filters.isPriorityBoosted !== undefined) {
        queries.push(Query.equal('is_priority_boosted', filters.isPriorityBoosted));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.JOBS,
        queries
      );

      return {
        success: true,
        data: {
          documents: response.documents as Job[],
          total: response.total
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch jobs'
      };
    }
  }

  static async updateJobStatus(
    jobId: string,
    status: Job['status'],
    reason?: string
  ): Promise<ApiResponse<Job>> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (reason) {
        updateData.admin_notes = reason;
      }

      if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }

      const job = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.JOBS,
        jobId,
        updateData
      );

      return {
        success: true,
        data: job as Job
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update job status'
      };
    }
  }

  static async featureJob(
    jobId: string,
    featured: boolean,
    featuredUntil?: string
  ): Promise<ApiResponse<Job>> {
    try {
      const job = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.JOBS,
        jobId,
        {
          is_featured: featured,
          featured_until: featuredUntil,
          updated_at: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: job as Job
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update job featured status'
      };
    }
  }

  // Platform Statistics
  static async getDashboardStats(dateRange?: { start: string; end: string }): Promise<ApiResponse<{
    totalUsers: number;
    activeUsers: number;
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    totalApplications: number;
    totalPayments: number;
    totalRevenue: number;
    pendingDisputes: number;
    userGrowthRate: number;
    jobCompletionRate: number;
    averageJobValue: number;
  }>> {
    try {
      const queries = dateRange ? [
        Query.greaterThanEqual('$createdAt', dateRange.start),
        Query.lessThanEqual('$createdAt', dateRange.end)
      ] : [];

      const [users, jobs, applications, payments, disputes] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS, [Query.limit(1)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.JOBS, [Query.limit(1)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.APPLICATIONS, [Query.limit(1)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.PAYMENTS, [Query.limit(1)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.DISPUTES, [
          Query.equal('status', 'open'),
          Query.limit(1)
        ])
      ]);

      // Get completed jobs
      const completedJobs = await databases.listDocuments(DATABASE_ID, COLLECTIONS.JOBS, [
        Query.equal('status', 'completed'),
        Query.limit(1)
      ]);

      // Get active jobs
      const activeJobs = await databases.listDocuments(DATABASE_ID, COLLECTIONS.JOBS, [
        Query.equal('status', 'active'),
        Query.limit(1)
      ]);

      // Calculate revenue from completed payments
      const completedPayments = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PAYMENTS, [
        Query.equal('status', 'completed'),
        ...queries
      ]);

      const totalRevenue = completedPayments.documents.reduce((sum, payment: any) => 
        sum + (payment.amount || 0), 0
      );

      const averageJobValue = completedPayments.documents.length > 0 
        ? totalRevenue / completedPayments.documents.length 
        : 0;

      const jobCompletionRate = jobs.total > 0 
        ? (completedJobs.total / jobs.total) * 100 
        : 0;

      return {
        success: true,
        data: {
          totalUsers: users.total,
          activeUsers: users.total, // TODO: Filter by active users
          totalJobs: jobs.total,
          activeJobs: activeJobs.total,
          completedJobs: completedJobs.total,
          totalApplications: applications.total,
          totalPayments: completedPayments.documents.length,
          totalRevenue,
          pendingDisputes: disputes.total,
          userGrowthRate: 0, // TODO: Calculate growth rate
          jobCompletionRate: Math.round(jobCompletionRate * 100) / 100,
          averageJobValue: Math.round(averageJobValue * 100) / 100
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch dashboard statistics'
      };
    }
  }

  // Content Moderation
  static async getReportedContent(
    contentType: 'jobs' | 'users' | 'reviews',
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<PaginatedResponse<any>>> {
    try {
      // This would require a reports collection or flag field in content
      // For now, return empty result
      return {
        success: true,
        data: {
          documents: [],
          total: 0
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch reported content'
      };
    }
  }

  // System Health
  static async getSystemHealth(): Promise<ApiResponse<{
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    responseTime: number;
    databaseConnected: boolean;
    storageConnected: boolean;
    lastHealthCheck: string;
  }>> {
    try {
      const startTime = Date.now();
      
      // Test database connection
      await databases.listDocuments(DATABASE_ID, COLLECTIONS.PLATFORM_SETTINGS, [Query.limit(1)]);
      
      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        data: {
          status: responseTime < 1000 ? 'healthy' : responseTime < 3000 ? 'warning' : 'critical',
          uptime: process.uptime ? process.uptime() : 0,
          responseTime,
          databaseConnected: true,
          storageConnected: true, // TODO: Test storage connection
          lastHealthCheck: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to check system health'
      };
    }
  }

  // Activity Logs
  static async getActivityLogs(
    filters: {
      userId?: string;
      action?: string;
      dateRange?: { start: string; end: string };
    } = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<PaginatedResponse<any>>> {
    try {
      // This would require an activity_logs collection
      // For now, return empty result
      return {
        success: true,
        data: {
          documents: [],
          total: 0
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch activity logs'
      };
    }
  }

  // Cache Management
  static async clearCache(cacheType: 'all' | 'jobs' | 'users' | 'settings'): Promise<ApiResponse<void>> {
    try {
      // Implementation would depend on your caching strategy
      // This is a placeholder
      console.log(`Clearing ${cacheType} cache`);
      
      return {
        success: true,
        data: undefined
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to clear cache'
      };
    }
  }

  // Backup Management
  static async createBackup(): Promise<ApiResponse<{ backupId: string; size: number; createdAt: string }>> {
    try {
      // This would require implementation with your backup strategy
      const backupId = `backup_${Date.now()}`;
      
      return {
        success: true,
        data: {
          backupId,
          size: 0, // Placeholder
          createdAt: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create backup'
      };
    }
  }

  static async getBackups(): Promise<ApiResponse<Array<{
    id: string;
    size: number;
    createdAt: string;
    status: 'completed' | 'in_progress' | 'failed';
  }>>> {
    try {
      // Placeholder implementation
      return {
        success: true,
        data: []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch backups'
      };
    }
  }
}
