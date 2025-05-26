<script lang="ts">
  // Displays and manages a conversation thread between users
  import { onMount, tick } from 'svelte';
  import { MessageService, RealtimeService } from '$lib/utils/services';
  import type { Message, ApiResponse } from '$lib/utils/types';
  import { formatDate } from '$lib/utils/helpers';
  import LoadingSpinner from './LoadingSpinner.svelte';
  import AlertMessage from './AlertMessage.svelte';
  interface Props {
    currentUserId: string;
    conversationUserId: string;
    otherUserName: string;
    jobId?: string;
  }

  let { currentUserId, conversationUserId, otherUserName, jobId }: Props = $props();

  // Svelte 5 runes for reactive state
  let messages = $state<Message[]>([]);
  let newMessage = $state('');
  let loading = $state(true);
  let sending = $state(false);
  let error = $state<string | null>(null);
  let messagesContainer: HTMLDivElement;

  // Derived values
  const canSend = $derived(() => newMessage.trim().length > 0 && !sending);

  const scrollToBottom = async () => {
    await tick();
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  };

  const loadMessages = async () => {
    try {
      loading = true;
      error = null;

      const result = await MessageService.getConversation(currentUserId, conversationUserId, jobId);
        if (result.success && result.data) {
        messages = result.data.documents;
        scrollToBottom();
      } else {
        error = result.error || 'Failed to load messages';
      }
    } catch (err) {
      error = 'An unexpected error occurred';
      console.error('Messages load error:', err);
    } finally {
      loading = false;
    }
  };

  const sendMessage = async () => {
    if (!canSend) return;

    const messageText = newMessage.trim();
    newMessage = ''; // Clear immediately for better UX

    try {
      sending = true;
      error = null;      const messageData = {
        senderId: currentUserId,
        recipientId: conversationUserId,
        jobId: jobId,
        content: messageText,
        messageType: 'text' as const
      };

      const result = await MessageService.send(messageData);
      
      if (result.success && result.data) {
        messages = [...messages, result.data];
        scrollToBottom();
      } else {
        error = result.error || 'Failed to send message';
        newMessage = messageText; // Restore message on error
      }
    } catch (err) {
      error = 'An unexpected error occurred';
      newMessage = messageText; // Restore message on error
      console.error('Send message error:', err);
    } finally {
      sending = false;
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const isOwnMessage = (message: Message) => {
    return message.sender_id === currentUserId;
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  onMount(() => {
    loadMessages();    // Subscribe to real-time messages
    const subscriptionResult = RealtimeService.subscribeToConversation(
      currentUserId, 
      conversationUserId, 
      (message: any) => {
        if (message.sender_id !== currentUserId) {
          messages = [...messages, message];
          scrollToBottom();
        }
      }
    );

    return () => {
      if (subscriptionResult.success && subscriptionResult.data) {
        subscriptionResult.data.unsubscribe();
      }
    };
  });
</script>

<div class="flex flex-col h-full bg-white rounded-lg shadow-sm border">
  <!-- Header -->
  <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">{otherUserName}</h3>
        <p class="text-sm text-gray-500">Conversation</p>
      </div>
      
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 bg-green-400 rounded-full"></div>
        <span class="text-sm text-gray-500">Online</span>
      </div>
    </div>
  </div>

  <!-- Messages Container -->
  <div 
    bind:this={messagesContainer}
    class="flex-1 overflow-y-auto p-4 space-y-4"
    style="max-height: 400px;"
  >
    {#if loading}
      <div class="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    {:else if error}
      <AlertMessage message={error} type="error" />
    {:else if messages.length === 0}
      <div class="text-center py-8">
        <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
        <h4 class="text-gray-600 font-medium">No messages yet</h4>
        <p class="text-gray-500 text-sm mt-1">Start the conversation!</p>
      </div>
    {:else}
      {#each messages as message (message.$id)}
        <div class={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}>
          <div class={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            isOwnMessage(message) 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-900'
          }`}>
            <p class="text-sm whitespace-pre-wrap">{message.content}</p>
            <p class={`text-xs mt-1 ${
              isOwnMessage(message) ? 'text-blue-100' : 'text-gray-500'
            }`}>
              {formatMessageTime(message.created_at)}
            </p>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Message Input -->
  <div class="px-4 py-4 border-t border-gray-200">
    <div class="flex items-end space-x-2">
      <div class="flex-1">
        <textarea
          bind:value={newMessage}
          onkeydown={handleKeyDown}
          placeholder="Type your message..."
          rows="2"
          class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          disabled={sending}
        ></textarea>
      </div>
      
      <button
        onclick={sendMessage}
        disabled={!canSend}
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        style="height: fit-content;"
      >
        {#if sending}
          <LoadingSpinner size="sm" color="white" centered={false} />
        {:else}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
        {/if}
      </button>
    </div>
    
    <p class="text-xs text-gray-500 mt-2">
      Press Enter to send, Shift+Enter for new line
    </p>
  </div>
</div>
