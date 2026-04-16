import { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import api from '@/lib/api';
import { Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Terminal, ChevronRight, Eraser } from 'lucide-react';
import { toast } from 'sonner';

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

const ExecutionBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    SUCCESS: "bg-green-500/10 text-green-400 border-green-500/20",
    COMPILE_ERROR: "bg-red-500/10 text-red-400 border-red-500/20",
    RUNTIME_ERROR: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    TIME_LIMIT_EXCEEDED: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    SYSTEM_ERROR: "bg-red-500/20 text-red-300 border-red-500/40",
  };
  return (
    <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${styles[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
      {status.replace(/_/g, ' ')}
    </div>
  );
};

export function CodeEditor({ roomId, socket, userId }: CodeEditorProps) {
  const [code, setCode] = useState('// Loading...');
  const [language, setLanguage] = useState('javascript');
  const [userInput, setUserInput] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<{ status: string; time?: number } | null>(null);
  const [isOutputView, setIsOutputView] = useState(false);

  // Load user input from localStorage on mount
  useEffect(() => {
    const savedInput = localStorage.getItem(`input_${roomId}`);
    if (savedInput) {
      setUserInput(savedInput);
    }
  }, [roomId]);

  // Save user input to localStorage when it changes
  const handleInputUpdate = (val: string) => {
    setUserInput(val);
    localStorage.setItem(`input_${roomId}`, val);
  };

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
        if (newCode !== undefined) {
          setCode(newCode);
          setIsOutputView(false);
        }
        if (newLanguage !== undefined) {
          setLanguage(newLanguage);
          setIsOutputView(false);
        }
      });
    }

    return () => {
      if (socket) socket.off('code-update');
    };
  }, [roomId, socket, language]);

  const updateCode = (newCode: string) => {
    setCode(newCode);
    setIsOutputView(false);
    if (socket && roomId && userId) {
      socket.emit('code-change', { roomId, code: newCode, language, userId });
    }
  };

  const updateLanguage = (newLanguage: string) => {
    setLanguage(newLanguage);
    setIsOutputView(false);
    const newCode = DEFAULT_TEMPLATES[newLanguage] || '';
    setCode(newCode);

    if (socket && roomId && userId) {
      socket.emit('code-change', { roomId, code: newCode, language: newLanguage, userId });
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    setIsOutputView(true);
    setOutput("Compiling & Executing...");
    setExecutionResult(null);
    toast.info("Running code...");

    try {
      const formattedInput = userInput.endsWith('\n') ? userInput : userInput + '\n';
      const { data } = await api.post("/run", { language, code, input: formattedInput });

      setOutput(data.output);
      setExecutionResult({ status: data.status, time: data.time });

      if (data.status === 'SUCCESS') toast.success("Execution complete");
      else toast.error(`Finished with ${data.status.replace(/_/g, ' ')}`);

    } catch (err: any) {
      setOutput("Error: Connection to execution server failed.");
      setExecutionResult({ status: 'SYSTEM_ERROR' });
      toast.error("Network error");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Header Toolbar */}
      <div className="h-14 border-b border-white/5 bg-[#161b22] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-6">
          <Select value={language} onValueChange={updateLanguage}>
            <SelectTrigger className="w-44 h-10 bg-[#0d1117] border-white/10 text-white hover:border-blue-500/50 transition-all rounded-lg focus:ring-2 focus:ring-blue-500/20">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#161b22] border-white/10 text-white rounded-lg shadow-2xl">
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value} className="focus:bg-blue-600 focus:text-white cursor-pointer rounded-md m-1">
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {executionResult && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
              <ExecutionBadge status={executionResult.status} />
              {executionResult.time !== undefined && (
                <span className="text-[10px] text-gray-500 font-mono">
                  {executionResult.time}ms
                </span>
              )}
            </div>
          )}
        </div>

        <Button
          onClick={runCode}
          disabled={isRunning}
          className="gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-8 h-10 rounded-lg shadow-lg shadow-green-900/20 transition-all active:scale-95 flex items-center group"
        >
          {isRunning ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
          )}
          {isRunning ? 'RUNNING' : 'RUN'}
        </Button>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#0d1117]">
        <div className="flex-1 relative">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={(value) => updateCode(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'Fira Code', monospace",
              lineNumbers: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 16 },
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              lineHeight: 22,
              wordWrap: 'on',
            }}
          />
        </div>

        {/* Console / Terminal area */}
        <div className="h-1/3 min-h-[160px] flex flex-col bg-[#0d1117] border-t border-white/10">
          <div className="flex items-center bg-[#161b22] border-b border-white/10 h-11 shrink-0 px-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <Terminal className="w-3.5 h-3.5" />
              <span>CONSOLE</span>
              {isOutputView && (
                <span className="flex items-center gap-1.5 before:content-[''] before:w-1 before:h-1 before:bg-gray-600 before:rounded-full text-[10px] text-blue-400/80 uppercase tracking-wider font-bold">
                  Output
                </span>
              )}
              {!isOutputView && (
                <span className="flex items-center gap-1.5 before:content-[''] before:w-1 before:h-1 before:bg-gray-600 before:rounded-full text-[10px] text-green-400/80 uppercase tracking-wider font-bold">
                  Input (stdin)
                </span>
              )}
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              {isOutputView && (
                <button
                  onClick={() => setIsOutputView(false)}
                  className="px-3 py-1 text-[10px] bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3 h-3 rotate-180" />
                  EDIT INPUT
                </button>
              )}
              <button
                className="px-3 py-1 text-[10px] text-gray-500 hover:text-red-400 flex items-center gap-1.5 transition-colors group"
                onClick={() => {
                  if (isOutputView) {
                    setIsOutputView(false);
                    setOutput('');
                  } else {
                    handleInputUpdate('');
                  }
                }}
              >
                <Eraser className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                CLEAR
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {isOutputView ? (
              <div className="h-full flex flex-col font-mono text-[13px] text-gray-300 selection:bg-blue-500/30">
                {/* Input Snapshot */}
                <div className="px-5 py-3 bg-white/[0.02] border-b border-white/5 shrink-0 max-h-[100px] overflow-auto">
                  <div className="flex items-center gap-2 mb-1.5 grayscale opacity-50">
                    <ChevronRight className="w-3 h-3 text-green-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Standard Input</span>
                  </div>
                  <pre className="text-[12px] text-gray-400/80 leading-relaxed whitespace-pre-wrap">{userInput || <span className="italic opacity-50">(No input provided)</span>}</pre>
                </div>

                {/* execution Output */}
                <div className="flex-1 p-5 overflow-auto custom-scrollbar">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400/80">Program Output</span>
                  </div>
                  <pre className={`whitespace-pre-wrap break-all leading-relaxed ${executionResult?.status !== 'SUCCESS' && executionResult?.status ? 'text-red-400' : ''}`}>
                    {output || <span className="text-gray-600 italic">No output yet. Run your code to see the results.</span>}
                  </pre>
                </div>
              </div>
            ) : (
              <textarea
                value={userInput}
                onChange={(e) => handleInputUpdate(e.target.value)}
                placeholder="/* Standard Input: Type data here to provide to your program */"
                className="w-full h-full p-5 bg-transparent text-gray-300 font-mono text-[13px] resize-none focus:outline-none placeholder:text-gray-700 leading-relaxed"
                spellCheck={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
