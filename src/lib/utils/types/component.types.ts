// Component prop types and UI state types

// Component states
export interface LoadingState {
  loading: boolean;
  error?: string;
  success?: string;
}

// Form validation
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Alert/notification types
export interface AlertConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  dismissible?: boolean;
}

// Modal types
export interface ModalState {
  isOpen: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Filter and search types
export interface JobFilters {
  search?: string;
  category?: string;
  location?: string;
  minBudget?: number;
  maxBudget?: number;
  status?: import('./database.types').JobStatus;
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface UserFilters {
  search?: string;
  role?: import('./database.types').UserRole;
  location?: string;
  isVerified?: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
}

// Dashboard data types
export interface DashboardStats {
  totalUsers: number;
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalRevenue: number;
  pendingDisputes: number;
  newApplications: number;
  pendingPayments: number;
}

// Table column configuration
export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: T) => string;
}

// Navigation types
export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  children?: NavItem[];
  requiredRole?: import('./database.types').UserRole[];
}

// Theme and styling
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  spacing: Record<string, string>;
  breakpoints: Record<string, string>;
}
