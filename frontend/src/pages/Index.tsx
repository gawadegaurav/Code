import { Link } from 'react-router-dom';
import { FiCode, FiUsers, FiVideo, FiArrowRight, FiZap, FiGlobe, FiLock } from 'react-icons/fi';

export default function Index() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white transition-all sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiCode className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold tracking-tight text-slate-900">CodeCollab</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/auth">
              <button className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2">
                Sign In
              </button>
            </Link>
            <Link to="/auth">
              <button className="bg-blue-600 text-white text-sm font-semibold px-5 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-6">
            <FiZap className="w-3 h-3" />
            <span>Real-Time Collaboration</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
            Code Together. Clear & Simple.
          </h1>

          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
            A real-time coding environment for modern teams. Collaborate on code, video call, and chat in one clean space.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <button className="bg-blue-600 text-white font-bold px-8 py-3 rounded-md flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
                Start Collaborating <FiArrowRight />
              </button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-8 mt-12 text-slate-500 text-sm">
            <div className="flex items-center gap-2">
              <FiZap className="text-blue-500" /> Sub-100ms sync
            </div>
            <div className="flex items-center gap-2">
              <FiGlobe className="text-blue-500" /> 10+ Languages
            </div>
            <div className="flex items-center gap-2">
              <FiLock className="text-blue-500" /> Encrypted
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
          {[
            {
              icon: FiCode,
              title: 'Live Coding',
              desc: 'Real-time collaborative editor with conflict-free synchronization.',
              color: 'text-blue-600',
              bg: 'bg-blue-50',
            },
            {
              icon: FiVideo,
              title: 'Video Calls',
              desc: 'Built-in high-quality video conferencing for clear communication.',
              color: 'text-indigo-600',
              bg: 'bg-indigo-50',
            },
            {
              icon: FiUsers,
              title: 'Team Chat',
              desc: 'Instant messaging to coordinate with your team in real-time.',
              color: 'text-green-600',
              bg: 'bg-green-50',
            },
          ].map((feature) => (
            <div key={feature.title} className="p-8 border rounded-xl hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-lg ${feature.bg} flex items-center justify-center mb-6`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 text-center text-slate-500 text-sm">
        <p>© 2025 CodeCollab · Dev collaboration made simple.</p>
      </footer>
    </div>
  );
}
