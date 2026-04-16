import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Code2, Users, Zap, Mail, Lock, User, ArrowRight, Sparkles, Globe } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '' });
  const { signIn, signUp, signOut } = useAuth();
  const navigate = useNavigate();

  // Always clear any previous session when landing on /auth
  // so the user is never auto-redirected to the old dashboard.
  useEffect(() => {
    signOut();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse(loginData);
    if (!result.success) { toast.error(result.error.errors[0].message); return; }
    setIsLoading(true);
    const { error } = await signIn(loginData.email, loginData.password);
    setIsLoading(false);
    if (error) {
      toast.error(typeof error === 'string' ? error : 'Login failed');
    } else {
      toast.success('Welcome back!');
      navigate('/dashboard');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = signupSchema.safeParse(signupData);
    if (!result.success) { toast.error(result.error.errors[0].message); return; }
    setIsLoading(true);
    const { error } = await signUp(signupData.name, signupData.email, signupData.password);
    setIsLoading(false);
    if (error) {
      toast.error(typeof error === 'string' ? error : 'Signup failed');
    } else {
      toast.success('Account created! Please sign in.');
      setLoginData(prev => ({ ...prev, email: signupData.email }));
      setActiveTab('login');
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'hsl(250, 35%, 4%)' }}>

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden aurora-bg">
        {/* Floating orbs */}
        <div className="orb orb-violet w-[500px] h-[500px] top-[-100px] left-[-150px] animate-orb-1" style={{ opacity: 0.2 }} />
        <div className="orb orb-cyan w-[400px] h-[400px] bottom-[-80px] right-[-80px] animate-orb-2" style={{ opacity: 0.18 }} />
        <div className="orb orb-pink w-[300px] h-[300px] top-[50%] left-[40%] animate-orb-3" style={{ opacity: 0.1 }} />

        {/* Mesh overlay */}
        <div className="absolute inset-0 mesh-grid opacity-40" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-14 xl:px-20 w-full">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-14">
            <div className="p-3.5 rounded-2xl" style={{ background: 'linear-gradient(135deg, hsl(263 75% 60% / 0.25), hsl(188 85% 45% / 0.15))', border: '1px solid hsl(263 75% 60% / 0.3)' }}>
              <Code2 className="w-8 h-8" style={{ color: '#a78bfa' }} />
            </div>
            <span className="text-4xl font-black font-display text-aurora">CodeCollab</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl xl:text-6xl font-black font-display mb-6 leading-[1.1] text-white">
            Where teams<br />
            <span className="text-aurora">code as one.</span>
          </h1>
          <p className="text-base mb-12 leading-relaxed max-w-sm" style={{ color: 'hsl(220 15% 55%)' }}>
            Real-time collaboration, AI-powered assistance, and seamless communication — all in one place.
          </p>

          {/* Feature list */}
          <div className="space-y-4 max-w-sm">
            {[
              { icon: Code2, title: 'Live Code Editor', desc: 'Conflict-free real-time collaboration', color: '#a78bfa' },
              { icon: Users, title: 'Presence System', desc: 'See your teammates as they type', color: '#38bdf8' },
              { icon: Sparkles, title: 'AI Assistant', desc: 'Context-aware help when you need it', color: '#f472b6' },
              { icon: Globe, title: 'Multi-Language', desc: 'Run code in 10+ languages instantly', color: '#34d399' },
            ].map((f) => (
              <div key={f.title} className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:translate-x-1"
                style={{ background: 'hsl(248 30% 8% / 0.5)', border: '1px solid hsl(248 25% 16% / 0.6)' }}>
                <div className="p-2.5 rounded-xl shrink-0" style={{ background: f.color + '18', border: `1px solid ${f.color}30` }}>
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{f.title}</p>
                  <p className="text-xs" style={{ color: 'hsl(220 15% 50%)' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right auth form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {/* subtle bg glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="orb orb-violet w-[400px] h-[400px] top-[-100px] right-[-100px] animate-orb-2" style={{ opacity: 0.07 }} />
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-3 lg:hidden mb-4">
            <div className="p-2.5 rounded-xl" style={{ background: 'hsl(263 75% 60% / 0.2)', border: '1px solid hsl(263 75% 60% / 0.3)' }}>
              <Code2 className="w-6 h-6" style={{ color: '#a78bfa' }} />
            </div>
            <span className="text-2xl font-black font-display text-aurora">CodeCollab</span>
          </div>

          <Card className="relative overflow-hidden" style={{
            background: 'hsl(248 30% 7% / 0.9)',
            backdropFilter: 'blur(30px)',
            border: '1px solid hsl(248 25% 16%)',
            borderRadius: '1.75rem',
            boxShadow: '0 0 0 1px hsl(263 75% 60% / 0.06), 0 40px 80px hsl(250 35% 2% / 0.6)',
          }}>
            {/* Top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, hsl(263 75% 60% / 0.5), hsl(188 85% 45% / 0.5), transparent)' }} />

            <CardHeader className="px-8 pt-8 pb-0">
              <CardTitle className="text-3xl font-black font-display text-white">
                {activeTab === 'login' ? 'Welcome back' : 'Join CodeCollab'}
              </CardTitle>
              <CardDescription style={{ color: 'hsl(220 15% 55%)' }}>
                {activeTab === 'login' ? 'Sign in to your workspace.' : 'Create your free account today.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pt-6 pb-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-7 p-1 rounded-2xl h-12"
                  style={{ background: 'hsl(248 30% 5%)', border: '1px solid hsl(248 25% 14%)' }}>
                  <TabsTrigger value="login"
                    className="rounded-xl font-semibold text-sm transition-all duration-300 data-[state=active]:text-white"
                    style={{ '--tw-text-opacity': '1' } as React.CSSProperties}
                    data-signin-tab>
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup"
                    className="rounded-xl font-semibold text-sm transition-all duration-300 data-[state=active]:text-white">
                    Create Account
                  </TabsTrigger>
                </TabsList>

                {/* Login */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(220 15% 55%)' }}>Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(220 15% 45%)' }} />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          className="pl-11 h-12 rounded-xl text-white placeholder:text-slate-700 transition-all duration-300"
                          style={{ background: 'hsl(248 30% 5%)', border: '1px solid hsl(248 25% 16%)' }}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(220 15% 55%)' }}>Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(220 15% 45%)' }} />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className="pl-11 h-12 rounded-xl text-white placeholder:text-slate-700 transition-all duration-300"
                          style={{ background: 'hsl(248 30% 5%)', border: '1px solid hsl(248 25% 16%)' }}
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-glow w-full text-white font-bold text-sm h-12 rounded-xl flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
                      style={{ boxShadow: '0 0 30px hsl(263 75% 60% / 0.3)' }}
                    >
                      {isLoading ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
                      ) : (
                        <>Sign In <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </form>
                </TabsContent>

                {/* Signup */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(220 15% 55%)' }}>Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(220 15% 45%)' }} />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="John Doe"
                          value={signupData.name}
                          onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                          className="pl-11 h-12 rounded-xl text-white placeholder:text-slate-700 transition-all duration-300"
                          style={{ background: 'hsl(248 30% 5%)', border: '1px solid hsl(248 25% 16%)' }}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(220 15% 55%)' }}>Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(220 15% 45%)' }} />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={signupData.email}
                          onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                          className="pl-11 h-12 rounded-xl text-white placeholder:text-slate-700 transition-all duration-300"
                          style={{ background: 'hsl(248 30% 5%)', border: '1px solid hsl(248 25% 16%)' }}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(220 15% 55%)' }}>Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(220 15% 45%)' }} />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Min. 6 characters"
                          value={signupData.password}
                          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          className="pl-11 h-12 rounded-xl text-white placeholder:text-slate-700 transition-all duration-300"
                          style={{ background: 'hsl(248 30% 5%)', border: '1px solid hsl(248 25% 16%)' }}
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-glow w-full text-white font-bold text-sm h-12 rounded-xl flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
                      style={{ boxShadow: '0 0 30px hsl(263 75% 60% / 0.3)' }}
                    >
                      {isLoading ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...</>
                      ) : (
                        <>Create Account <Zap className="w-4 h-4" /></>
                      )}
                    </button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-xs" style={{ color: 'hsl(220 15% 40%)' }}>
            By continuing, you agree to our <span className="underline cursor-pointer hover:text-white/60 transition-colors">Terms</span> and <span className="underline cursor-pointer hover:text-white/60 transition-colors">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
