import { motion } from "motion/react";
import CinemaFinder from "../components/CinemaFinder";
import { riseItem, stagger } from "../lib/motionTokens";
import useSeo from "../hooks/useSeo";

export default function Cinemas() {
  useSeo("Cinémas à proximité", "Les cinémas autour de toi, leurs formats (Dolby Cinema, IMAX, 4DX, 3D...), leur programme et l'itinéraire.");

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pt-12 pb-16">
      <motion.div initial="hidden" animate="show" variants={stagger(0.08)} className="mb-10 max-w-2xl">
        <motion.h1 variants={riseItem} className="font-display font-semibold text-4xl md:text-5xl tracking-tighter mb-3">
          Cinémas à proximité
        </motion.h1>
        <motion.p variants={riseItem} className="text-white/60">
          Les salles dans un rayon de 20 km, leurs formats (Dolby Cinema, IMAX, 4DX, 3D...) et leur programme.
        </motion.p>
      </motion.div>
      <CinemaFinder />
    </div>
  );
}
