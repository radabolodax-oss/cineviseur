import { AFFILIATE } from "../lib/site";
import Icon from "./Icon";

export default function SupportCard() {
  const kofiUrl = AFFILIATE.kofiUrl || "https://ko-fi.com/cineviseur";

  return (
    <article className="p-6 sm:p-7 rounded-3xl bg-[#161423]/90 border border-white/[0.07] shadow-[0_12px_36px_rgba(0,0,0,0.35)] mt-8" aria-label="Soutenir CineViseur">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-medium mb-3">
            <span>☕ Projet Indépendant</span>
            <span>•</span>
            <span>Don Libre</span>
          </div>

          <h3 className="font-display font-semibold text-lg sm:text-xl text-white">
            Vous aimez CineViseur ? Soutenez le projet !
          </h3>

          <p className="mt-1.5 text-xs sm:text-sm text-white/65 leading-relaxed">
            CineViseur est conçu avec passion par un développeur indépendant : zéro revente de vos données, fonctionnement local-first respectueux de votre vie privée. Si l'application vous rend service, vous pouvez m'offrir un café pour aider à payer les serveurs !
          </p>
        </div>

        <div className="shrink-0">
          <a
            href={kofiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-105 text-[#0c0b12] font-bold text-sm shadow-[0_6px_20px_-4px_rgba(245,158,11,0.4)] active:scale-[0.98] transition-all"
          >
            <span>Offrir un café</span>
            <span>☕</span>
          </a>
        </div>
      </div>
    </article>
  );
}
