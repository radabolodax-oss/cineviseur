import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { getTrending, tmdbImage, tmdbSrcSet } from "../lib/tmdb";
import { EASE_OUT, riseItem, stagger } from "../lib/motionTokens";

export default function AuthShell({ title, intro, children, footer }) {
  const [backdrop, setBackdrop] = useState(null);

  useEffect(() => {
    getTrending()
      .then((items) => {
        const pick = items.find((r) => r.backdrop_path);
        if (pick) setBackdrop(pick.backdrop_path);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pt-10 md:pt-16 pb-16 grid lg:grid-cols-[minmax(0,460px)_1fr] gap-12 lg:gap-20 items-start">
      <motion.div initial="hidden" animate="show" variants={stagger(0.08)}>
        <motion.h1 variants={riseItem} className="font-display font-semibold text-4xl md:text-5xl tracking-tighter mb-3">
          {title}
        </motion.h1>
        <motion.p variants={riseItem} className="text-white/60 mb-10 max-w-[40ch]">
          {intro}
        </motion.p>
        <motion.div variants={riseItem}>{children}</motion.div>
        <motion.p variants={riseItem} className="text-white/55 text-sm mt-8">
          {footer}
        </motion.p>
      </motion.div>

      <motion.div
        className="hidden lg:block relative aspect-[4/5] max-h-[640px] rounded-2xl overflow-hidden ring-1 ring-inset ring-white/[0.08]"
        aria-hidden="true"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: EASE_OUT, delay: 0.1 }}
      >
        {backdrop ? (
          <motion.img
            src={tmdbImage(backdrop, "backdrop")} srcSet={tmdbSrcSet(backdrop, "backdrop")} sizes="40vw" decoding="async"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-70"
            initial={{ scale: 1.15, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.7 }}
            transition={{ duration: 2.4, ease: EASE_OUT }}
          />
        ) : (
          <div className="absolute inset-0 skeleton" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-cine-ink/90 via-cine-ink/20 to-transparent" />
      </motion.div>
    </div>
  );
}
