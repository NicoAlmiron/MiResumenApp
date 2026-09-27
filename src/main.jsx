import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './theme.scss' // Bootstrap compilado con nuestra paleta (ver theme.scss)
import 'bootstrap-icons/font/bootstrap-icons.css' // íconos (bi-*) ya usados en gran parte de la app
import '@fortawesome/fontawesome-free/css/all.min.css' // íconos (fa-*) para lo nuevo/rediseñado de acá en más
import 'react-datepicker/dist/react-datepicker.css' // calendario del filtro de fechas (Ventas)
import './index.css'  // reset mínimo propio — acá se re-skinea el calendario para el tema oscuro
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
