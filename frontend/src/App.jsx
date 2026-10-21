import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { MotionConfig } from "motion/react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CookieConsent from "./components/CookieConsent";
import CinemaLayer from "./components/CinemaLayer";
import UpdatePrompt from "./components/UpdatePrompt";
import { InstallProvider } from "./components/InstallGuide";
import { ScrollProgress } from "./components/effects";
import { AuroraBackground } from "./components/backgrounds";
import CinemaAtmosphere from "./components/CinemaAtmosphere";
import CommandMenu from "./components/CommandMenu";
import ProvidersModal from "./components/ProvidersModal";
import ImportModal from "./components/ImportModal";
import ProtectedRoute from "./components/ProtectedRoute";
import useCinematicNavigation from "./hooks/useCinematicNavigation";
import Home from "./pages/Home";

// L'accueil est dans le bundle principal ; les autres pages se chargent à la demande.
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Discover = lazy(() => import("./pages/Discover"));
const Search = lazy(() => import("./pages/Search"));
const Watchlist = lazy(() => import("./pages/Watchlist"));
const Profile = lazy(() => import("./pages/Profile"));
const MediaDetail = lazy(() => import("./pages/MediaDetail"));
const Person = lazy(() => import("./pages/Person"));
const Roulette = lazy(() => import("./pages/Roulette"));
const Swipe = lazy(() => import("./pages/Swipe"));
const Recap = lazy(() => import("./pages/Recap"));
const Cinemas = lazy(() => import("./pages/Cinemas"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const LegalNotice = lazy(() => import("./pages/LegalNotice"));
const QuickPreview = lazy(() => import("./components/QuickPreview"));

function Page({ children }) {
  return (
    // flow-root : les marges négatives des pages (hero sous la barre de navigation) ne déplacent pas ce bloc,
    // et l'attente occupe tout l'écran pour que le pied de page ne saute pas au chargement (CLS).
    // page-in : apparition de secours pour les navigateurs sans View Transitions.
    <div className="flow-root page-in">
      <Suspense fallback={<div data-suspense-fallback className="min-h-[100dvh]" />}>{children}</Suspense>
    </div>
  );
}

/** Tactile Button global — inspiré d'Originkit Tactile Keycap Button.
 *  Délégation d'événements sur document : capte tous les boutons présents et à venir.
 *  La touche descend en 50 ms, remonte avec un ressort à dépassement.
 */
function useTactileButtons() {
  useEffect(() => {
    const SELECTOR = ".btn-primary, .btn-ghost, .btn-light, .btn-danger, .btn-chip, .btn-icon";

    function nearest(el) {
      return el?.closest?.(SELECTOR) ?? null;
    }

    function press(btn) {
      if (!btn || btn.disabled) return;
      btn.classList.remove("tk-spring");
      btn.classList.add("tk-pressed");
    }

    function release(btn) {
      if (!btn) return;
      if (!btn.classList.contains("tk-pressed")) return;
      btn.classList.remove("tk-pressed");
      btn.classList.add("tk-spring");
    }

    function onDown(e) { press(nearest(e.target)); }
    function onUp(e)   { release(nearest(e.target)); }
    function onLeave(e) {
      // Libère si le pointeur sort du bouton pendant un appui
      const btn = nearest(e.target);
      if (btn && !btn.contains(e.relatedTarget)) release(btn);
    }
    function onAnimEnd(e) {
      const btn = nearest(e.target);
      if (btn) btn.classList.remove("tk-spring");
    }

    document.addEventListener("pointerdown", onDown);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
    document.addEventListener("pointerout", onLeave);
    document.addEventListener("animationend", onAnimEnd);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      document.removeEventListener("pointerout", onLeave);
      document.removeEventListener("animationend", onAnimEnd);
    };
  }, []);
}

function App() {
  const location = useLocation();
  useCinematicNavigation();
  useTactileButtons();

  const page = (el) => <Page>{el}</Page>;
  const member = (el) => page(<ProtectedRoute>{el}</ProtectedRoute>);

  return (
    <MotionConfig reducedMotion="user">
      <InstallProvider>
        <div className="min-h-[100dvh] flex flex-col">
          <AuroraBackground />
          <CinemaAtmosphere />
          <ScrollProgress />
          <Navbar />
          <main id="contenu" tabIndex={-1} className="flex-1 outline-none">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={page(<Home />)} />
              <Route path="/login" element={<Navigate to="/watchlist" replace />} />
              <Route path="/register" element={<Navigate to="/watchlist" replace />} />
              <Route path="/discover" element={page(<Discover />)} />
              <Route path="/search" element={page(<Search />)} />
              <Route path="/title/:mediaType/:id" element={page(<MediaDetail />)} />
              <Route path="/person/:id" element={page(<Person />)} />
              <Route path="/ce-soir" element={page(<Roulette />)} />
              <Route path="/swipe" element={member(<Swipe />)} />
              <Route path="/recap" element={member(<Recap />)} />
              <Route path="/cinemas" element={page(<Cinemas />)} />
              <Route path="/watchlist" element={member(<Watchlist />)} />
              <Route path="/profile" element={member(<Profile />)} />
              <Route path="/confidentialite" element={page(<Privacy />)} />
              <Route path="/cgu" element={page(<Terms />)} />
              <Route path="/mentions-legales" element={page(<LegalNotice />)} />
              <Route path="*" element={page(<NotFound />)} />
            </Routes>
          </main>
          <Footer />
          <CinemaLayer />
          <UpdatePrompt />
          <CommandMenu />
          <ProvidersModal />
          <ImportModal />
          <Suspense fallback={null}>
            <QuickPreview />
          </Suspense>
          <CookieConsent />
        </div>
      </InstallProvider>
    </MotionConfig>
  );
}

export default App;
