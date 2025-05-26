<script lang="ts">
  // Navigation sidebar for admin layout
  interface Props {
    activePath: string;
  }
  
  let { activePath }: Props = $props();
</script>

<nav class="h-full bg-gray-800 text-white w-64 p-4">
  <ul class="space-y-2">
    <li><a href="/admin" class="block py-2 px-3 rounded hover:bg-gray-700 {activePath === '/' ? 'bg-gray-700' : ''}">Dashboard</a></li>
    <li><a href="/admin/users" class="block py-2 px-3 rounded hover:bg-gray-700 {activePath.startsWith('/admin/users') ? 'bg-gray-700' : ''}">User Management</a></li>
    <li><a href="/admin/jobs" class="block py-2 px-3 rounded hover:bg-gray-700 {activePath.startsWith('/admin/jobs') ? 'bg-gray-700' : ''}">Job Management</a></li>
    <li><a href="/admin/disputes" class="block py-2 px-3 rounded hover:bg-gray-700 {activePath.startsWith('/admin/disputes') ? 'bg-gray-700' : ''}">Dispute Resolution</a></li>
    <li><a href="/admin/settings" class="block py-2 px-3 rounded hover:bg-gray-700 {activePath.startsWith('/admin/settings') ? 'bg-gray-700' : ''}">Platform Settings</a></li>
  </ul>
</nav>
