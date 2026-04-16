import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Plus, Users, Code2, LogOut, Sparkles, PenTool, Search, ArrowRight, Clock } from 'lucide-react';

interface Room {
  _id: string;
  code: string;
  name: string;
  enable_whiteboard: boolean;
  enable_ai: boolean;
  createdAt: string;
}

function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getInitials(name?: string) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function Dashboard() {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomFeature, setRoomFeature] = useState<'whiteboard' | 'ai'>('ai');
  const [joinCode, setJoinCode] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Failed to fetch rooms', error);
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) { toast.error('Please enter a room name'); return; }
    setIsLoading(true);
    const code = generateRoomCode();
    try {
      const response = await api.post('/rooms', {
        name: roomName.trim(),
        code,
        enable_whiteboard: roomFeature === 'whiteboard',
        enable_ai: roomFeature === 'ai',
      });
      const room = response.data;
      toast.success(`Room "${room.name}" created!`);
      setCreateOpen(false);
      navigate(`/room/${room.code}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim() || joinCode.length !== 6) { toast.error('Please enter a valid 6-digit code'); return; }
    setIsLoading(true);
    try {
      const response = await api.get(`/rooms/${joinCode}`);
      const room = response.data;
      toast.success(`Joining "${room.name}"`);
      setJoinOpen(false);
      navigate(`/room/${room.code}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Room not found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => { await signOut(); navigate('/auth'); };

  const inputStyle = { background: 'hsl(248 30% 5%)', border: '1px solid hsl(248 25% 16%)' };

  return (
    <div className="min-h-screen text-white relative" style={{ background: 'hsl(250, 35%, 4%)' }}>
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-violet w-[600px] h-[600px] top-[-150px] left-[-150px] animate-orb-1" style={{ opacity: 0.1 }} />
        <div className="orb orb-cyan w-[500px] h-[500px] bottom-[-120px] right-[-120px] animate-orb-2" style={{ opacity: 0.08 }} />
      </div>

      <div className="relative z-10 flex flex-col h-screen overflow-hidden">

        {/* ── Header ── */}
        <header className="h-16 flex items-center justify-between px-6 shrink-0"
          style={{ borderBottom: '1px solid hsl(248 25% 12%)', background: 'hsl(250 35% 4% / 0.8)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: 'hsl(263 75% 60% / 0.15)', border: '1px solid hsl(263 75% 60% / 0.25)' }}>
              <Code2 className="w-5 h-5" style={{ color: '#a78bfa' }} />
            </div>
            <span className="text-xl font-black font-display text-aurora">CodeCollab</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-white">{user?.name}</span>
              <span className="text-xs" style={{ color: 'hsl(220 15% 45%)' }}>Developer</span>
            </div>
            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, hsl(263 75% 60%), hsl(188 85% 45%))' }}>
              {getInitials(user?.name)}
            </div>
            <button
              onClick={handleSignOut}
              className="p-2.5 rounded-xl transition-all duration-300 hover:scale-105"
              style={{ background: 'hsl(248 25% 12%)', border: '1px solid hsl(248 25% 16%)' }}
              title="Sign out"
            >
              <LogOut className="w-4 h-4" style={{ color: 'hsl(220 15% 55%)' }} />
            </button>
          </div>
        </header>

        {/* ── Scrollable Content ── */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 relative">
          <div className="max-w-6xl mx-auto space-y-14">

            {/* Hero */}
            <div className="pt-8 space-y-3 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-2"
                style={{ background: 'hsl(263 75% 60% / 0.1)', border: '1px solid hsl(263 75% 60% / 0.25)', color: '#a78bfa' }}>
                <Sparkles className="w-3 h-3" /> Dashboard
              </div>
              <h1 className="text-5xl md:text-6xl font-black font-display leading-none tracking-tight">
                <span className="text-white">Hello, </span>
                <span className="text-aurora">{user?.name?.split(' ')[0] || 'Developer'}</span>
                <span className="text-white"> 👋</span>
              </h1>
              <p className="text-base max-w-xl" style={{ color: 'hsl(220 15% 55%)' }}>
                Create a new workspace or join an existing one to start collaborating with your team.
              </p>
            </div>

            {/* Action Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Create Room */}
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <div className="group cursor-pointer p-8 rounded-3xl transition-all duration-500 hover:-translate-y-1 animate-fade-in"
                    style={{
                      background: 'hsl(248 30% 7% / 0.8)',
                      border: '1px solid hsl(248 25% 14%)',
                      backdropFilter: 'blur(20px)',
                      animationDelay: '0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'hsl(263 75% 60% / 0.35)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 40px hsl(263 75% 60% / 0.12), 0 20px 50px hsl(250 35% 2% / 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'hsl(248 25% 14%)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    }}
                  >
                    <div className="mb-6 p-5 rounded-2xl w-fit transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                      style={{ background: 'hsl(263 75% 60% / 0.12)', border: '1px solid hsl(263 75% 60% / 0.25)' }}>
                      <Plus className="w-10 h-10" style={{ color: '#a78bfa' }} />
                    </div>
                    <h2 className="text-2xl font-black font-display text-white mb-2">Create Workspace</h2>
                    <p className="text-sm mb-6 leading-relaxed" style={{ color: 'hsl(220 15% 50%)' }}>
                      Spin up a new collaborative room with AI assistance or interactive whiteboard.
                    </p>
                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#a78bfa' }}>
                      Get started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md text-white rounded-3xl shadow-2xl"
                  style={{ background: 'hsl(248 30% 6%)', border: '1px solid hsl(248 25% 14%)' }}>
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black font-display text-white">Create Workspace</DialogTitle>
                    <DialogDescription style={{ color: 'hsl(220 15% 50%)' }}>Configure your collaboration environment.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="room-name" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(220 15% 55%)' }}>Workspace Name</Label>
                      <Input
                        id="room-name"
                        placeholder="e.g. Project Phoenix"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        className="h-12 rounded-xl text-white placeholder:text-slate-700"
                        style={inputStyle}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(220 15% 55%)' }}>Features</Label>
                      <RadioGroup value={roomFeature} onValueChange={(v) => setRoomFeature(v as 'whiteboard' | 'ai')} className="grid grid-cols-2 gap-4">
                        {[
                          { value: 'ai', icon: Sparkles, label: 'AI Assistant', sub: 'Smart code help', color: '#a78bfa' },
                          { value: 'whiteboard', icon: PenTool, label: 'Whiteboard', sub: 'Visual canvas', color: '#38bdf8' },
                        ].map((opt) => (
                          <div key={opt.value}>
                            <RadioGroupItem value={opt.value} id={opt.value} className="peer sr-only" />
                            <Label htmlFor={opt.value}
                              className="flex flex-col items-center justify-center p-5 rounded-2xl cursor-pointer transition-all duration-300 gap-3 peer-data-[state=checked]:border-opacity-60"
                              style={{
                                background: 'hsl(248 30% 5%)',
                                border: roomFeature === opt.value ? `2px solid ${opt.color}60` : '2px solid hsl(248 25% 14%)',
                                backgroundColor: roomFeature === opt.value ? opt.color + '10' : undefined,
                              }}>
                              <opt.icon className="w-6 h-6" style={{ color: opt.color }} />
                              <div className="text-center">
                                <p className="font-bold text-sm text-white">{opt.label}</p>
                                <p className="text-xs" style={{ color: 'hsl(220 15% 50%)' }}>{opt.sub}</p>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    <button
                      onClick={handleCreateRoom}
                      disabled={isLoading}
                      className="btn-glow w-full text-white font-bold text-sm h-12 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</> : 'Create Workspace'}
                    </button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Join Room */}
              <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
                <DialogTrigger asChild>
                  <div className="group cursor-pointer p-8 rounded-3xl transition-all duration-500 hover:-translate-y-1 animate-fade-in"
                    style={{
                      background: 'hsl(248 30% 7% / 0.8)',
                      border: '1px solid hsl(248 25% 14%)',
                      backdropFilter: 'blur(20px)',
                      animationDelay: '0.3s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'hsl(188 85% 45% / 0.35)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 40px hsl(188 85% 45% / 0.12), 0 20px 50px hsl(250 35% 2% / 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'hsl(248 25% 14%)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    }}
                  >
                    <div className="mb-6 p-5 rounded-2xl w-fit transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3"
                      style={{ background: 'hsl(188 85% 45% / 0.12)', border: '1px solid hsl(188 85% 45% / 0.25)' }}>
                      <Users className="w-10 h-10" style={{ color: '#38bdf8' }} />
                    </div>
                    <h2 className="text-2xl font-black font-display text-white mb-2">Join Workspace</h2>
                    <p className="text-sm mb-6 leading-relaxed" style={{ color: 'hsl(220 15% 50%)' }}>
                      Enter a 6-digit room code to instantly connect with your team's session.
                    </p>
                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#38bdf8' }}>
                      Join now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md text-white rounded-3xl shadow-2xl"
                  style={{ background: 'hsl(248 30% 6%)', border: '1px solid hsl(248 25% 14%)' }}>
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black font-display text-white">Join Workspace</DialogTitle>
                    <DialogDescription style={{ color: 'hsl(220 15% 50%)' }}>Enter the 6-digit room code to connect.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-8 py-4 text-center">
                    <div className="space-y-3">
                      <Label htmlFor="join-code" className="text-xs font-semibold uppercase tracking-wider block text-left" style={{ color: 'hsl(220 15% 55%)' }}>Room Code</Label>
                      <Input
                        id="join-code"
                        placeholder="000000"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="text-center text-4xl font-black tracking-[0.5em] h-24 rounded-2xl text-white"
                        style={{ ...inputStyle, color: '#a78bfa', letterSpacing: '0.4em' }}
                        maxLength={6}
                      />
                    </div>
                    <button
                      onClick={handleJoinRoom}
                      disabled={isLoading || joinCode.length !== 6}
                      className="w-full text-white font-bold text-sm h-12 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg, hsl(188 85% 40%), hsl(188 85% 35%))', boxShadow: '0 0 30px hsl(188 85% 45% / 0.25)' }}
                    >
                      {isLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Connecting...</> : <>Join Workspace <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Recent Rooms */}
            {isPageLoading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-2 border-t-violet-500 rounded-full animate-spin" style={{ borderColor: 'hsl(263 75% 60% / 0.2)', borderTopColor: '#a78bfa' }} />
                <p className="text-sm" style={{ color: 'hsl(220 15% 45%)' }}>Loading your workspaces...</p>
              </div>
            )}

            {!isPageLoading && rooms.length > 0 && (
              <section className="space-y-5 animate-fade-in">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4" style={{ color: 'hsl(220 15% 45%)' }} />
                  <h2 className="text-lg font-bold font-display text-white">Recent Workspaces</h2>
                  <div className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: 'hsl(263 75% 60% / 0.1)', color: '#a78bfa', border: '1px solid hsl(263 75% 60% / 0.2)' }}>
                    {rooms.length}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {rooms.map((room, i) => (
                    <div
                      key={room._id}
                      onClick={() => navigate(`/room/${room.code}`)}
                      className="group p-6 rounded-2xl cursor-pointer transition-all duration-400 hover:-translate-y-1 animate-fade-in"
                      style={{
                        background: 'hsl(248 30% 7% / 0.7)',
                        border: '1px solid hsl(248 25% 13%)',
                        backdropFilter: 'blur(16px)',
                        animationDelay: `${0.1 * i}s`,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = 'hsl(263 75% 60% / 0.3)';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 20px hsl(263 75% 60% / 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = 'hsl(248 25% 13%)';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-2.5 rounded-xl" style={{ background: room.enable_ai ? 'hsl(263 75% 60% / 0.12)' : 'hsl(188 85% 45% / 0.12)' }}>
                          {room.enable_ai
                            ? <Sparkles className="w-5 h-5" style={{ color: '#a78bfa' }} />
                            : <PenTool className="w-5 h-5" style={{ color: '#38bdf8' }} />}
                        </div>
                        <span className="text-xs font-mono px-2.5 py-1 rounded-lg font-bold tracking-wider"
                          style={{ background: 'hsl(248 30% 5%)', color: 'hsl(220 15% 50%)', border: '1px solid hsl(248 25% 14%)' }}>
                          #{room.code}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-white mb-1 group-hover:text-aurora transition-all duration-300 truncate">{room.name}</h3>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs" style={{ color: 'hsl(220 15% 45%)' }}>
                          {room.enable_ai ? 'AI-Enabled' : 'Whiteboard'}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-semibold transition-all group-hover:gap-2" style={{ color: '#a78bfa' }}>
                          Enter <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!isPageLoading && rooms.length === 0 && (
              <div className="text-center py-20 animate-fade-in">
                <div className="mx-auto mb-5 p-6 rounded-3xl w-fit" style={{ background: 'hsl(263 75% 60% / 0.08)', border: '1px solid hsl(263 75% 60% / 0.15)' }}>
                  <Code2 className="w-12 h-12" style={{ color: '#a78bfa' }} />
                </div>
                <h3 className="text-xl font-bold font-display text-white mb-2">No workspaces yet</h3>
                <p className="text-sm" style={{ color: 'hsl(220 15% 50%)' }}>Create your first workspace to get started with real-time collaboration.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
