// Notification service for managing user notifications
import { databases } from '$lib/appwrite/appwrite-client';
import type { 
  Notification, 
  CreateNotificationRequest, 
  UpdateNotificationRequest,
  ApiResponse,
  PaginatedResponse 
} from '$lib/utils/types';
import { ID, Query } from 'appwrite';
import { DATABASE_ID, COLLECTIONS } from '$lib/utils/constants';

export class NotificationService {
  // Create new notification
  static async create(notificationData: CreateNotificationRequest): Promise<ApiResponse<Notification>> {
    try {
      const notification = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS,
        ID.unique(),
        {
          user_id: notificationData.userId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          related_id: notificationData.relatedId,
          is_read: false,
          created_at: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: notification as Notification
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create notification'
      };
    }
  }

  // Get notification by ID
  static async getById(notificationId: string): Promise<ApiResponse<Notification>> {
    try {
      const notification = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS,
        notificationId
      );

      return {
        success: true,
        data: notification as Notification
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch notification'
      };
    }
  }

  // Get user notifications
  static async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false,
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    try {
      const queries = [
        Query.equal('user_id', userId),
        Query.orderDesc('created_at'),
        Query.limit(limit),
        Query.offset(offset)
      ];

      if (unreadOnly) {
        queries.push(Query.equal('is_read', false));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS,
        queries
      );

      return {
        success: true,
        data: {
          documents: response.documents as Notification[],
          total: response.total
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch user notifications'
      };
    }
  }

  // Get notifications by type
  static async getByType(
    userId: string,
    type: Notification['type'],
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS,
        [
          Query.equal('user_id', userId),
          Query.equal('type', type),
          Query.orderDesc('created_at'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      );

      return {
        success: true,
        data: {
          documents: response.documents as Notification[],
          total: response.total
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch notifications by type'
      };
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
    try {
      const notification = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS,
        notificationId,
        {
          is_read: true,
          read_at: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: notification as Notification
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to mark notification as read'
      };
    }
  }

  // Mark all user notifications as read
  static async markAllAsRead(userId: string): Promise<ApiResponse<void>> {
    try {
      const unreadNotifications = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS,
        [
          Query.equal('user_id', userId),
          Query.equal('is_read', false)
        ]
      );

      const updatePromises = unreadNotifications.documents.map(notification =>
        databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.NOTIFICATIONS,
          notification.$id,
          {
            is_read: true,
            read_at: new Date().toISOString()
          }
        )
      );

      await Promise.all(updatePromises);

      return {
        success: true,
        data: undefined
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to mark all notifications as read'
      };
    }
  }

  // Get unread notification count
  static async getUnreadCount(userId: string): Promise<ApiResponse<number>> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS,
        [
          Query.equal('user_id', userId),
          Query.equal('is_read', false),
          Query.limit(1) // We only need the count
        ]
      );

      return {
        success: true,
        data: response.total
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch unread count'
      };
    }
  }

  // Update notification
  static async update(
    notificationId: string,
    updateData: UpdateNotificationRequest
  ): Promise<ApiResponse<Notification>> {
    try {
      const notification = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS,
        notificationId,
        {
          ...updateData,
          updated_at: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: notification as Notification
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update notification'
      };
    }
  }

  // Delete notification
  static async delete(notificationId: string): Promise<ApiResponse<void>> {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS,
        notificationId
      );

      return {
        success: true,
        data: undefined
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete notification'
      };
    }
  }

  // Delete all user notifications
  static async deleteAllUserNotifications(userId: string): Promise<ApiResponse<void>> {
    try {
      const userNotifications = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS,
        [Query.equal('user_id', userId)]
      );

      const deletePromises = userNotifications.documents.map(notification =>
        databases.deleteDocument(
          DATABASE_ID,
          COLLECTIONS.NOTIFICATIONS,
          notification.$id
        )
      );

      await Promise.all(deletePromises);

      return {
        success: true,
        data: undefined
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete user notifications'
      };
    }
  }

  // Bulk create notifications (for system-wide notifications)
  static async createBulk(
    userIds: string[],
    notificationData: Omit<CreateNotificationRequest, 'userId'>
  ): Promise<ApiResponse<Notification[]>> {
    try {
      const createPromises = userIds.map(userId =>
        databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.NOTIFICATIONS,
          ID.unique(),
          {
            user_id: userId,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type,
            related_id: notificationData.relatedId,
            is_read: false,
            created_at: new Date().toISOString()
          }
        )
      );

      const notifications = await Promise.all(createPromises);

      return {
        success: true,
        data: notifications as Notification[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create bulk notifications'
      };
    }
  }

  // Helper methods for specific notification types
  static async createJobNotification(
    userId: string,
    jobId: string,
    type: 'job_applied' | 'job_accepted' | 'job_completed' | 'job_cancelled',
    additionalData?: { applicantName?: string; jobTitle?: string }
  ): Promise<ApiResponse<Notification>> {
    const notifications = {
      job_applied: {
        title: 'New Job Application',
        message: `${additionalData?.applicantName || 'Someone'} applied for your job "${additionalData?.jobTitle || 'Untitled'}"`
      },
      job_accepted: {
        title: 'Application Accepted',
        message: `Your application for "${additionalData?.jobTitle || 'a job'}" has been accepted!`
      },
      job_completed: {
        title: 'Job Completed',
        message: `The job "${additionalData?.jobTitle || 'Untitled'}" has been marked as completed`
      },
      job_cancelled: {
        title: 'Job Cancelled',
        message: `The job "${additionalData?.jobTitle || 'Untitled'}" has been cancelled`
      }
    };

    return this.create({
      userId,
      title: notifications[type].title,
      message: notifications[type].message,
      type,
      relatedId: jobId
    });
  }

  static async createPaymentNotification(
    userId: string,
    paymentId: string,
    type: 'payment_received' | 'payment_released' | 'payment_refunded',
    amount: number
  ): Promise<ApiResponse<Notification>> {
    const notifications = {
      payment_received: {
        title: 'Payment Received',
        message: `You received a payment of P${amount.toFixed(2)}`
      },
      payment_released: {
        title: 'Payment Released',
        message: `Your escrow payment of P${amount.toFixed(2)} has been released`
      },
      payment_refunded: {
        title: 'Payment Refunded',
        message: `Your payment of P${amount.toFixed(2)} has been refunded`
      }
    };

    return this.create({
      userId,
      title: notifications[type].title,
      message: notifications[type].message,
      type,
      relatedId: paymentId
    });
  }

  static async createMessageNotification(
    userId: string,
    messageId: string,
    senderName: string
  ): Promise<ApiResponse<Notification>> {
    return this.create({
      userId,
      title: 'New Message',
      message: `You received a new message from ${senderName}`,
      type: 'message_received',
      relatedId: messageId
    });
  }

  static async createReviewNotification(
    userId: string,
    reviewId: string,
    rating: number,
    reviewerName: string
  ): Promise<ApiResponse<Notification>> {
    return this.create({
      userId,
      title: 'New Review',
      message: `${reviewerName} left you a ${rating}-star review`,
      type: 'review_received',
      relatedId: reviewId
    });
  }
}
