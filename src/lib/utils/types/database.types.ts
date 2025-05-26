// Appwrite database model types based on the specifications

import type { Models } from 'appwrite';

// Enums
export type UserRole = 'seeker' | 'provider' | 'admin';
export type JobStatus = 'open' | 'assigned' | 'completed' | 'cancelled' | 'disputed';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type PaymentMethod = 'Orange Money' | 'MyZaka' | 'PayGate Card' | 'EFT';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type DisputeStatus = 'open' | 'under_review' | 'resolved_in_favor_of_seeker' | 'resolved_in_favor_of_provider' | 'cancelled';
export type NotificationType = 'job_applied' | 'job_assigned' | 'payment_received' | 'new_message' | 'review_received' | 'dispute_raised' | 'admin_message';
export type Currency = 'BWP';

// Profile Collection
export interface Profile extends Models.Document {
  userId: string; // Relationship to Appwrite users
  role: UserRole;
  fullName: string;
  phoneNumber: string;
  bio?: string;
  location: string;
  avatarFileId?: string; // Appwrite Storage File ID
  isPhoneVerified: boolean;
  isIDVerified: boolean;
  
  // Provider specific attributes
  skills?: string[];
  hourlyRate?: number;
  averageRating: number;
  jobsCompleted: number;
}

// Job Categories Collection
export interface JobCategory extends Models.Document {
  name: string;
  description?: string;
  icon?: string;
}

// Jobs Collection
export interface Job extends Models.Document {
  employerProfileId: string; // Link to profiles (seeker)
  title: string;
  description: string;
  categoryId: string; // Link to job_categories
  location: string;
  budget: number;
  currency: Currency;
  status: JobStatus;
  postedAt: string; // ISO DateTime
  dueDate: string; // ISO DateTime
  assignedProviderProfileId?: string; // Link to profiles (provider)
  imageFileIds?: string[]; // Appwrite Storage File IDs
  isFeatured: boolean;
}

// Applications Collection
export interface Application extends Models.Document {
  jobId: string; // Link to jobs
  providerProfileId: string; // Link to profiles (provider)
  status: ApplicationStatus;
  proposedRate?: number;
  message?: string;
  appliedAt: string; // ISO DateTime
}

// Payments Collection
export interface Payment extends Models.Document {
  jobId: string; // Link to jobs
  payerProfileId: string; // Link to profiles (employer)
  payeeProfileId: string; // Link to profiles (provider)
  amount: number;
  commissionAmount: number;
  providerEarning: number;
  transactionId: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  paidAt: string; // ISO DateTime
}

// Reviews Collection
export interface Review extends Models.Document {
  jobId: string; // Link to jobs
  reviewerProfileId: string; // Link to profiles
  revieweeProfileId: string; // Link to profiles
  rating: number; // 1-5
  comment?: string;
  reviewedAt: string; // ISO DateTime
}

// Disputes Collection
export interface Dispute extends Models.Document {
  jobId: string; // Link to jobs
  raisedByProfileId: string; // Link to profiles
  againstProfileId: string; // Link to profiles
  reason: string;
  status: DisputeStatus;
  raisedAt: string; // ISO DateTime
  resolvedAt?: string; // ISO DateTime
  resolutionDetails?: string;
}

// Platform Settings Collection
export interface PlatformSetting extends Models.Document {
  key: string;
  value: string;
  description?: string;
  lastUpdatedAt: string; // ISO DateTime
}

// Messages Collection
export interface Message extends Models.Document {
  conversationId: string;
  senderProfileId: string; // Link to profiles
  receiverProfileId: string; // Link to profiles
  jobId?: string; // Link to jobs (for job-specific chats)
  content: string;
  sentAt: string; // ISO DateTime
  isRead: boolean;
}

// Notifications Collection
export interface Notification extends Models.Document {
  recipientProfileId: string; // Link to profiles
  type: NotificationType;
  message: string;
  relatedEntityId?: string; // ID of related entity
  isRead: boolean;
  createdAt: string; // ISO DateTime
}

// Extended types for UI components
export interface JobWithDetails extends Job {
  employer?: Profile;
  category?: JobCategory;
  applications?: Application[];
  assignedProvider?: Profile;
}

export interface ProfileWithStats extends Profile {
  reviewsGiven?: Review[];
  reviewsReceived?: Review[];
  jobsPosted?: Job[];
  applications?: Application[];
}

export interface ApplicationWithDetails extends Application {
  job?: Job;
  provider?: Profile;
}

export interface MessageWithProfiles extends Message {
  sender?: Profile;
  receiver?: Profile;
  job?: Job;
}

export interface ConversationSummary {
  conversationId: string;
  otherParticipant: Profile;
  lastMessage: Message;
  unreadCount: number;
  relatedJob?: Job;
}

// Collection IDs (for Appwrite Database operations)
export const COLLECTION_IDS = {
  PROFILES: 'profiles',
  JOB_CATEGORIES: 'job_categories',
  JOBS: 'jobs',
  APPLICATIONS: 'applications',
  PAYMENTS: 'payments',
  REVIEWS: 'reviews',
  DISPUTES: 'disputes',
  PLATFORM_SETTINGS: 'platform_settings',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications'
} as const;

// Database ID
export const DATABASE_ID = 'piece_job_platform_db';

// Storage bucket IDs
export const BUCKET_IDS = {
  AVATARS: 'avatars',
  JOB_IMAGES: 'job_images',
  DOCUMENTS: 'documents'
} as const;
