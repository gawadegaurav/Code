import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Maximize,
  Minimize,
} from "lucide-react";
import { Socket } from "socket.io-client";

interface VideoConferenceProps {
  roomId: string;
  socket?: Socket;
}

export function VideoConference({ roomId, socket }: VideoConferenceProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  // -------------------- SETUP --------------------
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
      if (signal.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.content));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-signal", { roomId, signal: { type: "answer", content: answer } });
      } else if (signal.type === "answer") {
        if (!pc.currentRemoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.content));
        }
      } else if (signal.type === "ice") {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.content));
        } catch (e) { }
      }
    });

    return () => {
      pc.close();
      socket.off("webrtc-signal");
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [roomId, socket]);

  // -------------------- MEDIA --------------------
  const startMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    stream.getTracks().forEach((track) => pcRef.current?.addTrack(track, stream));

    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    const offer = await pcRef.current!.createOffer();
    await pcRef.current!.setLocalDescription(offer);

    if (socket) {
      socket.emit("webrtc-signal", { roomId, signal: { type: "offer", content: offer } });
    }

    setCameraOn(true);
    setMicOn(true);
  };

  // -------------------- CONTROLS --------------------
  const toggleCamera = async () => {
    if (!localStreamRef.current) { await startMedia(); return; }
    localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !cameraOn));
    setCameraOn(!cameraOn);
  };

  const toggleMic = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !micOn));
    setMicOn(!micOn);
  };

  const toggleScreen = async () => {
    if (screenOn) {
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      pcRef.current?.getSenders().forEach((sender) => {
        if (sender.track?.kind === "video" && camTrack) sender.replaceTrack(camTrack);
      });
      setScreenOn(false);
      return;
    }

    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = screenStream.getVideoTracks()[0];

    pcRef.current?.getSenders().forEach((sender) => {
      if (sender.track?.kind === "video") sender.replaceTrack(screenTrack);
    });

    screenTrack.onended = () => toggleScreen();
    setScreenOn(true);
  };

  const endCall = () => {
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    window.location.reload();
  };

  // -------------------- UI --------------------
  const allStreams: ("you" | MediaStream)[] = ["you", ...remoteStreams];

  return (
    <div className="relative h-full w-full bg-[#020617] text-slate-200 overflow-hidden rounded-3xl border border-white/5">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.05),transparent_70%)]" />
      </div>

      {/* VIDEO GRID */}
      <div className="flex items-center justify-center w-full h-full p-8 md:p-12">
        <div
          className={`grid gap-6 w-full h-full place-items-center max-w-6xl mx-auto`}
          style={{
            gridTemplateColumns: allStreams.length === 1 ? '1fr' : `repeat(${allStreams.length <= 2 ? allStreams.length : 2}, 1fr)`,
            gridRowGap: '1.5rem',
          }}
        >
          {allStreams.map((stream, i) => {
            const isYou = stream === "you";
            const isFullscreen = fullscreenIndex === i;
            return (
              <div
                key={i}
                className={`relative aspect-video w-full bg-slate-900 rounded-[2.5rem] border-2 border-white/5 overflow-hidden shadow-2xl transition-all duration-500 hover:border-indigo-500/30 group ${isFullscreen ? "fixed inset-8 z-50 w-auto h-auto" : ""
                  }`}
              >
                <video
                  autoPlay
                  playsInline
                  muted={isYou}
                  ref={(el) => {
                    if (isYou && el) el.srcObject = localStreamRef.current!;
                    if (!isYou && el) el.srcObject = stream as MediaStream;
                  }}
                  className={`w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700`}
                />

                {/* Overlay Details */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="absolute bottom-4 left-6 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    {isYou ? "YOU (NODE_0)" : `REMOTE_PEER_${i}`}
                  </span>
                </div>

                <button
                  className="absolute top-4 right-6 text-white bg-black/40 backdrop-blur-md rounded-2xl p-3 border border-white/10 opacity-0 group-hover:opacity-100 hover:bg-indigo-600 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullscreenIndex(isFullscreen ? null : i);
                  }}
                >
                  {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONTROLS */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex justify-center z-50 w-full px-6">
        <div className="flex items-center gap-6 bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] px-10 py-4 shadow-2xl shadow-black/50">
          <Button
            size="lg"
            variant="ghost"
            onClick={toggleMic}
            className={`rounded-full w-14 h-14 border transition-all duration-300 ${micOn ? "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10" : "bg-red-600/20 text-red-500 border-red-500/30 hover:bg-red-600/30"}`}
          >
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>

          <Button
            size="lg"
            variant="ghost"
            onClick={toggleCamera}
            className={`rounded-full w-14 h-14 border transition-all duration-300 ${cameraOn ? "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10" : "bg-red-600/20 text-red-500 border-red-500/30 hover:bg-red-600/30"}`}
          >
            {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>

          <Button
            size="lg"
            variant="ghost"
            onClick={toggleScreen}
            className={`rounded-full w-14 h-14 border transition-all duration-300 ${screenOn ? "bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-600/20" : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"}`}
          >
            {screenOn ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </Button>

          <div className="w-px h-8 bg-white/10 mx-2" />

          <Button
            size="lg"
            onClick={endCall}
            className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700 text-white border border-red-500 shadow-xl shadow-red-600/20 active:scale-90 transition-all"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
