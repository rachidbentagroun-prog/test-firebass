
import { User, TrafficDataPoint, TrafficSource } from '../types';

export const COUNTRIES = ['USA', 'UK', 'France', 'Germany', 'Canada', 'Japan', 'Brazil', 'India'];
export const PLANS = ['free', 'basic', 'premium'] as const;

// Generate 50 fake users for the admin demo
export const generateMockUsers = (): User[] => {
  return Array.from({ length: 50 }).map((_, i) => ({
    id: `usr_${Math.random().toString(36).substr(2, 9)}`,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: 'user',
    plan: PLANS[Math.floor(Math.random() * PLANS.length)],
    credits: Math.floor(Math.random() * 50),
    isRegistered: true,
    gallery: [],
    country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
    status: Math.random() > 0.9 ? 'suspended' : 'active',
    joinedAt: Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 30) // Last 30 days
  }));
};

export const MOCK_REVENUE_DATA = [
  { month: 'Jan', amount: 1200 },
  { month: 'Feb', amount: 1900 },
  { month: 'Mar', amount: 3000 },
  { month: 'Apr', amount: 2500 },
  { month: 'May', amount: 4200 },
  { month: 'Jun', amount: 5500 },
];

export const MOCK_COUNTRY_DATA = [
  { country: 'USA', users: 1240, percentage: 45 },
  { country: 'UK', users: 500, percentage: 18 },
  { country: 'Germany', users: 300, percentage: 11 },
  { country: 'France', users: 250, percentage: 9 },
  { country: 'Others', users: 450, percentage: 17 },
];

// New Analytics Data
export const MOCK_TRAFFIC_DATA: TrafficDataPoint[] = Array.from({ length: 14 }).map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (13 - i));
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    visitors: Math.floor(Math.random() * 500) + 200,
    pageViews: Math.floor(Math.random() * 1000) + 500,
    generations: Math.floor(Math.random() * 200) + 50
  };
});

export const MOCK_TRAFFIC_SOURCES: TrafficSource[] = [
  { source: 'Google / Organic', count: 4520, percentage: 45 },
  { source: 'Direct', count: 2100, percentage: 21 },
  { source: 'Social (Twitter/X)', count: 1800, percentage: 18 },
  { source: 'Referral', count: 1200, percentage: 12 },
  { source: 'Email Marketing', count: 400, percentage: 4 },
];

export const DEVICE_STATS = {
  desktop: 65,
  mobile: 30,
  tablet: 5
};
