<script lang="ts">
  // Displays user notifications with real-time updates
  import { onMount } from 'svelte';
  import { NotificationService, RealtimeService } from '$lib/utils/services';
  import type { Notification, ApiResponse } from '$lib/utils/types';
  import { formatDate } from '$lib/utils/helpers';
  import LoadingSpinner from './LoadingSpinner.svelte';
  import AlertMessage from './AlertMessage.svelte';

  interface Props {
    userId: string;
    limit?: number;
    showMarkAllRead?: boolean;
  }

  let { userId, limit = 20, showMarkAllRead = true }: Props = $props();

  // Svelte 5 runes for reactive state
  let notifications = $state<Notification[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let markingRead = $state<string | null>(null);
  let markingAllRead = $state(false);  // Derived values
  const unreadCount = $derived.by(() => notifications.filter(n => !n.is_read).length);
  const hasNotifications = $derived.by(() => notifications.length > 0);
  const loadNotifications = async () => {
    try {
      loading = true;
      error = null;

      const result = await NotificationService.getUserNotifications(userId, false, limit);
      
      if (result.success && result.data) {
        notifications = result.data.documents;
      } else {
        error = result.error || 'Failed to load notifications';
      }
    } catch (err) {
      error = 'An unexpected error occurred';
      console.error('Notifications load error:', err);
    } finally {
      loading = false;
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      markingRead = notificationId;
      
      const result = await NotificationService.markAsRead(notificationId);
      
      if (result.success) {
        // Update local state
        notifications = notifications.map(n => 
          n.$id === notificationId ? { ...n, is_read: true } : n
        );
      }
    } catch (err) {
      console.error('Mark as read error:', err);
    } finally {
      markingRead = null;
    }
  };
  const markAllAsRead = async () => {
    try {
      markingAllRead = true;
      
      const result = await NotificationService.markAllAsRead(userId);
      
      if (result.success) {
        // Update local state
        notifications = notifications.map(n => ({ ...n, is_read: true }));
      }
    } catch (err) {
      console.error('Mark all as read error:', err);
    } finally {
      markingAllRead = false;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job_application':
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
      case 'payment':
        return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1';
      case 'message':
        return 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z';
      case 'job_update':
        return 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 002 2h2a2 2 0 002-2V8a2 2 0 00-2-2h-2z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'job_application': return 'text-blue-600 bg-blue-100';
      case 'payment': return 'text-green-600 bg-green-100';
      case 'message': return 'text-purple-600 bg-purple-100';
      case 'job_update': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  onMount(() => {
    loadNotifications();    // Subscribe to real-time notifications
    const subscriptionResult = RealtimeService.subscribeToNotifications(userId, (notification: any) => {
      notifications = [notification, ...notifications];
    });

    return () => {
      if (subscriptionResult.success && subscriptionResult.data) {
        subscriptionResult.data.unsubscribe();
      }
    };
  });
</script>

<div class="bg-white rounded-lg shadow-sm border">
  <!-- Header -->
  <div class="px-6 py-4 border-b border-gray-200">
    <div class="flex items-center justify-between">      <div>
        <h3 class="text-lg font-semibold text-gray-900">Notifications</h3>        {#if unreadCount > 0}
          <p class="text-sm text-gray-500">{unreadCount} unread</p>
        {/if}
      </div>
      
      {#if showMarkAllRead && unreadCount > 0}
        <button
          onclick={markAllAsRead}
          disabled={markingAllRead}
          class="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          {markingAllRead ? 'Marking...' : 'Mark all read'}
        </button>
      {/if}
    </div>
  </div>

  <!-- Content -->
  <div class="max-h-96 overflow-y-auto">
    {#if loading}
      <div class="p-8">
        <LoadingSpinner />
      </div>
    {:else if error}      <div class="p-4">
        <AlertMessage message={error} type="error" />
      </div>
    {:else if !hasNotifications}
      <div class="p-8 text-center">
        <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5-5-5h5v-5a7.002 7.002 0 00-14 0v5"/>
        </svg>
        <h4 class="text-gray-600 font-medium">No notifications</h4>
        <p class="text-gray-500 text-sm mt-1">You're all caught up!</p>
      </div>
    {:else}
      <div class="divide-y divide-gray-200">
        {#each notifications as notification (notification.$id)}
          <div 
            class={`p-4 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
          >
            <div class="flex items-start space-x-3">
              <!-- Icon -->
              <div class={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getNotificationIcon(notification.type)}></path>
                </svg>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between">
                  <div>
                    <p class={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
                      {notification.title}
                    </p>
                    <p class="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <p class="text-xs text-gray-500 mt-2">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center space-x-2 ml-4">
                    {#if !notification.is_read}
                      <button
                        onclick={() => markAsRead(notification.$id)}
                        disabled={markingRead === notification.$id}
                        class="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
                      >
                        {markingRead === notification.$id ? '...' : 'Mark read'}
                      </button>
                    {/if}
                    
                    {#if notification.action_url}
                      <a
                        href={notification.action_url}
                        class="text-xs text-blue-600 hover:text-blue-700"
                      >
                        View
                      </a>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
  <!-- Footer -->
  {#if hasNotifications && notifications.length >= limit}
    <div class="px-6 py-3 border-t border-gray-200 text-center">
      <button class="text-sm text-blue-600 hover:text-blue-700">
        View all notifications
      </button>
    </div>
  {/if}
</div>
