// Authentication service
import { account } from '$lib/appwrite/appwrite-client';
import type { AuthResponse, LoginRequest, RegisterRequest, ApiResponse } from '$lib/utils/types';
import { ID } from 'appwrite';

export class AuthService {
  // Login user
  static async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const session = await account.createEmailSession(credentials.email, credentials.password);
      const user = await account.get();
      
      // TODO: Fetch user profile from profiles collection
      const profile = null; // Replace with actual profile fetch
      
      return {
        success: true,
        data: {
          user,
          session,
          profile
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  }

  // Register new user
  static async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const user = await account.create(ID.unique(), userData.email, userData.password, userData.name);
      
      // Create email session
      const session = await account.createEmailSession(userData.email, userData.password);
      
      // TODO: Create user profile in profiles collection
      const profile = null; // Replace with actual profile creation
      
      return {
        success: true,
        data: {
          user,
          session,
          profile
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }

  // Logout user
  static async logout(): Promise<ApiResponse<void>> {
    try {
      await account.deleteSession('current');
      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Logout failed'
      };
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<ApiResponse<any>> {
    try {
      const user = await account.get();
      return {
        success: true,
        data: user
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get current user'
      };
    }
  }

  // Update password
  static async updatePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    try {
      await account.updatePassword(newPassword, oldPassword);
      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update password'
      };
    }
  }

  // Send password recovery email
  static async sendPasswordRecovery(email: string): Promise<ApiResponse<void>> {
    try {
      await account.createRecovery(email, `${window.location.origin}/reset-password`);
      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send recovery email'
      };
    }
  }

  // Complete password recovery
  static async completePasswordRecovery(
    userId: string, 
    secret: string, 
    password: string
  ): Promise<ApiResponse<void>> {
    try {
      await account.updateRecovery(userId, secret, password);
      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to reset password'
      };
    }
  }

  // Send email verification
  static async sendEmailVerification(): Promise<ApiResponse<void>> {
    try {
      await account.createVerification(`${window.location.origin}/verify-email`);
      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send verification email'
      };
    }
  }

  // Verify email
  static async verifyEmail(userId: string, secret: string): Promise<ApiResponse<void>> {
    try {
      await account.updateVerification(userId, secret);
      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to verify email'
      };
    }
  }
}
