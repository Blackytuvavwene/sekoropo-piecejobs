<script lang="ts">
  // Header for the app layout, displaying user info and logout
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store.svelte';
  
  interface Props {
    username: string;
    userRole: string;
  }
  
  let { username, userRole }: Props = $props();

  const logout = async () => {
    await authStore.logout();
    goto('/');
  };
</script>

<header class="bg-white shadow p-4 flex justify-between items-center">
  <div>
    <h1 class="text-xl font-bold">{username}</h1>
    <p class="text-sm text-gray-600">{userRole}</p>
  </div>
  <button onclick={logout} class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
    Logout
  </button>
</header>
