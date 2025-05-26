<script lang="ts">
  // Public site layout with navbar and footer
  import SiteNavbar from '$lib/components/SiteNavbar.svelte';
  import Footer from '$lib/components/Footer.svelte';

  interface Props {
    children: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="flex flex-col min-h-screen">
  <SiteNavbar />
  <main class="flex-1">
    {@render children()}
  </main>
  <Footer />
</div>
