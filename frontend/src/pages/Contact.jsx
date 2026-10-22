import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { SITE } from "../lib/site";
import { riseItem, stagger, SPRING } from "../lib/motionTokens";
import useSeo from "../hooks/useSeo";
import Icon from "../components/Icon";

function generateMathChallenge() {
  const a = Math.floor(Math.random() * 8) + 2; // 2 to 9
  const b = Math.floor(Math.random() * 7) + 1; // 1 to 7
  return { a, b, answer: a + b };
}

export default function Contact() {
  useSeo("Contact", "Contacter l'équipe de CineViseur : suggestions, signalement de bugs et partenariats.");

  // Form inputs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("suggestion");
  const [message, setMessage] = useState("");

  // Anti-Spam state & refs
  const [honeypotWebsite, setHoneypotWebsite] = useState("");
  const [honeypotPhone, setHoneypotPhone] = useState("");
  const [userMathAnswer, setUserMathAnswer] = useState("");
  const [challenge, setChallenge] = useState(generateMathChallenge);
  const mountTimeRef = useRef(Date.now());

  // UI status
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Check anti-flood cooldown
  useEffect(() => {
    const checkCooldown = () => {
      try {
        const lastSent = Number(localStorage.getItem("cv_last_contact_ts") || 0);
        const elapsed = Math.floor((Date.now() - lastSent) / 1000);
        if (elapsed < 60) {
          setCooldown(60 - elapsed);
        } else {
          setCooldown(0);
        }
      } catch {
        setCooldown(0);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleResetChallenge = () => {
    setChallenge(generateMathChallenge());
    setUserMathAnswer("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // 1. Double Honeypot check (Bots fill hidden fields)
    if (honeypotWebsite.trim() !== "" || honeypotPhone.trim() !== "") {
      console.warn("Spam bot trapped by honeypot.");
      // Pretend to succeed to waste the bot's time
      setStatus("submitting");
      setTimeout(() => setStatus("success"), 800);
      return;
    }

    // 2. Anti-speed check (Human submission takes >= 3.5 seconds)
    const timeElapsed = Date.now() - mountTimeRef.current;
    if (timeElapsed < 3500) {
      setErrorMessage("Saisie trop rapide. Prenez le temps de relire votre message avant de valider.");
      return;
    }

    // 3. Cooldown flood check
    if (cooldown > 0) {
      setErrorMessage(`Protection anti-flood active. Veuillez patienter encore ${cooldown}s.`);
      return;
    }

    // 4. Basic validations
    if (!name.trim()) {
      setErrorMessage("Veuillez renseigner votre nom ou pseudonyme.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage("Veuillez renseigner une adresse email valide.");
      return;
    }
    if (message.trim().length < 15) {
      setErrorMessage("Votre message est trop court (au moins 15 caractères requis).");
      return;
    }

    // 5. Anti-spam keyword heuristic (common spam words)
    const spamWords = ["casino", "viagra", "crypto bonus", "telegram @", "whatsapp +", "seo ranking", "backlink service"];
    const lowerMessage = message.toLowerCase();
    if (spamWords.some((word) => lowerMessage.includes(word))) {
      setErrorMessage("Votre message contient des termes identifiés comme indésirables.");
      return;
    }

    // 6. Interactive Math Challenge verification
    if (parseInt(userMathAnswer.trim(), 10) !== challenge.answer) {
      setErrorMessage("Le résultat du test anti-robot est incorrect. Un nouveau calcul a été généré.");
      handleResetChallenge();
      return;
    }

    // Proceed to submit
    setStatus("submitting");

    const categoryLabels = {
      suggestion: "Suggestion / Idée de fonctionnalité",
      bug: "Signalement de bug / Problème technique",
      partenariat: "Demande de partenariat / Publicité",
      autre: "Autre demande",
    };

    const payload = {
      name: name.trim(),
      email: email.trim(),
      subject: `[CineViseur] ${categoryLabels[category] || category} - De ${name.trim()}`,
      message: message.trim(),
      honeypot_website: honeypotWebsite,
      honeypot_phone: honeypotPhone,
      math_answer: parseInt(userMathAnswer.trim(), 10),
      math_expected: challenge.answer,
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resData.detail || `Erreur serveur (${response.status})`);
      }

      // Record timestamp to enforce anti-flood
      try {
        localStorage.setItem("cv_last_contact_ts", Date.now().toString());
      } catch {
        // ignore
      }

      setStatus("success");
    } catch (err) {
      console.error("Erreur envoi contact:", err);
      setStatus("error");
      setErrorMessage(err.message || "Impossible d'envoyer le message pour l'instant. Veuillez réessayer plus tard.");
    }
  };

  const mailtoFallbackUrl = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(
    `[CineViseur] Contact - ${name || "Visiteur"}`
  )}&body=${encodeURIComponent(message)}`;

  return (
    <motion.article
      className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pt-12 pb-24"
      initial="hidden"
      animate="show"
      variants={stagger(0.06)}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div variants={riseItem} className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cine-emerald/10 text-cine-emerald border border-cine-emerald/20 mb-4">
            <span>✉️</span> Assistance & Échanges
          </span>
          <h1 className="font-display font-semibold text-3xl sm:text-4xl md:text-5xl tracking-tight text-white mb-4">
            Nous contacter
          </h1>
          <p className="text-sm sm:text-base text-white/65 max-w-lg mx-auto leading-relaxed">
            Une suggestion pour améliorer l'application, un bug à signaler ou une demande de partenariat ?
            Envoyez-nous un message.
          </p>
        </motion.div>

        {/* Success Card */}
        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={SPRING}
              className="panel p-8 sm:p-10 text-center border-cine-emerald/30 shadow-[0_20px_50px_rgba(16,185,129,0.15)] bg-cine-ink/80 backdrop-blur-md"
            >
              <div className="w-16 h-16 rounded-full bg-cine-emerald/15 border border-cine-emerald/30 text-cine-emerald flex items-center justify-center mx-auto mb-5 text-2xl">
                ✓
              </div>
              <h2 className="font-display font-semibold text-2xl text-white mb-2">Message bien reçu !</h2>
              <p className="text-sm text-white/70 max-w-md mx-auto leading-relaxed mb-6">
                Merci pour votre message. Nous vous répondrons à l'adresse <strong>{email}</strong> dans les plus brefs délais.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatus("idle");
                  setMessage("");
                  handleResetChallenge();
                  mountTimeRef.current = Date.now();
                }}
                className="btn-ghost !py-2.5 !px-6 !text-sm"
              >
                Envoyer un autre message
              </button>
            </motion.div>
          ) : (
            /* Contact Form */
            <motion.form
              key="form"
              variants={riseItem}
              onSubmit={handleSubmit}
              className="panel p-6 sm:p-8 md:p-10 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-cine-ink/85 backdrop-blur-md relative"
              noValidate
            >
              {/* ============================================================== */}
              {/* HONEYPOT TRAPS (Invisible to humans, caught by spam bots)      */}
              {/* ============================================================== */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "-9999px",
                  top: "-9999px",
                  opacity: 0,
                  height: 0,
                  width: 0,
                  pointerEvents: "none",
                }}
              >
                <label htmlFor="_gotcha_website">Ne pas remplir ce champ :</label>
                <input
                  id="_gotcha_website"
                  type="text"
                  name="_gotcha_website"
                  value={honeypotWebsite}
                  onChange={(e) => setHoneypotWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
                <label htmlFor="_confirm_phone">Laisser vide :</label>
                <input
                  id="_confirm_phone"
                  type="tel"
                  name="_confirm_phone"
                  value={honeypotPhone}
                  onChange={(e) => setHoneypotPhone(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              {/* ============================================================== */}

              <div className="space-y-6">
                {/* Nom & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-medium text-white/75 mb-2">
                      Votre nom ou pseudonyme <span className="text-cine-emerald">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Alexis"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/25 focus:border-cine-emerald focus:ring-1 focus:ring-cine-emerald focus:outline-none text-sm transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-medium text-white/75 mb-2">
                      Votre adresse email <span className="text-cine-emerald">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemple@email.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/25 focus:border-cine-emerald focus:ring-1 focus:ring-cine-emerald focus:outline-none text-sm transition-colors"
                    />
                  </div>
                </div>

                {/* Catégorie */}
                <div>
                  <label htmlFor="contact-category" className="block text-xs font-medium text-white/75 mb-2">
                    Objet de la demande
                  </label>
                  <select
                    id="contact-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0e1017] border border-white/10 text-white focus:border-cine-emerald focus:ring-1 focus:ring-cine-emerald focus:outline-none text-sm transition-colors"
                  >
                    <option value="suggestion">💡 Suggestion / Idée de fonctionnalité</option>
                    <option value="bug">🐛 Signaler un bug / Problème technique</option>
                    <option value="partenariat">🤝 Demande de partenariat / Publicité</option>
                    <option value="autre">💬 Autre question</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="contact-message" className="block text-xs font-medium text-white/75">
                      Votre message <span className="text-cine-emerald">*</span>
                    </label>
                    <span className="text-[11px] text-white/40">Min. 15 caractères</span>
                  </div>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Écrivez votre message ici..."
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/25 focus:border-cine-emerald focus:ring-1 focus:ring-cine-emerald focus:outline-none text-sm transition-colors resize-y leading-relaxed"
                  />
                </div>

                {/* ============================================================== */}
                {/* DYNAMIC ANTI-BOT HUMAN CHALLENGE                               */}
                {/* ============================================================== */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cine-emerald/15 border border-cine-emerald/25 text-cine-emerald flex items-center justify-center text-sm font-semibold">
                      🛡️
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">Contrôle anti-robot</p>
                      <p className="text-xs text-white/55">
                        Combien font <strong className="text-white">{challenge.a} + {challenge.b}</strong> ?
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      value={userMathAnswer}
                      onChange={(e) => setUserMathAnswer(e.target.value)}
                      placeholder="Réponse"
                      className="w-24 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-center focus:border-cine-emerald focus:outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleResetChallenge}
                      title="Changer de calcul"
                      className="text-white/40 hover:text-white text-xs px-2 py-1 rounded transition-colors"
                    >
                      ↻
                    </button>
                  </div>
                </div>
                {/* ============================================================== */}

                {/* Error Banner */}
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center justify-between gap-3"
                  >
                    <span>⚠️ {errorMessage}</span>
                    {status === "error" && (
                      <a
                        href={mailtoFallbackUrl}
                        className="underline font-semibold hover:text-white shrink-0"
                      >
                        Envoyer par e-mail direct
                      </a>
                    )}
                  </motion.div>
                )}

                {/* Submit button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-[11px] text-white/45">
                    Vos données sont utilisées uniquement pour vous répondre.
                  </p>

                  <button
                    type="submit"
                    disabled={status === "submitting" || cooldown > 0}
                    className="btn-primary w-full sm:w-auto !py-3 !px-8 !text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === "submitting" ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Envoi en cours...</span>
                      </>
                    ) : cooldown > 0 ? (
                      <span>Patientez ({cooldown}s)</span>
                    ) : (
                      <>
                        <span>Envoyer le message</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Alternative direct mailto */}
        <motion.div variants={riseItem} className="mt-8 text-center text-xs text-white/45 space-y-1">
          <p>
            Vous préférez nous écrire directement depuis votre boîte mail ?
          </p>
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="inline-flex items-center gap-1.5 text-cine-emerald hover:underline font-medium"
          >
            <span>✉</span> {SITE.contactEmail}
          </a>
        </motion.div>
      </div>
    </motion.article>
  );
}
