// ===== Type Definitions =====

export type UserRole = "freelancer" | "client" | "admin";

export type ProjectStatus =
  | "draft"
  | "open"
  | "in_progress"
  | "completed"
  | "closed"
  | "cancelled";

export type BidStatus = "pending" | "accepted" | "rejected";

export type PaymentStatus =
  | "pending"
  | "completed"
  | "refunded"
  | "disputed";

export type NotificationType =
  | "bid_received"
  | "bid_accepted"
  | "bid_rejected"
  | "message"
  | "project_status_change"
  | "review_reminder"
  | "payment_received";

export type TagCategory = "tech" | "project_type" | "domain" | "tool";

// ===== User Types =====

export interface User {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  bio?: string;
  skills?: string[];
  avatar_url?: string;
  rating?: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfile extends User {
  phone?: string;
  phone_verified: boolean;
  email_verified: boolean;
  portfolio_links?: string[];
  completed_projects_count: number;
  average_rating: number;
}

// ===== Project Types =====

export interface Project {
  id: string;
  client_id: string;
  title: string;
  description: string;
  ai_summary?: string;
  project_type?: string;
  budget_min: number;
  budget_max: number;
  budget_estimate_only: boolean;
  start_date?: Date;
  deadline?: Date;
  deadline_flexible: boolean;
  required_skills?: string[];
  project_brief?: Record<string, any>;
  reference_links?: string[];
  design_style?: string;
  payment_method?: string;
  payment_schedule?: Record<string, any>;
  deliverables?: string[];
  communication_preference?: string[];
  special_requirements?: string;
  status: ProjectStatus;
  accepted_bid_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProjectWithClient extends Project {
  client: User;
  tags?: Tag[];
  bids_count?: number;
}

// ===== Bid Types =====

export interface Bid {
  id: string;
  project_id: string;
  freelancer_id: string;
  proposal: string;
  bid_amount: number;
  status: BidStatus;
  created_at: Date;
}

export interface BidWithFreelancer extends Bid {
  freelancer: User;
}

// ===== Message Types =====

export interface Message {
  id: string;
  project_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  attachment_urls?: string[];
  is_read: boolean;
  created_at: Date;
}

export interface MessageWithSender extends Message {
  sender: User;
}

// ===== Notification Types =====

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  related_project_id?: string;
  related_bid_id?: string;
  is_read: boolean;
  created_at: Date;
}

// ===== Review Types =====

export interface Review {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  project_id: string;
  rating: number;
  comment?: string;
  tags?: string[];
  created_at: Date;
}

export interface ReviewWithReviewer extends Review {
  reviewer: User;
}

// ===== Payment Types =====

export interface Payment {
  id: string;
  project_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  payment_method: string;
  payment_stage: string;
  status: PaymentStatus;
  transaction_id?: string;
  created_at: Date;
  completed_at?: Date;
}

// ===== Tag Types =====

export interface Tag {
  id: string;
  name: string;
  slug: string;
  category: TagCategory;
  description?: string;
  icon?: string;
  color?: string;
  usage_count: number;
  is_system: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ===== API Response Types =====

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ===== Auth Types =====

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  roles: UserRole[];
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  roles: UserRole[];
  iat?: number;
  exp?: number;
}

