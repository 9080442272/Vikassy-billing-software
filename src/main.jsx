import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

// Read Convex URL from environment variables, fallback to testing dev server URL
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || "https://grateful-ostrich-760.convex.cloud";
const convex = new ConvexReactClient(CONVEX_URL);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ERP App ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '40px auto', backgroundColor: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#DC2626', margin: '0 0 12px 0', fontSize: '20px' }}>⚠️ Application Exception Caught</h2>
          <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6' }}>The accounting application encountered a temporary runtime state error.</p>
          <pre style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', color: '#0F172A', border: '1px solid #E2E8F0' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ marginTop: '16px', padding: '10px 20px', backgroundColor: '#6E56CF', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            🔄 Reset & Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
