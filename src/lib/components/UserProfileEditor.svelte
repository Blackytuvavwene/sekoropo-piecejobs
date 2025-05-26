<script lang="ts">
  // Allows users to view and update their profile
  import { ProfileService, FileService } from '$lib/utils/services';
  import type { Profile, ApiResponse } from '$lib/utils/types';
  import AlertMessage from './AlertMessage.svelte';
  import LoadingSpinner from './LoadingSpinner.svelte';

  interface Props {
    userProfile: Profile;
    isProvider?: boolean;
    onUpdate?: (profile: Profile) => void;
  }

  let { userProfile, isProvider = false, onUpdate }: Props = $props();

  // Svelte 5 runes for reactive state
  let name = $state(userProfile.full_name);
  let phone = $state(userProfile.phone || '');
  let bio = $state(userProfile.bio || '');
  let skills = $state(userProfile.skills ? userProfile.skills.join(', ') : '');
  let location = $state(userProfile.location || '');
  let hourlyRate = $state(userProfile.hourly_rate || 0);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);
  let avatarFile = $state<File | null>(null);
  let avatarPreview = $state<string | null>(null);

  // Derived validation
  const isValid = $derived(() => {
    return name.trim().length > 0;
  });

  const hasChanges = $derived(() => {
    return (
      name !== userProfile.full_name ||
      phone !== (userProfile.phone || '') ||
      bio !== (userProfile.bio || '') ||
      skills !== (userProfile.skills ? userProfile.skills.join(', ') : '') ||
      location !== (userProfile.location || '') ||
      hourlyRate !== (userProfile.hourly_rate || 0) ||
      avatarFile !== null
    );
  });

  const handleAvatarChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        error = 'Please select a valid image file';
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        error = 'Image size should be less than 5MB';
        return;
      }

      avatarFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        avatarPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSave = async (event: Event) => {
    event.preventDefault();
    if (!isValid || !hasChanges) return;

    loading = true;
    error = null;
    success = null;

    try {
      let avatarUrl = userProfile.avatar_url;

      // Upload avatar if changed
      if (avatarFile) {
        const uploadResult = await FileService.uploadAvatar(avatarFile, userProfile.$id);
        if (uploadResult.success && uploadResult.data) {
          avatarUrl = uploadResult.data.url;
        } else {
          throw new Error(uploadResult.error || 'Failed to upload avatar');
        }
      }

      // Update profile
      const updateData: Partial<Profile> = {
        full_name: name,
        phone: phone || undefined,
        bio: bio || undefined,
        skills: skills ? skills.split(',').map(s => s.trim()).filter(s => s) : [],
        location: location || undefined,
        hourly_rate: isProvider ? hourlyRate : undefined,
        avatar_url: avatarUrl
      };

      const result = await ProfileService.updateProfile(userProfile.$id, updateData);

      if (result.success && result.data) {
        success = 'Profile updated successfully!';
        onUpdate?.(result.data);
        
        // Reset avatar file state
        avatarFile = null;
        avatarPreview = null;
      } else {
        error = result.error || 'Failed to update profile';
      }
    } catch (err) {
      error = 'An unexpected error occurred. Please try again.';
      console.error('Profile update error:', err);
    } finally {
      loading = false;
    }
  };
</script>

<div class="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
  <h2 class="text-2xl font-bold mb-6 text-gray-800">Edit Profile</h2>
  
  {#if error}
    <div class="mb-4">
      <AlertMessage message={error} type="error" />
    </div>
  {/if}

  {#if success}
    <div class="mb-4">
      <AlertMessage message={success} type="success" />
    </div>
  {/if}

  <form onsubmit={handleSave} class="space-y-6">
    <!-- Avatar Upload -->
    <div class="flex items-center space-x-6">
      <div class="shrink-0">
        <img 
          class="h-20 w-20 object-cover rounded-full border-2 border-gray-300" 
          src={avatarPreview || userProfile.avatar_url || '/default-avatar.png'} 
          alt="Current avatar" 
        />
      </div>      <div>
        <label for="profile-picture" class="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
        <input 
          id="profile-picture"
          type="file" 
          accept="image/*"
          onchange={handleAvatarChange}
          class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={loading}
        />
        <p class="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
      </div>
    </div>

    <!-- Basic Information -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
        <input 
          id="name"
          type="text" 
          bind:value={name} 
          class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          required 
          disabled={loading}
        />
      </div>

      <div>
        <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input 
          id="phone"
          type="tel" 
          bind:value={phone} 
          class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          disabled={loading}
        />
      </div>

      <div>
        <label for="location" class="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input 
          id="location"
          type="text" 
          bind:value={location} 
          placeholder="City, Country"
          class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          disabled={loading}
        />
      </div>

      {#if isProvider}
        <div>
          <label for="hourlyRate" class="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (BWP)</label>
          <input 
            id="hourlyRate"
            type="number" 
            bind:value={hourlyRate} 
            min="0"
            step="0.01"
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            disabled={loading}
          />
        </div>
      {/if}
    </div>

    <!-- Bio -->
    <div>
      <label for="bio" class="block text-sm font-medium text-gray-700 mb-1">Bio</label>
      <textarea 
        id="bio"
        bind:value={bio} 
        rows="4"
        placeholder="Tell us about yourself..."
        class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
        disabled={loading}
      ></textarea>
    </div>

    {#if isProvider}
      <!-- Skills -->
      <div>
        <label for="skills" class="block text-sm font-medium text-gray-700 mb-1">Skills</label>
        <input 
          id="skills"
          type="text" 
          bind:value={skills} 
          placeholder="e.g., Web Development, Graphic Design, Writing (comma-separated)"
          class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          disabled={loading}
        />
        <p class="text-xs text-gray-500 mt-1">Separate skills with commas</p>
      </div>
    {/if}

    <!-- Actions -->
    <div class="flex justify-end space-x-4 pt-6 border-t">
      <button 
        type="button"
        class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        disabled={loading}
      >
        Cancel
      </button>
      <button 
        type="submit" 
        class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        disabled={!isValid || !hasChanges || loading}
      >
        {#if loading}
          <div class="flex items-center">
            <LoadingSpinner size="sm" />
            <span class="ml-2">Saving...</span>
          </div>
        {:else}
          Save Changes
        {/if}
      </button>
    </div>
  </form>
</div>
