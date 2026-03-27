import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const useSocket = (onConnect) => {
  const socketRef = useRef(null);
  const onConnectRef = useRef(onConnect);
  onConnectRef.current = onConnect;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Wait for actual connection before emitting join events
    socket.on('connect', () => {
      if (onConnectRef.current) onConnectRef.current(socket);
    });

    // If already connected (reconnect case), call immediately
    if (socket.connected && onConnectRef.current) {
      onConnectRef.current(socket);
    }

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  return socketRef;
};

export default useSocket;
