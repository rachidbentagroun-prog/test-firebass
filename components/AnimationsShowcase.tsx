import React, { useState } from 'react';

/**
 * Modern Animations Showcase Component
 * 
 * Demonstrates all CSS animations and micro-interactions
 * in a single reusable showcase page
 */

export function AnimationsShowcase() {
  const [formData, setFormData] = useState({
    email: '',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="landing-theme min-h-screen py-12 px-4">
      {/* Header with page load animation */}
      <section className="animate-fade-in-up max-w-4xl mx-auto mb-16">
        <h1 className="heading-lg mb-4">✨ Modern Animations Showcase</h1>
        <p className="text-xl text-gray-600">
          Experience smooth, professional CSS animations and micro-interactions
        </p>
      </section>

      {/* 1. Button Micro-Interactions */}
      <section className="animate-fade-in-up max-w-4xl mx-auto mb-16" style={{ animationDelay: '0.1s' }}>
        <h2 className="heading-md mb-8">🔘 Button Micro-Interactions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-8 text-center">
            <h3 className="font-semibold mb-4">Primary Button</h3>
            <button className="btn btn-primary mb-4">
              Hover me
            </button>
            <p className="text-sm text-gray-500">Scale 1.03, lift, shadow</p>
          </div>

          <div className="card p-8 text-center">
            <h3 className="font-semibold mb-4">Secondary Button</h3>
            <button className="btn btn-secondary mb-4">
              Click me
            </button>
            <p className="text-sm text-gray-500">Color transition</p>
          </div>

          <div className="card p-8 text-center">
            <h3 className="font-semibold mb-4">Ghost Button</h3>
            <button className="btn btn-ghost mb-4">
              Press me
            </button>
            <p className="text-sm text-gray-500">Minimal styling</p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-900">
            <strong>Effects:</strong> Hover (scale 1.03, -2px lift, shadow), Active (scale 0.98, press down), Focus (outline ring)
          </p>
        </div>
      </section>

      {/* 2. Card Hover Effects */}
      <section className="animate-fade-in-up max-w-4xl mx-auto mb-16" style={{ animationDelay: '0.2s' }}>
        <h2 className="heading-md mb-8">🎴 Card Hover Effects</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-8 hover:shadow-2xl">
              <div className="w-full h-40 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg mb-4 overflow-hidden">
                <img 
                  src={`https://images.unsplash.com/photo-164${1000 + i}?w=400&h=300&fit=crop`}
                  alt={`Card ${i}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold mb-2">Card {i}</h3>
              <p className="text-sm text-gray-600">Hover to lift and elevate shadow</p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-900">
            <strong>Effects:</strong> translateY(-8px), shadow elevation 0 20px 48px, border color transition
          </p>
        </div>
      </section>

      {/* 3. Navigation Links */}
      <section className="animate-fade-in-up max-w-4xl mx-auto mb-16" style={{ animationDelay: '0.3s' }}>
        <h2 className="heading-md mb-8">🔗 Navigation Interactions</h2>
        
        <div className="card p-8">
          <nav className="flex gap-8 mb-8 pb-8 border-b">
            <a href="#home" className="nav-link active">Home</a>
            <a href="#about" className="nav-link">About</a>
            <a href="#services" className="nav-link">Services</a>
            <a href="#contact" className="nav-link">Contact</a>
          </nav>
          <p className="text-gray-600">
            Hover over links to see the smooth underline animation slide from left to right.
          </p>
        </div>

        <div className="mt-8 p-6 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-900">
            <strong>Effects:</strong> Underline slides 300ms, active state is persistent
          </p>
        </div>
      </section>

      {/* 4. Form Interactions */}
      <section className="animate-fade-in-up max-w-4xl mx-auto mb-16" style={{ animationDelay: '0.4s' }}>
        <h2 className="heading-md mb-8">📝 Form Interactions</h2>
        
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label htmlFor="email" className="block font-semibold mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border rounded-lg transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <p className="text-xs text-gray-500 mt-2">Focus to see the glow effect</p>
            </div>

            <div className="form-group">
              <label htmlFor="message" className="block font-semibold mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                placeholder="Your message here..."
                value={formData.message}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-4 py-3 border rounded-lg transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 resize-none"
              />
            </div>

            <button type="submit" className="btn btn-primary w-full">
              {submitted ? '✓ Sent!' : 'Send Message'}
            </button>
          </form>
        </div>

        <div className="mt-8 p-6 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-900">
            <strong>Effects:</strong> Focus glow (border + box-shadow), smooth placeholder transition, validation feedback
          </p>
        </div>
      </section>

      {/* 5. Scroll Animations */}
      <section className="animate-fade-in-up max-w-4xl mx-auto mb-16" style={{ animationDelay: '0.5s' }}>
        <h2 className="heading-md mb-8">📜 Scroll Animations</h2>
        
        <p className="text-gray-600 mb-8">
          Scroll down to see elements fade in and slide up as they enter the viewport
        </p>

        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="scroll-animate card p-8 bg-gradient-to-r from-blue-50 to-purple-50">
              <h3 className="font-semibold mb-2">Scroll Animation {i}</h3>
              <p className="text-gray-600">
                This element fades in with an upward motion when it enters the viewport. 
                The animation is triggered by the Intersection Observer API.
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-900">
            <strong>Effects:</strong> Intersection Observer triggers fade-in + slide up at 0.1 threshold
          </p>
        </div>
      </section>

      {/* 6. Loading States */}
      <section className="animate-fade-in-up max-w-4xl mx-auto mb-16" style={{ animationDelay: '0.6s' }}>
        <h2 className="heading-md mb-8">⏳ Loading States</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-8">
            <h3 className="font-semibold mb-4">Skeleton Loader</h3>
            <div className="space-y-3">
              <div className="skeleton h-4 rounded"></div>
              <div className="skeleton h-4 rounded w-5/6"></div>
              <div className="skeleton h-4 rounded w-4/6"></div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Shimmer animation repeats infinitely</p>
          </div>

          <div className="card p-8">
            <h3 className="font-semibold mb-4">Pulse Effect</h3>
            <div className="flex gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="pulse w-12 h-12 bg-blue-400 rounded-lg"></div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">Opacity fades in and out smoothly</p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-900">
            <strong>Effects:</strong> Skeleton uses shimmer gradient (2s infinite), Pulse uses opacity (2s infinite)
          </p>
        </div>
      </section>

      {/* 7. Transitions Timing */}
      <section className="animate-fade-in-up max-w-4xl mx-auto mb-16" style={{ animationDelay: '0.7s' }}>
        <h2 className="heading-md mb-8">⏱️ Transition Timing</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-8 text-center transition-fast hover:bg-blue-100">
            <h3 className="font-semibold mb-2">Fast</h3>
            <p className="text-sm text-gray-600">150ms transition</p>
          </div>

          <div className="card p-8 text-center transition-normal hover:bg-green-100">
            <h3 className="font-semibold mb-2">Normal</h3>
            <p className="text-sm text-gray-600">250ms transition</p>
          </div>

          <div className="card p-8 text-center transition-slow hover:bg-purple-100">
            <h3 className="font-semibold mb-2">Slow</h3>
            <p className="text-sm text-gray-600">350ms transition</p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-900">
            <strong>Easing:</strong> cubic-bezier(0.4, 0, 0.2, 1) - consistent across all animations
          </p>
        </div>
      </section>

      {/* Footer */}
      <section className="animate-fade-in-up max-w-4xl mx-auto text-center" style={{ animationDelay: '0.8s' }}>
        <div className="card p-12 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
          <h2 className="heading-md mb-4">Ready to Use!</h2>
          <p className="text-lg mb-6">
            All animations are ready to use in your components. 
            Just add the CSS classes and you're good to go.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="btn bg-white text-blue-600 hover:bg-gray-100">
              View Docs
            </button>
            <button className="btn btn-secondary">
              Get Started
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AnimationsShowcase;
