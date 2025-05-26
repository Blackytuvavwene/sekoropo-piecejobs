// Real-time service for managing live updates and subscriptions
import { client } from '$lib/appwrite/appwrite-client';
import { DATABASE_ID, COLLECTION_IDS } from '$lib/utils/types/database.types';
import type { ApiResponse } from '$lib/utils/types';

export class RealtimeService {
  private static subscriptions = new Map<string, () => void>();

  // Subscribe to user notifications
  static subscribeToNotifications(
    userId: string,
    onNotification: (notification: any) => void,
    onError?: (error: any) => void
  ): ApiResponse<{ unsubscribe: () => void }> {
    try {
      const channel = `databases.${DATABASE_ID}.COLLECTION_IDS.${COLLECTION_IDS.NOTIFICATIONS}.documents`;
      
      const unsubscribe = client.subscribe([channel], (response) => {
        // Check if the notification is for this user
        if (response.payload.user_id === userId) {
          onNotification(response.payload);
        }
      });

      const subscriptionId = `notifications_${userId}`;
      this.subscriptions.set(subscriptionId, unsubscribe);

      return {
        success: true,
        data: {
          unsubscribe: () => {
            unsubscribe();
            this.subscriptions.delete(subscriptionId);
          }
        }
      };
    } catch (error: any) {
      if (onError) onError(error);
      return {
        success: false,
        error: error.message || 'Failed to subscribe to notifications'
      };
    }
  }

  // Subscribe to job updates
  static subscribeToJob(
    jobId: string,
    onUpdate: (job: any) => void,
    onError?: (error: any) => void
  ): ApiResponse<{ unsubscribe: () => void }> {
    try {
      const channel = `databases.${DATABASE_ID}.COLLECTION_IDS.${COLLECTION_IDS.JOBS}.documents.${jobId}`;
      
      const unsubscribe = client.subscribe([channel], (response) => {
        onUpdate(response.payload);
      });

      const subscriptionId = `job_${jobId}`;
      this.subscriptions.set(subscriptionId, unsubscribe);

      return {
        success: true,
        data: {
          unsubscribe: () => {
            unsubscribe();
            this.subscriptions.delete(subscriptionId);
          }
        }
      };
    } catch (error: any) {
      if (onError) onError(error);
      return {
        success: false,
        error: error.message || 'Failed to subscribe to job updates'
      };
    }
  }

  // Subscribe to job applications for a job owner
  static subscribeToJobApplications(
    jobId: string,
    onApplication: (application: any) => void,
    onError?: (error: any) => void
  ): ApiResponse<{ unsubscribe: () => void }> {
    try {
      const channel = `databases.${DATABASE_ID}.COLLECTION_IDS.${COLLECTION_IDS.APPLICATIONS}.documents`;
      
      const unsubscribe = client.subscribe([channel], (response) => {
        // Check if the application is for this job
        if (response.payload.job_id === jobId) {
          onApplication(response.payload);
        }
      });

      const subscriptionId = `job_applications_${jobId}`;
      this.subscriptions.set(subscriptionId, unsubscribe);

      return {
        success: true,
        data: {
          unsubscribe: () => {
            unsubscribe();
            this.subscriptions.delete(subscriptionId);
          }
        }
      };
    } catch (error: any) {
      if (onError) onError(error);
      return {
        success: false,
        error: error.message || 'Failed to subscribe to job applications'
      };
    }
  }

  // Subscribe to messages in a conversation
  static subscribeToConversation(
    userId1: string,
    userId2: string,
    onMessage: (message: any) => void,
    onError?: (error: any) => void
  ): ApiResponse<{ unsubscribe: () => void }> {
    try {
      const channel = `databases.${DATABASE_ID}.COLLECTION_IDS.${COLLECTION_IDS.MESSAGES}.documents`;
      
      const unsubscribe = client.subscribe([channel], (response) => {
        const message = response.payload;
        // Check if message is part of the conversation
        if (
          (message.sender_id === userId1 && message.recipient_id === userId2) ||
          (message.sender_id === userId2 && message.recipient_id === userId1)
        ) {
          onMessage(message);
        }
      });

      const subscriptionId = `conversation_${userId1}_${userId2}`;
      this.subscriptions.set(subscriptionId, unsubscribe);

      return {
        success: true,
        data: {
          unsubscribe: () => {
            unsubscribe();
            this.subscriptions.delete(subscriptionId);
          }
        }
      };
    } catch (error: any) {
      if (onError) onError(error);
      return {
        success: false,
        error: error.message || 'Failed to subscribe to conversation'
      };
    }
  }

  // Subscribe to user's applications status updates
  static subscribeToUserApplications(
    userId: string,
    onUpdate: (application: any) => void,
    onError?: (error: any) => void
  ): ApiResponse<{ unsubscribe: () => void }> {
    try {
      const channel = `databases.${DATABASE_ID}.COLLECTION_IDS.${COLLECTION_IDS.APPLICATIONS}.documents`;
      
      const unsubscribe = client.subscribe([channel], (response) => {
        // Check if the application belongs to this user
        if (response.payload.applicant_id === userId) {
          onUpdate(response.payload);
        }
      });

      const subscriptionId = `user_applications_${userId}`;
      this.subscriptions.set(subscriptionId, unsubscribe);

      return {
        success: true,
        data: {
          unsubscribe: () => {
            unsubscribe();
            this.subscriptions.delete(subscriptionId);
          }
        }
      };
    } catch (error: any) {
      if (onError) onError(error);
      return {
        success: false,
        error: error.message || 'Failed to subscribe to user applications'
      };
    }
  }

  // Subscribe to payment updates
  static subscribeToPayments(
    userId: string,
    onPayment: (payment: any) => void,
    onError?: (error: any) => void
  ): ApiResponse<{ unsubscribe: () => void }> {
    try {
      const channel = `databases.${DATABASE_ID}.COLLECTION_IDS.${COLLECTION_IDS.PAYMENTS}.documents`;
      
      const unsubscribe = client.subscribe([channel], (response) => {
        const payment = response.payload;
        // Check if payment involves this user
        if (payment.payer_id === userId || payment.recipient_id === userId) {
          onPayment(payment);
        }
      });

      const subscriptionId = `payments_${userId}`;
      this.subscriptions.set(subscriptionId, unsubscribe);

      return {
        success: true,
        data: {
          unsubscribe: () => {
            unsubscribe();
            this.subscriptions.delete(subscriptionId);
          }
        }
      };
    } catch (error: any) {
      if (onError) onError(error);
      return {
        success: false,
        error: error.message || 'Failed to subscribe to payments'
      };
    }
  }

  // Subscribe to dispute updates
  static subscribeToDisputes(
    userId: string,
    onDispute: (dispute: any) => void,
    onError?: (error: any) => void
  ): ApiResponse<{ unsubscribe: () => void }> {
    try {
      const channel = `databases.${DATABASE_ID}.COLLECTION_IDS.${COLLECTION_IDS.DISPUTES}.documents`;
      
      const unsubscribe = client.subscribe([channel], (response) => {
        const dispute = response.payload;
        // Check if dispute involves this user
        if (dispute.complainant_id === userId || dispute.respondent_id === userId) {
          onDispute(dispute);
        }
      });

      const subscriptionId = `disputes_${userId}`;
      this.subscriptions.set(subscriptionId, unsubscribe);

      return {
        success: true,
        data: {
          unsubscribe: () => {
            unsubscribe();
            this.subscriptions.delete(subscriptionId);
          }
        }
      };
    } catch (error: any) {
      if (onError) onError(error);
      return {
        success: false,
        error: error.message || 'Failed to subscribe to disputes'
      };
    }
  }

  // Subscribe to platform-wide announcements (admin only)
  static subscribeToAnnouncements(
    onAnnouncement: (announcement: any) => void,
    onError?: (error: any) => void
  ): ApiResponse<{ unsubscribe: () => void }> {
    try {
      const channel = `databases.${DATABASE_ID}.COLLECTION_IDS.${COLLECTION_IDS.PLATFORM_SETTINGS}.documents`;
      
      const unsubscribe = client.subscribe([channel], (response) => {
        onAnnouncement(response.payload);
      });

      const subscriptionId = 'platform_announcements';
      this.subscriptions.set(subscriptionId, unsubscribe);

      return {
        success: true,
        data: {
          unsubscribe: () => {
            unsubscribe();
            this.subscriptions.delete(subscriptionId);
          }
        }
      };
    } catch (error: any) {
      if (onError) onError(error);
      return {
        success: false,
        error: error.message || 'Failed to subscribe to announcements'
      };
    }
  }

  // Get user online status (requires custom implementation)
  static subscribeToUserStatus(
    userIds: string[],
    onStatusChange: (userId: string, isOnline: boolean) => void,
    onError?: (error: any) => void
  ): ApiResponse<{ unsubscribe: () => void }> {
    try {
      // This would require a custom presence system
      // For now, return a placeholder
      const unsubscribe = () => {};
      
      return {
        success: true,
        data: { unsubscribe }
      };
    } catch (error: any) {
      if (onError) onError(error);
      return {
        success: false,
        error: error.message || 'Failed to subscribe to user status'
      };
    }
  }

  // Multiple subscription manager
  static createSubscriptionManager(): {
    subscribe: (subscriptions: Array<() => ApiResponse<{ unsubscribe: () => void }>>) => void;
    unsubscribeAll: () => void;
  } {
    const unsubscribeFunctions: Array<() => void> = [];

    return {
      subscribe: (subscriptions) => {
        subscriptions.forEach(subscriptionFn => {
          const result = subscriptionFn();
          if (result.success) {
            unsubscribeFunctions.push(result.data!.unsubscribe);
          }
        });
      },
      unsubscribeAll: () => {
        unsubscribeFunctions.forEach(unsubscribe => {
          try {
            unsubscribe();
          } catch (error) {
            console.warn('Error unsubscribing:', error);
          }
        });
        unsubscribeFunctions.length = 0;
      }
    };
  }

  // Clean up all subscriptions
  static unsubscribeAll(): void {
    this.subscriptions.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing:', error);
      }
    });
    this.subscriptions.clear();
  }

  // Get active subscription count
  static getActiveSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  // Check if a specific subscription exists
  static hasSubscription(subscriptionId: string): boolean {
    return this.subscriptions.has(subscriptionId);
  }
}
