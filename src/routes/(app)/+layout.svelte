<script lang="ts">
  // App layout for authenticated users
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import AppHeader from '$lib/components/AppHeader.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { authStore } from '$lib/stores/auth.store.svelte';

  interface Props {
    children: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  onMount(async () => {
    // Initialize auth state
    await authStore.init();
    
    // Redirect to login if not authenticated
    if (!authStore.isAuthenticated && !authStore.loading) {
      goto('/login');
    }
  });

  // Derived values for display
  const username = $derived(authStore.user?.name || 'User');
  const userRole = $derived(authStore.profile?.role || 'Role');
</script>

{#if authStore.loading}
  <div class="flex items-center justify-center min-h-screen">
    <LoadingSpinner />
  </div>
{:else if authStore.isAuthenticated}
  <div class="flex flex-col min-h-screen">
    <AppHeader username={username} userRole={userRole} />
    <main class="flex-1 p-6 bg-gray-100">
      {@render children()}
    </main>
  </div>
{:else}
  <!-- This will trigger the redirect to login -->
  <div class="flex items-center justify-center min-h-screen">
    <p>Redirecting to login...</p>
  </div>
{/if}
