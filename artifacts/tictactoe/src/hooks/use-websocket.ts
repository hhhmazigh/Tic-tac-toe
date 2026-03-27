import { useEffect, useRef, useState, useCallback } from 'react';

export function useWebSocket(url: string | null) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const handlers = useRef<Map<string, (data: any) => void>>(new Map());

  useEffect(() => {
    if (!url) return;

    console.log('[WS] Connecting to:', url);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected');
      setConnected(true);
      setError(null);
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected');
      setConnected(false);
    };

    ws.onerror = () => {
      setError('WebSocket connection failed');
    };

    ws.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        const handler = handlers.current.get(type);
        if (handler) handler(data);
      } catch (err) {
        console.error('[WS] Failed to parse message', err);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [url]);

  const emit = useCallback((type: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  const on = useCallback((type: string, handler: (data: any) => void) => {
    handlers.current.set(type, handler);
  }, []);

  const off = useCallback((type: string) => {
    handlers.current.delete(type);
  }, []);

  return { connected, error, emit, on, off };
}
