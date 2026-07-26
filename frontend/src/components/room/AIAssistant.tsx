import { useState, useRef, useEffect } from 'react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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
        { role: 'assistant', content: 'Failed to connect to AI. Try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const prompts = ["Optimize Algorithm", "Debug Runtime Error", "Generate Boilerplate", "Explain Complexity"];

  return (
    <div className="flex flex-col h-full bg-cyber-dark/80 glassmorphism relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay pointer-events-none z-0"></div>
      
      {/* Header */}
      <div className="h-10 border-b border-cyber-purple/30 px-4 flex items-center justify-between bg-cyber-darker/50 z-10">
        <div className="flex items-center gap-2">
          <FiCpu className="text-cyber-purple drop-shadow-[0_0_8px_rgba(176,38,255,0.8)]" />
          <span className="text-[10px] font-bold text-cyber-purple uppercase tracking-widest">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1.5 border border-cyber-lime/30 bg-cyber-lime/10 px-1.5 py-0.5 rounded shadow-[0_0_5px_rgba(57,255,20,0.2)]">
          <div className="w-1.5 h-1.5 rounded-full bg-cyber-lime animate-pulse shadow-[0_0_5px_#39FF14]" />
          <span className="text-[9px] font-bold text-cyber-lime uppercase tracking-widest">Online</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 bg-transparent z-10">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-6 opacity-80">
              <div className="w-12 h-12 rounded-full border border-cyber-purple flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(176,38,255,0.3)] relative">
                <div className="absolute inset-0 bg-cyber-purple/20 rounded-full animate-pulse-glow"></div>
                <FiCpu className="w-6 h-6 text-cyber-purple relative z-10" />
              </div>
              <p className="text-[10px] uppercase font-bold tracking-widest leading-none mb-4 text-cyber-cyan">How can I help you?</p>
              <div className="flex flex-wrap gap-2 justify-center px-4">
                {prompts.map((p) => (
                  <button 
                    key={p} 
                    onClick={() => setInput(p)}
                    className="text-[9px] uppercase tracking-wider font-bold px-2 py-1 border border-cyber-purple/30 text-cyber-purple hover:bg-cyber-purple hover:text-white transition-all rounded"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-3 py-2 rounded max-w-[90%] text-sm border font-mono ${
                  msg.role === 'user' 
                    ? 'bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan rounded-tr-none shadow-[0_0_10px_rgba(0,245,255,0.1)]' 
                    : 'bg-cyber-purple/10 border-cyber-purple/30 text-cyber-purple rounded-tl-none shadow-[0_0_10px_rgba(176,38,255,0.1)]'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="px-3 py-1.5 rounded bg-cyber-purple/10 border border-cyber-purple/30 flex items-center gap-2 shadow-[0_0_10px_rgba(176,38,255,0.2)]">
                <FiLoader className="w-3 h-3 animate-spin text-cyber-purple" />
                <span className="text-[10px] font-bold text-cyber-purple uppercase tracking-widest">Thinking</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-cyber-purple/30 bg-cyber-darker/50 z-10">
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
            className="w-full bg-cyber-dark border border-cyber-purple/40 rounded h-12 p-3 pr-10 text-xs focus:ring-1 focus:ring-cyber-purple focus:border-cyber-purple outline-none transition-all resize-none text-cyber-text-primary placeholder:text-cyber-text-muted font-mono"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 p-1.5 text-cyber-purple hover:text-white hover:bg-cyber-purple hover:shadow-[0_0_10px_rgba(176,38,255,0.6)] disabled:opacity-30 rounded transition-all"
          >
            <FiSend className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
