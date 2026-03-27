import { createContext, useContext, useRef, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { drivers } from '../api/services';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const GpsContext = createContext(null);

export const GpsProvider = ({ children }) => {
  const [sharing, setSharing] = useState(false);
  const [position, setPosition] = useState(null);
  const [myVan, setMyVan] = useState(null);
  const [error, setError] = useState(null);
  const watchRef = useRef(null);
  const socketRef = useRef(null);

  // Keep socket alive as long as provider is mounted (entire app lifetime)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;
    return () => {
      stopSharing();
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  // Load van info once
  useEffect(() => {
    drivers.myVan()
      .then((r) => setMyVan(r.data))
      .catch(() => {});
  }, []);

  const startSharing = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported.'); return; }
    if (!myVan) { setError('No van assigned. Ask admin to create a schedule.'); return; }

    setSharing(true);
    setError(null);

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, speed, heading } = pos.coords;
        const kmh = speed ? parseFloat((speed * 3.6).toFixed(1)) : null;
        setPosition({ lat, lng, speed: kmh || 0, heading });

        socketRef.current?.emit('driver:location', {
          van_id: myVan.van_id,
          lat, lng,
          speed: kmh,
          heading,
        });
      },
      (err) => { setError(`GPS error: ${err.message}`); setSharing(false); },
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 10000 }
    );
  };

  const stopSharing = () => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setSharing(false);
    setPosition(null);
  };

  return (
    <GpsContext.Provider value={{ sharing, position, myVan, error, startSharing, stopSharing }}>
      {children}
    </GpsContext.Provider>
  );
};

export const useGps = () => useContext(GpsContext);
