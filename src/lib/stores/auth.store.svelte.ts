// Authentication store using Svelte 5 runes
import { AuthService } from '$lib/utils/services';
import type { Profile } from '$lib/utils/types/database.types';
import type { Models } from 'appwrite';

interface AuthState {
  user: Models.User<Models.Preferences> | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Create a reactive auth store using Svelte 5 runes
class AuthStore {
  private state = $state<AuthState>({
    user: null,
    profile: null,
    isAuthenticated: false,
    loading: true,
    error: null
  });

  // Getters using direct property access
  get user() {
    return this.state.user;
  }

  get profile() {
    return this.state.profile;
  }

  get isAuthenticated() {
    return this.state.isAuthenticated;
  }

  get loading() {
    return this.state.loading;
  }

  get error() {
    return this.state.error;
  }

  get isProvider() {
    return this.state.profile?.role === 'provider';
  }

  get isAdmin() {
    return this.state.profile?.role === 'admin';
  }

  // Initialize auth state on app load
  async init() {
    try {
      this.state.loading = true;
      this.state.error = null;

      const result = await AuthService.getCurrentUser();
      
      if (result.success && result.data) {
        this.state.user = result.data;
        this.state.isAuthenticated = true;
        
        // Load user profile
        await this.loadProfile();
      } else {
        this.clearAuth();
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      this.clearAuth();
    } finally {
      this.state.loading = false;
    }
  }

  // Login user
  async login(email: string, password: string) {
    try {
      this.state.loading = true;
      this.state.error = null;

      const result = await AuthService.login({ email, password });
      
      if (result.success && result.data) {
        this.state.user = result.data.user;
        this.state.profile = result.data.profile;
        this.state.isAuthenticated = true;
        
        return { success: true };
      } else {
        this.state.error = result.error || 'Login failed';
        return { success: false, error: this.state.error };
      }
    } catch (err) {
      this.state.error = 'An unexpected error occurred';
      console.error('Login error:', err);
      return { success: false, error: this.state.error };
    } finally {
      this.state.loading = false;
    }
  }

  // Register user
  async register(email: string, password: string, name: string, role: 'seeker' | 'provider') {
    try {
      this.state.loading = true;
      this.state.error = null;

      const result = await AuthService.register({ email, password, name, role });
      
      if (result.success && result.data) {
        this.state.user = result.data.user;
        this.state.profile = result.data.profile;
        this.state.isAuthenticated = true;
        
        return { success: true };
      } else {
        this.state.error = result.error || 'Registration failed';
        return { success: false, error: this.state.error };
      }
    } catch (err) {
      this.state.error = 'An unexpected error occurred';
      console.error('Registration error:', err);
      return { success: false, error: this.state.error };
    } finally {
      this.state.loading = false;
    }
  }

  // Logout user
  async logout() {
    try {
      await AuthService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      this.clearAuth();
    }
  }

  // Load user profile
  private async loadProfile() {
    if (!this.state.user) return;

    try {
      const ProfileService = (await import('$lib/utils/services')).ProfileService;
      const result = await ProfileService.getProfileByUserId(this.state.user.$id);
      
      if (result.success && result.data) {
        this.state.profile = result.data;
      }
    } catch (err) {
      console.error('Profile loading error:', err);
    }
  }

  // Update profile
  async updateProfile(profileData: Partial<Profile>) {
    if (!this.state.user || !this.state.profile) return { success: false, error: 'Not authenticated' };

    try {
      const ProfileService = (await import('$lib/utils/services')).ProfileService;
      const result = await ProfileService.updateProfile(this.state.profile.$id, profileData);
      
      if (result.success && result.data) {
        this.state.profile = result.data;
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Profile update error:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Clear authentication state
  private clearAuth() {
    this.state.user = null;
    this.state.profile = null;
    this.state.isAuthenticated = false;
    this.state.loading = false;
    this.state.error = null;
  }

  // Reset error state
  clearError() {
    this.state.error = null;
  }
}

// Export singleton instance
export const authStore = new AuthStore();
