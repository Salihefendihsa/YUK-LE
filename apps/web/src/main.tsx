import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/globals.css'
import './styles/panel-ui.css'
import './styles/overlays.css'
import { ToastViewport } from './components/common/Toast'
import { ConfirmViewport } from './components/common/ConfirmModal'
import AppRouter from './router/index'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <>
      <ToastViewport />
      <ConfirmViewport />
      <AppRouter />
    </>
  </StrictMode>,
)
