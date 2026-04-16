import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Code2, Users, Video, Sparkles, ArrowRight, Zap, Globe, Lock } from 'lucide-react';

export default function Index() {
  return (
    <div className="min-h-screen relative overflow-hidden aurora-bg mesh-grid" style={{ background: 'hsl(250, 35%, 4%)' }}>

      {/* Animated Aurora Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-violet w-[700px] h-[700px] top-[-200px] left-[-100px] animate-orb-1" style={{ opacity: 0.15 }} />
        <div className="orb orb-cyan w-[600px] h-[600px] bottom-[-150px] right-[-100px] animate-orb-2" style={{ opacity: 0.12 }} />
        <div className="orb orb-pink w-[400px] h-[400px] top-[40%] left-[55%] animate-orb-3" style={{ opacity: 0.08 }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5" style={{ background: 'hsl(250 35% 4% / 0.6)', backdropFilter: 'blur(20px)' }}>
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, hsl(263 75% 60% / 0.2), hsl(188 85% 45% / 0.2))', border: '1px solid hsl(263 75% 60% / 0.25)' }}>
              <Code2 className="w-5 h-5" style={{ color: '#a78bfa' }} />
            </div>
            <span className="text-xl font-bold font-display text-aurora">CodeCollab</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/auth">
              <button className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
                Sign In
              </button>
            </Link>
            <Link to="/auth">
              <button className="btn-glow relative z-10 text-white font-semibold text-sm px-5 py-2 rounded-xl">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 container mx-auto px-6 py-24 md:py-36">
        <div className="max-w-5xl mx-auto text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 animate-fade-in badge-glow"
            style={{ background: 'hsl(263 75% 60% / 0.1)', border: '1px solid hsl(263 75% 60% / 0.3)', animationDelay: '0s' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#a78bfa' }} />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#a78bfa' }}>Real-Time Collaboration</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black font-display mb-6 leading-[1.05] tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="text-white">Code Together,</span>
            <br />
            <span className="text-aurora">Ship Faster.</span>
          </h1>

          <p className="text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ color: 'hsl(220 15% 60%)', animationDelay: '0.2s' }}>
            A powerful real-time coding environment with AI assistance, video conferencing, shared whiteboard, and instant chat — built for modern dev teams.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link to="/auth">
              <button className="btn-glow relative z-10 text-white font-bold text-base px-8 py-4 rounded-2xl flex items-center gap-2.5 shadow-2xl" style={{ boxShadow: '0 0 40px hsl(263 75% 60% / 0.4), 0 20px 60px hsl(250 35% 2% / 0.5)' }}>
                Start Collaborating <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link to="/auth">
              <button className="text-white font-semibold text-base px-8 py-4 rounded-2xl transition-all duration-300 hover:bg-white/5"
                style={{ border: '1px solid hsl(248 25% 20%)' }}>
                Join a Room
              </button>
            </Link>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap justify-center gap-8 mt-14 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {[
              { icon: Zap, label: 'Sub-100ms sync' },
              { icon: Globe, label: '10+ Languages' },
              { icon: Lock, label: 'End-to-end encrypted' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 text-sm" style={{ color: 'hsl(220 15% 50%)' }}>
                <stat.icon className="w-4 h-4" style={{ color: '#38bdf8' }} />
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-28 max-w-6xl mx-auto">
          {[
            {
              icon: Code2,
              title: 'Live Coding',
              desc: 'Real-time collaborative editor with conflict-free sync',
              color: '#a78bfa',
              glow: 'hsl(263 75% 60% / 0.15)',
              delay: '0.5s',
            },
            {
              icon: Video,
              title: 'Video Calls',
              desc: 'Built-in high-quality video conferencing rooms',
              color: '#38bdf8',
              glow: 'hsl(188 85% 45% / 0.15)',
              delay: '0.6s',
            },
            {
              icon: Users,
              title: 'Team Chat',
              desc: 'Instant messaging to coordinate in real-time',
              color: '#34d399',
              glow: 'hsl(160 60% 45% / 0.15)',
              delay: '0.7s',
            },
            {
              icon: Sparkles,
              title: 'AI Assistant',
              desc: 'Context-aware AI for instant coding help',
              color: '#f472b6',
              glow: 'hsl(330 80% 60% / 0.15)',
              delay: '0.8s',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group p-7 rounded-3xl animate-fade-in cursor-default transition-all duration-500 hover:-translate-y-1"
              style={{
                background: 'hsl(248 30% 7% / 0.7)',
                border: '1px solid hsl(248 25% 15% / 0.8)',
                backdropFilter: 'blur(20px)',
                animationDelay: feature.delay,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = feature.color + '55';
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 30px ${feature.glow}`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'hsl(248 25% 15% / 0.8)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              <div className="mb-5 p-3.5 rounded-2xl w-fit transition-transform duration-500 group-hover:scale-110"
                style={{ background: feature.color + '18', border: `1px solid ${feature.color}30` }}>
                <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
              </div>
              <h3 className="font-bold text-base font-display mb-2 text-white">{feature.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'hsl(220 15% 55%)' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t py-8 text-center" style={{ borderColor: 'hsl(248 25% 12%)', color: 'hsl(220 15% 40%)' }}>
        <p className="text-sm">© 2025 CodeCollab · Built for developers, by developers.</p>
      </footer>
    </div>
  );
}
