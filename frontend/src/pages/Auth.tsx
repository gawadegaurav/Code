import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { FiTerminal, FiMail, FiLock, FiUser, FiArrowRight, FiZap } from 'react-icons/fi';
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
    <div className="min-h-screen flex items-center justify-center bg-cyber-dark text-cyber-text-primary p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 bg-cyber-gradient opacity-90 pointer-events-none"></div>
      <div className="fixed inset-0 z-0 scanlines opacity-20 pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded bg-cyber-dark border border-cyber-cyan shadow-[0_0_15px_rgba(0,245,255,0.3)] mb-4">
            <FiTerminal className="w-6 h-6 text-cyber-cyan" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-widest uppercase">Spark OS</h1>
          <p className="text-cyber-text-secondary uppercase tracking-widest text-xs">Sign in to start collaborating.</p>
        </div>

        <Card className="border border-cyber-cyan/30 glassmorphism rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,245,255,0.1)] relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay pointer-events-none z-0"></div>
          
          <CardHeader className="p-8 pb-4 relative z-10">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-cyber-darker/80 border border-cyber-cyan/20 p-1 rounded">
                <TabsTrigger 
                  value="login" 
                  className="rounded font-bold uppercase tracking-widest text-xs text-cyber-text-muted data-[state=active]:bg-cyber-cyan/20 data-[state=active]:text-cyber-cyan data-[state=active]:border-cyber-cyan/50 data-[state=active]:shadow-[0_0_10px_rgba(0,245,255,0.2)] transition-all"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="rounded font-bold uppercase tracking-widest text-xs text-cyber-text-muted data-[state=active]:bg-cyber-cyan/20 data-[state=active]:text-cyber-cyan data-[state=active]:border-cyber-cyan/50 data-[state=active]:shadow-[0_0_10px_rgba(0,245,255,0.2)] transition-all"
                >
                  Register
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          
          <CardContent className="p-8 pt-4 relative z-10">
            <Tabs value={activeTab} className="w-full">
              <TabsContent value="login" className="m-0">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-cyber-text-secondary uppercase text-[10px] font-bold tracking-widest">Email</Label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-cyan w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="pl-10 h-12 bg-cyber-darker border-cyber-cyan/30 text-white placeholder:text-cyber-text-muted focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-all font-mono text-sm rounded"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-cyber-text-secondary uppercase text-[10px] font-bold tracking-widest">Password</Label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-cyan w-4 h-4" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="pl-10 h-12 bg-cyber-darker border-cyber-cyan/30 text-white placeholder:text-cyber-text-muted focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-all font-mono text-sm rounded tracking-widest"
                        required
                      />
                    </div>
                  </div>
                  <button
                    disabled={isLoading}
                    className="w-full bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan hover:text-cyber-dark hover:shadow-[0_0_20px_rgba(0,245,255,0.5)] font-bold uppercase tracking-widest h-12 rounded transition-all flex items-center justify-center gap-2 mt-6 text-sm"
                  >
                    {isLoading ? 'Signing in...' : <>Sign In <FiArrowRight /></>}
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="m-0">
                <form onSubmit={handleSignup} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-cyber-text-secondary uppercase text-[10px] font-bold tracking-widest">Full Name</Label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-purple w-4 h-4" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={signupData.name}
                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                        className="pl-10 h-12 bg-cyber-darker border-cyber-purple/30 text-white placeholder:text-cyber-text-muted focus:border-cyber-purple focus:ring-1 focus:ring-cyber-purple transition-all font-mono text-sm rounded"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-cyber-text-secondary uppercase text-[10px] font-bold tracking-widest">Email</Label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-purple w-4 h-4" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        className="pl-10 h-12 bg-cyber-darker border-cyber-purple/30 text-white placeholder:text-cyber-text-muted focus:border-cyber-purple focus:ring-1 focus:ring-cyber-purple transition-all font-mono text-sm rounded"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-cyber-text-secondary uppercase text-[10px] font-bold tracking-widest">Password</Label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-purple w-4 h-4" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Min. 6 characters"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        className="pl-10 h-12 bg-cyber-darker border-cyber-purple/30 text-white placeholder:text-cyber-text-muted focus:border-cyber-purple focus:ring-1 focus:ring-cyber-purple transition-all font-mono text-sm rounded tracking-widest"
                        required
                      />
                    </div>
                  </div>
                  <button
                    disabled={isLoading}
                    className="w-full bg-cyber-purple/10 border border-cyber-purple text-cyber-purple hover:bg-cyber-purple hover:text-white hover:shadow-[0_0_20px_rgba(176,38,255,0.5)] font-bold uppercase tracking-widest h-12 rounded transition-all flex items-center justify-center gap-2 mt-6 text-sm"
                  >
                    {isLoading ? 'Creating account...' : <>Create Account <FiZap /></>}
                  </button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
