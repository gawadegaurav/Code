import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { FiCode, FiVideo, FiArrowLeft, FiCopy, FiUsers, FiMonitor } from 'react-icons/fi';
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

  useEffect(() => {
    if (!roomCode || !user) return;
    const fetchRoom = async () => {
      try {
        const response = await api.get(`/rooms/${roomCode}`);
        setRoom(response.data);
        
        socket = io(import.meta.env.VITE_API_URL);
        
        socket.on('connect', () => {
          socket.emit('join-room', response.data._id);
        });

        socket.on('room-members', (count: number) => {
          setParticipantCount(count);
        });

        setLoading(false);
      } catch (error: any) {
        toast.error('Room not found or unauthorized');
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
      toast.success('Room code copied!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold text-slate-900">Joining workspace...</h2>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="h-14 border-b flex items-center px-4 justify-between shrink-0 bg-white z-50">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
              <FiArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="w-px h-6 bg-slate-200" />
          <div className="flex items-center gap-3">
            <FiCode className="text-blue-600 w-5 h-5" />
            <h1 className="font-bold text-slate-900">{room.name}</h1>
            <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyRoomCode}
            className="flex items-center gap-2 px-3 h-8 rounded-md bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <FiCopy /> {room.code}
          </button>
          <div className="flex items-center gap-2 px-3 h-8 rounded-md bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600">
            <FiUsers /> {participantCount}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <Tabs 
        value={activeTab} 
        onValueChange={(val) => {
          setActiveTab(val);
          sessionStorage.setItem(`activeTab_${roomCode}`, val);
        }} 
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="h-11 px-4 border-b flex items-center shrink-0 bg-slate-50/50">
          <TabsList className="bg-transparent border-none p-0 h-11 flex gap-4">
            <TabsTrigger value="code" className="rounded-none h-11 px-4 text-xs font-bold border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 transition-all">
              <FiMonitor className="mr-2" /> Workspace
            </TabsTrigger>
            <TabsTrigger value="video" className="rounded-none h-11 px-4 text-xs font-bold border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 transition-all">
              <FiVideo className="mr-2" /> Conference
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 relative overflow-hidden bg-slate-100">
          <TabsContent value="code" forceMount className="h-full m-0 p-0 data-[state=inactive]:hidden">
            <div className="h-full flex">
              <div className="flex-1 p-3">
                <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <CodeEditor roomId={room._id} socket={socket} userId={user?._id} />
                </div>
              </div>
              
              <aside className="w-80 lg:w-96 hidden md:flex flex-col p-3 pl-0 gap-4 border-l bg-white shrink-0 overflow-y-auto">
                <div className="min-h-[450px] flex-1 border rounded-xl overflow-hidden shadow-sm">
                  <ChatPanel roomId={room._id} socket={socket} userId={user?._id} />
                </div>
                {room.enable_ai && (
                  <div className="h-[450px] border rounded-xl overflow-hidden shadow-sm shrink-0">
                    <AIAssistant roomId={room._id} />
                  </div>
                )}
                {room.enable_whiteboard && (
                  <div className="h-[400px] border rounded-xl overflow-hidden shadow-sm shrink-0">
                    <Whiteboard roomId={room._id} socket={socket} />
                  </div>
                )}
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="video" forceMount className="h-full m-0 p-3 data-[state=inactive]:hidden flex items-center justify-center">
            <div className="w-full max-w-4xl h-[600px] max-h-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <VideoConference roomId={room._id} socket={socket} />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
