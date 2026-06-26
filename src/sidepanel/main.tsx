import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '../devtools/panel/App'
import { PageBridgeProvider } from '../shared/page-bridge/PageBridgeProvider'
import '../styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PageBridgeProvider mode="sidepanel">
      <App />
    </PageBridgeProvider>
  </StrictMode>,
)
