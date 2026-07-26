import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { FiPlus, FiUsers, FiCode, FiLogOut, FiEdit3, FiArrowRight, FiClock, FiCpu, FiZap, FiTrash2, FiTerminal, FiActivity } from 'react-icons/fi';
import { motion } from 'framer-motion';

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
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function Dashboard() {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomFeature, setRoomFeature] = useState<'whiteboard' | 'ai' | 'all' | 'none'>('none');
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
    if (!roomName.trim()) { toast.error('Please enter a node name'); return; }
    setIsLoading(true);
    const code = generateRoomCode();
    try {
      const response = await api.post('/rooms', {
        name: roomName.trim(),
        code,
        enable_whiteboard: roomFeature === 'whiteboard' || roomFeature === 'all',
        enable_ai: roomFeature === 'ai' || roomFeature === 'all',
      });
      const room = response.data;
      toast.success(`Node [${room.name}] initialized.`);
      setCreateOpen(false);
      navigate(`/room/${room.code}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initialize node');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim() || joinCode.length !== 6) { toast.error('Invalid access code'); return; }
    setIsLoading(true);
    try {
      const response = await api.get(`/rooms/${joinCode}`);
      const room = response.data;
      toast.success(`Connecting to node [${room.name}]`);
      setJoinOpen(false);
      navigate(`/room/${room.code}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Node offline or not found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRoom = async (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    if (!window.confirm('WARNING: Deleting this node is permanent. Proceed?')) return;
    
    try {
      await api.delete(`/rooms/id/${roomId}`);
      toast.success('Node terminated');
      fetchRooms();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to terminate node');
    }
  };

  const handleSignOut = async () => { await signOut(); navigate('/auth'); };

  return (
    <div className="min-h-screen bg-cyber-dark text-cyber-text-primary selection:bg-cyber-cyan selection:text-cyber-dark relative overflow-hidden">
      <div className="fixed inset-0 z-0 bg-cyber-gradient opacity-90 pointer-events-none"></div>
      <div className="fixed inset-0 z-0 scanlines opacity-20 pointer-events-none"></div>

      {/* Header */}
      <header className="h-16 glassmorphism border-b border-white/5 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiTerminal className="w-5 h-5 text-cyber-cyan" />
            <span className="text-xl font-bold tracking-widest text-white uppercase neon-text-cyan">Spark OS</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs uppercase tracking-widest font-bold text-cyber-cyan">{user?.name}</span>
              <span className="text-[9px] uppercase tracking-widest text-cyber-lime flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-lime animate-pulse" /> Online
              </span>
            </div>
            <div className="w-10 h-10 rounded border border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan flex items-center justify-center text-sm font-bold shadow-[0_0_10px_rgba(0,245,255,0.2)]">
              {getInitials(user?.name)}
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-cyber-text-muted hover:text-cyber-pink transition-colors group"
              title="Disconnect"
            >
              <FiLogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-6xl relative z-10">
        <div className="space-y-12">
          {/* Welcome section */}
          <div className="space-y-3">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-bold text-white tracking-widest uppercase flex items-center gap-4"
            >
              Dashboard
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-cyber-cyan text-sm uppercase tracking-widest flex items-center gap-2"
            >
              <FiActivity className="animate-pulse" /> Active Session: {user?.name?.split(' ')[0] || 'User'}
            </motion.p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Create Room */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glassmorphism p-8 rounded-xl border border-cyber-cyan/30 hover:border-cyber-cyan hover:shadow-[0_0_20px_rgba(0,245,255,0.3)] transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute right-0 top-0 w-32 h-32 bg-cyber-cyan/10 blur-3xl rounded-full pointer-events-none" />
                  <div className="w-14 h-14 rounded bg-cyber-dark border border-cyber-cyan/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(0,245,255,0.2)]">
                    <FiPlus className="w-6 h-6 text-cyber-cyan" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wider">Create Workspace</h3>
                  <p className="text-cyber-text-secondary text-sm mb-8 font-light">Deploy a new collaborative workspace environment.</p>
                  <div className="text-cyber-cyan text-sm font-bold uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
                    Create <FiArrowRight />
                  </div>
                </motion.div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md glassmorphism border border-cyber-cyan/50 text-white rounded-xl shadow-[0_0_30px_rgba(0,245,255,0.2)] p-0 overflow-hidden">
                <DialogDescription className="sr-only">Configure a new workspace node.</DialogDescription>
                <div className="p-6 border-b border-white/10 bg-cyber-darker/50">
                  <DialogTitle className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <FiTerminal className="text-cyber-cyan" /> New Workspace
                  </DialogTitle>
                </div>
                <div className="p-6 space-y-6 bg-cyber-panel/50">
                  <div className="space-y-3">
                    <Label className="text-cyber-text-secondary uppercase text-xs tracking-widest">Workspace Name</Label>
                    <Input
                      placeholder="e.g. Project Alpha"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="input-cyber"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-cyber-text-secondary uppercase text-xs tracking-widest">Features</Label>
                    <RadioGroup value={roomFeature} onValueChange={(v) => setRoomFeature(v as any)} className="grid grid-cols-2 gap-4">
                      {[
                        { value: 'none', label: 'Basic', icon: FiCode, color: 'text-cyber-cyan' },
                        { value: 'whiteboard', label: 'Whiteboard', icon: FiEdit3, color: 'text-cyber-pink' },
                        { value: 'ai', label: 'AI Assistant', icon: FiCpu, color: 'text-cyber-purple' },
                        { value: 'all', label: 'All Features', icon: FiZap, color: 'text-cyber-lime' },
                      ].map((opt) => (
                        <div key={opt.value}>
                          <RadioGroupItem value={opt.value} id={opt.value} className="peer sr-only" />
                          <Label htmlFor={opt.value}
                            className="flex flex-col items-center justify-center p-4 border border-white/10 rounded-lg cursor-pointer peer-data-[state=checked]:border-cyber-cyan peer-data-[state=checked]:bg-cyber-cyan/10 peer-data-[state=checked]:shadow-[0_0_15px_rgba(0,245,255,0.2)] transition-all hover:bg-white/5">
                            {opt.icon && <opt.icon className={`w-5 h-5 mb-2 ${opt.color}`} />}
                            <span className="text-xs font-bold uppercase tracking-wider text-cyber-text-primary">{opt.label}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <Button onClick={handleCreateRoom} disabled={isLoading} className="w-full btn-cyber-primary h-12 uppercase tracking-widest text-sm mt-4 border-0">
                    {isLoading ? 'Creating...' : 'Create Workspace'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Join Room */}
            <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
              <DialogTrigger asChild>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glassmorphism p-8 rounded-xl border border-cyber-purple/30 hover:border-cyber-purple hover:shadow-[0_0_20px_rgba(176,38,255,0.3)] transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute right-0 top-0 w-32 h-32 bg-cyber-purple/10 blur-3xl rounded-full pointer-events-none" />
                  <div className="w-14 h-14 rounded bg-cyber-dark border border-cyber-purple/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(176,38,255,0.2)]">
                    <FiUsers className="w-6 h-6 text-cyber-purple" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wider">Join Workspace</h3>
                  <p className="text-cyber-text-secondary text-sm mb-8 font-light">Connect to an existing collaborative workspace.</p>
                  <div className="text-cyber-purple text-sm font-bold uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
                    Join <FiArrowRight />
                  </div>
                </motion.div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md glassmorphism border border-cyber-purple/50 text-white rounded-xl shadow-[0_0_30px_rgba(176,38,255,0.2)] p-0 overflow-hidden">
                <DialogDescription className="sr-only">Join an existing workspace node.</DialogDescription>
                <div className="p-6 border-b border-white/10 bg-cyber-darker/50">
                  <DialogTitle className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <FiZap className="text-cyber-purple" /> Join Workspace
                  </DialogTitle>
                </div>
                <div className="p-6 space-y-6 bg-cyber-panel/50">
                  <div className="space-y-4 text-center">
                    <Label className="text-cyber-text-secondary uppercase text-xs tracking-widest">Enter 6-Digit Access Code</Label>
                    <Input
                      placeholder="000 000"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="text-center text-4xl font-mono font-bold tracking-[0.5em] h-20 bg-cyber-darker border-cyber-purple/30 text-cyber-purple placeholder:text-cyber-purple/20 focus:border-cyber-purple focus:shadow-[0_0_15px_rgba(176,38,255,0.3)]"
                    />
                  </div>
                  <Button onClick={handleJoinRoom} disabled={isLoading || joinCode.length !== 6} className="w-full bg-cyber-purple text-white hover:bg-white hover:text-cyber-dark hover:shadow-[0_0_20px_rgba(176,38,255,0.5)] font-bold transition-all duration-300 h-12 uppercase tracking-widest text-sm border-0">
                    {isLoading ? 'Joining...' : 'Join Workspace'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Recent Rooms */}
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 text-white border-b border-white/10 pb-4">
              <FiClock className="text-cyber-cyan" />
              <h2 className="text-lg font-bold uppercase tracking-widest">Recent Workspaces</h2>
              {rooms.length > 0 && (
                <span className="bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-[10px] font-bold px-2 py-0.5 rounded-sm">
                  {rooms.length}
                </span>
              )}
            </div>

            {isPageLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 glassmorphism border border-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : rooms.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map(room => (
                  <div
                    key={room._id}
                    onClick={() => navigate(`/room/${room.code}`)}
                    className="p-6 glassmorphism border border-white/10 rounded-xl hover:border-cyber-cyan/50 hover:shadow-[0_0_15px_rgba(0,245,255,0.15)] transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyber-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-10 h-10 rounded border border-white/10 bg-cyber-dark flex items-center justify-center group-hover:border-cyber-cyan/50 transition-colors">
                        <FiCode className="text-cyber-text-secondary group-hover:text-cyber-cyan transition-colors" />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-cyber-cyan bg-cyber-cyan/10 border border-cyber-cyan/20 px-2 py-1 rounded">
                          {room.code}
                        </span>
                        <button
                          onClick={(e) => handleDeleteRoom(e, room._id)}
                          className="p-1.5 text-cyber-text-muted hover:text-cyber-pink hover:bg-cyber-pink/10 hover:border-cyber-pink/30 border border-transparent rounded transition-all"
                          title="Delete Workspace"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-bold text-white truncate mb-2 uppercase tracking-wide">{room.name}</h4>
                    <div className="text-[10px] text-cyber-text-muted font-bold uppercase tracking-widest flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${room.enable_ai ? 'bg-cyber-purple shadow-[0_0_5px_rgba(176,38,255,0.8)]' : 'bg-cyber-cyan shadow-[0_0_5px_rgba(0,245,255,0.8)]'}`} />
                      {room.enable_ai && room.enable_whiteboard 
                        ? 'All Features' 
                        : room.enable_ai 
                          ? 'AI Enabled' 
                          : room.enable_whiteboard 
                            ? 'Whiteboard Enabled' 
                            : 'Basic Workspace'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 glassmorphism border border-dashed border-white/20 rounded-xl">
                <FiActivity className="w-12 h-12 text-cyber-text-muted mx-auto mb-4 opacity-50" />
                <p className="text-cyber-text-secondary uppercase tracking-widest text-sm">No recent workspaces.</p>
              </div>
            )}
          </motion.section>
        </div>
      </main>
    </div>
  );
}
