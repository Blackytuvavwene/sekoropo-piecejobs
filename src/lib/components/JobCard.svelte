<script lang="ts">
  // Displays a summary of a job posting
  import type { Job } from '$lib/utils/types';
  import { formatCurrencyRange, formatDate, truncateText } from '$lib/utils/helpers';

  interface Props {
    job: Job;
    showActions?: boolean;
    onApply?: (jobId: string) => void;
    onView?: (jobId: string) => void;
  }

  let { job, showActions = true, onApply, onView }: Props = $props();
  // Derived values
  const formattedBudget = $derived(() => formatCurrencyRange(job.budget_min, job.budget_max));
  const formattedDate = $derived(() => formatDate(job.created_at));
  const truncatedDescription = $derived(() => truncateText(job.description, 150));  const statusColor = $derived(() => {
    switch (job.status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'disputed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  });

  const handleApply = () => {
    onApply?.(job.$id);
  };

  const handleView = () => {
    onView?.(job.$id);
  };
</script>

<div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200 mb-4">
  <div class="flex justify-between items-start mb-3">
    <h3 class="text-lg font-semibold text-gray-900 line-clamp-2">{job.title}</h3>
    <span class={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
      {job.status.replace('_', ' ')}
    </span>
  </div>

  <div class="flex items-center text-sm text-gray-600 mb-3 space-x-4">
    <div class="flex items-center">
      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
      {job.location}
    </div>
    <div class="flex items-center">
      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
      </svg>
      {formattedBudget}
    </div>
    <div class="flex items-center">
      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      {formattedDate}
    </div>
  </div>

  <p class="text-gray-700 mb-4 line-clamp-3">{truncatedDescription}</p>

  <div class="flex items-center justify-between">
    <div class="text-sm text-gray-500">
      <span>By: {job.employer_name || 'Anonymous'}</span>
      {#if job.category}
        <span class="ml-2 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
          {job.category}
        </span>
      {/if}
    </div>

    {#if showActions}
      <div class="flex space-x-2">
        <button
          onclick={handleView}
          class="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          View Details
        </button>
        {#if job.status === 'open' && onApply}
          <button
            onclick={handleApply}
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Apply Now
          </button>
        {/if}
      </div>
    {/if}
  </div>
</div>
