<script lang="ts">
  // Post a Job page
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { JobService } from '$lib/utils/services';
  import { authStore } from '$lib/stores/auth.store.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import AlertMessage from '$lib/components/AlertMessage.svelte';
  import type { JobCategory } from '$lib/utils/types/database.types';
  import { formatCurrency } from '$lib/utils/helpers';
  
  // Svelte 5 runes for reactive state
  let formData = $state({
    title: '',
    description: '',
    location: '',
    budget_min: 0,
    budget_max: 0,
    category_id: '',
    requirements: '',
    deadline: ''
  });
  
  let categories = $state<JobCategory[]>([]);
  let loading = $state(false);
  let loadingCategories = $state(true);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);
  
  const loadCategories = async () => {
    try {
      // TODO: Implement category service and load categories      // For now, use mock data
      categories = [
        { 
          $id: '1', 
          name: 'Construction', 
          description: 'Building and construction work', 
          created_at: '', 
          updated_at: '',
          $collectionId: 'job_categories',
          $databaseId: 'sekoropo',
          $createdAt: '',
          $updatedAt: '',
          $permissions: []
        },
        { 
          $id: '2', 
          name: 'Cleaning', 
          description: 'Cleaning services', 
          created_at: '', 
          updated_at: '',
          $collectionId: 'job_categories',
          $databaseId: 'sekoropo',
          $createdAt: '',
          $updatedAt: '',
          $permissions: []
        },
        { 
          $id: '3', 
          name: 'Gardening', 
          description: 'Garden and landscape work', 
          created_at: '', 
          updated_at: '',
          $collectionId: 'job_categories',
          $databaseId: 'sekoropo',
          $createdAt: '',
          $updatedAt: '',
          $permissions: []
        },
        { 
          $id: '4', 
          name: 'Delivery', 
          description: 'Delivery and transport services', 
          created_at: '', 
          updated_at: '',
          $collectionId: 'job_categories',
          $databaseId: 'sekoropo',
          $createdAt: '',
          $updatedAt: '',
          $permissions: []
        },
        { 
          $id: '5', 
          name: 'Maintenance', 
          description: 'Repair and maintenance work', 
          created_at: '', 
          updated_at: '',
          $collectionId: 'job_categories',
          $databaseId: 'sekoropo',
          $createdAt: '',
          $updatedAt: '',
          $permissions: []
        }
      ];
      loadingCategories = false;
    } catch (err) {
      console.error('Failed to load categories:', err);
      loadingCategories = false;
    }
  };
  
  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    
    if (!authStore.user) {
      error = 'You must be logged in to post a job';
      return;
    }
    
    try {
      loading = true;
      error = null;
      success = null;
      
      // Validate form
      if (!formData.title.trim() || !formData.description.trim() || !formData.location.trim()) {
        error = 'Please fill in all required fields';
        return;
      }
      
      if (formData.budget_min <= 0 || formData.budget_max <= 0 || formData.budget_min > formData.budget_max) {
        error = 'Please enter a valid budget range';
        return;
      }
        const jobData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        budget: formData.budget_max, // Use max budget as the main budget
        categoryId: formData.category_id,
        currency: 'BWP' as const,
        dueDate: formData.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default to 7 days from now
      };
      
      const result = await JobService.createJob(jobData);
      
      if (result.success) {
        success = 'Job posted successfully!';
        setTimeout(() => {
          goto('/app/jobs');
        }, 2000);
      } else {
        error = result.error || 'Failed to post job';
      }
    } catch (err) {
      error = 'An unexpected error occurred';
      console.error('Job post error:', err);
    } finally {
      loading = false;
    }
  };
  
  onMount(() => {
    loadCategories();
  });
</script>

<section class="container mx-auto py-8">
  <div class="max-w-2xl mx-auto">
    <div class="bg-white rounded-lg shadow-sm border">
      <div class="px-6 py-4 border-b border-gray-200">
        <h1 class="text-2xl font-bold text-gray-900">Post a New Job</h1>
        <p class="text-gray-600 mt-1">Fill in the details below to post your job listing</p>
      </div>
      
      <div class="p-6">
        {#if error}
          <div class="mb-6">
            <AlertMessage message={error} type="error" />
          </div>
        {/if}
        
        {#if success}
          <div class="mb-6">
            <AlertMessage message={success} type="success" />
          </div>
        {/if}
        
        {#if loadingCategories}
          <div class="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        {:else}
          <form onsubmit={handleSubmit} class="space-y-6">
            <!-- Job Title -->
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
              <input
                id="title"
                type="text"
                bind:value={formData.title}
                placeholder="e.g., House Cleaning Service"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loading}
              />
            </div>
            
            <!-- Category -->
            <div>
              <label for="category" class="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                id="category"
                bind:value={formData.category_id}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loading}
              >
                <option value="">Select a category</option>
                {#each categories as category (category.$id)}
                  <option value={category.$id}>{category.name}</option>
                {/each}
              </select>
            </div>
            
            <!-- Description -->
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                id="description"
                bind:value={formData.description}
                placeholder="Describe the job in detail..."
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                required
                disabled={loading}
              ></textarea>
            </div>
            
            <!-- Location -->
            <div>
              <label for="location" class="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <input
                id="location"
                type="text"
                bind:value={formData.location}
                placeholder="e.g., Gaborone, Botswana"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loading}
              />
            </div>
              <!-- Budget Range -->
            <fieldset>
              <legend class="block text-sm font-medium text-gray-700 mb-1">Budget Range (BWP) *</legend>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="budget_min" class="block text-xs text-gray-500 mb-1">Minimum</label>
                  <input
                    id="budget_min"
                    type="number"
                    bind:value={formData.budget_min}
                    min="1"
                    step="1"
                    placeholder="100"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label for="budget_max" class="block text-xs text-gray-500 mb-1">Maximum</label>
                  <input
                    id="budget_max"
                    type="number"
                    bind:value={formData.budget_max}
                    min="1"
                    step="1"
                    placeholder="500"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={loading}
                  />                </div>
              </div>
              {#if formData.budget_min > 0 && formData.budget_max > 0}
                <p class="text-sm text-gray-600 mt-1">
                  Budget range: {formatCurrency(formData.budget_min)} - {formatCurrency(formData.budget_max)}
                </p>
              {/if}
            </fieldset>
            
            <!-- Requirements -->
            <div>
              <label for="requirements" class="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
              <textarea
                id="requirements"
                bind:value={formData.requirements}
                placeholder="Any specific requirements or qualifications needed..."
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                disabled={loading}
              ></textarea>
            </div>
            
            <!-- Deadline -->
            <div>
              <label for="deadline" class="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input
                id="deadline"
                type="date"
                bind:value={formData.deadline}
                min={new Date().toISOString().split('T')[0]}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            
            <!-- Submit Button -->
            <div class="flex justify-end space-x-3 pt-4">
              <a
                href="/app/jobs"
                class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </a>
              <button
                type="submit"
                disabled={loading}
                class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {#if loading}
                  <span class="flex items-center">
                    <LoadingSpinner size="sm" />
                    <span class="ml-2">Posting...</span>
                  </span>
                {:else}
                  Post Job
                {/if}
              </button>
            </div>
          </form>
        {/if}
      </div>
    </div>
  </div>
</section>
