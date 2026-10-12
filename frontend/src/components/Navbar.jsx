import { useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import useDismiss from "../hooks/useDismiss";
import NotificationBell from "./NotificationBell";
import Icon from "./Icon";
import { Popover } from "./motion";
import { SPRING } from "../lib/motionTokens";

const CLAP = "[transform-origin:88px_182px] -rotate-[14deg] group-hover:rotate-0 transition-transform duration-300 ease-[cubic-bezier(0.3,1.6,0.5,1)] motion-reduce:transition-none motion-reduce:rotate-0";
const PLAY = "origin-center [transform-box:fill-box] transition-transform duration-300 ease-out group-hover:scale-125 motion-reduce:transition-none motion-reduce:transform-none";

function LogoMark() {
  const id = `lg${useId().replace(/:/g, "")}`;
  const paint = `url(#${id})`;
  return (
    <svg viewBox="36 16 440 440" className="w-9 h-9 overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="64" y1="40" x2="448" y2="440">
          <stop offset="0" stopColor="#22c55e" />
          <stop offset="1" stopColor="#7c5ce0" />
        </linearGradient>
      </defs>
      <g fill="none" stroke={paint} strokeWidth="30" strokeLinejoin="round" strokeLinecap="round">
        <rect x="88" y="226" width="336" height="200" rx="30" />
        <g className={CLAP}>
          <rect x="88" y="120" width="336" height="62" rx="18" />
          <g strokeWidth="18" strokeLinecap="butt">
            <path d="M174 166l26-30" />
            <path d="M262 166l26-30" />
            <path d="M350 166l26-30" />
          </g>
        </g>
      </g>
      <path className={PLAY} d="M228 284v84l72-42z" fill={paint} stroke={paint} strokeWidth="14" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-soft">
      <LogoMark />
      <span className="font-display font-semibold text-lg tracking-tight">
        CINE<span className="bg-gradient-to-r from-cine-green to-cine-violet bg-clip-text text-transparent">VISEUR</span>
      </span>
    </Link>
  );
}

function DesktopLink({ to, children, ...rest }) {
  return (
    <NavLink
      to={to}
      {...rest}
      className={({ isActive }) =>
        `relative text-sm px-3.5 py-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-soft ${
          isActive ? "text-white" : "text-white/60 hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span layoutId="nav-pill" transition={SPRING} className="absolute inset-0 rounded-full bg-white/[0.09] ring-1 ring-inset ring-white/10" />
          )}
          <span className="relative">{children}</span>
        </>
      )}
    </NavLink>
  );
}

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useDismiss(ref, open, () => setOpen(false));

  const initial = (user.name || "?").trim()[0]?.toUpperCase();
  const item = "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/75 hover:bg-white/[0.06] hover:text-white transition";

  return (
    <div className="relative" ref={ref}>
      <motion.button
        
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu du compte"
        aria-expanded={open}
        className="flex items-center justify-center w-9 h-9 rounded-[12px] bg-cine-violet text-sm font-semibold text-white ring-1 ring-inset ring-white/20 hover:brightness-110 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-soft"
      >
        {initial}
      </motion.button>
      <Popover open={open} className="absolute right-0 mt-2 w-60 panel p-1.5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7)] z-50">
        <div className="px-3 py-2.5 mb-1">
          <p className="text-sm font-semibold truncate">{user.name}</p>
          <p className="text-xs text-white/50 truncate">{user.email}</p>
        </div>
        <Link to="/profile" onClick={() => setOpen(false)} className={item}>
          <Icon name="user" /> Profil
        </Link>
        <button onClick={() => { setOpen(false); onLogout(); }} className={`${item} w-full`}>
          <Icon name="logout" /> Déconnexion
        </button>
      </Popover>
    </div>
  );
}

function MobileTabBar({ user }) {
  const tabs = [
    { to: "/", label: "Accueil", icon: "home", end: true },
    { to: "/discover", label: "Découvrir", icon: "compass" },
    { to: "/search", label: "Recherche", icon: "search" },
    user
      ? { to: "/watchlist", label: "Ma liste", icon: "list" }
      : { to: "/cinemas", label: "Cinémas", icon: "pin" },
    { to: user ? "/profile" : "/login", label: user ? "Profil" : "Connexion", icon: "user" },
  ];
  return (
    <nav aria-label="Navigation principale" className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/[0.08] bg-cine-ink/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            data-ticket-target={t.to === "/watchlist" ? "" : undefined}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                isActive ? "text-white" : "text-white/50"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span layoutId="tab-indicator" transition={SPRING} className="absolute top-0 h-0.5 w-8 rounded-full bg-cine-soft" />
                )}
                <motion.span animate={{ y: isActive ? -1 : 0, scale: isActive ? 1.08 : 1 }} transition={SPRING}>
                  <Icon name={t.icon} className={`w-5 h-5 ${isActive ? "text-cine-soft" : ""}`} weight={isActive ? "fill" : "regular"} />
                </motion.span>
                {t.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [atTop, setAtTop] = useState(true);
  const sentinelRef = useRef(null);

  // Détecte le haut de page sans écouteur de scroll : une sentinelle de 8px en haut du document.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setAtTop(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  const isHome = location.pathname === "/";
  const transparent = atTop && isHome;

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="absolute top-0 left-0 h-2 w-px pointer-events-none" />
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 btn-light !py-2">
        Aller au contenu
      </a>
      <header
        className={`sticky top-0 z-40 transition-colors duration-500 border-b ${
          transparent ? "bg-transparent border-transparent" : "bg-cine-ink/80 backdrop-blur-xl border-white/[0.07]"
        }`}
      >
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 md:px-10 h-16">
          <div className="flex items-center gap-3 shrink-0">
            {!isHome && (
              <button onClick={() => navigate(-1)} aria-label="Retour" title="Retour" className="btn-icon hidden sm:flex">
                <Icon name="back" />
              </button>
            )}
            <Logo />
            <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-1 ml-4">
              <DesktopLink to="/discover">Découvrir</DesktopLink>
              <DesktopLink to="/ce-soir">Ce soir ?</DesktopLink>
              <DesktopLink to="/cinemas">Cinémas</DesktopLink>
              {user && <DesktopLink to="/watchlist" data-ticket-target>Ma liste</DesktopLink>}
            </nav>
          </div>

          <form onSubmit={handleSearch} role="search" className="flex-1 max-w-md hidden sm:block">
            <label className="flex items-center gap-2.5 bg-white/[0.06] ring-1 ring-inset ring-white/10 focus-within:ring-2 focus-within:ring-cine-soft/70 focus-within:bg-white/[0.09] rounded-full px-4 py-2 transition">
              <Icon name="search" className="w-4 h-4 text-white/50" />
              <span className="sr-only">Rechercher</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un film, une série..."
                className="bg-transparent outline-none text-sm w-full placeholder:text-white/55"
              />
            </label>
          </form>

          {/* Sur mobile, la barre d'onglets du bas porte déjà Connexion et Profil. */}
          <div className="flex items-center gap-2.5 shrink-0">
            {user ? (
              <>
                <NotificationBell />
                <div className="hidden sm:block">
                  <UserMenu user={user} onLogout={() => { logout(); navigate("/"); }} />
                </div>
              </>
            ) : (
              <Link to="/login" className="btn-ghost !px-5 !py-2 hidden sm:inline-flex">
                Connexion
              </Link>
            )}
          </div>
        </div>
      </header>
      <MobileTabBar user={user} />
    </>
  );
}
