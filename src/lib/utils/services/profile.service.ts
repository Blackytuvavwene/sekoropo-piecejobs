// Profile service for user profile operations
import { databases } from '$lib/appwrite/appwrite-client';
import { APPWRITE_CONFIG } from '../constants';
import { Query, ID } from 'appwrite';
import type { 
  Profile, 
  ProfileWithStats, 
  UpdateProfileRequest,
  ApiResponse 
} from '../types';

export class ProfileService {
  private static readonly databaseId = APPWRITE_CONFIG.databaseId;
  private static readonly collectionId = 'profiles';

  // Create user profile
  static async createProfile(profileData: {
    userId: string;
    role: 'seeker' | 'provider' | 'admin';
    fullName: string;
    phoneNumber: string;
    location: string;
    bio?: string;
    skills?: string[];
    hourlyRate?: number;
  }): Promise<ApiResponse<Profile>> {
    try {
      const profile = await databases.createDocument(
        this.databaseId,
        this.collectionId,
        ID.unique(),
        {
          ...profileData,
          isPhoneVerified: false,
          isIDVerified: false,
          averageRating: 0,
          jobsCompleted: 0
        }
      );

      return {
        success: true,
        data: profile as Profile
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create profile'
      };
    }
  }

  // Get profile by ID
  static async getProfileById(profileId: string): Promise<ApiResponse<Profile>> {
    try {
      const profile = await databases.getDocument(
        this.databaseId,
        this.collectionId,
        profileId
      );

      return {
        success: true,
        data: profile as Profile
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get profile'
      };
    }
  }

  // Get profile by user ID
  static async getProfileByUserId(userId: string): Promise<ApiResponse<Profile>> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [Query.equal('userId', userId)]
      );

      if (response.documents.length === 0) {
        return {
          success: false,
          error: 'Profile not found'
        };
      }

      return {
        success: true,
        data: response.documents[0] as Profile
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get profile'
      };
    }
  }

  // Update profile
  static async updateProfile(profileId: string, updates: UpdateProfileRequest): Promise<ApiResponse<Profile>> {
    try {
      const profile = await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        profileId,
        updates
      );

      return {
        success: true,
        data: profile as Profile
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update profile'
      };
    }
  }

  // Get profiles by role
  static async getProfilesByRole(role: 'seeker' | 'provider' | 'admin'): Promise<ApiResponse<Profile[]>> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal('role', role),
          Query.orderDesc('$createdAt')
        ]
      );

      return {
        success: true,
        data: response.documents as Profile[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get profiles'
      };
    }
  }

  // Search providers by skills
  static async searchProviders(skills: string[], location?: string): Promise<ApiResponse<Profile[]>> {
    try {
      const queries = [
        Query.equal('role', 'provider')
      ];

      if (skills.length > 0) {
        queries.push(Query.contains('skills', skills));
      }

      if (location) {
        queries.push(Query.equal('location', location));
      }

      queries.push(Query.orderDesc('averageRating'));

      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        queries
      );

      return {
        success: true,
        data: response.documents as Profile[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to search providers'
      };
    }
  }

  // Update profile rating
  static async updateRating(profileId: string, newRating: number, totalReviews: number): Promise<ApiResponse<Profile>> {
    try {
      const profile = await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        profileId,
        {
          averageRating: newRating
        }
      );

      return {
        success: true,
        data: profile as Profile
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update rating'
      };
    }
  }

  // Increment jobs completed
  static async incrementJobsCompleted(profileId: string): Promise<ApiResponse<Profile>> {
    try {
      // First get current count
      const currentProfile = await this.getProfileById(profileId);
      if (!currentProfile.success || !currentProfile.data) {
        return currentProfile;
      }

      const newCount = (currentProfile.data.jobsCompleted || 0) + 1;

      const profile = await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        profileId,
        {
          jobsCompleted: newCount
        }
      );

      return {
        success: true,
        data: profile as Profile
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update jobs completed'
      };
    }
  }

  // Verify phone number
  static async verifyPhone(profileId: string): Promise<ApiResponse<Profile>> {
    try {
      const profile = await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        profileId,
        {
          isPhoneVerified: true
        }
      );

      return {
        success: true,
        data: profile as Profile
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to verify phone'
      };
    }
  }

  // Verify ID
  static async verifyID(profileId: string): Promise<ApiResponse<Profile>> {
    try {
      const profile = await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        profileId,
        {
          isIDVerified: true
        }
      );

      return {
        success: true,
        data: profile as Profile
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to verify ID'
      };
    }
  }

  // Get top-rated providers
  static async getTopProviders(limit: number = 10): Promise<ApiResponse<Profile[]>> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal('role', 'provider'),
          Query.greaterThan('averageRating', 4.0),
          Query.orderDesc('averageRating'),
          Query.limit(limit)
        ]
      );

      return {
        success: true,
        data: response.documents as Profile[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get top providers'
      };
    }
  }

  // Get profile statistics
  static async getProfileStats(profileId: string): Promise<ApiResponse<ProfileWithStats>> {
    try {
      const profile = await this.getProfileById(profileId);
      if (!profile.success || !profile.data) {
        return profile as ApiResponse<ProfileWithStats>;
      }

      // TODO: Fetch related statistics
      // - Reviews given/received
      // - Jobs posted/applied to
      // This would require implementing other services first

      const profileWithStats: ProfileWithStats = {
        ...profile.data,
        reviewsGiven: [],
        reviewsReceived: [],
        jobsPosted: [],
        applications: []
      };

      return {
        success: true,
        data: profileWithStats
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get profile stats'
      };
    }
  }
}
