import { AFFILIATE } from "../lib/site";

export default function VpnCallout() {
  const vpnUrl = AFFILIATE.vpnUrl || "https://nordvpn.com/fr/special-offer/?utm_medium=affiliate&utm_source=cineviseur";

  return (
    <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-[#141220]/90 border border-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0 mt-0.5" role="img" aria-hidden="true">🌍</span>
        <div>
          <p className="font-semibold text-white text-sm">
            Titre indisponible en France sur vos abonnements ?
          </p>
          <p className="mt-0.5 text-white/60 leading-relaxed max-w-xl">
            Certaines œuvres sont déjà accessibles sur les catalogues internationaux (Netflix US, Max, etc.). Un VPN sécurisé permet de débloquer ces catalogues en un instant.
          </p>
        </div>
      </div>

      <div className="shrink-0 self-end sm:self-center">
        <a
          href={vpnUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-medium hover:border-white/20 transition-all text-xs"
        >
          <span>Débloquer les catalogues</span>
          <span>↗</span>
        </a>
      </div>
    </div>
  );
}
