import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./const.ts";
import App from "./components/App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./hooks/useAuth";
import { TransmitProvider } from "./providers/TransmitProvider";

// Install SSE connection debugger
const installSSEDebugger = () => {
  const originalEventSource = window.EventSource;
  let connectionCount = 0;
  const activeConnections = new Map<number, any>();
  
  // Override EventSource constructor to track connections
  (window as any).EventSource = class extends originalEventSource {
    private connectionId: number;
    private startTime: number;
    
    constructor(url: string | URL, eventSourceInitDict?: EventSourceInit) {
      const id = ++connectionCount;
      const urlStr = url.toString();
      console.log(`[SSE Debug] Creating connection #${id} to:`, urlStr);
      
      super(url, eventSourceInitDict);
      
      this.connectionId = id;
      this.startTime = Date.now();
      
      activeConnections.set(id, {
        id,
        url: urlStr,
        startTime: this.startTime,
        readyState: this.readyState,
        instance: this
      });
      
      // Track connection lifecycle
      this.addEventListener('open', () => {
        const elapsed = Date.now() - this.startTime;
        console.log(`[SSE Debug] ✅ Connection #${id} opened after ${elapsed}ms`);
        const conn = activeConnections.get(id);
        if (conn) conn.readyState = this.readyState;
      });
      
      this.addEventListener('error', (event) => {
        const elapsed = Date.now() - this.startTime;
        console.error(`[SSE Debug] ❌ Connection #${id} error after ${elapsed}ms:`, event);
        const conn = activeConnections.get(id);
        if (conn) conn.readyState = this.readyState;
      });
      
      // Override close method
      const originalClose = this.close.bind(this);
      this.close = () => {
        console.log(`[SSE Debug] 🔚 Connection #${id} closing`);
        activeConnections.delete(id);
        originalClose();
      };
    }
  };
  
  // Expose debug info globally
  (window as any).__sseDebug = {
    getConnections: () => {
      console.group('[SSE Debug] Active Connections');
      console.log(`Total active: ${activeConnections.size}`);
      activeConnections.forEach((conn) => {
        const elapsed = Date.now() - conn.startTime;
        console.log(`#${conn.id}: ${conn.url}`, {
          readyState: conn.readyState,
          readyStateText: ['CONNECTING', 'OPEN', 'CLOSED'][conn.readyState],
          elapsedTime: `${elapsed}ms`,
          instance: conn.instance
        });
      });
      console.groupEnd();
      return activeConnections;
    },
    clearAll: () => {
      activeConnections.forEach((conn) => {
        if (conn.instance && conn.instance.close) {
          conn.instance.close();
        }
      });
      activeConnections.clear();
      console.log('[SSE Debug] All connections cleared');
    }
  };
  
  console.log('[SSE Debug] Monitoring installed. Use window.__sseDebug.getConnections() to inspect.');
};

// Install debugger before app starts
installSSEDebugger();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>
  </BrowserRouter>
);
