import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import DeliveryPage from './views/DeliveryPage.jsx'

// Check if this is a license delivery request
// URL format: ?deliver=XXXX-XXXX or ?deliver=XXXXXXXX
const urlParams = new URLSearchParams(window.location.search)
const deliverToken = urlParams.get('deliver')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {deliverToken ? <DeliveryPage token={deliverToken} /> : <App />}
  </StrictMode>,
)
