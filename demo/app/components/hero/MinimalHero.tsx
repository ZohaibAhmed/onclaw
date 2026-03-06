export default function MinimalHero() {
  return (
    <section className="bg-gray-900 min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 tracking-tight">
          Welcome
        </h1>
        <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200">
          Get Started
        </button>
      </div>
    </section>
  );
}