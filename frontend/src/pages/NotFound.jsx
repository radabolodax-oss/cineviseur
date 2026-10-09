import { Link } from "react-router-dom";
import { motion } from "motion/react";
import Icon from "../components/Icon";
import { BackgroundPaths } from "../components/backgrounds";
import { KineticTitle } from "../components/motion";
import { EASE_OUT } from "../lib/motionTokens";
import useSeo from "../hooks/useSeo";

export default function NotFound() {
  useSeo("Page introuvable");
  return (
    <div className="relative overflow-hidden">
      <BackgroundPaths className="opacity-60" />
    <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pt-24 pb-24">
      <div className="max-w-xl">
        <motion.span
          className="inline-block mb-8"
          initial={{ opacity: 0, y: -30, rotate: -20 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
        >
          <Icon name="popcorn" className="w-12 h-12 text-cine-soft" weight="light" />
        </motion.span>
        <KineticTitle
          text="Cette scène a été coupée au montage"
          delay={0.1}
          className="font-display font-semibold text-4xl md:text-6xl tracking-tight leading-[1.05] mb-5"
        />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6, ease: EASE_OUT }}>
          <p className="text-white/60 text-lg mb-10 max-w-[48ch]">La page demandée n'existe pas ou a changé d'adresse.</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/" className="btn-primary">
              Retour à l'accueil
            </Link>
            <Link to="/discover" className="link text-sm font-medium">
              Parcourir le catalogue
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
    </div>
  );
}
