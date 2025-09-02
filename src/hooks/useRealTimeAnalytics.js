/**
 * Real-time WebSocket hook for analytics data
 * Provides live updates for the Reports & Analytics module
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:8000/api/analytics/ws/realtime';

export const useRealTimeAnalytics = (enabled = true) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (!enabled) return;

    try {
      console.log('🔌 Connecting to WebSocket...');
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setError(null);
        setReconnectCount(0);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const newData = JSON.parse(event.data);
          console.log('📊 Received real-time data:', newData);
          setData(newData);
        } catch (parseError) {
          console.error('❌ Error parsing WebSocket data:', parseError);
          setError('Failed to parse real-time data');
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if it wasn't a manual close
        if (enabled && event.code !== 1000 && reconnectCount < 5) {
          console.log(`🔄 Attempting to reconnect... (${reconnectCount + 1}/5)`);
          setReconnectCount(prev => prev + 1);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, Math.min(1000 * Math.pow(2, reconnectCount), 30000)); // Exponential backoff, max 30s
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('Real-time connection failed');
        setIsConnected(false);
      };

    } catch (connectionError) {
      console.error('❌ Failed to create WebSocket connection:', connectionError);
      setError('Failed to establish real-time connection');
    }
  }, [enabled, reconnectCount]);

  const disconnect = useCallback(() => {
    console.log('🔌 Manually disconnecting WebSocket...');
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    setIsConnected(false);
    setData(null);
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
    }
  }, []);

  // Connect when enabled changes to true
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    isConnected,
    error,
    reconnectCount,
    connect,
    disconnect,
    sendMessage
  };
};

export default useRealTimeAnalytics;
