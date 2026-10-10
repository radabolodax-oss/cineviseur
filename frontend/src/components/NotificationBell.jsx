import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { tmdbImage } from "../lib/tmdb";
import useDismiss from "../hooks/useDismiss";
import Icon from "./Icon";
import { Popover } from "./motion";
import { SPRING } from "../lib/motionTokens";

const POLL_MS = 5 * 60 * 1000;

export default function NotificationBell() {
  const { user, token } = useAuth();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useDismiss(ref, open, () => setOpen(false));

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    let cancelled = false;
    function refresh() {
      api
        .dueAlerts(token)
        .then((data) => { if (!cancelled) setItems(data); })
        .catch(() => {});
    }
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user, token]);

  if (!user) return null;

  async function handleDismiss(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await api.dismissAlert(id, token);
    } catch {
      // no-op: next poll will re-sync
    }
  }

  const count = items.length;

  return (
    <div className="relative" ref={ref}>
      <motion.button
        
        onClick={() => setOpen((o) => !o)}
        aria-label={count ? `Notifications, ${count} nouvelle${count > 1 ? "s" : ""} sortie${count > 1 ? "s" : ""}` : "Notifications"}
        aria-expanded={open}
        className="btn-icon relative"
      >
        {/* La cloche sonne quand une nouvelle sortie arrive. */}
        <motion.span
          key={count}
          animate={count ? { rotate: [0, -18, 14, -8, 4, 0] } : {}}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          style={{ transformOrigin: "50% 10%" }}
        >
          <Icon name="bell" />
        </motion.span>
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={SPRING}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-cine-violet text-white text-[10px] font-bold tabular-nums ring-2 ring-cine-ink"
            >
              {count}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <Popover open={open} className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto panel p-1.5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7)] z-50">
        <p className="px-3 pt-2 pb-2 text-sm font-semibold">Sorties</p>
        {count === 0 && <p className="px-3 pb-3 text-sm text-white/55">Aucune nouvelle sortie pour l'instant.</p>}
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
              className="flex items-center gap-3 rounded-xl hover:bg-white/[0.05] transition-colors"
            >
              <Link
                to={`/title/${item.media_type}/${item.media_id}`}
                onClick={() => setOpen(false)}
                className="flex flex-1 min-w-0 items-center gap-3 px-3 py-2.5"
              >
                {item.poster_path ? (
                  <img src={tmdbImage(item.poster_path, "thumb")} alt="" className="w-10 h-14 rounded-lg object-cover shrink-0" />
                ) : (
                  <span className="w-10 h-14 rounded-lg bg-white/10 shrink-0" />
                )}
                <span className="min-w-0">
                  <span className="block text-sm font-semibold truncate">{item.title}</span>
                  <span className="block text-xs text-white/55">Disponible maintenant</span>
                </span>
              </Link>
              <button
                onClick={() => handleDismiss(item.id)}
                className="btn-icon !w-8 !h-8 !bg-transparent !ring-0 mr-2 shrink-0"
                aria-label={`Ignorer ${item.title}`}
              >
                <Icon name="x" className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </Popover>
    </div>
  );
}
