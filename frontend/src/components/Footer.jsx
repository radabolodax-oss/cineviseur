import { Link } from "react-router-dom";
import { SITE } from "../lib/site";
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
  const { handleInstall, installed } = useInstall();

  return (
    <footer className="border-t border-white/[0.07] mt-16 bg-cine-ink/60 backdrop-blur-sm">
      <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 md:px-10 pt-12 pb-28 sm:pb-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-white/55">
              Films, séries, notes et coups de cœur. CineViseur garde la mémoire de vos écrans.
            </p>
            <a
              href={`mailto:${SITE.contactEmail}`}
              className="inline-flex items-center gap-1.5 mt-3 text-xs text-white/50 hover:text-cine-emerald transition-colors"
            >
              <span>✉</span> {SITE.contactEmail}
            </a>
            {!installed && (
              <div className="mt-5">
                <button onClick={handleInstall} className="btn-ghost !py-2.5 !text-sm">
                  <Icon name="download" className="w-4 h-4" />
                  Installer l'application
                </button>
              </div>
            )}
          </div>

          <Column title="Explorer">
            <Item to="/discover">Découvrir le catalogue</Item>
            <Item to="/ce-soir">Roulette & Suggestions</Item>
            <Item to="/swipe">Soirée Duo & Swipe</Item>
            <Item to="/cinemas">Salles de cinémas</Item>
            <Item to="/search">Recherche & Filtres</Item>
          </Column>

          <Column title="Mon espace">
            <Item to="/watchlist">Ma liste de visionnage</Item>
            <Item to="/recap">Mon année ciné & Journal</Item>
            <Item to="/profile">Réglages, export & données</Item>
          </Column>

          <Column title="Légal & Vie privée">
            <Item to="/confidentialite">Politique de confidentialité</Item>
            <Item to="/cgu">Conditions d'utilisation (CGU)</Item>
            <Item to="/mentions-legales">Mentions légales</Item>
            <li>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("cv:open-consent"))}
                className={`${LINK} text-left cursor-pointer hover:text-cine-emerald`}
              >
                Gérer les cookies & traceurs
              </button>
            </li>
          </Column>
        </div>

        <div className="mt-12 pt-6 border-t border-white/[0.07] flex flex-col-reverse gap-3 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CineViseur — Tous droits réservés</p>
          <p className="max-w-[62ch]">
            Données et visuels fournis par TMDB. Ce produit utilise l'API TMDB sans être approuvé ni certifié par TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}
