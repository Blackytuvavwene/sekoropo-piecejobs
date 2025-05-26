// Application constants

export const APP_CONFIG = {
  name: 'Sekoropo PieceJobs',
  description: 'Connecting skilled workers with piece-job opportunities across Botswana',
  version: '1.0.0',
  author: 'Sekoropo Platform',
  url: 'https://sekoropo.com',
  support: {
    email: 'support@sekoropo.com',
    phone: '+267 XXX XXXX'
  }
} as const;

export const APPWRITE_CONFIG = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  projectId: '6833845b003c826c9685',
  databaseId: 'piece_job_platform_db'
} as const;

export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 100,
  minLimit: 5
} as const;

export const VALIDATION = {
  password: {
    minLength: 8,
    maxLength: 50,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false
  },
  username: {
    minLength: 3,
    maxLength: 30
  },
  bio: {
    maxLength: 1000
  },
  jobTitle: {
    minLength: 5,
    maxLength: 200
  },
  jobDescription: {
    minLength: 20,
    maxLength: 5000
  },
  message: {
    maxLength: 2000
  },
  review: {
    maxLength: 1000
  }
} as const;

export const FILE_UPLOAD = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxJobImages: 5,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
} as const;

export const CURRENCY = {
  default: 'BWP',
  symbol: 'P',
  name: 'Botswana Pula'
} as const;

export const PAYMENT = {
  commissionRate: 0.1, // 10%
  minJobBudget: 50, // 50 BWP
  maxJobBudget: 50000, // 50,000 BWP
  processingFee: 5 // 5 BWP
} as const;

export const RATING = {
  min: 1,
  max: 5,
  default: 0
} as const;

export const LOCATIONS = [
  'Gaborone',
  'Francistown',
  'Molepolole',
  'Maun',
  'Serowe',
  'Selibe Phikwe',
  'Kanye',
  'Mahalapye',
  'Mogoditshane',
  'Mochudi',
  'Lobatse',
  'Palapye',
  'Ramotswa',
  'Thamaga',
  'Janeng',
  'Moshupa',
  'Tonota',
  'Tutume',
  'Bobonong',
  'Kasane'
] as const;

export const JOB_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Cleaning',
  'Gardening',
  'Painting',
  'Masonry',
  'Roofing',
  'Appliance Repair',
  'Computer Repair',
  'Web Development',
  'Graphic Design',
  'Photography',
  'Event Planning',
  'Catering',
  'Tutoring',
  'Translation',
  'Data Entry',
  'Customer Service',
  'Delivery',
  'Moving',
  'Security',
  'Maintenance',
  'Other'
] as const;

export const NOTIFICATION_SETTINGS = {
  email: {
    jobApplications: true,
    jobAssignments: true,
    paymentUpdates: true,
    messages: true,
    reviews: true,
    disputes: true,
    systemUpdates: false
  },
  push: {
    jobApplications: true,
    jobAssignments: true,
    paymentUpdates: true,
    messages: true,
    reviews: false,
    disputes: true,
    systemUpdates: false
  }
} as const;

export const ROUTES = {
  // Public routes
  home: '/',
  about: '/about',
  services: '/services',
  contact: '/contact',
  terms: '/terms',
  privacy: '/privacy',
  
  // App routes
  dashboard: '/app',
  jobs: '/app/jobs',
  jobDetails: (id: string) => `/app/jobs/${id}`,
  postJob: '/app/jobs/post',
  profile: '/app/profile',
  messages: '/app/messages',
  settings: '/app/settings',
  
  // Admin routes
  admin: '/admin',
  adminUsers: '/admin/users',
  adminJobs: '/admin/jobs',
  adminDisputes: '/admin/disputes',
  adminSettings: '/admin/settings'
} as const;

export const REALTIME_CHANNELS = {
  user: (userId: string) => `user.${userId}`,
  job: (jobId: string) => `job.${jobId}`,
  conversation: (conversationId: string) => `conversation.${conversationId}`,
  admin: 'admin'
} as const;

export const LOCAL_STORAGE_KEYS = {
  theme: 'sekoropo_theme',
  language: 'sekoropo_language',
  recentSearches: 'sekoropo_recent_searches',
  draftJob: 'sekoropo_draft_job',
  userPreferences: 'sekoropo_user_preferences'
} as const;
