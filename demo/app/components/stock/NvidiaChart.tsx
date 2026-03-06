'use client';
import { useState, useEffect } from 'react';

interface DataPoint {
  date: string;
  price: number;
}

export default function NvidiaChart() {
  const [data] = useState<DataPoint[]>([
    { date: '2024-06-01', price: 118.50 },
    { date: '2024-06-15', price: 135.25 },
    { date: '2024-07-01', price: 125.80 },
    { date: '2024-07-15', price: 142.30 },
    { date: '2024-08-01', price: 155.75 },
    { date: '2024-08-15', price: 148.90 },
    { date: '2024-09-01', price: 162.40 },
    { date: '2024-09-15', price: 178.20 },
    { date: '2024-10-01', price: 185.60 },
    { date: '2024-10-15', price: 172.30 },
    { date: '2024-11-01', price: 195.80 },
    { date: '2024-11-15', price: 203.45 },
    { date: '2024-12-01', price: 218.90 }
  ]);

  const maxPrice = Math.max(...data.map(d => d.price));
  const minPrice = Math.min(...data.map(d => d.price));
  const priceRange = maxPrice - minPrice;
  const chartWidth = 800;
  const chartHeight = 400;
  const padding = 60;

  const getX = (index: number) => padding + (index / (data.length - 1)) * (chartWidth - 2 * padding);
  const getY = (price: number) => padding + ((maxPrice - price) / priceRange) * (chartHeight - 2 * padding);

  const pathData = data
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${getX(index)} ${getY(point.price)}`)
    .join(' ');

  const currentPrice = data[data.length - 1].price;
  const firstPrice = data[0].price;
  const change = currentPrice - firstPrice;
  const changePercent = ((change / firstPrice) * 100).toFixed(2);

  return (
    <div className="bg-gray-900 p-6 rounded-lg">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white mb-2">NVIDIA Corporation (NVDA)</h2>
        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold text-green-400">${currentPrice.toFixed(2)}</span>
          <span className={`text-lg ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? '+' : ''}${change.toFixed(2)} ({change >= 0 ? '+' : ''}{changePercent}%)
          </span>
        </div>
        <p className="text-gray-400 text-sm">Last 6 months</p>
      </div>
      
      <div className="relative">
        <svg width={chartWidth} height={chartHeight} className="w-full h-auto">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="50" height="40" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Price line */}
          <path
            d={pathData}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {data.map((point, index) => (
            <circle
              key={index}
              cx={getX(index)}
              cy={getY(point.price)}
              r="4"
              fill="#10b981"
              className="hover:r-6 transition-all cursor-pointer"
            />
          ))}
          
          {/* Y-axis labels */}
          {[minPrice, (minPrice + maxPrice) / 2, maxPrice].map((price, index) => (
            <g key={index}>
              <text
                x={padding - 10}
                y={getY(price) + 5}
                textAnchor="end"
                className="text-xs fill-gray-400"
              >
                ${price.toFixed(0)}
              </text>
            </g>
          ))}
          
          {/* X-axis labels */}
          {data.filter((_, index) => index % 3 === 0).map((point, index) => (
            <text
              key={index}
              x={getX(index * 3)}
              y={chartHeight - 20}
              textAnchor="middle"
              className="text-xs fill-gray-400"
            >
              {new Date(point.date).toLocaleDateString('en-US', { month: 'short' })}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}