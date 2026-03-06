'use client';

import { useState, useEffect } from 'react';

interface StockData {
  date: string;
  price: number;
}

// Simulated NVIDIA stock data for the last 6 months
const generateNvidiaData = (): StockData[] => {
  const data: StockData[] = [];
  const today = new Date();
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(today.getMonth() - 6);
  
  // Base price around $400-500 range with realistic fluctuations
  let currentPrice = 420;
  const days = Math.floor((today.getTime() - sixMonthsAgo.getTime()) / (1000 * 60 * 60 * 24));
  
  for (let i = 0; i <= days; i++) {
    const date = new Date(sixMonthsAgo);
    date.setDate(date.getDate() + i);
    
    // Add realistic price movement
    const volatility = (Math.random() - 0.5) * 20;
    const trend = (i / days) * 80; // Overall upward trend
    currentPrice = Math.max(300, currentPrice + volatility + (trend / days));
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(currentPrice * 100) / 100
    });
  }
  
  return data;
};

export default function NvidiaChart() {
  const [data, setData] = useState<StockData[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<StockData | null>(null);
  
  useEffect(() => {
    setData(generateNvidiaData());
  }, []);
  
  if (data.length === 0) return <div className="p-8">Loading chart...</div>;
  
  const maxPrice = Math.max(...data.map(d => d.price));
  const minPrice = Math.min(...data.map(d => d.price));
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1;
  const chartMax = maxPrice + padding;
  const chartMin = minPrice - padding;
  const chartRange = chartMax - chartMin;
  
  const chartWidth = 800;
  const chartHeight = 400;
  const margin = { top: 20, right: 40, bottom: 40, left: 60 };
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;
  
  const getX = (index: number) => (index / (data.length - 1)) * plotWidth + margin.left;
  const getY = (price: number) => plotHeight - ((price - chartMin) / chartRange) * plotHeight + margin.top;
  
  const pathData = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.price)}`).join(' ');
  
  const currentPrice = data[data.length - 1]?.price || 0;
  const startPrice = data[0]?.price || 0;
  const priceChange = currentPrice - startPrice;
  const percentChange = ((priceChange / startPrice) * 100);
  
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          NVIDIA Corporation (NVDA)
        </h2>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            ${currentPrice.toFixed(2)}
          </span>
          <span className={`px-2 py-1 rounded text-sm font-medium ${
            priceChange >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} ({percentChange.toFixed(1)}%)
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          Last 6 months
        </p>
      </div>
      
      <div className="relative">
        <svg 
          width={chartWidth} 
          height={chartHeight}
          className="overflow-visible"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = margin.top + ratio * plotHeight;
            const price = chartMax - (ratio * chartRange);
            return (
              <g key={ratio}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + plotWidth}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth={0.5}
                  className="dark:stroke-gray-700"
                />
                <text
                  x={margin.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-500 dark:fill-gray-400"
                >
                  ${price.toFixed(0)}
                </text>
              </g>
            );
          })}
          
          {/* Chart area gradient */}
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          
          {/* Area under curve */}
          <path
            d={`${pathData} L ${getX(data.length - 1)} ${margin.top + plotHeight} L ${margin.left} ${margin.top + plotHeight} Z`}
            fill="url(#priceGradient)"
          />
          
          {/* Price line */}
          <path
            d={pathData}
            fill="none"
            stroke="#10b981"
            strokeWidth={2}
            className="drop-shadow-sm"
          />
          
          {/* Data points */}
          {data.map((point, index) => {
            if (index % 7 !== 0 && index !== data.length - 1) return null; // Show every 7th point
            return (
              <circle
                key={index}
                cx={getX(index)}
                cy={getY(point.price)}
                r={4}
                fill="#10b981"
                stroke="white"
                strokeWidth={2}
                className="cursor-pointer hover:r-6 transition-all"
                onMouseEnter={() => setHoveredPoint(point)}
              />
            );
          })}
          
          {/* X-axis labels */}
          {[0, Math.floor(data.length * 0.2), Math.floor(data.length * 0.4), Math.floor(data.length * 0.6), Math.floor(data.length * 0.8), data.length - 1].map((index) => {
            const point = data[index];
            if (!point) return null;
            const date = new Date(point.date);
            const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return (
              <text
                key={index}
                x={getX(index)}
                y={chartHeight - 10}
                textAnchor="middle"
                className="text-xs fill-gray-500 dark:fill-gray-400"
              >
                {label}
              </text>
            );
          })}
        </svg>
        
        {/* Tooltip */}
        {hoveredPoint && (
          <div 
            className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg pointer-events-none z-10"
            style={{
              left: getX(data.indexOf(hoveredPoint)) - 50,
              top: getY(hoveredPoint.price) - 60
            }}
          >
            <div className="font-semibold">${hoveredPoint.price.toFixed(2)}</div>
            <div className="text-gray-300">
              {new Date(hoveredPoint.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <span>6 months ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}