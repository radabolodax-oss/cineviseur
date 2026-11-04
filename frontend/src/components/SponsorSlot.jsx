import { useMemo } from "react";
import { Link } from "react-router-dom";
import { pickSponsor } from "../lib/sponsors";
import Icon from "./Icon";

/**
 * Encart sponsorisé direct, sur le modèle des publicités texte de Freebuff :
 * un libellé « Sponsorisé », la marque, une accroche et un lien.
 * Aucun script tiers, aucun cookie : rien à consentir, rien à bloquer.
 */
export default function SponsorSlot({ placement = "home", className = "" }) {
  const sponsor = useMemo(() => pickSponsor(placement), [placement]);
  if (!sponsor) return null;

  const content = (
    <>
      <span
        className={`shrink-0 grid place-items-center w-10 h-10 rounded-xl border bg-gradient-to-br ${sponsor.accent} ${sponsor.ring} ${sponsor.text}`}
      >
        <Icon name={sponsor.icon} className="w-[18px] h-[18px]" />
      </span>

      <span className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-white/35">
          Sponsorisé
          <span aria-hidden="true">·</span>
          <span className="normal-case tracking-normal text-[11px] text-white/55">{sponsor.name}</span>
        </span>
        <span className="mt-0.5 block truncate font-display text-sm font-semibold text-white">
          {sponsor.headline}
        </span>
        <span className="mt-0.5 block truncate text-xs text-white/55">{sponsor.description}</span>
      </span>

      <span className="shrink-0 hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/75 group-hover:border-white/20 group-hover:bg-white/[0.08] group-hover:text-white transition-colors">
        {sponsor.cta}
        <Icon name="arrowRight" className="w-3 h-3" />
      </span>
    </>
  );

  const shell = `group flex w-full items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 hover:border-white/20 hover:bg-white/[0.055] transition-colors`;

  if (sponsor.internal) {
    return (
      <aside className={`w-full my-6 ${className}`} aria-label="Emplacement sponsorisé">
        <Link to={sponsor.url} className={shell}>
          {content}
        </Link>
      </aside>
    );
  }

  return (
    <aside className={`w-full my-6 ${className}`} aria-label="Emplacement sponsorisé">
      <a
        href={sponsor.url}
        target="_blank"
        rel="sponsored noopener noreferrer nofollow"
        className={shell}
      >
        {content}
      </a>
    </aside>
  );
}
