<script lang="ts">
  // Admin layout: includes sidebar and main content
  import AdminSidebar from '$lib/components/AdminSidebar.svelte';
  import { page } from '$app/stores';

  interface Props {
    children: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  // TODO: Implement Appwrite admin auth check in load function
  
  // Derived value for current path
  const activePath = $derived($page.url.pathname);
</script>

<div class="flex h-screen">
  <AdminSidebar activePath={activePath} />
  <main class="flex-1 bg-gray-100 p-6 overflow-auto">
    <header class="mb-6">
      <h1 class="text-2xl font-bold">Admin Dashboard</h1>
    </header>
    {@render children()}
  </main>
</div>
