
export interface SystemMessage {
  id: string;
  sender: string;
  subject: string;
  content: string;
  timestamp: number;
  isRead: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'support';
  text: string;
  timestamp: number;
}

export interface SupportSession {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  isGuest: boolean;
  chatHistory: ChatMessage[];
  lastMessageAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin' | 'super-admin';
  plan: 'free' | 'basic' | 'premium';
  credits: number;
  isRegistered: boolean;
  isVerified?: boolean; // New: tracking verification status
  gallery: GeneratedImage[];
  videoGallery?: GeneratedVideo[];
  audioGallery?: GeneratedAudio[];
  messages?: SystemMessage[];
  chatHistory?: ChatMessage[];
  country?: string;
  status?: 'active' | 'suspended';
  joinedAt?: number;
  avatarUrl?: string;
  theme?: 'dark' | 'light'; // Theme preference
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  createdAt: number;
}

export interface GeneratedVideo {
  id: string;
  url: string;
  uri: string; // The original Veo URI
  prompt: string;
  createdAt: number;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
  resolution: '480p' | '720p' | '1080p' | '4K';
  durationSeconds?: number;
  durationLabel?: string;
  rawVideoData?: any; // Stores the object required for video extension
}

export interface GeneratedAudio {
  id: string;
  url: string; // Blob or data URL
  text: string;
  voice: string;
  createdAt: number;
  blob?: Blob; // Store actual blob for export
  base64Audio?: string; // Base64 encoded audio for persistence
  isCloned?: boolean;
  engine?: string;
  mimeType?: string;
}

export interface VideoLabConfig {
  hero: {
    title: string;
    subtitle: string;
    videoUrl: string;
  };
  scriptToCinema: {
    title: string;
    subtitle: string;
    videoUrl: string;
    prompt: string;
  };
  refineExtend: {
    title: string;
    subtitle: string;
    frames: string[];
  };
  showcase: Array<{
    id: string;
    url: string;
    title: string;
    tag: string;
    prompt: string;
  }>;
}

export interface TTSLabConfig {
  voices: Array<{
    id: string;
    name: string;
    description: string;
    previewUrl?: string;
    isCloned?: boolean;
  }>;
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  credits: number | 'Unlimited';
  features: string[];
  recommended?: boolean;
  buttonUrl?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatarUrl?: string;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  imageUrl?: string;
  link?: string;
  date: string;
}

export interface NavItem {
  id: string;
  label: string;
  url: string;
}

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  tiktok?: string;
}

export interface CustomPage {
  id: string;
  slug: string;
  title: string;
  content: string;
}

export interface SiteConfig {
  heroTitle: string;
  heroSubtitle: string;
  slideshow: string[];
  plans: Plan[];
  maintenanceMode: boolean;
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
  testimonials: Testimonial[];
  articles: Article[];
  topMenu: NavItem[];
  footerMenu: NavItem[];
  socialLinks: SocialLinks;
  customPages: CustomPage[];
  showcaseImages: string[];
  logoUrl?: string;
  promptPlaceholder?: string;
  landingPageOrder: string[];
  videoLab?: VideoLabConfig;
  ttsLab?: TTSLabConfig;
}

export interface AIJob {
  id: string;
  userId: string;
  userName: string;
  type: 'image' | 'video' | 'clipping' | 'audio';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  duration?: string;
  createdAt: number;
}

export interface ConnectionRequest {
  id: string;
  name: string;
  email: string;
  company: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface AuditLog {
  id: string;
  adminName: string;
  action: string;
  resource: string;
  ipAddress: string;
  timestamp: number;
}

export interface AITool {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'beta' | 'maintenance';
  description: string;
  category: 'generation' | 'editing' | 'video' | 'voice';
}

export interface TrafficDataPoint {
  date: string;
  visitors: number;
  pageViews: number;
  generations: number;
}

export interface TrafficSource {
  source: string;
  count: number;
  percentage: number;
}

// ============================================
// CREDIT SYSTEM TYPES
// ============================================

export interface CreditConfig {
  id: string;
  // Cost per generation type (in credits)
  imageCost: number;
  videoCostPerSecond: number;
  voiceCostPerMinute: number;
  chatCostPerToken: number;
  // Optional: cost by quality/resolution
  imageHDCost?: number;
  video4KCost?: number;
  // Default credit grants
  freeSignupCredits: number;
  basicPlanCredits: number;
  premiumPlanCredits: number;
  updatedAt: number;
  updatedBy?: string;
}

export interface CreditLog {
  id: string;
  userId: string;
  userEmail: string;
  type: 'deduction' | 'grant' | 'bonus' | 'refund' | 'purchase';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  aiType?: 'image' | 'video' | 'voice' | 'chat';
  metadata?: {
    jobId?: string;
    prompt?: string;
    duration?: number;
    tokens?: number;
    adminId?: string;
    adminEmail?: string;
  };
  timestamp: number;
  ipAddress?: string;
}

export interface UsageLog {
  id: string;
  userId: string;
  userEmail: string;
  aiType: 'image' | 'video' | 'voice' | 'chat';
  service: string; // 'dalle3', 'klingai', 'elevenlabs', 'gemini', etc.
  creditsUsed: number;
  status: 'success' | 'failed' | 'pending';
  prompt?: string;
  promptHash?: string; // SHA-256 hash for privacy
  duration?: number; // For video/voice
  tokens?: number; // For chat
  outputUrl?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
  timestamp: number;
  ipAddress?: string;
  deviceInfo?: string;
}

export interface AIActivity {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  aiType: 'image' | 'video' | 'voice' | 'chat';
  service: string;
  prompt: string; // Truncated (first 100 chars)
  promptHash: string; // Full hash
  creditsUsed: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  resultUrl?: string;
  errorMessage?: string;
  timestamp: number;
  completedAt?: number;
  processingTime?: number; // milliseconds
  ipAddress?: string;
  country?: string;
  deviceInfo?: string;
}

export interface AbuseDetection {
  id: string;
  userId: string;
  userEmail: string;
  abuseType: 'rate_limit' | 'inappropriate_prompt' | 'suspicious_activity' | 'credit_fraud';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata?: Record<string, any>;
  actionTaken?: 'warning' | 'throttle' | 'suspend' | 'ban';
  timestamp: number;
  resolvedAt?: number;
  resolvedBy?: string;
}

export interface RateLimitConfig {
  id: string;
  userId?: string; // If null, applies globally
  aiType: 'image' | 'video' | 'voice' | 'chat' | 'all';
  maxRequests: number;
  windowMinutes: number;
  currentCount: number;
  windowStart: number;
  blockedUntil?: number;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: 'grant_credits' | 'edit_config' | 'suspend_user' | 'unsuspend_user' | 'block_ip' | 'unblock_ip' | 'edit_rate_limit' | 'view_user_data';
  targetType: 'user' | 'config' | 'ip' | 'system';
  targetId?: string;
  details: string;
  changesMade?: Record<string, any>;
  ipAddress: string;
  timestamp: number;
}

export interface CreditUsageStats {
  totalCreditsUsed: number;
  totalGenerations: number;
  byType: {
    image: { count: number; credits: number };
    video: { count: number; credits: number };
    voice: { count: number; credits: number };
    chat: { count: number; credits: number };
  };
  byUser: Array<{
    userId: string;
    userEmail: string;
    totalCredits: number;
    generationCount: number;
  }>;
  timeRange: {
    start: number;
    end: number;
  };
}

// ============================================
// AI ENGINE & DYNAMIC PRICING TYPES
// ============================================

export type AIType = 'image' | 'video' | 'voice' | 'chat';
export type CostUnit = 'image' | 'second' | 'minute' | 'token' | 'message';

/**
 * Represents an AI engine/model (e.g., DALL-E, Gemini, etc.)
 * Stored in Firestore collection: ai_engines
 */
export interface AIEngine {
  id: string; // Firestore document ID (e.g., 'dalle', 'gemini', 'openai', 'seddream')
  engine_name: string; // Display name (e.g., 'DALL-E 3', 'Gemini Pro')
  ai_type: AIType; // Type of AI service
  is_active: boolean; // Whether engine is available for use
  base_cost: number; // Credit cost per unit
  cost_unit: CostUnit; // Unit of measurement for cost
  description: string; // Description of the engine
  created_at: number; // Timestamp
  updated_at: number; // Timestamp
  // Optional metadata
  version?: string; // Engine version (e.g., 'v3', '1.5')
  provider?: string; // Provider name (e.g., 'OpenAI', 'Google')
  capabilities?: string[]; // Special features (e.g., ['HD', '4K', 'Fast'])
  max_input?: number; // Max input size (tokens, seconds, etc.)
  average_speed?: number; // Average processing time in seconds
  quality_tier?: 'basic' | 'standard' | 'premium'; // Quality level
}

/**
 * Pricing configuration per AI type
 * Stored in Firestore collection: credit_pricing
 * Document ID = ai_type (image | video | voice | chat)
 */
export interface CreditPricing {
  ai_type: AIType; // Document ID
  default_engine: string; // Default engine ID for this AI type
  engines: {
    [engineId: string]: {
      cost: number; // Cost override for this specific engine
      is_active?: boolean; // Override active status
    };
  };
  updated_at: number;
  updated_by?: string; // Admin email who made changes
}

/**
 * Enhanced usage log with engine information
 * Extends the existing UsageLog with engine-specific data
 */
export interface EngineUsageLog extends UsageLog {
  engine_id: string; // Specific engine used
  engine_name: string; // Engine display name
  cost_unit: CostUnit; // Cost unit for this usage
  input_size: number; // Actual input size (tokens, seconds, images, etc.)
  cost_per_unit: number; // Cost per unit at time of usage
  total_cost: number; // Total credits charged
}

/**
 * Engine statistics for admin dashboard
 */
export interface EngineStats {
  engine_id: string;
  engine_name: string;
  ai_type: AIType;
  total_usage_count: number;
  total_credits_used: number;
  average_credits_per_use: number;
  success_rate: number; // Percentage
  average_processing_time?: number; // Seconds
  last_used?: number; // Timestamp
  popular_rank?: number; // 1 = most popular
}

/**
 * Request payload for engine-based credit deduction
 */
export interface EngineCreditRequest {
  userId: string;
  ai_type: AIType;
  engine_id: string;
  input_size: number; // Tokens, seconds, images, etc.
  prompt?: string;
  metadata?: Record<string, any>;
}

// ============================================
// SUBSCRIPTION PLAN & PRICING OVERRIDE TYPES
// ============================================

export type PlanTier = 'free' | 'basic' | 'pro' | 'enterprise';

/**
 * Subscription plan configuration
 * Stored in Firestore collection: subscription_plans
 * Document ID = plan_id (free | basic | pro | enterprise)
 */
export interface SubscriptionPlan {
  id: PlanTier; // Firestore document ID
  name: string; // Display name (e.g., 'Free Plan', 'Pro Plan')
  monthly_price: number; // Price in USD
  yearly_price: number; // Annual price in USD (discounted)
  monthly_credits: number; // Credits granted per month
  features: {
    image: boolean; // Can generate images
    video: boolean; // Can generate videos
    voice: boolean; // Can generate voice
    chat: boolean; // Can use chat
    hd_quality?: boolean; // Access to HD/premium quality
    priority_queue?: boolean; // Priority processing
    api_access?: boolean; // API access
    commercial_license?: boolean; // Commercial usage allowed
  };
  limits?: {
    max_images_per_day?: number;
    max_videos_per_day?: number;
    max_voice_minutes_per_day?: number;
    max_chat_messages_per_day?: number;
  };
  description?: string; // Plan description
  created_at: number;
  updated_at: number;
}

/**
 * Per-plan pricing overrides for engines
 * Stored in Firestore collection: plan_pricing_overrides
 * Document ID = plan_id (free | basic | pro | enterprise)
 * 
 * This allows each subscription plan to have custom credit costs per engine.
 * If override exists, it takes precedence over engine default cost.
 */
export interface PlanPricingOverride {
  plan_id: PlanTier; // Document ID
  ai_types: {
    image?: {
      [engineId: string]: {
        cost: number; // Override cost for this engine on this plan
        enabled?: boolean; // Whether this plan can use this engine
      };
    };
    video?: {
      [engineId: string]: {
        cost: number;
        enabled?: boolean;
      };
    };
    voice?: {
      [engineId: string]: {
        cost: number;
        enabled?: boolean;
      };
    };
    chat?: {
      [engineId: string]: {
        cost: number;
        enabled?: boolean;
      };
    };
  };
  updated_at: number;
  updated_by?: string; // Admin email who made changes
}

/**
 * Credit cost calculation result with pricing source
 */
export interface CreditCostResult {
  cost: number; // Final credit cost
  cost_per_unit: number; // Cost per unit (image, second, token, etc.)
  total_cost: number; // Total cost (cost_per_unit × input_size)
  input_size: number; // Input size used in calculation
  pricing_source: 'plan_override' | 'engine_default' | 'global_default'; // Where cost came from
  engine_id: string; // Engine used
  engine_name: string; // Engine display name
  ai_type: AIType; // AI type
  user_plan: PlanTier; // User's subscription plan
  cost_unit: CostUnit; // Unit of measurement
}

/**
 * Enhanced usage log with plan and pricing source
 * Extends EngineUsageLog with subscription plan information
 */
export interface PlanUsageLog extends EngineUsageLog {
  subscription_plan: PlanTier; // User's plan at time of usage
  pricing_source: 'plan_override' | 'engine_default' | 'global_default'; // Where cost came from
  plan_name?: string; // Plan display name
}

/**
 * Plan usage statistics for analytics
 */
export interface PlanUsageStats {
  plan_id: PlanTier;
  plan_name: string;
  total_users: number;
  total_generations: number;
  total_credits_used: number;
  average_credits_per_user: number;
  by_ai_type: {
    [aiType: string]: {
      count: number;
      credits: number;
      engines: {
        [engineId: string]: {
          count: number;
          credits: number;
        };
      };
    };
  };
  timeRange: {
    start: number;
    end: number;
  };
}
