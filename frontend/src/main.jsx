import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/outfit'
import '@fontsource/jetbrains-mono/500.css'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

// Détection et purge automatique des anciens caches d'actifs pour garantir la fraîcheur immédiate du build
try {
  const BUILD_HASH = "2026-10-23-r1";
  if (localStorage.getItem("cv_build_rev") !== BUILD_HASH) {
    localStorage.setItem("cv_build_rev", BUILD_HASH);
    if ("caches" in window) {
      caches.keys().then((keys) => {
        keys.forEach((k) => {
          if (!k.includes("affiches-tmdb")) caches.delete(k);
        });
      });
    }
  }
} catch {
  // ignore
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
