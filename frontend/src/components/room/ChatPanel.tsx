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
    return () => { if (socket) socket.off('receive-message'); };
  }, [roomId, socket]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !userId) return;
    const content = newMessage.trim();
    setNewMessage('');
    socket.emit('send-message', { roomId, userId, content });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="h-10 border-b px-4 flex items-center justify-between bg-slate-50">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <FiMessageSquare /> Team Chat
        </span>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4 bg-white">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-10 opacity-20">
              <FiMessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-[10px] uppercase font-bold tracking-widest">No messages yet</p>
            </div>
          ) : (
            messages.map((msg) => {
              const userRef = msg.user_id?._id || msg.user_id;
              const isOwn = userRef === userId;
              return (
                <div key={msg._id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1 px-1">
                    {!isOwn && (
                      <span className="text-[10px] font-bold text-blue-600 uppercase">
                        {msg.user_id?.name || 'User'}
                      </span>
                    )}
                    <span className="text-[9px] text-slate-400 font-medium">
                      {format(new Date(msg.createdAt), 'HH:mm')}
                    </span>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${
                    isOwn ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <form onSubmit={sendMessage} className="p-4 border-t bg-slate-50">
        <div className="relative">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-white border border-slate-200 rounded-lg h-10 px-4 pr-10 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
          <button type="submit" disabled={!newMessage.trim()} className="absolute right-2 top-1.5 p-1.5 text-blue-600 hover:text-blue-700 disabled:opacity-30">
            <FiSend className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
