<script lang="ts">
  // Form for submitting job applications
  import { ApplicationService } from '$lib/utils/services';
  import type { Job, ApiResponse } from '$lib/utils/types';
  import AlertMessage from './AlertMessage.svelte';
  import LoadingSpinner from './LoadingSpinner.svelte';

  interface Props {
    job: Job;
    userId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
  }

  let { job, userId, onSuccess, onCancel }: Props = $props();

  // Svelte 5 runes for reactive state
  let coverLetter = $state('');
  let proposedRate = $state(job.budget_min || 0);
  let estimatedDuration = $state('');
  let loading = $state(false);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);

  // Derived validation
  const isValid = $derived(() => {
    return (
      coverLetter.trim().length >= 50 &&
      proposedRate > 0 &&
      proposedRate >= job.budget_min &&
      proposedRate <= job.budget_max &&
      estimatedDuration.trim().length > 0
    );
  });
  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    if (!isValid) return;

    loading = true;
    error = null;
    success = null;

    try {
      const applicationData = {
        jobId: job.$id,
        applicantId: userId,
        coverLetter: coverLetter.trim(),
        proposedPrice: proposedRate,
        estimatedCompletion: estimatedDuration.trim()
      };

      const result = await ApplicationService.create(applicationData);

      if (result.success) {
        success = 'Application submitted successfully!';
        // Reset form
        coverLetter = '';
        proposedRate = job.budget_min || 0;
        estimatedDuration = '';
        
        setTimeout(() => {
          onSuccess?.();
        }, 1500);
      } else {
        error = result.error || 'Failed to submit application';
      }
    } catch (err) {
      error = 'An unexpected error occurred. Please try again.';
      console.error('Application submission error:', err);
    } finally {
      loading = false;
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };
</script>

<div class="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
  <h2 class="text-2xl font-bold mb-6 text-gray-800">Apply for Job</h2>
  
  <!-- Job Summary -->
  <div class="bg-gray-50 p-4 rounded-lg mb-6">
    <h3 class="font-semibold text-lg text-gray-900 mb-2">{job.title}</h3>
    <p class="text-gray-600 mb-2">{job.description.slice(0, 200)}...</p>
    <div class="flex items-center text-sm text-gray-500 space-x-4">
      <span>Budget: BWP {job.budget_min} - BWP {job.budget_max}</span>
      <span>Location: {job.location}</span>
    </div>
  </div>

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

  <form onsubmit={handleSubmit} class="space-y-6">
    <!-- Cover Letter -->
    <div>
      <label for="coverLetter" class="block text-sm font-medium text-gray-700 mb-1">
        Cover Letter *
      </label>
      <textarea 
        id="coverLetter"
        bind:value={coverLetter} 
        rows="6"
        placeholder="Explain why you're the best fit for this job. Highlight your relevant experience and skills..."
        class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
        required
        disabled={loading}
      ></textarea>
      <p class="text-xs text-gray-500 mt-1">
        Minimum 50 characters ({coverLetter.length}/50)
      </p>
    </div>

    <!-- Proposed Rate -->
    <div>
      <label for="proposedRate" class="block text-sm font-medium text-gray-700 mb-1">
        Proposed Rate (BWP) *
      </label>
      <input 
        id="proposedRate"
        type="number" 
        bind:value={proposedRate} 
        min={job.budget_min}
        max={job.budget_max}
        step="0.01"
        class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
        required
        disabled={loading}
      />
      <p class="text-xs text-gray-500 mt-1">
        Must be between BWP {job.budget_min} and BWP {job.budget_max}
      </p>
    </div>

    <!-- Estimated Duration -->
    <div>
      <label for="estimatedDuration" class="block text-sm font-medium text-gray-700 mb-1">
        Estimated Duration *
      </label>
      <input 
        id="estimatedDuration"
        type="text" 
        bind:value={estimatedDuration} 
        placeholder="e.g., 2 weeks, 1 month, 3 days"
        class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
        required
        disabled={loading}
      />
    </div>

    <!-- Validation Messages -->
    {#if !isValid && (coverLetter || proposedRate || estimatedDuration)}
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 class="text-sm font-medium text-yellow-800 mb-2">Please check the following:</h4>
        <ul class="text-sm text-yellow-700 space-y-1">
          {#if coverLetter.length < 50}
            <li>• Cover letter must be at least 50 characters long</li>
          {/if}
          {#if proposedRate <= 0}
            <li>• Proposed rate must be greater than 0</li>
          {/if}
          {#if proposedRate < job.budget_min}
            <li>• Proposed rate cannot be less than BWP {job.budget_min}</li>
          {/if}
          {#if proposedRate > job.budget_max}
            <li>• Proposed rate cannot exceed BWP {job.budget_max}</li>
          {/if}
          {#if !estimatedDuration.trim()}
            <li>• Please provide an estimated duration</li>
          {/if}
        </ul>
      </div>
    {/if}

    <!-- Actions -->
    <div class="flex justify-end space-x-4 pt-6 border-t">
      <button 
        type="button"
        onclick={handleCancel}
        class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        disabled={loading}
      >
        Cancel
      </button>
      <button 
        type="submit" 
        class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        disabled={!isValid || loading}
      >
        {#if loading}
          <div class="flex items-center">
            <LoadingSpinner size="sm" color="white" centered={false} />
            <span class="ml-2">Submitting...</span>
          </div>
        {:else}
          Submit Application
        {/if}
      </button>
    </div>
  </form>
</div>
