<script lang="ts">
  // Single Job Details page
  import JobCard from '$lib/components/JobCard.svelte';
  import { page } from '$app/stores';
  let job;
  // TODO: Fetch job details using params.jobId in load function
  const applyNow = async () => {
    // TODO: Create application document in Appwrite
  };
  const manageJob = async () => {
    // TODO: Update job status in Appwrite
  };
</script>

<section class="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
  <h1 class="text-2xl font-bold mb-4">{job?.title}</h1>
  <p class="text-gray-700 mb-2">{job?.description}</p>
  <p class="text-sm text-gray-600">Location: {job?.location}</p>
  <p class="text-sm text-gray-600 mb-4">Budget: {job?.budget}</p>
  {#if job?.isOwner}
    <button on:click={manageJob} class="py-2 px-4 bg-yellow-600 text-white rounded hover:bg-yellow-700">Manage Job</button>
  {:else}
    <button on:click={applyNow} class="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700">Apply Now</button>
  {/if}
</section>
