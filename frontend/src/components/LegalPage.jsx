import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { SITE } from "../lib/site";
import { riseItem, stagger } from "../lib/motionTokens";
import useSeo from "../hooks/useSeo";

/** Gabarit commun des pages légales : titre, date de mise à jour, sections lisibles. */
export default function LegalPage({ title, description, sections }) {
  useSeo(title, description);
  return (
    <motion.article
      className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pt-12 pb-16"
      initial="hidden"
      animate="show"
      variants={stagger(0.05)}
    >
      <motion.h1 variants={riseItem} className="font-display font-semibold text-4xl md:text-5xl tracking-tighter mb-3">
        {title}
      </motion.h1>
      <motion.p variants={riseItem} className="text-sm text-white/55 mb-12">
        Dernière mise à jour : {SITE.lastLegalUpdate}
      </motion.p>

      <div className="max-w-[70ch] space-y-10">
        {sections.map((section) => (
          <motion.section key={section.title} variants={riseItem}>
            <h2 className="font-display font-semibold text-xl tracking-tight mb-3">{section.title}</h2>
            <div className="space-y-3 text-white/75 leading-relaxed [&_a]:text-cine-soft [&_a]:underline [&_a]:underline-offset-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-white/90">
              {section.body}
            </div>
          </motion.section>
        ))}
      </div>

      <motion.p variants={riseItem} className="mt-14 text-sm text-white/55">
        Voir aussi : <Link to="/confidentialite" className="link">Confidentialité</Link>,{" "}
        <Link to="/cgu" className="link">Conditions d'utilisation</Link>,{" "}
        <Link to="/mentions-legales" className="link">Mentions légales</Link>.
      </motion.p>
    </motion.article>
  );
}
