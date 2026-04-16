import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Code2, Video, ArrowLeft, Copy, Users, Monitor } from 'lucide-react';
import { CodeEditor } from '@/components/room/CodeEditor';
import { ChatPanel } from '@/components/room/ChatPanel';
import { AIAssistant } from '@/components/room/AIAssistant';
import { Whiteboard } from '@/components/room/Whiteboard';
import { VideoConference } from '@/components/room/VideoConference';

interface Room {
  _id: string;
  code: string;
  name: string;
  enable_whiteboard: boolean;
  enable_ai: boolean;
  created_by: { name: string; avatar_url?: string; }
}

let socket: Socket;

export default function RoomPage() {
  const { roomId: roomCode } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [activeTab, setActiveTab] = useState('code');
  const [participantCount, setParticipantCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomCode || !user) return;
    const fetchRoom = async () => {
      try {
        const response = await api.get(`/rooms/${roomCode}`);
        setRoom(response.data);
        socket = io('http://localhost:5000');
        socket.emit('join-room', response.data._id);
        setLoading(false);
      } catch (error: any) {
        toast.error('Room not found or unauthorized');
        navigate('/dashboard');
      }
    };
    fetchRoom();
    return () => { if (socket) socket.disconnect(); };
  }, [roomCode, user, navigate]);

  const copyRoomCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      toast.success('Room code copied!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: 'hsl(250, 35%, 4%)' }}>
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-full animate-spin" style={{ border: '3px solid hsl(263 75% 60% / 0.15)', borderTopColor: '#a78bfa' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Code2 className="w-7 h-7" style={{ color: '#a78bfa' }} />
          </div>
        </div>
        <h2 className="text-xl font-bold font-display text-white mb-2">Connecting to Workspace</h2>
        <p className="text-sm max-w-xs" style={{ color: 'hsl(220 15% 50%)' }}>Establishing a secure real-time channel...</p>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="h-screen flex flex-col overflow-hidden text-slate-200" style={{ background: 'hsl(248 30% 5%)' }}>

      {/* ── Header ── */}
      <header className="h-14 flex items-center px-5 gap-5 shrink-0 relative z-30"
        style={{ borderBottom: '1px solid hsl(248 25% 12%)', background: 'hsl(248 30% 5% / 0.9)', backdropFilter: 'blur(20px)' }}>
        {/* Back */}
        <Link to="/dashboard">
          <button className="p-2 rounded-xl transition-all duration-200 hover:scale-105 hover:bg-white/5 text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>

        <div className="h-5 w-px" style={{ background: 'hsl(248 25% 16%)' }} />

        {/* Room name */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'hsl(263 75% 60% / 0.12)', border: '1px solid hsl(263 75% 60% / 0.2)' }}>
            <Code2 className="w-4 h-4" style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <p className="font-bold text-sm text-white leading-none truncate max-w-[200px]">{room.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium" style={{ color: '#4ade80' }}>Live</span>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          {/* Copy code */}
          <button
            onClick={copyRoomCode}
            className="flex items-center gap-2 px-3.5 h-8 rounded-xl text-xs font-bold font-mono transition-all duration-300 hover:scale-105 group"
            style={{ background: 'hsl(263 75% 60% / 0.08)', border: '1px solid hsl(263 75% 60% / 0.2)', color: '#a78bfa' }}
          >
            <Copy className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
            {room.code}
          </button>
          {/* Participants */}
          <div className="flex items-center gap-2 px-3 h-8 rounded-xl text-xs font-semibold"
            style={{ background: 'hsl(248 30% 8%)', border: '1px solid hsl(248 25% 14%)', color: 'hsl(220 15% 60%)' }}>
            <Users className="w-3.5 h-3.5" />
            <span>{participantCount}</span>
          </div>
        </div>
      </header>

      {/* ── Tab Bar ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0" style={{ background: 'hsl(248 30% 5%)' }}>
        <div className="h-11 px-5 flex items-center justify-between shrink-0"
          style={{ borderBottom: '1px solid hsl(248 25% 11%)', background: 'hsl(248 30% 4% / 0.6)' }}>
          <TabsList className="h-8 p-1 gap-1 rounded-xl"
            style={{ background: 'hsl(248 30% 7%)', border: '1px solid hsl(248 25% 14%)' }}>
            <TabsTrigger value="code"
              className="gap-2 h-6 px-4 rounded-lg text-[11px] font-bold tracking-wide transition-all duration-300 text-slate-500 data-[state=active]:text-white"
              style={{ '--tw-ring-color': '#a78bfa' } as React.CSSProperties}>
              <Monitor className="w-3.5 h-3.5" />
              Workspace
            </TabsTrigger>
            <TabsTrigger value="video"
              className="gap-2 h-6 px-4 rounded-lg text-[11px] font-bold tracking-wide transition-all duration-300 text-slate-500 data-[state=active]:text-white">
              <Video className="w-3.5 h-3.5" />
              Conference
            </TabsTrigger>
          </TabsList>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-semibold tracking-wider"
            style={{ background: 'hsl(142 70% 45% / 0.07)', border: '1px solid hsl(142 70% 45% / 0.15)', color: '#4ade80' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Engine Active
          </div>
        </div>

        {/* Code workspace */}
        <TabsContent value="code" forceMount className="flex-1 m-0 p-0 relative min-h-0 data-[state=inactive]:hidden">
          <div className="h-full flex overflow-hidden">
            {/* Editor */}
            <div className="flex-1 flex flex-col relative p-3">
              <div className="flex-1 rounded-2xl overflow-hidden" style={{ border: '1px solid hsl(248 25% 12%)' }}>
                <CodeEditor roomId={room._id} socket={socket} userId={user?._id} />
              </div>
            </div>
            {/* Sidebar */}
            <aside className="w-80 lg:w-96 hidden md:flex flex-col shrink-0 p-3 gap-3 overflow-hidden"
              style={{ borderLeft: '1px solid hsl(248 25% 11%)' }}>
              <div className="flex-1 min-h-0 rounded-2xl overflow-hidden" style={{ border: '1px solid hsl(248 25% 12%)', background: 'hsl(248 30% 6%)' }}>
                <ChatPanel roomId={room._id} socket={socket} userId={user?._id} />
              </div>
              <div className="h-[35%] min-h-[280px] rounded-2xl overflow-hidden" style={{ border: '1px solid hsl(248 25% 12%)', background: 'hsl(248 30% 6%)' }}>
                {room.enable_ai ? (
                  <AIAssistant roomId={room._id} />
                ) : (
                  <Whiteboard roomId={room._id} socket={socket} />
                )}
              </div>
            </aside>
          </div>
        </TabsContent>

        {/* Video conference */}
        <TabsContent value="video" forceMount className="flex-1 m-0 p-4 overflow-hidden data-[state=inactive]:hidden" style={{ background: 'hsl(248 30% 5%)' }}>
          <div className="h-full rounded-3xl overflow-hidden" style={{ border: '1px solid hsl(248 25% 12%)' }}>
            <VideoConference roomId={room._id} socket={socket} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
