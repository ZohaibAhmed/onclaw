'use client';
import { useState } from 'react';

const colors = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Gray', value: '#6b7280' },
];

export default function ColorPicker() {
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [showPalette, setShowPalette] = useState(false);

  return (
    <div className="mt-8 flex flex-col items-center space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Choose Your Color</h3>
      
      <div className="relative">
        <button
          onClick={() => setShowPalette(!showPalette)}
          className="flex items-center space-x-3 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div 
            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: selectedColor.value }}
          />
          <span className="text-gray-700 font-medium">{selectedColor.name}</span>
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform ${showPalette ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showPalette && (
          <div className="absolute top-full mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <div className="grid grid-cols-4 gap-2">
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => {
                    setSelectedColor(color);
                    setShowPalette(false);
                  }}
                  className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                    selectedColor.value === color.value 
                      ? 'border-gray-800 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div 
        className="w-full max-w-md h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center transition-colors"
        style={{ backgroundColor: selectedColor.value + '20' }}
      >
        <span className="text-gray-600">Preview Area</span>
      </div>
    </div>
  );
}