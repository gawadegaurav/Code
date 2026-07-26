import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FiVideo,
  FiVideoOff,
  FiMic,
  FiMicOff,
  FiMonitor,
  FiPhoneOff,
  FiMaximize2,
  FiMinimize2
} from "react-icons/fi";
import { Socket } from "socket.io-client";

interface VideoConferenceProps {
  roomId: string;
  socket?: Socket;
}

interface PeerInfo {
  id: string;
  stream: MediaStream;
}

export function VideoConference({ roomId, socket }: VideoConferenceProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  const [cameraOn, setCameraOn] = useState(() => sessionStorage.getItem(`cameraOn_${roomId}`) !== 'false');
  const [micOn, setMicOn] = useState(() => sessionStorage.getItem(`micOn_${roomId}`) !== 'false');
  const [screenOn, setScreenOn] = useState(false);
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  // Helper to create and track a peer connection
  const createPeerConnection = (peerId: string, streamToUse: MediaStream) => {
    if (pcsRef.current.has(peerId)) return pcsRef.current.get(peerId)!;

    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pcsRef.current.set(peerId, pc);

    // Add local tracks
    streamToUse.getTracks().forEach((track) => pc.addTrack(track, streamToUse));

    pc.ontrack = (event) => {
      setPeers((prev) => {
        if (prev.some((p) => p.id === peerId)) return prev;
        return [...prev, { id: peerId, stream: event.streams[0] }];
      });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("webrtc-signal", { roomId, target: peerId, signal: { type: "ice", content: event.candidate } });
      }
    };

    return pc;
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("all-users", async (users: string[]) => {
      if (!localStreamRef.current) return;
      for (const peerId of users) {
        const pc = createPeerConnection(peerId, localStreamRef.current);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc-signal", { roomId, target: peerId, signal: { type: "offer", content: offer } });
      }
    });

    socket.on("user-joined", ({ userId }) => {
      if (localStreamRef.current) {
        createPeerConnection(userId, localStreamRef.current);
      }
    });

    socket.on("webrtc-signal", async ({ signal, from }) => {
      if (!from || !localStreamRef.current) return;

      const pc = createPeerConnection(from, localStreamRef.current);

      if (signal.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.content));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-signal", { roomId, target: from, signal: { type: "answer", content: answer } });
      } else if (signal.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.content));
      } else if (signal.type === "ice") {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.content));
        } catch (e) {
          console.error("Error adding ice candidate:", e);
        }
      }
    });

    socket.on("user-left", ({ userId }) => {
      const pc = pcsRef.current.get(userId);
      if (pc) {
        pc.close();
        pcsRef.current.delete(userId);
      }
      setPeers((prev) => prev.filter((p) => p.id !== userId));
      setFullscreenIndex(null);
    });

    const shouldAutoJoin = sessionStorage.getItem(`videoActive_${roomId}`) === "true";
    if (shouldAutoJoin && !localStreamRef.current) {
      startMedia();
    }

    return () => {
      socket.off("all-users");
      socket.off("user-joined");
      socket.off("webrtc-signal");
      socket.off("user-left");
      
      pcsRef.current.forEach((pc) => pc.close());
      pcsRef.current.clear();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [roomId, socket]);

  const startMedia = async () => {
    try {
      if (localStreamRef.current) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      stream.getVideoTracks().forEach((t) => (t.enabled = cameraOn));
      stream.getAudioTracks().forEach((t) => (t.enabled = micOn));

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      sessionStorage.setItem(`videoActive_${roomId}`, "true");

      // Notify the room that we are ready to connect
      socket?.emit("join-room", roomId);
    } catch (err) {
      console.error("Failed to start media:", err);
      sessionStorage.removeItem(`videoActive_${roomId}`);
    }
  };

  const toggleCamera = async () => {
    if (!localStreamRef.current) {
      await startMedia();
      return;
    }
    localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !cameraOn));
    setCameraOn(!cameraOn);
    sessionStorage.setItem(`cameraOn_${roomId}`, (!cameraOn).toString());
  };

  const toggleMic = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !micOn));
    setMicOn(!micOn);
    sessionStorage.setItem(`micOn_${roomId}`, (!micOn).toString());
  };

  const toggleScreen = async () => {
    if (screenOn) {
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      pcsRef.current.forEach((pc) => {
        pc.getSenders().forEach((sender) => {
          if (sender.track?.kind === "video" && camTrack) sender.replaceTrack(camTrack);
        });
      });
      screenStream?.getTracks().forEach((t) => t.stop());
      setScreenStream(null);
      setScreenOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = stream.getVideoTracks()[0];
      pcsRef.current.forEach((pc) => {
        pc.getSenders().forEach((sender) => {
          if (sender.track?.kind === "video") sender.replaceTrack(screenTrack);
        });
      });
      setScreenStream(stream);
      screenTrack.onended = () => toggleScreen();
      setScreenOn(true);
      setFullscreenIndex(0);
    } catch (err) {
      console.error("Screen share failed:", err);
    }
  };

  const endCall = () => {
    sessionStorage.removeItem(`videoActive_${roomId}`);
    pcsRef.current.forEach((pc) => pc.close());
    pcsRef.current.clear();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setPeers([]);
    setScreenOn(false);
    setScreenStream(null);
  };

  const allStreams: ("you" | PeerInfo)[] = ["you", ...peers];

  return (
    <div className="relative h-full w-full flex flex-col bg-transparent">
      {/* Video Grid */}
      <div className="flex-1 p-2 overflow-hidden flex items-center justify-center">
        {fullscreenIndex !== null ? (
          <div className="flex flex-col lg:flex-row w-full h-full gap-2">
            {/* Main Spotlight Video */}
            <div className="lg:w-3/4 w-full h-[60vh] lg:h-full relative bg-cyber-darker rounded border border-cyber-pink/50 overflow-hidden shadow-[0_0_20px_rgba(255,0,140,0.3)]">
              <div className="absolute inset-0 scanlines opacity-30 pointer-events-none z-10"></div>
              <video
                autoPlay playsInline muted={allStreams[fullscreenIndex] === "you"}
                ref={(el) => {
                  if (el) {
                    if (allStreams[fullscreenIndex] === "you") {
                      el.srcObject = screenOn ? screenStream : localStream;
                    } else {
                      el.srcObject = (allStreams[fullscreenIndex] as PeerInfo).stream;
                    }
                  }
                }}
                className="w-full h-full object-contain mix-blend-screen opacity-90 filter contrast-125 saturate-150"
              />
              <div className="absolute bottom-4 left-4 bg-cyber-dark/80 backdrop-blur border border-cyber-pink/50 px-3 py-1.5 rounded text-[10px] font-bold text-cyber-pink uppercase tracking-widest z-20">
                {allStreams[fullscreenIndex] === "you" ? (screenOn ? "Your Screen" : "You") : `Participant ${fullscreenIndex}`}
              </div>
              <button
                onClick={() => setFullscreenIndex(null)}
                className="absolute top-4 right-4 p-2 bg-cyber-dark/80 text-cyber-pink border border-cyber-pink/50 rounded z-20 hover:bg-cyber-pink hover:text-white transition-colors"
              >
                <FiMinimize2 />
              </button>
            </div>
            
            {/* Sidebar for others */}
            <div className="lg:w-1/4 w-full flex-1 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto">
              {allStreams.map((stream, i) => {
                if (i === fullscreenIndex) return null;
                const isYou = stream === "you";
                return (
                  <div
                    key={i}
                    onClick={() => setFullscreenIndex(i)}
                    className="relative shrink-0 w-48 lg:w-full aspect-video bg-cyber-darker rounded border border-cyber-cyan/30 overflow-hidden shadow-[0_0_10px_rgba(0,245,255,0.1)] cursor-pointer hover:border-cyber-cyan/80 transition-colors group"
                  >
                    <div className="absolute inset-0 scanlines opacity-30 pointer-events-none z-10"></div>
                    <video
                      autoPlay playsInline muted={isYou}
                      ref={(el) => {
                        if (isYou && el) el.srcObject = localStream; // Always show local camera in PiP grid
                        if (!isYou && el) el.srcObject = (stream as PeerInfo).stream;
                      }}
                      className="w-full h-full object-cover mix-blend-screen opacity-90 filter contrast-125 saturate-150"
                    />
                    <div className="absolute bottom-2 left-2 bg-cyber-dark/80 backdrop-blur border border-cyber-cyan/50 px-2 py-1 rounded text-[8px] font-bold text-cyber-cyan uppercase tracking-widest z-20">
                      {isYou ? "You (Camera)" : `Participant ${i}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            className="grid gap-2 w-full h-full auto-rows-fr"
            style={{ gridTemplateColumns: allStreams.length === 1 ? '1fr' : `repeat(auto-fit, minmax(280px, 1fr))` }}
          >
            {allStreams.map((stream, i) => {
              const isYou = stream === "you";
              return (
                <div
                  key={i}
                  className="relative bg-cyber-darker rounded border border-cyber-pink/30 overflow-hidden shadow-[0_0_15px_rgba(255,0,140,0.2)] flex items-center justify-center group w-full h-full"
                >
                  <div className="absolute inset-0 scanlines opacity-30 pointer-events-none z-10"></div>
                  <video
                    autoPlay playsInline muted={isYou}
                    ref={(el) => {
                      if (isYou && el) el.srcObject = screenOn ? screenStream : localStream;
                      if (!isYou && el) el.srcObject = (stream as PeerInfo).stream;
                    }}
                    className="w-full h-full object-cover mix-blend-screen opacity-90 filter contrast-125 saturate-150"
                  />
                  
                  {/* HUD Overlay */}
                  <div className="absolute bottom-4 left-4 bg-cyber-dark/80 backdrop-blur border border-cyber-pink/50 px-3 py-1.5 rounded text-[10px] font-bold text-cyber-pink uppercase tracking-widest z-20">
                    {isYou ? (screenOn ? "Your Screen" : "You") : `Participant ${i}`}
                  </div>

                  <div className="absolute top-4 left-4 flex gap-1 z-20">
                    <div className="w-2 h-2 rounded-full bg-cyber-pink animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-cyber-cyan animate-pulse delay-75"></div>
                  </div>
                  
                  <button
                    onClick={() => setFullscreenIndex(i)}
                    className="absolute top-4 right-4 p-2 bg-cyber-dark/80 text-cyber-pink border border-cyber-pink/50 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-cyber-pink hover:text-white"
                  >
                    <FiMaximize2 />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Picture-in-Picture Camera when Screen Sharing */}
      {screenOn && localStream && (
        <div className="absolute bottom-24 right-6 w-56 aspect-video bg-cyber-darker rounded border border-cyber-cyan/50 overflow-hidden shadow-[0_0_20px_rgba(0,245,255,0.4)] z-30 group animate-in fade-in slide-in-from-right-4 transition-all hover:scale-105">
          <div className="absolute inset-0 scanlines opacity-30 pointer-events-none z-10"></div>
          <video
            autoPlay playsInline muted
            ref={(el) => { if (el) el.srcObject = localStream; }}
            className="w-full h-full object-cover mix-blend-screen filter contrast-125 saturate-150"
          />
          <div className="absolute bottom-2 left-2 bg-cyber-dark/80 backdrop-blur border border-cyber-cyan/50 px-2 py-1 rounded text-[8px] font-bold text-cyber-cyan uppercase tracking-widest z-20">
            Camera
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="h-16 border-t border-cyber-pink/30 bg-cyber-darker/80 backdrop-blur flex items-center justify-center gap-4 shrink-0 relative z-20">
        <Button 
          onClick={toggleMic} 
          className={`rounded-full w-10 h-10 p-0 border transition-all ${micOn ? 'bg-cyber-dark border-cyber-cyan text-cyber-cyan shadow-[0_0_10px_rgba(0,245,255,0.4)] hover:bg-cyber-cyan hover:text-white' : 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'}`}
        >
          {micOn ? <FiMic className="w-4 h-4" /> : <FiMicOff className="w-4 h-4" />}
        </Button>
        <Button 
          onClick={toggleCamera} 
          className={`rounded-full w-10 h-10 p-0 border transition-all ${cameraOn ? 'bg-cyber-dark border-cyber-cyan text-cyber-cyan shadow-[0_0_10px_rgba(0,245,255,0.4)] hover:bg-cyber-cyan hover:text-white' : 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'}`}
        >
          {cameraOn ? <FiVideo className="w-4 h-4" /> : <FiVideoOff className="w-4 h-4" />}
        </Button>
        <Button 
          onClick={toggleScreen} 
          className={`rounded-full w-10 h-10 p-0 border transition-all ${screenOn ? 'bg-cyber-pink border-cyber-pink text-white shadow-[0_0_15px_rgba(255,0,140,0.6)]' : 'bg-cyber-dark border-cyber-cyan text-cyber-cyan shadow-[0_0_10px_rgba(0,245,255,0.4)] hover:bg-cyber-cyan hover:text-white'}`}
        >
          <FiMonitor className="w-4 h-4" />
        </Button>
        <div className="w-px h-8 bg-cyber-pink/30 mx-2" />
        <Button 
          onClick={endCall} 
          className="rounded-full w-10 h-10 p-0 bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)] border-0"
        >
          <FiPhoneOff className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
