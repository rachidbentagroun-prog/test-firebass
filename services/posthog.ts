/**
 * PostHog Analytics Service
 * 
 * Handles analytics tracking including:
 * - Traffic attribution (UTM parameters, referrer)
 * - User journey tracking
 * - Signup events
 * - Page view tracking
 */

import posthog from 'posthog-js';

// PostHog instance type
let posthogInstance: typeof posthog | null = null;
let isInitialized = false;

/**
 * Initialize PostHog with configuration
 * Only runs on client-side and once per session
 */
export function initPostHog(): void {
  // Only initialize on client-side
  if (typeof window === 'undefined') return;
  
  // Prevent double initialization
  if (isInitialized) return;
  
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
  const posthogHost = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';
  
  if (!posthogKey) {
    console.warn('PostHog key not found. Analytics will not be tracked.');
    return;
  }

  try {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      
      // Automatically capture page views and page leaves
      capture_pageview: false, // We'll manually capture to have more control
      capture_pageleave: true,
      
      // Enable session recording (optional - disable if you don't want it)
      disable_session_recording: false,
      
      // Capture additional context
      autocapture: true, // Auto-capture clicks, form submits, etc.
      
      // Performance optimizations
      loaded: (posthog) => {
        if (import.meta.env.DEV) {
          console.log('PostHog initialized successfully');
        }
      },
      
      // Privacy settings
      respect_dnt: true, // Respect "Do Not Track" browser setting
      
      // Session recording settings
      session_recording: {
        maskAllInputs: true, // Mask sensitive inputs
        maskTextSelector: '.sensitive', // Mask elements with this class
      },
    });

    posthogInstance = posthog;
    isInitialized = true;
    
    // Capture initial traffic attribution
    captureTrafficAttribution();
    
  } catch (error) {
    console.error('Failed to initialize PostHog:', error);
  }
}

/**
 * Get PostHog instance
 */
export function getPostHog(): typeof posthog | null {
  return posthogInstance;
}

/**
 * Capture traffic attribution data
 * Automatically captures UTM parameters and referrer information
 */
export function captureTrafficAttribution(): void {
  if (!posthogInstance || typeof window === 'undefined') return;

  const urlParams = new URLSearchParams(window.location.search);
  const referrer = document.referrer;
  
  // Extract UTM parameters
  const utmParams = {
    utm_source: urlParams.get('utm_source'),
    utm_medium: urlParams.get('utm_medium'),
    utm_campaign: urlParams.get('utm_campaign'),
    utm_term: urlParams.get('utm_term'),
    utm_content: urlParams.get('utm_content'),
  };
  
  // Filter out null values
  const validUtmParams = Object.fromEntries(
    Object.entries(utmParams).filter(([_, value]) => value !== null)
  );
  
  // Determine traffic source
  let trafficSource = 'direct';
  if (Object.keys(validUtmParams).length > 0) {
    trafficSource = validUtmParams.utm_source || 'unknown_utm';
  } else if (referrer) {
    try {
      const referrerUrl = new URL(referrer);
      const referrerDomain = referrerUrl.hostname.toLowerCase();
      
      // Categorize referrer
      if (referrerDomain.includes('youtube.com') || referrerDomain.includes('youtu.be')) {
        trafficSource = 'youtube';
      } else if (referrerDomain.includes('tiktok.com')) {
        trafficSource = 'tiktok';
      } else if (referrerDomain.includes('facebook.com') || referrerDomain.includes('fb.com')) {
        trafficSource = 'facebook';
      } else if (referrerDomain.includes('google.com')) {
        trafficSource = 'google';
      } else if (referrerDomain.includes('instagram.com')) {
        trafficSource = 'instagram';
      } else if (referrerDomain.includes('twitter.com') || referrerDomain.includes('x.com')) {
        trafficSource = 'twitter';
      } else if (referrerDomain.includes('linkedin.com')) {
        trafficSource = 'linkedin';
      } else {
        trafficSource = 'referral';
      }
    } catch (e) {
      console.warn('Failed to parse referrer URL:', e);
    }
  }
  
  // Register attribution as super properties (persisted across all events)
  if (Object.keys(validUtmParams).length > 0 || referrer) {
    posthogInstance.register({
      traffic_source: trafficSource,
      referrer: referrer || undefined,
      ...validUtmParams,
      initial_landing_page: window.location.href,
      captured_at: new Date().toISOString(),
    });
    
    // Also capture as a specific event for analytics
    posthogInstance.capture('traffic_attribution_captured', {
      traffic_source: trafficSource,
      referrer: referrer || 'none',
      ...validUtmParams,
      landing_page: window.location.href,
    });
  }
}

/**
 * Track page view
 * @param path - The page path (optional, defaults to current path)
 * @param properties - Additional properties to track with the page view
 */
export function trackPageView(path?: string, properties?: Record<string, any>): void {
  if (!posthogInstance) return;
  
  const pagePath = path || window.location.pathname;
  const pageUrl = window.location.href;
  
  posthogInstance.capture('$pageview', {
    $current_url: pageUrl,
    path: pagePath,
    ...properties,
  });
}

/**
 * Track signup event
 * @param userId - Unique user identifier (email or user ID)
 * @param properties - Additional properties (plan, email, etc.)
 */
export function trackSignup(userId: string, properties?: Record<string, any>): void {
  if (!posthogInstance) return;
  
  // Identify the user in PostHog
  posthogInstance.identify(userId, {
    email: properties?.email,
    name: properties?.name,
    signup_date: new Date().toISOString(),
    ...properties,
  });
  
  // Capture the signup event
  posthogInstance.capture('sign_up', {
    plan: properties?.plan || 'free',
    signup_method: properties?.signup_method || 'email',
    ...properties,
  });
  
  console.log('PostHog: Signup tracked for user:', userId);
}

/**
 * Identify a user
 * @param userId - Unique user identifier
 * @param properties - User properties
 */
export function identifyUser(userId: string, properties?: Record<string, any>): void {
  if (!posthogInstance) return;
  
  posthogInstance.identify(userId, properties);
}

/**
 * Track custom event
 * @param eventName - Name of the event
 * @param properties - Event properties
 */
export function trackEvent(eventName: string, properties?: Record<string, any>): void {
  if (!posthogInstance) return;
  
  posthogInstance.capture(eventName, properties);
}

/**
 * Reset PostHog identity (on logout)
 */
export function resetPostHogIdentity(): void {
  if (!posthogInstance) return;
  
  posthogInstance.reset();
}

/**
 * Set user properties
 * @param properties - Properties to set for the current user
 */
export function setUserProperties(properties: Record<string, any>): void {
  if (!posthogInstance) return;
  
  posthogInstance.people.set(properties);
}

/**
 * Track user login
 * @param userId - User identifier
 * @param properties - Additional properties
 */
export function trackLogin(userId: string, properties?: Record<string, any>): void {
  if (!posthogInstance) return;
  
  posthogInstance.identify(userId, properties);
  posthogInstance.capture('user_login', properties);
}

/**
 * Track user logout
 */
export function trackLogout(): void {
  if (!posthogInstance) return;
  
  posthogInstance.capture('user_logout');
  resetPostHogIdentity();
}
