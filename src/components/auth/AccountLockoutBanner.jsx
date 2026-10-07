import React, { useState, useEffect } from 'react';
import { AlertOctagon } from 'lucide-react';

const AccountLockoutBanner = () => {
  // Typical lockout is 15 minutes. In a real app we'd parse the 'Retry-After' header 
  // or unlock_time from the API response. For this component, we simulate a 15-minute countdown.
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertOctagon className="h-5 w-5 text-red-600" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Account Locked</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>
              Due to multiple failed login attempts, your account has been temporarily locked for security reasons.
            </p>
          </div>
          {timeLeft > 0 ? (
            <div className="mt-4">
              <div className="text-sm font-medium text-red-800">
                Try again in: <span className="font-bold">{minutes}m {seconds < 10 ? `0${seconds}` : seconds}s</span>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <button 
                onClick={() => window.location.reload()}
                className="text-sm font-medium text-red-800 hover:text-red-900 underline"
              >
                Refresh page to try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountLockoutBanner;
