
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
  role: 'user' | 'admin';
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
