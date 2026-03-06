export default function FutureHero() {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center px-6 py-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
        <div className="absolute top-40 right-1/3 w-1 h-1 bg-purple-400 rounded-full animate-ping" />
        <div className="absolute bottom-32 left-1/3 w-3 h-3 bg-indigo-400 rounded-full animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
      </div>

      <div className="relative z-10 text-center max-w-5xl mx-auto">
        {/* Main heading with gradient */}
        <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
          <span className="bg-gradient-to-r from-purple-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent animate-pulse">
            Welcome to the
          </span>
          <br />
          <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Future
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
          Experience next-generation AI-powered customization that adapts to your unique vision.
          Transform your digital presence with intelligent design that evolves with you.
        </p>

        {/* Glowing CTA button */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full blur-lg opacity-75 animate-pulse" />
          <button className="relative px-12 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-lg rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border-2 border-white/20">
            <span className="flex items-center gap-3">
              Start Your Journey
              <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
        </div>

        {/* Floating indicators */}
        <div className="mt-16 flex justify-center gap-8 opacity-60">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-2 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">AI-Powered</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-2 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">Personalized</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center mb-2 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">Lightning Fast</p>
          </div>
        </div>
      </div>
    </section>
  );
}