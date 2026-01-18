import React from 'react';
import { FaFacebookF } from 'react-icons/fa';

const FACEBOOK_GROUP_URL = 'https://www.facebook.com/share/g/1CybmU7iYD/';

export const FacebookGroupFloatingButton: React.FC = () => (
  <a
    href={FACEBOOK_GROUP_URL}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Join our Facebook Group"
    className="fixed z-[9999] bottom-36 right-6 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg flex items-center justify-center transition-all duration-200 group"
    style={{ boxShadow: '0 4px 24px rgba(59, 130, 246, 0.25)' }}
  >
    <FaFacebookF className="text-white text-2xl" />
  </a>
);
export default FacebookGroupFloatingButton;
