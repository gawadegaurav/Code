import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import api from '@/lib/api';
import { Socket } from 'socket.io-client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FiPlay, FiTerminal, FiChevronRight, FiTrash2, FiSquare } from 'react-icons/fi';
import { toast } from 'sonner';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useRef } from 'react';

interface CodeEditorProps {
  roomId: string;
  socket?: Socket;
  userId?: string;
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
];

const DEFAULT_TEMPLATES: Record<string, string> = {
  javascript: `console.log("Hello, JavaScript!");`,
  python: `print("Hello, Python!")`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Java!");\n    }\n}`,
  cpp: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, C++!" << std::endl;\n    return 0;\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, C!\\n");\n    return 0;\n}`,
};

export function CodeEditor({ roomId, socket, userId }: CodeEditorProps) {
  const [code, setCode] = useState('// Loading...');
  const [language, setLanguage] = useState('javascript');
  const [userInput, setUserInput] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);

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
            background: '#ffffff',
            foreground: '#334155',
            cursor: '#2563eb',
            selectionBackground: '#cbd5e1',
          },
          convertEol: true,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        
        // Initial fit and resize listener
        setTimeout(() => fitAddon.fit(), 100);
        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);

        xtermRef.current = term;

        term.onData((data) => {
          socket.emit("terminal-input", data);
          // Local echo for visibility
          if (data === "\r") {
            term.write("\r\n");
          } else if (data === "\x7f") { // Backspace
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
        
        // Cleanup listener on unmount
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
    if (!socket) return toast.error("Socket not connected");
    setIsRunning(true);
    xtermRef.current?.clear();
    xtermRef.current?.focus();
    socket.emit("run-code", { language, code });
  };

  const stopCode = () => {
    if (socket) {
      socket.emit("stop-code");
    }
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="h-12 border-b flex items-center justify-between px-4 bg-slate-50">
        <div className="flex items-center gap-4">
          <Select value={language} onValueChange={updateLanguage}>
            <SelectTrigger className="w-40 h-8 bg-white text-xs">
              <div className="flex items-center gap-2">
                <FiTerminal className="text-blue-600" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(lang => (
                <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          onClick={isRunning ? stopCode : runCode}
          className={`${isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white text-xs font-bold px-4 h-8 rounded-md flex items-center gap-2 disabled:opacity-50 transition-colors`}
        >
          {isRunning ? <FiSquare className="text-[10px]" /> : <FiPlay />}
          {isRunning ? 'STOP' : 'RUN'}
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={(val) => updateCode(val || '')}
            theme="light"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 10 },
            }}
          />
        </div>

        {/* Real-time Terminal */}
        <div className="h-64 border-t flex flex-col bg-white">
          <div className="h-8 border-b border-slate-200 flex items-center justify-between px-4 bg-slate-50">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <FiTerminal className="text-blue-600" /> Interactive Terminal
            </span>
            <div className="flex gap-4">
              <button 
                onClick={() => xtermRef.current?.clear()} 
                className="text-[10px] font-bold text-slate-500 hover:text-white flex items-center gap-1"
              >
                <FiTrash2 /> CLEAR
              </button>
            </div>
          </div>
          <div className="flex-1 p-2 overflow-hidden" ref={terminalRef} />
        </div>
      </div>
    </div>
  );
}
