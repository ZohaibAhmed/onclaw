'use client';
import { useState, useEffect } from 'react';

const productNames = [
  'Revolutionary Apps',
  'Smart Solutions',
  'Digital Experiences',
  'Innovative Tools',
  'Future-Ready Products'
];

export default function GradientHero() {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typeSpeed, setTypeSpeed] = useState(150);

  useEffect(() => {
    const handleType = () => {
      const current = productNames[currentIndex];
      
      if (isDeleting) {
        setCurrentText(current.substring(0, currentText.length - 1));
        setTypeSpeed(75);
      } else {
        setCurrentText(current.substring(0, currentText.length + 1));
        setTypeSpeed(150);
      }

      if (!isDeleting && currentText === current) {
        setTimeout(() => setIsDeleting(true), 1500);
      } else if (isDeleting && currentText === '') {
        setIsDeleting(false);
        setCurrentIndex((prev) => (prev + 1) % productNames.length);
      }
    };

    const timer = setTimeout(handleType, typeSpeed);
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentIndex, typeSpeed]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-spin" style={{ animationDuration: '20s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 leading-tight">
          Building
          <br />
          <span className="bg-gradient-to-r from-yellow-400 via-white to-pink-300 bg-clip-text text-transparent">
            {currentText}
            <span className="animate-pulse">|</span>
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
          Transforming ideas into powerful digital solutions that drive growth and innovation
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <button className="px-8 py-4 bg-white text-purple-600 font-semibold rounded-full hover:bg-white/90 transition-all duration-300 transform hover:scale-105 shadow-2xl">
            Get Started
          </button>
          <button className="px-8 py-4 border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-purple-600 transition-all duration-300 transform hover:scale-105">
            View Portfolio
          </button>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full animate-bounce mt-2" />
        </div>
      </div>
    </section>
  );
}