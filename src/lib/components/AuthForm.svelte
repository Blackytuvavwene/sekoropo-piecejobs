<script lang="ts">
  // Reusable authentication form
  import { AuthService } from '$lib/utils/services';
  import type { ApiResponse } from '$lib/utils/types';
  import AlertMessage from './AlertMessage.svelte';

  interface Props {
    type: 'login' | 'register';
    onSuccess?: () => void;
  }

  let { type, onSuccess }: Props = $props();

  // Svelte 5 runes for reactive state
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let loading = $state(false);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);

  // Derived validation
  const isValid = $derived(() => {
    if (!email || !password) return false;
    if (type === 'register' && password !== confirmPassword) return false;
    return true;
  });
  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    if (!isValid) return;

    loading = true;
    error = null;
    success = null;

    try {
      let result: ApiResponse<any>;
      
      if (type === 'register') {
        result = await AuthService.register({ email, password, name: email, role: 'seeker' });
        if (result.success) {
          success = 'Registration successful! Please check your email to verify your account.';
          // Reset form
          email = '';
          password = '';
          confirmPassword = '';
        }
      } else {
        result = await AuthService.login({ email, password });
        if (result.success) {
          success = 'Login successful!';
          onSuccess?.();
        }
      }

      if (!result.success) {
        error = result.error || 'An error occurred. Please try again.';
      }
    } catch (err) {
      error = 'An unexpected error occurred. Please try again.';
      console.error('Auth error:', err);
    } finally {
      loading = false;
    }
  };
</script>

<div class="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
  <h2 class="text-2xl font-bold mb-6 text-center text-gray-800 capitalize">{type}</h2>
  
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

  <form onsubmit={handleSubmit} class="space-y-4">
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
      <input 
        id="email"
        type="email" 
        bind:value={email} 
        placeholder="Enter your email" 
        class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
        required 
        disabled={loading}
      />
    </div>

    <div>
      <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
      <input 
        id="password"
        type="password" 
        bind:value={password} 
        placeholder="Enter your password" 
        class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
        required 
        disabled={loading}
      />
    </div>

    {#if type === 'register'}
      <div>
        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
        <input 
          id="confirmPassword"
          type="password" 
          bind:value={confirmPassword} 
          placeholder="Confirm your password" 
          class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          required 
          disabled={loading}
        />
        {#if password && confirmPassword && password !== confirmPassword}
          <p class="text-red-500 text-sm mt-1">Passwords do not match</p>
        {/if}
      </div>
    {/if}

    <button 
      type="submit" 
      class="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      disabled={!isValid || loading}
    >
      {#if loading}
        <span class="flex items-center justify-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {type === 'register' ? 'Creating Account...' : 'Signing In...'}
        </span>
      {:else}
        {type === 'register' ? 'Create Account' : 'Sign In'}
      {/if}
    </button>
  </form>
</div>
