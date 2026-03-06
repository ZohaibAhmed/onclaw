'use client';

import { useState, useEffect } from 'react';

export default function LiveClockWidget() {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatTime = () => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = () => {
    return time.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGreetingIcon = () => {
    const hour = time.getHours();
    if (hour < 12) return '🌅';
    if (hour < 17) return '☀️';
    return '🌙';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-lg font-medium text-gray-700 dark:text-gray-300">
          <span className="text-2xl">{getGreetingIcon()}</span>
          <span>{getGreeting()}</span>
        </div>
        
        <div className="space-y-2">
          <div className="text-3xl font-bold text-gray-900 dark:text-white font-mono">
            {formatTime()}
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate()}
          </div>
        </div>
        
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-20"></div>
      </div>
    </div>
  );
}