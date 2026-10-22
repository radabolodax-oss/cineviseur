import { useState } from "react";
import Icon from "./Icon";

export default function NewsletterCard() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    try {
      localStorage.setItem("cv_newsletter_email", email.trim());
    } catch {
      // ignore
    }
    setSubscribed(true);
  };

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 my-16" aria-label="Lettre d'information cinéphile">
      <div className="rounded-3xl p-6 sm:p-8 md:p-10 bg-gradient-to-br from-[#181528]/95 via-[#151221]/95 to-[#12101b]/95 border border-white/[0.07] shadow-[0_16px_40px_rgba(0,0,0,0.35)] relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-medium mb-3">
            <span>📮 Chaque vendredi</span>
            <span>•</span>
            <span>Sans spam</span>
          </div>

          <h3 className="font-display font-semibold text-2xl sm:text-3xl text-white tracking-tight">
            Les Pépites du Week-End
          </h3>

          <p className="mt-2 text-xs sm:text-sm text-white/65 leading-relaxed">
            Ne passez plus 45 minutes à chercher quoi regarder le vendredi soir. Recevez notre sélection de 3 sorties en salle incontournables et 2 pépites secrètes en streaming.
          </p>

          {subscribed ? (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-semibold">
              <Icon name="check" className="w-4 h-4 text-emerald-400" />
              <span>C'est tout bon ! Vous recevrez la prochaine édition vendredi.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row items-stretch gap-3 max-w-md">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
                className="input !rounded-2xl !py-3 text-sm flex-1"
                aria-label="Adresse email"
              />
              <button
                type="submit"
                className="btn-primary !px-6 !py-3 text-sm whitespace-nowrap"
              >
                <span>Recevoir la sélection</span>
                <span>→</span>
              </button>
            </form>
          )}

          <p className="mt-3 text-[11px] text-white/40">
            Désinscription en 1 clic à tout moment. Vos données restent strictement confidentielles.
          </p>
        </div>
      </div>
    </section>
  );
}
