import { useRef, useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { PenTool, Eraser, Trash2 } from 'lucide-react';

interface WhiteboardProps {
  roomId: string;
  socket?: Socket;
}

export function Whiteboard({ roomId, socket }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color] = useState('#14b8a6');
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  const drawOnCanvas = useCallback((x: number, y: number, lastX: number, lastY: number, drawColor: string, drawTool: 'pen' | 'eraser') => {
    const ctx = getCtx();
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = drawTool === 'eraser' ? 'hsl(222 47% 8%)' : drawColor;
    ctx.lineWidth = drawTool === 'eraser' ? 20 : 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, [getCtx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height - 40;

      const ctx = getCtx();
      if (ctx) {
        ctx.fillStyle = 'hsl(222 47% 8%)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    if (socket) {
      socket.on('draw-data', (data) => {
        drawOnCanvas(data.x, data.y, data.lastX, data.lastY, data.color, data.tool);
      });

      socket.on('clear-whiteboard', () => {
        const canvas = canvasRef.current;
        const ctx = getCtx();
        if (canvas && ctx) {
          ctx.fillStyle = 'hsl(222 47% 8%)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      });
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (socket) {
        socket.off('draw-data');
        socket.off('clear-whiteboard');
      }
    };
  }, [getCtx, socket, drawOnCanvas]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    lastPointRef.current = getPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const pos = getPos(e);
    const lastPoint = lastPointRef.current;

    if (lastPoint) {
      drawOnCanvas(pos.x, pos.y, lastPoint.x, lastPoint.y, color, tool);

      if (socket) {
        socket.emit('draw', {
          roomId,
          x: pos.x,
          y: pos.y,
          lastX: lastPoint.x,
          lastY: lastPoint.y,
          color,
          tool
        });
      }
    }

    lastPointRef.current = pos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };



  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (socket) {
      socket.emit('clear-whiteboard', roomId);
    }
  };


  return (
    <div className="flex flex-col h-full w-full bg-slate-950/40 backdrop-blur-3xl overflow-hidden">
      <div className="h-10 flex items-center justify-between px-4 bg-slate-900/40 border-b border-white/5">
        <div className="flex items-center gap-2">
          <PenTool className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visual Canvas</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950/50 p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setTool('pen')}
              className={`p-1.5 rounded-md transition-all ${tool === 'pen' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <PenTool className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-1.5 rounded-md transition-all ${tool === 'eraser' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={clearCanvas}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <canvas
          ref={canvasRef}
          className="cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <div className="absolute bottom-4 left-4 flex flex-col gap-1">
          <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">Active Tool</span>
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{tool}</span>
        </div>
      </div>
    </div>
  );
}
