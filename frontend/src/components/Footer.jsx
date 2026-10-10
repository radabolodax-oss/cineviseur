import { Link } from "react-router-dom";
import { analyticsEnabled } from "../lib/site";
import { useAuth } from "../context/AuthContext";
import { Logo } from "./Navbar";
import { useInstall } from "./InstallGuide";
import Icon from "./Icon";

// py-1.5 : zone tactile d'au moins 24 px de haut (WCAG 2.5.8).
const LINK = "inline-block py-1.5 text-white/60 hover:text-white transition-colors";
const HEADING = "text-xs font-semibold uppercase tracking-wider text-white/40 mb-2";

function Column({ title, children }) {
  return (
    <nav aria-label={title}>
      <h2 className={HEADING}>{title}</h2>
      <ul className="flex flex-col text-sm">{children}</ul>
    </nav>
  );
}

const Item = ({ to, children }) => (
  <li>
    <Link to={to} className={LINK}>{children}</Link>
  </li>
);

export default function Footer() {
  const { openGuide, installed } = useInstall();
  const { user } = useAuth();

  return (
    <footer className="border-t border-white/[0.07] mt-16">
      <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 md:px-10 pt-12 pb-28 sm:pb-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-white/55">
              Films, séries, notes et coups de cœur. CineViseur garde la mémoire de vos écrans.
            </p>
            {!installed && (
              <button onClick={openGuide} className="btn-ghost mt-5 !py-2.5 !text-sm">
                <Icon name="mobile" className="w-4 h-4" />
                Installer l'application
              </button>
            )}
          </div>

          <Column title="Explorer">
            <Item to="/discover">Découvrir</Item>
            <Item to="/ce-soir">Ce soir, je regarde quoi ?</Item>
            <Item to="/cinemas">Cinémas</Item>
            <Item to="/search">Rechercher</Item>
          </Column>

          <Column title="Mon espace">
            {user ? (
              <>
                <Item to="/watchlist">Ma liste</Item>
                <Item to="/swipe">Trier en swipant</Item>
                <Item to="/recap">Mon année ciné</Item>
                <Item to="/profile">Profil</Item>
              </>
            ) : (
              <>
                <Item to="/login">Se connecter</Item>
                <Item to="/register">Créer un compte</Item>
              </>
            )}
          </Column>

          <Column title="Informations">
            <Item to="/confidentialite">Confidentialité</Item>
            <Item to="/cgu">Conditions d'utilisation</Item>
            <Item to="/mentions-legales">Mentions légales</Item>
            {analyticsEnabled && (
              <li>
                <button onClick={() => window.dispatchEvent(new Event("cv:open-consent"))} className={LINK}>
                  Gérer les cookies
                </button>
              </li>
            )}
          </Column>
        </div>

        <div className="mt-12 pt-6 border-t border-white/[0.07] flex flex-col-reverse gap-3 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CineViseur</p>
          <p className="max-w-[62ch]">
            Données films et séries fournies par TMDB. Ce produit utilise l'API TMDB sans être approuvé par TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}
