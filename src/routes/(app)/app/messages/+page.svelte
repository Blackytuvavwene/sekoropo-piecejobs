<script lang="ts">
  // In-App Messaging page
  import { onMount } from 'svelte';
  import { MessageService } from '$lib/utils/services';
  import { authStore } from '$lib/stores/auth.store.svelte';
  import MessageThread from '$lib/components/MessageThread.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import AlertMessage from '$lib/components/AlertMessage.svelte';
  import type { Message } from '$lib/utils/types/database.types';
  import { formatDate } from '$lib/utils/helpers';
  
  // Svelte 5 runes for reactive state
  let conversations = $state<any[]>([]);
  let selectedConversationId = $state<string | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  
  // Derived selected conversation
  const selectedConversation = $derived.by(() => {
    return conversations.find(c => c.id === selectedConversationId) || null;
  });
  
  const loadConversations = async () => {
    if (!authStore.user) return;
    
    try {
      loading = true;
      error = null;
      
      const result = await MessageService.getUserConversations(authStore.user.$id);
        if (result.success && result.data) {
        conversations = result.data.documents.map((conv: any) => ({
          id: conv.userId,
          otherUser: { name: `User ${conv.userId}` }, // TODO: Get actual user data
          lastMessage: conv.lastMessage,
          lastMessageTime: conv.lastMessage.sent_at,
          unreadCount: conv.unreadCount || 0
        }));
        
        // Auto-select first conversation if available
        if (conversations.length > 0 && !selectedConversationId) {
          selectedConversationId = conversations[0].id;
        }
      } else {
        error = result.error || 'Failed to load conversations';
      }
    } catch (err) {
      error = 'An unexpected error occurred';
      console.error('Conversations load error:', err);
    } finally {
      loading = false;
    }
  };
  
  const selectConversation = (conversationId: string) => {
    selectedConversationId = conversationId;
  };
  
  onMount(() => {
    loadConversations();
  });
</script>

<section class="container mx-auto py-8">
  <div class="flex flex-col lg:flex-row h-[600px] bg-white rounded-lg shadow-sm border overflow-hidden">
    <!-- Conversations Sidebar -->
    <div class="w-full lg:w-80 border-r border-gray-200 flex flex-col">
      <div class="px-4 py-3 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">Messages</h2>
      </div>
      
      <div class="flex-1 overflow-y-auto">
        {#if loading}
          <div class="p-4">
            <LoadingSpinner />
          </div>
        {:else if error}
          <div class="p-4">
            <AlertMessage message={error} type="error" />
          </div>
        {:else if conversations.length === 0}
          <div class="p-4 text-center">
            <svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            <p class="text-gray-600 text-sm">No conversations yet</p>
            <p class="text-gray-500 text-xs mt-1">Start messaging by applying to jobs</p>
          </div>
        {:else}
          <div class="divide-y divide-gray-200">
            {#each conversations as conversation (conversation.id)}
              <button
                onclick={() => selectConversation(conversation.id)}
                class={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedConversationId === conversation.id ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''}`}
              >
                <div class="flex items-center space-x-3">
                  <div class="flex-shrink-0">
                    <div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span class="text-gray-600 font-medium">
                        {conversation.otherUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>
                  
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <p class="text-sm font-medium text-gray-900 truncate">
                        {conversation.otherUser?.name || 'Unknown User'}
                      </p>
                      {#if conversation.unreadCount > 0}
                        <span class="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[1.25rem] text-center">
                          {conversation.unreadCount}
                        </span>
                      {/if}
                    </div>
                    
                    {#if conversation.lastMessage}
                      <p class="text-sm text-gray-600 truncate mt-1">
                        {conversation.lastMessage.content || 'No messages yet'}
                      </p>
                      <p class="text-xs text-gray-500 mt-1">
                        {formatDate(conversation.lastMessageTime)}
                      </p>
                    {:else}
                      <p class="text-sm text-gray-500 mt-1">No messages yet</p>
                    {/if}
                  </div>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Message Thread -->
    <div class="flex-1 flex flex-col">      {#if selectedConversation && authStore.user}
        <MessageThread 
          currentUserId={authStore.user.$id}
          conversationUserId={selectedConversation.id}
          otherUserName={selectedConversation.otherUser?.name || 'Unknown User'}
        />
      {:else if !loading && conversations.length > 0}
        <div class="flex-1 flex items-center justify-center bg-gray-50">
          <div class="text-center">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
            <p class="text-gray-600">Choose a conversation from the sidebar to start messaging</p>
          </div>
        </div>
      {:else if !loading}
        <div class="flex-1 flex items-center justify-center bg-gray-50">
          <div class="text-center">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No conversations</h3>
            <p class="text-gray-600 mb-4">You don't have any messages yet</p>
            <a 
              href="/app/jobs" 
              class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Jobs
            </a>
          </div>
        </div>      {/if}
    </div>
  </div>
</section>
