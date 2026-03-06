'use client';
import { useState, useEffect } from 'react';

const motivationalQuotes = [
  "The only way to do great work is to love what you do. - Steve Jobs",
  "Innovation distinguishes between a leader and a follower. - Steve Jobs",
  "Life is what happens to you while you're busy making other plans. - John Lennon",
  "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
  "It is during our darkest moments that we must focus to see the light. - Aristotle",
  "The only impossible journey is the one you never begin. - Tony Robbins",
  "In the end, we will remember not the words of our enemies, but the silence of our friends. - Martin Luther King Jr.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
  "The only limit to our realization of tomorrow will be our doubts of today. - Franklin D. Roosevelt",
  "Believe you can and you're halfway there. - Theodore Roosevelt"
];

export default function LiveClock() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [quote, setQuote] = useState('');

  useEffect(() => {
    // Set initial quote
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setQuote(randomQuote);

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Change quote every 30 seconds
    const quoteTimer = setInterval(() => {
      const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
      setQuote(randomQuote);
    }, 30000);

    return () => {
      clearInterval(timer);
      clearInterval(quoteTimer);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="text-center mb-6">
        <div className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400 mb-2">
          {formatTime(currentTime)}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(currentTime)}
        </div>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Daily Inspiration
        </div>
        <blockquote className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">
          {quote}
        </blockquote>
      </div>
    </div>
  );
}