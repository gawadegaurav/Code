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

export function VideoConference({ roomId, socket }: VideoConferenceProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const [cameraOn, setCameraOn] = useState(() => sessionStorage.getItem(`cameraOn_${roomId}`) !== 'false');
  const [micOn, setMicOn] = useState(() => sessionStorage.getItem(`micOn_${roomId}`) !== 'false');
  const [screenOn, setScreenOn] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!socket) return;
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pcRef.current = pc;

    pc.ontrack = (event) => {
      setRemoteStreams((prev) => {
        if (prev.find((s) => s.id === event.streams[0].id)) return prev;
        return [...prev, event.streams[0]];
      });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-signal", { roomId, signal: { type: "ice", content: event.candidate } });
      }
    };

    socket.on("webrtc-signal", async ({ signal }) => {
      console.log("Received signal:", signal.type);
      if (signal.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.content));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-signal", { roomId, signal: { type: "answer", content: answer } });
      } else if (signal.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.content));
      } else if (signal.type === "ice") {
        try { await pc.addIceCandidate(new RTCIceCandidate(signal.content)); } catch (e) { }
      }
    });

    socket.on("user-joined", () => {
      // If we are already in a call, send an offer to the new participant
      if (localStreamRef.current) {
        sendOffer();
      }
    });

    // Auto-join if previously active
    const shouldAutoJoin = sessionStorage.getItem(`videoActive_${roomId}`) === "true";
    if (shouldAutoJoin && !localStreamRef.current) {
      startMedia();
    }

    return () => {
      pc.close();
      socket.off("webrtc-signal");
      socket.off("user-joined");
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [roomId, socket]);

  const sendOffer = async () => {
    if (!pcRef.current || !socket) return;
    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    socket.emit("webrtc-signal", { roomId, signal: { type: "offer", content: offer } });
  };

  const startMedia = async () => {
    try {
      if (localStreamRef.current) return;
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Apply persisted states to tracks
      stream.getVideoTracks().forEach(t => t.enabled = cameraOn);
      stream.getAudioTracks().forEach(t => t.enabled = micOn);

      stream.getTracks().forEach((track) => pcRef.current?.addTrack(track, stream));

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      await sendOffer();
      sessionStorage.setItem(`videoActive_${roomId}`, "true");
    } catch (err) {
      console.error("Failed to start media:", err);
      sessionStorage.removeItem(`videoActive_${roomId}`);
    }
  };

  const toggleCamera = async () => {
    if (!localStreamRef.current) { await startMedia(); return; }
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
      pcRef.current?.getSenders().forEach((sender) => {
        if (sender.track?.kind === "video" && camTrack) sender.replaceTrack(camTrack);
      });
      screenStream?.getTracks().forEach(t => t.stop());
      setScreenStream(null);
      setScreenOn(false); 
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = stream.getVideoTracks()[0];
      pcRef.current?.getSenders().forEach((sender) => {
        if (sender.track?.kind === "video") sender.replaceTrack(screenTrack);
      });
      setScreenStream(stream);
      screenTrack.onended = () => toggleScreen();
      setScreenOn(true);
    } catch (err) {
      console.error("Screen share failed:", err);
    }
  };

  const endCall = () => {
    sessionStorage.removeItem(`videoActive_${roomId}`);
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    window.location.reload();
  };

  const allStreams: ("you" | MediaStream)[] = ["you", ...remoteStreams];

  return (
    <div className="relative h-full w-full bg-slate-50 flex flex-col">
      {/* Video Grid */}
      <div className="flex-1 p-6 flex items-center justify-center">
        <div
          className="grid gap-4 w-full h-full max-w-5xl"
          style={{ gridTemplateColumns: allStreams.length === 1 ? '1fr' : `repeat(${allStreams.length <= 2 ? allStreams.length : 2}, 1fr)` }}
        >
          {allStreams.map((stream, i) => {
            const isYou = stream === "you";
            const isFullscreen = fullscreenIndex === i;
            return (
              <div
                key={i}
                className={`relative aspect-video bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex items-center justify-center group ${isFullscreen ? "fixed inset-10 z-50 bg-white" : ""}`}
              >
                <video
                  autoPlay playsInline muted={isYou}
                  ref={(el) => {
                    if (isYou && el) el.srcObject = screenOn ? screenStream : localStream;
                    if (!isYou && el) el.srcObject = stream as MediaStream;
                  }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-4 bg-white/80 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-slate-700 border border-slate-100 uppercase tracking-wider">
                  {isYou ? "You" : `Participant ${i}`}
                </div>
                <button
                  onClick={() => setFullscreenIndex(isFullscreen ? null : i)}
                  className="absolute top-3 right-4 p-2 bg-white/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Picture-in-Picture Camera when Screen Sharing */}
      {screenOn && localStream && (
        <div className="absolute bottom-24 right-6 w-48 aspect-video bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xl z-30 group animate-in fade-in slide-in-from-right-4 transition-all hover:scale-105">
           <video
            autoPlay playsInline muted
            ref={(el) => { if (el) el.srcObject = localStream; }}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-white/80 backdrop-blur px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-700 border border-slate-100 uppercase">
            Camera
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="h-20 border-t bg-white flex items-center justify-center gap-4 shrink-0">
        <Button onClick={toggleMic} variant={micOn ? "secondary" : "destructive"} className="rounded-full w-12 h-12 p-0">
          {micOn ? <FiMic className="w-5 h-5" /> : <FiMicOff className="w-5 h-5" />}
        </Button>
        <Button onClick={toggleCamera} variant={cameraOn ? "secondary" : "destructive"} className="rounded-full w-12 h-12 p-0">
          {cameraOn ? <FiVideo className="w-5 h-5" /> : <FiVideoOff className="w-5 h-5" />}
        </Button>
        <Button onClick={toggleScreen} variant={screenOn ? "default" : "secondary"} className="rounded-full w-12 h-12 p-0">
          <FiMonitor className="w-5 h-5" />
        </Button>
        <div className="w-px h-8 bg-slate-200 mx-2" />
        <Button onClick={endCall} variant="destructive" className="rounded-full w-12 h-12 p-0">
          <FiPhoneOff className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
