import React, { useState, useEffect } from 'react';
import { X, Users } from 'lucide-react';
import { useLanguage } from '../utils/i18n';

const STORAGE_KEY = 'fb_group_popup_shown';
const FACEBOOK_GROUP_URL = 'https://www.facebook.com/share/g/1GCDRidxur/';

import arTranslations from '../locales/ar.json';

export const FacebookGroupPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  // Always use Arabic translations
  const t = (key: string) => {
    const keys = key.split('.');
    let result: any = arTranslations;
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        return key;
      }
    }
    return result;
  };
  const language = 'ar';

  useEffect(() => {
    // Check if popup has been shown before
    const hasSeenPopup = localStorage.getItem(STORAGE_KEY);
    // Show popup to new guests after a short delay
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, 2000); // Show after 2 seconds
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      // Mark as shown so it doesn't appear again
      localStorage.setItem(STORAGE_KEY, 'true');
    }, 300);
  };

  const handleJoinGroup = () => {
    // Mark as shown
    localStorage.setItem(STORAGE_KEY, 'true');
    // Open Facebook group in new tab
    window.open(FACEBOOK_GROUP_URL, '_blank', 'noopener,noreferrer');
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className={`fixed inset-0 bg-black z-50 transition-opacity duration-300 ${
          isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Popup */}
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none`}
        dir="rtl"
      >
        <div 
          className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto transform transition-all duration-300 ${
            isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Content */}
          <div className="p-8 pt-10 text-center">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Users className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3" dangerouslySetInnerHTML={{__html: t('facebookGroup.title')}} />

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg" dangerouslySetInnerHTML={{__html: t('facebookGroup.description')}} />

            {/* Benefits list */}
            <ul className="text-left mb-8 space-y-2">
              {Array.isArray(t('facebookGroup.benefits'))
                ? (t('facebookGroup.benefits') as string[]).map((benefit, idx) => (
                    <li key={idx} className="flex items-start text-gray-700 dark:text-gray-300">
                      <span className="mr-2 text-green-500">✓</span>
                      <span>{benefit}</span>
                    </li>
                  ))
                : null}
            </ul>

            {/* CTA Button */}
            <button
              onClick={handleJoinGroup}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg mb-3"
            >
              {t('facebookGroup.cta')}
            </button>

            {/* Skip button */}
            <button
              onClick={handleClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm transition-colors"
            >
              {t('facebookGroup.skip')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
