import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './components/App.tsx'
import '../css/main.css'
import { TransmitProvider } from './providers/TransmitProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TransmitProvider>
      <App />
    </TransmitProvider>
  </StrictMode>
)
