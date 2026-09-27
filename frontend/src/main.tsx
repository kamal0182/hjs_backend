import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'
import { RememberSection } from './components/layout/RememberSection.tsx'
import { readSavedSection } from './lib/sectionMemory.ts'

// Navigation lives in memory, not in the address bar: the URL always stays "/"
// while switching sections. Clean up any path typed or bookmarked before.
if (window.location.pathname !== '/') {
  window.history.replaceState(null, '', '/')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MemoryRouter initialEntries={[readSavedSection()]}>
      <RememberSection />
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  </StrictMode>,
)
