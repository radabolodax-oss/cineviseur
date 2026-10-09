import { AnimatePresence, motion } from "motion/react";
import Icon from "./Icon";
import { SPRING } from "../lib/motionTokens";

export default function Toast({ message }) {
  return (
    <div role="status" aria-live="polite" className="fixed bottom-24 sm:bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95, transition: { duration: 0.15 } }}
            transition={SPRING}
            className="flex items-center gap-2 bg-[#f4f4f6] text-cine-ink text-sm font-semibold pl-3 pr-5 py-3 rounded-full shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)]"
          >
            <span className="w-5 h-5 rounded-full bg-cine-violet text-white grid place-items-center">
              <Icon name="check" className="w-3 h-3" weight="bold" />
            </span>
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
