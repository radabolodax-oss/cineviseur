import { Link } from "react-router-dom";
import { analyticsEnabled } from "../lib/site";

export default function Footer() {
  // py-1.5 : zone tactile d'au moins 24 px de haut (WCAG 2.5.8).
  const link = "inline-block py-1.5 hover:text-white transition-colors";
  return (
    <footer className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 md:px-10 pt-10 pb-28 sm:pb-10 border-t border-white/[0.07] flex flex-col gap-6 text-xs text-white/55">
      <nav aria-label="Informations légales" className="flex flex-wrap gap-x-6 gap-y-1">
        <Link to="/confidentialite" className={link}>Confidentialité</Link>
        <Link to="/cgu" className={link}>Conditions d'utilisation</Link>
        <Link to="/mentions-legales" className={link}>Mentions légales</Link>
        {analyticsEnabled && (
          <button onClick={() => window.dispatchEvent(new Event("cv:open-consent"))} className={link}>
            Gérer les cookies
          </button>
        )}
      </nav>
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <p>© {new Date().getFullYear()} CineViseur</p>
        <p className="max-w-[60ch]">
          Données films et séries fournies par TMDB. Ce produit utilise l'API TMDB sans être approuvé par TMDB.
        </p>
      </div>
    </footer>
  );
}
