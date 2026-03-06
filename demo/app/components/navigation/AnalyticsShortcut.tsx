'use client';
import Link from 'next/link';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsShortcut() {
  return (
    <Link 
      href="/analytics"
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200 shadow-sm"
    >
      <BarChart3 className="w-4 h-4" />
      Analytics
    </Link>
  );
}