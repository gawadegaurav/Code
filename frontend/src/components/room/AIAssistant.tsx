import { useState } from 'react';
import api from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FiCpu, FiSend, FiLoader } from 'react-icons/fi';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
  roomId: string;
  language?: string;
  code?: string;
}

export function AIAssistant({ roomId, language, code }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await api.post('/ai', {
        prompt: userMessage,
        language,
        code,
      });

      const reply = response.data?.reply || 'No response from AI.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error('AI error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="h-10 border-b px-4 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <FiCpu className="text-purple-600" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-[9px] font-bold text-purple-600 uppercase">Active</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 bg-white">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-10 opacity-20">
              <FiCpu className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-[10px] uppercase font-bold tracking-widest leading-none mb-1">Neural Engine</p>
              <p className="text-[9px] font-medium text-slate-500">Ask for help with your code.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${
                  msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-purple-50 text-slate-800 border border-purple-100 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="px-3 py-1.5 rounded-xl bg-slate-50 border flex items-center gap-2">
                <FiLoader className="w-3 h-3 animate-spin text-purple-600" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thinking</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-slate-50">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask AI..."
            className="w-full bg-white border border-slate-200 rounded-lg h-16 p-3 pr-10 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 p-1.5 text-blue-600 hover:text-blue-700 disabled:opacity-30"
          >
            <FiSend className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
