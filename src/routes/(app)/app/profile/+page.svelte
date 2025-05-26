<script lang="ts">
  // User Profile page
  import UserProfileEditor from '$lib/components/UserProfileEditor.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import AlertMessage from '$lib/components/AlertMessage.svelte';
import { authStore } from '$lib/stores/auth.store.svelte';
  import type { Profile } from '$lib/utils/types/database.types';

  const handleProfileUpdate = async (profile: Profile) => {
    const result = await authStore.updateProfile(profile);
    if (result.success) {
      // Profile updated successfully
      console.log('Profile updated successfully');
    } else {
      console.error('Profile update failed:', result.error);
    }
  };
</script>

<section class="container mx-auto py-8">
  {#if !authStore.profile && authStore.loading}
    <div class="flex justify-center">
      <LoadingSpinner />
    </div>
  {:else if authStore.profile}
    <UserProfileEditor 
      userProfile={authStore.profile} 
      isProvider={authStore.isProvider} 
      onUpdate={handleProfileUpdate}
    />
  {:else}
    <div class="max-w-md mx-auto">
      <AlertMessage 
        message="Unable to load profile. Please try refreshing the page." 
        type="error" 
      />
    </div>
  {/if}
</section>
