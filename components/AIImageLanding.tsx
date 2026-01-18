import React from 'react';
import { User } from '../types';

interface AIImageLandingProps {
  user: User | null;
  onStartCreating: () => void;
  onLoginClick: () => void;
  hasApiKey: boolean;
  onSelectKey: () => void;
  onResetKey: () => void;
}

export const AIImageLanding: React.FC<AIImageLandingProps> = ({ user, onStartCreating, onLoginClick }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      <h1 className="text-3xl font-bold mb-4">AI Image Landing Page</h1>
      <p className="mb-6">Welcome to the AI Image Lab. Generate stunning images with a single prompt.</p>
      <button className="btn-primary" onClick={user ? onStartCreating : onLoginClick}>
        {user ? 'Start Creating' : 'Login to Start'}
      </button>
    </div>
  );
};