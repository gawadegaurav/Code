import { useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, Loader2 } from 'lucide-react';

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
    <div className="flex flex-col h-full w-full bg-slate-950/40 backdrop-blur-3xl overflow-hidden">
      {/* Header */}
      <div className="h-10 flex items-center justify-between px-4 bg-slate-900/40 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-12 transition-transform" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Assistant</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-[9px] font-black text-purple-500 uppercase tracking-tighter">GPT-4 Node</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/5">
        <div className="space-y-5">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 shadow-2xl shadow-indigo-500/5">
                <Sparkles className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Workspace Intelligence</p>
                <p className="text-xs text-slate-600 font-medium max-w-[200px] mx-auto">
                  Debug code, explain concepts, or refactor your logic instantly.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}
              >
                <div
                  className={`px-4 py-2.5 rounded-2xl max-w-[92%] transition-all duration-300 hover:scale-[1.01] ${msg.role === 'user'
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 rounded-tr-none'
                    : 'bg-slate-800/80 text-slate-200 border border-white/5 rounded-tl-none backdrop-blur-md shadow-2xl'
                    }`}
                >
                  <p className="text-[13px] font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Processing</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 bg-slate-900/60 border-t border-white/5">
        <div className="relative flex flex-col gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Query the engine..."
            className="w-full bg-slate-950/80 border border-white/10 rounded-2xl h-24 p-4 text-sm text-slate-200 placeholder:text-slate-700 resize-none focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all scrollbar-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="absolute bottom-2 right-2 h-9 px-4 flex items-center gap-2 rounded-xl bg-indigo-600 text-white font-black text-[10px] tracking-widest uppercase hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            TRANSMIT
          </button>
        </div>
      </div>
    </div>
  );
}
