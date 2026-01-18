import React from 'react';

interface ExitIntentPopupProps {
  onClose: () => void;
  onSignup: () => void;
}

// Arabic message: احصل على 3 فيديوهات UGC مجانية الآن!
const ExitIntentPopup: React.FC<ExitIntentPopupProps> = ({ onClose, onSignup }) => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-xs w-full text-center relative border-2 border-indigo-500">
      <button
        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xl font-bold"
        onClick={onClose}
        aria-label="إغلاق"
      >
        ×
      </button>
      <h2 className="text-2xl font-black text-indigo-700 mb-4">احصل على 3 فيديوهات UGC مجانية الآن!</h2>
      <p className="text-gray-700 mb-6 text-lg font-semibold">جرب الذكاء الاصطناعي لصناعة فيديوهات UGC مجانًا عند التسجيل.</p>
      <button
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-all mb-2"
        onClick={onSignup}
      >
        سجل الآن مجانًا
      </button>
    </div>
  </div>
);

export default ExitIntentPopup;
