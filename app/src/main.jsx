import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'

import { BrowserRouter } from 'react-router-dom';

// Apply UI Scale preference before React renders
const savedScale = localStorage.getItem('icd_ui_scale');
if (savedScale) {
  document.documentElement.style.fontSize = savedScale;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
