export interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  avatar: string;
  community_id: number;
  community_name?: string;
  role: 'user' | 'community_admin' | 'platform_admin';
  credit_score: number;
  balance: number;
  frozen_balance?: number;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface Community {
  id: number;
  name: string;
  invite_code: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string;
  admin_id: number;
  member_count?: number;
  created_at: string;
}

export interface Task {
  id: number;
  publisher_id: number;
  publisher_name?: string;
  publisher_avatar?: string;
  claimer_id: number;
  claimer_name?: string;
  claimer_avatar?: string;
  community_id: number;
  community_name?: string;
  title: string;
  description: string;
  category: TaskCategory;
  reward: number;
  reward_type: 'fixed' | 'credit' | 'cash';
  bounty?: number;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  deadline: string;
  status: 'pending' | 'claimed' | 'completed' | 'confirmed' | 'cancelled';
  latitude: number;
  longitude: number;
  address: string;
  location_address?: string;
  version?: number;
  created_at: string;
  updated_at: string;
  review?: Review;
  images?: string[];
  distance?: number;
  publisher?: User;
  claimer?: User;
}

export type TaskCategory = 'delivery' | 'pet' | 'repair' | 'medical' | 'tutor' | 'cleaning' | 'cooking' | 'moving' | 'other';

export interface Review {
  id: number;
  /** 与 reviewer_id 联合唯一 */
  task_id: number;
  reviewer_id: number;
  reviewee_id: number;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Message {
  id: number;
  task_id: number;
  sender_id: number;
  sender_name?: string;
  content: string;
  type: 'text' | 'system' | 'image';
  created_at: string;
}

export interface Conversation {
  task_id: number;
  task_title: string;
  other_user_id: number;
  other_user_name: string;
  other_user_avatar: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export interface Transaction {
  id: number;
  user_id: number;
  task_id: number;
  task_title?: string;
  type: 'reward_income' | 'reward_expense' | 'withdraw' | 'deposit' | 'service_fee' | 'refund' | 'freeze' | 'unfreeze' | 'income' | 'expense' | 'bounty_income' | 'bounty_expense' | 'penalty' | 'admin_adjust' | 'payment' | 'credit_add';
  amount: number;
  balance_after?: number;
  description?: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
}

export interface UserStats {
  published_count: number;
  claimed_count: number;
  completed_count: number;
  completion_rate: number;
  avg_rating: number;
  total_income: number;
  total_expense: number;
}

export interface LeaderboardItem {
  rank: number;
  user_id: number;
  username: string;
  avatar: string;
  value: number;
  extra?: string;
}

export interface Complaint {
  id: number;
  task_id: number;
  task_title: string;
  complainant_id: number;
  complainant_name: string;
  respondent_id: number;
  respondent_name: string;
  reason: string;
  status: 'pending' | 'processing' | 'resolved';
  result?: string;
  created_at: string;
}

export interface PlatformConfig {
  service_fee_rate: string;
  min_withdraw_amount: string;
  credit_score_base: string;
  credit_score_task_complete_bonus: string;
  credit_score_task_fail_penalty: string;
  credit_score_five_star_bonus: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  code: number;
  message: string;
  data: T[];
  total: number;
  page: number;
  page_size: number;
  per_page?: number;
}

export interface LoginPayload {
  phone?: string;
  email?: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refresh_token: string;
}

export interface ChatMessage {
  id: number;
  task_id: number;
  sender_id: number;
  sender_name?: string;
  content: string;
  type: 'text' | 'system' | 'image';
  created_at: string;
}
