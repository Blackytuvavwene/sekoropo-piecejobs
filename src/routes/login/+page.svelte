<script lang="ts">
  // Login page component
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store.svelte';
  import AuthForm from '$lib/components/AuthForm.svelte';
  import AlertMessage from '$lib/components/AlertMessage.svelte';

  // Check if already authenticated
  $effect(() => {
    if (authStore.isAuthenticated && !authStore.loading) {
      goto('/app');
    }
  });

  const handleAuthSuccess = () => {
    goto('/app');
  };
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-900">PieceJobs Botswana</h1>
      <p class="mt-2 text-sm text-gray-600">Your gateway to piece-job opportunities</p>
    </div>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      {#if authStore.error}
        <div class="mb-4">
          <AlertMessage message={authStore.error} type="error" />
        </div>
      {/if}
      
      <AuthForm type="login" onSuccess={handleAuthSuccess} />
    </div>
  </div>
</div>
