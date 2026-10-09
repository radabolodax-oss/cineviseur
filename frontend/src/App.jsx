import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { MotionConfig } from "motion/react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CookieConsent from "./components/CookieConsent";
import CinemaLayer from "./components/CinemaLayer";
import { ScrollProgress } from "./components/effects";
import { AuroraBackground } from "./components/backgrounds";
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

function App() {
  const location = useLocation();
  useCinematicNavigation();

  const page = (el) => <Page>{el}</Page>;
  const member = (el) => page(<ProtectedRoute>{el}</ProtectedRoute>);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-[100dvh] flex flex-col">
        <AuroraBackground />
        <ScrollProgress />
        <Navbar />
        <main id="contenu" tabIndex={-1} className="flex-1 outline-none">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={page(<Home />)} />
            <Route path="/login" element={page(<Login />)} />
            <Route path="/register" element={page(<Register />)} />
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
        <Suspense fallback={null}>
          <QuickPreview />
        </Suspense>
        <CookieConsent />
      </div>
    </MotionConfig>
  );
}

export default App;
