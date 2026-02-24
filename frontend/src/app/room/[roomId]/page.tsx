'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket';
import { getTurnCredentials, getCurrentUser } from '@/lib/api';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [remoteUsername, setRemoteUsername] = useState<string>('');
  const [isWaiting, setIsWaiting] = useState(true);
  const [user, setUser] = useState<any>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteSocketIdRef = useRef<string>('');

  useEffect(() => {
    initializeRoom();

    return () => {
      cleanup();
    };
  }, [roomId]);

  const initializeRoom = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      connectSocket();
      const socket = getSocket();

      socket.emit('join:room', { roomId });

      socket.on('room:joined', (data: { roomId: string; participants: any[] }) => {
        console.log('Joined room:', data);

        if (data.participants.length > 0) {
          const participant = data.participants[0];
          remoteSocketIdRef.current = participant.socketId;
          setRemoteUsername(participant.username);
          setIsWaiting(false);
          createOffer(participant.socketId);
        }
      });

      socket.on('user:joined', async (data: { socketId: string; username: string }) => {
        console.log('User joined:', data);
        remoteSocketIdRef.current = data.socketId;
        setRemoteUsername(data.username);
        setIsWaiting(false);
      });

      socket.on('signal:offer', async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
        console.log('Received offer from:', data.from);
        await handleOffer(data.from, data.offer);
      });

      socket.on('signal:answer', async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
        console.log('Received answer from:', data.from);
        await handleAnswer(data.answer);
      });

      socket.on('signal:ice-candidate', async (data: { from: string; candidate: RTCIceCandidateInit }) => {
        console.log('Received ICE candidate');
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      });

      socket.on('user:left', () => {
        console.log('User left');
        setRemoteStream(null);
        setIsWaiting(true);
        remoteSocketIdRef.current = '';
        setRemoteUsername('');
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }
      });

      socket.on('room:kicked', () => {
        alert('You have been in the room alone for too long and have been removed.');
        router.push('/');
      });

      socket.on('room:terminated', () => {
        alert('This room has been terminated by an administrator.');
        router.push('/');
      });

    } catch (error) {
      console.error('Failed to initialize room:', error);
      alert('Failed to access camera/microphone');
      router.push('/');
    }
  };

  const createPeerConnection = async (remoteSocketId: string) => {
    const config = await getTurnCredentials();
    const pc = new RTCPeerConnection(config);

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    pc.ontrack = (event) => {
      console.log('Received remote track');
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = getSocket();
        socket.emit('signal:ice-candidate', {
          roomId,
          to: remoteSocketId,
          candidate: event.candidate
        });
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const createOffer = async (remoteSocketId: string) => {
    const pc = await createPeerConnection(remoteSocketId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const socket = getSocket();
    socket.emit('signal:offer', {
      roomId,
      to: remoteSocketId,
      offer
    });
  };

  const handleOffer = async (from: string, offer: RTCSessionDescriptionInit) => {
    const pc = await createPeerConnection(from);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    const socket = getSocket();
    socket.emit('signal:answer', {
      roomId,
      to: from,
      answer
    });
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const copyRoomLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    alert('Room link copied to clipboard!');
  };

  const leaveRoom = () => {
    cleanup();
    router.push('/');
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    disconnectSocket();
  };

  return (
    <div className="video-container">
      {remoteStream ? (
        <>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="video-main"
          />
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="video-small"
          />
        </>
      ) : (
        <>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="video-main"
          />
          {isWaiting && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              background: 'rgba(0,0,0,0.8)',
              padding: '40px',
              borderRadius: '16px'
            }}>
              <p style={{ color: 'white', fontSize: '24px', marginBottom: '24px' }}>
                Waiting for someone to join...
              </p>
              <button
                className="btn-primary"
                onClick={copyRoomLink}
              >
                Copy Room Link
              </button>
            </div>
          )}
        </>
      )}

      {remoteUsername && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '24px',
          fontSize: '16px',
          fontWeight: '600'
        }}>
          {remoteUsername}
        </div>
      )}

      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '24px',
        fontSize: '14px'
      }}>
        {user?.username || 'Guest'}
      </div>

      <div className="video-controls">
        <button
          className={`control-btn ${!isCameraOn ? 'active' : ''}`}
          onClick={toggleCamera}
          title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isCameraOn ? '📹' : '📹❌'}
        </button>

        <button
          className={`control-btn ${!isMicOn ? 'active' : ''}`}
          onClick={toggleMic}
          title={isMicOn ? 'Mute' : 'Unmute'}
        >
          {isMicOn ? '🎤' : '🎤❌'}
        </button>

        {isWaiting && (
          <button
            className="control-btn"
            onClick={copyRoomLink}
            title="Copy room link"
          >
            🔗
          </button>
        )}

        <button
          className="control-btn"
          onClick={leaveRoom}
          title="Leave room"
          style={{ background: '#ef4444' }}
        >
          📞
        </button>
      </div>
    </div>
  );
}
