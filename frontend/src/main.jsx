import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './styles-homepage.css'
import './styles-auth.css'
import './styles-dashboard.css'
import './styles-profile.css'
import './styles-find.css'
import './styles-order.css'
import './styles-settings.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
