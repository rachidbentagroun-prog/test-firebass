import React, { useEffect } from 'react';

// Google Analytics pageview/event tracking (replace with your GA logic if needed)
function trackSignupSuccess() {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'signup_success', {
      event_category: 'engagement',
      event_label: 'Signup Success',
    });
  }
}

const SignupSuccess: React.FC = () => {
  useEffect(() => {
    trackSignupSuccess();
    // Redirect to home after 2 seconds
    const timer = setTimeout(() => {
      window.location.href = '/';
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1>Welcome!</h1>
      <p>Your account was created successfully.</p>
      <p>Redirecting to home...</p>
    </div>
  );
};

export default SignupSuccess;
