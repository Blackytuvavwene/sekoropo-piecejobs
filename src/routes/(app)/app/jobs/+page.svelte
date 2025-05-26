<script lang="ts">
  // Browse Jobs page
  import { onMount } from 'svelte';
  import JobCard from '$lib/components/JobCard.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import AlertMessage from '$lib/components/AlertMessage.svelte';  import { JobService } from '$lib/utils/services';
  import type { Job, JobStatus } from '$lib/utils/types/database.types';
  
  // Svelte 5 runes for reactive state
  let jobs = $state<Job[]>([]);
  let filteredJobs = $state<Job[]>([]);
  let searchQuery = $state('');
  let statusFilter = $state<JobStatus | 'all'>('all');
  let loading = $state(true);
  let error = $state<string | null>(null);
  
  // Derived filtered jobs based on search and status
  const filterJobs = $derived.by(() => {
    let filtered = jobs;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query)
      );
    }
      // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }
    
    return filtered;
  });
    const loadJobs = async () => {
    try {
      loading = true;
      error = null;
      
      const result = await JobService.searchJobs({});
      
      if (result.success && result.data) {
        jobs = result.data.documents;
      } else {
        error = result.error || 'Failed to load jobs';
      }
    } catch (err) {
      error = 'An unexpected error occurred';
      console.error('Jobs load error:', err);
    } finally {
      loading = false;
    }
  };
  
  const handleStatusFilter = (status: JobStatus | 'all') => {
    statusFilter = status;
  };
  
  onMount(() => {
    loadJobs();
  });
</script>

<section class="container mx-auto py-8">
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
    <h1 class="text-3xl font-bold text-gray-900 mb-4 lg:mb-0">Browse Jobs</h1>
    <a 
      href="/app/jobs/post" 
      class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      Post a Job
    </a>
  </div>
  
  <!-- Filters -->
  <div class="bg-white rounded-lg shadow-sm border p-4 mb-6">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Search -->
      <div>
        <label for="search" class="block text-sm font-medium text-gray-700 mb-1">Search Jobs</label>
        <input 
          id="search"
          type="text" 
          bind:value={searchQuery} 
          placeholder="Search by title, description, or location..." 
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
        <!-- Status Filter -->
      <div>
        <span class="block text-sm font-medium text-gray-700 mb-1">Status</span>
        <div class="flex flex-wrap gap-2">
          <button
            onclick={() => handleStatusFilter('all')}
            class={`px-3 py-1 rounded-full text-sm ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            All
          </button>
          <button
            onclick={() => handleStatusFilter('open')}
            class={`px-3 py-1 rounded-full text-sm ${statusFilter === 'open' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Open
          </button>
          <button
            onclick={() => handleStatusFilter('assigned')}
            class={`px-3 py-1 rounded-full text-sm ${statusFilter === 'assigned' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Assigned
          </button>
          <button
            onclick={() => handleStatusFilter('completed')}
            class={`px-3 py-1 rounded-full text-sm ${statusFilter === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Completed
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Content -->
  {#if loading}
    <div class="flex justify-center py-12">
      <LoadingSpinner />
    </div>
  {:else if error}
    <div class="max-w-md mx-auto">
      <AlertMessage message={error} type="error" />
    </div>
  {:else if filterJobs.length === 0}
    <div class="text-center py-12">
      <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 002 2h2a2 2 0 002-2V8a2 2 0 00-2-2h-2z"></path>
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
      <p class="text-gray-600 mb-4">
        {searchQuery || statusFilter !== 'all' ? 'No jobs match your current filters.' : 'No jobs have been posted yet.'}
      </p>
      {#if searchQuery || statusFilter !== 'all'}
        <button
          onclick={() => { searchQuery = ''; statusFilter = 'all'; }}
          class="text-blue-600 hover:text-blue-700"
        >
          Clear filters
        </button>
      {/if}
    </div>
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {#each filterJobs as job (job.$id)}
        <JobCard {job} />
      {/each}
    </div>
    
    <!-- Results summary -->
    <div class="mt-6 text-center text-sm text-gray-600">
      Showing {filterJobs.length} of {jobs.length} jobs
    </div>
  {/if}
</section>
