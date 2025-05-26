<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store.svelte';

  onMount(() => {
    // Get current auth state
    const currentUser = authStore.user;
    
    if (currentUser) {
      // User is logged in, check if they're admin
      if (currentUser.labels?.includes('admin')) {
        goto('/admin', { replaceState: true });
      } else {
        goto('/jobs', { replaceState: true });
      }
    }
    // If user is not logged in, keep them here to show the landing page
  });
</script>

<!-- Landing Page for non-authenticated users -->
<section class="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-20">
  <div class="container mx-auto text-center">
    <h1 class="text-4xl font-bold mb-4">Welcome to Botswana Piece-Job Platform</h1>
    <p class="text-xl mb-8">Connecting skilled workers with piece-job opportunities across Botswana.</p>
    
    <div class="space-x-4">
      <a href="/login" class="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
        Get Started
      </a>
      <a href="/about" class="inline-block border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
        Learn More
      </a>
    </div>
  </div>
</section>

<section class="py-16 bg-gray-50">
  <div class="container mx-auto px-4">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-gray-800 mb-4">How It Works</h2>
      <p class="text-gray-600 max-w-2xl mx-auto">Our platform makes it easy to find piece-job opportunities or hire skilled workers across Botswana.</p>
    </div>
    
    <div class="grid md:grid-cols-3 gap-8">
      <div class="text-center">
        <div class="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <h3 class="text-xl font-semibold mb-2">Find Jobs</h3>
        <p class="text-gray-600">Browse available piece-jobs in your area and apply with just a few clicks.</p>
      </div>
      
      <div class="text-center">
        <div class="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 class="text-xl font-semibold mb-2">Get Hired</h3>
        <p class="text-gray-600">Complete jobs safely with our secure payment and dispute resolution system.</p>
      </div>
      
      <div class="text-center">
        <div class="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
          </svg>
        </div>
        <h3 class="text-xl font-semibold mb-2">Earn Money</h3>
        <p class="text-gray-600">Get paid securely through our platform with transparent pricing and reviews.</p>
      </div>
    </div>
  </div>
</section>
