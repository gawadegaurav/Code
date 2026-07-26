import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import api from '@/lib/api';
import { Socket } from 'socket.io-client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FiPlay, FiTerminal, FiTrash2, FiSquare, FiCpu, FiCode } from 'react-icons/fi';
import { toast } from 'sonner';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useRef } from 'react';

interface CodeEditorProps {
  roomId: string;
  socket?: Socket;
  userId?: string;
  onCodeChange?: (code: string) => void;
  onLanguageChange?: (language: string) => void;
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
];

const DEFAULT_TEMPLATES: Record<string, string> = {
  javascript: `console.log("Welcome to Spark OS.");`,
  python: `print("Welcome to Spark OS.")`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Welcome to Spark OS.");\n    }\n}`,
  cpp: `#include <iostream>\n\nint main() {\n    std::cout << "Welcome to Spark OS." << std::endl;\n    return 0;\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Welcome to Spark OS.\\n");\n    return 0;\n}`,
};

export function CodeEditor({ roomId, socket, userId, onCodeChange, onLanguageChange }: CodeEditorProps) {
  const [code, setCode] = useState('// Initializing Code Editor...');
  const [language, setLanguage] = useState('javascript');
  const [isRunning, setIsRunning] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);

  useEffect(() => {
    onCodeChange?.(code);
  }, [code, onCodeChange]);

  useEffect(() => {
    onLanguageChange?.(language);
  }, [language, onLanguageChange]);

  useEffect(() => {
    const fetchCode = async () => {
      try {
        const response = await api.get(`/snapshots/${roomId}`);
        if (response.data) {
          setCode(response.data.content || DEFAULT_TEMPLATES[response.data.language || 'javascript']);
          setLanguage(response.data.language || 'javascript');
        } else {
          setCode(DEFAULT_TEMPLATES[language]);
        }
      } catch (error) {
        setCode(DEFAULT_TEMPLATES[language]);
      }
    };

    fetchCode();

    if (socket) {
      socket.on('code-update', ({ code: newCode, language: newLanguage }) => {
        if (newCode !== undefined) setCode(newCode);
        if (newLanguage !== undefined) setLanguage(newLanguage);
      });

      // Initialize Terminal
      if (terminalRef.current && !xtermRef.current) {
        const term = new Terminal({
          cursorBlink: true,
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          theme: {
            background: '#0B1020',
            foreground: '#00F5FF',
            cursor: '#00F5FF',
            cursorAccent: '#050816',
            selectionBackground: 'rgba(0, 245, 255, 0.3)',
            black: '#000000',
            red: '#FF008C',
            green: '#39FF14',
            yellow: '#F59E0B',
            blue: '#3B82F6',
            magenta: '#B026FF',
            cyan: '#00F5FF',
            white: '#E5F6FF',
          },
          convertEol: true,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        
        // Initial fit and resize listener
        setTimeout(() => {
          fitAddon.fit();
          term.write('\x1b[1;36mTerminal initialized...\x1b[0m\r\n');
        }, 100);
        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);

        xtermRef.current = term;

        term.onData((data) => {
          socket.emit("terminal-input", data);
          if (data === "\r") {
            term.write("\r\n");
          } else if (data === "\x7f") {
            term.write("\b \b");
          } else {
            term.write(data);
          }
        });

        socket.on("terminal-output", (data) => {
          term.write(data);
          if (data.includes("Process exited")) {
            setIsRunning(false);
          }
        });
        
        (term as any)._handleResize = handleResize;
      }
    }

    return () => { 
      if (socket) {
        socket.off('code-update');
        socket.off('terminal-output');
      }
      if (xtermRef.current) {
        window.removeEventListener('resize', (xtermRef.current as any)._handleResize);
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
    };
  }, [roomId, socket]);

  const updateCode = (newCode: string) => {
    setCode(newCode);
    if (socket && roomId && userId) {
      socket.emit('code-change', { roomId, code: newCode, language, userId });
    }
  };

  const updateLanguage = (newLanguage: string) => {
    setLanguage(newLanguage);
    const newCode = DEFAULT_TEMPLATES[newLanguage] || '';
    setCode(newCode);
    if (socket && roomId && userId) {
      socket.emit('code-change', { roomId, code: newCode, language: newLanguage, userId });
    }
  };

  const runCode = () => {
    if (!socket) return toast.error("Connection required");
    setIsRunning(true);
    xtermRef.current?.clear();
    xtermRef.current?.focus();
    xtermRef.current?.write('\x1b[1;32m> Running code...\x1b[0m\r\n');
    socket.emit("run-code", { language, code });
  };

  const stopCode = () => {
    if (socket) {
      socket.emit("stop-code");
      xtermRef.current?.write('\r\n\x1b[1;31m> Process stopped.\x1b[0m\r\n');
    }
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col h-full bg-cyber-dark relative">
      {/* Toolbar */}
      <div className="h-12 border-b border-cyber-cyan/30 flex items-center justify-between px-4 bg-cyber-darker/80 backdrop-blur z-10">
        <div className="flex items-center gap-4">
          <Select value={language} onValueChange={updateLanguage}>
            <SelectTrigger className="w-44 h-8 bg-cyber-dark border-cyber-cyan/50 text-cyber-cyan text-xs font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(0,245,255,0.1)] hover:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan">
              <div className="flex items-center gap-2">
                <FiCode className="text-cyber-cyan drop-shadow-[0_0_5px_rgba(0,245,255,0.8)]" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-cyber-dark border-cyber-cyan/50 text-cyber-cyan font-mono text-xs uppercase tracking-wider">
              {LANGUAGES.map(lang => (
                <SelectItem key={lang.value} value={lang.value} className="hover:bg-cyber-cyan/20 focus:bg-cyber-cyan/20 cursor-pointer">
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          onClick={isRunning ? stopCode : runCode}
          className={`text-xs font-bold font-mono tracking-widest uppercase px-6 h-8 rounded flex items-center gap-2 transition-all duration-300 border ${
            isRunning 
              ? 'bg-cyber-pink/20 text-cyber-pink border-cyber-pink hover:bg-cyber-pink hover:text-white shadow-[0_0_15px_rgba(255,0,140,0.4)]' 
              : 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan hover:bg-cyber-cyan hover:text-cyber-dark shadow-[0_0_15px_rgba(0,245,255,0.4)]'
          }`}
        >
          {isRunning ? <FiSquare className="text-[10px]" /> : <FiPlay />}
          {isRunning ? 'Stop' : 'Run'}
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 relative">
        <div className="flex-1 overflow-hidden relative">
          {/* Animated scanline overlay for editor */}
          <div className="absolute inset-0 pointer-events-none scanlines opacity-10 z-10"></div>
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={(val) => updateCode(val || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: true, renderCharacters: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 16, bottom: 16 },
              cursorBlinking: 'smooth',
              cursorStyle: 'block',
              renderLineHighlight: 'all',
            }}
          />
        </div>

        {/* Real-time Terminal */}
        <div className="h-64 border-t border-cyber-cyan/30 flex flex-col bg-cyber-darker relative z-10">
          <div className="h-8 border-b border-cyber-cyan/20 flex items-center justify-between px-4 bg-cyber-dark/80">
            <span className="text-[10px] font-bold text-cyber-cyan uppercase tracking-widest font-mono flex items-center gap-2 drop-shadow-[0_0_5px_rgba(0,245,255,0.5)]">
              <FiTerminal /> Terminal
            </span>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  xtermRef.current?.clear();
                  xtermRef.current?.write('\x1b[1;36mTerminal initialized...\x1b[0m\r\n');
                }} 
                className="text-[9px] font-bold text-cyber-pink hover:text-white uppercase tracking-widest font-mono flex items-center gap-1 transition-colors"
              >
                <FiTrash2 /> Clear
              </button>
            </div>
          </div>
          <div className="flex-1 p-2 overflow-hidden relative">
            <div className="absolute inset-0 pointer-events-none scanlines opacity-20 z-10"></div>
            <div className="h-full w-full" ref={terminalRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
