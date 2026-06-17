import React, { useState, useEffect } from 'react';

const OfflineBanner = () => {
  // Check the internet status when the app first loads
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Listen for the exact moment the internet drops or returns
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // If we have internet, don't show the banner at all!
  if (!isOffline) return null;

  // If we are offline, show this beautiful red warning banner
  return (
    <div className="bg-red-600 text-white text-center py-2 px-4 sticky top-0 z-50 shadow-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
      </svg>
      <span>You are offline. Don't worry, any notes you create will be safely stored and synced later!</span>
    </div>
  );
};

export default OfflineBanner;