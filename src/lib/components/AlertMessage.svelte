<script lang="ts">
  // Displays success, error, or info messages
  interface Props {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    dismissible?: boolean;
    onDismiss?: () => void;
  }

  let { message, type = 'info', dismissible = false, onDismiss }: Props = $props();

  // Derived styles based on type
  const styles = $derived(() => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 border-l-green-500';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 border-l-red-500';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 border-l-yellow-500';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800 border-l-blue-500';
    }
  });
  const iconPath = $derived.by(() => {
    switch (type) {
      case 'success':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'error':
        return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'warning':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  });

  const handleDismiss = () => {
    onDismiss?.();
  };
</script>

<div class={`border-l-4 border rounded-lg p-4 ${styles}`} role="alert">
  <div class="flex items-start">
    <div class="flex-shrink-0">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={iconPath}></path>
      </svg>
    </div>
    <div class="ml-3 flex-1">
      <p class="text-sm font-medium">{message}</p>
    </div>
    {#if dismissible}
      <div class="ml-auto pl-3">
        <button
          type="button"
          class="inline-flex rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onclick={handleDismiss}
        >
          <span class="sr-only">Dismiss</span>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    {/if}
  </div>
</div>
