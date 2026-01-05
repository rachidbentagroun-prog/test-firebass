/**
 * Profit & Cost Intelligence System - TypeScript Interfaces
 * 
 * Enterprise-grade type definitions for financial tracking
 * across AI SaaS subscription platform
 */

import { Timestamp } from 'firebase-admin/firestore';

// ============================================
// AI ENGINE COSTS
// ============================================

export type AIType = 'image' | 'video' | 'voice' | 'chat';
export type UnitType = 'image' | 'second' | 'minute' | '1k_tokens';
export type QualityTier = 'standard' | 'hd' | '4k' | 'ultra';
export type ProviderName = 'OpenAI' | 'Google' | 'SEDDREAM' | 'Anthropic' | 'Stability';

export interface AIEngineCost {
  engine_id: string;
  provider_name: ProviderName;
  ai_type: AIType;
  cost_per_unit: number; // USD
  unit_type: UnitType;
  quality_tier?: QualityTier;
  resolution?: string;
  updated_at: Timestamp | Date;
  updated_by: string; // Admin UID
  is_active: boolean;
  notes?: string;
}

// ============================================
// USAGE LOGS (EXTENDED)
// ============================================

export type PricingSource = 'plan_override' | 'engine_default';
export type DeviceType = 'web' | 'mobile' | 'api';

export interface UsageLog {
  // Core fields
  user_id: string;
  subscription_plan: string;
  ai_type: AIType;
  engine_id: string;
  usage_units: number;
  credits_used: number;
  created_at: Timestamp | Date;

  // Financial metrics
  real_cost_usd: number;
  revenue_estimated_usd: number;
  profit_usd: number;
  profit_margin_percent: number;
  pricing_source: PricingSource;

  // Metadata
  request_id?: string;
  country_code?: string;
  device_type?: DeviceType;
  generation_time_ms?: number;
}

// ============================================
// PROFIT AGGREGATES
// ============================================

export type PeriodType = 'daily' | 'monthly' | 'yearly' | 'all_time';

export interface CostByEngine {
  [engine_id: string]: {
    cost_usd: number;
    usage_count: number;
    avg_cost_per_use: number;
  };
}

export interface RevenueByPlan {
  [plan_name: string]: {
    revenue_usd: number;
    user_count: number;
    generation_count: number;
  };
}

export interface ProfitByPlan {
  [plan_name: string]: {
    profit_usd: number;
    profit_margin_percent: number;
    cost_usd: number;
    revenue_usd: number;
  };
}

export interface ProfitAggregate {
  period_id: string;
  period_type: PeriodType;
  period_start: Timestamp | Date;
  period_end: Timestamp | Date;

  // Aggregate metrics
  total_cost_usd: number;
  total_revenue_usd: number;
  total_profit_usd: number;
  profit_margin_percent: number;

  // Breakdowns
  cost_by_engine: CostByEngine;
  revenue_by_plan: RevenueByPlan;
  profit_by_plan: ProfitByPlan;

  // Loss metrics
  loss_users_count: number;
  loss_plans: string[];
  worst_performing_engine?: string;

  // Usage stats
  total_generations: number;
  total_users: number;
  avg_cost_per_user: number;
  avg_revenue_per_user: number;

  // Metadata
  updated_at: Timestamp | Date;
  calculation_duration_ms: number;
  data_completeness_percent: number;
}

// ============================================
// LOSS USERS
// ============================================

export type ActionTaken = 'rate_limited' | 'plan_upgraded' | 'monitored' | 'account_suspended';

export interface LossUser {
  user_id: string;
  email: string;
  subscription_plan: string;

  // Financial metrics (last 30 days)
  total_cost_usd: number;
  total_revenue_usd: number;
  total_profit_usd: number; // Negative
  profit_margin_percent: number; // Negative

  // Usage patterns
  total_generations: number;
  most_used_engine: string;
  most_expensive_engine: string;

  // Detection
  detected_at: Timestamp | Date;
  last_checked_at: Timestamp | Date;
  days_in_loss: number;

  // Action tracking
  alert_sent: boolean;
  alert_sent_at?: Timestamp | Date;
  action_taken?: ActionTaken;
  notes?: string;
}

// ============================================
// AUDIT LOG
// ============================================

export type AuditActionType = 
  | 'cost_updated' 
  | 'pricing_changed' 
  | 'loss_detected' 
  | 'plan_modified'
  | 'user_flagged'
  | 'engine_disabled';

export type AuditEntityType = 'engine' | 'plan' | 'user' | 'system';

export interface ProfitAuditLog {
  action_type: AuditActionType;
  entity_type: AuditEntityType;
  entity_id: string;

  before_value?: any;
  after_value?: any;

  changed_by: string; // Admin UID
  changed_at: Timestamp | Date;
  ip_address?: string;
  reason?: string;
}

// ============================================
// CALCULATION HELPERS
// ============================================

export interface CostCalculationInput {
  engine_id: string;
  usage_units: number;
  user_id: string;
  subscription_plan: string;
}

export interface CostCalculationResult {
  real_cost_usd: number;
  revenue_estimated_usd: number;
  profit_usd: number;
  profit_margin_percent: number;
  pricing_source: PricingSource;
  engine_cost_per_unit: number;
}

export interface RevenueAllocationInput {
  user_id: string;
  subscription_plan: string;
  usage_units: number;
  ai_type: AIType;
}

export interface RevenueAllocationResult {
  allocated_revenue_usd: number;
  plan_monthly_price: number;
  user_usage_percentage: number;
}

// ============================================
// DASHBOARD DATA STRUCTURES
// ============================================

export interface DashboardMetrics {
  // Current period
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  profit_margin: number;

  // Comparisons
  revenue_change_percent: number;
  cost_change_percent: number;
  profit_change_percent: number;

  // Top performers
  top_profitable_plans: Array<{
    plan_name: string;
    profit_usd: number;
    margin_percent: number;
  }>;

  // Loss makers
  loss_making_plans: Array<{
    plan_name: string;
    profit_usd: number; // Negative
    margin_percent: number; // Negative
  }>;

  // Engine costs
  top_cost_engines: Array<{
    engine_id: string;
    cost_usd: number;
    usage_count: number;
  }>;

  // Expensive users
  most_expensive_users: Array<{
    user_id: string;
    email: string;
    cost_usd: number;
    profit_usd: number;
  }>;
}

export interface ChartDataPoint {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
}

export interface PieChartData {
  label: string;
  value: number;
  percentage: number;
  color?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ProfitAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface ProfitDashboardResponse {
  metrics: DashboardMetrics;
  charts: {
    cost_vs_revenue: ChartDataPoint[];
    profit_by_plan: PieChartData[];
    cost_by_engine: PieChartData[];
    profit_over_time: ChartDataPoint[];
  };
  loss_alerts: LossUser[];
  last_updated: Date;
}

// ============================================
// CONFIGURATION TYPES
// ============================================

export interface ProfitSystemConfig {
  // Cost caching
  cost_cache_ttl_seconds: number;
  
  // Aggregation schedules
  daily_aggregation_time: string; // "00:01"
  monthly_aggregation_day: number; // 1
  
  // Loss detection
  loss_threshold_percent: number; // -10
  loss_detection_period_days: number; // 30
  loss_check_interval_hours: number; // 1
  
  // Data retention
  usage_logs_ttl_days: number; // 90
  audit_logs_ttl_days: number; // 730
  
  // Performance
  batch_size: number; // 500
  max_concurrent_calculations: number; // 10
}

// ============================================
// SUBSCRIPTION PLAN PRICING
// ============================================

export interface SubscriptionPlan {
  plan_id: string;
  plan_name: string;
  monthly_price_usd: number;
  annual_price_usd?: number;
  credits_per_month: number;
  features: string[];
  is_active: boolean;
}

// ============================================
// EXPORTS
// ============================================

export type {
  Timestamp as FirestoreTimestamp
};
