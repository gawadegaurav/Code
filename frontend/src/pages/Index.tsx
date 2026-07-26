import { Link } from 'react-router-dom';
import { FiCode, FiUsers, FiVideo, FiArrowRight, FiZap, FiGlobe, FiLock, FiCpu } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function Index() {
  return (
    <div className="min-h-screen bg-cyber-dark text-cyber-text-primary overflow-hidden selection:bg-cyber-cyan selection:text-cyber-dark relative">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 bg-cyber-gradient opacity-90"></div>
      <div className="fixed inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
      <div className="fixed inset-0 z-0 scanlines opacity-30"></div>
      
      {/* Glow Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyber-purple/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyber-cyan/20 blur-[120px] pointer-events-none"></div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/5 glassmorphism sticky top-0 z-50">
          <div className="container mx-auto px-6 h-16 flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="relative flex items-center justify-center w-8 h-8 rounded bg-cyber-darker border border-cyber-cyan shadow-[0_0_10px_rgba(0,245,255,0.4)]">
                <FiCode className="w-5 h-5 text-cyber-cyan" />
              </div>
              <span className="text-xl font-bold tracking-widest text-white uppercase neon-text-cyan">Spark OS</span>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-6"
            >
              <Link to="/auth">
                <button className="text-sm font-medium text-cyber-text-secondary hover:text-cyber-cyan transition-colors uppercase tracking-wider">
                  Access Terminal
                </button>
              </Link>
              <Link to="/auth">
                <button className="btn-cyber-primary text-sm uppercase tracking-wider">
                  Initialize
                </button>
              </Link>
            </motion.div>
          </div>
        </header>

        {/* Hero */}
        <main className="container mx-auto px-6 py-24 md:py-32">
          <div className="max-w-5xl mx-auto text-center relative">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyber-pink/50 bg-cyber-pink/10 text-cyber-pink text-xs font-bold uppercase tracking-widest mb-8"
            >
              <div className="w-2 h-2 rounded-full bg-cyber-pink animate-pulse" />
              <span>System Online v2.0.77</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight uppercase leading-tight">
                Collaborative Coding <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan to-cyber-purple drop-shadow-[0_0_15px_rgba(0,245,255,0.5)]">
                  Beyond Reality
                </span>
              </h1>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-cyber-text-secondary mb-12 max-w-2xl mx-auto font-light"
            >
              Enter the next generation of developer workspaces. Real-time synchronization, AI augmentation, and holographic telepresence in one integrated environment.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center"
            >
              <Link to="/auth">
                <button className="btn-cyber h-12 px-8 text-base flex items-center justify-center gap-3 w-full sm:w-auto">
                  Jack In <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap justify-center gap-8 mt-16 text-cyber-cyan text-sm uppercase tracking-widest font-bold"
            >
              <div className="flex items-center gap-2">
                <FiZap className="text-cyber-lime" /> Zero Latency
              </div>
              <div className="flex items-center gap-2">
                <FiCpu className="text-cyber-purple" /> Neural AI
              </div>
              <div className="flex items-center gap-2">
                <FiLock className="text-cyber-pink" /> Quantum Secure
              </div>
            </motion.div>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-32 max-w-6xl mx-auto">
            {[
              {
                icon: FiCode,
                title: 'Cyber Workspace',
                desc: 'Conflict-free synchronization in a dark synthwave Monaco editor interface.',
                color: 'text-cyber-cyan',
                borderColor: 'border-cyber-cyan/30',
                glow: 'group-hover:shadow-[0_0_30px_rgba(0,245,255,0.2)]',
              },
              {
                icon: FiCpu,
                title: 'AI Neural Net',
                desc: 'Advanced algorithmic assistance and automated code generation via holographic UI.',
                color: 'text-cyber-purple',
                borderColor: 'border-cyber-purple/30',
                glow: 'group-hover:shadow-[0_0_30px_rgba(176,38,255,0.2)]',
              },
              {
                icon: FiVideo,
                title: 'Holo-Conference',
                desc: 'High-fidelity audio-visual communication arrays with real-time HUD overlays.',
                color: 'text-cyber-pink',
                borderColor: 'border-cyber-pink/30',
                glow: 'group-hover:shadow-[0_0_30px_rgba(255,0,140,0.2)]',
              },
            ].map((feature, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                key={feature.title} 
                className={`group relative p-8 glassmorphism border ${feature.borderColor} rounded-xl transition-all duration-500 hover:-translate-y-2 ${feature.glow}`}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                <div className={`w-14 h-14 rounded-lg bg-cyber-dark border ${feature.borderColor} flex items-center justify-center mb-6 relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-wide">{feature.title}</h3>
                <p className="text-cyber-text-secondary leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 py-8 mt-20 glassmorphism relative z-10">
          <div className="container mx-auto text-center">
            <p className="text-cyber-text-muted text-xs uppercase tracking-widest font-bold">
              © 2077 Spark OS Neural Network · Access Granted
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
