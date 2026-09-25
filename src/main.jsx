import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme.scss' // Bootstrap compilado con nuestra paleta (ver theme.scss)
import 'bootstrap-icons/font/bootstrap-icons.css' // íconos (bi-*) para botones y tarjetas
import './index.css'  // reset mínimo propio
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
