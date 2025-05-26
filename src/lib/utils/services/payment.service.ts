// Payment service for managing transactions and escrow
import { databases } from '$lib/appwrite/appwrite-client';
import type { 
  Payment, 
  CreatePaymentRequest, 
  UpdatePaymentRequest,
  ApiResponse,
  PaginatedResponse 
} from '$lib/utils/types';
import { ID, Query } from 'appwrite';
import { DATABASE_ID, COLLECTIONS } from '$lib/utils/constants';

export class PaymentService {
  // Create new payment record
  static async create(paymentData: CreatePaymentRequest): Promise<ApiResponse<Payment>> {
    try {
      const payment = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PAYMENTS,
        ID.unique(),
        {
          job_id: paymentData.jobId,
          payer_id: paymentData.payerId,
          recipient_id: paymentData.recipientId,
          amount: paymentData.amount,
          currency: paymentData.currency || 'BWP',
          payment_method: paymentData.paymentMethod,
          status: 'pending',
          escrow_status: 'held',
          created_at: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: payment as Payment
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create payment'
      };
    }
  }

  // Get payment by ID
  static async getById(paymentId: string): Promise<ApiResponse<Payment>> {
    try {
      const payment = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.PAYMENTS,
        paymentId
      );

      return {
        success: true,
        data: payment as Payment
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch payment'
      };
    }
  }

  // Get payments for a job
  static async getByJobId(jobId: string): Promise<ApiResponse<Payment[]>> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PAYMENTS,
        [
          Query.equal('job_id', jobId),
          Query.orderDesc('created_at')
        ]
      );

      return {
        success: true,
        data: response.documents as Payment[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch job payments'
      };
    }
  }

  // Get user payment history
  static async getUserPayments(
    userId: string,
    type: 'sent' | 'received' | 'all' = 'all',
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<PaginatedResponse<Payment>>> {
    try {
      const queries = [
        Query.orderDesc('created_at'),
        Query.limit(limit),
        Query.offset(offset)
      ];

      if (type === 'sent') {
        queries.push(Query.equal('payer_id', userId));
      } else if (type === 'received') {
        queries.push(Query.equal('recipient_id', userId));
      } else {
        // For 'all', we need to make two separate queries and combine
        // This is a limitation of Appwrite - we can't do OR queries directly
        const [sentResponse, receivedResponse] = await Promise.all([
          databases.listDocuments(DATABASE_ID, COLLECTIONS.PAYMENTS, [
            Query.equal('payer_id', userId),
            Query.orderDesc('created_at'),
            Query.limit(limit),
            Query.offset(offset)
          ]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.PAYMENTS, [
            Query.equal('recipient_id', userId),
            Query.orderDesc('created_at'),
            Query.limit(limit),
            Query.offset(offset)
          ])
        ]);

        // Combine and sort by date
        const allPayments = [...sentResponse.documents, ...receivedResponse.documents]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(offset, offset + limit);

        return {
          success: true,
          data: {
            documents: allPayments as Payment[],
            total: sentResponse.total + receivedResponse.total
          }
        };
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PAYMENTS,
        queries
      );

      return {
        success: true,
        data: {
          documents: response.documents as Payment[],
          total: response.total
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch user payments'
      };
    }
  }

  // Update payment status
  static async updateStatus(
    paymentId: string,
    status: Payment['status']
  ): Promise<ApiResponse<Payment>> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Add status-specific timestamps
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (status === 'failed') {
        updateData.failed_at = new Date().toISOString();
      } else if (status === 'refunded') {
        updateData.refunded_at = new Date().toISOString();
      }

      const payment = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PAYMENTS,
        paymentId,
        updateData
      );

      return {
        success: true,
        data: payment as Payment
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update payment status'
      };
    }
  }

  // Release escrow payment
  static async releaseEscrow(paymentId: string): Promise<ApiResponse<Payment>> {
    try {
      const payment = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PAYMENTS,
        paymentId,
        {
          escrow_status: 'released',
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: payment as Payment
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to release escrow payment'
      };
    }
  }

  // Refund escrow payment
  static async refundEscrow(
    paymentId: string,
    reason?: string
  ): Promise<ApiResponse<Payment>> {
    try {
      const payment = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PAYMENTS,
        paymentId,
        {
          escrow_status: 'refunded',
          status: 'refunded',
          refund_reason: reason,
          refunded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: payment as Payment
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to refund escrow payment'
      };
    }
  }

  // Update payment details
  static async update(
    paymentId: string,
    updateData: UpdatePaymentRequest
  ): Promise<ApiResponse<Payment>> {
    try {
      const payment = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PAYMENTS,
        paymentId,
        {
          ...updateData,
          updated_at: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: payment as Payment
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update payment'
      };
    }
  }

  // Get payment statistics
  static async getStats(dateRange?: { start: string; end: string }): Promise<ApiResponse<{
    totalTransactions: number;
    totalAmount: number;
    pendingAmount: number;
    completedAmount: number;
    refundedAmount: number;
    averageTransactionValue: number;
  }>> {
    try {
      const queries = [Query.orderDesc('created_at')];
      
      if (dateRange) {
        queries.push(Query.greaterThanEqual('created_at', dateRange.start));
        queries.push(Query.lessThanEqual('created_at', dateRange.end));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PAYMENTS,
        queries
      );

      const payments = response.documents as Payment[];
      
      const stats = payments.reduce((acc, payment) => {
        acc.totalTransactions++;
        acc.totalAmount += payment.amount;
        
        if (payment.status === 'pending') {
          acc.pendingAmount += payment.amount;
        } else if (payment.status === 'completed') {
          acc.completedAmount += payment.amount;
        } else if (payment.status === 'refunded') {
          acc.refundedAmount += payment.amount;
        }
        
        return acc;
      }, {
        totalTransactions: 0,
        totalAmount: 0,
        pendingAmount: 0,
        completedAmount: 0,
        refundedAmount: 0,
        averageTransactionValue: 0
      });

      stats.averageTransactionValue = stats.totalTransactions > 0 
        ? stats.totalAmount / stats.totalTransactions 
        : 0;

      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch payment statistics'
      };
    }
  }
}
