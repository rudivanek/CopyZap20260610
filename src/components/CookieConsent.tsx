import React, { useState, useEffect } from 'react';
import { Cookie, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const CookieConsent: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Check if user has already given consent
  useEffect(() => {
    const consent = getCookieConsent();

    if (consent === null) {
      // No consent decision yet, show banner after a brief delay
      const timer = setTimeout(() => {
        setShowBanner(true);
        // Add animation delay
        setTimeout(() => setIsVisible(true), 100);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (consent === true) {
      // User previously accepted, grant analytics consent
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('consent', 'update', {
          'analytics_storage': 'granted'
        });
      }
    }
  }, []);

  // Get cookie consent from localStorage
  const getCookieConsent = (): boolean | null => {
    try {
      const consent = localStorage.getItem('copyZap_cookieConsent');
      if (consent === null) return null;
      return consent === 'accepted';
    } catch (error) {
      console.error('Error reading cookie consent:', error);
      return null;
    }
  };

  // Set cookie consent
  const setCookieConsent = (accepted: boolean): void => {
    try {
      localStorage.setItem('copyZap_cookieConsent', accepted ? 'accepted' : 'declined');
      localStorage.setItem('copyZap_cookieConsentDate', new Date().toISOString());
      
      // Set a cookie as well for server-side detection if needed
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year expiry
      
      document.cookie = `cookieConsent=${accepted ? 'accepted' : 'declined'}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
    } catch (error) {
      console.error('Error setting cookie consent:', error);
    }
  };

  // Handle accept
  const handleAccept = () => {
    setCookieConsent(true);

    // Update Google consent mode to allow analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
    }

    hideBanner();
  };

  // Handle decline
  const handleDecline = () => {
    setCookieConsent(false);

    // Keep Google consent denied (already set in default)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'analytics_storage': 'denied'
      });
    }

    hideBanner();
  };

  // Hide banner with animation
  const hideBanner = () => {
    setIsVisible(false);
    setTimeout(() => setShowBanner(false), 300);
  };

  // Don't render if banner shouldn't be shown
  if (!showBanner) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 transform transition-all duration-300 ease-in-out ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
    }`}>
      <div className="bg-white dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Cookie icon and text */}
            <div className="flex items-start space-x-3 flex-1">
              <Cookie size={24} className="text-primary-500 mt-1 flex-shrink-0" />
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <p className="mb-2">
                  <strong>We use cookies to enhance your experience.</strong>
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  This website uses essential cookies for authentication and preferences. 
                  We do not use advertising or tracking cookies. By continuing to use this site, 
                  you consent to our use of essential cookies.{' '}
                  <Link 
                    to="/privacy" 
                    className="text-primary-500 hover:text-primary-400 underline inline-flex items-center"
                    onClick={hideBanner}
                  >
                    Learn more in our Privacy Policy
                    <ExternalLink size={12} className="ml-1" />
                  </Link>
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <button
                onClick={handleDecline}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md transition-colors duration-200"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="px-6 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white rounded-md transition-colors duration-200"
              >
                Accept All Cookies
              </button>
              <button
                onClick={hideBanner}
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
                aria-label="Close cookie banner"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Utility functions for other components to check consent
export const getCookieConsent = (): boolean | null => {
  try {
    const consent = localStorage.getItem('copyZap_cookieConsent');
    if (consent === null) return null;
    return consent === 'accepted';
  } catch (error) {
    console.error('Error reading cookie consent:', error);
    return null;
  }
};

export const hasCookieConsent = (): boolean => {
  return getCookieConsent() !== null;
};

export default CookieConsent;