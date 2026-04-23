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
import { FiPlus, FiUsers, FiCode, FiLogOut, FiEdit3, FiArrowRight, FiClock, FiCpu, FiZap, FiTrash2 } from 'react-icons/fi';

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
    if (!roomName.trim()) { toast.error('Please enter a room name'); return; }
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

  const handleDeleteRoom = async (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this workspace?')) return;
    
    try {
      await api.delete(`/rooms/id/${roomId}`);
      toast.success('Workspace deleted');
      fetchRooms();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete workspace');
    }
  };

  const handleSignOut = async () => { await signOut(); navigate('/auth'); };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="h-16 bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiCode className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold tracking-tight text-slate-900">CodeCollab</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-900">{user?.name}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
              {getInitials(user?.name)}
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-slate-500 hover:text-red-600 transition-colors"
              title="Sign out"
            >
              <FiLogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="space-y-12">
          {/* Welcome section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.name?.split(' ')[0] || 'Developer'}
            </h1>
            <p className="text-slate-500">Choose a workspace to start collaborating.</p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Create Room */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <FiPlus className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Create Workspace</h3>
                  <p className="text-slate-500 text-sm mb-6">Start a new session with your team.</p>
                  <div className="text-blue-600 text-sm font-bold flex items-center gap-2">
                    Start Now <FiArrowRight />
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">New Workspace</DialogTitle>
                  <DialogDescription>Configure your collaboration session.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="e.g. Project Phoenix"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="bg-slate-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Workspace Type</Label>
                    <RadioGroup value={roomFeature} onValueChange={(v) => setRoomFeature(v as any)} className="grid grid-cols-2 gap-4">
                      {[
                        { value: 'none', label: 'Basic', icon: FiCode },
                        { value: 'whiteboard', label: 'Whiteboard', icon: FiEdit3 },
                        { value: 'ai', label: 'AI Assistant', icon: FiCpu },
                        { value: 'all', label: 'Full Suite', icon: FiZap },
                      ].map((opt) => (
                        <div key={opt.value}>
                          <RadioGroupItem value={opt.value} id={opt.value} className="peer sr-only" />
                          <Label htmlFor={opt.value}
                            className="flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 transition-all hover:bg-slate-50">
                            {opt.icon && <opt.icon className="w-5 h-5 mb-2 text-slate-600" />}
                            <span className="text-xs font-bold">{opt.label}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <Button onClick={handleCreateRoom} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                    {isLoading ? 'Creating...' : 'Create Workspace'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Join Room */}
            <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
              <DialogTrigger asChild>
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-500/50 hover:shadow-md transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <FiUsers className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Join Workspace</h3>
                  <p className="text-slate-500 text-sm mb-6">Connect to an existing room using a code.</p>
                  <div className="text-indigo-600 text-sm font-bold flex items-center gap-2">
                    Join Team <FiArrowRight />
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Join Workspace</DialogTitle>
                  <DialogDescription>Enter the 6-digit code.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                  <Input
                    placeholder="000 000"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-3xl font-bold tracking-widest h-16 bg-slate-50"
                  />
                  <Button onClick={handleJoinRoom} disabled={isLoading || joinCode.length !== 6} className="w-full bg-indigo-600 hover:bg-indigo-700">
                    {isLoading ? 'Joining...' : 'Join Workspace'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Recent Rooms */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-slate-900">
              <FiClock className="text-slate-400" />
              <h2 className="text-lg font-bold">Recent Workspaces</h2>
              {rooms.length > 0 && (
                <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {rooms.length}
                </span>
              )}
            </div>

            {isPageLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-white border rounded-xl animate-pulse" />
                ))}
              </div>
            ) : rooms.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map(room => (
                  <div
                    key={room._id}
                    onClick={() => navigate(`/room/${room.code}`)}
                    className="p-5 bg-white border border-slate-200 rounded-xl hover:shadow-sm hover:border-slate-300 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                        <FiCode className="text-slate-400" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                          #{room.code}
                        </span>
                        <button
                          onClick={(e) => handleDeleteRoom(e, room._id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                          title="Delete Workspace"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-900 truncate mb-1">{room.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                      {room.enable_ai && room.enable_whiteboard 
                        ? 'Full Suite' 
                        : room.enable_ai 
                          ? 'AI Enabled' 
                          : room.enable_whiteboard 
                            ? 'Whiteboard Enabled' 
                            : 'Basic Workspace'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white border border-dashed rounded-2xl">
                <FiCode className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500">No workspaces found.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
