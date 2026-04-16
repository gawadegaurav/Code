import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  _id: string;
  content: string;
  user_id: {
    username: string;
    avatar_url?: string;
  };
  createdAt: string;
}

interface ChatPanelProps {
  roomId: string;
  socket?: Socket;
  userId?: string;
}

export function ChatPanel({ roomId, socket, userId }: ChatPanelProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await api.get(`/messages/${roomId}`);
        setMessages(response.data);
      } catch (error) {
        console.error('Failed to fetch messages', error);
      }
    };

    fetchMessages();

    if (socket) {
      socket.on('receive-message', (message) => {
        setMessages((prev) => [...prev, message]);
      });
    }

    return () => {
      if (socket) {
        socket.off('receive-message');
      }
    };
  }, [roomId, socket]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !socket || !userId) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    socket.emit('send-message', {
      roomId,
      userId,
      content,
    });

    setSending(false);
  };

  // -------------------- UI --------------------
  return (
    <div className="flex flex-col h-full w-full bg-slate-950/40 backdrop-blur-3xl overflow-hidden">
      {/* Header */}
      <div className="h-10 flex items-center justify-between px-4 bg-slate-900/40 border-b border-white/5">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Communication</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter">Live Chat</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/5">
        <div className="space-y-5">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 opacity-30 select-none">
              <MessageSquare className="w-10 h-10 mb-3 text-slate-500" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">End-to-End Encrypted</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = (msg.user_id?._id || msg.user_id) === userId;
              return (
                <div
                  key={msg._id}
                  className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} group`}
                >
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    {!isOwn && (
                      <span className="text-[10px] font-black text-indigo-400/80 uppercase tracking-tight">
                        {msg.user_id?.name || 'Anonymous'}
                      </span>
                    )}
                    <span className="text-[9px] font-bold text-slate-600 uppercase">
                      {format(new Date(msg.createdAt), 'HH:mm')}
                    </span>
                  </div>
                  <div
                    className={`px-4 py-2.5 rounded-2xl max-w-[90%] shadow-2xl transition-all duration-300 hover:scale-[1.02] ${isOwn
                      ? 'bg-indigo-600 text-white shadow-indigo-600/20 rounded-tr-none'
                      : 'bg-slate-800/80 text-slate-100 border border-white/5 rounded-tl-none backdrop-blur-md'
                      }`}
                  >
                    <p className="text-sm font-medium leading-relaxed break-words">{msg.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 bg-slate-900/60 border-t border-white/5">
        <form onSubmit={sendMessage} className="relative group">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Secure message..."
            className="w-full bg-slate-950/80 border border-white/10 rounded-2xl h-11 px-5 pr-12 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="absolute right-2 top-1.5 h-8 w-8 flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-800 transition-all active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
