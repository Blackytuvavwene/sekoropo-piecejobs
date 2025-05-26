// API request and response types

// Generic API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: number;
}

// API error types
export interface ApiError {
  message: string;
  code: string | number;
  details?: any;
  timestamp: string;
}

// Authentication API types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: import('./database.types').UserRole;
  phone?: string;
}

export interface AuthResponse {
  user: import('./appwrite.types').AppwriteUser;
  session: {
    $id: string;
    expire: string;
  };
  profile: import('./database.types').Profile;
}

// Job API types
export interface CreateJobRequest {
  title: string;
  description: string;
  categoryId: string;
  location: string;
  budget: number;
  currency: import('./database.types').Currency;
  dueDate: string;
  imageFiles?: File[];
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {
  status?: import('./database.types').JobStatus;
  assignedProviderProfileId?: string;
}

export interface JobSearchRequest {
  query?: string;
  categoryId?: string;
  location?: string;
  minBudget?: number;
  maxBudget?: number;
  status?: import('./database.types').JobStatus;
  page?: number;
  limit?: number;
}

// Application API types
export interface CreateApplicationRequest {
  jobId: string;
  proposedRate?: number;
  message?: string;
}

export interface UpdateApplicationRequest {
  status: import('./database.types').ApplicationStatus;
}

// Profile API types
export interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  hourlyRate?: number;
  avatarFile?: File;
}

// Payment API types
export interface CreatePaymentRequest {
  jobId: string;
  paymentMethod: import('./database.types').PaymentMethod;
  amount: number;
}

export interface PaymentWebhookData {
  transactionId: string;
  status: import('./database.types').PaymentStatus;
  amount: number;
  currency: string;
  metadata: Record<string, any>;
}

// Review API types
export interface CreateReviewRequest {
  jobId: string;
  revieweeProfileId: string;
  rating: number;
  comment?: string;
}

// Message API types
export interface SendMessageRequest {
  receiverProfileId: string;
  content: string;
  jobId?: string;
}

export interface MessageSearchRequest {
  conversationId?: string;
  participantId?: string;
  jobId?: string;
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}

// Notification API types
export interface CreateNotificationRequest {
  recipientProfileId: string;
  type: import('./database.types').NotificationType;
  message: string;
  relatedEntityId?: string;
}

export interface MarkNotificationReadRequest {
  notificationIds: string[];
}

// Admin API types
export interface AdminDashboardRequest {
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface AdminUserActionRequest {
  userId: string;
  action: 'activate' | 'deactivate' | 'ban' | 'unban';
  reason?: string;
}

export interface AdminJobActionRequest {
  jobId: string;
  action: 'approve' | 'reject' | 'feature' | 'unfeature';
  reason?: string;
}

export interface AdminDisputeActionRequest {
  disputeId: string;
  action: 'resolve_in_favor_of_seeker' | 'resolve_in_favor_of_provider' | 'cancel';
  resolutionDetails: string;
}

// Real-time subscription types
export interface RealtimeSubscription {
  channels: string[];
  callback: (response: any) => void;
}

export interface RealtimeMessage {
  events: string[];
  channels: string[];
  timestamp: number;
  payload: any;
}
