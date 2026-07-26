import { useRef, useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { FiEdit3, FiTrash2, FiGrid } from 'react-icons/fi';
import { LuEraser } from 'react-icons/lu';

interface WhiteboardProps {
  roomId: string;
  socket?: Socket;
}

export function Whiteboard({ roomId, socket }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color] = useState('#39FF14'); // cyber-lime
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
    ctx.strokeStyle = drawTool === 'eraser' ? '#0B1020' : drawColor;
    ctx.lineWidth = drawTool === 'eraser' ? 30 : 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (drawTool === 'pen') {
      ctx.shadowBlur = 15;
      ctx.shadowColor = drawColor;
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.stroke();
  }, [getCtx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      // Save current content to temp canvas before resizing
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(canvas, 0, 0);
      }

      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      const ctx = getCtx();
      if (ctx) {
        ctx.fillStyle = '#0B1020'; // background
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw the content back
        ctx.drawImage(tempCanvas, 0, 0);
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
          ctx.fillStyle = '#0B1020';
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
    ctx.fillStyle = '#0B1020';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (socket) socket.emit('clear-whiteboard', roomId);
  };

  return (
    <div className="flex flex-col h-full bg-cyber-dark/80 relative">
      <div className="h-10 border-b border-cyber-lime/30 px-4 flex items-center justify-between bg-cyber-darker/50 z-10">
        <span className="text-[10px] font-bold text-cyber-lime uppercase tracking-widest flex items-center gap-2 drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]">
          <FiEdit3 /> Whiteboard
        </span>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setTool('pen')} 
            className={`p-1.5 rounded transition-all ${tool === 'pen' ? 'text-cyber-dark bg-cyber-lime shadow-[0_0_10px_rgba(57,255,20,0.8)]' : 'text-cyber-lime hover:bg-cyber-lime/20'}`}
          >
            <FiEdit3 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setTool('eraser')} 
            className={`p-1.5 rounded transition-all ${tool === 'eraser' ? 'text-cyber-dark bg-cyber-lime shadow-[0_0_10px_rgba(57,255,20,0.8)]' : 'text-cyber-lime hover:bg-cyber-lime/20'}`}
          >
            <LuEraser className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-cyber-lime/30 mx-1" />
          <button onClick={clearCanvas} className="p-1.5 text-cyber-pink hover:bg-cyber-pink/20 hover:shadow-[0_0_10px_rgba(255,0,140,0.5)] rounded transition-all">
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 relative bg-transparent overflow-hidden">
        {/* Cyberpunk Grid Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'linear-gradient(#39FF14 1px, transparent 1px), linear-gradient(90deg, #39FF14 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            backgroundPosition: 'center center'
          }}
        />
        
        <canvas
          ref={canvasRef}
          className="cursor-crosshair touch-none absolute inset-0 z-10"
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
