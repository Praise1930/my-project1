import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Stylesheet load order matters: tokens and reset, then the component layer
// every screen is written against, then the shared overlay chrome, then the
// viewport corrections last so they can override the layers above.
// base.css, overlays.css and viewport.css existed but were never imported,
// which is why buttons, inputs and cards rendered with browser defaults.
import './index.css'
import './styles/base.css'
import './styles/overlays.css'
import './styles/viewport.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
