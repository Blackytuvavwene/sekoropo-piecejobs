// Message service for managing user-to-user communication
import { databases } from '$lib/appwrite/appwrite-client';
import type { 
  Message, 
  CreateMessageRequest, 
  UpdateMessageRequest,
  ApiResponse,
  PaginatedResponse 
} from '$lib/utils/types';
import { ID, Query } from 'appwrite';
import { DATABASE_ID, COLLECTIONS } from '$lib/utils/constants';

export class MessageService {
  // Send a new message
  static async send(messageData: CreateMessageRequest): Promise<ApiResponse<Message>> {
    try {
      const message = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        ID.unique(),
        {
          sender_id: messageData.senderId,
          recipient_id: messageData.recipientId,
          job_id: messageData.jobId,
          content: messageData.content,
          message_type: messageData.messageType || 'text',
          is_read: false,
          sent_at: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: message as Message
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send message'
      };
    }
  }

  // Get message by ID
  static async getById(messageId: string): Promise<ApiResponse<Message>> {
    try {
      const message = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        messageId
      );

      return {
        success: true,
        data: message as Message
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch message'
      };
    }
  }

  // Get conversation between two users
  static async getConversation(
    userId1: string,
    userId2: string,
    jobId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<PaginatedResponse<Message>>> {
    try {
      const queries = [
        Query.orderDesc('sent_at'),
        Query.limit(limit),
        Query.offset(offset)
      ];

      if (jobId) {
        queries.push(Query.equal('job_id', jobId));
      }

      // We need to get messages where:
      // (sender_id = userId1 AND recipient_id = userId2) OR 
      // (sender_id = userId2 AND recipient_id = userId1)
      // Since Appwrite doesn't support OR queries directly, we make two separate calls
      const [sentMessages, receivedMessages] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.MESSAGES, [
          ...queries,
          Query.equal('sender_id', userId1),
          Query.equal('recipient_id', userId2)
        ]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.MESSAGES, [
          ...queries,
          Query.equal('sender_id', userId2),
          Query.equal('recipient_id', userId1)
        ])
      ]);

      // Combine and sort messages by date
      const allMessages = [...sentMessages.documents, ...receivedMessages.documents]
        .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())
        .slice(offset, offset + limit);

      return {
        success: true,
        data: {
          documents: allMessages as Message[],
          total: sentMessages.total + receivedMessages.total
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch conversation'
      };
    }
  }

  // Get user's conversations (list of people they've messaged)
  static async getUserConversations(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<PaginatedResponse<{
    userId: string;
    lastMessage: Message;
    unreadCount: number;
  }>>> {
    try {
      // Get all messages where user is sender or recipient
      const [sentMessages, receivedMessages] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.MESSAGES, [
          Query.equal('sender_id', userId),
          Query.orderDesc('sent_at')
        ]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.MESSAGES, [
          Query.equal('recipient_id', userId),
          Query.orderDesc('sent_at')
        ])
      ]);

      const allMessages = [...sentMessages.documents, ...receivedMessages.documents] as Message[];
      
      // Group messages by conversation partner
      const conversationsMap = new Map<string, {
        userId: string;
        lastMessage: Message;
        unreadCount: number;
      }>();

      allMessages.forEach(message => {
        const partnerId = message.sender_id === userId ? message.recipient_id : message.sender_id;
        
        if (!conversationsMap.has(partnerId)) {
          conversationsMap.set(partnerId, {
            userId: partnerId,
            lastMessage: message,
            unreadCount: 0
          });
        }

        const conversation = conversationsMap.get(partnerId)!;
        
        // Update last message if this one is newer
        if (new Date(message.sent_at) > new Date(conversation.lastMessage.sent_at)) {
          conversation.lastMessage = message;
        }

        // Count unread messages (where user is recipient and message is unread)
        if (message.recipient_id === userId && !message.is_read) {
          conversation.unreadCount++;
        }
      });

      // Convert to array and sort by last message date
      const conversations = Array.from(conversationsMap.values())
        .sort((a, b) => new Date(b.lastMessage.sent_at).getTime() - new Date(a.lastMessage.sent_at).getTime())
        .slice(offset, offset + limit);

      return {
        success: true,
        data: {
          documents: conversations,
          total: conversationsMap.size
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch user conversations'
      };
    }
  }

  // Mark message as read
  static async markAsRead(messageId: string): Promise<ApiResponse<Message>> {
    try {
      const message = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        messageId,
        {
          is_read: true,
          read_at: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: message as Message
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to mark message as read'
      };
    }
  }

  // Mark all messages in conversation as read
  static async markConversationAsRead(
    userId: string,
    partnerId: string,
    jobId?: string
  ): Promise<ApiResponse<void>> {
    try {
      const queries = [
        Query.equal('sender_id', partnerId),
        Query.equal('recipient_id', userId),
        Query.equal('is_read', false)
      ];

      if (jobId) {
        queries.push(Query.equal('job_id', jobId));
      }

      const unreadMessages = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        queries
      );

      // Mark each unread message as read
      const updatePromises = unreadMessages.documents.map(message =>
        databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.MESSAGES,
          message.$id,
          {
            is_read: true,
            read_at: new Date().toISOString()
          }
        )
      );

      await Promise.all(updatePromises);

      return {
        success: true,
        data: undefined
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to mark conversation as read'
      };
    }
  }

  // Get unread message count for user
  static async getUnreadCount(userId: string): Promise<ApiResponse<number>> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        [
          Query.equal('recipient_id', userId),
          Query.equal('is_read', false),
          Query.limit(1) // We only need the count
        ]
      );

      return {
        success: true,
        data: response.total
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch unread count'
      };
    }
  }

  // Update message
  static async update(
    messageId: string,
    updateData: UpdateMessageRequest
  ): Promise<ApiResponse<Message>> {
    try {
      const message = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        messageId,
        {
          ...updateData,
          updated_at: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: message as Message
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update message'
      };
    }
  }

  // Delete message
  static async delete(messageId: string): Promise<ApiResponse<void>> {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        messageId
      );

      return {
        success: true,
        data: undefined
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete message'
      };
    }
  }

  // Get messages for a specific job
  static async getJobMessages(
    jobId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<PaginatedResponse<Message>>> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        [
          Query.equal('job_id', jobId),
          Query.orderDesc('sent_at'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      );

      return {
        success: true,
        data: {
          documents: response.documents as Message[],
          total: response.total
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch job messages'
      };
    }
  }

  // Search messages
  static async search(
    userId: string,
    searchTerm: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<PaginatedResponse<Message>>> {
    try {
      // Note: Appwrite doesn't have full-text search, so this is a basic implementation
      // In a real app, you might want to use a dedicated search service
      const [sentMessages, receivedMessages] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.MESSAGES, [
          Query.equal('sender_id', userId),
          Query.search('content', searchTerm),
          Query.orderDesc('sent_at'),
          Query.limit(limit),
          Query.offset(offset)
        ]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.MESSAGES, [
          Query.equal('recipient_id', userId),
          Query.search('content', searchTerm),
          Query.orderDesc('sent_at'),
          Query.limit(limit),
          Query.offset(offset)
        ])
      ]);

      const allMessages = [...sentMessages.documents, ...receivedMessages.documents]
        .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())
        .slice(offset, offset + limit);

      return {
        success: true,
        data: {
          documents: allMessages as Message[],
          total: sentMessages.total + receivedMessages.total
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to search messages'
      };
    }
  }
}
