'use client';
import Link from 'next/link';

export default function AnalyticsButton() {
  return (
    <Link 
      href="/analytics"
      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
    >
      Analytics
    </Link>
  );
}