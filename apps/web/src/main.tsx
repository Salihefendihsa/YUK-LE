import '@fontsource/plus-jakarta-sans/latin-300.css'
import '@fontsource/plus-jakarta-sans/latin-400.css'
import '@fontsource/plus-jakarta-sans/latin-500.css'
import '@fontsource/plus-jakarta-sans/latin-600.css'
import '@fontsource/plus-jakarta-sans/latin-700.css'
import '@fontsource/plus-jakarta-sans/latin-800.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-500.css'
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
