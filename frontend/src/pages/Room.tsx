import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { FiCode, FiVideo, FiArrowLeft, FiCopy, FiUsers, FiMonitor, FiTerminal, FiCpu } from 'react-icons/fi';
import { CodeEditor } from '@/components/room/CodeEditor';
import { ChatPanel } from '@/components/room/ChatPanel';
import { Whiteboard } from '@/components/room/Whiteboard';
import { AIAssistant } from '@/components/room/AIAssistant';
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
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem(`activeTab_${roomCode}`) || 'code');
  const [participantCount, setParticipantCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentCode, setCurrentCode] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('javascript');

  useEffect(() => {
    if (!roomCode || !user) return;
    const fetchRoom = async () => {
      try {
        const response = await api.get(`/rooms/${roomCode}`);
        setRoom(response.data);
        
        const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://127.0.0.1:5000';
        socket = io(socketUrl);
        socket.on('connect', () => {
          socket.emit('join-room', response.data._id);
        });

        socket.on('room-members', (count: number) => {
          setParticipantCount(count);
        });

        setLoading(false);
      } catch (error: any) {
        toast.error('Node not found or unauthorized access');
        navigate('/dashboard');
      }
    };
    fetchRoom();
    return () => { 
      if (socket) {
        socket.off('room-members');
        socket.disconnect(); 
      }
    };
  }, [roomCode, user, navigate]);

  const copyRoomCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      toast.success('Access code copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-cyber-dark text-cyber-cyan">
        <div className="relative w-16 h-16 flex items-center justify-center mb-6">
          <div className="absolute inset-0 border-4 border-cyber-cyan/20 border-t-cyber-cyan rounded-full animate-spin" />
          <FiTerminal className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-cyber-cyan">Establishing Connection...</h2>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-cyber-dark text-cyber-text-primary selection:bg-cyber-cyan selection:text-cyber-dark">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 bg-cyber-gradient opacity-50 pointer-events-none"></div>
      <div className="fixed inset-0 z-0 scanlines opacity-10 pointer-events-none"></div>

      <Tabs 
        value={activeTab} 
        onValueChange={(val) => {
          setActiveTab(val);
          sessionStorage.setItem(`activeTab_${roomCode}`, val);
        }} 
        className="flex-1 flex flex-col min-h-0 relative z-10"
      >
        {/* Header */}
        <header className="h-14 glassmorphism border-b border-white/10 flex items-center px-4 justify-between shrink-0 relative z-50 overflow-x-auto">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <button className="p-2 text-cyber-text-muted hover:text-cyber-cyan transition-colors group">
                <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
            </Link>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex items-center gap-3">
              <FiTerminal className="text-cyber-cyan w-5 h-5 drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" />
              <h1 className="font-bold text-white uppercase tracking-wider">{room.name}</h1>
              <span className="flex items-center gap-2 text-[10px] font-bold text-cyber-lime border border-cyber-lime/30 bg-cyber-lime/10 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(57,255,20,0.2)] uppercase tracking-widest mr-2 lg:mr-6">
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-lime animate-pulse shadow-[0_0_5px_#39FF14]" /> Live
              </span>

              <div className="w-px h-6 bg-white/10 hidden md:block" />
              <TabsList className="bg-transparent border-none p-0 h-14 flex gap-2 ml-2">
                <TabsTrigger value="code" className="rounded-none h-14 px-3 text-xs font-bold uppercase tracking-widest border-b-2 border-transparent text-cyber-text-muted hover:text-cyber-cyan data-[state=active]:border-cyber-cyan data-[state=active]:bg-transparent data-[state=active]:text-cyber-cyan data-[state=active]:shadow-[0_2px_10px_rgba(0,245,255,0.3)] transition-all">
                  <FiMonitor className="mr-2" /> Code Editor
                </TabsTrigger>
                <TabsTrigger value="video" className="rounded-none h-14 px-3 text-xs font-bold uppercase tracking-widest border-b-2 border-transparent text-cyber-text-muted hover:text-cyber-pink data-[state=active]:border-cyber-pink data-[state=active]:bg-transparent data-[state=active]:text-cyber-pink data-[state=active]:shadow-[0_2px_10px_rgba(255,0,140,0.3)] transition-all">
                  <FiVideo className="mr-2" /> Video Call
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="flex items-center gap-3 hidden md:flex">
            <button
              onClick={copyRoomCode}
              className="flex items-center gap-2 px-3 h-8 rounded bg-cyber-darker border border-cyber-cyan/30 text-xs font-bold text-cyber-cyan hover:bg-cyber-cyan/10 hover:border-cyber-cyan transition-all shadow-[0_0_10px_rgba(0,245,255,0.1)] hover:shadow-[0_0_15px_rgba(0,245,255,0.3)] uppercase tracking-wider"
            >
              <FiCopy /> {room.code}
            </button>
            <div className="flex items-center gap-2 px-3 h-8 rounded bg-cyber-darker border border-cyber-purple/30 text-xs font-bold text-cyber-purple shadow-[0_0_10px_rgba(176,38,255,0.1)]">
              <FiUsers /> {participantCount}
            </div>
          </div>
        </header>

        {/* Main Content */}

        <div className="flex-1 relative overflow-hidden bg-cyber-dark/50">
          <TabsContent value="code" forceMount className="w-full h-full md:absolute md:inset-0 m-0 p-0 data-[state=inactive]:hidden overflow-y-auto md:overflow-hidden flex flex-col">
            <div className="min-h-full md:h-full flex flex-col md:flex-row p-3 gap-3">
              <div className="h-[480px] md:h-full flex-1 relative shrink-0">
                <div className="absolute inset-0 rounded-xl neon-border pointer-events-none opacity-50 z-10" />
                <div className="h-full rounded-xl overflow-hidden glassmorphism bg-cyber-dark">
                  <CodeEditor roomId={room._id} socket={socket} userId={user?._id} onCodeChange={setCurrentCode} onLanguageChange={setCurrentLanguage} />
                </div>
              </div>
              
              <aside className="w-full md:w-80 lg:w-96 flex flex-col gap-3 shrink-0 overflow-y-auto">
                <div className="flex-1 min-h-[300px] rounded-xl overflow-hidden neon-border-pink relative">
                  <ChatPanel roomId={room._id} socket={socket} userId={user?._id} />
                </div>
                {room.enable_ai && (
                  <div className="h-[400px] rounded-xl overflow-hidden neon-border-purple relative shrink-0">
                    <AIAssistant roomId={room._id} code={currentCode} language={currentLanguage} />
                  </div>
                )}
                {room.enable_whiteboard && (
                  <div className="h-[400px] rounded-xl overflow-hidden border border-cyber-lime/50 shadow-[0_0_10px_rgba(57,255,20,0.2)] relative shrink-0 glassmorphism">
                    <Whiteboard roomId={room._id} socket={socket} />
                  </div>
                )}
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="video" forceMount className="w-full h-full md:absolute md:inset-0 m-0 p-0 data-[state=inactive]:hidden flex flex-col">
            <div className="w-full h-full relative bg-cyber-darker flex flex-col">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay pointer-events-none z-0"></div>
              <VideoConference roomId={room._id} socket={socket} />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
