import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

// Read Convex URL from environment variables, fallback to testing dev server URL
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || "https://grateful-ostrich-760.convex.cloud";
const convex = new ConvexReactClient(CONVEX_URL);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </React.StrictMode>
);
