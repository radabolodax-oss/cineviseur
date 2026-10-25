import { useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import NotificationBell from "./NotificationBell";
import Icon from "./Icon";
import { SPRING } from "../lib/motionTokens";
import { AFFILIATE } from "../lib/site";

const CLAP = "[transform-origin:88px_182px] -rotate-[14deg] group-hover:rotate-0 transition-transform duration-300 ease-[cubic-bezier(0.3,1.6,0.5,1)] motion-reduce:transition-none motion-reduce:rotate-0";
const PLAY = "origin-center [transform-box:fill-box] transition-transform duration-300 ease-out group-hover:scale-125 motion-reduce:transition-none motion-reduce:transform-none";

function LogoMark() {
  const id = `lg${useId().replace(/:/g, "")}`;
  const paint = `url(#${id})`;
  return (
    <svg viewBox="36 16 440 440" className="w-9 h-9 overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="64" y1="40" x2="448" y2="440">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#7c66dc" />
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
        CINE<span className="bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">VISEUR</span>
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
        `relative text-sm px-4 py-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-soft ${
          isActive ? "text-white font-semibold" : "text-white/65 hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="nav-pill"
              transition={SPRING}
              className="absolute inset-0 rounded-full bg-white/[0.08] border border-white/[0.1] shadow-sm"
            />
          )}
          <span className="relative z-10">{children}</span>
        </>
      )}
    </NavLink>
  );
}

function MobileTabBar() {
  const tabs = [
    { to: "/", label: "Accueil", icon: "home", end: true },
    { to: "/discover", label: "Découvrir", icon: "compass" },
    { to: "/search", label: "Recherche", icon: "search" },
    { to: "/watchlist", label: "Ma liste", icon: "list" },
    { to: "/cinemas", label: "Cinémas", icon: "pin" },
  ];
  return (
    <nav aria-label="Navigation principale" className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/[0.06] bg-[#0c0b12]/92 backdrop-blur-2xl pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
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
                  <motion.span layoutId="tab-indicator" transition={SPRING} className="absolute top-0 h-0.5 w-8 rounded-full bg-cine-soft shadow-[0_0_12px_#ab98f2]" />
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
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [atTop, setAtTop] = useState(true);
  const searchInputRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setAtTop(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
        className={`sticky top-0 z-40 transition-all duration-500 ${
          transparent
            ? "bg-transparent border-b border-transparent"
            : "bg-[#0c0b12]/85 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
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
            <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-1 ml-3">
              <DesktopLink to="/discover">Découvrir</DesktopLink>
              <DesktopLink to="/ce-soir">Ce soir ?</DesktopLink>
              <DesktopLink to="/cinemas">Cinémas</DesktopLink>
              <DesktopLink to="/watchlist" data-ticket-target>Ma liste</DesktopLink>
            </nav>
          </div>

          <div className="flex-1 max-w-md hidden sm:block">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("cv:open-command-menu"))}
              className="group flex items-center justify-between gap-2.5 bg-white/[0.035] border border-transparent hover:border-white/[0.15] hover:bg-white/[0.06] rounded-full px-4 py-2 transition shadow-sm w-full text-left"
            >
              <div className="flex items-center gap-2.5 text-white/50 group-hover:text-white/80 min-w-0">
                <Icon name="search" className="w-4 h-4 text-white/45 group-hover:text-cine-soft transition-colors shrink-0" />
                <span className="text-sm truncate">Recherche rapide, films, cinémas...</span>
              </div>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-white/[0.06] border border-transparent text-white/45 select-none shrink-0">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href={AFFILIATE.kofiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/50 transition-all shadow-[0_2px_10px_-2px_rgba(245,158,11,0.25)] hover:shadow-[0_4px_16px_-2px_rgba(245,158,11,0.4)] active:scale-95 group"
              title="Offrir un café au créateur (projet indépendant & gratuit)"
            >
              <span className="text-sm transition-transform duration-300 group-hover:scale-125">☕</span>
              <span className="hidden sm:inline">Offrir un café</span>
            </a>
            <NotificationBell />
          </div>
        </div>
      </header>
      <MobileTabBar />
    </>
  );
}
