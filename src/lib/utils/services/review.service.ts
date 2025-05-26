// Review service for managing user reviews and ratings
import { databases } from '$lib/appwrite/appwrite-client';
import type { 
  Review, 
  CreateReviewRequest, 
  UpdateReviewRequest,
  ApiResponse,
  PaginatedResponse 
} from '$lib/utils/types';
import { ID, Query } from 'appwrite';
import { DATABASE_ID, COLLECTION_IDS } from '$lib/utils/types/database.types';

export class ReviewService {
  // Create new review
  static async create(reviewData: CreateReviewRequest): Promise<ApiResponse<Review>> {
    try {
      const review = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.REVIEWS,
        ID.unique(),
        {
          job_id: reviewData.jobId,
          reviewer_id: reviewData.reviewerId,
          reviewee_id: reviewData.revieweeId,
          rating: reviewData.rating,
          comment: reviewData.comment,
          review_type: reviewData.reviewType,
          created_at: new Date().toISOString()
        }
      );

      // Update user's average rating
      await this.updateUserRating(reviewData.revieweeId);

      return {
        success: true,
        data: review as Review
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create review'
      };
    }
  }

  // Get review by ID
  static async getById(reviewId: string): Promise<ApiResponse<Review>> {
    try {
      const review = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_IDS.REVIEWS,
        reviewId
      );

      return {
        success: true,
        data: review as Review
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch review'
      };
    }
  }

  // Get reviews for a specific user (as reviewee)
  static async getUserReviews(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<PaginatedResponse<Review>>> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.REVIEWS,
        [
          Query.equal('reviewee_id', userId),
          Query.orderDesc('created_at'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      );

      return {
        success: true,
        data: {
          documents: response.documents as Review[],
          total: response.total
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch user reviews'
      };
    }
  }

  // Get reviews by a specific user (as reviewer)
  static async getReviewsByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<PaginatedResponse<Review>>> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.REVIEWS,
        [
          Query.equal('reviewer_id', userId),
          Query.orderDesc('created_at'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      );

      return {
        success: true,
        data: {
          documents: response.documents as Review[],
          total: response.total
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch reviews by user'
      };
    }
  }

  // Get reviews for a specific job
  static async getJobReviews(
    jobId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<PaginatedResponse<Review>>> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.REVIEWS,
        [
          Query.equal('job_id', jobId),
          Query.orderDesc('created_at'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      );

      return {
        success: true,
        data: {
          documents: response.documents as Review[],
          total: response.total
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch job reviews'
      };
    }
  }

  // Update review
  static async update(
    reviewId: string,
    updateData: UpdateReviewRequest
  ): Promise<ApiResponse<Review>> {
    try {
      // Get the current review to check if rating changed
      const currentReview = await this.getById(reviewId);
      if (!currentReview.success) {
        return currentReview;
      }

      const review = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.REVIEWS,
        reviewId,
        {
          ...updateData,
          updated_at: new Date().toISOString()
        }
      );

      // Update user's average rating if rating changed
      if (updateData.rating && updateData.rating !== currentReview.data!.rating) {
        await this.updateUserRating(currentReview.data!.reviewee_id);
      }

      return {
        success: true,
        data: review as Review
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update review'
      };
    }
  }

  // Delete review
  static async delete(reviewId: string): Promise<ApiResponse<void>> {
    try {
      // Get the review to update user rating after deletion
      const reviewResult = await this.getById(reviewId);
      if (!reviewResult.success) {
        return reviewResult as ApiResponse<void>;
      }

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_IDS.REVIEWS,
        reviewId
      );

      // Update user's average rating
      await this.updateUserRating(reviewResult.data!.reviewee_id);

      return {
        success: true,
        data: undefined
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete review'
      };
    }
  }

  // Get user rating statistics
  static async getUserRatingStats(userId: string): Promise<ApiResponse<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { [key: number]: number };
    recentReviews: Review[];
  }>> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.REVIEWS,
        [
          Query.equal('reviewee_id', userId),
          Query.orderDesc('created_at')
        ]
      );

      const reviews = response.documents as Review[];
      
      if (reviews.length === 0) {
        return {
          success: true,
          data: {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: {},
            recentReviews: []
          }
        };
      }

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      const ratingDistribution = reviews.reduce((dist, review) => {
        dist[review.rating] = (dist[review.rating] || 0) + 1;
        return dist;
      }, {} as { [key: number]: number });

      return {
        success: true,
        data: {
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
          totalReviews: reviews.length,
          ratingDistribution,
          recentReviews: reviews.slice(0, 5) // Last 5 reviews
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch user rating statistics'
      };
    }
  }

  // Check if user can review a job
  static async canUserReview(
    userId: string,
    jobId: string,
    revieweeId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      // Check if user has already reviewed this job for this reviewee
      const existingReview = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.REVIEWS,
        [
          Query.equal('job_id', jobId),
          Query.equal('reviewer_id', userId),
          Query.equal('reviewee_id', revieweeId),
          Query.limit(1)
        ]
      );

      if (existingReview.documents.length > 0) {
        return {
          success: true,
          data: false // Already reviewed
        };
      }

      // TODO: Add additional checks:
      // - Check if job is completed
      // - Check if user was involved in the job
      // - Check if enough time has passed

      return {
        success: true,
        data: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to check review eligibility'
      };
    }
  }

  // Private method to update user's average rating in their profile
  private static async updateUserRating(userId: string): Promise<void> {
    try {
      const stats = await this.getUserRatingStats(userId);
      if (stats.success) {
        // Update user profile with new average rating
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_IDS.PROFILES,
          userId,
          {
            average_rating: stats.data.averageRating,
            total_reviews: stats.data.totalReviews,
            updated_at: new Date().toISOString()
          }
        );
      }
    } catch (error) {
      // Log error but don't throw - this is a background operation
      console.error('Failed to update user rating:', error);
    }
  }

  // Get platform review statistics
  static async getPlatformStats(dateRange?: { start: string; end: string }): Promise<ApiResponse<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: { [key: number]: number };
    reviewsByType: { [key: string]: number };
  }>> {
    try {
      const queries = [Query.orderDesc('created_at')];
      
      if (dateRange) {
        queries.push(Query.greaterThanEqual('created_at', dateRange.start));
        queries.push(Query.lessThanEqual('created_at', dateRange.end));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.REVIEWS,
        queries
      );

      const reviews = response.documents as Review[];
      
      if (reviews.length === 0) {
        return {
          success: true,
          data: {
            totalReviews: 0,
            averageRating: 0,
            ratingDistribution: {},
            reviewsByType: {}
          }
        };
      }

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      const ratingDistribution = reviews.reduce((dist, review) => {
        dist[review.rating] = (dist[review.rating] || 0) + 1;
        return dist;
      }, {} as { [key: number]: number });

      const reviewsByType = reviews.reduce((types, review) => {
        types[review.review_type] = (types[review.review_type] || 0) + 1;
        return types;
      }, {} as { [key: string]: number });

      return {
        success: true,
        data: {
          totalReviews: reviews.length,
          averageRating: Math.round(averageRating * 10) / 10,
          ratingDistribution,
          reviewsByType
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch platform review statistics'
      };
    }
  }
}
