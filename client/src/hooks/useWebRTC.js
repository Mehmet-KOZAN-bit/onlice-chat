import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

const SOCKET_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`;

export function useWebRTC() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [status, setStatus] = useState('Idle'); // Idle, Searching, Connected
  const [messages, setMessages] = useState([]);

  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const roomIdRef = useRef(null);
  const iceCandidateQueue = useRef([]); // Fix: Queue for ICE race condition

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => setLocalStream(stream))
        .catch((err) => console.error("Media access denied:", err));
    } else {
      console.error("Camera API not available. This requires HTTPS or localhost.");
    }

    socketRef.current.on('receive-message', (data) => {
      setMessages((prev) => [...prev, { sender: 'partner', text: data.text, timestamp: data.timestamp }]);
    });

    socketRef.current.on('partner-disconnected', () => {
      setStatus('Searching');
      cleanupPeerConnection(); // Keep local stream, kill remote
      setMessages((prev) => [...prev, { type: 'system', text: 'Partner disconnected. Searching...' }]);
      socketRef.current.emit('start-matching');
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (localStream) localStream.getTracks().forEach(t => t.stop());
    };
  }, []); // Run once on mount

  const createPeerConnection = useCallback((roomId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;
    iceCandidateQueue.current = []; // Reset queue for new connection

    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', { roomId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    return pc;
  }, [localStream]);

  // Bind WebRTC events separately so they depend on createPeerConnection (which updates when localStream is ready)
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleMatched = async ({ roomId, initiator }) => {
      roomIdRef.current = roomId;
      setStatus('Connected');
      setMessages([{ type: 'system', text: 'You are now chatting with a random stranger. Say hi!' }]);

      const pc = createPeerConnection(roomId);

      if (initiator) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', { roomId, offer });
        } catch (error) {
          console.error('Error creating offer:', error);
        }
      }
    };

    const processIceQueue = async () => {
      while (iceCandidateQueue.current.length > 0) {
        const candidate = iceCandidateQueue.current.shift();
        try {
          await peerConnectionRef.current.addIceCandidate(candidate);
        } catch (err) {
          console.error('Error processing queued ICE candidate:', err);
        }
      }
    };

    const handleOffer = async ({ offer }) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        await processIceQueue(); // Add caught candidates
        
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit('answer', { roomId: roomIdRef.current, answer });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    };

    const handleAnswer = async ({ answer }) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        await processIceQueue(); // Add caught candidates
      } catch (error) {
        console.error('Error setting remote description:', error);
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (!peerConnectionRef.current) return;
      try {
        const iceCandidate = new RTCIceCandidate(candidate);
        // If remote description is already set, add immediately. Otherwise, queue it!
        if (peerConnectionRef.current.remoteDescription && peerConnectionRef.current.remoteDescription.type) {
          await peerConnectionRef.current.addIceCandidate(iceCandidate);
        } else {
          iceCandidateQueue.current.push(iceCandidate);
        }
      } catch (error) {
        console.error('Error adding ice candidate:', error);
      }
    };

    socket.on('matched', handleMatched);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    return () => {
      socket.off('matched', handleMatched);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
    };
  }, [createPeerConnection]);

  const cleanupPeerConnection = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    iceCandidateQueue.current = [];
    setRemoteStream(null);
  };

  const startMatch = () => {
    setStatus('Searching');
    setMessages([]);
    socketRef.current.emit('start-matching');
  };

  const stopMatch = () => {
    if (roomIdRef.current) {
      socketRef.current.emit('leave-room', roomIdRef.current);
    }
    cleanupPeerConnection();
    setStatus('Idle');
    setMessages([]);
    roomIdRef.current = null;
  };

  const nextMatch = () => {
    stopMatch();
    startMatch();
  };

  const sendMessage = (text) => {
    if (!text.trim() || !roomIdRef.current) return;
    socketRef.current.emit('send-message', { roomId: roomIdRef.current, text });
    setMessages((prev) => [...prev, { sender: 'you', text, timestamp: Date.now() }]);
  };

  return { localStream, remoteStream, status, messages, startMatch, stopMatch, nextMatch, sendMessage };
}
