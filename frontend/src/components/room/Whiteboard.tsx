import { useRef, useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { FiEdit3, FiTrash2 } from 'react-icons/fi';
import { LuEraser } from 'react-icons/lu';

interface WhiteboardProps {
  roomId: string;
  socket?: Socket;
}

export function Whiteboard({ roomId, socket }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color] = useState('#2563eb'); // blue-600
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
    ctx.strokeStyle = drawTool === 'eraser' ? '#ffffff' : drawColor;
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
      canvas.height = rect.height;
      
      const ctx = getCtx();
      if (ctx) {
        ctx.fillStyle = '#ffffff';
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
        const ctx = getCtx();
        if (ctx && canvas) {
          ctx.fillStyle = '#ffffff';
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
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
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
        socket.emit('draw', { roomId, x: pos.x, y: pos.y, lastX: lastPoint.x, lastY: lastPoint.y, color, tool });
      }
    }
    lastPointRef.current = pos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const clearCanvas = () => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (socket) socket.emit('clear-whiteboard', roomId);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="h-10 border-b px-4 flex items-center justify-between bg-slate-50">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <FiEdit3 /> Canvas
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => setTool('pen')} className={`p-1.5 rounded ${tool === 'pen' ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-400'}`}>
            <FiEdit3 className="w-4 h-4" />
          </button>
          <button onClick={() => setTool('eraser')} className={`p-1.5 rounded ${tool === 'eraser' ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-400'}`}>
            <LuEraser className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <button onClick={clearCanvas} className="p-1.5 text-slate-400 hover:text-red-600">
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 relative bg-white">
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
      </div>
    </div>
  );
}
