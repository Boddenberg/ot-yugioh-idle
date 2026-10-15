import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './tela/App'
import './tela/estilo.css'

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
