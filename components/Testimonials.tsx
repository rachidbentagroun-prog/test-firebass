
import React from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { Testimonial } from '../types';

interface TestimonialsProps {
  items: Testimonial[];
}

export const Testimonials: React.FC<TestimonialsProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="py-24 bg-dark-900 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">What Creators Say</h2>
          <p className="text-gray-400">Join thousands of artists creating with ImaginAI.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item) => (
            <div key={item.id} className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/10 transition-colors">
              <div className="flex gap-1 text-yellow-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < item.rating ? 'fill-yellow-500' : 'text-gray-600'}`} />
                ))}
              </div>
              <p className="text-gray-300 italic mb-6">"{item.content}"</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-white font-medium">{item.name}</h4>
                  <p className="text-sm text-indigo-400">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
