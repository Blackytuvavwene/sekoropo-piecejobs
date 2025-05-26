<script lang="ts">
  // Simple loading indicator with customizable size and color
  interface Props {
    size?: 'sm' | 'md' | 'lg';
    color?: 'primary' | 'secondary' | 'white';
    centered?: boolean;
  }

  let { size = 'md', color = 'primary', centered = true }: Props = $props();

  // Derived styles
  const sizeClasses = $derived(() => {
    switch (size) {
      case 'sm': return 'w-4 h-4 border-2';
      case 'lg': return 'w-12 h-12 border-4';
      default: return 'w-8 h-8 border-4';
    }
  });

  const colorClasses = $derived(() => {
    switch (color) {
      case 'secondary': return 'border-gray-300 border-t-gray-600';
      case 'white': return 'border-white/30 border-t-white';
      default: return 'border-blue-300 border-t-blue-600';
    }
  });

  const containerClasses = $derived(() => {
    return centered ? 'flex justify-center items-center' : '';
  });
</script>

<div class={containerClasses}>
  <div class={`${sizeClasses} ${colorClasses} rounded-full animate-spin`}></div>
</div>
