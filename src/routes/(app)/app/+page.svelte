<script lang="ts">
  // User Dashboard
  import { onMount } from 'svelte';
  import { JobService, AuthService, ApplicationService } from '$lib/utils/services';
  import type { Job, User, Application } from '$lib/utils/types';
  import JobCard from '$lib/components/JobCard.svelte';
  import NotificationsList from '$lib/components/NotificationsList.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import AlertMessage from '$lib/components/AlertMessage.svelte';

  // Svelte 5 runes for reactive state
  let currentUser = $state<User | null>(null);
  let jobs = $state<Job[]>([]);
  let applications = $state<Application[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Derived values
  const isEmployer = $derived(() => currentUser?.role === 'employer');
  const isProvider = $derived(() => currentUser?.role === 'provider');
  const recentApplications = $derived(() => applications.slice(0, 5));

  const loadDashboardData = async () => {
    try {
      loading = true;
      error = null;

      // Get current user
      const userResult = await AuthService.getCurrentUser();
      if (!userResult.success || !userResult.data) {
        error = 'Please log in to access your dashboard';
        return;
      }

      currentUser = userResult.data;

      // Load appropriate data based on user role
      if (isEmployer) {
        // Load employer's posted jobs
        const jobsResult = await JobService.getJobsByEmployer(currentUser.$id);
        if (jobsResult.success && jobsResult.data) {
          jobs = jobsResult.data;
        }
      } else {
        // Load recommended jobs for providers
        const jobsResult = await JobService.getActiveJobs(10);
        if (jobsResult.success && jobsResult.data) {
          jobs = jobsResult.data;
        }

        // Load user's applications
        const appsResult = await ApplicationService.getProviderApplications(currentUser.$id);
        if (appsResult.success && appsResult.data) {
          applications = appsResult.data;
        }
      }
    } catch (err) {
      error = 'Failed to load dashboard data';
      console.error('Dashboard load error:', err);
    } finally {
      loading = false;
    }
  };

  const handleJobView = (jobId: string) => {
    window.location.href = `/app/jobs/${jobId}`;
  };

  const handleJobApply = (jobId: string) => {
    window.location.href = `/app/jobs/${jobId}?apply=true`;
  };

  onMount(() => {
    loadDashboardData();
  });
</script>

<div class="container mx-auto px-4 py-8">
  {#if loading}
    <div class="flex justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>
  {:else if error}
    <AlertMessage message={error} type="error" />
  {:else if currentUser}
    <!-- Welcome Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        Welcome back, {currentUser.name}!
      </h1>
      <p class="text-gray-600">
        {#if isEmployer}
          Manage your job postings and find the right talent for your projects.
        {:else}
          Discover new opportunities and grow your freelance career.
        {/if}
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Main Content -->
      <div class="lg:col-span-2">
        {#if isEmployer}
          <!-- Employer Dashboard -->
          <div class="mb-8">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-gray-900">Your Posted Jobs</h2>
              <a 
                href="/app/jobs/post"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Post New Job
              </a>
            </div>
            
            {#if jobs.length > 0}
              <div class="space-y-4">
                {#each jobs as job}
                  <JobCard 
                    {job} 
                    showActions={false}
                    onView={handleJobView}
                  />
                {/each}
              </div>
            {:else}
              <div class="text-center py-12 bg-gray-50 rounded-lg">
                <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 002 2h2a2 2 0 002-2V8a2 2 0 00-2-2h-2z"/>
                </svg>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
                <p class="text-gray-600 mb-4">Start by posting your first job to find talented professionals.</p>
                <a 
                  href="/app/jobs/post"
                  class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Post Your First Job
                </a>
              </div>
            {/if}
          </div>
        {:else}
          <!-- Provider Dashboard -->
          <div class="mb-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Recommended Jobs</h2>
            
            {#if jobs.length > 0}
              <div class="space-y-4">
                {#each jobs as job}
                  <JobCard 
                    {job} 
                    onView={handleJobView}
                    onApply={handleJobApply}
                  />
                {/each}
              </div>
              
              <div class="text-center mt-6">
                <a 
                  href="/app/jobs"
                  class="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View All Jobs
                </a>
              </div>
            {:else}
              <div class="text-center py-12 bg-gray-50 rounded-lg">
                <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 002 2h2a2 2 0 002-2V8a2 2 0 00-2-2h-2z"/>
                </svg>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No jobs available</h3>
                <p class="text-gray-600">Check back later for new opportunities.</p>
              </div>
            {/if}
          </div>

          <!-- Recent Applications -->
          {#if applications.length > 0}
            <div class="mb-8">
              <h2 class="text-xl font-semibold text-gray-900 mb-4">Recent Applications</h2>
              <div class="bg-white rounded-lg shadow-sm border">
                {#each recentApplications as applicationTyped}
                  {@const application: Application = applicationTyped}
                  <div class="p-4 border-b border-gray-200 last:border-b-0">
                    <div class="flex items-center justify-between">
                      <div>
                        <h4 class="font-medium text-gray-900">{application.job_title}</h4>
                        <p class="text-sm text-gray-600">Applied on {new Date(application.created_at).toLocaleDateString()}</p>
                      </div>
                      <span class={`px-2 py-1 rounded-full text-xs font-medium ${{
                        'pending': 'bg-yellow-100 text-yellow-800',
                        'accepted': 'bg-green-100 text-green-800',
                        'rejected': 'bg-red-100 text-red-800'
                      }[application.status]}`}>
                        {application.status}
                      </span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        {/if}
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Notifications -->
        <NotificationsList userId={currentUser.$id} limit={5} />

        <!-- Quick Stats -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div class="space-y-3">
            {#if isEmployer}
              <div class="flex justify-between">
                <span class="text-gray-600">Active Jobs</span>
                <span class="font-semibold">{jobs.filter(j => j.status === 'active').length}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Total Jobs</span>
                <span class="font-semibold">{jobs.length}</span>
              </div>
            {:else}
              <div class="flex justify-between">
                <span class="text-gray-600">Applications</span>
                <span class="font-semibold">{applications.length}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Pending</span>
                <span class="font-semibold">{applications.filter(a => a.status === 'pending').length}</span>
              </div>
            {/if}
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div class="space-y-3">
            {#if isEmployer}
              <a 
                href="/app/jobs/post"
                class="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Post New Job
              </a>
              <a 
                href="/app/jobs"
                class="block w-full text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Manage Jobs
              </a>
            {:else}
              <a 
                href="/app/jobs"
                class="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Jobs
              </a>
              <a 
                href="/app/profile"
                class="block w-full text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Update Profile
              </a>
            {/if}
            <a 
              href="/app/messages"
              class="block w-full text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Messages
            </a>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
