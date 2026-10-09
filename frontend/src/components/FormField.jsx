import { AnimatePresence, motion } from "motion/react";

/** Champ avec label au-dessus, aide optionnelle et message d'erreur sous le champ. */
export default function FormField({ id, label, error, help, ...inputProps }) {
  const describedBy = [help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="label">{label}</label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`input ${error ? "!ring-rose-400/70" : ""}`}
        {...inputProps}
      />
      {help && !error && <p id={`${id}-help`} className="text-xs text-white/55">{help}</p>}
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-error`}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-rose-300"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
