<script lang="ts">
  // Account Settings page
  let currentPassword = '';
  let newPassword = '';
  let notificationPrefs = {};

  const changePassword = async () => {
    // TODO: Appwrite account.updatePassword()
  };
  const savePreferences = async () => {
    // TODO: Update preferences in Appwrite Databases
  };
</script>

<section class="container mx-auto py-16 space-y-6">
  <div class="bg-white p-4 rounded shadow">
    <h2 class="text-xl font-bold mb-4">Change Password</h2>
    <form on:submit|preventDefault={changePassword} class="space-y-4">
      <input type="password" bind:value={currentPassword} placeholder="Current Password" class="w-full p-2 border rounded" required />
      <input type="password" bind:value={newPassword} placeholder="New Password" class="w-full p-2 border rounded" required />
      <button type="submit" class="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700">Change Password</button>
    </form>
  </div>
  <div class="bg-white p-4 rounded shadow">
    <h2 class="text-xl font-bold mb-4">Notification Preferences</h2>
    <!-- TODO: Render notification preference fields -->
    <button on:click={savePreferences} class="mt-4 py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700">Save Preferences</button>
  </div>
</section>
