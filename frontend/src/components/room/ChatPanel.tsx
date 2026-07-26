import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Socket } from 'socket.io-client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FiSend, FiMessageSquare } from 'react-icons/fi';
import { format } from 'date-fns';

interface Message {
  _id: string;
  content: string;
  user_id: {
    name: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    return () => { if (socket) socket.off('receive-message'); };
  }, [roomId, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !userId) return;
    const content = newMessage.trim();
    setNewMessage('');
    socket.emit('send-message', { roomId, userId, content });
  };

  return (
    <div className="flex flex-col h-full bg-cyber-dark/80 glassmorphism relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay pointer-events-none z-0"></div>

      <div className="h-10 border-b border-cyber-pink/30 px-4 flex items-center justify-between bg-cyber-darker/50 z-10">
        <span className="text-[10px] font-bold text-cyber-pink uppercase tracking-widest flex items-center gap-2 drop-shadow-[0_0_8px_rgba(255,0,140,0.8)]">
          <FiMessageSquare /> Chat
        </span>
      </div>

      <ScrollArea className="flex-1 p-3 bg-transparent z-10">
        <div className="space-y-2">
          {messages.length === 0 ? (
            <div className="text-center py-10 opacity-40">
              <FiMessageSquare className="w-8 h-8 mx-auto mb-2 text-cyber-pink" />
              <p className="text-[10px] uppercase font-bold tracking-widest text-cyber-pink">No messages yet</p>
            </div>
          ) : (
            messages.map((msg) => {
              const userRef = msg.user_id?._id || msg.user_id;
              const isOwn = userRef === userId;
              return (
                <div key={msg._id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1 mb-0.5 px-1">
                    {!isOwn && (
                      <span className="text-[9px] font-bold text-cyber-pink uppercase tracking-wider">
                        {msg.user_id?.name || 'User'}
                      </span>
                    )}
                    <span className="text-[8px] text-cyber-text-muted font-medium font-mono">
                      {format(new Date(msg.createdAt), 'HH:mm')}
                    </span>
                  </div>
                  <div className={`px-2 py-1 rounded max-w-[75%] text-xs font-mono border ${
                    isOwn 
                      ? 'bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/30 rounded-tr-none shadow-[0_0_10px_rgba(0,245,255,0.1)]' 
                      : 'bg-cyber-pink/10 text-cyber-pink border-cyber-pink/30 rounded-tl-none shadow-[0_0_10px_rgba(255,0,140,0.1)]'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form onSubmit={sendMessage} className="p-3 border-t border-cyber-pink/30 bg-cyber-darker/50 z-10">
        <div className="relative">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-cyber-dark border border-cyber-pink/40 rounded h-10 px-3 pr-10 text-xs focus:ring-1 focus:ring-cyber-pink focus:border-cyber-pink outline-none transition-all text-cyber-text-primary placeholder:text-cyber-text-muted font-mono"
          />
          <button type="submit" disabled={!newMessage.trim()} className="absolute right-1 top-1 p-2 text-cyber-pink hover:text-white hover:bg-cyber-pink hover:shadow-[0_0_10px_rgba(255,0,140,0.6)] disabled:opacity-30 rounded transition-all">
            <FiSend className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
