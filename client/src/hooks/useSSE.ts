import { useEffect } from "react";

export function useSSE(url: string, onMessage: (data: unknown) => void) {
  useEffect(() => {
    const source = new EventSource(url);
    source.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data));
      } catch {
        onMessage(event.data);
      }
    };
    return () => source.close();
  }, [url, onMessage]);
}
